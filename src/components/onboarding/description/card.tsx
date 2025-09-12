import { GraduationCap, School, Building2, Landmark, Wrench, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DescriptionCardProps {
  schoolType?: 'private' | 'public' | 'international' | 'technical' | 'special' | null;
  className?: string;
}

export function DescriptionCard({ schoolType, className }: DescriptionCardProps) {
  const getTypeInfo = () => {
    switch (schoolType) {
      case 'private':
        return { title: 'Private School', icon: Building2 };
      case 'public':
        return { title: 'Public School', icon: School };
      case 'international':
        return { title: 'International School', icon: Landmark };
      case 'technical':
        return { title: 'Technical School', icon: Wrench };
      case 'special':
        return { title: 'Special School', icon: Heart };
      default:
        return { title: 'Not selected', icon: School };
    }
  };

  const typeInfo = getTypeInfo();
  const hasData = !!schoolType;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          School Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* School Type */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <typeInfo.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{typeInfo.title}</p>
                <p className="text-sm text-muted-foreground">Educational model and structure</p>
              </div>
            </div>
          </div>
          
          {!hasData && (
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Please select your school type to continue setup
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
