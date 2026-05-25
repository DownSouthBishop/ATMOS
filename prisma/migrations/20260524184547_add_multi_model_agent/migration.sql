-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "specialties" TEXT NOT NULL,
    "minO2" REAL NOT NULL DEFAULT 20,
    "personality" TEXT,
    "systemPrompt" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "importedFrom" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Agent" ("createdAt", "goal", "id", "isLive", "minO2", "mode", "name", "personality", "specialties", "userId") SELECT "createdAt", "goal", "id", "isLive", "minO2", "mode", "name", "personality", "specialties", "userId" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "o2Budget" REAL NOT NULL,
    "timeLimit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assessment" TEXT,
    "output" TEXT,
    "postedById" TEXT,
    "acceptedById" TEXT,
    "agentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Job_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("acceptedById", "agentId", "assessment", "category", "createdAt", "description", "id", "o2Budget", "postedById", "status", "timeLimit", "title") SELECT "acceptedById", "agentId", "assessment", "category", "createdAt", "description", "id", "o2Budget", "postedById", "status", "timeLimit", "title" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
