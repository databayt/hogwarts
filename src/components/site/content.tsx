import { Hero } from "./hero";
import { Core } from "./core";
import { Features } from "./features";
import { Testimonials } from "./testimonials";
import { Houses } from "./houses";
import LetsWorkTogether from "./lets-work-together";
import Footer from "./footer";
import LogoCloud from "./logo-cloud";
import Newsletter from "./newsletter";
import FAQs from "./faqs";
import { Faculty } from "./faculty";
import { SpecialOffers } from "./offer";
import EventCard from "./event";
import { BackgroundGradientAnimationDemo } from "./ready";
import { NewComers } from "./new-comers";
import { CTA } from "./admission-process";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface School {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  timezone?: string;
  planType?: string;
  maxStudents?: number;
  maxTeachers?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SiteProps {
  school: School; // Required - we always pass school data now
  dictionary: Dictionary;
  lang: Locale;
  subdomain?: string;
}

export default function SiteContent({ school, dictionary, lang, subdomain }: SiteProps) {
  const subdomainValue = subdomain || school.domain;

  return (
    <div>
      <Hero lang={lang} subdomain={subdomainValue} />
      <Houses />
      <Features />
      <Core />
      <Faculty />
      <Testimonials />
      <CTA />
      <SpecialOffers />
      <LogoCloud />
      <EventCard />
      <LetsWorkTogether />
      <BackgroundGradientAnimationDemo lang={lang} subdomain={subdomainValue} />
      <Newsletter />
      <FAQs />
      <NewComers />
      <Footer />
    </div>
  );
}