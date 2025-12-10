"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { School } from "../../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { resumeApplicationSession } from "../actions";

interface Props {
  school: School;
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
  initialToken?: string;
}

const continueSchema = z.object({
  email: z.string().email("Invalid email address"),
  sessionToken: z.string().optional(),
});

type ContinueFormData = z.infer<typeof continueSchema>;

export default function ContinueApplicationContent({
  school,
  dictionary,
  lang,
  subdomain,
  initialToken,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isRTL = lang === "ar";

  const form = useForm<ContinueFormData>({
    resolver: zodResolver(continueSchema),
    defaultValues: {
      email: "",
      sessionToken: initialToken || "",
    },
  });

  const onSubmit = async (data: ContinueFormData) => {
    setIsLoading(true);
    try {
      const result = await resumeApplicationSession(data.sessionToken || "");

      if (result.success && result.data) {
        // Redirect to the application form with the session token
        const campaignId = (result.data.formData as { campaignId?: string })?.campaignId || result.data.campaignId;
        if (campaignId) {
          router.push(
            `/${lang}/s/${subdomain}/apply/${campaignId}?token=${data.sessionToken}`
          );
        } else {
          toast.error(isRTL ? "لم يتم العثور على الحملة" : "Campaign not found");
        }
      } else {
        toast.error(result.error || (isRTL ? "لم يتم العثور على طلب محفوظ" : "No saved application found"));
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في استئناف الطلب" : "Failed to resume application");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-bold">
          {isRTL ? "استئناف طلبك" : "Continue Your Application"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isRTL
            ? "أدخل بريدك الإلكتروني لاستئناف طلبك المحفوظ"
            : "Enter your email to resume your saved application"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{school.name}</CardTitle>
          <CardDescription>
            {isRTL
              ? "يجب أن يكون البريد الإلكتروني مطابقاً للبريد المستخدم في الطلب الأصلي"
              : "Email must match the one used in your original application"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isRTL ? "البريد الإلكتروني" : "Email Address"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="example@email.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!initialToken && (
                <FormField
                  control={form.control}
                  name="sessionToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isRTL ? "رمز الجلسة (اختياري)" : "Session Token (Optional)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={isRTL ? "أدخل رمز الجلسة إذا كان لديك" : "Enter session token if you have one"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {isRTL ? "جارٍ البحث..." : "Searching..."}
                  </>
                ) : (
                  <>
                    {isRTL ? "استئناف الطلب" : "Resume Application"}
                    <ArrowRight className="w-4 h-4 ms-2" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {isRTL ? "ليس لديك طلب محفوظ؟" : "Don't have a saved application?"}
        </p>
        <Link href={`/${lang}/s/${subdomain}/apply`}>
          <Button variant="outline">
            {isRTL ? "بدء طلب جديد" : "Start New Application"}
          </Button>
        </Link>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">
            {isRTL ? "معلومات مهمة" : "Important Information"}
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              {isRTL
                ? "• يتم حفظ الطلبات تلقائياً كل 30 ثانية"
                : "• Applications are auto-saved every 30 seconds"}
            </li>
            <li>
              {isRTL
                ? "• تنتهي صلاحية الجلسات المحفوظة بعد 7 أيام"
                : "• Saved sessions expire after 7 days"}
            </li>
            <li>
              {isRTL
                ? "• يمكنك أيضاً استئناف من الرابط المرسل إلى بريدك الإلكتروني"
                : "• You can also resume from the link sent to your email"}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
