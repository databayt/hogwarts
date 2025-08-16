"use client";

import { useSidebar } from "@/components/ui/sidebar";

interface ParentDashboardProps {
  data: any
}

export default function ParentDashboard({ data }: ParentDashboardProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  return (
    <div className=" rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">👨‍👩‍👧‍👦</span>
        Parent Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#39d353] mb-2">Children</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Rahul Sharma</span>
              <span className="text-[#39d353]">Grade 12</span>
            </div>
            <div className="flex justify-between">
              <span>Priya Sharma</span>
              <span className="text-[#1f6feb]">Grade 9</span>
            </div>
          </div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#1f6feb] mb-2">Notifications</h4>
          <div className="text-2xl font-bold text-[#ffa000]">3</div>
          <div className="text-sm text-muted-foreground">New Messages</div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#a259ff] mb-2">Next Meeting</h4>
          <div className="text-sm font-bold text-[#39d353]">Parent-Teacher</div>
          <div className="text-sm text-muted-foreground">Dec 22, 3:00 PM</div>
        </div>
      </div>
    </div>
  )
}
