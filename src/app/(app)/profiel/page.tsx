import { getCurrentUserId } from "@/lib/auth";
import { getTeamLidByClerkId } from "@/lib/queries/profile";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProfielPage() {
  const userId = await getCurrentUserId();
  const teamLid = await getTeamLidByClerkId(userId);

  if (!teamLid) {
    return (
      <div>
        <PageHeader
          title="Mijn profiel"
          description="Je profiel is nog niet aangemaakt. Neem contact op met een beheerder."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Mijn profiel"
        description="Bewerk je persoonlijke gegevens"
      />
      <Card>
        <CardContent className="pt-6">
          <ProfileForm teamLid={teamLid} />
        </CardContent>
      </Card>
    </div>
  );
}
