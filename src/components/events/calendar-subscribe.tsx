"use client";

import { useState } from "react";
import { CalendarSync, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getOrCreateCalendarToken,
  regenerateCalendarToken,
} from "@/lib/actions/calendar";

export function CalendarSubscribe() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleOpen(open: boolean) {
    if (open && !url) {
      setLoading(true);
      try {
        const token = await getOrCreateCalendarToken();
        const base = window.location.origin;
        setUrl(`${base}/api/calendar/${token}.ics`);
      } catch {
        toast.error("Kon agenda-link niet ophalen");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link gekopieerd!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const token = await regenerateCalendarToken();
      const base = window.location.origin;
      setUrl(`${base}/api/calendar/${token}.ics`);
      toast.success("Nieuwe link aangemaakt");
    } catch {
      toast.error("Kon link niet vernieuwen");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarSync className="mr-2 h-4 w-4" />
          Agenda
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agenda-abonnement</DialogTitle>
          <DialogDescription>
            Voeg deze URL toe als agenda-abonnement in je agenda-app (Google
            Calendar, Apple Calendar, Outlook). Je agenda wordt automatisch
            bijgewerkt.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : url ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={url} readOnly className="text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-muted-foreground"
            >
              <RefreshCw className={`mr-2 h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
              Link vernieuwen
            </Button>

            <p className="text-xs text-muted-foreground">
              Als je de link vernieuwt, werkt de oude link niet meer. Gebruik
              dit als je link per ongeluk gedeeld is.
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
