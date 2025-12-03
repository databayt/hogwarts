import Link from "next/link";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

export function NewComers() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center">
            <p className="flex items-center justify-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4" /> Internal</p>
          <h2 className="pb-4 ">
            New Comers
          </h2>

          <p className="text-muted-foreground pb-8">
            Welcome on board
          </p>

          <Link
            href="/onboarding"
           
          >
            <Button  size= 'lg' className="rounded-full py-6">
            Onboarding
            </Button>
          </Link>

          

          
        </div>
      </div>
    </section>
  );
}
