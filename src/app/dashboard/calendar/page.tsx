import { requireProUser } from '@/lib/auth';
import Navbar from '@/components/dashboard/Navbar';
import Footer from '@/components/dashboard/Footer';
import CalendarView from '@/components/dashboard/CalendarView';
import { Calendar } from 'lucide-react';

export default async function CalendarPage() {
  await requireProUser();

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-13">
            View and manage your study schedule
          </p>
        </div>

        {/* Calendar Component */}
        <div className="rounded-4xl border border-border/40 bg-background/40 backdrop-blur-xl p-8">
          <CalendarView />
        </div>
      </div>
      <Footer />
    </div>
  );
}
