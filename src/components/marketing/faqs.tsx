"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"

export default function FAQs() {
  return (
    <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
      <div className="">
        <div className="grid gap-y-12 px-2 lg:[grid-template-columns:1fr_auto]">
          <div className="text-center lg:text-left">
            <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
              Frequently <br className="hidden lg:block" /> Asked <br className="hidden lg:block" />
              Questions
            </h2>
            <p className="text-muted-foreground">Everything you need to know about our platform and services.</p>
          </div>
          <div className="divide-y divide-dashed sm:mx-auto sm:max-w-xl lg:mx-0">
            <div className="pb-6">
              <h3 className="font-medium">Is the educational platform really open source?</h3>
              <p className="text-muted-foreground my-4">Yes! Every component and building block is open source. We charge for crafting fully functional educational solutions and ensuring their ongoing reliability.</p>
              <ul className="list-outside list-disc space-y-2 pl-4">
                <li className="text-muted-foreground">All educational components and templates are freely available</li>
                <li className="text-muted-foreground">Contributors earn a share of the value they help create</li>
                <li className="text-muted-foreground">Full transparency in development and educational processes</li>
                <li className="text-muted-foreground">Community-driven innovation in education technology</li>
              </ul>
            </div>
            <div className="pt-6">
              <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-base font-medium">
                    What services do you offer?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-4">We automate repetitive business processes, streamline workflows, and build custom solutions that save you time and reduce manual work.</p>
                    <ol className="list-outside list-decimal space-y-2 pl-4">
                      <li className="text-muted-foreground">Data processing and analysis automation</li>
                      <li className="text-muted-foreground">Workflow optimization and task automation</li>
                      <li className="text-muted-foreground">Custom enterprise applications and integrations</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-base font-medium">
                    How much do you charge?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Our pricing is transparent and based on the complexity and scope of your project. We offer competitive rates and flexible payment terms.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-base font-medium">
                    How long does it take to complete a project?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Project timelines vary based on complexity. Simple automations can be completed in days, while complex enterprise solutions may take weeks or months.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-base font-medium">
                    Do you provide ongoing support?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, we offer comprehensive support and maintenance packages to ensure your solutions continue to work optimally.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-base font-medium">
                    Can you work with my existing systems?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Absolutely! We specialize in integrating with existing systems and can work with your current infrastructure.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-base font-medium">
                    I&apos;m busy with other commitments. Can I still contribute?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-4">Perfect! Most contributors work part-time:</p>
                    <ul className="list-outside list-disc space-y-2 pl-4">
                      <li className="text-muted-foreground">No minimum time commitment required</li>
                      <li className="text-muted-foreground">Contribute when your schedule allows</li>
                      <li className="text-muted-foreground">Start with small tasks and grow your involvement</li>
                      <li className="text-muted-foreground">Earn proportional to your contribution level</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-base font-medium">
                    How do I start contributing?
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-outside list-disc space-y-2 pl-4">
                      <li className="text-muted-foreground">Explore the codebase at our GitHub repository</li>
                      <li className="text-muted-foreground">Join our community discussions to introduce yourself</li>
                      <li className="text-muted-foreground">Pick a first issue - we have &quot;good first issue&quot; labels for newcomers</li>
                      <li className="text-muted-foreground">Submit a pull request - start small and build up</li>
                      <li className="text-muted-foreground">Earn your first revenue share as your contributions are used</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger className="text-base font-medium">
                    How do I get started?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Contact us for a consultation where we&apos;ll discuss your specific needs, challenges, and goals. We&apos;ll recommend the best approach and provide a detailed proposal.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger className="text-base font-medium">
                    Can I use Databayt components in my own projects?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! All components are open source and can be used in your projects according to their respective licenses. We encourage reuse and building upon our work.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12">
                  <AccordionTrigger className="text-base font-medium">
                    Can I include Databayt projects in my portfolio?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-4">Absolutely! Working with us provides multiple portfolio benefits:</p>
                    <ul className="list-outside list-disc space-y-2 pl-4">
                      <li className="text-muted-foreground">Add real-world enterprise projects to your portfolio</li>
                      <li className="text-muted-foreground">Showcase your contributions to open-source</li>
                      <li className="text-muted-foreground">Demonstrate experience with modern tech stack</li>
                      <li className="text-muted-foreground">Build a public contribution history on GitHub</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-13">
                  <AccordionTrigger className="text-base font-medium">
                    How does the earning model work for real-world projects?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-4">Our earning model has multiple streams:</p>
                    <ul className="list-outside list-disc space-y-2 pl-4">
                      <li className="text-muted-foreground">Revenue share from components used in client projects</li>
                      <li className="text-muted-foreground">Direct earnings from client project implementations</li>
                      <li className="text-muted-foreground">Ongoing maintenance and support revenue</li>
                      <li className="text-muted-foreground">Bonus rewards for high-impact contributions</li>
                      <li className="text-muted-foreground">Ownership stake in projects you help build</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11">
                  <AccordionTrigger className="text-base font-medium">
                    Still have questions?
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-outside list-disc space-y-2 pl-4">
                      <li className="text-muted-foreground">
                        <Link 
                          href="https://github.com/abdout/databayt/discussions" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Join our community discussions on GitHub
                        </Link>
                      </li>
                      <li className="text-muted-foreground">
                        <Link 
                          href="https://discord.gg/uPa4gGG62c" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Join our Discord community
                        </Link>
                      </li>
                      <li className="text-muted-foreground">Contact us for a free consultation</li>
                      <li className="text-muted-foreground">
                        <Link 
                          href="/docs" 
                          className="hover:underline"
                        >
                          Check our documentation at databayt.org/docs
                        </Link>
                      </li>
                      <li className="text-muted-foreground">
                        <Link 
                          href="mailto:hello@databayt.org"
                          className="hover:underline"
                        >
                          Email us at hello@databayt.org
                        </Link>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}