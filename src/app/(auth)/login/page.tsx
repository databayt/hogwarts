import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login/form";

const LoginPage = () => {
  return ( 
    <Suspense fallback={<div className="h-10" />}> 
      <LoginForm />
    </Suspense>
  );
}
 
export default LoginPage;