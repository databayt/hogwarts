"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { getSubjectCategoryColor } from "./subject-colors";
import { cn } from "@/lib/utils";

interface TeacherDashboardProps {
  data: any
}

export default function TeacherDashboard({ data }: TeacherDashboardProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  return (
    <div className=" rounded-lg p-6">
      <h3 className="mb-4 flex items-center">
        <span className="mr-2">👩‍🏫</span>
        Teacher Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="text-[#39d353] mb-2">Classes Today</h4>
          <div className="space-y-2 muted">
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("Mathematics", true)
            )}>
              <span className="font-medium">Math - Grade 10</span>
              <span className="text-[#1f6feb]">9:00 AM</span>
            </div>
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("Mathematics", true)
            )}>
              <span className="font-medium">Math - Grade 12</span>
              <span className="text-[#1f6feb]">11:00 AM</span>
            </div>
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("Mathematics", true)
            )}>
              <span className="font-medium">Advanced Math</span>
              <span className="text-[#1f6feb]">2:00 PM</span>
            </div>
          </div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="text-[#ffa000] mb-2">Pending Grades</h4>
          <h3 className="text-[#f85149]">23</h3>
          <p className="muted">Assignments to Grade</p>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="text-[#a259ff] mb-2">Students</h4>
          <h3 className="text-[#39d353]">127</h3>
          <p className="muted">Total Enrolled</p>
        </div>
      </div>

      {/* Teaching Schedule Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="mb-4">Teaching Schedule</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Mathematics", true)
          )}>
            <div className="font-medium">Mathematics</div>
            <p className="muted">3 Classes • 45 Students</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Physics", true)
          )}>
            <div className="font-medium">Physics</div>
            <p className="muted">2 Classes • 32 Students</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Computer Science", true)
          )}>
            <div className="font-medium">Computer Science</div>
            <p className="muted">1 Class • 28 Students</p>
          </div>
        </div>
      </div>

      {/* Recent Assignments Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="mb-4">Recent Assignments</h4>
        <div className="space-y-3">
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Mathematics", true)
          )}>
            <div>
              <div className="font-medium">Calculus Quiz</div>
              <p className="muted">Grade 12 • Due: Dec 22</p>
            </div>
            <div className="text-right">
              <p className="muted">15/23 Graded</p>
              <p className="muted">65% Complete</p>
            </div>
          </div>
          <div className={cn(
            "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Physics", true)
          )}>
            <div>
              <div className="font-medium">Mechanics Lab Report</div>
              <p className="muted">Grade 11 • Due: Dec 20</p>
            </div>
            <div className="text-right">
              <p className="muted">8/18 Graded</p>
              <p className="muted">44% Complete</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
