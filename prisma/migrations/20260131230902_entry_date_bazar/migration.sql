/*
  Warnings:

  - Added the required column `bazar` to the `Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entryDate` to the `Entry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "familyId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "bazar" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Entry_number_fkey" FOREIGN KEY ("number") REFERENCES "Number" ("number") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Entry" ("amount", "createdAt", "familyId", "id", "number") SELECT "amount", "createdAt", "familyId", "id", "number" FROM "Entry";
DROP TABLE "Entry";
ALTER TABLE "new_Entry" RENAME TO "Entry";
CREATE INDEX "Entry_number_idx" ON "Entry"("number");
CREATE INDEX "Entry_familyId_idx" ON "Entry"("familyId");
CREATE INDEX "Entry_entryDate_idx" ON "Entry"("entryDate");
CREATE INDEX "Entry_bazar_idx" ON "Entry"("bazar");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
