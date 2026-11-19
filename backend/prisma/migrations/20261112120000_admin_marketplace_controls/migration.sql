-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PayoutRequest" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN     "clientRequestId" TEXT,
ADD COLUMN     "processedById" TEXT,
ADD COLUMN     "transferReference" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "moderationReason" TEXT,
ADD COLUMN     "moderationStatus" TEXT NOT NULL DEFAULT 'VISIBLE';

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedReason" TEXT;

-- AlterTable
ALTER TABLE "ShopTransaction" ADD COLUMN     "payoutRequestId" TEXT;

-- AlterTable
ALTER TABLE "SubOrder" ADD COLUMN     "settledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "reason" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "freeShippingThreshold" DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "PayoutRequest_shopId_status_idx" ON "PayoutRequest"("shopId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutRequest_shopId_clientRequestId_key" ON "PayoutRequest"("shopId", "clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopTransaction_payoutRequestId_key" ON "ShopTransaction"("payoutRequestId");

-- CreateIndex
CREATE INDEX "ShopTransaction_shopId_createdAt_idx" ON "ShopTransaction"("shopId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopTransaction_subOrderId_type_key" ON "ShopTransaction"("subOrderId", "type");

-- AddForeignKey
ALTER TABLE "ShopTransaction" ADD CONSTRAINT "ShopTransaction_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopTransaction" ADD CONSTRAINT "ShopTransaction_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "PayoutRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;