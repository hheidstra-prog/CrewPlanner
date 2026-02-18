# CrewPlanner — Instructie voor Claude Code

## Context & Doel

Bouw een webapplicatie genaamd **CrewPlanner** voor een zeilteam van 10-20 personen. Het team communiceert nu via WhatsApp, waardoor belangrijke informatie verloren gaat tussen irrelevante berichten, en het organiseren van beschikbaarheid een frustrerende klus is.

CrewPlanner vervangt WhatsApp als primaire teamtool met een gestructureerde omgeving waar informatie een vaste plek heeft en communicatie contextgebonden is.

Er is één vaste boot. Het team heeft een klein bestuur (2-3 personen) dat de organisatie doet.

---

## Gebruikersrollen

### Admin (Bestuur, 2-3 personen)
- Kunnen evenementen aanmaken, bewerken en verwijderen
- Kunnen mededelingen/informatie publiceren
- Kunnen taken aanmaken en toewijzen
- Kunnen teamleden uitnodigen en beheren
- Hebben een dashboard met overzicht van beschikbaarheid en taken

### Teamlid
- Kunnen beschikbaarheid per evenement aangeven
- Kunnen informatie raadplegen en doorzoeken
- Kunnen reageren/discussiëren op items (contextgebonden)
- Kunnen taken oppakken en als afgerond markeren
- Kunnen de AI-assistent vragen stellen

---

## Vier Hoofdpijlers

### 1. Planning & Beschikbaarheid

**User Stories:**

- Als admin wil ik evenementen aanmaken met type (wedstrijd, training, onderhoudsdagen, sociaal), datum, tijd, locatie en beschrijving, zodat het team weet wat er gepland staat.
- Als admin wil ik per evenement een deadline kunnen instellen waarvoor teamleden hun beschikbaarheid moeten aangeven.
- Als admin wil ik in één oogopslag zien wie er beschikbaar is, wie niet, en wie nog niet gereageerd heeft.
- Als teamlid wil ik per evenement mijn status aangeven: beschikbaar / niet beschikbaar / twijfel.
- Als teamlid dat "niet beschikbaar" aangeeft, moet ik verplicht een reden opgeven.
- Als teamlid wil ik zien wie er verder wel/niet komt bij een evenement.
- Het systeem stuurt automatische herinneringen aan teamleden die nog niet gereageerd hebben (in-app notificatie, later eventueel email/push).

**Datamodel suggestie:**
- Event: id, type (enum: wedstrijd/training/onderhoud/sociaal), titel, beschrijving, datum, eindtijd, locatie, deadline_beschikbaarheid, aangemaakt_door
- Beschikbaarheid: id, event_id, user_id, status (enum: beschikbaar/niet_beschikbaar/twijfel), reden (verplicht bij niet_beschikbaar), tijdstip_reactie

### 2. Informatiecentrum

**User Stories:**

- Als admin wil ik mededelingen/berichten publiceren in categorieën (bijv. wedstrijdschema, reglementen, bootinfo, algemeen), zodat informatie een vaste plek heeft.
- Als teamlid wil ik alle mededelingen kunnen doorzoeken en filteren op categorie.
- Als teamlid wil ik een overzicht zien van de meest recente en belangrijke mededelingen.
- Als admin wil ik een bericht kunnen pinnen zodat het bovenaan blijft staan.
- Berichten ondersteunen rich text (koppen, lijsten, links, eventueel bijlagen).

**Datamodel suggestie:**
- Post: id, titel, inhoud (rich text), categorie (enum: wedstrijdschema/reglementen/bootinfo/algemeen), gepind (boolean), auteur_id, aangemaakt_op, bijgewerkt_op
- Bijlage: id, post_id, bestandsnaam, url

### 3. Contextgebonden Communicatie

**User Stories:**

- Als teamlid wil ik reacties/vragen kunnen plaatsen bij een specifiek evenement of mededeling, zodat discussies gekoppeld blijven aan het onderwerp.
- Als teamlid wil ik zien hoeveel reacties er op een item staan zonder dat ze de hoofdinformatie verstoren.
- Reacties worden getoond in een thread/uitklapbaar gedeelte onder het item.
- Reacties zijn chronologisch gesorteerd.
- Er is GEEN losse algemene chat — alle communicatie is gekoppeld aan een item (evenement, mededeling of taak).

**Datamodel suggestie:**
- Comment: id, parent_type (enum: event/post/task), parent_id, auteur_id, inhoud, aangemaakt_op

### 4. Taken & Checklists

**User Stories:**

- Als admin wil ik taken aanmaken met titel, beschrijving, deadline en optioneel toewijzen aan een teamlid.
- Als teamlid wil ik ongewijzigde taken kunnen claimen ("ik pak dit op").
- Als teamlid wil ik een taak als afgerond kunnen markeren.
- Iedereen kan zien welke taken open staan, wie wat doet, en wat afgerond is.
- Er is een **bijdrage-overzicht**: een transparant overzicht van hoeveel taken elk teamlid dit seizoen heeft opgepakt/afgerond. Dit creëert sociale druk en lost het probleem op dat altijd dezelfde mensen klussen doen.
- Als admin wil ik takenlijsten kunnen groeperen (bijv. "Winterklaar maken boot", "Voorbereiding regatta").

**Datamodel suggestie:**
- TaskGroup: id, titel, beschrijving
- Task: id, task_group_id (nullable), titel, beschrijving, deadline, status (enum: open/claimed/afgerond), toegewezen_aan (nullable), geclaimed_door (nullable), afgerond_op, aangemaakt_door

---

## AI-Assistent

### Doel
Een chat-interface waarmee teamleden in natuurlijke taal vragen kunnen stellen over alle data in de app. De AI is een slimme laag bovenop de gestructureerde data.

### Functionaliteit

- **Informatie opvragen**: "Welke wedstrijden zijn er in maart?", "Wie komt er zaterdag?", "Wat zijn de openstaande taken?"
- **Samenvattingen**: "Wat is er besproken over de voorjaarsregatta?" (samenvatting van comments bij dat event)
- **Suggesties**: "Wie zou de volgende klusdag het best kunnen doen?" (op basis van bijdrage-overzicht)
- **Zoeken**: "Waar vind ik de informatie over het wedstrijdreglement?"

### Technische aanpak
- Gebruik de **Anthropic API** (Claude) als LLM backend
- De AI krijgt context mee over de database-inhoud via function calling / tool use
- Definieer tools die de AI kan aanroepen:
  - `get_events(filter)` — evenementen ophalen
  - `get_availability(event_id)` — beschikbaarheid per event
  - `get_posts(categorie, zoekterm)` — mededelingen zoeken
  - `get_tasks(status, user)` — taken ophalen
  - `get_comments(parent_type, parent_id)` — reacties ophalen
  - `get_contribution_stats()` — bijdrage-overzicht
- De AI heeft alleen leesrechten — kan geen data wijzigen

---

## Technische Stack

- **Framework**: Next.js 14+ (App Router)
- **Taal**: TypeScript
- **Database**: Neon Postgres met Prisma ORM
- **Authenticatie**: Clerk (magic link / email-based login, ingebouwde UI componenten)
- **Styling**: Tailwind CSS + shadcn/ui componenten
- **AI**: Anthropic Claude API via AI SDK (Vercel)
- **Deployment**: Vercel (hosting) + Neon (database) + Clerk (auth)

### Clerk configuratie
- Gebruik Clerk's `<SignIn />` en `<UserButton />` componenten
- Rollen beheren via Clerk Organizations of metadata: `admin` en `member`
- Middleware: bescherm alle routes behalve de login-pagina
- Gebruik `currentUser()` server-side en `useUser()` client-side

### Neon configuratie
- Gebruik Prisma met `@prisma/adapter-neon` voor serverless connection pooling
- Database URL via `DATABASE_URL` environment variable

### Infrastructuur setup
- **GitHub**: aparte repository onder bestaand account
- **Vercel**: apart account specifiek voor dit project
- **Clerk**: apart account specifiek voor dit project
- **Neon**: apart project, gekoppeld via Vercel integration

---

## Design & Visuele Richting

### Concept: "Nautisch Modern"
Een clean, modern design met subtiele nautische invloeden. Geen cliché zeilbootjes en ankertjes, maar een gevoel van wind, water en openheid vertaald naar een digitale interface.

### Kleurenpalet
- **Primair**: Diep marineblauw (`#1B2A4A`) — betrouwbaar, nautisch
- **Secundair**: Helder oceaanblauw (`#2E8BC0`) — accent, actieknoppen
- **Achtergrond**: Licht zandgrijs (`#F5F3EF`) — warm, niet klinisch wit
- **Kaartachtergrond**: Wit (`#FFFFFF`)
- **Success/Beschikbaar**: Zeegroen (`#2D9F7C`)
- **Niet beschikbaar**: Warm koraalrood (`#D94F4F`)
- **Twijfel/Waarschuwing**: Amber (`#E8A838`)
- **Niet gereageerd**: Mistig grijs (`#B0B8C1`)
- **Tekst primair**: Donker (`#1A1A2E`)
- **Tekst secundair**: Gedempd (`#6B7280`)

### Typografie
- **Headings**: `DM Sans` (bold, clean, modern met karakter)
- **Body**: `DM Sans` (regular — één font family voor consistentie en snelheid)
- **Getallen/stats**: `JetBrains Mono` (monospace voor beschikbaarheidscijfers en statistieken)

### Design Principes
- **Mobile-first**: primair gebruik is op de telefoon, ontwerp daarvoor
- **Card-based layout**: evenementen, mededelingen en taken als kaarten met subtiele schaduw
- **Visuele status op één blik**: grote, duidelijke kleurindicatoren voor beschikbaarheid — geen kleine icoontjes maar kleurblokken/badges
- **Witruimte**: genereus, geef content ademruimte
- **Subtiele diepte**: lichte schaduwen (`shadow-sm`), geen harde borders waar mogelijk
- **Micro-interacties**: zachte hover-effecten, smooth transitions op beschikbaarheidsknoppen (300ms ease)

### Component-stijl
- **Kaarten**: `rounded-xl`, `shadow-sm`, witte achtergrond, `p-4` tot `p-6`
- **Knoppen**: `rounded-lg`, primaire kleur voor hoofdacties, ghost/outline voor secundair
- **Beschikbaarheidsknoppen**: grote tap-targets (minimaal 48px), kleurverandering met transitie, actieve staat duidelijk gemarkeerd met ring/border
- **Avatar/initialen**: ronde cirkels met initialen voor teamleden, in de primaire kleur
- **Badges**: afgerond, kleine tekst, achtergrondkleur op basis van status
- **Navigatie**: bottom navigation bar op mobiel (4-5 items: Dashboard, Kalender, Info, Taken, AI Chat)

### Dashboard Layout
Het dashboard is het eerste wat teamleden zien. Toon:
1. **Eerstvolgende evenement** — prominent bovenaan als hero-card met countdown ("over 3 dagen"), type-badge, en snelle beschikbaarheidsknop
2. **Jouw openstaande acties** — events waar je nog niet op gereageerd hebt (urgentie)
3. **Recente mededelingen** — laatste 2-3 posts, compact
4. **Open taken** — taken die nog geclaimed kunnen worden

### Lege staten
Ontwerp vriendelijke lege staten voor als er nog geen data is. Gebruik korte, informele teksten in het Nederlands. Bijvoorbeeld: "Nog geen evenementen gepland. Tijd om het water op te gaan!" of "Alle taken zijn opgepakt. Lekker bezig, team!"

---

## Schermen & Navigatie

### Navigatiestructuur
- **Dashboard** (homepage na login) — overzicht van aankomende events, openstaande taken, recente mededelingen
- **Kalender/Planning** — alle evenementen, filteren op type
- **Evenement detail** — info + beschikbaarheidslijst + comments thread
- **Informatiecentrum** — mededelingen per categorie, zoekfunctie
- **Taken** — overzicht takenlijsten, bijdrage-statistieken
- **AI Assistent** — chat-interface (ook bereikbaar als floating button/overlay)
- **Beheer** (alleen admin) — teamleden beheren, instellingen

### Design principes
- **Mobile-first**: teamleden gebruiken dit primair op hun telefoon
- **Snel & simpel**: zo min mogelijk klikken om beschikbaarheid door te geven
- **Duidelijke visuele status**: kleurcodes voor beschikbaar (groen), niet beschikbaar (rood), twijfel (oranje), niet gereageerd (grijs)
- **Clean en modern**: geen overbodige UI, focus op functionaliteit

---

## Belangrijke Ontwerpbeslissingen

1. **Geen losse chat**: alle communicatie is contextgebonden aan een item. Dit is een bewuste keuze om het WhatsApp-probleem op te lossen.
2. **Verplichte reden bij afmelding**: voorkomt makkelijk afmelden en geeft de organisatie inzicht.
3. **Transparant bijdrage-overzicht**: lost het "altijd dezelfde mensen" probleem op via sociale transparantie.
4. **AI als primaire interface**: verlaagt drempel voor minder tech-savvy teamleden.
5. **Clerk auth met magic link**: geen wachtwoorden om te vergeten, laagdrempelig, en professionele ingebouwde UI.

---

## Fasering

### Fase 1 (MVP)
- Authenticatie (magic link)
- Evenementen CRUD (admin)
- Beschikbaarheid aangeven (teamleden)
- Basis informatiecentrum (posts met categorieën)
- Contextgebonden reacties op events en posts
- Basis taken (aanmaken, claimen, afronden)
- Responsive design (mobile-first)

### Fase 2
- AI Assistent (chat-interface met Anthropic API)
- Bijdrage-overzicht / statistieken
- Taakgroepen
- Zoekfunctionaliteit in informatiecentrum
- Pinnen van berichten
- Herinneringen voor niet-gereageerde teamleden

### Fase 3 (later)
- Email notificaties
- Push notifications
- Bijlagen bij posts
- Kalender-integratie (iCal export)
- Eventueel: seizoensoverzichten / rapportages

---

## Seed Data

Maak seed data aan voor development met:
- 3 admins, 12 teamleden
- 5 aankomende evenementen (mix van types)
- 3 mededelingen in verschillende categorieën
- 2 taakgroepen met elk 4-5 taken (mix van statussen)
- Beschikbaarheidsreacties voor een deel van de teamleden
- Enkele comments op evenementen en posts

---

## Instructie aan Claude Code

Bouw deze applicatie stap voor stap, begin met Fase 1. Start met:
1. Project setup (Next.js, TypeScript, Tailwind, shadcn/ui, Prisma)
2. Database schema en migraties
3. Authenticatie
4. Kernfunctionaliteit per pijler
5. Seed data
6. Test dat alles werkt

Houd de code clean, gebruik TypeScript strict, en volg Next.js App Router best practices. Maak herbruikbare componenten en server actions waar mogelijk.

De interface moet **volledig in het Nederlands** zijn.
