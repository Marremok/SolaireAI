-- DropForeignKey
ALTER TABLE "exams" DROP CONSTRAINT "exams_userId_fkey";

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
