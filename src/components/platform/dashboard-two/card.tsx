import Image from "next/image";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const popularContent = [
  {
    id: 1,
    title: "JavaScript Tutorial",
    badge: "Coding",
    image: "/contributors/1.jpg",
    count: 4300,
  },
  {
    id: 2,
    title: "Tech Trends 2025",
    badge: "Tech",
    image: "/contributors/2.jpg",
    count: 3200,
  },
  {
    id: 3,
    title: "The Future of AI",
    badge: "AI",
    image: "/contributors/3.jpg",
    count: 2400,
  },
  {
    id: 4,
    title: "React Hooks Explained",
    badge: "Coding",
    image: "/contributors/4.png",
    count: 1500,
  },
  {
    id: 5,
    title: "Image Generation with AI",
    badge: "AI",
    image: "/contributors/5.jpg",
    count: 1200,
  },
];

const latestTransactions = [
  {
    id: 1,
    title: "Subscription Renewal",
    badge: "John Doe",
    image: "/contributors/6.jpg",
    count: 1400,
  },
  {
    id: 2,
    title: "Payment for Services",
    badge: "Jane Smith",
    image: "/contributors/a.jpg",
    count: 2100,
  },
  {
    id: 3,
    title: "Subscription Renewal",
    badge: "Michael Johnson",
    image: "/contributors/aa.jpeg",
    count: 1300,
  },
  {
    id: 4,
    title: "Payment for Services",
    badge: "Lily Adams",
    image: "/contributors/abdout.jpg",
    count: 2500,
  },
  {
    id: 5,
    title: "Subscription Renewal",
    badge: "Sam Brown",
    image: "/contributors/c.jpeg",
    count: 1400,
  },
];

export default function DashboardCard({ title }: { title: string }) {
  const list =
    title === "Popular Content" ? popularContent : latestTransactions;
  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      <div className="flex flex-col gap-2">
        {list.map((item) => (
          <Card key={item.id} className="flex-row items-center justify-between gap-4 p-4">
            <div className="w-12 h-12 rounded-sm relative overflow-hidden">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <CardContent className="flex-1 p-0">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Badge variant="secondary">{item.badge}</Badge>
            </CardContent>
            <CardFooter className="p-0">{item.count / 1000}K</CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
