/*
 * Fixture data for the simulated school portal (Westbrook Academy, fictional).
 * The portal is rendered from this data as plain HTML; adapters then read the
 * HTML back like they would on a real page. Two versions exist so repeat
 * syncs can show change detection: "A" is the first sync, "B" is the same
 * evening after teachers update a few things.
 */

export type PortalVersion = "A" | "B";
export type PortalPage = "assignment-center" | "schedule" | "progress" | "class-biology";

export const SCHOOL = {
  name: "Westbrook Academy",
  host: "portal.westbrook-academy.test",
  student: "Ava Thompson",
  grade: "Grade 9",
  parent: "Laura Thompson",
  term: "Fall 2026 · Quarter 1",
};

export const PORTAL_PAGES: { id: PortalPage; label: string; path: string }[] = [
  { id: "assignment-center", label: "Assignment Center", path: "/app/student#assignment-center" },
  { id: "schedule", label: "Schedule", path: "/app/student#schedule" },
  { id: "progress", label: "Progress", path: "/app/student#progress" },
  { id: "class-biology", label: "Biology · Class page", path: "/app/student#class/30418/bulletinboard" },
];

/** Demo clock per version (UTC; shown as local school time). */
export const PORTAL_NOW: Record<PortalVersion, string> = {
  A: "2026-10-27T16:10:00Z",
  B: "2026-10-27T17:35:00Z",
};

export interface PortalSection {
  sectionId: string;
  name: string;
  teacher: string;
  period: string;
  room: string;
}

export const SECTIONS: PortalSection[] = [
  { sectionId: "30411", name: "Algebra I - 2 (A)", teacher: "Mr. Daniel Patel", period: "Period 1", room: "Room 204" },
  { sectionId: "30418", name: "Biology - 1 (B)", teacher: "Dr. Hannah Kim", period: "Period 2", room: "Lab 3" },
  { sectionId: "30422", name: "English 9 - 3 (C)", teacher: "Ms. Sofia Rivera", period: "Period 3", room: "Room 118" },
  { sectionId: "30436", name: "World History - 1 (D)", teacher: "Mr. James Okafor", period: "Period 4", room: "Room 131" },
  { sectionId: "30440", name: "Spanish II - 2 (E)", teacher: "Sra. Lucía Morales", period: "Period 5", room: "Room 210" },
  { sectionId: "30452", name: "Intro to Computer Science - 1 (F)", teacher: "Ms. Grace Chen", period: "Period 6", room: "Room 302" },
];

export type PortalStatus = "To Do" | "In Progress" | "Completed" | "Graded" | "Overdue" | "Missing";

export interface PortalAssignment {
  id: string;
  sectionId: string;
  type: "Homework" | "Test" | "Quiz" | "Project" | "Lab" | "Essay" | "Reading";
  title: string;
  assigned: string; // YYYY-MM-DD
  due: string; // YYYY-MM-DD
  status: PortalStatus;
  points?: number;
  score?: number;
  details?: string;
}

const BASE: PortalAssignment[] = [
  { id: "8120341", sectionId: "30411", type: "Homework", title: "Problem Set 3.3 – Graphing Systems", assigned: "2026-10-22", due: "2026-10-26", status: "Graded", points: 20, score: 18, details: "Odd problems 1–29. Show your graphs." },
  { id: "8120377", sectionId: "30411", type: "Homework", title: "Problem Set 3.4 – Solving Systems by Substitution", assigned: "2026-10-26", due: "2026-10-28", status: "To Do", points: 20, details: "Problems 3–27 odd, plus 31. Check answers in the back of the book." },
  { id: "8120290", sectionId: "30411", type: "Test", title: "Unit 3 Test – Systems of Equations", assigned: "2026-10-19", due: "2026-11-03", status: "To Do", points: 100, details: "Covers 3.1–3.5. Study guide posted in Resources." },
  { id: "8120412", sectionId: "30418", type: "Reading", title: "Read Ch. 6.1–6.3 and complete guided notes", assigned: "2026-10-26", due: "2026-10-27", status: "To Do", details: "Guided notes template is under Resources › Unit 6." },
  { id: "8120399", sectionId: "30418", type: "Lab", title: "Lab Report: Enzyme Activity", assigned: "2026-10-20", due: "2026-10-29", status: "In Progress", points: 50, details: "Follow the lab report rubric. Include your data table." },
  { id: "8120455", sectionId: "30418", type: "Quiz", title: "Cell Organelles Quiz", assigned: "2026-10-23", due: "2026-10-30", status: "To Do", points: 25 },
  { id: "8120218", sectionId: "30422", type: "Essay", title: "Personal Narrative – Final Draft", assigned: "2026-10-09", due: "2026-10-23", status: "Completed", points: 100, details: "Submit to the online dropbox as a PDF." },
  { id: "8120430", sectionId: "30422", type: "Quiz", title: "Of Mice and Men Ch. 1–2 Reading Check", assigned: "2026-10-23", due: "2026-10-28", status: "To Do", points: 15 },
  { id: "8120468", sectionId: "30422", type: "Homework", title: "Vocabulary Unit 5 – Sentences", assigned: "2026-10-26", due: "2026-10-30", status: "To Do", points: 10 },
  { id: "8120302", sectionId: "30436", type: "Homework", title: "Mesopotamia Map Activity", assigned: "2026-10-19", due: "2026-10-22", status: "Overdue", points: 20, details: "Label the rivers, city-states and trade routes." },
  { id: "8120419", sectionId: "30436", type: "Reading", title: "Ch. 4 Reading Notes – Ancient Egypt", assigned: "2026-10-26", due: "2026-10-29", status: "To Do", points: 10 },
  { id: "8120266", sectionId: "30436", type: "Project", title: "Ancient Civilizations Museum Exhibit", assigned: "2026-10-15", due: "2026-11-06", status: "In Progress", points: 100, details: "Groups of 3. Exhibit board plus a 2-minute docent talk." },
  { id: "8120444", sectionId: "30440", type: "Homework", title: "Preterite vs. Imperfect Worksheet", assigned: "2026-10-26", due: "2026-10-28", status: "To Do", points: 10 },
  { id: "8120461", sectionId: "30440", type: "Quiz", title: "Vocabulario Unidad 3 Quiz", assigned: "2026-10-26", due: "2026-10-29", status: "To Do", points: 20 },
  { id: "8120310", sectionId: "30440", type: "Project", title: "Oral Presentation: Mi familia", assigned: "2026-10-19", due: "2026-11-04", status: "In Progress", points: 50 },
  { id: "8120383", sectionId: "30452", type: "Homework", title: "Code.org Unit 3 Lessons 4–6", assigned: "2026-10-22", due: "2026-10-27", status: "Completed", points: 15 },
  { id: "8120472", sectionId: "30452", type: "Lab", title: "Python Loops Lab", assigned: "2026-10-27", due: "2026-10-30", status: "To Do", points: 25, details: "Complete loops_lab.py and push to your class repo." },
  { id: "8120325", sectionId: "30452", type: "Project", title: "Mini Project: Number Guessing Game", assigned: "2026-10-20", due: "2026-11-05", status: "In Progress", points: 40 },
];

/** What changes between sync 1 and sync 2 (teachers updating the portal that evening). */
function versionB(list: PortalAssignment[]): PortalAssignment[] {
  const out = list.map((a) => {
    switch (a.id) {
      case "8120399":
        return { ...a, due: "2026-11-02", details: "Extended to Monday. Include a graph of reaction rate vs. temperature." };
      case "8120218":
        return { ...a, status: "Graded" as const, score: 88 };
      case "8120302":
        return { ...a, status: "Missing" as const };
      case "8120377":
        return { ...a, status: "Completed" as const };
      default:
        return a;
    }
  });
  out.splice(3, 0, {
    id: "8120489",
    sectionId: "30411",
    type: "Quiz",
    title: "Quiz 3.4 – Substitution",
    assigned: "2026-10-27",
    due: "2026-11-02",
    status: "To Do",
    points: 30,
    details: "Short quiz at the start of class. No calculators.",
  });
  return out;
}

export function assignmentsFor(v: PortalVersion) {
  return v === "A" ? BASE : versionB(BASE);
}

export interface PortalEvent {
  id: string;
  date: string;
  title: string;
}

export const EVENTS: PortalEvent[] = [
  { id: "evt-55102", date: "2026-10-30", title: "Fall Picture Retakes (during advisory)" },
  { id: "evt-55118", date: "2026-11-04", title: "Early Dismissal 12:30 PM – Faculty Development" },
];

export interface PortalGrade {
  sectionId: string;
  percent: number;
  letter: string;
}

export function gradesFor(v: PortalVersion): PortalGrade[] {
  return [
    { sectionId: "30411", percent: 91.2, letter: "A-" },
    { sectionId: "30418", percent: 84.5, letter: "B" },
    { sectionId: "30422", percent: v === "A" ? 88.0 : 89.1, letter: "B+" },
    { sectionId: "30436", percent: v === "A" ? 79.4 : 76.8, letter: v === "A" ? "C+" : "C" },
    { sectionId: "30440", percent: 93.0, letter: "A" },
    { sectionId: "30452", percent: 97.5, letter: "A+" },
  ];
}

export interface PortalBulletin {
  id: string;
  posted: string;
  title: string;
  body: string;
}

export function biologyBulletinsFor(v: PortalVersion): PortalBulletin[] {
  const list: PortalBulletin[] = [
    { id: "blt-9031", posted: "2026-10-26", title: "Lab report rubric posted", body: "The enzyme lab rubric is under Resources. Data tables must have units and a title." },
    { id: "blt-9017", posted: "2026-10-22", title: "Organelles quiz Friday", body: "Quiz covers 5.2–5.4. Use the flashcard set on the class page to review." },
  ];
  if (v === "B")
    list.unshift({ id: "blt-9044", posted: "2026-10-27", title: "Lab report extended to Monday", body: "Several of you asked for more time. The enzyme lab report is now due Monday, Nov 2. Please add a graph of your results." });
  return list;
}

export function sectionById(id: string) {
  return SECTIONS.find((s) => s.sectionId === id)!;
}
