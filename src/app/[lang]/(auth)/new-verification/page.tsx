import { Suspense } from "react";
import { NewVerificationForm } from "@/components/auth/verification/form";

const NewVerificationPage = () => {
  return ( 
    <Suspense fallback={<div className="h-10" />}> 
      <NewVerificationForm />
    </Suspense>
   );
}
 
export default NewVerificationPage;