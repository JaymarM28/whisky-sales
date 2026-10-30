-- CreateTable
CREATE TABLE "StockLoss" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "productId" TEXT NOT NULL,
    "partnerId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "partnerSharePct" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLoss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockLoss_tenantId_productId_idx" ON "StockLoss"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "StockLoss_tenantId_partnerId_idx" ON "StockLoss"("tenantId", "partnerId");

-- AddForeignKey
ALTER TABLE "StockLoss" ADD CONSTRAINT "StockLoss_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLoss" ADD CONSTRAINT "StockLoss_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLoss" ADD CONSTRAINT "StockLoss_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

