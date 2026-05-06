const RouterOSAPI = require('node-routeros').RouterOSAPI;

async function testRouter(name, host, port, username, password) {
  console.log(`\n🔌 Testing ${name}...`);
  console.log(`   Host: ${host}:${port}`);
  console.log(`   User: ${username}`);
  
  const conn = new RouterOSAPI({
    host: host,
    user: username,
    password: password,
    port: port,
    timeout: 10
  });

  try {
    console.log(`   ⏳ Connecting...`);
    await conn.connect();
    console.log(`   ✅ Connected!`);

    // Get system resources
    console.log(`   📊 Fetching system info...`);
    const resources = await conn.write('/system/resource/print');
    const resource = resources[0];
    
    console.log(`   📊 System Info:`);
    console.log(`      - Board: ${resource['board-name']}`);
    console.log(`      - Version: ${resource['version']}`);
    console.log(`      - CPU: ${resource['cpu']}`);
    console.log(`      - CPU Count: ${resource['cpu-count']}`);
    console.log(`      - CPU Load: ${resource['cpu-load']}%`);
    console.log(`      - Memory: ${(resource['free-memory'] / 1024 / 1024).toFixed(0)}MB free / ${(resource['total-memory'] / 1024 / 1024).toFixed(0)}MB total`);
    console.log(`      - Disk: ${(resource['free-hdd-space'] / 1024 / 1024).toFixed(0)}MB free / ${(resource['total-hdd-space'] / 1024 / 1024).toFixed(0)}MB total`);
    console.log(`      - Uptime: ${resource['uptime']}`);
    console.log(`      - Architecture: ${resource['architecture-name']}`);

    // Get interfaces
    console.log(`   🔌 Fetching interfaces...`);
    const interfaces = await conn.write('/interface/print');
    console.log(`   🔌 Interfaces: ${interfaces.length} found`);
    interfaces.slice(0, 5).forEach(iface => {
      const status = iface.running ? '🟢 UP' : '🔴 DOWN';
      console.log(`      - ${iface.name} (${iface.type}) - ${status}`);
    });

    // Get identity
    console.log(`   🏷️  Fetching identity...`);
    const identity = await conn.write('/system/identity/print');
    console.log(`   🏷️  Router Name: ${identity[0].name}`);

    await conn.close();
    console.log(`   ✅ Test completed successfully!`);
    return { success: true, data: resource };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n')[0]}`);
    }
    return { success: false, error: error.message };
  }
}

async function createApiUser(name, host, port, adminUser, adminPass, newUser, newPass) {
  console.log(`\n🔧 Creating API user on ${name}...`);
  
  const conn = new RouterOSAPI({
    host: host,
    user: adminUser,
    password: adminPass,
    port: port,
    timeout: 10
  });

  try {
    await conn.connect();
    console.log(`   ✅ Connected as ${adminUser}`);

    // Check if user already exists
    console.log(`   🔍 Checking if user '${newUser}' exists...`);
    const users = await conn.write('/user/print');
    const userExists = users.some(u => u.name === newUser);

    if (userExists) {
      console.log(`   ℹ️  User '${newUser}' already exists, skipping creation`);
    } else {
      console.log(`   ➕ Creating user '${newUser}'...`);
      await conn.write('/user/add', [
        '=name=' + newUser,
        '=password=' + newPass,
        '=group=full'
      ]);
      console.log(`   ✅ User '${newUser}' created successfully!`);
    }

    await conn.close();
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Mikrotik API Connection Test');
  console.log('=' .repeat(60));
  console.log('');

  const routers = [
    { name: 'Router Pusat', host: 'localhost', port: 8728 },
    { name: 'Router Cabang', host: 'localhost', port: 8730 }
  ];

  const results = [];

  // Phase 1: Test with default admin (no password)
  console.log('📋 Phase 1: Testing with default admin credentials');
  console.log('-'.repeat(60));

  for (const router of routers) {
    const result = await testRouter(
      router.name,
      router.host,
      router.port,
      'admin',
      '' // Empty password
    );
    results.push({ ...router, phase1: result });
  }

  // Phase 2: Create API users
  console.log('\n📋 Phase 2: Creating API users');
  console.log('-'.repeat(60));

  for (const router of routers) {
    if (results.find(r => r.name === router.name).phase1.success) {
      const created = await createApiUser(
        router.name,
        router.host,
        router.port,
        'admin',
        '',
        'api-user',
        'api-password123'
      );
      results.find(r => r.name === router.name).userCreated = created;
    } else {
      console.log(`\n⚠️  Skipping ${router.name} - Phase 1 failed`);
      results.find(r => r.name === router.name).userCreated = false;
    }
  }

  // Phase 3: Test with API user
  console.log('\n📋 Phase 3: Testing with API user credentials');
  console.log('-'.repeat(60));

  for (const router of routers) {
    if (results.find(r => r.name === router.name).userCreated) {
      const result = await testRouter(
        router.name,
        router.host,
        router.port,
        'api-user',
        'api-password123'
      );
      results.find(r => r.name === router.name).phase3 = result;
    } else {
      console.log(`\n⚠️  Skipping ${router.name} - User not created`);
      results.find(r => r.name === router.name).phase3 = { success: false };
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  results.forEach(r => {
    console.log(`\n${r.name} (${r.host}:${r.port})`);
    console.log(`  Phase 1 (admin):    ${r.phase1.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  User Creation:      ${r.userCreated ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Phase 3 (api-user): ${r.phase3?.success ? '✅ PASS' : '❌ FAIL'}`);
  });

  const allPassed = results.every(r => r.phase1.success && r.userCreated && r.phase3?.success);

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Mikrotik API is ready for development.');
    console.log('\n📝 Next steps:');
    console.log('   1. Backend implementation (mikrotik.service.ts)');
    console.log('   2. Database migration (Prisma schema)');
    console.log('   3. API endpoints');
    console.log('   4. Mobile app integration');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please check the errors above.');
    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure Mikrotik containers are running');
    console.log('   - Wait 1-2 minutes after container start');
    console.log('   - Check docker logs: docker logs routeros_pusat');
    process.exit(1);
  }
}

// Run tests
main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
