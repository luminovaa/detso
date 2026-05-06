/**
 * Setup Mikrotik PPPoE Server Configuration
 * 
 * Prepares both routers for FreeRADIUS integration:
 * - IP Pool for PPPoE clients
 * - PPPoE Profile with RADIUS attributes
 * - PPPoE Server on ether2
 * - RADIUS client configuration (pointing to future FreeRADIUS)
 * - API service enabled
 */

const { RouterOSAPI } = require('node-routeros');

const ROUTERS = [
  { name: 'Router Pusat', host: 'localhost', port: 8728 },
  { name: 'Router Cabang', host: 'localhost', port: 8730 },
];

const API_USER = 'admin';
const API_PASS = '';

// Configuration
const CONFIG = {
  // IP Pool for PPPoE clients
  pool: {
    name: 'pppoe-pool',
    ranges: '10.10.10.2-10.10.10.254',
  },
  // PPPoE Profile
  profile: {
    name: 'pppoe-profile',
    localAddress: '10.10.10.1',
    remoteAddress: 'pppoe-pool',
    dnsServer: '8.8.8.8,8.8.4.4',
    rateLimit: '10M/10M', // Default rate limit (will be overridden by RADIUS)
  },
  // PPPoE Server
  server: {
    serviceName: 'detso-pppoe',
    interface: 'ether2',
    defaultProfile: 'pppoe-profile',
    authentication: 'pap,chap,mschap1,mschap2',
  },
  // RADIUS configuration (for future FreeRADIUS)
  radius: {
    address: '172.17.0.1', // Docker host IP (FreeRADIUS will run here)
    secret: 'detso-radius-secret',
    authPort: 1812,
    acctPort: 1813,
    timeout: 3000,
  },
  // Local network
  localNetwork: {
    address: '10.10.10.1/24',
    interface: 'ether2',
  },
};

/**
 * Safe write - catches !empty replies and returns empty array
 */
async function safeWrite(conn, command, params = []) {
  try {
    const result = await conn.write(command, params);
    return result || [];
  } catch (error) {
    if (error.message && error.message.includes('!empty')) {
      return [];
    }
    if (error.errno === 'UNKNOWNREPLY') {
      return [];
    }
    throw error;
  }
}

async function configureRouter(routerConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔧 Configuring ${routerConfig.name} (${routerConfig.host}:${routerConfig.port})`);
  console.log('='.repeat(60));

  const conn = new RouterOSAPI({
    host: routerConfig.host,
    user: API_USER,
    password: API_PASS,
    port: routerConfig.port,
    timeout: 15,
  });

  try {
    await conn.connect();
    console.log('✅ Connected\n');

    // ==========================================
    // 1. Set System Identity
    // ==========================================
    console.log('📝 Setting system identity...');
    await conn.write('/system/identity/set', [
      `=name=${routerConfig.name.replace(' ', '-')}`,
    ]);
    console.log(`   ✅ Identity set to: ${routerConfig.name.replace(' ', '-')}`);

    // ==========================================
    // 2. Configure IP Address on ether2
    // ==========================================
    console.log('\n🌐 Configuring IP address on ether2...');
    
    // Check if IP already exists
    const existingIps = await safeWrite(conn, '/ip/address/print', [
      `?interface=${CONFIG.localNetwork.interface}`,
    ]);
    
    if (existingIps.length > 0) {
      console.log('   ℹ️  IP already configured on ether2, removing old...');
      for (const ip of existingIps) {
        await conn.write('/ip/address/remove', [`=.id=${ip['.id']}`]);
      }
    }
    
    await conn.write('/ip/address/add', [
      `=address=${CONFIG.localNetwork.address}`,
      `=interface=${CONFIG.localNetwork.interface}`,
    ]);
    console.log(`   ✅ IP ${CONFIG.localNetwork.address} set on ${CONFIG.localNetwork.interface}`);

    // ==========================================
    // 3. Create IP Pool
    // ==========================================
    console.log('\n🏊 Creating IP Pool...');
    
    // Check if pool exists
    const existingPools = await safeWrite(conn, '/ip/pool/print', [
      `?name=${CONFIG.pool.name}`,
    ]);
    
    if (existingPools.length > 0) {
      console.log('   ℹ️  Pool already exists, updating...');
      await conn.write('/ip/pool/set', [
        `=.id=${existingPools[0]['.id']}`,
        `=ranges=${CONFIG.pool.ranges}`,
      ]);
    } else {
      await conn.write('/ip/pool/add', [
        `=name=${CONFIG.pool.name}`,
        `=ranges=${CONFIG.pool.ranges}`,
      ]);
    }
    console.log(`   ✅ Pool "${CONFIG.pool.name}" created (${CONFIG.pool.ranges})`);

    // ==========================================
    // 4. Create PPPoE Profile
    // ==========================================
    console.log('\n👤 Creating PPPoE Profile...');
    
    // Check if profile exists
    const existingProfiles = await safeWrite(conn, '/ppp/profile/print', [
      `?name=${CONFIG.profile.name}`,
    ]);
    
    if (existingProfiles.length > 0) {
      console.log('   ℹ️  Profile already exists, updating...');
      await conn.write('/ppp/profile/set', [
        `=.id=${existingProfiles[0]['.id']}`,
        `=local-address=${CONFIG.profile.localAddress}`,
        `=remote-address=${CONFIG.profile.remoteAddress}`,
        `=dns-server=${CONFIG.profile.dnsServer}`,
        `=rate-limit=${CONFIG.profile.rateLimit}`,
        `=use-encryption=no`,
      ]);
    } else {
      await conn.write('/ppp/profile/add', [
        `=name=${CONFIG.profile.name}`,
        `=local-address=${CONFIG.profile.localAddress}`,
        `=remote-address=${CONFIG.profile.remoteAddress}`,
        `=dns-server=${CONFIG.profile.dnsServer}`,
        `=rate-limit=${CONFIG.profile.rateLimit}`,
        `=use-encryption=no`,
      ]);
    }
    console.log(`   ✅ Profile "${CONFIG.profile.name}" created`);
    console.log(`      - Local: ${CONFIG.profile.localAddress}`);
    console.log(`      - Remote Pool: ${CONFIG.profile.remoteAddress}`);
    console.log(`      - DNS: ${CONFIG.profile.dnsServer}`);
    console.log(`      - Rate Limit: ${CONFIG.profile.rateLimit}`);

    // ==========================================
    // 5. Create PPPoE Server
    // ==========================================
    console.log('\n📡 Creating PPPoE Server...');
    
    // Check if server exists
    const existingServers = await safeWrite(conn, '/interface/pppoe-server/server/print', [
      `?service-name=${CONFIG.server.serviceName}`,
    ]);
    
    if (existingServers.length > 0) {
      console.log('   ℹ️  PPPoE Server already exists, updating...');
      await conn.write('/interface/pppoe-server/server/set', [
        `=.id=${existingServers[0]['.id']}`,
        `=interface=${CONFIG.server.interface}`,
        `=default-profile=${CONFIG.server.defaultProfile}`,
        `=authentication=${CONFIG.server.authentication}`,
        `=disabled=no`,
      ]);
    } else {
      await conn.write('/interface/pppoe-server/server/add', [
        `=service-name=${CONFIG.server.serviceName}`,
        `=interface=${CONFIG.server.interface}`,
        `=default-profile=${CONFIG.server.defaultProfile}`,
        `=authentication=${CONFIG.server.authentication}`,
        `=disabled=no`,
      ]);
    }
    console.log(`   ✅ PPPoE Server "${CONFIG.server.serviceName}" created on ${CONFIG.server.interface}`);

    // ==========================================
    // 6. Configure RADIUS Client (for future FreeRADIUS)
    // ==========================================
    console.log('\n🔐 Configuring RADIUS client...');
    
    // Check if RADIUS already configured
    const existingRadius = await safeWrite(conn, '/radius/print');
    
    if (existingRadius.length > 0) {
      console.log('   ℹ️  RADIUS already configured, updating...');
      await conn.write('/radius/set', [
        `=.id=${existingRadius[0]['.id']}`,
        `=address=${CONFIG.radius.address}`,
        `=secret=${CONFIG.radius.secret}`,
        `=service=ppp`,
        `=authentication-port=${CONFIG.radius.authPort}`,
        `=accounting-port=${CONFIG.radius.acctPort}`,
        `=timeout=${CONFIG.radius.timeout}`,
        `=disabled=yes`, // Disabled until FreeRADIUS is ready
      ]);
    } else {
      await conn.write('/radius/add', [
        `=address=${CONFIG.radius.address}`,
        `=secret=${CONFIG.radius.secret}`,
        `=service=ppp`,
        `=authentication-port=${CONFIG.radius.authPort}`,
        `=accounting-port=${CONFIG.radius.acctPort}`,
        `=timeout=${CONFIG.radius.timeout}`,
        `=disabled=yes`, // Disabled until FreeRADIUS is ready
      ]);
    }
    console.log(`   ✅ RADIUS client configured (DISABLED - waiting for FreeRADIUS)`);
    console.log(`      - Server: ${CONFIG.radius.address}`);
    console.log(`      - Secret: ${CONFIG.radius.secret}`);
    console.log(`      - Auth Port: ${CONFIG.radius.authPort}`);
    console.log(`      - Acct Port: ${CONFIG.radius.acctPort}`);

    // ==========================================
    // 7. Enable RADIUS for PPP (incoming)
    // ==========================================
    console.log('\n⚙️  Configuring PPP AAA settings...');
    await conn.write('/ppp/aaa/set', [
      `=use-radius=yes`,
      `=accounting=yes`,
      `=interim-update=5m`,
    ]);
    console.log('   ✅ PPP AAA configured (use-radius=yes, accounting=yes, interim=5m)');

    // ==========================================
    // 8. Create test PPPoE user (for testing without RADIUS)
    // ==========================================
    console.log('\n🧪 Creating test PPPoE user...');
    
    const existingSecrets = await safeWrite(conn, '/ppp/secret/print', [
      '?name=test-user',
    ]);
    
    if (existingSecrets.length > 0) {
      console.log('   ℹ️  Test user already exists');
    } else {
      await conn.write('/ppp/secret/add', [
        '=name=test-user',
        '=password=test123',
        `=profile=${CONFIG.profile.name}`,
        '=service=pppoe',
      ]);
      console.log('   ✅ Test user created: test-user / test123');
    }

    // ==========================================
    // 9. Ensure API service is enabled
    // ==========================================
    console.log('\n🔌 Verifying API service...');
    const services = await safeWrite(conn, '/ip/service/print', ['?name=api']);
    if (services.length > 0 && services[0].disabled === 'true') {
      await conn.write('/ip/service/enable', [`=.id=${services[0]['.id']}`]);
      console.log('   ✅ API service enabled');
    } else {
      console.log('   ✅ API service already enabled');
    }

    // ==========================================
    // 10. Print Summary
    // ==========================================
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📋 CONFIGURATION SUMMARY - ${routerConfig.name}`);
    console.log('─'.repeat(60));
    
    // Print IP addresses
    const ips = await safeWrite(conn, '/ip/address/print');
    console.log('\n   IP Addresses:');
    ips.forEach(ip => {
      console.log(`     - ${ip.address} on ${ip.interface}`);
    });

    // Print PPPoE server
    const pppoeServers = await safeWrite(conn, '/interface/pppoe-server/server/print');
    console.log('\n   PPPoE Servers:');
    pppoeServers.forEach(s => {
      console.log(`     - ${s['service-name']} on ${s.interface} (profile: ${s['default-profile']})`);
    });

    // Print pools
    const pools = await safeWrite(conn, '/ip/pool/print');
    console.log('\n   IP Pools:');
    pools.forEach(p => {
      console.log(`     - ${p.name}: ${p.ranges}`);
    });

    // Print RADIUS
    const radius = await safeWrite(conn, '/radius/print');
    console.log('\n   RADIUS:');
    radius.forEach(r => {
      console.log(`     - ${r.address}:${r['authentication-port']} (${r.disabled === 'true' ? '🔴 DISABLED' : '🟢 ENABLED'})`);
    });

    console.log(`\n✅ ${routerConfig.name} configured successfully!\n`);

    await conn.close();
    return true;
  } catch (error) {
    console.error(`\n❌ Error configuring ${routerConfig.name}: ${error.message}`);
    try { await conn.close(); } catch (e) {}
    return false;
  }
}

async function main() {
  console.log('🚀 Mikrotik PPPoE Setup Script');
  console.log('   Preparing routers for FreeRADIUS integration\n');
  console.log('   Configuration:');
  console.log(`   - PPPoE Pool: ${CONFIG.pool.ranges}`);
  console.log(`   - PPPoE Interface: ${CONFIG.server.interface}`);
  console.log(`   - RADIUS Server: ${CONFIG.radius.address}:${CONFIG.radius.authPort}`);
  console.log(`   - RADIUS Secret: ${CONFIG.radius.secret}`);
  console.log(`   - RADIUS Status: DISABLED (enable when FreeRADIUS ready)`);

  const results = [];

  for (const router of ROUTERS) {
    const success = await configureRouter(router);
    results.push({ name: router.name, success });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name}`);
  });

  console.log('\n📝 Next Steps:');
  console.log('  1. Install FreeRADIUS (Docker)');
  console.log('  2. Configure FreeRADIUS with MySQL/PostgreSQL');
  console.log('  3. Add NAS (Mikrotik) to FreeRADIUS clients');
  console.log('  4. Enable RADIUS on Mikrotik: /radius set 0 disabled=no');
  console.log('  5. Test PPPoE connection with RADIUS auth');
  console.log('\n💡 Test PPPoE without RADIUS:');
  console.log('  Username: test-user');
  console.log('  Password: test123');
  console.log('  Service: detso-pppoe');
  console.log('='.repeat(60));

  process.exit(results.every(r => r.success) ? 0 : 1);
}

main();
