"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AnthropicIcons, Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../../types"
import { submitInquiry } from "../actions"
import type { InquiryFormData } from "../types"
import { DEFAULT_GRADES, INQUIRY_SOURCES } from "../types"

interface Props {
  school: School
  dictionary: Dictionary
  lang: Locale
  subdomain: string
}

const inquirySchema = z.object({
  parentName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  studentName: z.string().optional(),
  studentDOB: z.string().optional(),
  interestedGrade: z.string().optional(),
  source: z.string().optional(),
  message: z.string().optional(),
  subscribeNewsletter: z.boolean(),
})

type InquiryForm = z.infer<typeof inquirySchema>

export default function InquiryFormContent({
  school,
  dictionary,
  lang,
  subdomain,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const isRTL = lang === "ar"

  const dict =
    (
      dictionary as unknown as {
        school?: { admission?: { inquiryPage?: Record<string, string> } }
      }
    )?.school?.admission?.inquiryPage ?? {}

  const form = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      parentName: "",
      email: "",
      phone: "",
      studentName: "",
      studentDOB: "",
      interestedGrade: "",
      source: "",
      message: "",
      subscribeNewsletter: false,
    },
  })

  const onSubmit = async (data: InquiryForm) => {
    setIsSubmitting(true)
    try {
      const inquiryData: InquiryFormData = {
        parentName: data.parentName,
        email: data.email,
        phone: data.phone,
        studentName: data.studentName,
        studentDOB: data.studentDOB,
        interestedGrade: data.interestedGrade,
        source: data.source,
        message: data.message,
        subscribeNewsletter: data.subscribeNewsletter,
      }

      const result = await submitInquiry(subdomain, inquiryData)

      if (result.success) {
        setIsSubmitted(true)
        toast.success(dict.inquirySubmitted || "Inquiry submitted successfully")
      } else {
        toast.error(
          result.error || dict.failedToSubmit || "Failed to submit inquiry"
        )
      }
    } catch (error) {
      toast.error(dict.failedToSubmit || "Failed to submit inquiry")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="bg-primary/10 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full">
            <AnthropicIcons.Sparkle className="text-primary h-10 w-10" />
          </div>
          <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">
            {dict.thankYou || "Thank You for Reaching Out!"}
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
            {dict.inquiryReceived ||
              "We've received your inquiry and will get back to you soon"}
          </p>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              <AnthropicIcons.Lightning className="me-2 inline h-4 w-4" />
              {dict.responseTime ||
                "We typically respond within 24-48 business hours"}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href={`/${lang}`}>
            <Button variant="outline">
              {dict.backToHome || "Back to Home"}
            </Button>
          </Link>
          <Link href={`/${lang}/apply`}>
            <Button className="group">
              {dict.applyNow || "Apply Now"}
              <AnthropicIcons.ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-primary/10 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full">
          <AnthropicIcons.Chat className="text-primary h-8 w-8" />
        </div>
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">
          {dict.contactAdmissions || "Contact Admissions"}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
          {(
            dict.contactSubtitle ||
            "Have questions about {schoolName}? We're here to help."
          ).replace("{schoolName}", school.name)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {dict.inquiryForm || "Inquiry Form"}
          </CardTitle>
          <CardDescription>
            {dict.inquiryFormDesc ||
              "Tell us about yourself and we'll get in touch soon"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-medium">
                  {dict.contactInformation || "Contact Information"}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.yourName || "Your Name"} *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              dict.enterYourName || "Enter your name"
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.email || "Email"} *</FormLabel>
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
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {dict.phoneNumber || "Phone Number"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="+249 123 456 789"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="font-medium">
                  {dict.studentInfoOptional || "Student Information (Optional)"}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {dict.studentName || "Student Name"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              dict.enterStudentName || "Enter student name"
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentDOB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {dict.studentDOB || "Student Date of Birth"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="interestedGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {dict.interestedGrade || "Interested Grade"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={dict.selectGrade || "Select grade"}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEFAULT_GRADES.map((grade) => (
                            <SelectItem key={grade.grade} value={grade.grade}>
                              {grade.grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Message */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {dict.yourMessage || "Your Message"}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={
                            dict.writeInquiry || "Write your inquiry here..."
                          }
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Source */}
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dict.howHeard || "How did you hear about us?"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={dict.selectOption || "Select"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INQUIRY_SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Newsletter */}
              <FormField
                control={form.control}
                name="subscribeNewsletter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal">
                        {dict.receiveUpdates ||
                          "I'd like to receive updates and news"}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="group w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Icons.loader2 className="me-2 h-4 w-4 animate-spin" />
                    {dict.submitting || "Submitting..."}
                  </>
                ) : (
                  <>
                    <AnthropicIcons.Sparkle className="me-2 h-4 w-4" />
                    {dict.submitInquiry || "Submit Inquiry"}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AnthropicIcons.Checklist className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <h3 className="mb-4 font-medium">
                {dict.quickLinks || "Quick Links"}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link href={`/${lang}/apply`}>
                  <Button
                    variant="outline"
                    className="group w-full justify-start"
                  >
                    <AnthropicIcons.Book className="me-2 h-4 w-4" />
                    {dict.applyForAdmission || "Apply Now"}
                    <AnthropicIcons.ArrowRight className="ms-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Button>
                </Link>
                <Link href={`/${lang}/tour`}>
                  <Button
                    variant="outline"
                    className="group w-full justify-start"
                  >
                    <AnthropicIcons.CalendarChart className="me-2 h-4 w-4" />
                    {dict.scheduleTour || "Schedule a Tour"}
                    <AnthropicIcons.ArrowRight className="ms-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
