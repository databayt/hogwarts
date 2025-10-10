"use client";

import { useSidebar } from "@/components/ui/sidebar";
import ProfileSidebar from "./profile-sidebar"
import ProfileHeader from "./profile-header"
import StudentDashboard from "./student"
import TeacherDashboard from "./teacher"
import StaffDashboard from "./staff"
import ParentDashboard from "./parent"
import ActivityGraph from "./activity-graph"
import ActivityOverview from "./activity-overview"
import type { Locale } from "@/components/internationalization/config";

interface Props {
  role: "student" | "teacher" | "staff" | "parent"
  data: any
  dictionary?: any
  lang?: Locale
}

export default function ProfileContent({ role, data, dictionary, lang }: Props) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  // Mobile layout when: 
  // - On mobile device (isMobile = true)
  // - On desktop but sidebar is expanded (open = true)
  // Desktop layout when:
  // - On desktop and sidebar is collapsed (open = false)
  const useMobileLayout = isMobile || (open && !isMobile);
  
  const getRoleDashboard = () => {
    switch (role) {
      case "student":
        return <StudentDashboard data={data} />
      case "teacher":
        return <TeacherDashboard data={data} />
      case "staff":
        return <StaffDashboard data={data} />
      case "parent":
        return <ParentDashboard data={data} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {useMobileLayout ? (
          // Mobile/Expanded layout: Stack sidebar above content
          <div className="flex flex-col gap-6 pb-6">
            {/* Profile Sidebar - Left-aligned when stacked above content */}
            <div className="flex justify-start">
              <ProfileSidebar role={role} data={data} />
            </div>
            
            {/* Main Content - Full width below */}
            <div className="w-full space-y-6">
              {/* Shared Header */}
              <ProfileHeader role={role} data={data} />

              {/* Role-specific content */}
              {getRoleDashboard()}

              {/* Shared components */}
              {/* <ActivityGraph /> */}
              <ActivityOverview />

              {/* Current Period Section */}
              <div className=" rounded-lg py-6">
                <h3 className="mb-4">December 2024</h3>
                <p className="text-muted-foreground text-center py-8">No activity recorded for this period.</p>
                <button className="w-full bg-muted border border-border rounded-lg py-3 text-muted-foreground hover:bg-muted-foreground/10 transition-colors">
                  Show more activity
                </button>
              </div>

              <p className="muted text-center">
                Need help navigating the system? Check out the{" "}
                <a href="#" className="text-[#1f6feb] hover:underline">
                  school portal guide
                </a>
                .
              </p>
            </div>
          </div>
        ) : (
          // Desktop Collapsed layout: Sidebar + content side by side
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
            {/* Left Sidebar - Fixed width */}
            <div className="lg:col-span-1">
              <ProfileSidebar role={role} data={data} />
            </div>

            {/* Main Content - Takes remaining space */}
            <div className="lg:col-span-3 space-y-6">
              {/* Shared Header */}
              <ProfileHeader role={role} data={data} />

              {/* Role-specific content */}
              {getRoleDashboard()}

              {/* Shared components */}
              {/* <ActivityGraph /> */}
              <ActivityOverview />

              {/* Current Period Section */}
              <div className=" rounded-lg py-6">
                <h3 className="mb-4">December 2024</h3>
                <p className="text-muted-foreground text-center py-8">No activity recorded for this period.</p>
                <button className="w-full bg-muted border border-border rounded-lg py-3 text-muted-foreground hover:bg-muted-foreground/10 transition-colors">
                  Show more activity
                </button>
              </div>

              <p className="muted text-center">
                Need help navigating the system? Check out the{" "}
                <a href="#" className="text-[#1f6feb] hover:underline">
                  school portal guide
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
