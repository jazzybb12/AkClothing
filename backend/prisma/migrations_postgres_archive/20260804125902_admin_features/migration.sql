-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;
