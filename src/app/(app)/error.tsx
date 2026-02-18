"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold text-navy">Er ging iets mis</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Er is een onverwachte fout opgetreden. Probeer het opnieuw.
      </p>
      <Button onClick={reset} className="mt-6">
        Opnieuw proberen
      </Button>
    </div>
  );
}
