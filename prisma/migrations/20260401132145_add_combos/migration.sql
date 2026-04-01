-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "isCombo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComboItem_comboId_idx" ON "ComboItem"("comboId");

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
