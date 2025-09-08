import { ExtendedUser } from "@/next-auth";
import { 
  Card, 
  CardContent, 
  CardHeader
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserInfoProps {
  user?: ExtendedUser;
  label: string;
};

export const UserInfo = ({
  user,
  label,
}: UserInfoProps) => {
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <h2 className="text-center">
          {label}
        </h2>
      </CardHeader>
      <CardContent className="space-y-3 tracking-wider">
        
          <p className="lead flex gap-4"><strong>ID: </strong> {user?.id}</p>
          <p className="lead flex gap-4"><strong>Name: </strong> {user?.name}</p>
          <p className="lead flex gap-4"><strong>Email: </strong> {user?.email}</p>
          <p className="lead flex gap-4"><strong>Role: </strong> {user?.role}</p>
         
          <div className="flex gap-4 lead">
             <strong>2FA: </strong>
             <Badge 
               className={`px-2 ${user?.isTwoFactorEnabled ? "bg-green-500" : "bg-red-500"} text-white`}
             >
            {user?.isTwoFactorEnabled ? "ON" : "OFF"}
          </Badge>
          </div>
          
      </CardContent>
    </Card>
  )
}
