import { auth } from "@/auth"
import { Award, Plus, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getCertificateConfigs, getCertificates } from "./actions"
import { CertificateList } from "./certificate-list"
import { CertificateConfigList } from "./config-list"

export async function CertificateContent() {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) return null

  const [configs, certificates] = await Promise.all([
    getCertificateConfigs(),
    getCertificates(),
  ])

  const role = session.user.role || "USER"
  const canManage = ["DEVELOPER", "ADMIN"].includes(role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificates</h2>
          <p className="text-muted-foreground">
            Manage certificate templates and issue certificates to students
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <a href="certificates/configs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-muted-foreground text-xs">Active templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
            <p className="text-muted-foreground text-xs">
              Total certificates issued
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {certificates.filter((c: any) => c.status === "active").length}
            </div>
            <p className="text-muted-foreground text-xs">
              Currently active certificates
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="certificates">
        <TabsList>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          {canManage && <TabsTrigger value="templates">Templates</TabsTrigger>}
        </TabsList>
        <TabsContent value="certificates" className="space-y-4">
          <CertificateList
            certificates={certificates as any}
            canManage={canManage}
          />
        </TabsContent>
        {canManage && (
          <TabsContent value="templates" className="space-y-4">
            <CertificateConfigList configs={configs} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default CertificateContent
