import { StickyScroll } from "@/components/atom/sticky-scroll";
       
export default function AboutContent() {
  return (
    <div>
             
    <StickyScroll content={aboutContent} />
    </div>
  );
}



const aboutContent = [
  {
    title: "The Castle of Hogwarts",
    description:
      "Founded over a thousand years ago by the four greatest witches and wizards of the age, Hogwarts School of Witchcraft and Wizardry stands as a magnificent castle in the Scottish Highlands. Our ancient walls have witnessed countless magical moments and housed generations of extraordinary students.",
    content: (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
        <img
          src="/a.jpeg"
          width={400}
          height={300}
          className="h-full w-full object-cover"
          alt="Harry Potter in the magical world"
        />
      </div>
    ),
  },
  {
    title: "The Great Hall",
    description:
      "The heart of Hogwarts, where students gather for meals, celebrations, and the annual Sorting Ceremony. The enchanted ceiling reflects the sky above, and floating candles provide a magical ambiance. This is where house unity and school pride flourish.",
    content: (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
        <img
          src="/c.jpeg"
          width={400}
          height={300}
          className="h-full w-full object-cover"
          alt="The trio of friends at Hogwarts"
        />
      </div>
    ),
  },
  {
    title: "Gryffindor House",
    description:
      "Home to the brave and daring, Gryffindor House values courage, chivalry, and determination. Founded by Godric Gryffindor, this house has produced some of the most famous witches and wizards, including Harry Potter himself.",
    content: (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-destructive to-primary">
        <img
          src="/d.jpeg"
          width={400}
          height={300}
          className="h-full w-full object-cover"
          alt="Students in Hogwarts uniforms"
        />
      </div>
    ),
  },
  {
    title: "Magical Studies",
    description:
      "From Herbology in the greenhouses to Defense Against the Dark Arts, Hogwarts offers a comprehensive magical education. Students learn to brew potions, cast spells, and understand the mysteries of the magical world under expert guidance.",
    content: (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-secondary to-muted">
        <img
          src="/b.jpeg"
          width={400}
          height={300}
          className="h-full w-full object-cover"
          alt="Students learning magical studies"
        />
      </div>
    ),
  },
  {
    title: "The Bonds of Friendship",
    description:
      "At Hogwarts, friendships are forged that last a lifetime. Through shared adventures, challenges, and magical discoveries, students form unbreakable bonds that support them through their darkest hours and greatest triumphs.",
    content: (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-accent">
        <img
          src="/e.jpeg"
          width={400}
          height={300}
          className="h-full w-full object-cover"
          alt="The enduring friendship of Harry, Ron, and Hermione"
        />
      </div>
    ),
  },
  {
    title: "Quidditch Pitch",
    description:
      "The magical sport of Quidditch brings excitement and house rivalry to new heights. Our pitch has witnessed legendary matches and continues to be where young witches and wizards discover their passion for flying and the thrill of chasing the Golden Snitch.",
    content: (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-accent to-secondary">
        <img
          src="/ball.png"
          width={400}
          height={300}
          className="h-full w-full object-contain p-8"
          alt="Golden Snitch - the heart of Quidditch"
        />
      </div>
    ),
  },
];

