-- CreateTable
CREATE TABLE "Family" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "Number" (
    "number" TEXT NOT NULL PRIMARY KEY,
    "familyId" INTEGER NOT NULL,
    CONSTRAINT "Number_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplatePosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "section" TEXT NOT NULL,
    "col" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "number" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Entry_number_fkey" FOREIGN KEY ("number") REFERENCES "Number" ("number") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TemplatePosition_number_idx" ON "TemplatePosition"("number");

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePosition_section_col_row_key" ON "TemplatePosition"("section", "col", "row");

-- CreateIndex
CREATE INDEX "Entry_number_idx" ON "Entry"("number");
