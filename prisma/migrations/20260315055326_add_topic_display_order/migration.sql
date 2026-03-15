-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "youtubeUrl" TEXT;

-- CreateTable
CREATE TABLE "TopicDisplay" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "TopicDisplay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicDisplay_topicId_key" ON "TopicDisplay"("topicId");

-- CreateIndex
CREATE INDEX "TopicDisplay_category_displayOrder_idx" ON "TopicDisplay"("category", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TopicDisplay_category_displayOrder_key" ON "TopicDisplay"("category", "displayOrder");

-- AddForeignKey
ALTER TABLE "TopicDisplay" ADD CONSTRAINT "TopicDisplay_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
