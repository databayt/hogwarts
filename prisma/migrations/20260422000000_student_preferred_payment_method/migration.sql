-- AlterTable: add nullable preferredPaymentMethod column on students.
-- Set by guardians via /my-fees; consumed by invoice generation for
-- auto-routing recurring charges to the family's chosen method.
ALTER TABLE "students" ADD COLUMN "preferredPaymentMethod" "PaymentMethod";
