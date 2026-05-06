import { prisma } from '../src/utils/prisma';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/id_ID';
import { createId } from '@paralleldrive/cuid2'; // <--- MENGGUNAKAN CUID

// Konfigurasi Target Data
const TOTAL_CUSTOMERS = 100000;
const BATCH_SIZE = 5000;
const BATCH_COUNT = Math.ceil(TOTAL_CUSTOMERS / BATCH_SIZE);

// Indonesia Major Cities Coordinates (untuk distribusi tenant)
const INDONESIA_CITIES = [
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
  { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
  { name: 'Medan', lat: 3.5952, lng: 98.6722 },
  { name: 'Semarang', lat: -6.9667, lng: 110.4167 },
  { name: 'Makassar', lat: -5.1477, lng: 119.4327 },
  { name: 'Palembang', lat: -2.9761, lng: 104.7754 },
  { name: 'Tangerang', lat: -6.1783, lng: 106.6319 },
  { name: 'Depok', lat: -6.4025, lng: 106.7942 },
  { name: 'Bekasi', lat: -6.2383, lng: 106.9756 },
];

// Helper: Generate random coordinate nearby (within ~5km radius)
function generateNearbyCoordinate(baseLat: number, baseLng: number): { lat: number; lng: number } {
  const radiusInDegrees = 0.045; // ~5km
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  return {
    lat: parseFloat((baseLat + y).toFixed(6)),
    lng: parseFloat((baseLng + x).toFixed(6)),
  };
}

// Helper: Generate waypoints between two coordinates
function generateWaypoints(fromLat: number, fromLng: number, toLat: number, toLng: number, count: number): number[][] {
  const waypoints: number[][] = [];
  for (let i = 1; i <= count; i++) {
    const ratio = i / (count + 1);
    const lat = fromLat + (toLat - fromLat) * ratio + (Math.random() - 0.5) * 0.002; // Add slight randomness
    const lng = fromLng + (toLng - fromLng) * ratio + (Math.random() - 0.5) * 0.002;
    waypoints.push([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]);
  }
  return waypoints;
}

async function main() {
  console.log('🚀 Memulai proses MASSIVE seeding database...');
  console.time('Waktu Eksekusi Seeding');

  // ==========================================
  // 1. CLEANUP DATABASE
  // ==========================================
  console.log('🧹 Membersihkan database...');
  await prisma.detso_Refresh_Token.deleteMany();
  await prisma.detso_Ticket_History.deleteMany();
  await prisma.detso_Work_Schedule.deleteMany();
  await prisma.detso_Customer_PDF.deleteMany();
  await prisma.detso_Service_Photo.deleteMany();
  await prisma.detso_Ticket.deleteMany();
  await prisma.detso_Service_Connection.deleteMany();
  await prisma.detso_Customer_Document.deleteMany();
  await prisma.detso_Customer.deleteMany();
  await prisma.detso_Package.deleteMany();
  await prisma.detso_Network_Link.deleteMany();
  await prisma.detso_Network_Node.deleteMany();
  await prisma.detso_Mikrotik_Interface.deleteMany();
  await prisma.detso_Mikrotik_Monitoring.deleteMany();
  await prisma.detso_Mikrotik_Router.deleteMany();
  await prisma.detso_Profile.deleteMany();
  await prisma.detso_User.deleteMany();
  await prisma.detso_Tenant.deleteMany();

  // ==========================================
  // 2. SETUP DATA UTAMA
  // ==========================================
  const defaultPassword = await bcrypt.hash('12345678', 10);
  const adminPassword = await bcrypt.hash('admin', 10);

  console.log('👑 Membuat SAAS Super Admin...');
  await prisma.detso_User.create({
    data: {
      id: createId(), // <--- PAKAI CUID
      username: 'admin',
      email: 'admin@detso.id',
      password: adminPassword,
      role: 'SAAS_SUPER_ADMIN',
      profile: { create: { id: createId(), full_name: 'Super Admin Detso' } },
    },
  });

  // ==========================================
  // 3. CREATE 10 TENANT MASSAL
  // ==========================================
  console.log('🏢 Membuat 10 Tenant (ISP)...');
  const tenantsData = Array.from({ length: 10 }).map((_, i) => {
    const city = INDONESIA_CITIES[i];
    return {
      id: createId(),
      name: i === 0 ? 'Berkah Net' : `${faker.company.name()} Net`,
      slug: i === 0 ? 'berkah-net' : faker.helpers.slugify(`${faker.company.name()} Net`).toLowerCase(),
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      lat: city.lat.toString(),
      long: city.lng.toString(),
    };
  });
  await prisma.detso_Tenant.createMany({ data: tenantsData });

  // ==========================================
  // 4. CREATE USER & PACKAGES
  // ==========================================
  console.log('👥 Membuat User & Paket untuk tiap ISP...');
  const packagesData: any[] = [];
  const usersData: any[] = [];

  for (const tenant of tenantsData) {
    usersData.push({
      id: createId(), // <--- PAKAI CUID
      tenant_id: tenant.id,
      username: `owner_${tenant.slug.replace(/-/g, '_')}`,
      email: faker.internet.email(),
      password: defaultPassword,
      role: 'TENANT_OWNER',
    });
    usersData.push({
      id: createId(), // <--- PAKAI CUID
      tenant_id: tenant.id,
      username: `teknisi_${tenant.slug.replace(/-/g, '_')}`,
      email: faker.internet.email(),
      password: defaultPassword,
      role: 'TENANT_TEKNISI',
      phone: faker.phone.number(),
    });

    packagesData.push(
      { id: createId(), tenant_id: tenant.id, name: 'Gold 50 Mbps', speed: '50 Mbps', price: 250000 },
      { id: createId(), tenant_id: tenant.id, name: 'Platinum 100 Mbps', speed: '100 Mbps', price: 400000 }
    );
  }

  await prisma.detso_User.createMany({ data: usersData });
  await prisma.detso_Package.createMany({ data: packagesData });

  // ==========================================
  // 4.5. CREATE NETWORK TOPOLOGY (Server + ODP + Links)
  // ==========================================
  console.log('🗺️  Membuat Network Topology untuk tiap ISP...');
  const nodesData: any[] = [];
  const linksData: any[] = [];

  for (const tenant of tenantsData) {
    const tenantLat = parseFloat(tenant.lat);
    const tenantLng = parseFloat(tenant.long);

    // 1. Create 1 Server node at tenant location
    const serverId = createId();
    nodesData.push({
      id: serverId,
      tenant_id: tenant.id,
      name: `Server ${tenant.name}`,
      type: 'SERVER',
      lat: tenant.lat,
      long: tenant.long,
    });

    // 2. Create 5-10 ODP nodes nearby
    const odpCount = Math.floor(Math.random() * 6) + 5; // 5-10 ODPs
    const odpIds: string[] = [];

    for (let i = 0; i < odpCount; i++) {
      const odpId = createId();
      const odpCoord = generateNearbyCoordinate(tenantLat, tenantLng);
      odpIds.push(odpId);

      nodesData.push({
        id: odpId,
        tenant_id: tenant.id,
        name: `ODP-${String(i + 1).padStart(3, '0')}`,
        type: 'ODP',
        lat: odpCoord.lat.toString(),
        long: odpCoord.lng.toString(),
      });

      // 3. Create Link: Server → ODP
      const hasWaypoints = Math.random() < 0.3; // 30% chance to have waypoints
      const waypoints = hasWaypoints
        ? generateWaypoints(tenantLat, tenantLng, odpCoord.lat, odpCoord.lng, Math.floor(Math.random() * 4) + 2) // 2-5 waypoints
        : null;

      linksData.push({
        id: createId(),
        tenant_id: tenant.id,
        from_node_id: serverId,
        to_node_id: odpId,
        type: Math.random() > 0.5 ? 'FIBER' : 'DROP_CABLE',
        waypoints: waypoints ? JSON.stringify(waypoints) : null,
      });
    }
  }

  await prisma.detso_Network_Node.createMany({ data: nodesData });
  await prisma.detso_Network_Link.createMany({ data: linksData });

  console.log(`✅ Network Topology: ${nodesData.length} nodes, ${linksData.length} links`);

  // ==========================================
  // 5. INJEKSI 100.000+ CUSTOMERS & SERVICES
  // ==========================================
  console.log(`\n🔥 MEMULAI PROSES INJEKSI ${TOTAL_CUSTOMERS.toLocaleString('id-ID')} PELANGGAN & KONEKSI...`);
  
  const getRandomItem = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  let totalInserted = 0;

  for (let batch = 1; batch <= BATCH_COUNT; batch++) {
    const customersBatch: any[] = [];
    const servicesBatch: any[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const randomTenant = getRandomItem(tenantsData);
      const tenantPackages = packagesData.filter(p => p.tenant_id === randomTenant.id);
      const randomPackage = getRandomItem(tenantPackages);

      // Pre-generate CUID
      const customerId = createId(); // <--- PAKAI CUID
      const serviceId = createId();  // <--- PAKAI CUID

      customersBatch.push({
        id: customerId,
        tenant_id: randomTenant.id,
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        nik: faker.string.numeric(16),
        address: faker.location.streetAddress(),
        created_at: faker.date.past({ years: 1 }), 
      });

      servicesBatch.push({
        id: serviceId,
        tenant_id: randomTenant.id,
        customer_id: customerId,
        package_id: randomPackage.id,
        id_pel: `IDP-${faker.string.numeric(6)}`,
        address: faker.location.streetAddress(),
        package_name: randomPackage.name,
        package_speed: randomPackage.speed,
        package_price: randomPackage.price,
        ip_address: faker.internet.ipv4(),
        mac_address: faker.internet.mac(),
        lat: faker.location.latitude().toString(),
        long: faker.location.longitude().toString(),
        status: Math.random() > 0.1 ? 'ACTIVE' : 'SUSPENDED',
        created_at: new Date(),
      });
    }

    await prisma.detso_Customer.createMany({ data: customersBatch });
    await prisma.detso_Service_Connection.createMany({ data: servicesBatch });

    totalInserted += BATCH_SIZE;
    const percentage = Math.round((totalInserted / TOTAL_CUSTOMERS) * 100);
    process.stdout.write(`\r⏳ Progress: ${percentage}% | Inserted: ${totalInserted.toLocaleString('id-ID')} / ${TOTAL_CUSTOMERS.toLocaleString('id-ID')} records...`);
  }

  console.log('\n\n✅ INJEKSI DATA MASSAL SELESAI!');
  
  // ==========================================
  // 6. HASIL AKHIR
  // ==========================================
  const countCustomers = await prisma.detso_Customer.count();
  const countServices = await prisma.detso_Service_Connection.count();

  console.log('--------------------------------------------------');
  console.log('📊 RINGKASAN DATABASE:');
  console.log(`   - Tenants : 10`);
  console.log(`   - Users   : ${await prisma.detso_User.count()}`);
  console.log(`   - Nodes   : ${await prisma.detso_Network_Node.count()}`);
  console.log(`   - Links   : ${await prisma.detso_Network_Link.count()}`);
  console.log(`   - Customer: ${countCustomers.toLocaleString('id-ID')} baris`);
  console.log(`   - Layanan : ${countServices.toLocaleString('id-ID')} baris`);
  console.log('--------------------------------------------------');
  console.timeEnd('Waktu Eksekusi Seeding');
}

main()
  .catch((e) => {
    console.error('\n❌ Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });