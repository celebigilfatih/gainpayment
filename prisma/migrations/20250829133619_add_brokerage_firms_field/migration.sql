/*
  Warnings:

  - You are about to drop the column `brokerageFirm` on the `Client` table. All the data in the column will be lost.
  - Added the required column `acquisitionDate` to the `Investment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brokerageFirm` to the `Investment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "city" TEXT,
    "brokerageFirms" TEXT NOT NULL DEFAULT '[]',
    "referralSource" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "cashPosition" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("cashPosition", "city", "createdAt", "fullName", "id", "notes", "phoneNumber", "referralSource", "updatedAt", "userId") SELECT "cashPosition", "city", "createdAt", "fullName", "id", "notes", "phoneNumber", "referralSource", "updatedAt", "userId" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE TABLE "new_Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockName" TEXT NOT NULL,
    "brokerageFirm" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL DEFAULT '',
    "acquisitionDate" DATETIME NOT NULL,
    "quantityLots" REAL NOT NULL,
    "acquisitionCost" REAL NOT NULL,
    "currentValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Investment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Investment" ("acquisitionCost", "clientId", "createdAt", "currentValue", "id", "quantityLots", "stockName", "stockSymbol", "updatedAt") SELECT "acquisitionCost", "clientId", "createdAt", "currentValue", "id", "quantityLots", "stockName", "stockSymbol", "updatedAt" FROM "Investment";
DROP TABLE "Investment";
ALTER TABLE "new_Investment" RENAME TO "Investment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
