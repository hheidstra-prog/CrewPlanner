import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaNeon({ connectionString: url });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = createPrisma();
  console.log("Seeding database...");

  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.beschikbaarheid.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskGroup.deleteMany();
  await prisma.post.deleteMany();
  await prisma.event.deleteMany();

  // NOTE: Replace these with actual Clerk user IDs from your Clerk dashboard
  // After creating users in Clerk, put their IDs here
  const ADMIN_1 = "user_admin_1";
  const ADMIN_2 = "user_admin_2";
  const MEMBER_1 = "user_member_1";
  const MEMBER_2 = "user_member_2";
  const MEMBER_3 = "user_member_3";
  const MEMBER_4 = "user_member_4";
  const MEMBER_5 = "user_member_5";

  // ──────────────────────────────────
  // Events
  // ──────────────────────────────────
  const now = new Date();
  const inDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const event1 = await prisma.event.create({
    data: {
      type: "TRAINING",
      titel: "Trainingsweekend voorjaar",
      beschrijving: "Eerste training van het seizoen. We oefenen manoeuvres en spinnaker werk. Neem je eigen lunch mee!",
      datum: inDays(3),
      eindtijd: inDays(3),
      locatie: "Jachthaven Muiden",
      deadlineBeschikbaarheid: inDays(1),
      aangemaaaktDoor: ADMIN_1,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      type: "WEDSTRIJD",
      titel: "Voorjaarsregatta Almere",
      beschrijving: "Eerste wedstrijd van het seizoen! Briefing om 09:00, eerste start om 10:30.",
      datum: inDays(10),
      eindtijd: inDays(10),
      locatie: "Regattacentrum Almere",
      deadlineBeschikbaarheid: inDays(7),
      aangemaaaktDoor: ADMIN_1,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      type: "ONDERHOUD",
      titel: "Klusdag — boot in het water",
      beschrijving: "Jaarlijkse te-water-lating. We moeten de boot poetsen, tuigage checken en alles klaarmaken voor het seizoen.",
      datum: inDays(5),
      eindtijd: inDays(5),
      locatie: "Jachthaven Muiden",
      aangemaaaktDoor: ADMIN_2,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      type: "SOCIAAL",
      titel: "Seizoensopening BBQ",
      beschrijving: "Gezellige BBQ om het nieuwe seizoen in te luiden. Partners zijn welkom!",
      datum: inDays(14),
      locatie: "Clubhuis De Zeilhoek",
      aangemaaaktDoor: ADMIN_1,
    },
  });

  const event5 = await prisma.event.create({
    data: {
      type: "WEDSTRIJD",
      titel: "24-uurs race IJsselmeer",
      beschrijving: "De grote 24-uurs race op het IJsselmeer. We hebben minimaal 8 bemanningsleden nodig.",
      datum: inDays(30),
      eindtijd: inDays(31),
      locatie: "IJsselmeer — start Enkhuizen",
      deadlineBeschikbaarheid: inDays(21),
      aangemaaaktDoor: ADMIN_2,
    },
  });

  // ──────────────────────────────────
  // Beschikbaarheid
  // ──────────────────────────────────
  await prisma.beschikbaarheid.createMany({
    data: [
      { eventId: event1.id, userId: ADMIN_1, status: "BESCHIKBAAR" },
      { eventId: event1.id, userId: MEMBER_1, status: "BESCHIKBAAR" },
      { eventId: event1.id, userId: MEMBER_2, status: "TWIJFEL" },
      { eventId: event1.id, userId: MEMBER_3, status: "NIET_BESCHIKBAAR", reden: "Familie bezoek dit weekend" },
      { eventId: event1.id, userId: MEMBER_4, status: "BESCHIKBAAR" },

      { eventId: event2.id, userId: ADMIN_1, status: "BESCHIKBAAR" },
      { eventId: event2.id, userId: ADMIN_2, status: "BESCHIKBAAR" },
      { eventId: event2.id, userId: MEMBER_1, status: "BESCHIKBAAR" },
      { eventId: event2.id, userId: MEMBER_5, status: "NIET_BESCHIKBAAR", reden: "Vakantie" },

      { eventId: event3.id, userId: ADMIN_2, status: "BESCHIKBAAR" },
      { eventId: event3.id, userId: MEMBER_1, status: "BESCHIKBAAR" },
      { eventId: event3.id, userId: MEMBER_2, status: "BESCHIKBAAR" },
    ],
  });

  // ──────────────────────────────────
  // Posts
  // ──────────────────────────────────
  const post1 = await prisma.post.create({
    data: {
      titel: "Wedstrijdschema seizoen 2026",
      inhoud: `Hierbij het volledige wedstrijdschema voor seizoen 2026:\n\n• 28 feb — Voorjaarsregatta Almere\n• 15 mrt — KNZV clubcompetitie ronde 1\n• 22 mrt — KNZV clubcompetitie ronde 2\n• 12 apr — 24-uurs race IJsselmeer\n• 3 mei — Muiden Race\n• 24 mei — KNZV clubcompetitie ronde 3\n\nZorg dat je tijdig je beschikbaarheid doorgeeft!`,
      categorie: "WEDSTRIJDSCHEMA",
      gepind: true,
      auteurId: ADMIN_1,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      titel: "Nieuwe regels rondom zwemvesten",
      inhoud: `Vanaf dit seizoen is het verplicht om altijd een automatisch opblaasbaar zwemvest te dragen tijdens het zeilen.\n\nDit geldt zowel tijdens trainingen als wedstrijden. Het bestuur heeft 5 extra zwemvesten aangeschaft die je kunt lenen.\n\nNeem contact op met Jan als je een vest wilt reserveren.`,
      categorie: "REGLEMENTEN",
      gepind: false,
      auteurId: ADMIN_2,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      titel: "Bootinfo: onderhoudsstatus Dreamcatcher",
      inhoud: `Update over de status van de Dreamcatcher:\n\n✅ Romp geschuurd en gecoat\n✅ Antifouling aangebracht\n✅ Staand want geïnspecteerd\n⏳ Lopend want moet nog vervangen\n⏳ Spinnaker reparatie bij zeilmaker\n\nVerwachte oplevering: volgende week woensdag.`,
      categorie: "BOOTINFO",
      gepind: false,
      auteurId: ADMIN_1,
    },
  });

  // ──────────────────────────────────
  // Comments
  // ──────────────────────────────────
  await prisma.comment.createMany({
    data: [
      {
        parentType: "EVENT",
        parentId: event1.id,
        auteurId: MEMBER_1,
        inhoud: "Hoe laat beginnen we precies? Ik wil op tijd zijn voor het briefing.",
      },
      {
        parentType: "EVENT",
        parentId: event1.id,
        auteurId: ADMIN_1,
        inhoud: "We starten om 09:30 met de briefing. Probeer om 09:00 er te zijn zodat we alles kunnen klaarzetten.",
      },
      {
        parentType: "POST",
        parentId: post1.id,
        auteurId: MEMBER_2,
        inhoud: "Zijn de data al definitief? Ik wil ze in mijn agenda zetten.",
      },
      {
        parentType: "POST",
        parentId: post1.id,
        auteurId: ADMIN_1,
        inhoud: "Ja, deze data zijn definitief. Ze staan ook op de KNZV website.",
      },
      {
        parentType: "POST",
        parentId: post3.id,
        auteurId: MEMBER_3,
        inhoud: "Moet er iemand mee naar de zeilmaker om de spinnaker op te halen?",
      },
    ],
  });

  // ──────────────────────────────────
  // Task Groups & Tasks
  // ──────────────────────────────────
  const group1 = await prisma.taskGroup.create({
    data: {
      titel: "Boot seizoensklaar maken",
      beschrijving: "Alle taken om de boot klaar te maken voor het nieuwe seizoen",
    },
  });

  const group2 = await prisma.taskGroup.create({
    data: {
      titel: "Voorbereiding voorjaarsregatta",
      beschrijving: "Organisatorische taken voor de eerste wedstrijd",
    },
  });

  await prisma.task.createMany({
    data: [
      // Group 1 tasks
      {
        taskGroupId: group1.id,
        titel: "Lopend want vervangen",
        beschrijving: "Het lopend want (schoten en vallen) moet vervangen worden. Materiaal is al besteld.",
        deadline: inDays(4),
        status: "OPEN",
        aangemaaaktDoor: ADMIN_1,
      },
      {
        taskGroupId: group1.id,
        titel: "Reddingsmiddelen controleren",
        beschrijving: "Check vervaldatums van noodraketten, reddingsboei en EPIRB.",
        status: "OPGEPAKT",
        geclaimdDoor: MEMBER_1,
        aangemaaaktDoor: ADMIN_1,
      },
      {
        taskGroupId: group1.id,
        titel: "Motor service",
        beschrijving: "Olie verversen, impeller controleren, koelwatersysteem doorspoelen.",
        deadline: inDays(4),
        status: "AFGEROND",
        geclaimdDoor: MEMBER_4,
        afgerondOp: new Date(),
        aangemaaaktDoor: ADMIN_2,
      },
      {
        taskGroupId: group1.id,
        titel: "Zeilen inspecteren",
        beschrijving: "Grootzeil en genua controleren op slijtage. Spinnaker is al bij de zeilmaker.",
        status: "OPEN",
        aangemaaaktDoor: ADMIN_1,
      },
      {
        taskGroupId: group1.id,
        titel: "Elektronica testen",
        beschrijving: "Kaartplotter, windmeter, log, dieptemeter en VHF radio testen.",
        status: "OPEN",
        aangemaaaktDoor: ADMIN_2,
      },

      // Group 2 tasks
      {
        taskGroupId: group2.id,
        titel: "Inschrijving regatta bevestigen",
        beschrijving: "Inschrijfformulier invullen en betaling overmaken. Budget: €175.",
        deadline: inDays(7),
        status: "OPGEPAKT",
        geclaimdDoor: ADMIN_1,
        aangemaaaktDoor: ADMIN_1,
      },
      {
        taskGroupId: group2.id,
        titel: "Meetbrief ophalen",
        beschrijving: "De meetbrief moet opgehaald worden bij het meetkantoor in Lelystad.",
        deadline: inDays(8),
        status: "OPEN",
        aangemaaaktDoor: ADMIN_2,
      },
      {
        taskGroupId: group2.id,
        titel: "Proviandering wedstrijddag",
        beschrijving: "Inkopen doen: lunch, snacks, water en sportdrank voor 8+ personen.",
        deadline: inDays(9),
        status: "OPEN",
        aangemaaaktDoor: ADMIN_1,
      },
      {
        taskGroupId: group2.id,
        titel: "Veiligheidsuitrusting checken",
        beschrijving: "Controleer dat we voldoen aan de KNZV veiligheidseisen voor wedstrijden.",
        status: "AFGEROND",
        geclaimdDoor: MEMBER_2,
        afgerondOp: new Date(),
        aangemaaaktDoor: ADMIN_2,
      },
    ],
  });

  console.log("Seed completed!");
  console.log("NOTE: Replace the placeholder user IDs with actual Clerk user IDs");

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
