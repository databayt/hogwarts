import Link from "next/link";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

export function NewComers() {
  return (
    <section className="py-16">
      <div className=" sm:px-6 lg:px-8">
        <div className="text-center">
            <p className="flex items-center justify-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4" /> Internal</p>
          <h2 className="text-3xl md:text-5xl font-signifier pb-4 ">
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
