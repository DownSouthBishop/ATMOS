/*
  Warnings:

  - You are about to drop the column `o2Amount` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `partyA` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `partyB` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `usdAmount` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Receipt` table. All the data in the column will be lost.
  - Added the required column `ownerId` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partyAName` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partyBName` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiptNumber` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "jobId" TEXT,
    "receiptId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dispute_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Dispute_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Dispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "partyAId" TEXT,
    "partyAName" TEXT NOT NULL,
    "partyBId" TEXT,
    "partyBName" TEXT NOT NULL,
    "settlementCurrency" TEXT NOT NULL DEFAULT 'O2',
    "settlementAmount" TEXT,
    "paymentMethod" TEXT,
    "paymentNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sigA" BOOLEAN NOT NULL DEFAULT false,
    "sigAAt" DATETIME,
    "sigB" BOOLEAN NOT NULL DEFAULT false,
    "sigBAt" DATETIME,
    "sealedAt" DATETIME,
    "shareToken" TEXT,
    "jobId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receipt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Receipt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receipt_partyAId_fkey" FOREIGN KEY ("partyAId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Receipt_partyBId_fkey" FOREIGN KEY ("partyBId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Receipt" ("createdAt", "id", "jobId", "sigA", "sigB", "status", "title", "type") SELECT "createdAt", "id", "jobId", "sigA", "sigB", "status", "title", "type" FROM "Receipt";
DROP TABLE "Receipt";
ALTER TABLE "new_Receipt" RENAME TO "Receipt";
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");
CREATE UNIQUE INDEX "Receipt_shareToken_key" ON "Receipt"("shareToken");
CREATE UNIQUE INDEX "Receipt_jobId_key" ON "Receipt"("jobId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "o2Balance" REAL NOT NULL DEFAULT 0,
    "onboardingPath" TEXT NOT NULL DEFAULT 'economy',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "o2Balance", "password") SELECT "createdAt", "email", "id", "name", "o2Balance", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_jobId_key" ON "Dispute"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_receiptId_key" ON "Dispute"("receiptId");
