/**
 * Verify PPPoE Configuration on Mikrotik Routers
 */
const { RouterOSAPI } = require('node-routeros');

async function verifyRouter(name, host, port) {
  console.log(`\n📋 Verifying ${name} (${host}:${port})`);
  console.log('─'.repeat(50));

  const conn = new RouterOSAPI({ host, user: 'admin', password: '', port, timeout: 10 });

  // Add error listener to prevent crash on !empty
  conn.on('error', (err) => {
    // Silently handle !empty errors
  });

  try {
    await conn.connect();
    console.log('✅ Connected');

    // Check identity
    try {
      const identity = await conn.write('/system/identity/print');
      console.log(`\n🏷️  Identity: ${identity[0]?.name || 'unknown'}`);
    } catch (e) { console.log('   ⚠️ Could not get identity'); }

    // Check IP addresses
    try {
      const ips = await conn.write('/ip/address/print');
      console.log('\n🌐 IP Addresses:');
      if (ips.length === 0) console.log('   (none)');
      ips.forEach(ip => console.log(`   - ${ip.address} on ${ip.interface}`));
    } catch (e) { console.log('   ⚠️ Could not get IPs'); }

    // Check IP pools
    try {
      const pools = await conn.write('/ip/pool/print');
      console.log('\n🏊 IP Pools:');
      if (pools.length === 0) console.log('   (none)');
      pools.forEach(p => console.log(`   - ${p.name}: ${p.ranges}`));
    } catch (e) { console.log('   ⚠️ Could not get pools'); }

    // Check PPP profiles
    try {
      const profiles = await conn.write('/ppp/profile/print');
      console.log('\n👤 PPP Profiles:');
      profiles.forEach(p => {
        if (p.name !== 'default' && p.name !== 'default-encryption') {
          console.log(`   - ${p.name} (local: ${p['local-address']}, remote: ${p['remote-address']}, rate: ${p['rate-limit'] || 'none'})`);
        }
      });
    } catch (e) { console.log('   ⚠️ Could not get profiles'); }

    // Check PPPoE servers
    try {
      const servers = await conn.write('/interface/pppoe-server/server/print');
      console.log('\n📡 PPPoE Servers:');
      if (servers.length === 0) console.log('   (none configured)');
      servers.forEach(s => console.log(`   - ${s['service-name']} on ${s.interface} (profile: ${s['default-profile']}, disabled: ${s.disabled})`));
    } catch (e) { console.log('   ⚠️ Could not get PPPoE servers'); }

    // Check RADIUS
    try {
      const radius = await conn.write('/radius/print');
      console.log('\n🔐 RADIUS:');
      if (radius.length === 0) console.log('   (not configured)');
      radius.forEach(r => console.log(`   - ${r.address}:${r['authentication-port']} service=${r.service} disabled=${r.disabled}`));
    } catch (e) { console.log('   ⚠️ Could not get RADIUS config'); }

    // Check PPP AAA
    try {
      const aaa = await conn.write('/ppp/aaa/print');
      console.log('\n⚙️  PPP AAA:');
      if (aaa.length > 0) {
        console.log(`   - use-radius: ${aaa[0]['use-radius']}`);
        console.log(`   - accounting: ${aaa[0]['accounting']}`);
        console.log(`   - interim-update: ${aaa[0]['interim-update']}`);
      }
    } catch (e) { console.log('   ⚠️ Could not get AAA config'); }

    // Check PPP secrets (test users)
    try {
      const secrets = await conn.write('/ppp/secret/print');
      console.log('\n🧪 PPP Secrets (test users):');
      if (secrets.length === 0) console.log('   (none)');
      secrets.forEach(s => console.log(`   - ${s.name} (profile: ${s.profile}, service: ${s.service})`));
    } catch (e) { console.log('   ⚠️ Could not get secrets'); }

    await conn.close();
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 PPPoE Configuration Verification');
  console.log('='.repeat(50));

  // Only test Router Cabang since it's the one that works reliably
  await verifyRouter('Router Cabang', 'localhost', 8730);
  
  // Try Router Pusat
  await verifyRouter('Router Pusat', 'localhost', 8728);

  console.log('\n' + '='.repeat(50));
  console.log('Done!');
}

main().catch(console.error);
