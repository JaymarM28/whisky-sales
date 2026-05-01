/**
 * Seed de migración a multi-tenant.
 *
 * Qué hace:
 * 1. Crea el tenant "JM Liquors" con slug "jm-liquors" (si no existe).
 * 2. Asigna todos los User, Product, Delivery, Sale y CommissionPayment
 *    que aún no tienen tenantId a ese tenant.
 * 3. Asigna cédula temporal a usuarios sin cédula.
 *
 * Ejecutar con:  npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de migración multi-tenant...\n');

  // ── 1. Crear (o recuperar) el tenant inicial ──────────────────────────────
  let tenant = await prisma.tenant.findUnique({ where: { slug: 'jm-liquors' } });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'JM Liquors', slug: 'jm-liquors' },
    });
    console.log(`✓ Tenant creado: ${tenant.name} (${tenant.slug})`);
  } else {
    console.log(`→ Tenant ya existe: ${tenant.name} (${tenant.slug})`);
  }

  const tenantId = tenant.id;

  // ── 2. Asignar tenantId a registros huérfanos ─────────────────────────────
  const usersUpdated = await prisma.user.updateMany({
    where: { tenantId: null },
    data: { tenantId },
  });
  console.log(`✓ Usuarios asignados al tenant: ${usersUpdated.count}`);

  const productsUpdated = await prisma.product.updateMany({
    where: { tenantId: null },
    data: { tenantId },
  });
  console.log(`✓ Productos asignados al tenant: ${productsUpdated.count}`);

  const deliveriesUpdated = await prisma.delivery.updateMany({
    where: { tenantId: null },
    data: { tenantId },
  });
  console.log(`✓ Entregas asignadas al tenant: ${deliveriesUpdated.count}`);

  const salesUpdated = await prisma.sale.updateMany({
    where: { tenantId: null },
    data: { tenantId },
  });
  console.log(`✓ Ventas asignadas al tenant: ${salesUpdated.count}`);

  const commissionsUpdated = await prisma.commissionPayment.updateMany({
    where: { tenantId: null },
    data: { tenantId },
  });
  console.log(`✓ Pagos de comisión asignados al tenant: ${commissionsUpdated.count}`);

  // ── 3. Asignar isAdmin al OWNER existente y cédulas temporales ───────────
  const owners = await prisma.user.findMany({ where: { tenantId, role: 'OWNER' } });
  for (const owner of owners) {
    await prisma.user.update({ where: { id: owner.id }, data: { isAdmin: true } });
    console.log(`✓ "${owner.name}" marcado como ADMIN`);
  }

  const sinCedula = await prisma.user.findMany({ where: { tenantId, cedula: null } });
  for (const user of sinCedula) {
    const cedulaTemporal = `TEMP-${user.id.slice(0, 8)}`;
    await prisma.user.update({ where: { id: user.id }, data: { cedula: cedulaTemporal } });
    console.log(`⚠  "${user.name}" → cédula temporal: ${cedulaTemporal}  (actualiza en Prisma Studio)`);
  }

  console.log('\n✅ Seed completado.');
  console.log('\n   Para hacer login:');
  console.log('   - Código de negocio: jm-liquors');
  console.log('   - Cédula: actualiza las temporales con: npx prisma studio');
  console.log('   - PIN: el que ya tenías configurado\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
