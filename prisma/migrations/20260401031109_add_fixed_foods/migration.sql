-- CreateTable
CREATE TABLE "FixedFood" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedFood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixedFood_userId_idx" ON "FixedFood"("userId");

-- AddForeignKey
ALTER TABLE "FixedFood" ADD CONSTRAINT "FixedFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedFood" ADD CONSTRAINT "FixedFood_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
