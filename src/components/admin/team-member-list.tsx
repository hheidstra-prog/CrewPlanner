"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff, UserX, UserCheck, Mail, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { setUserRole, toggleUserBan, sendWelcomeEmail, updateTeamMember } from "@/lib/actions/users";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  imageUrl: string;
  role: "admin" | "member";
  banned: boolean;
  isCurrentUser: boolean;
  teamLidId?: string;
  voornaam?: string;
  achternaam?: string;
  straat?: string | null;
  postcode?: string | null;
  woonplaats?: string | null;
  geboortedatum?: string | null;
  isTeamManager?: boolean;
}

interface TeamMemberListProps {
  members: TeamMember[];
}

export function TeamMemberList({ members }: TeamMemberListProps) {
  const router = useRouter();
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSendWelcome = async (member: TeamMember) => {
    if (!confirm(`Welkomstmail sturen naar ${member.fullName} (${member.email})?`)) {
      return;
    }

    const result = await sendWelcomeEmail(member.id);
    if (result.success) {
      toast.success(`Welkomstmail verstuurd naar ${member.email}`);
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  const handleToggleBan = async (member: TeamMember) => {
    const action = member.banned ? "heractiveren" : "deactiveren";
    if (!confirm(`Weet je zeker dat je ${member.fullName} wilt ${action}?`)) {
      return;
    }

    const result = await toggleUserBan(member.id, !member.banned);
    if (result.success) {
      toast.success(
        member.banned
          ? `${member.fullName} is weer actief`
          : `${member.fullName} is gedeactiveerd`
      );
      router.refresh();
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

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

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editMember?.teamLidId) return;

    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateTeamMember(editMember.teamLidId, formData);
    setSaving(false);

    if (result.success) {
      toast.success("Profiel bijgewerkt");
      setEditMember(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
  };

  return (
    <>
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className={`flex items-center justify-between rounded-lg p-2 hover:bg-muted ${member.banned ? "opacity-50" : ""}`}
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
                <p className="text-xs text-muted-foreground">
                  {member.email}
                  {member.woonplaats && <span> &middot; {member.woonplaats}</span>}
                  {member.geboortedatum && (
                    <span> &middot; {formatDate(member.geboortedatum)}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.banned && (
                <Badge variant="destructive">Inactief</Badge>
              )}
              <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                {member.role === "admin" ? "Beheerder" : "Teamlid"}
              </Badge>
              {!member.isCurrentUser && (
                <>
                  {member.teamLidId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Profiel bewerken"
                      onClick={() => setEditMember(member)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Welkomstmail sturen"
                    onClick={() => handleSendWelcome(member)}
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </Button>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={member.banned ? "Heractiveren" : "Deactiveren"}
                    onClick={() => handleToggleBan(member)}
                  >
                    {member.banned ? (
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <UserX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Profiel bewerken</SheetTitle>
          </SheetHeader>
          {editMember && (
            <form onSubmit={handleEditSave} className="space-y-4 mt-4 px-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-voornaam">Voornaam</Label>
                  <Input
                    id="edit-voornaam"
                    name="voornaam"
                    defaultValue={editMember.voornaam ?? ""}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-achternaam">Achternaam</Label>
                  <Input
                    id="edit-achternaam"
                    name="achternaam"
                    defaultValue={editMember.achternaam ?? ""}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editMember.email}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-straat">Straat + huisnummer</Label>
                <Input
                  id="edit-straat"
                  name="straat"
                  defaultValue={editMember.straat ?? ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-postcode">Postcode</Label>
                  <Input
                    id="edit-postcode"
                    name="postcode"
                    defaultValue={editMember.postcode ?? ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-woonplaats">Woonplaats</Label>
                  <Input
                    id="edit-woonplaats"
                    name="woonplaats"
                    defaultValue={editMember.woonplaats ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-geboortedatum">Geboortedatum</Label>
                <Input
                  id="edit-geboortedatum"
                  name="geboortedatum"
                  type="date"
                  defaultValue={editMember.geboortedatum ?? ""}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-isTeamManager"
                  name="isTeamManager"
                  value="on"
                  defaultChecked={editMember.isTeamManager ?? false}
                />
                <Label htmlFor="edit-isTeamManager" className="text-sm">Team manager</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Opslaan..." : "Opslaan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMember(null)}
                >
                  Annuleren
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
