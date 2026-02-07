import { requireProUser } from "@/lib/auth";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
import { ExamsList } from "@/components/dashboard/ExamsList";
import { AddExamDialog } from "@/components/dashboard/AddExamDialog";
import { GraduationCap } from "lucide-react";

export default async function ExamsPage() {
  await requireProUser();

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Exams</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-[52px]">
              Manage your exams and track your study progress
            </p>
          </div>
          <AddExamDialog />
        </div>

        {/* Exams Container */}
        <div className="rounded-[2.5rem] border border-border/40 bg-card/20 backdrop-blur-xl p-6 shadow-sm">
          <ExamsList />
        </div>
      </div>
      <Footer />
    </div>
  );
}
