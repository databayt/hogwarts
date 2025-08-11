import { ExcellentIcon, GoodIcon, AverageIcon, PoorIcon } from "@/components/atom/icons"

export default function ComparisonTable() {
  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 pt-16">
      <div className="flex w-full flex-col gap-4 text-center">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl">Compare plans</h3>
        <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">All plans include multi-tenant core and Arabic/English support.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg border">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-semibold">Features</th>
              <th className="p-4 text-center font-semibold">Trial</th>
              <th className="p-4 text-center font-semibold">Basic</th>
              <th className="p-4 text-center font-semibold whitespace-nowrap">Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Attendance</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Daily and period marking with CSV export.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Announcements</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Publish school-wide, role-based, or class scoped.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">CSV import</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Students and Teachers with validation preview.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Custom domain</div>
                  <p className="text-sm text-muted-foreground max-w-xs">CNAME verification and SSL certificates.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Advanced reports</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Aggregations and exports for admins/operators.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Manual payment approval</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Receipt uploads, operator approval workflow.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Priority support</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Faster responses for urgent issues.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Multi-tenant isolation</div>
                  <p className="text-sm text-muted-foreground max-w-xs">All data scoped by schoolId across the platform.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Arabic/English + RTL</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Localization and direction support in all plans.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Operator dashboard</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Central control for approvals, observability, backups.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Parent portal</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Read-only portal for linked guardians.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="space-y-1">
                  <div className="font-medium">Backups</div>
                  <p className="text-sm text-muted-foreground max-w-xs">Daily backups and restore drills.</p>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
} 