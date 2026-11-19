-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('admin', 'staff');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "role" "EmployeeRole" NOT NULL DEFAULT 'staff';
