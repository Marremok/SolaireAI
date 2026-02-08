-- DropForeignKey
ALTER TABLE "study_sessions" DROP CONSTRAINT "study_sessions_userId_fkey";

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
