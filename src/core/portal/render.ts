import {
  EVENTS,
  SCHOOL,
  SECTIONS,
  assignmentsFor,
  biologyBulletinsFor,
  gradesFor,
  sectionById,
  type PortalAssignment,
  type PortalPage,
  type PortalVersion,
} from "./data";

/*
 * Renders the simulated portal pages as plain HTML. The same markup is shown
 * in the demo browser, served at /portal for the real MV3 prototype, and
 * parsed headlessly (DOMParser) when the dashboard loads a sample sync. The
 * adapter never sees this data directly — only the HTML, like a real page.
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 2026-10-28 → 10/28/2026 (how the portal prints dates). */
export function usDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

const STATUS_CLASS: Record<string, string> = {
  "To Do": "todo",
  "In Progress": "progress",
  Completed: "done",
  Graded: "graded",
  Overdue: "overdue",
  Missing: "missing",
};

function statusCell(a: PortalAssignment) {
  const score = a.status === "Graded" && a.score != null && a.points ? ` <span class="wbp-score">${a.score} / ${a.points}</span>` : "";
  return `<span class="wbp-status wbp-status--${STATUS_CLASS[a.status]}">${esc(a.status)}</span>${score}`;
}

function assignmentCenter(v: PortalVersion) {
  const rows = assignmentsFor(v)
    .map((a) => {
      const s = sectionById(a.sectionId);
      return `<tr data-assignment-id="${a.id}" data-section-id="${a.sectionId}">
<td data-heading="Class"><a class="wbp-link">${esc(s.name)}</a></td>
<td data-heading="Type">${esc(a.type)}</td>
<td data-heading="Details"><a class="wbp-title wbp-link">${esc(a.title)}</a>${a.points ? `<span class="wbp-points">${a.points} pts</span>` : ""}${a.details ? `<div class="wbp-desc">${esc(a.details)}</div>` : ""}</td>
<td data-heading="Assign">${usDate(a.assigned)}</td>
<td data-heading="Due">${usDate(a.due)}</td>
<td data-heading="Status">${statusCell(a)}</td>
</tr>`;
    })
    .join("");
  return `<div class="wbp-page" data-portal-page="assignment-center">
<div class="wbp-pagehead"><h2>Assignment Center</h2><div class="wbp-filters"><span class="wbp-chip wbp-chip--on">Active</span><span class="wbp-chip">Past</span><span class="wbp-chip">List view</span><span class="wbp-range">10/19/2026 – 11/08/2026</span></div></div>
<div class="wbp-tablewrap"><table class="wbp-table" id="assignment-center-assignment-items">
<thead><tr><th>Class</th><th>Type</th><th>Details</th><th>Assign</th><th>Due</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody></table></div></div>`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function schedule(v: PortalVersion) {
  const list = assignmentsFor(v);
  const days: string[] = [];
  const start = new Date("2026-10-26T00:00:00Z");
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
    days.push(d.toISOString().slice(0, 10));
  }
  const cells = days
    .map((iso) => {
      const d = new Date(iso + "T00:00:00Z");
      const items = list
        .filter((a) => a.due === iso)
        .map((a) => {
          const s = sectionById(a.sectionId);
          return `<li class="wbp-cal-item wbp-cal-item--${a.type.toLowerCase()}" data-assignment-id="${a.id}" data-section-id="${a.sectionId}" data-type="${esc(a.type)}"><span class="wbp-cal-type">${esc(a.type)}</span><span class="wbp-cal-title">${esc(a.title)}</span><span class="wbp-cal-class">${esc(s.name)}</span></li>`;
        });
      const events = EVENTS.filter((e) => e.date === iso).map(
        (e) => `<li class="wbp-cal-event" data-event-id="${e.id}"><span class="wbp-cal-type">School event</span><span class="wbp-cal-title">${esc(e.title)}</span></li>`,
      );
      return `<div class="wbp-cal-day${iso === "2026-10-27" ? " wbp-cal-day--today" : ""}" data-date="${iso}"><div class="wbp-cal-date"><span>${WEEKDAYS[d.getUTCDay()]}</span> ${d.getUTCDate()}</div><ul>${[...events, ...items].join("") || '<li class="wbp-cal-empty">Nothing due</li>'}</ul></div>`;
    })
    .join("");
  return `<div class="wbp-page" data-portal-page="schedule">
<div class="wbp-pagehead"><h2>Schedule</h2><div class="wbp-filters"><span class="wbp-chip">Day</span><span class="wbp-chip wbp-chip--on">Two weeks</span><span class="wbp-range">Oct 26 – Nov 6, 2026</span></div></div>
<div class="wbp-calendar">${cells}</div></div>`;
}

function progress(v: PortalVersion) {
  const rows = gradesFor(v)
    .map((g) => {
      const s = sectionById(g.sectionId);
      return `<div class="wbp-progress-row" data-section-id="${s.sectionId}">
<div><a class="wbp-class wbp-link">${esc(s.name)}</a><div class="wbp-teacher">${esc(s.teacher)} · ${esc(s.period)}</div></div>
<div class="wbp-gradebox"><span class="wbp-grade">${g.percent.toFixed(2)}%</span><span class="wbp-letter">${esc(g.letter)}</span></div>
</div>`;
    })
    .join("");
  return `<div class="wbp-page" data-portal-page="progress">
<div class="wbp-pagehead"><h2>Progress</h2><div class="wbp-filters"><span class="wbp-chip wbp-chip--on" data-term>${esc(SCHOOL.term)}</span><span class="wbp-range">Cumulative grades</span></div></div>
<div class="wbp-progress">${rows}</div></div>`;
}

function classBiology(v: PortalVersion) {
  const s = SECTIONS[1];
  const items = biologyBulletinsFor(v)
    .map(
      (b) => `<article class="wbp-bulletin" data-bulletin-id="${b.id}"><time datetime="${b.posted}">${usDate(b.posted)}</time><h4>${esc(b.title)}</h4><p>${esc(b.body)}</p></article>`,
    )
    .join("");
  return `<div class="wbp-page" data-portal-page="class" data-section-id="${s.sectionId}">
<div class="wbp-classhead"><div><p class="wbp-kicker">${esc(s.period)} · ${esc(s.room)}</p><h2 class="wbp-classname">${esc(s.name)}</h2><p class="wbp-teacher">${esc(s.teacher)}</p></div><div class="wbp-classtabs"><span class="wbp-chip wbp-chip--on">Bulletin Board</span><span class="wbp-chip">Topics</span><span class="wbp-chip">Assignments</span><span class="wbp-chip">Roster</span></div></div>
<div class="wbp-bulletins">${items}</div></div>`;
}

export function renderPortalPage(page: PortalPage, v: PortalVersion) {
  switch (page) {
    case "assignment-center":
      return assignmentCenter(v);
    case "schedule":
      return schedule(v);
    case "progress":
      return progress(v);
    case "class-biology":
      return classBiology(v);
  }
}
