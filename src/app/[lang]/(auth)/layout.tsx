import { auth } from "@/auth";
import { redirect } from "next/navigation";

const AuthLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) => {
  // Redirect logged-in users away from auth pages
  const session = await auth();
  if (session?.user) {
    const { lang } = await params;
    redirect(`/${lang}/dashboard`);
  }

  return (
    <div className="h-screen max-w-sm mx-auto flex items-center justify-center px-6">
      {children}
    </div>
  );
};

export default AuthLayout;