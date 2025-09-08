"use client";

import Image from "next/image"
import { useSidebar } from "@/components/ui/sidebar";

interface ProfileSidebarProps {
  role: "student" | "teacher" | "staff" | "parent"
  data: any
}

export default function ProfileSidebar({ role, data }: ProfileSidebarProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  const getRoleInfo = () => {
    switch (role) {
      case "student":
        return {
          title: `${data.givenName} ${data.surname}`,
          subtitle: `Student ID: ${data.id}`,
          description: "Student",
          icon: "📚",
          imageSrc: "/contributors/h.jpeg"
        }
      case "teacher":
        return {
          title: `${data.givenName} ${data.surname}`,
          subtitle: `Teacher ID: ${data.id}`,
          description: "Teacher",
          icon: "👩‍🏫",
          imageSrc: "/contributors/d.jpeg"
        }
      case "staff":
        return {
          title: `${data.givenName} ${data.surname}`,
          subtitle: `Staff ID: ${data.id}`,
          description: "Staff Member",
          icon: "👨‍💼",
          imageSrc: "/contributors/d.jpeg"
        }
      case "parent":
        return {
          title: `${data.givenName} ${data.surname}`,
          subtitle: `Parent ID: ${data.id}`,
          description: "Parent/Guardian",
          icon: "👨‍👩‍👧‍👦",
          imageSrc: "/contributors/d.jpeg"
        }
      default:
        return {
          title: "Unknown",
          subtitle: "ID: Unknown",
          description: "Unknown Role",
          icon: "❓",
          imageSrc: "/contributors/d.jpeg"
        }
    }
  }

  const roleInfo = getRoleInfo()

  return (
    <div className="space-y-4">
      {/* Profile Image */}
      <div className="relative">
        <div className="w-64 h-64 rounded-full overflow-hidden border-2 border-border">
          <Image
            src={roleInfo.imageSrc}
            alt={`${roleInfo.description} Profile`}
            width={256}
            height={256}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-6 right-6 w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-border">
          <span>😀
          </span>
        </div>
      </div>

      {/* User Info */}
      <div>
        <h1 className="text-foreground mb-1">{roleInfo.title}</h1>
        <p className="muted mb-2">{roleInfo.subtitle}</p>
        <p className="muted mb-2">{roleInfo.description}</p>
        <p className="muted">Academic Year: 2024-25</p>
      </div>

      {/* Action Button */}
      <button className="w-full bg-muted hover:bg-muted-foreground/10 text-foreground py-2 px-4 rounded-lg transition-colors">
        View Full Profile
      </button>

      {/* Academic Stats */}
      <div className="flex space-x-4 muted">
        <span className="text-muted-foreground">
          <span className="text-foreground">8</span> subjects
        </span>
        <span className="text-muted-foreground">
          <span className="text-foreground">12</span> projects
        </span>
      </div>

      {/* Achievement Badges */}
      <div className="flex space-x-2 mt-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center" title="Honor Roll">
          <span>🏆</span>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          title="Perfect Attendance"
        >
          <span>📅</span>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          title="Science Fair Winner"
        >
          <span>🔬</span>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" title="GPA">
          <span>3.8</span>
        </div>
      </div>
    </div>
  )
}
