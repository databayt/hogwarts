"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import type { z } from "zod";
import { toast } from "sonner";
import { createOperatorLead, updateOperatorLead, getOperatorLeadById } from "./actions";
import { createLeadSchema } from "@/components/sales/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModal } from "@/components/atom/modal/context";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import {
  LEAD_STATUS,
  LEAD_SOURCE,
  LEAD_PRIORITY,
  LEAD_TYPE,
  type LeadStatusKey,
  type LeadSourceKey,
  type LeadPriorityKey,
  type LeadTypeKey,
} from "@/components/sales/constants";

interface OperatorLeadFormProps {
  dictionary?: Dictionary["sales"];
  onSuccess?: () => void;
}

type LeadFormValues = z.input<typeof createLeadSchema>;

export function OperatorLeadForm({ dictionary, onSuccess }: OperatorLeadFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();

  // Detect if editing
  const currentId = modal.id || undefined;
  const isEditing = !!currentId;

  // Translations
  const t = {
    title: isEditing ? "Edit Lead" : "Create Lead",
    name: "Name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    title_field: "Job Title",
    website: "Website",
    linkedin: "LinkedIn",
    leadType: "Lead Type",
    industry: "Industry",
    location: "Location",
    status: "Status",
    source: "Source",
    priority: "Priority",
    score: "Score",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    creating: "Creating...",
    updating: "Updating...",
    // Status options
    NEW: "New",
    CONTACTED: "Contacted",
    QUALIFIED: "Qualified",
    PROPOSAL: "Proposal",
    NEGOTIATION: "Negotiation",
    CLOSED_WON: "Closed Won",
    CLOSED_LOST: "Closed Lost",
    ARCHIVED: "Archived",
    // Source options
    MANUAL: "Manual",
    IMPORT: "Import",
    WEBSITE: "Website",
    REFERRAL: "Referral",
    SOCIAL_MEDIA: "Social Media",
    EMAIL_CAMPAIGN: "Email Campaign",
    COLD_CALL: "Cold Call",
    CONFERENCE: "Conference",
    PARTNER: "Partner",
    // Priority options
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    URGENT: "Urgent",
    // Type options
    SCHOOL: "School",
    PARTNERSHIP: "Partnership",
    OTHER: "Other",
  };

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      title: "",
      website: "",
      linkedinUrl: "",
      leadType: "SCHOOL",
      industry: "",
      location: "",
      status: "NEW",
      source: "MANUAL",
      priority: "MEDIUM",
      score: 50,
      notes: "",
      tags: [],
      verified: false,
    },
  });

  // Load existing lead for editing
  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getOperatorLeadById(currentId);
      if (!res.success || !res.data) return;
      const lead = res.data;
      form.reset({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        title: lead.title || "",
        website: lead.website || "",
        linkedinUrl: lead.linkedinUrl || "",
        leadType: lead.leadType || "SCHOOL",
        industry: lead.industry || "",
        location: lead.location || "",
        status: lead.status || "NEW",
        source: lead.source || "MANUAL",
        priority: lead.priority || "MEDIUM",
        score: lead.score ?? 50,
        notes: lead.notes || "",
        tags: lead.tags || [],
      });
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const onSubmit: SubmitHandler<LeadFormValues> = async (values) => {
    try {
      // Cast to action input types (zod will validate and apply defaults)
      const res = isEditing
        ? await updateOperatorLead(currentId!, values as Parameters<typeof updateOperatorLead>[1])
        : await createOperatorLead(values as Parameters<typeof createOperatorLead>[0]);

      if (res?.success) {
        const successMsg = isEditing
          ? "Lead updated successfully"
          : "Lead created successfully";
        toast.success(successMsg);
        closeModal();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        const errorMsg =
          res?.error ||
          (isEditing ? "Failed to update lead" : "Failed to create lead");
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-lg font-semibold">{t.title}</h2>

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.name} *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.name} />
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
                <FormLabel>{t.email}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder={t.email} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.phone}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.phone} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.company}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.company} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.title_field}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.title_field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.website}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Classification */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="leadType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.leadType}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.leadType} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LEAD_TYPE) as LeadTypeKey[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {t[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.industry}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.industry} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.location}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.location} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pipeline */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.status}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.status} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LEAD_STATUS) as LeadStatusKey[]).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {t[status] || status}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.source}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.source} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LEAD_SOURCE) as LeadSourceKey[]).map(
                      (source) => (
                        <SelectItem key={source} value={source}>
                          {t[source] || source}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.priority}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.priority} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LEAD_PRIORITY) as LeadPriorityKey[]).map(
                      (priority) => (
                        <SelectItem key={priority} value={priority}>
                          {t[priority] || priority}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.score}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    max={100}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.notes}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t.notes} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={closeModal}>
            {t.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? t.updating
                : t.creating
              : t.save}
          </Button>
        </div>
      </form>
    </Form>
  );
}
