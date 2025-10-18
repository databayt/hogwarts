"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { generateMeritList, getApplications } from "./actions";
import { toast } from "sonner";
import { IconTrophy, IconDownload } from "@tabler/icons-react";

interface Campaign {
  id: string;
  name: string;
  academicYear: string;
}

interface Props {
  campaigns: Campaign[];
  
}

export function MeritListView({ campaigns }: Props) {
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [meritList, setMeritList] = useState<any[]>([]);
  const [criteria, setCriteria] = useState({
    academicWeight: 40,
    entranceWeight: 30,
    interviewWeight: 20,
    extracurricularWeight: 10,
  });
  const [cutoffScore, setCutoffScore] = useState(60);
  const [loading, setLoading] = useState(false);

  const handleGenerateMeritList = async () => {
    if (!selectedCampaign) {
      toast.error("Please select a campaign");
      return;
    }

    setLoading(true);
    try {
      await generateMeritList({
        campaignId: selectedCampaign,
        criteria,
        cutoffScore,
        reservationPolicy: true,
      });

      // Fetch updated applications
      const applications = await getApplications({ campaignId: selectedCampaign });
      const sortedApplications = applications
        .filter((app: any) => app.meritRank)
        .sort((a: any, b: any) => a.meritRank - b.meritRank);
      setMeritList(sortedApplications);

      toast.success("Merit list generated successfully");
    } catch (error) {
      toast.error("Failed to generate merit list");
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = Object.values(criteria).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{"Merit List Configuration"}</CardTitle>
          <CardDescription>
            {"Configure the weightage for different criteria"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Selection */}
          <div className="space-y-2">
            <Label>{"Select Campaign"}</Label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder={"Choose a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.academicYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Criteria Weights */}
          <div className="space-y-4">
            <h4>{"Criteria Weights"}</h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{"Academic Performance"}</Label>
                <span className="text-sm font-medium">{criteria.academicWeight}%</span>
              </div>
              <Slider
                value={[criteria.academicWeight]}
                onValueChange={([value]) => setCriteria({ ...criteria, academicWeight: value })}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{"Entrance Exam"}</Label>
                <span className="text-sm font-medium">{criteria.entranceWeight}%</span>
              </div>
              <Slider
                value={[criteria.entranceWeight]}
                onValueChange={([value]) => setCriteria({ ...criteria, entranceWeight: value })}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{"Interview"}</Label>
                <span className="text-sm font-medium">{criteria.interviewWeight}%</span>
              </div>
              <Slider
                value={[criteria.interviewWeight]}
                onValueChange={([value]) => setCriteria({ ...criteria, interviewWeight: value })}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{"Extracurricular"}</Label>
                <span className="text-sm font-medium">{criteria.extracurricularWeight}%</span>
              </div>
              <Slider
                value={[criteria.extracurricularWeight]}
                onValueChange={([value]) => setCriteria({ ...criteria, extracurricularWeight: value })}
                max={100}
                step={5}
              />
            </div>

            {totalWeight !== 100 && (
              <p className="text-sm text-destructive">
                {"Total weight must be 100%"} ({totalWeight}%)
              </p>
            )}
          </div>

          {/* Cutoff Score */}
          <div className="space-y-2">
            <Label>{"Cutoff Score"}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={cutoffScore}
                onChange={(e) => setCutoffScore(Number(e.target.value))}
                min="0"
                max="100"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {"Minimum score for selection"}
              </span>
            </div>
          </div>

          <Button
            onClick={handleGenerateMeritList}
            disabled={loading || totalWeight !== 100 || !selectedCampaign}
            className="w-full"
          >
            {loading
              ? "Generating..."
              : "Generate Merit List"}
          </Button>
        </CardContent>
      </Card>

      {/* Merit List Table */}
      {meritList.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{"Merit List"}</CardTitle>
              <CardDescription>
                {"Ranked list of applicants based on merit score"}
              </CardDescription>
            </div>
            <Button variant="outline">
              <IconDownload className="mr-2 h-4 w-4" />
              {"Export"}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">
                    {"Rank"}
                  </TableHead>
                  <TableHead>{"Application No"}</TableHead>
                  <TableHead>{"Name"}</TableHead>
                  <TableHead>{"Category"}</TableHead>
                  <TableHead>{"Merit Score"}</TableHead>
                  <TableHead>{"Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meritList.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {application.meritRank <= 3 && (
                          <IconTrophy
                            className={`h-4 w-4 ${
                              application.meritRank === 1
                                ? "text-yellow-500"
                                : application.meritRank === 2
                                ? "text-gray-400"
                                : "text-orange-500"
                            }`}
                          />
                        )}
                        <span className="font-medium">{application.meritRank}</span>
                      </div>
                    </TableCell>
                    <TableCell>{application.applicationNumber}</TableCell>
                    <TableCell>
                      {application.firstName} {application.lastName}
                    </TableCell>
                    <TableCell>{application.category || "General"}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {application.meritScore?.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          application.status === "SELECTED"
                            ? "success"
                            : application.status === "WAITLISTED"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {application.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}