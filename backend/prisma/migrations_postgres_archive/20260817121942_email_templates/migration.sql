-- CreateEnum
CREATE TYPE "EmailTemplateKey" AS ENUM ('ORDER_CONFIRMATION', 'STATUS_CONFIRMED', 'STATUS_SHIPPED', 'STATUS_DELIVERED', 'STATUS_CANCELLED');

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "key" "EmailTemplateKey" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");
