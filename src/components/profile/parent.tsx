"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { getSubjectCategoryColor } from "./subject-colors";
import { cn } from "@/lib/utils";

interface ParentDashboardProps {
  data: any
}

export default function ParentDashboard({ data }: ParentDashboardProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  return (
    <div className=" rounded-lg p-6">
      <h3 className="mb-4 flex items-center">
        <span className="mr-2">👨‍👩‍👧‍👦</span>
        Parent Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="text-[#39d353] mb-2">Children's Progress</h4>
          <div className="space-y-2 muted">
            <div className="flex justify-between">
              <span>Emma (Grade 10)</span>
              <span className="text-[#39d353]">GPA: 3.9</span>
            </div>
            <div className="flex justify-between">
              <span>Liam (Grade 8)</span>
              <span className="text-[#39d353]">GPA: 3.7</span>
            </div>
            <div className="flex justify-between">
              <span>Sophia (Grade 6)</span>
              <span className="text-[#39d353]">GPA: 4.0</span>
            </div>
          </div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="text-[#ffa000] mb-2">Upcoming Events</h4>
          <div className="text-2xl font-bold text-[#1f6feb]">5</div>
          <div className="muted">This Month</div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="text-[#a259ff] mb-2">Attendance</h4>
          <div className="text-2xl font-bold text-[#39d353]">97.5%</div>
          <div className="muted">Family Average</div>
        </div>
      </div>

      {/* Children's Subjects Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="mb-4">Children's Subjects</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Mathematics", true)
          )}>
            <div className="font-medium">Mathematics</div>
            <div className="muted">Emma: A • Liam: B+ • Sophia: A+</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Science", true)
          )}>
            <div className="font-medium">Science</div>
            <div className="muted">Emma: A- • Liam: A • Sophia: A</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("English", true)
          )}>
            <div className="font-medium">English</div>
            <div className="muted">Emma: A • Liam: B+ • Sophia: A</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("History", true)
          )}>
            <div className="font-medium">History</div>
            <div className="muted">Emma: A+ • Liam: A- • Sophia: A</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Art", true)
          )}>
            <div className="font-medium">Art</div>
            <div className="muted">Emma: A • Liam: A+ • Sophia: A+</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Physical Education", true)
          )}>
            <div className="font-medium">Physical Education</div>
            <div className="muted">Emma: A+ • Liam: A • Sophia: A</div>
          </div>
        </div>
      </div>

      {/* Recent Communications Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="mb-4">Recent Communications</h4>
        <div className="space-y-3">
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Computer Science", true)
          )}>
            <div>
              <div className="font-medium">Parent-Teacher Conference</div>
              <div className="muted">Emma's Math Teacher • Scheduled</div>
            </div>
            <div className="text-right">
              <div className="muted">Dec 18</div>
              <div className="text-xs muted">2:00 PM</div>
            </div>
          </div>
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Science", true)
          )}>
            <div>
              <div className="font-medium">Science Fair Invitation</div>
              <div className="muted">Liam's Science Class • Event</div>
            </div>
            <div className="text-right">
              <div className="muted">Dec 22</div>
              <div className="text-xs muted">6:00 PM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
