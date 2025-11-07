/*
  Warnings:

  - You are about to drop the `Option` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_questionId_fkey";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "options" TEXT[];

-- DropTable
DROP TABLE "Option";
