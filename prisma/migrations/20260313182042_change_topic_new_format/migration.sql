/*
  Warnings:

  - You are about to drop the column `contentType` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Topic` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[telegraphPath]` on the table `Topic` will be added. If there are existing duplicate values, this will fail.
  - Made the column `telegraphPath` on table `Topic` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Topic_slug_key";

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "contentType",
DROP COLUMN "published",
DROP COLUMN "slug",
DROP COLUMN "summary",
DROP COLUMN "tags",
DROP COLUMN "title",
ALTER COLUMN "telegraphPath" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Topic_telegraphPath_key" ON "Topic"("telegraphPath");
