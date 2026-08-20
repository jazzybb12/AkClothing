-- AlterEnum
ALTER TYPE "CouponType" ADD VALUE 'FREE_SHIPPING';

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "autoApply" BOOLEAN NOT NULL DEFAULT false;
