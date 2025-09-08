"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { getSubjectCategoryColor } from "./subject-colors";
import { cn } from "@/lib/utils";

interface StaffDashboardProps {
  data: any
}

export default function StaffDashboard({ data }: StaffDashboardProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  return (
    <div className=" rounded-lg p-6">
      <h3 className="mb-4 flex items-center">
        <span className="mr-2">👨‍💼</span>
        Staff Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="text-[#39d353] mb-2">Department Overview</h4>
          <div className="space-y-2 muted">
            <div className="flex justify-between">
              <span>Total Students</span>
              <span className="text-[#1f6feb]">1,247</span>
            </div>
            <div className="flex justify-between">
              <span>Total Teachers</span>
              <span className="text-[#1f6feb]">89</span>
            </div>
            <div className="flex justify-between">
              <span>Total Classes</span>
              <span className="text-[#1f6feb]">156</span>
            </div>
          </div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="text-[#ffa000] mb-2">Pending Requests</h4>
          <h3 className="text-[#f85149]">12</h3>
          <p className="muted">Administrative Tasks</p>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="text-[#a259ff] mb-2">Attendance Rate</h4>
          <h3 className="text-[#39d353]">94.2%</h3>
          <p className="muted">School Average</p>
        </div>
      </div>

      {/* Subject Distribution Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="mb-4">Subject Distribution</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Mathematics", true)
          )}>
            <div className="font-medium">Mathematics</div>
            <p className="muted">8 Teachers • 24 Classes</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Science", true)
          )}>
            <div className="font-medium">Science</div>
            <p className="muted">12 Teachers • 32 Classes</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("English", true)
          )}>
            <div className="font-medium">English</div>
            <p className="muted">10 Teachers • 28 Classes</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("History", true)
          )}>
            <div className="font-medium">History</div>
            <p className="muted">6 Teachers • 18 Classes</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Art", true)
          )}>
            <div className="font-medium">Art</div>
            <p className="muted">4 Teachers • 12 Classes</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Physical Education", true)
          )}>
            <div className="font-medium">Physical Education</div>
            <p className="muted">5 Teachers • 15 Classes</p>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="mb-4">Recent Activities</h4>
        <div className="space-y-3">
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Computer Science", true)
          )}>
            <div>
              <div className="font-medium">New Computer Lab Setup</div>
              <p className="muted">Technology Department • Completed</p>
            </div>
            <div className="text-right">
              <p className="muted">Dec 15</p>
              <p className="muted">On Time</p>
            </div>
          </div>
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Science", true)
          )}>
            <div>
              <div className="font-medium">Science Fair Planning</div>
              <p className="muted">Science Department • In Progress</p>
            </div>
            <div className="text-right">
              <p className="muted">Dec 20</p>
              <p className="muted">Due Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
