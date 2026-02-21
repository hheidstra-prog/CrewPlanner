import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { auth } from "@clerk/nextjs/server";
import { resolveUser } from "@/lib/users";
import { getUserRole } from "@/lib/auth";
import { createTools } from "@/lib/ai/tools";

// Simple in-memory rate limiter (fine for 10-20 person team)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_HOUR = 50;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= MAX_MESSAGES_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Niet ingelogd", { status: 401 });
  }

  if (!checkRateLimit(userId)) {
    return new Response(
      "Je hebt het limiet van 50 berichten per uur bereikt. Probeer het later opnieuw.",
      { status: 429 }
    );
  }

  const { messages: uiMessages } = await req.json();
  const messages = await convertToModelMessages(uiMessages);

  const [user, role] = await Promise.all([
    resolveUser(userId),
    getUserRole(),
  ]);

  const userName = user?.fullName ?? "Onbekend";
  const isAdmin = role === "admin";
  const datum = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `Je bent de CrewPlanner Assistent, een behulpzame chatbot voor het zeilteam.
Je communiceert altijd in het Nederlands, informeel maar duidelijk.
De huidige gebruiker is: **${userName}** (${isAdmin ? "team manager / beheerder" : "teamlid"}).
De huidige datum is: ${datum}.

Je kunt informatie opzoeken via tools en acties uitvoeren namens de gebruiker.

## Rol: ${isAdmin ? "Team Manager" : "Teamlid"}
${isAdmin ? `Als beheerder help je met:
- **Overzicht**: wie heeft nog niet gereageerd op evenementen, hoeveel leden beschikbaar per wedstrijd
- **Statistieken**: opkomstpercentages, responstijden, taakvoortgang per lid
- **Planning**: overzicht van aankomende wedstrijden en evenementen, conflicten signaleren
- **Acties**: je kunt beschikbaarheid instellen, taken oppakken/afronden en reacties plaatsen
- Bied proactief aan om niet-reageerders te tonen of een samenvatting te geven van de teamstatus` : `Als teamlid help je met:
- **Beschikbaarheid**: op welke evenementen moet je nog reageren, je beschikbaarheid instellen
- **Taken**: welke taken staan open, taken oppakken of afronden
- **Informatie**: aankomende wedstrijden en evenementen, locaties, tijden
- **Acties**: je kunt je beschikbaarheid instellen, taken oppakken/afronden en reacties plaatsen
- Herinner het lid proactief aan evenementen waarop nog niet gereageerd is`}

## Regels
1. Antwoord altijd in het Nederlands
2. Wees beknopt en vriendelijk
3. Vraag ALTIJD eerst om bevestiging voordat je een actie uitvoert (beschikbaarheid instellen, taak oppakken, reactie plaatsen)
4. Als je iets niet weet, zeg dat eerlijk — verzin geen data
5. Gebruik tools om informatie op te halen, gebruik nooit eerder opgehaalde data als de gebruiker om actuele info vraagt
6. Gebruik markdown voor opmaak: lijsten met - voor opsommingen, **vet** voor namen/titels, en korte paragrafen. Geef evenementen en taken altijd als een lijst weer met relevante details (datum, locatie, status).`,
    messages,
    tools: createTools(userId, isAdmin),
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
