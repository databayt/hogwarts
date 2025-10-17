"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { format } from "date-fns";
import { CampaignDialog } from "./campaign-dialog";
import { deleteCampaign } from "./actions";
import { toast } from "sonner";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Campaign {
  id: string;
  name: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  status: string;
  totalSeats: number;
  applicationFee?: number | null;
}

interface Props {
  campaigns: Campaign[];
  dictionary?: Dictionary;
}

export function CampaignsList({ campaigns, dictionary }: Props) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm(dictionary?.admission?.campaigns?.deleteConfirm || "Are you sure you want to delete this campaign?")) {
      try {
        await deleteCampaign(id);
        toast.success(dictionary?.admission?.campaigns?.deleteSuccess || "Campaign deleted successfully");
      } catch (error) {
        toast.error(dictionary?.admission?.campaigns?.deleteError || "Failed to delete campaign");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary";
      case "OPEN":
        return "success";
      case "CLOSED":
        return "destructive";
      case "PROCESSING":
        return "warning";
      case "COMPLETED":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setSelectedCampaign(null);
            setDialogOpen(true);
          }}
        >
          <IconPlus className="mr-2 h-4 w-4" />
          {dictionary?.admission?.campaigns?.addCampaign || "Add Campaign"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary?.admission?.campaigns?.name || "Name"}</TableHead>
              <TableHead>{dictionary?.admission?.campaigns?.academicYear || "Academic Year"}</TableHead>
              <TableHead>{dictionary?.admission?.campaigns?.duration || "Duration"}</TableHead>
              <TableHead>{dictionary?.admission?.campaigns?.status || "Status"}</TableHead>
              <TableHead>{dictionary?.admission?.campaigns?.seats || "Total Seats"}</TableHead>
              <TableHead>{dictionary?.admission?.campaigns?.fee || "Application Fee"}</TableHead>
              <TableHead className="text-right">
                {dictionary?.admission?.campaigns?.actions || "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {dictionary?.admission?.campaigns?.noCampaigns || "No campaigns found"}
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.academicYear}</TableCell>
                  <TableCell>
                    {format(new Date(campaign.startDate), "MMM dd, yyyy")} -
                    {format(new Date(campaign.endDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(campaign.status) as any}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.totalSeats}</TableCell>
                  <TableCell>
                    {campaign.applicationFee
                      ? `₹${campaign.applicationFee}`
                      : dictionary?.admission?.campaigns?.free || "Free"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          {dictionary?.admission?.campaigns?.actions || "Actions"}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setDialogOpen(true);
                          }}
                        >
                          <IconEdit className="mr-2 h-4 w-4" />
                          {dictionary?.admission?.campaigns?.edit || "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(campaign.id)}
                          className="text-red-600"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          {dictionary?.admission?.campaigns?.delete || "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CampaignDialog
        campaign={selectedCampaign}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dictionary={dictionary}
      />
    </div>
  );
}