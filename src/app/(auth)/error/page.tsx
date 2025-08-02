import { Suspense } from "react";
import { ErrorCard } from "@/components/auth/error-card";

const AuthErrorPage = () => {
  return ( 
    <Suspense fallback={<div className="h-10" />}> 
      <ErrorCard />
    </Suspense>
  );
};
 
export default AuthErrorPage;
