import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/id_ID';
import { createId } from '@paralleldrive/cuid2'; // <--- MENGGUNAKAN CUID

const prisma = new PrismaClient();

// Konfigurasi Target Data
const TOTAL_CUSTOMERS = 100000;
const BATCH_SIZE = 5000;
const BATCH_COUNT = Math.ceil(TOTAL_CUSTOMERS / BATCH_SIZE);

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
  const tenantsData = Array.from({ length: 10 }).map((_, i) => ({
    id: createId(), // <--- PAKAI CUID
    name: i === 0 ? 'Berkah Net' : `${faker.company.name()} Net`,
    slug: i === 0 ? 'berkah-net' : faker.helpers.slugify(`${faker.company.name()} Net`).toLowerCase(),
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
  }));
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