import { prisma } from '../src/utils/prisma';
import * as bcrypt from 'bcryptjs';
import { encryptPassword } from '../src/utils/encryption';

async function main() {
  console.log('🚀 Seeding Mikrotik test data...\n');

  // 1. Create test tenant
  console.log('📦 Creating test tenant...');
  const tenant = await prisma.detso_Tenant.upsert({
    where: { slug: 'isp-test' },
    update: {},
    create: {
      name: 'ISP Test',
      slug: 'isp-test',
      address: 'Jl. Test No. 123, Jakarta',
      phone: '021-12345678',
      is_active: true,
    }
  });
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})\n`);

  // 2. Create test user (Owner)
  console.log('👤 Creating test user...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.detso_User.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: {
      tenant_id: tenant.id,
      username: 'owner',
      email: 'owner@test.com',
      password: hashedPassword,
      phone: '081234567890',
      role: 'TENANT_OWNER',
      profile: {
        create: {
          full_name: 'Test Owner',
        }
      }
    }
  });
  console.log(`✅ User created: ${user.email} (${user.id})\n`);

  // 3. Create Mikrotik routers
  console.log('🔧 Creating Mikrotik routers...');
  
  const router1 = await prisma.detso_Mikrotik_Router.upsert({
    where: { id: 'router-pusat-test' },
    update: {},
    create: {
      id: 'router-pusat-test',
      tenant_id: tenant.id,
      name: 'Router Pusat',
      host: 'localhost',
      api_port: 8728,
      api_username: 'api-user',
      api_password: encryptPassword('api-password123'),
      is_active: true,
      is_online: true,
      board_name: 'CHR QEMU Standard PC',
      routeros_version: '7.21.4',
      architecture: 'x86_64',
      cpu_model: 'AMD',
      cpu_count: 4,
      last_seen_at: new Date(),
    }
  });
  console.log(`✅ Router created: ${router1.name} (${router1.id})`);

  const router2 = await prisma.detso_Mikrotik_Router.upsert({
    where: { id: 'router-cabang-test' },
    update: {},
    create: {
      id: 'router-cabang-test',
      tenant_id: tenant.id,
      name: 'Router Cabang A',
      host: 'localhost',
      api_port: 8730,
      api_username: 'api-user',
      api_password: encryptPassword('api-password123'),
      is_active: true,
      is_online: true,
      board_name: 'CHR QEMU Standard PC',
      routeros_version: '7.21.4',
      architecture: 'x86_64',
      cpu_model: 'AMD',
      cpu_count: 4,
      last_seen_at: new Date(),
    }
  });
  console.log(`✅ Router created: ${router2.name} (${router2.id})\n`);

  // 4. Create sample monitoring data
  console.log('📊 Creating sample monitoring data...');
  
  const now = new Date();
  const monitoringData = [];
  
  // Create 10 monitoring records for each router (last 10 minutes)
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date(now.getTime() - (i * 60 * 1000)); // Every minute
    
    monitoringData.push({
      router_id: router1.id,
      cpu_load: 30 + Math.random() * 20, // 30-50%
      memory_used: BigInt(Math.floor(200 * 1024 * 1024 + Math.random() * 100 * 1024 * 1024)), // 200-300MB
      memory_total: BigInt(512 * 1024 * 1024), // 512MB
      disk_used: BigInt(20 * 1024 * 1024), // 20MB
      disk_total: BigInt(89 * 1024 * 1024), // 89MB
      uptime: `${31 + i}m${44 + i}s`,
      active_sessions: 45 + Math.floor(Math.random() * 10), // 45-55 sessions
      recorded_at: timestamp,
    });

    monitoringData.push({
      router_id: router2.id,
      cpu_load: 25 + Math.random() * 15, // 25-40%
      memory_used: BigInt(Math.floor(250 * 1024 * 1024 + Math.random() * 50 * 1024 * 1024)), // 250-300MB
      memory_total: BigInt(512 * 1024 * 1024), // 512MB
      disk_used: BigInt(20 * 1024 * 1024), // 20MB
      disk_total: BigInt(89 * 1024 * 1024), // 89MB
      uptime: `${15 + i}m${16 + i}s`,
      active_sessions: 20 + Math.floor(Math.random() * 8), // 20-28 sessions
      recorded_at: timestamp,
    });
  }

  await prisma.detso_Mikrotik_Monitoring.createMany({
    data: monitoringData,
  });
  console.log(`✅ Created ${monitoringData.length} monitoring records\n`);

  // 5. Create sample interface data
  console.log('🔌 Creating sample interface data...');
  
  const interfaceData = [];
  
  // Interfaces for Router 1
  ['ether1', 'ether2', 'lo'].forEach((ifaceName, idx) => {
    interfaceData.push({
      router_id: router1.id,
      interface_name: ifaceName,
      interface_type: ifaceName === 'lo' ? 'loopback' : 'ether',
      mac_address: ifaceName === 'lo' ? null : `00:0C:42:12:34:${50 + idx}`,
      mtu: 1500,
      is_running: true,
      is_disabled: false,
      rx_bytes: BigInt(Math.floor(Math.random() * 1000000000000)), // Random large number
      tx_bytes: BigInt(Math.floor(Math.random() * 1000000000000)),
      rx_packets: BigInt(Math.floor(Math.random() * 100000000)),
      tx_packets: BigInt(Math.floor(Math.random() * 100000000)),
      rx_bps: BigInt(Math.floor(10000000 + Math.random() * 50000000)), // 10-60 Mbps
      tx_bps: BigInt(Math.floor(5000000 + Math.random() * 20000000)), // 5-25 Mbps
      recorded_at: now,
    });
  });

  // Interfaces for Router 2
  ['ether1', 'ether2', 'lo'].forEach((ifaceName, idx) => {
    interfaceData.push({
      router_id: router2.id,
      interface_name: ifaceName,
      interface_type: ifaceName === 'lo' ? 'loopback' : 'ether',
      mac_address: ifaceName === 'lo' ? null : `00:0C:42:12:34:${60 + idx}`,
      mtu: 1500,
      is_running: true,
      is_disabled: false,
      rx_bytes: BigInt(Math.floor(Math.random() * 1000000000000)),
      tx_bytes: BigInt(Math.floor(Math.random() * 1000000000000)),
      rx_packets: BigInt(Math.floor(Math.random() * 100000000)),
      tx_packets: BigInt(Math.floor(Math.random() * 100000000)),
      rx_bps: BigInt(Math.floor(8000000 + Math.random() * 30000000)), // 8-38 Mbps
      tx_bps: BigInt(Math.floor(3000000 + Math.random() * 15000000)), // 3-18 Mbps
      recorded_at: now,
    });
  });

  await prisma.detso_Mikrotik_Interface.createMany({
    data: interfaceData,
  });
  console.log(`✅ Created ${interfaceData.length} interface records\n`);

  console.log('=' .repeat(60));
  console.log('🎉 Seeding completed successfully!\n');
  console.log('📋 Summary:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - User: ${user.email} / password123`);
  console.log(`   - Routers: 2 (Router Pusat, Router Cabang A)`);
  console.log(`   - Monitoring records: ${monitoringData.length}`);
  console.log(`   - Interface records: ${interfaceData.length}`);
  console.log('\n💡 You can now test the Mikrotik API!');
  console.log('=' .repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
