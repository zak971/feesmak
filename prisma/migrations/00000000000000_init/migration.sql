
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'TEACHER');
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER');

CREATE TABLE "Maktab" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "maktabId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_email_key" UNIQUE ("email"),
  CONSTRAINT "User_maktabId_fkey" FOREIGN KEY ("maktabId") REFERENCES "Maktab"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "User_maktabId_role_idx" ON "User"("maktabId","role");

CREATE TABLE "Class" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "maktabId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "monthlyFee" INTEGER NOT NULL,
  "teacherId" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Class_maktabId_fkey" FOREIGN KEY ("maktabId") REFERENCES "Maktab"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Class_maktabId_idx" ON "Class"("maktabId");

CREATE TABLE "ClassFeeHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "classId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassFeeHistory_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ClassFeeHistory_classId_effectiveFrom_idx" ON "ClassFeeHistory"("classId","effectiveFrom");

CREATE TABLE "Student" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "maktabId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "parentName" TEXT,
  "parentPhone" TEXT,
  "address" TEXT,
  "monthlyFeeOverride" INTEGER,
  "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Student_maktabId_fkey" FOREIGN KEY ("maktabId") REFERENCES "Maktab"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Student_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Student_maktabId_classId_idx" ON "Student"("maktabId","classId");
CREATE INDEX "Student_classId_status_idx" ON "Student"("classId","status");

CREATE TABLE "Fee" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "month" TIMESTAMP(3) NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Fee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Fee_studentId_month_key" ON "Fee"("studentId","month");
CREATE INDEX "Fee_classId_month_status_idx" ON "Fee"("classId","month","status");

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "maktabId" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_receiptNumber_key" UNIQUE ("receiptNumber"),
  CONSTRAINT "Payment_maktabId_fkey" FOREIGN KEY ("maktabId") REFERENCES "Maktab"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Payment_maktabId_paidAt_idx" ON "Payment"("maktabId","paidAt");

CREATE TABLE "PaymentAllocation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL,
  "feeId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentAllocation_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentAllocation_paymentId_feeId_key" UNIQUE ("paymentId","feeId")
);
CREATE INDEX "PaymentAllocation_feeId_idx" ON "PaymentAllocation"("feeId");

CREATE TABLE "Receipt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Receipt_paymentId_key" UNIQUE ("paymentId"),
  CONSTRAINT "Receipt_receiptNumber_key" UNIQUE ("receiptNumber"),
  CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
