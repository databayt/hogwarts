import Link from "next/link";
import NewsLetter from "./newsletter";
import { footerSections } from "./config";
import { Icons } from "@/components/atom/icons";

export function MarketingFooter() {
    return (
        <footer className="bg-muted py-8 full-bleed">
            <div className="w-full px-1 sm:px-2 lg:px-8 pt-6 pb-3">
                {/* Newsletter and Links Section */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-0 mb-16">
                    {/* Newsletter Section */}
                    <div className="w-full lg:w-[25%] mb-8 lg:mb-0 flex justify-center lg:justify-start">
                        <div className="w-full max-w-sm lg:max-w-none">
                            <NewsLetter />
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="w-full pl-20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 lg:gap-20 lg:flex  lg:items-start px-0 text-center lg:text-left">
                            {footerSections.map((section) => (
                                <div key={section.title} className="w-full lg:flex-1">
                                    <h3 className="text-sm font-medium mb-4">{section.title}</h3>
                                    <ul className="space-y-2">
                                        {section.links.map((link) => (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    className="text-xs font-normal lg:text-sm text-primary/70 hover:text-primary transition-colors"
                                                >
                                                    {link.text}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-8 border-t border-primary/20">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-10">
                        <Link href="/" className="hidden items-center gap-2 md:flex">
                            <div className="w-8 h-8">
                                <Icons.logo className="text-foreground" />
                            </div>
                            <h1 className="text-2xl font-bold">Databayt</h1>
                        </Link>
                        <div className="w-full lg:w-[75%] text-xs text-primary/70 ">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1 mt-2">
                                <span>© copyright free.</span>
                                <span className="hidden sm:inline">•</span>
                                <Link href="/terms-of-use" className="hover:text-primary transition-colors">
                                    Terms
                                </Link>
                                <span className="hidden sm:inline">•</span>
                                <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                                    Privacy
                                </Link>
                                <span className="hidden sm:inline">•</span>
                                <Link href="/safety" className="hover:text-primary transition-colors">
                                    Safety
                                </Link>
                                <span className="hidden sm:inline">•</span>
                                <Link href="/status" className="hover:text-primary transition-colors">
                                    Status
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
