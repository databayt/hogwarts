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
      <h3 className="mb-4 flex items-center">
        <span className="me-2">🎓</span>
        Student Dashboard
      </h3>

      <div className={`grid gap-4 ${useMobileLayout ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className=" rounded-lg p-4">
          <h4 className="text-green-500 mb-2">Upcoming Assignments</h4>
          <div className="space-y-2 muted">
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("Mathematics", true)
            )}>
              <span className="font-medium">Math Quiz</span>
              <span className="text-orange-500">Due: Dec 20</span>
            </div>
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("Science", true)
            )}>
              <span className="font-medium">Science Project</span>
              <span className="text-red-500">Due: Dec 18</span>
            </div>
            <div className={cn(
              "flex justify-between p-2 rounded-md transition-all duration-200",
              getSubjectCategoryColor("History", true)
            )}>
              <span className="font-medium">History Essay</span>
              <span className="text-green-500">Due: Dec 25</span>
            </div>
          </div>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="text-blue-500 mb-2">Current GPA</h4>
          <h3 className="text-green-500">3.8</h3>
          <p className="muted">Semester Average</p>
        </div>

        <div className=" rounded-lg p-4">
          <h4 className="text-purple-500 mb-2">Attendance</h4>
          <h3 className="text-green-500">95%</h3>
          <p className="muted">This Month</p>
        </div>
      </div>

      {/* Subject Performance Section */}
      <div className="mt-6 rounded-lg p-4">
        <h4 className="mb-4">Subject Performance</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Mathematics", true)
          )}>
            <h6>Mathematics</h6>
            <p className="muted">Grade: A- (90%)</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Science", true)
          )}>
            <h6>Science</h6>
            <p className="muted">Grade: A (95%)</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("English", true)
          )}>
            <h6>English</h6>
            <p className="muted">Grade: B+ (87%)</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("History", true)
          )}>
            <h6>History</h6>
            <p className="muted">Grade: A- (91%)</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Art", true)
          )}>
            <h6>Art</h6>
            <p className="muted">Grade: A (96%)</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg transition-all duration-200",
            getSubjectCategoryColor("Physical Education", true)
          )}>
            <h6>Physical Education</h6>
            <p className="muted">Grade: A+ (98%)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
