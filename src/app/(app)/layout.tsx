import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { PushToggle } from "@/components/layout/push-toggle";
import { ChatOverlay } from "@/components/chat/chat-overlay";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          pushToggle={<PushToggle />}
          notificationBell={
            <Suspense>
              <NotificationBell />
            </Suspense>
          }
        />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="mx-auto max-w-5xl p-4 md:p-6">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
      <ChatOverlay />
    </div>
  );
}
