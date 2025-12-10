"use client";

import { useState, useEffect } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Loader2, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import type { School } from "../../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { ApplicationStatus } from "../types";
import { requestStatusOTP, verifyStatusOTP, getApplicationStatus } from "../actions";
import StatusDisplay from "./status-display";

interface Props {
  school: School;
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
  initialToken?: string;
}

type Step = "request" | "verify" | "display";

const requestSchema = z.object({
  applicationNumber: z.string().min(1, "Application number is required"),
  email: z.string().email("Invalid email address"),
});

const verifySchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export default function StatusTrackerContent({
  school,
  dictionary,
  lang,
  subdomain,
  initialToken,
}: Props) {
  const [step, setStep] = useState<Step>(initialToken ? "display" : "request");
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(initialToken || null);
  const [applicationNumber, setApplicationNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const isRTL = lang === "ar";

  const requestForm = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      applicationNumber: "",
      email: "",
    },
  });

  const verifyForm = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      otp: "",
    },
  });

  // Fetch status if we have a token
  useEffect(() => {
    if (accessToken) {
      fetchStatus(accessToken);
    }
  }, []);

  const fetchStatus = async (token: string) => {
    setIsLoading(true);
    try {
      const result = await getApplicationStatus(token);
      if (result.success && result.data) {
        setStatus(result.data);
        setStep("display");
      } else {
        toast.error(result.error || (isRTL ? "فشل في جلب الحالة" : "Failed to fetch status"));
        setAccessToken(null);
        setStep("request");
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في جلب الحالة" : "Failed to fetch status");
      setAccessToken(null);
      setStep("request");
    } finally {
      setIsLoading(false);
    }
  };

  const onRequestOTP = async (data: z.infer<typeof requestSchema>) => {
    setIsLoading(true);
    try {
      const result = await requestStatusOTP(
        subdomain,
        data.applicationNumber,
        data.email
      );

      if (result.success) {
        setApplicationNumber(data.applicationNumber);
        setEmail(data.email);
        setStep("verify");
        toast.success(
          isRTL
            ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني"
            : "Verification code sent to your email"
        );
      } else {
        toast.error(result.error || (isRTL ? "فشل في إرسال الرمز" : "Failed to send code"));
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في إرسال الرمز" : "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async (data: z.infer<typeof verifySchema>) => {
    setIsLoading(true);
    try {
      const result = await verifyStatusOTP(
        subdomain,
        applicationNumber,
        data.otp
      );

      if (result.success && result.data?.accessToken) {
        setAccessToken(result.data.accessToken);
        await fetchStatus(result.data.accessToken);
      } else {
        toast.error(result.error || (isRTL ? "رمز التحقق غير صحيح" : "Invalid verification code"));
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في التحقق" : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const result = await requestStatusOTP(
        subdomain,
        applicationNumber,
        email
      );

      if (result.success) {
        toast.success(isRTL ? "تم إرسال رمز جديد" : "New code sent");
      } else {
        toast.error(result.error || (isRTL ? "فشل في إعادة الإرسال" : "Failed to resend"));
      }
    } catch (error) {
      toast.error(isRTL ? "فشل في إعادة الإرسال" : "Failed to resend");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && step === "display") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "display" && status) {
    return (
      <StatusDisplay
        status={status}
        lang={lang}
        onBack={() => {
          setStep("request");
          setAccessToken(null);
          setStatus(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Search className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-bold">
          {isRTL ? "تتبع حالة الطلب" : "Track Application Status"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isRTL
            ? `تحقق من حالة طلبك في ${school.name}`
            : `Check your application status at ${school.name}`}
        </p>
      </div>

      {step === "request" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? "أدخل معلومات الطلب" : "Enter Application Details"}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? "أدخل رقم الطلب والبريد الإلكتروني المسجل"
                : "Enter your application number and registered email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestOTP)} className="space-y-4">
                <FormField
                  control={requestForm.control}
                  name="applicationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isRTL ? "رقم الطلب" : "Application Number"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="APP-2024-XXXXX"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={requestForm.control}
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
                      <FormDescription>
                        {isRTL
                          ? "سيتم إرسال رمز التحقق إلى هذا البريد"
                          : "A verification code will be sent to this email"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {isRTL ? "جارٍ الإرسال..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 me-2" />
                      {isRTL ? "إرسال رمز التحقق" : "Send Verification Code"}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? "أدخل رمز التحقق" : "Enter Verification Code"}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? `تم إرسال رمز مكون من 6 أرقام إلى ${email}`
                : `A 6-digit code has been sent to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(onVerifyOTP)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isRTL ? "رمز التحقق" : "Verification Code"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          className="text-center text-2xl tracking-widest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {isRTL ? "جارٍ التحقق..." : "Verifying..."}
                    </>
                  ) : (
                    isRTL ? "تحقق" : "Verify"
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0"
                    onClick={() => setStep("request")}
                  >
                    {isRTL ? "تغيير البريد" : "Change email"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                  >
                    {isRTL ? "إعادة إرسال الرمز" : "Resend code"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">
            {isRTL ? "نصائح" : "Tips"}
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              {isRTL
                ? "• رقم الطلب موجود في بريد التأكيد"
                : "• Your application number is in the confirmation email"}
            </li>
            <li>
              {isRTL
                ? "• رمز التحقق صالح لمدة 10 دقائق"
                : "• The verification code is valid for 10 minutes"}
            </li>
            <li>
              {isRTL
                ? "• تحقق من مجلد الرسائل غير المرغوب فيها"
                : "• Check your spam folder if you don't see the email"}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
