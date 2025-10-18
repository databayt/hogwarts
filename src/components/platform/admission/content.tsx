import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignsList } from "./campaigns-list";
import { ApplicationsList } from "./applications-list";
import { AdmissionDashboard } from "./dashboard";
import { MeritListView } from "./merit-list";
import { getAdmissionStats, getCampaigns, getApplications } from "./actions";

export default async function AdmissionContent() {
  // Fetch initial data
  const [stats, campaigns, applications] = await Promise.all([
    getAdmissionStats(),
    getCampaigns(),
    getApplications(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1>{"Admission Management"}</h1>
        <p className="text-muted-foreground">
          {"Manage admission campaigns, applications, and enrollment"}
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AdmissionDashboard stats={stats} dictionary={dictionary} />
      </Suspense>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">
            {"Campaigns"}
          </TabsTrigger>
          <TabsTrigger value="applications">
            {"Applications"}
          </TabsTrigger>
          <TabsTrigger value="merit">
            {"Merit List"}
          </TabsTrigger>
          <TabsTrigger value="settings">
            {"Settings"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{"Admission Campaigns"}</CardTitle>
              <CardDescription>
                {"Create and manage admission campaigns for different academic years"}
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
              <CardTitle>{"Applications"}</CardTitle>
              <CardDescription>
                {"Review and process admission applications"}
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
              <CardTitle>{"Merit List"}</CardTitle>
              <CardDescription>
                {"Generate and view merit lists based on configured criteria"}
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
              <CardTitle>{"Admission Settings"}</CardTitle>
              <CardDescription>
                {"Configure admission criteria, documents, and policies"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3>{"Required Documents"}</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Birth Certificate</li>
                    <li>Previous School Transfer Certificate</li>
                    <li>Previous Year Marksheet</li>
                    <li>Address Proof</li>
                    <li>Passport Size Photo</li>
                  </ul>
                </div>
                <div>
                  <h3>{"Eligibility Criteria"}</h3>
                  <p className="text-muted-foreground">
                    {"Configure minimum age, academic requirements, and other eligibility criteria for each class"}
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