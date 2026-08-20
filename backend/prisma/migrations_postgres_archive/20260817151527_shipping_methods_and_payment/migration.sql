-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'BANK_DEPOSIT');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
ADD COLUMN     "shippingMethodId" TEXT,
ADD COLUMN     "shippingMethodName" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "bankDepositEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bankDepositInstructions" TEXT,
ADD COLUMN     "codEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ShippingMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "ShippingMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed one "Standard Shipping" method carrying over the previous flat Settings.shippingFee
-- value, so checkout doesn't suddenly go from one implicit shipping fee to zero configured
-- options the moment this ships. Existing orders keep shippingMethodId NULL (no retroactive
-- guess) — only new orders placed after this migration attach a real method.
INSERT INTO "ShippingMethod" (id, name, description, fee, active, position)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Standard Shipping',
  'Delivered nationwide via courier',
  COALESCE((SELECT "shippingFee" FROM "Settings" WHERE id = 'singleton'), 250),
  true,
  0
);
