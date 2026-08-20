-- DropIndex
DROP INDEX "Review_productId_userId_key";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "authorName" TEXT;

-- CreateIndex
CREATE INDEX "Review_productId_userId_idx" ON "Review"("productId", "userId");
