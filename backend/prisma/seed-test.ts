import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de pruebas...\n');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'test-liquors' },
    update: {},
    create: { name: 'Test Liquors', slug: 'test-liquors' },
  });
  console.log(`✓ Tenant: ${tenant.name} (${tenant.slug})`);

  const pinHash = await bcrypt.hash('1234', 10);

  const owner = await prisma.user.upsert({
    where: { cedula: 'TEST-OWNER-001' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Admin Test',
      email: 'admin@test.com',
      cedula: 'TEST-OWNER-001',
      role: 'OWNER',
      isAdmin: true,
      pin: pinHash,
      commissionPct: 0,
    },
  });
  console.log(`✓ Usuario OWNER: ${owner.name} (cédula: ${owner.cedula})`);

  console.log('\n✅ Seed de pruebas completado.');
  console.log('\n   Para hacer login:');
  console.log('   - Código de negocio: test-liquors');
  console.log('   - Cédula:            TEST-OWNER-001');
  console.log('   - PIN:               1234\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
