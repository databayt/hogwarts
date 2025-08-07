import { ExcellentIcon, GoodIcon, AverageIcon, PoorIcon } from "@/components/atom/icons"

export default function ComparisonTable() {
  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 pt-16">
      <div className="flex w-full flex-col gap-4 text-center">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl">
          Is Databayt really that good?
        </h3>
        <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          We are changing the way businesses see automation. Since 2020.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg border">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-semibold">Features</th>
              <th className="p-4 text-center font-semibold">Databayt</th>
              <th className="p-4 text-center font-semibold">Agencies</th>
              <th className="p-4 text-center font-semibold whitespace-nowrap">In-House</th>
              <th className="p-4 text-center font-semibold">Freelancers</th>
              <th className="p-4 text-center font-semibold">DIY</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Quality</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Our expert team ensures consistent, high-quality automation solutions with thorough testing and optimization.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Cost-effectiveness</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    We believe in fairness and transparency in our pricing. Get enterprise-level solutions without enterprise costs.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Fast Turnaround</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    We&apos;ve been doing this for years. Our streamlined processes and automation expertise deliver results quickly.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Ongoing Support</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Continuous support and maintenance to ensure your automation keeps running smoothly as your business grows.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Scalability</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Solutions that grow with your business, from startup to enterprise scale without major rebuilds.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Industry Savvy</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    We have people with specific skills working in-house with us. Whatever you want, they have done hundreds of times before.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Reliability</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Thanks to the tremendous experience with business automation and development, our people will take complete care of your project. Start to finish, and beyond.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Team Support</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Dedicated team of specialists working together to ensure your success with continuous support.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Production Process</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Streamlined, proven workflow with clear milestones and communication channels.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Revision Flexibility</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Structured yet flexible revision process to ensure your complete satisfaction.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Technical Expertise</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Advanced technical capabilities across all aspects of automation development and system integration.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><AverageIcon /></div></td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div>
                  <div className="font-medium">Asset Management</div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    Comprehensive documentation, code management, and knowledge transfer for long-term maintainability.
                  </div>
                </div>
              </td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><GoodIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><ExcellentIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
              <td className="p-4"><div className="flex justify-center items-center h-full"><PoorIcon /></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
} 