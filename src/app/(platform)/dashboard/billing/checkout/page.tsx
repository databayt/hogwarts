import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { generateUserStripe } from "@/components/marketing/pricing/actions/generate-user-stripe";
import { useEffect } from "react";

function getSearchParam(searchParams: Record<string, string | string[] | undefined>, key: string): string | null {
  const v = searchParams[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function assertNonEmpty(value: string | null | undefined): asserts value is string {
  if (!value) throw new Error("Missing required parameter");
}

export default async function CheckoutPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const price = getSearchParam(searchParams, "price");
  assertNonEmpty(price);

  return <CheckoutLauncher price={price} />;
}

function CheckoutLauncher({ price }: { price: string }) {
  "use client";
  useEffect(() => {
    const submit = async () => {
      try {
        await generateUserStripe(price);
      } catch {
        // Swallow; generateUserStripe will redirect on success. On error, stay here.
      }
    };
    void submit();
  }, [price]);

  return null;
}


