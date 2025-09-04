-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_eventId_fkey`;

-- DropIndex
DROP INDEX `Booking_eventId_fkey` ON `booking`;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
