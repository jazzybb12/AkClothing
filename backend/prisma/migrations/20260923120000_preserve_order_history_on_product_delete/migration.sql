ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_variantId_fkey`;

ALTER TABLE `OrderItem` MODIFY `variantId` VARCHAR(191) NULL;

ALTER TABLE `OrderItem`
  ADD CONSTRAINT `OrderItem_variantId_fkey`
  FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
