import { Suspense } from "react";
import { NewPasswordForm } from "@/components/auth/password/form";

const NewPasswordPage = () => {
  return ( 
    <Suspense fallback={<div className="h-10" />}> 
      <NewPasswordForm />
    </Suspense>
   );
}
 
export default NewPasswordPage;