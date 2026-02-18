import { APP_URL } from "@/lib/email";

export function nieuwEvenementEmail({
  titel,
  datum,
  locatie,
  eventId,
}: {
  titel: string;
  datum: string;
  locatie?: string | null;
  eventId: string;
}) {
  const eventUrl = `${APP_URL}/evenementen/${eventId}`;

  return {
    subject: `Je bent uitgenodigd voor: ${titel}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e3a5f; margin-bottom: 16px;">Nieuw evenement</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          Je bent uitgenodigd voor <strong>${titel}</strong>.
        </p>
        <table style="margin: 16px 0; font-size: 14px; color: #555;">
          <tr>
            <td style="padding: 4px 12px 4px 0; font-weight: 600;">Datum:</td>
            <td style="padding: 4px 0;">${datum}</td>
          </tr>
          ${locatie ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Locatie:</td><td style="padding: 4px 0;">${locatie}</td></tr>` : ""}
        </table>
        <p style="color: #333; font-size: 14px; line-height: 1.5;">
          Geef je beschikbaarheid door via onderstaande link.
        </p>
        <a href="${eventUrl}" style="display: inline-block; margin-top: 12px; padding: 10px 24px; background-color: #1e3a5f; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Bekijk evenement
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          Dit bericht is verzonden door CrewPlanner.
        </p>
      </div>
    `,
  };
}
