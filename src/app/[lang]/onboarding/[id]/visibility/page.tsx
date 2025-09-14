import VisibilityContent from "@/components/onboarding/visibility/content";

export const metadata = {
  title: "Visibility | Onboarding",
  description: "Set your school's visibility settings.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Visibility({ params }: PageProps) {
  return <VisibilityContent params={params} />;
}