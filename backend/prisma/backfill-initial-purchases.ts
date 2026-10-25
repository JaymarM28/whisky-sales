/**
 * Crea una compra "Inventario inicial" por cada producto cuyas entregas superan lo comprado,
 * para que la bodega arranque en 0 con el nuevo flujo Compra → Entrega.
 * Usa el costPrice actual del producto como costo unitario. Es idempotente.
 *
 * Por defecto solo muestra lo que haría. Para escribir: npm run db:backfill-purchases -- --apply
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const [entregas, compras] = await Promise.all([
    prisma.delivery.groupBy({
      by: ['tenantId', 'productId'],
      _sum: { quantity: true },
      _min: { date: true },
    }),
    prisma.purchase.groupBy({
      by: ['tenantId', 'productId'],
      _sum: { quantity: true },
    }),
  ]);

  let creadas = 0;
  for (const e of entregas) {
    const comprado =
      compras.find((c) => c.tenantId === e.tenantId && c.productId === e.productId)?._sum.quantity || 0;
    const faltante = (e._sum.quantity || 0) - comprado;
    if (faltante <= 0) continue;

    const product = await prisma.product.findUnique({
      where: { id: e.productId },
      select: { name: true, costPrice: true },
    });
    if (!product) continue;

    console.log(
      `${apply ? 'Creando' : '[dry-run]'} compra inicial: ${product.name} — ${faltante} u. × $${product.costPrice} (tenant ${e.tenantId})`,
    );

    if (apply) {
      await prisma.purchase.create({
        data: {
          tenantId: e.tenantId,
          productId: e.productId,
          quantity: faltante,
          unitCost: product.costPrice,
          totalCost: faltante * product.costPrice,
          supplier: 'Inventario inicial',
          date: e._min.date ?? new Date(),
          notes: 'Generada automáticamente a partir de entregas previas al registro de compras',
        },
      });
    }
    creadas++;
  }

  console.log(`\n${creadas} compra(s) ${apply ? 'creadas' : 'por crear (usa --apply para escribir)'}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
