import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutLauncher } from "@/components/marketing/pricing/CheckoutLauncher";

function getSearchParam(searchParams: Record<string, string | string[] | undefined>, key: string): string | null {
  const v = searchParams[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function assertNonEmpty(value: string | null | undefined): asserts value is string {
  if (!value) throw new Error("Missing required parameter");
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const price = getSearchParam(resolvedSearchParams, "price");
  assertNonEmpty(price);

  return <CheckoutLauncher price={price} />;
}

