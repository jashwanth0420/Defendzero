-- CreateEnum
CREATE TYPE "TimingType" AS ENUM ('BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD');

-- CreateEnum
CREATE TYPE "MedicationFrequency" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "MedicationLogStatus" AS ENUM ('TAKEN', 'MISSED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('NOTE', 'ALERT', 'REMINDER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REMINDER', 'MISSED_DOSE', 'SAFETY_WARNING', 'DOCTOR_MESSAGE');

-- AlterTable
ALTER TABLE "DoctorMessage" ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'NOTE';

-- CreateTable
CREATE TABLE "MedicationSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "composition" TEXT[],
    "dosage" TEXT NOT NULL,
    "frequency" "MedicationFrequency" NOT NULL,
    "timingType" "TimingType" NOT NULL,
    "scheduleTimes" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationLog" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "MedicationLogStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicines" JSONB NOT NULL,
    "doctorName" TEXT,
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "extractedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "medicines" JSONB NOT NULL,
    "maxQuantity" INTEGER NOT NULL,
    "usedQuantity" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicationSchedule_userId_idx" ON "MedicationSchedule"("userId");

-- CreateIndex
CREATE INDEX "MedicationLog_userId_date_idx" ON "MedicationLog"("userId", "date");

-- CreateIndex
CREATE INDEX "MedicationLog_scheduleId_idx" ON "MedicationLog"("scheduleId");

-- CreateIndex
CREATE INDEX "PrescriptionRecord_userId_idx" ON "PrescriptionRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseToken_tokenHash_key" ON "PurchaseToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PurchaseToken_userId_idx" ON "PurchaseToken"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "MedicationSchedule" ADD CONSTRAINT "MedicationSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationLog" ADD CONSTRAINT "MedicationLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MedicationSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationLog" ADD CONSTRAINT "MedicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionRecord" ADD CONSTRAINT "PrescriptionRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseToken" ADD CONSTRAINT "PurchaseToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseToken" ADD CONSTRAINT "PurchaseToken_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "PrescriptionRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
