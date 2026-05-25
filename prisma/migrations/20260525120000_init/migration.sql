-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "o2Balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onboardingPath" TEXT NOT NULL DEFAULT 'economy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "specialties" TEXT NOT NULL,
    "minO2" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "personality" TEXT,
    "systemPrompt" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "importedFrom" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "o2Budget" DOUBLE PRECISION NOT NULL,
    "timeLimit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assessment" TEXT,
    "output" TEXT,
    "postedById" TEXT,
    "acceptedById" TEXT,
    "agentId" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "computeCostUsd" DOUBLE PRECISION,
    "platformFeeUsd" DOUBLE PRECISION,
    "o2Cost" DOUBLE PRECISION,
    "o2Refund" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
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
    "sigAAt" TIMESTAMP(3),
    "sigB" BOOLEAN NOT NULL DEFAULT false,
    "sigBAt" TIMESTAMP(3),
    "sealedAt" TIMESTAMP(3),
    "shareToken" TEXT,
    "jobId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "jobId" TEXT,
    "receiptId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "o2Amount" DOUBLE PRECISION NOT NULL,
    "usdAmount" TEXT,
    "jobId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_shareToken_key" ON "Receipt"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_jobId_key" ON "Receipt"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_jobId_key" ON "Dispute"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_receiptId_key" ON "Dispute"("receiptId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_partyAId_fkey" FOREIGN KEY ("partyAId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_partyBId_fkey" FOREIGN KEY ("partyBId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Receipt_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
