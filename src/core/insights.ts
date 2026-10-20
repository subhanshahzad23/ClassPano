import type { AcademicItem, GradeRecord } from "./schema";
import { KIND_LABEL } from "./schema";

/*
 * Academic briefing. In production an LLM writes the prose from exactly this
 * structured input (no raw pages), and every claim links back to the verified
 * records it used. The demo builds the same output deterministically so it is
 * fast, offline and never invents facts.
 */

export type Audience = "student" | "parent";

export interface Insight {
  id: string;
  tone: "urgent" | "plan" | "trend" | "win";
  title: string;
  body: string;
  basedOn: { id: string; label: string }[];
}

export interface PlanBlock {
  itemId: string;
  title: string;
  course: string;
  minutes: number;
  reason: string;
}

export interface Briefing {
  headline: string;
  summary: string;
  insights: Insight[];
  plan: { date: string; blocks: PlanBlock[] }[];
  stats: { open: number; dueSoon: number; overdue: number; assessments: number };
}

const MINUTES: Partial<Record<AcademicItem["kind"], number>> = { test: 45, quiz: 25, project: 40, lab: 35, essay: 45, reading: 25, homework: 30, other: 20 };
const isWork = (i: AcademicItem) => i.kind !== "announcement" && i.kind !== "event";
const isOpen = (i: AcademicItem) => isWork(i) && ["to_do", "in_progress", "overdue", "missing"].includes(i.status);
const days = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
const weekday = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" }).format(new Date(iso + "T12:00:00Z"));
const shortDate = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(new Date(iso + "T12:00:00Z"));

function nextSchoolDays(fromIso: string, n: number) {
  const out: string[] = [];
  let t = Date.parse(fromIso + "T12:00:00Z");
  while (out.length < n) {
    const d = new Date(t);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) out.push(d.toISOString().slice(0, 10));
    t += 86400000;
  }
  return out;
}

export function buildBriefing(items: AcademicItem[], grades: GradeRecord[], nowIso: string, audience: Audience, studentFirstName = "Ava"): Briefing {
  const today = nowIso.slice(0, 10);
  const open = items.filter(isOpen);
  const overdue = open.filter((i) => i.status === "overdue" || i.status === "missing");
  const dueSoon = open.filter((i) => i.dueAt && days(today, i.dueAt) >= 0 && days(today, i.dueAt) <= 7).sort((a, b) => (a.dueAt! < b.dueAt! ? -1 : 1));
  const dueTomorrow = dueSoon.filter((i) => days(today, i.dueAt!) === 1);
  const dueToday = dueSoon.filter((i) => days(today, i.dueAt!) === 0);
  const assessments = open.filter((i) => (i.kind === "test" || i.kind === "quiz") && i.dueAt && days(today, i.dueAt) >= 0 && days(today, i.dueAt) <= 10).sort((a, b) => (a.dueAt! < b.dueAt! ? -1 : 1));

  const drops = grades
    .map((g) => {
      const last = [...g.history].reverse().find((h) => h.field === "percent");
      return last ? { g, delta: Number(last.to) - Number(last.from) } : null;
    })
    .filter((x): x is { g: GradeRecord; delta: number } => !!x);

  const insights: Insight[] = [];
  const you = audience === "student";
  const name = studentFirstName;

  for (const o of overdue) {
    insights.push({
      id: `ov_${o.id}`,
      tone: "urgent",
      title: you ? `Turn in “${o.title}”` : `${name} has a ${o.status} assignment in ${o.courseName}`,
      body: you
        ? `It's marked ${o.status} in ${o.courseName}. Missing work pulls the class grade down until it's in — ask ${o.teacher ?? "your teacher"} if late work is accepted.`
        : `“${o.title}” was due ${shortDate(o.dueAt!)} and is marked ${o.status}. A quick check-in tonight is the highest-impact thing you can do.`,
      basedOn: [{ id: o.id, label: `${o.courseName} · ${o.title}` }],
    });
  }

  for (const d of drops) {
    if (d.delta < 0) {
      const cause = overdue.find((o) => o.courseKey === d.g.courseKey);
      insights.push({
        id: `dr_${d.g.id}`,
        tone: "trend",
        title: `${d.g.courseName} dropped ${Math.abs(d.delta).toFixed(1)} points`,
        body: `Now ${d.g.percent.toFixed(1)}%${d.g.letter ? ` (${d.g.letter})` : ""}.${cause ? ` The change lines up with “${cause.title}” being marked ${cause.status}.` : ""}`,
        basedOn: [{ id: d.g.id, label: `${d.g.courseName} grade` }, ...(cause ? [{ id: cause.id, label: cause.title }] : [])],
      });
    } else if (d.delta > 0) {
      insights.push({
        id: `up_${d.g.id}`,
        tone: "win",
        title: `${d.g.courseName} is up ${d.delta.toFixed(1)} points`,
        body: `Now ${d.g.percent.toFixed(1)}%. ${you ? "Nice work — the latest grade helped." : `${name}'s latest graded work helped.`}`,
        basedOn: [{ id: d.g.id, label: `${d.g.courseName} grade` }],
      });
    }
  }

  if (assessments.length) {
    const a = assessments[0];
    const lead = days(today, a.dueAt!);
    insights.push({
      id: `as_${a.id}`,
      tone: "plan",
      title: `${KIND_LABEL[a.kind]} in ${lead} day${lead === 1 ? "" : "s"}: ${a.title}`,
      body: you
        ? `Spread review over the next ${Math.min(3, lead)} evenings instead of one late night. ${assessments.length > 1 ? `You also have ${assessments.length - 1} more quiz or test in the next 10 days.` : ""}`
        : `${name} has ${assessments.length} test${assessments.length === 1 ? "" : "s"} or quizzes in the next 10 days. The plan below spreads review out.`,
      basedOn: assessments.slice(0, 3).map((x) => ({ id: x.id, label: `${x.courseName} · ${x.title}` })),
    });
  }

  // Busiest upcoming day
  const byDay = new Map<string, AcademicItem[]>();
  dueSoon.forEach((i) => byDay.set(i.dueAt!, [...(byDay.get(i.dueAt!) ?? []), i]));
  const busiest = [...byDay.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (busiest && busiest[1].length >= 3) {
    insights.push({
      id: `bz_${busiest[0]}`,
      tone: "plan",
      title: `${weekday(busiest[0])} is the heaviest day (${busiest[1].length} items due)`,
      body: you ? "Knock out one of them a day early so the night before isn't a crunch." : "Worth a reminder the evening before.",
      basedOn: busiest[1].map((x) => ({ id: x.id, label: `${x.courseName} · ${x.title}` })),
    });
  }

  // Study plan for the next 3 school days
  const planDays = nextSchoolDays(today, 3);
  const plan = planDays.map((date) => ({ date, blocks: [] as PlanBlock[] }));
  const queue = [...overdue, ...open.filter((i) => !overdue.includes(i) && i.dueAt && days(today, i.dueAt) >= 0 && days(today, i.dueAt) <= 8)].sort((a, b) => {
    const pa = a.status === "missing" || a.status === "overdue" ? -1 : 0;
    const pb = b.status === "missing" || b.status === "overdue" ? -1 : 0;
    return pa - pb || (a.dueAt! < b.dueAt! ? -1 : 1);
  });
  for (const it of queue) {
    const due = it.dueAt!;
    // Work happens the evening before it's due, or today if overdue / due today.
    let slot = plan.findIndex((p) => days(p.date, due) === 1);
    if (it.status === "missing" || it.status === "overdue" || days(today, due) <= 0) slot = 0;
    if (slot === -1) {
      if (it.kind === "test" || it.kind === "project") slot = plan.findIndex((p) => plan.reduce((m, q) => Math.min(m, q.blocks.length), 99) === p.blocks.length);
      else continue;
    }
    const minutes = MINUTES[it.kind] ?? 25;
    plan[slot].blocks.push({
      itemId: it.id,
      title: it.title,
      course: it.courseName,
      minutes: it.kind === "test" && days(plan[slot].date, due) > 1 ? 30 : minutes,
      reason:
        it.status === "missing" || it.status === "overdue"
          ? "Overdue — do first"
          : it.kind === "test" || it.kind === "quiz"
            ? `Review for ${weekday(due)}`
            : `Due ${weekday(due)}`,
    });
  }
  plan.forEach((p) => p.blocks.splice(4));

  const firstName = you ? "You" : name;
  const parts: string[] = [];
  if (dueToday.length) parts.push(`${dueToday.length} due today`);
  if (dueTomorrow.length) parts.push(`${dueTomorrow.length} due tomorrow`);
  if (overdue.length) parts.push(`${overdue.length} ${overdue.length === 1 ? "item" : "items"} overdue or missing`);
  const headline = parts.length ? `${firstName} ${you ? "have" : "has"} ${parts.join(", ")}.` : `${firstName} ${you ? "are" : "is"} caught up for the next few days.`;

  const lead = overdue[0];
  const summary = you
    ? `${lead ? `Start with “${lead.title}” (${lead.courseName}) since it's ${lead.status}. ` : ""}${assessments[0] ? `Your next assessment is ${assessments[0].title} on ${shortDate(assessments[0].dueAt!)}. ` : ""}About ${plan[0]?.blocks.reduce((m, b) => m + b.minutes, 0) ?? 0} minutes of work tonight keeps you on track.`
    : `${lead ? `The one thing to raise tonight: “${lead.title}” in ${lead.courseName} is ${lead.status}. ` : ""}${assessments.length ? `${assessments.length} assessments are coming up, starting ${shortDate(assessments[0].dueAt!)}. ` : ""}${drops.find((d) => d.delta < 0) ? "One grade moved down today; details below." : "Grades are steady."}`;

  return { headline, summary, insights, plan, stats: { open: open.length, dueSoon: dueSoon.length, overdue: overdue.length, assessments: assessments.length } };
}
