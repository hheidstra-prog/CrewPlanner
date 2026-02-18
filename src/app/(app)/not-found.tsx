import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Compass className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-navy">Pagina niet gevonden</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Deze pagina bestaat niet of is verplaatst. Misschien ben je van koers
        geraakt?
      </p>
      <Link href="/" className="mt-6">
        <Button>Terug naar dashboard</Button>
      </Link>
    </div>
  );
}
