"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import type { z } from "zod";
import { toast } from "sonner";
import { createLead, updateLead } from "@/components/sales/actions";
import { createLeadSchema } from "@/components/sales/validation";
import {
  Form as FormUI,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  LEAD_STATUS,
  LEAD_SOURCE,
  LEAD_PRIORITY,
  LEAD_TYPE,
  type LeadStatusKey,
  type LeadSourceKey,
  type LeadPriorityKey,
  type LeadTypeKey,
} from "./constants";
import type { Lead } from "./types";
import { useModal } from "@/components/atom/modal/context";
import { getLeadById } from "./actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface FormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  lead?: Lead | null;
  mode?: "create" | "edit";
  dictionary?: Record<string, string>;
}

type LeadFormValues = z.input<typeof createLeadSchema>;

export function Form({
  open,
  onClose,
  onSuccess,
  lead,
  mode = "create",
  dictionary,
}: FormProps) {
  const router = useRouter();
  const isEditing = mode === "edit" && !!lead;
  const d = dictionary;

  // Translations
  const t = {
    title: isEditing
      ? d?.editLead || "Edit Lead"
      : d?.createLead || "Create Lead",
    name: d?.name || "Name",
    email: d?.email || "Email",
    phone: d?.phone || "Phone",
    company: d?.company || "Company",
    title_field: d?.jobTitle || "Job Title",
    website: d?.website || "Website",
    linkedin: d?.linkedin || "LinkedIn",
    leadType: d?.leadType || "Lead Type",
    industry: d?.industry || "Industry",
    location: d?.location || "Location",
    status: d?.status || "Status",
    source: d?.source || "Source",
    priority: d?.priority || "Priority",
    score: d?.score || "Score",
    notes: d?.notes || "Notes",
    save: d?.save || "Save",
    cancel: d?.cancel || "Cancel",
    creating: d?.creating || "Creating...",
    updating: d?.updating || "Updating...",
    // Status options
    NEW: d?.NEW || "New",
    CONTACTED: d?.CONTACTED || "Contacted",
    QUALIFIED: d?.QUALIFIED || "Qualified",
    PROPOSAL: d?.PROPOSAL || "Proposal",
    NEGOTIATION: d?.NEGOTIATION || "Negotiation",
    CLOSED_WON: d?.CLOSED_WON || "Closed Won",
    CLOSED_LOST: d?.CLOSED_LOST || "Closed Lost",
    ARCHIVED: d?.ARCHIVED || "Archived",
    // Source options
    MANUAL: d?.MANUAL || "Manual",
    IMPORT: d?.IMPORT || "Import",
    WEBSITE: d?.WEBSITE || "Website",
    REFERRAL: d?.REFERRAL || "Referral",
    SOCIAL_MEDIA: d?.SOCIAL_MEDIA || "Social Media",
    EMAIL_CAMPAIGN: d?.EMAIL_CAMPAIGN || "Email Campaign",
    COLD_CALL: d?.COLD_CALL || "Cold Call",
    CONFERENCE: d?.CONFERENCE || "Conference",
    PARTNER: d?.PARTNER || "Partner",
    // Priority options
    LOW: d?.LOW || "Low",
    MEDIUM: d?.MEDIUM || "Medium",
    HIGH: d?.HIGH || "High",
    URGENT: d?.URGENT || "Urgent",
    // Type options
    SCHOOL: d?.SCHOOL || "School",
    PARTNERSHIP: d?.PARTNERSHIP || "Partnership",
    OTHER: d?.OTHER || "Other",
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
    if (!lead) {
      form.reset({
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
      });
      return;
    }
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
  }, [lead, form]);

  const onSubmit: SubmitHandler<LeadFormValues> = async (values) => {
    try {
      const res = isEditing && lead
        ? await updateLead(lead.id, values as Parameters<typeof updateLead>[1])
        : await createLead(values as Parameters<typeof createLead>[0]);

      if (res?.success) {
        const successMsg = isEditing
          ? d?.leadUpdated || "Lead updated successfully"
          : d?.leadCreated || "Lead created successfully";
        toast.success(successMsg);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        const errorMsg =
          res?.error ||
          (isEditing
            ? d?.failedUpdate || "Failed to update lead"
            : d?.failedCreate || "Failed to create lead");
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(d?.unexpectedError || "An unexpected error occurred");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        <FormUI {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Button type="button" variant="outline" onClick={onClose}>
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
        </FormUI>
      </DialogContent>
    </Dialog>
  );
}

// LeadForm - backward compatible version for use with Modal atom (table.tsx)
// Uses useModal context instead of direct props

interface LeadFormProps {
  dictionary?: Dictionary["sales"];
  onSuccess?: () => void;
}

export function LeadForm({ dictionary, onSuccess }: LeadFormProps) {
  const { modal, closeModal } = useModal();
  const router = useRouter();

  const currentId = modal.id || undefined;
  const isEditing = !!currentId;
  const d = dictionary as unknown as Record<string, string> | undefined;

  const t = {
    title: isEditing
      ? d?.editLead || "Edit Lead"
      : d?.createLead || "Create Lead",
    name: d?.name || "Name",
    email: d?.email || "Email",
    phone: d?.phone || "Phone",
    company: d?.company || "Company",
    title_field: d?.jobTitle || "Job Title",
    website: d?.website || "Website",
    leadType: d?.leadType || "Lead Type",
    industry: d?.industry || "Industry",
    location: d?.location || "Location",
    status: d?.status || "Status",
    source: d?.source || "Source",
    priority: d?.priority || "Priority",
    score: d?.score || "Score",
    notes: d?.notes || "Notes",
    save: d?.save || "Save",
    cancel: d?.cancel || "Cancel",
    creating: d?.creating || "Creating...",
    updating: d?.updating || "Updating...",
    NEW: d?.NEW || "New",
    CONTACTED: d?.CONTACTED || "Contacted",
    QUALIFIED: d?.QUALIFIED || "Qualified",
    PROPOSAL: d?.PROPOSAL || "Proposal",
    NEGOTIATION: d?.NEGOTIATION || "Negotiation",
    CLOSED_WON: d?.CLOSED_WON || "Closed Won",
    CLOSED_LOST: d?.CLOSED_LOST || "Closed Lost",
    ARCHIVED: d?.ARCHIVED || "Archived",
    MANUAL: d?.MANUAL || "Manual",
    IMPORT: d?.IMPORT || "Import",
    WEBSITE: d?.WEBSITE || "Website",
    REFERRAL: d?.REFERRAL || "Referral",
    SOCIAL_MEDIA: d?.SOCIAL_MEDIA || "Social Media",
    EMAIL_CAMPAIGN: d?.EMAIL_CAMPAIGN || "Email Campaign",
    COLD_CALL: d?.COLD_CALL || "Cold Call",
    CONFERENCE: d?.CONFERENCE || "Conference",
    PARTNER: d?.PARTNER || "Partner",
    LOW: d?.LOW || "Low",
    MEDIUM: d?.MEDIUM || "Medium",
    HIGH: d?.HIGH || "High",
    URGENT: d?.URGENT || "Urgent",
    SCHOOL: d?.SCHOOL || "School",
    PARTNERSHIP: d?.PARTNERSHIP || "Partnership",
    OTHER: d?.OTHER || "Other",
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

  useEffect(() => {
    const load = async () => {
      if (!currentId) return;
      const res = await getLeadById(currentId);
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
  }, [currentId, form]);

  const onSubmit: SubmitHandler<LeadFormValues> = async (values) => {
    try {
      const res = isEditing && currentId
        ? await updateLead(currentId, values as Parameters<typeof updateLead>[1])
        : await createLead(values as Parameters<typeof createLead>[0]);

      if (res?.success) {
        toast.success(isEditing ? "Lead updated" : "Lead created");
        closeModal();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res?.error || "Operation failed");
      }
    } catch (error) {
      console.error("Form error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <FormUI {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-lg font-semibold">{t.title}</h2>

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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
    </FormUI>
  );
}
