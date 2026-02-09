import type { Metadata } from "next";
import { requireProUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};
import Navbar from '@/components/dashboard/Navbar';
import WelcomeHeader from '@/components/dashboard/WelcomeHeader';
import TodayBox from '@/components/dashboard/TodayBox';
import ComingDays from '@/components/dashboard/ComingDays';
import ExamManagement from '@/components/dashboard/ExamManagement';
import Footer from '@/components/dashboard/Footer';

/**
 * Dashboard - PROTECTED by PRO subscription
 * Users without active PRO subscription are automatically redirected to /upgrade
 */
export default async function Dashboard() {
  // CRITICAL: This will redirect to /upgrade if user doesn't have active PRO subscription
  const user = await requireProUser();




  return (
    <div>
      <Navbar/>
      <div className="max-w-7xl mx-auto px-6">
        <WelcomeHeader firstName={user.firstName} />
        <TodayBox/>
        <ComingDays/>
        <ExamManagement/>
      </div>
    </div>
  );
}