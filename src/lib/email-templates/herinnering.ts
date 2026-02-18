import { APP_URL } from "@/lib/email";

export function herinneringEmail({
  titel,
  deadline,
  eventId,
}: {
  titel: string;
  deadline: string;
  eventId: string;
}) {
  const eventUrl = `${APP_URL}/evenementen/${eventId}`;

  return {
    subject: `Herinnering: reageer op ${titel} voor ${deadline}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e3a5f; margin-bottom: 16px;">Herinnering</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          Je hebt nog niet gereageerd op <strong>${titel}</strong>.
        </p>
        <p style="color: #555; font-size: 14px; line-height: 1.5;">
          De deadline is <strong>${deadline}</strong>. Geef zo snel mogelijk je beschikbaarheid door.
        </p>
        <a href="${eventUrl}" style="display: inline-block; margin-top: 12px; padding: 10px 24px; background-color: #1e3a5f; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Reageer nu
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          Dit bericht is verzonden door CrewPlanner.
        </p>
      </div>
    `,
  };
}
