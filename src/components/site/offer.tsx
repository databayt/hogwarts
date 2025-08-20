"use client";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "../atom/section-heading";

// Custom SVG Icons
const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
    <path fill="currentColor" d="M11.25 13v9h-4A3.25 3.25 0 0 1 4 18.75V13zM20 13v5.75A3.25 3.25 0 0 1 16.75 22h-4v-9zM14.5 2a3.25 3.25 0 0 1 2.738 5.002L19.75 7c.69 0 1.25.466 1.25 1.042v2.916c0 .576-.56 1.042-1.25 1.042l-7-.001V7h-1.5v4.999l-7 .001C3.56 12 3 11.534 3 10.958V8.042C3 7.466 3.56 7 4.25 7l2.512.002A3.25 3.25 0 0 1 12 3.174A3.24 3.24 0 0 1 14.5 2m-5 1.5a1.75 1.75 0 0 0-.144 3.494L9.5 7h1.75V5.25l-.006-.144A1.75 1.75 0 0 0 9.5 3.5m5 0a1.75 1.75 0 0 0-1.75 1.75V7h1.75a1.75 1.75 0 1 0 0-3.5"/>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
    <path fill="currentColor" fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8m-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4zm7.25-2.095c.478-.86.75-1.85.75-2.905a6 6 0 0 0-.75-2.906a4 4 0 1 1 0 5.811M15.466 20c.34-.588.535-1.271.535-2v-1a5.98 5.98 0 0 0-1.528-4H18a4 4 0 0 1 4 4v1a2 2 0 0 1-2 2z" clipRule="evenodd"/>
  </svg>
);

const StarShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5zm3.08 15L12 14.15L8.93 16l.81-3.5l-2.71-2.34l3.58-.31L12 6.55l1.39 3.29l3.58.31l-2.71 2.35z"/>
  </svg>
);

export function SpecialOffers() {
  const specialOffers = [
    {
      title: "Early Bird Special",
      description: "Apply before Jul 1st, to receive a 10% tuition discount",
      badge: "Limited Time",
      badgeColor: "bg-red-100 text-red-800",
      icon: <GiftIcon />
    },
    {
      title: "Sibling Discount",
      description: "Families with multiple students receive additional savings",
      badge: "Family Benefit",
      badgeColor: "bg-blue-100 text-blue-900",
      icon: <UsersIcon />
    },
    {
      title: "Merit Scholarships",
      description: "Outstanding students may qualify for academic scholarships",
      badge: "Academic Excellence",
      badgeColor: "bg-green-100 text-green-800",
      icon: <StarShieldIcon />
    }
  ];

  return (
    <div className="py-14">
      <div>
        <SectionHeading title="Benefits" description="Financial support options designed to make your wizarding journey more affordable." />
        

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-14 pl-14">
          {specialOffers.map((offer, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center pb-6">
                <div className={`${
                  index === 0 ? 'text-red-700' : 
                  index === 1 ? 'text-blue-800' : 
                  'text-green-700'
                }`}>
                  {offer.icon}
                </div>
              </div>
              <CardTitle className="text-xl font-bold pb-2 mr-14">
                {offer.title}
              </CardTitle>
              <div className="flex justify-center pb-2">
                <Badge className={`${offer.badgeColor} px-3 py-1`}>
                  {offer.badge}
                </Badge>
              </div>
              <div className="flex justify-start max-w-[220px]">
                <CardDescription className="leading-relaxed">
                  {offer.description}
                </CardDescription>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
