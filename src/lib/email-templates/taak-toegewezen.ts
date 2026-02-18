import { APP_URL } from "@/lib/email";

export function taakToegewezenEmail({
  titel,
  taskId,
}: {
  titel: string;
  taskId: string;
}) {
  const taskUrl = `${APP_URL}/taken/${taskId}`;

  return {
    subject: `Taak aan jou toegewezen: ${titel}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e3a5f; margin-bottom: 16px;">Nieuwe taak</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          Er is een taak aan jou toegewezen: <strong>${titel}</strong>.
        </p>
        <a href="${taskUrl}" style="display: inline-block; margin-top: 12px; padding: 10px 24px; background-color: #1e3a5f; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Bekijk taak
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          Dit bericht is verzonden door CrewPlanner.
        </p>
      </div>
    `,
  };
}
