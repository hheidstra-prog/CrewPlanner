"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";

type PushState = "loading" | "unsupported" | "subscribed" | "unsubscribed";

export function PushToggle() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setState("unsupported"));
  }, []);

  if (state === "loading" || state === "unsupported") return null;

  async function toggle() {
    if (busy) return;
    setBusy(true);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (state === "subscribed") {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setState("unsubscribed");
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setBusy(false);
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        const keys = sub.toJSON().keys;
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: { p256dh: keys?.p256dh, auth: keys?.auth },
          }),
        });
        setState("subscribed");
      }
    } catch (err) {
      console.error("Push toggle failed:", err);
    } finally {
      setBusy(false);
    }
  }

  const isSubscribed = state === "subscribed";

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={isSubscribed ? "Pushmeldingen uitschakelen" : "Pushmeldingen inschakelen"}
      className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
    >
      {isSubscribed ? (
        <BellRing className="h-5 w-5 text-ocean" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  );
}
