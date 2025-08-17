"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { getSubjectCategoryColor } from "./subject-colors";
import { cn } from "@/lib/utils";

interface StudentDashboardProps {
  data: any
}

export default function StudentDashboard({ data }: StudentDashboardProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  return (
    <div className=" rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">🎓</span>
        Student Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#39d353] mb-2">Upcoming Assignments</h4>
          <div className="space-y-2 text-sm">
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("Mathematics", true)
            )}>
              <span className="font-medium">Math Quiz</span>
              <span className="text-[#ffa000]">Due: Dec 20</span>
            </div>
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("Science", true)
            )}>
              <span className="font-medium">Science Project</span>
              <span className="text-[#f85149]">Due: Dec 18</span>
            </div>
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("History", true)
            )}>
              <span className="font-medium">History Essay</span>
              <span className="text-[#39d353]">Due: Dec 25</span>
            </div>
          </div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#1f6feb] mb-2">Current GPA</h4>
          <div className="text-2xl font-bold text-[#39d353]">3.8</div>
          <div className="text-sm text-muted-foreground">Semester Average</div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="font-semibold text-[#a259ff] mb-2">Attendance</h4>
          <div className="text-2xl font-bold text-[#39d353]">95%</div>
          <div className="text-sm text-muted-foreground">This Month</div>
        </div>
      </div>

      {/* Subject Performance Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="font-semibold text-lg mb-4">Subject Performance</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Mathematics", true)
          )}>
            <div className="font-medium">Mathematics</div>
            <div className="text-sm text-muted-foreground">Grade: A- (90%)</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Science", true)
          )}>
            <div className="font-medium">Science</div>
            <div className="text-sm text-muted-foreground">Grade: A (95%)</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("English", true)
          )}>
            <div className="font-medium">English</div>
            <div className="text-sm text-muted-foreground">Grade: B+ (87%)</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("History", true)
          )}>
            <div className="font-medium">History</div>
            <div className="text-sm text-muted-foreground">Grade: A- (91%)</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Art", true)
          )}>
            <div className="font-medium">Art</div>
            <div className="text-sm text-muted-foreground">Grade: A (96%)</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Physical Education", true)
          )}>
            <div className="font-medium">Physical Education</div>
            <div className="text-sm text-muted-foreground">Grade: A+ (98%)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
