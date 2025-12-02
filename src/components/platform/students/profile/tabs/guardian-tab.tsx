import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, User, Briefcase, Plus, Pencil } from "lucide-react";
import type { Student } from "../../registration/types";

interface GuardianTabProps {
  student: Student;
}

export function GuardianTab({ student }: GuardianTabProps) {
  // In real implementation, fetch guardian data from database
  const guardians = student.studentGuardians || [];

  // Mock data for demonstration
  const mockGuardians = [
    {
      id: "1",
      guardian: {
        givenName: "John",
        surname: "Doe",
        emailAddress: "john.doe@example.com",
        phoneNumbers: [
          { phoneNumber: "+966 50 123 4567", phoneType: "mobile", isPrimary: true },
          { phoneNumber: "+966 11 234 5678", phoneType: "home", isPrimary: false },
        ],
      },
      guardianType: { name: "Father" },
      isPrimary: true,
      occupation: "Software Engineer",
      workplace: "Tech Corp",
    },
    {
      id: "2",
      guardian: {
        givenName: "Jane",
        surname: "Doe",
        emailAddress: "jane.doe@example.com",
        phoneNumbers: [
          { phoneNumber: "+966 50 987 6543", phoneType: "mobile", isPrimary: true },
        ],
      },
      guardianType: { name: "Mother" },
      isPrimary: false,
      occupation: "Doctor",
      workplace: "City Hospital",
    },
  ];

  const displayGuardians = guardians.length > 0 ? guardians : mockGuardians;

  const getInitials = (givenName: string, surname: string) => {
    return `${givenName?.[0] || ""}${surname?.[0] || ""}`.toUpperCase();
  };

  const getPhoneIcon = (type: string) => {
    switch (type) {
      case "mobile": return "📱";
      case "home": return "🏠";
      case "work": return "💼";
      case "emergency": return "🚨";
      default: return "📞";
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Guardian Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Guardian
        </Button>
      </div>

      {displayGuardians.map((guardianRel: any, index) => {
        const guardian = guardianRel.guardian;
        const guardianType = guardianRel.guardianType?.name || guardianRel.relation;
        const fullName = `${guardian.givenName} ${guardian.surname}`;

        return (
          <Card key={guardianRel.id || index} className={guardianRel.isPrimary ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={guardian.profileUrl} alt={fullName} />
                    <AvatarFallback>{getInitials(guardian.givenName, guardian.surname)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {fullName}
                      {guardianRel.isPrimary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {guardianType}
                      </span>
                      {guardianRel.occupation && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {guardianRel.occupation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-2">
                <h4 className="font-medium">Contact Information</h4>
                <div className="grid gap-2">
                  {guardian.emailAddress && (
                    <a
                      href={`mailto:${guardian.emailAddress}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {guardian.emailAddress}
                    </a>
                  )}
                  {guardian.phoneNumbers?.map((phone: any, phoneIndex: number) => (
                    <div key={phoneIndex} className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${phone.phoneNumber}`}
                        className="text-blue-600 hover:underline"
                      >
                        {phone.phoneNumber}
                      </a>
                      <span className="text-muted-foreground">
                        {getPhoneIcon(phone.phoneType)} {phone.phoneType}
                      </span>
                      {phone.isPrimary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Information */}
              {guardianRel.workplace && (
                <div className="space-y-2">
                  <h4 className="font-medium">Work Information</h4>
                  <p className="text-sm text-muted-foreground">
                    {guardianRel.occupation} at {guardianRel.workplace}
                  </p>
                </div>
              )}

              {/* Address if different from student */}
              {guardian.address && (
                <div className="space-y-2">
                  <h4 className="font-medium">Address</h4>
                  <p className="text-sm text-muted-foreground">{guardian.address}</p>
                </div>
              )}

              {/* Permissions & Access */}
              <div className="space-y-2">
                <h4 className="font-medium">Permissions</h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Can Pick Up</Badge>
                  <Badge variant="outline" className="text-xs">Receives Reports</Badge>
                  <Badge variant="outline" className="text-xs">Emergency Contact</Badge>
                  <Badge variant="outline" className="text-xs">Fee Payment</Badge>
                </div>
              </div>

              {/* Notes */}
              {guardianRel.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">{guardianRel.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {displayGuardians.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No guardians registered</p>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Guardian
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Guardian Access Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guardian Access History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>John Doe accessed student portal</span>
              <span className="text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Jane Doe viewed progress report</span>
              <span className="text-muted-foreground">Yesterday</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>John Doe paid school fees</span>
              <span className="text-muted-foreground">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}