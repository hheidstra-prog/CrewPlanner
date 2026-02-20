"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  notificationBell?: React.ReactNode;
  pushToggle?: React.ReactNode;
}

export function Header({ notificationBell, pushToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-navy md:hidden">CrewPlanner</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/profiel" title="Mijn profiel">
              <User className="h-4 w-4" />
            </Link>
          </Button>
          {pushToggle}
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
