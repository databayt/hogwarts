import ProfileSidebar from "@/components/profile-sidebar"
import ProfileHeader from "@/components/profile-header"
import ProjectGrid from "@/components/project-grid"
import ActivityGraph from "@/components/activity-graph"
import ActivityOverview from "@/components/activity-overview"

// Role-specific components
import StudentDashboard from "@/components/roles/student-dashboard"
import TeacherDashboard from "@/components/roles/teacher-dashboard"
import StaffDashboard from "@/components/roles/staff-dashboard"
import ParentDashboard from "@/components/roles/parent-dashboard"

export default function SchoolProfile() {
  // This would come from authentication/context in real implementation
  const userRole = "student" // student | teacher | staff | parent

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#ffffff]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Shared across all roles */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shared Header */}
            <ProfileHeader />

            {/* Role-specific content */}
            {userRole === "student" && <StudentDashboard />}
            {userRole === "teacher" && <TeacherDashboard />}
            {userRole === "staff" && <StaffDashboard />}
            {userRole === "parent" && <ParentDashboard />}

            {/* Shared components */}
            <ProjectGrid />
            <ActivityGraph />
            <ActivityOverview />

            {/* Current Period Section */}
            <div className="bg-[#212830] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">December 2024</h3>
              <p className="text-[#9198a1] text-center py-8">No activity recorded for this period.</p>
              <button className="w-full bg-[#212830] border border-[#3d444d] rounded-lg py-3 text-[#ffffff] hover:bg-[#3d444d] transition-colors">
                Show more activity
              </button>
            </div>

            <p className="text-[#9198a1] text-sm text-center">
              Need help navigating the system? Check out the{" "}
              <a href="#" className="text-[#1f6feb] hover:underline">
                school portal guide
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
