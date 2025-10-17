import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignsList } from "./campaigns-list";
import { ApplicationsList } from "./applications-list";
import { AdmissionDashboard } from "./dashboard";
import { MeritListView } from "./merit-list";
import { getAdmissionStats, getCampaigns, getApplications } from "./actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Props {
  dictionary?: Dictionary;
}

export default async function AdmissionContent({ dictionary }: Props) {
  // Fetch initial data
  const [stats, campaigns, applications] = await Promise.all([
    getAdmissionStats(),
    getCampaigns(),
    getApplications(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1>{dictionary?.admission?.title || "Admission Management"}</h1>
        <p className="text-muted-foreground">
          {dictionary?.admission?.subtitle || "Manage admission campaigns, applications, and enrollment"}
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AdmissionDashboard stats={stats} dictionary={dictionary} />
      </Suspense>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">
            {dictionary?.admission?.tabs?.campaigns || "Campaigns"}
          </TabsTrigger>
          <TabsTrigger value="applications">
            {dictionary?.admission?.tabs?.applications || "Applications"}
          </TabsTrigger>
          <TabsTrigger value="merit">
            {dictionary?.admission?.tabs?.merit || "Merit List"}
          </TabsTrigger>
          <TabsTrigger value="settings">
            {dictionary?.admission?.tabs?.settings || "Settings"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dictionary?.admission?.campaigns?.title || "Admission Campaigns"}</CardTitle>
              <CardDescription>
                {dictionary?.admission?.campaigns?.description || "Create and manage admission campaigns for different academic years"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignsList campaigns={campaigns} dictionary={dictionary} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dictionary?.admission?.applications?.title || "Applications"}</CardTitle>
              <CardDescription>
                {dictionary?.admission?.applications?.description || "Review and process admission applications"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationsList applications={applications} dictionary={dictionary} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dictionary?.admission?.merit?.title || "Merit List"}</CardTitle>
              <CardDescription>
                {dictionary?.admission?.merit?.description || "Generate and view merit lists based on configured criteria"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeritListView campaigns={campaigns} dictionary={dictionary} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dictionary?.admission?.settings?.title || "Admission Settings"}</CardTitle>
              <CardDescription>
                {dictionary?.admission?.settings?.description || "Configure admission criteria, documents, and policies"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3>{dictionary?.admission?.settings?.documents || "Required Documents"}</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Birth Certificate</li>
                    <li>Previous School Transfer Certificate</li>
                    <li>Previous Year Marksheet</li>
                    <li>Address Proof</li>
                    <li>Passport Size Photo</li>
                  </ul>
                </div>
                <div>
                  <h3>{dictionary?.admission?.settings?.criteria || "Eligibility Criteria"}</h3>
                  <p className="text-muted-foreground">
                    {dictionary?.admission?.settings?.criteriaText || "Configure minimum age, academic requirements, and other eligibility criteria for each class"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}