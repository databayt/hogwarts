"use client";

import { useSidebar } from "@/components/ui/sidebar";

interface StaffDashboardProps {
  data: any
}

export default function StaffDashboard({ data }: StaffDashboardProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  return (
    <div className=" rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">👨‍💼</span>
        Staff Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#39d353] mb-2">Today's Tasks</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Faculty Meeting</span>
              <span className="text-[#1f6feb]">10:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span>Budget Review</span>
              <span className="text-[#ffa000]">2:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>Parent Calls</span>
              <span className="text-[#a259ff]">4:00 PM</span>
            </div>
          </div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#1f6feb] mb-2">Pending Requests</h4>
          <div className="text-2xl font-bold text-[#ffa000]">8</div>
          <div className="text-sm text-muted-foreground">Require Approval</div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#a259ff] mb-2">Department</h4>
          <div className="text-lg font-bold text-[#39d353]">Administration</div>
          <div className="text-sm text-muted-foreground">Academic Affairs</div>
        </div>
      </div>
    </div>
  )
}
