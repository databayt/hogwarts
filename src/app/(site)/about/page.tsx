import AboutContent from "@/components/site/about/content";

import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the history and mission of Hogwarts School of Witchcraft and Wizardry.",
  openGraph: {
    title: "About Hogwarts School",
    description: "Learn about the history and mission of Hogwarts School of Witchcraft and Wizardry.",
    type: "website",
  },
};

export default function About() {
  return (
    <div>
      <AboutContent />
    </div>
  );
}
