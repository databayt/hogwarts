import { GraduationCap, BookOpen, Library, School, Building2, Landmark, Wrench, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DescriptionCardProps {
  schoolLevel?: 'primary' | 'secondary' | 'both' | null;
  schoolType?: 'private' | 'public' | 'international' | 'technical' | 'special' | null;
  className?: string;
}

export function DescriptionCard({ schoolLevel, schoolType, className }: DescriptionCardProps) {
  const getLevelInfo = () => {
    switch (schoolLevel) {
      case 'primary':
        return { title: 'Primary School', description: 'Elementary education (ages 6-11)', icon: BookOpen };
      case 'secondary':
        return { title: 'Secondary School', description: 'Middle and high school (ages 12-18)', icon: GraduationCap };
      case 'both':
        return { title: 'Primary & Secondary', description: 'Complete K-12 education system', icon: Library };
      default:
        return { title: 'Not selected', description: 'Please select grade levels', icon: BookOpen };
    }
  };

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

  const levelInfo = getLevelInfo();
  const typeInfo = getTypeInfo();
  const hasData = schoolLevel && schoolType;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          School Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* School Level */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <levelInfo.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{levelInfo.title}</p>
                <p className="text-sm text-muted-foreground">{levelInfo.description}</p>
              </div>
            </div>
          </div>

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
                Please complete your school description to continue setup
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
