import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import ProfileContent from "@/components/profile/content";

export default async function ParentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { schoolId } = await getTenantContext();
  if (!schoolId || !(db as any).guardian) return notFound();
  
  const parent = await (db as any).guardian.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      emailAddress: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (!parent) return notFound();

  return <ProfileContent role="parent" data={parent} />;
}

export const metadata = { title: "Dashboard: Parent" };
