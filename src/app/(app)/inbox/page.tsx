import { PageHeader } from "@/components/shared/page-header";
import { InboxContent } from "@/components/layout/inbox-content";
import { getNotifications } from "@/lib/queries/notifications";
import { getCurrentUserId } from "@/lib/auth";
import { resolveUsers } from "@/lib/users";

export default async function InboxPage() {
  const userId = await getCurrentUserId();

  const notifications = await getNotifications(userId);
  const actorIds = [...new Set(notifications.map((n) => n.actorId))];
  const usersMap = await resolveUsers(actorIds);

  // Convert to serializable record for client component
  const actorNames: Record<string, string> = {};
  for (const [id, user] of usersMap) {
    actorNames[id] = user.fullName;
  }

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Meldingen over activiteit in je team"
      />
      <InboxContent
        notifications={notifications}
        actorNames={actorNames}
      />
    </div>
  );
}
