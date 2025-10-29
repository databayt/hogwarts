import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserEditProfile from "./user-edit-profile";
import { currentUser } from "@/components/auth/auth";
import { getUserById } from "@/components/auth/user";

export default async function UserProfile() {
  const user = await currentUser();
  const extendedUser = user ? await getUserById(user.id) : null;
  const firstName = extendedUser?.username?.split(" ")[0];
  const lastName = extendedUser?.username?.split(" ").slice(1).join(" ") || undefined;
  
  return (
    <Dialog>
      <DialogTrigger className="w-full text-left px-2 py-1 cursor-pointer hover:bg-muted-foreground/5">
        Profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Edit your profile details here.</DialogDescription>
        </DialogHeader>

        <UserEditProfile
          firstName={firstName || undefined}
          lastName={lastName}
          currency={undefined}
          email={user?.email || undefined}
        />
      </DialogContent>
    </Dialog>
  );
}


