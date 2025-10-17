"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconDotsVertical, IconEye, IconMail, IconDownload } from "@tabler/icons-react";
import { format } from "date-fns";
import { performBulkAction } from "./actions";
import { toast } from "sonner";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Application {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  applyingForClass: string;
  status: string;
  createdAt: Date;
  campaign?: {
    name: string;
    academicYear: string;
  };
}

interface Props {
  applications: Application[];
  dictionary?: Dictionary;
}

export function ApplicationsList({ applications, dictionary }: Props) {
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(applications.map((app) => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApplications([...selectedApplications, id]);
    } else {
      setSelectedApplications(selectedApplications.filter((appId) => appId !== id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedApplications.length === 0) {
      toast.error(dictionary?.admission?.applications?.selectAction || "Please select an action and applications");
      return;
    }

    try {
      await performBulkAction({
        applicationIds: selectedApplications,
        action: bulkAction as any,
      });
      toast.success(dictionary?.admission?.applications?.bulkSuccess || "Bulk action completed successfully");
      setSelectedApplications([]);
      setBulkAction("");
    } catch (error) {
      toast.error(dictionary?.admission?.applications?.bulkError || "Failed to perform bulk action");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary";
      case "SUBMITTED":
        return "default";
      case "UNDER_REVIEW":
        return "warning";
      case "SHORTLISTED":
        return "info";
      case "SELECTED":
        return "success";
      case "WAITLISTED":
        return "warning";
      case "REJECTED":
        return "destructive";
      case "ADMITTED":
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedApplications.length} {dictionary?.admission?.applications?.selected || "selected"}
          </span>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={dictionary?.admission?.applications?.selectAction || "Select action"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SHORTLIST">
                {dictionary?.admission?.applications?.shortlist || "Shortlist"}
              </SelectItem>
              <SelectItem value="SELECT">
                {dictionary?.admission?.applications?.select || "Select"}
              </SelectItem>
              <SelectItem value="WAITLIST">
                {dictionary?.admission?.applications?.waitlist || "Waitlist"}
              </SelectItem>
              <SelectItem value="REJECT">
                {dictionary?.admission?.applications?.reject || "Reject"}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleBulkAction}>
            {dictionary?.admission?.applications?.apply || "Apply"}
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedApplications.length === applications.length && applications.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>{dictionary?.admission?.applications?.applicationNo || "Application No"}</TableHead>
              <TableHead>{dictionary?.admission?.applications?.name || "Name"}</TableHead>
              <TableHead>{dictionary?.admission?.applications?.class || "Class"}</TableHead>
              <TableHead>{dictionary?.admission?.applications?.campaign || "Campaign"}</TableHead>
              <TableHead>{dictionary?.admission?.applications?.status || "Status"}</TableHead>
              <TableHead>{dictionary?.admission?.applications?.date || "Applied Date"}</TableHead>
              <TableHead className="text-right">
                {dictionary?.admission?.applications?.actions || "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {dictionary?.admission?.applications?.noApplications || "No applications found"}
                </TableCell>
              </TableRow>
            ) : (
              applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedApplications.includes(application.id)}
                      onCheckedChange={(checked) =>
                        handleSelectApplication(application.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {application.applicationNumber}
                  </TableCell>
                  <TableCell>
                    {application.firstName} {application.lastName}
                  </TableCell>
                  <TableCell>{application.applyingForClass}</TableCell>
                  <TableCell>
                    {application.campaign?.name} ({application.campaign?.academicYear})
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(application.status) as any}>
                      {application.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(application.createdAt), "MMM dd, yyyy")}
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
                          {dictionary?.admission?.applications?.actions || "Actions"}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <IconEye className="mr-2 h-4 w-4" />
                          {dictionary?.admission?.applications?.view || "View Details"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconMail className="mr-2 h-4 w-4" />
                          {dictionary?.admission?.applications?.sendEmail || "Send Email"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconDownload className="mr-2 h-4 w-4" />
                          {dictionary?.admission?.applications?.download || "Download"}
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
    </div>
  );
}