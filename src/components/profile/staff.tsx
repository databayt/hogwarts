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
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">👨‍💼</span>
        Staff Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#39d353] mb-2">Department Overview</h4>
          <div className="space-y-2 text-sm">
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
          <h4 className="font-semibold text-[#ffa000] mb-2">Pending Requests</h4>
          <div className="text-2xl font-bold text-[#f85149]">12</div>
          <div className="text-sm text-muted-foreground">Administrative Tasks</div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#a259ff] mb-2">Attendance Rate</h4>
          <div className="text-2xl font-bold text-[#39d353]">94.2%</div>
          <div className="text-sm text-muted-foreground">School Average</div>
        </div>
      </div>

      {/* Subject Distribution Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="font-semibold text-lg mb-4">Subject Distribution</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Mathematics", true)
          )}>
            <div className="font-medium">Mathematics</div>
            <div className="text-sm text-muted-foreground">8 Teachers • 24 Classes</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Science", true)
          )}>
            <div className="font-medium">Science</div>
            <div className="text-sm text-muted-foreground">12 Teachers • 32 Classes</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("English", true)
          )}>
            <div className="font-medium">English</div>
            <div className="text-sm text-muted-foreground">10 Teachers • 28 Classes</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("History", true)
          )}>
            <div className="font-medium">History</div>
            <div className="text-sm text-muted-foreground">6 Teachers • 18 Classes</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Art", true)
          )}>
            <div className="font-medium">Art</div>
            <div className="text-sm text-muted-foreground">4 Teachers • 12 Classes</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Physical Education", true)
          )}>
            <div className="font-medium">Physical Education</div>
            <div className="text-sm text-muted-foreground">5 Teachers • 15 Classes</div>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="font-semibold text-lg mb-4">Recent Activities</h4>
        <div className="space-y-3">
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Computer Science", true)
          )}>
            <div>
              <div className="font-medium">New Computer Lab Setup</div>
              <div className="text-sm text-muted-foreground">Technology Department • Completed</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Dec 15</div>
              <div className="text-xs text-muted-foreground">On Time</div>
            </div>
          </div>
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Science", true)
          )}>
            <div>
              <div className="font-medium">Science Fair Planning</div>
              <div className="text-sm text-muted-foreground">Science Department • In Progress</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Dec 20</div>
              <div className="text-xs text-muted-foreground">Due Soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
