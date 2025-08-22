import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Navigation Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to App
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">
                Debug Console
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Test OAuth
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Page Content */}
      {children}
    </div>
  );
}
