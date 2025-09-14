import JoinContent from "@/components/onboarding/join/content";

export const metadata = {
  title: "Join | Onboarding",
  description: "Join your school community.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Join({ params }: PageProps) {
  return <JoinContent params={params} />;
}