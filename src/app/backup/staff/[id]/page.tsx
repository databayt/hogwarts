import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/platform/operator/lib/tenant";
import ProfileContent from "@/components/profile/content";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { schoolId } = await getTenantContext();
  if (!schoolId) return notFound();
  
  // Try to find as teacher first
  let staff = await (db as any).teacher?.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      gender: true,
      emailAddress: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // If not found as teacher, try to find as other staff (you might need to adjust this based on your actual staff model)
  if (!staff) {
    // For now, we'll use a placeholder staff object
    // You can extend this to query other staff models as needed
    staff = {
      id,
      givenName: "Staff",
      surname: "Member",
      gender: "Unknown",
      emailAddress: "staff@school.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  if (!staff) return notFound();

  return <ProfileContent role="staff" data={staff} />;
}

export const metadata = { title: "Dashboard: Staff" };
