import { Palette, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BrandingCardProps {
  logoUrl?: string;
  brandName: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

export function BrandingCard({ 
  logoUrl, 
  brandName, 
  tagline,
  primaryColor = "#000000",
  secondaryColor = "#ffffff",
  className 
}: BrandingCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          School Branding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Brand Preview */}
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-3 mb-3">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="School Logo" 
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-foreground">{brandName || "School Name"}</h3>
                {tagline && (
                  <p className="muted text-muted-foreground">{tagline}</p>
                )}
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="muted font-medium">Primary</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{primaryColor}</span>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: secondaryColor }}
                />
                <span className="muted font-medium">Secondary</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{secondaryColor}</span>
            </div>
          </div>

          {!brandName && (
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="muted text-muted-foreground">
                Please set your school branding to continue setup
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
