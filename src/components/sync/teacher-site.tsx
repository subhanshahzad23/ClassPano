"use client";

import { forwardRef } from "react";

export const TEACHER_SITE = {
  host: "mrpatel-algebra.classpages.test",
  path: "/agenda",
  title: "Mr. Patel · Algebra I",
  courseHint: "Algebra I",
};

/**
 * A teacher's own class website — the kind of page no school-platform module
 * covers. Plain prose, so only AI-assisted capture can read it.
 */
export const TeacherSite = forwardRef<HTMLDivElement>(function TeacherSite(_, ref) {
  return (
    <div className="tsite min-h-full">
      <div className="tsite-banner">
        <h2>Mr. Patel · Algebra I</h2>
      </div>
      <div className="tsite-nav" aria-hidden>
        <span>Home</span>
        <span style={{ fontWeight: 700 }}>Weekly Agenda</span>
        <span>Resources</span>
        <span>Desmos Gallery</span>
        <span>Contact</span>
      </div>
      <div ref={ref} className="tsite-content">
        <h3>Week of Nov 2 – Agenda</h3>
        <ul>
          <li>Mon 11/2 – Quiz 3.4 on substitution (no calculators).</li>
          <li>Tue 11/3 – Unit 3 Test: Systems of Equations. Calculators allowed. Study guide answers are posted under Resources.</li>
          <li>Wed 11/4 – Start Unit 4: Exponent rules (notes in class).</li>
          <li>Thu 11/5 – Read section 4.1 and finish the warm-up worksheet.</li>
          <li>Fri 11/6 – Desmos Art Project due (extra credit, optional).</li>
        </ul>
        <h3>Reminders</h3>
        <p>Bring a signed field trip permission slip to the front office by Friday, Oct 30.</p>
        <p>Office hours: Tuesdays and Thursdays 3:15–4:00 in Room 204. Stop by any time with questions!</p>
        <p style={{ marginTop: 14, fontSize: 13, color: "#777" }}>Last updated Oct 27 · Westbrook Academy Math Department</p>
      </div>
    </div>
  );
});
