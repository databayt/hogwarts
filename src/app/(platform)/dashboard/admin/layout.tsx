import { notFound, redirect } from "next/navigation";

import { currentUser } from "@/components/auth/auth";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return <>{children}</>;
}
