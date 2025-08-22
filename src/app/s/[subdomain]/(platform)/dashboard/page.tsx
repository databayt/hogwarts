import DashboardContent from "@/components/platform/dashboard/content";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { notFound } from "next/navigation";

interface DashboardPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { subdomain } = await params;
  console.log('DashboardPage - params:', { subdomain });
  
  const result = await getSchoolBySubdomain(subdomain);
  console.log('DashboardPage - getSchoolBySubdomain result:', result);

  if (!result.success || !result.data) {
    console.error('School not found for subdomain:', subdomain, result);
    notFound();
  }

  const school = result.data;
  console.log('DashboardPage - school data:', school);

  return <DashboardContent school={school} />;
}