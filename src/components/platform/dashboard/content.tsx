import { currentUser } from "@/components/auth/auth";
import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { DashboardHeader } from "@/components/platform/dashboard/header";
import { StudentDashboard } from "./dashboards/student-dashboard";
import { TeacherDashboard } from "./dashboards/teacher-dashboard";
import { ParentDashboard } from "./dashboards/parent-dashboard";
import { StaffDashboard } from "./dashboards/staff-dashboard";
import { AdminDashboard } from "./dashboards/admin-dashboard";
import { PrincipalDashboard } from "./dashboards/principal-dashboard";
import { AccountantDashboard } from "./dashboards/accountant-dashboard";

export const metadata = constructMetadata({
  title: "Dashboard – Hogwarts School",
  description: "Your personalized dashboard based on your role.",
});

export default async function DashboardContent() {
  const user = await currentUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your dashboard.</p>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
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
        heading={`${user.role.charAt(0) + user.role.slice(1).toLowerCase()} Dashboard`}
        text={`Welcome back! Here's your personalized dashboard.`}
      />
      {renderDashboard()}
    </div>
  );
}

function DefaultDashboard({ user }: { user: any }) {
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Dashboard Coming Soon</h3>
        <p className="text-muted-foreground">
          We're working on a personalized dashboard for your role ({user.role}). 
          Check back soon for updates!
        </p>
      </div>
    </div>
  );
}
