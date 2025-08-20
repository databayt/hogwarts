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

export default function HomeContent() {
  return (
    <div>
      <Hero />
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
      <BackgroundGradientAnimationDemo />
      <Newsletter />
      <FAQs />
      <NewComers />
      <Footer />
     



    </div>
  );
}
