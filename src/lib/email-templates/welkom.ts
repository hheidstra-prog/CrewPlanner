import { APP_URL } from "@/lib/email";

export function welkomEmail({ voornaam }: { voornaam: string }) {
  const signInUrl = `${APP_URL}/sign-in`;

  return {
    subject: "Welkom bij CrewPlanner!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e3a5f; margin-bottom: 16px;">Welkom bij CrewPlanner!</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          Hoi ${voornaam}, je bent toegevoegd aan het team.
        </p>
        <p style="color: #333; font-size: 14px; line-height: 1.5;">
          Om in te loggen, ga naar de inlogpagina en klik op <strong>"Wachtwoord vergeten?"</strong> om je wachtwoord in te stellen.
        </p>
        <div style="margin-top: 20px;">
          <a href="${signInUrl}" style="display: inline-block; padding: 10px 24px; background-color: #1e3a5f; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
            Ga naar CrewPlanner
          </a>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          Dit bericht is verzonden door CrewPlanner.
        </p>
      </div>
    `,
  };
}
