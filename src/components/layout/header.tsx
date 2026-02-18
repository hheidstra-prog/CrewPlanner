"use client";

import { UserButton } from "@clerk/nextjs";
import { Suspense } from "react";

interface HeaderProps {
  notificationBell?: React.ReactNode;
}

export function Header({ notificationBell }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-navy md:hidden">CrewPlanner</span>
        </div>
        <div className="flex items-center gap-2">
          {notificationBell}
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
