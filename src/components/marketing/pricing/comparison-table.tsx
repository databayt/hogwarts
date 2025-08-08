import { ExcellentIcon, GoodIcon, AverageIcon, PoorIcon } from "@/components/atom/icons"

export default function ComparisonTable() {
  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 pt-16">
      <div className="flex w-full flex-col gap-4 text-center">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl">Compare plans</h3>
        <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">All plans include multi‑tenant core and Arabic/English support.</p>
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
                <div>
                  <div className="font-medium">Attendance</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Daily and period marking with CSV export.</div>
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Announcements</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Publish school‑wide, role‑based, or class scoped.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">CSV import</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Students and Teachers with validation preview.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Custom domain</div>
                  <div className="text-sm text-muted-foreground max-w-xs">CNAME verification and SSL certificates.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Advanced reports</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Aggregations and exports for admins/operators.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Manual payment approval</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Receipt uploads, operator approval workflow.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Priority support</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Faster responses for urgent issues.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Multi‑tenant isolation</div>
                  <div className="text-sm text-muted-foreground max-w-xs">All data scoped by schoolId across the platform.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Arabic/English + RTL</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Localization and direction support in all plans.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Operator dashboard</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Central control for approvals, observability, backups.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Parent portal</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Read‑only portal for linked guardians.</div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Backups</div>
                  <div className="text-sm text-muted-foreground max-w-xs">Daily backups and restore drills.</div>
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