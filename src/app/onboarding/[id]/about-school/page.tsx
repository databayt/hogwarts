import AboutSchoolContent from "@/components/onboarding/about-school/content";
import { ListingProvider } from '@/components/onboarding/use-listing';

export const metadata = {
  title: "About Your School",
};

export default function AboutSchool() {
  return (
    <ListingProvider>
      <AboutSchoolContent />
    </ListingProvider>
  );
}