-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Existing STAFF accounts had full back-office access via the blanket requireRole(ADMIN,STAFF)
-- gate on every route. Backfill the full permission set so nothing regresses until an admin
-- deliberately narrows a given STAFF member's access. New STAFF accounts created after this
-- migration default to [] (least privilege) via the column default above.
UPDATE "User" SET "permissions" = ARRAY[
  'PRODUCTS','ORDERS','CATEGORIES','COUPONS','BANNERS','REVIEWS',
  'NEWSLETTER','SETTINGS','CUSTOMERS','REPORTS','EMAIL_TEMPLATES'
] WHERE "role" = 'STAFF';
