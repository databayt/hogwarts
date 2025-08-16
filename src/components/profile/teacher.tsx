"use client";

import { useSidebar } from "@/components/ui/sidebar";

interface TeacherDashboardProps {
  data: any
}

export default function TeacherDashboard({ data }: TeacherDashboardProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  return (
    <div className=" rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">👩‍🏫</span>
        Teacher Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#39d353] mb-2">Classes Today</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Math - Grade 10</span>
              <span className="text-[#1f6feb]">9:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span>Math - Grade 12</span>
              <span className="text-[#1f6feb]">11:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span>Advanced Math</span>
              <span className="text-[#1f6feb]">2:00 PM</span>
            </div>
          </div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#ffa000] mb-2">Pending Grades</h4>
          <div className="text-2xl font-bold text-[#f85149]">23</div>
          <div className="text-sm text-muted-foreground">Assignments to Grade</div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#a259ff] mb-2">Students</h4>
          <div className="text-2xl font-bold text-[#39d353]">127</div>
          <div className="text-sm text-muted-foreground">Total Enrolled</div>
        </div>
      </div>
    </div>
  )
}
