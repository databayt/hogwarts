import { currentUser } from "@/components/auth/auth";
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { StudentDashboard } from "./dashboards/student-dashboard";
import { TeacherDashboard } from "./dashboards/teacher-dashboard";
import { ParentDashboard } from "./dashboards/parent-dashboard";
import { StaffDashboard } from "./dashboards/staff-dashboard";
import { AdminDashboard } from "./dashboards/admin-dashboard";
import { PrincipalDashboard } from "./dashboards/principal-dashboard";
import { AccountantDashboard } from "./dashboards/accountant-dashboard";
import { TenantLoginRedirect } from "@/components/auth/tenant-login-redirect";
import type { School } from "@/components/site/types";

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string;
  email?: string | null;
  role?: string;
  schoolId?: string | null;
};

interface DashboardContentProps {
  school?: School; // Make school prop optional
}

export default async function DashboardContent({ school }: DashboardContentProps = {}) {
  // Debug logging
  console.log('DashboardContent - school prop:', school);
  
  const user = await currentUser() as ExtendedUser | null;
  console.log('DashboardContent - user:', user);

  // If no user, show login component
  if (!user) {
    console.log('DashboardContent - no user found, showing login');
    return (
      <TenantLoginRedirect 
        subdomain={school?.domain || 'unknown'} 
        className="max-w-md mx-auto mt-20"
      />
    );
  }

  // For now, use a default school name if not provided
  const schoolName = school?.name || "Your School";

  const renderDashboard = () => {
    const userRole = user.role || 'USER';
    switch (userRole) {
      case "STUDENT":
        return <StudentDashboard user={user} />;
      case "TEACHER":
        return <TeacherDashboard user={user} />;
      case "GUARDIAN":
        return <ParentDashboard user={user} />;
      case "STAFF":
        return <StaffDashboard user={user} />;
      case "ADMIN":
        return <AdminDashboard user={user} />;
      case "ACCOUNTANT":
        return <AccountantDashboard user={user} />;
      default:
        return <DefaultDashboard user={user} />;
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading={`${user.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'User'} Dashboard`}
        text={`Welcome to ${schoolName}! Here's your personalized dashboard.`}
      />
      {renderDashboard()}
    </div>
  );
}

function DefaultDashboard({ user }: { user: ExtendedUser }) {
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Dashboard Coming Soon</h3>
        <p className="text-muted-foreground">
          We're working on a personalized dashboard for your role ({user.role || 'Unknown'}). 
          Check back soon for updates!
        </p>
      </div>
    </div>
  );
}
