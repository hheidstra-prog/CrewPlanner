"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationBellClient({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/notifications/count");
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
        }
      } catch {
        // silently ignore polling errors
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/inbox"
      className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors"
    >
      <Mail className="h-5 w-5 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-niet-beschikbaar px-1 text-[10px] font-bold text-white font-mono">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
