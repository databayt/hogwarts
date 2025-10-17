"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { campaignSchema, type CampaignFormData } from "./validation";
import { createCampaign, updateCampaign } from "./actions";
import { toast } from "sonner";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Campaign {
  id: string;
  name: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status: string;
  description?: string | null;
  totalSeats: number;
  applicationFee?: number | null;
}

interface Props {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary?: Dictionary;
}

export function CampaignDialog({ campaign, open, onOpenChange, dictionary }: Props) {
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      academicYear: new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString(),
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "DRAFT",
      description: "",
      totalSeats: 100,
      applicationFee: 500,
    },
  });

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        academicYear: campaign.academicYear,
        startDate: new Date(campaign.startDate),
        endDate: new Date(campaign.endDate),
        status: campaign.status as any,
        description: campaign.description || "",
        totalSeats: campaign.totalSeats,
        applicationFee: campaign.applicationFee ? Number(campaign.applicationFee) : undefined,
      });
    } else {
      form.reset();
    }
  }, [campaign, form]);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      if (campaign) {
        await updateCampaign(campaign.id, data);
        toast.success(dictionary?.admission?.campaign?.updateSuccess || "Campaign updated successfully");
      } else {
        await createCampaign(data);
        toast.success(dictionary?.admission?.campaign?.createSuccess || "Campaign created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(dictionary?.admission?.campaign?.error || "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign
              ? dictionary?.admission?.campaign?.editTitle || "Edit Campaign"
              : dictionary?.admission?.campaign?.createTitle || "Create New Campaign"}
          </DialogTitle>
          <DialogDescription>
            {dictionary?.admission?.campaign?.description ||
              "Set up an admission campaign for student enrollment"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary?.admission?.campaign?.name || "Campaign Name"}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Class XI Admission 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="academicYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary?.admission?.campaign?.academicYear || "Academic Year"}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2024-2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary?.admission?.campaign?.startDate || "Start Date"}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary?.admission?.campaign?.endDate || "End Date"}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary?.admission?.campaign?.status || "Status"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary?.admission?.campaign?.description || "Description"}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter campaign details and instructions..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary?.admission?.campaign?.totalSeats || "Total Seats"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicationFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary?.admission?.campaign?.applicationFee || "Application Fee"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0 for free"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      {dictionary?.admission?.campaign?.feeHint || "Leave empty for free applications"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {dictionary?.admission?.campaign?.cancel || "Cancel"}
              </Button>
              <Button type="submit">
                {campaign
                  ? dictionary?.admission?.campaign?.update || "Update Campaign"
                  : dictionary?.admission?.campaign?.create || "Create Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}