import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { clerkClient } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskGroupManager } from "@/components/tasks/task-group-manager";

export default async function BeheerPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const client = await clerkClient();
  const [{ data: users }, taskGroups] = await Promise.all([
    client.users.getUserList({ limit: 100 }),
    prisma.taskGroup.findMany({
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Beheer"
        description="Teamleden en instellingen"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Teamleden
            <span className="font-mono text-sm font-normal text-muted-foreground">
              ({users.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => {
              const firstName = user.firstName ?? "";
              const lastName = user.lastName ?? "";
              const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Onbekend";
              const initials = [firstName, lastName]
                .filter(Boolean)
                .map((n) => n[0]?.toUpperCase())
                .join("") || "?";
              const role = (user.publicMetadata?.role as string) ?? "member";

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      imageUrl={user.imageUrl}
                      initials={initials}
                      fullName={fullName}
                    />
                    <div>
                      <p className="text-sm font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                  </div>
                  <Badge variant={role === "admin" ? "default" : "secondary"}>
                    {role === "admin" ? "Beheerder" : "Teamlid"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <TaskGroupManager groups={taskGroups} />
      </div>
    </div>
  );
}
