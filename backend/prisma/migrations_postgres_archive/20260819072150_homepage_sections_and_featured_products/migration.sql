-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "bazaarEyebrow" TEXT,
ADD COLUMN     "bazaarHeading" TEXT,
ADD COLUMN     "bazaarLimit" INTEGER,
ADD COLUMN     "occasionEyebrow" TEXT,
ADD COLUMN     "occasionHeading" TEXT;
