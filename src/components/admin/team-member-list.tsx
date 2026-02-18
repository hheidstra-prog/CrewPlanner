"use client";

import { useRouter } from "next/navigation";
import { Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { setUserRole } from "@/lib/actions/users";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  imageUrl: string;
  role: "admin" | "member";
  isCurrentUser: boolean;
}

interface TeamMemberListProps {
  members: TeamMember[];
}

export function TeamMemberList({ members }: TeamMemberListProps) {
  const router = useRouter();

  const handleToggleRole = async (member: TeamMember) => {
    const newRole = member.role === "admin" ? "member" : "admin";
    const action = newRole === "admin" ? "beheerder maken" : "beheerder afnemen";

    if (!confirm(`Weet je zeker dat je ${member.fullName} wilt ${action}?`)) {
      return;
    }

    const result = await setUserRole(member.id, newRole);
    if (result.success) {
      toast.success(
        newRole === "admin"
          ? `${member.fullName} is nu beheerder`
          : `${member.fullName} is nu teamlid`
      );
      router.refresh();
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg p-2 hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <UserAvatar
              imageUrl={member.imageUrl}
              initials={member.initials}
              fullName={member.fullName}
            />
            <div>
              <p className="text-sm font-medium">
                {member.fullName}
                {member.isCurrentUser && (
                  <span className="ml-1 text-xs text-muted-foreground">(jij)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={member.role === "admin" ? "default" : "secondary"}>
              {member.role === "admin" ? "Beheerder" : "Teamlid"}
            </Badge>
            {!member.isCurrentUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={
                  member.role === "admin"
                    ? "Beheerder afnemen"
                    : "Beheerder maken"
                }
                onClick={() => handleToggleRole(member)}
              >
                {member.role === "admin" ? (
                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Shield className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
