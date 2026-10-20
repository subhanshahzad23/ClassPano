import nodemailer from "nodemailer";

/*
 * Visit notifications. The client posts a "visit" event once per browser
 * session and a "summary" when the tab is hidden; this route emails the owner
 * through Titan SMTP. Nothing is stored. Bots and link previewers are skipped.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|whatsapp|telegram|slack|discord|linkedin|skype|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|vercel-screenshot/i;
const recent = new Map<string, number>();

interface TrackBody {
  event: "visit" | "summary";
  sid: string;
  vid: string;
  visitNumber?: number;
  path?: string;
  referrer?: string;
  utm?: Record<string, string>;
  tz?: string;
  lang?: string;
  screen?: string;
  pages?: { path: string; seconds: number }[];
  milestones?: string[];
  walkthroughStep?: number;
  seconds?: number;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function device(ua: string) {
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const kind = /Mobi|iPhone|Android(?!.*Tablet)/.test(ua) ? "phone" : /iPad|Tablet/.test(ua) ? "tablet" : "desktop";
  return { label: `${br} on ${os}`, kind };
}

function fmtWhen(tz: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, dateStyle: "medium", timeStyle: "short" }).format(new Date());
  } catch {
    return new Date().toISOString();
  }
}

function dur(s = 0) {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:8px 0;color:#626262;font-size:13px;width:150px;vertical-align:top">${esc(label)}</td><td style="padding:8px 0;color:#000;font-size:14px">${value}</td></tr>`;
}

export async function POST(req: Request) {
  const env = process.env;
  if (env.TRACKING_ENABLED === "false") return new Response(null, { status: 204 });

  let body: TrackBody;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!body?.sid || !["visit", "summary"].includes(body.event)) return new Response(null, { status: 400 });

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });

  // One visit mail per session; summaries at most every 2 minutes per session.
  const key = `${body.sid}:${body.event}`;
  const last = recent.get(key) ?? 0;
  if (Date.now() - last < (body.event === "visit" ? 6 * 3600_000 : 120_000)) return new Response(null, { status: 204 });
  recent.set(key, Date.now());
  if (recent.size > 2000) recent.clear();

  const user = env.TITAN_SMTP_USER;
  const pass = env.TITAN_SMTP_PASS;
  const to = env.TRACK_EMAIL_TO;
  if (!user || !pass || !to) {
    console.warn("[track] Titan SMTP not configured; skipping email.", { event: body.event, path: body.path });
    return new Response(null, { status: 204 });
  }

  const h = req.headers;
  const dec = (v: string | null) => (v ? decodeURIComponent(v) : "");
  const city = dec(h.get("x-vercel-ip-city"));
  const region = dec(h.get("x-vercel-ip-country-region"));
  const country = dec(h.get("x-vercel-ip-country"));
  const place = [city, region, country].filter(Boolean).join(", ") || "Unknown location";
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "—";
  const dev = device(ua);
  const ownerTz = env.TRACK_TIMEZONE || "UTC";
  const site = env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const returning = (body.visitNumber ?? 1) > 1;

  const subject =
    body.event === "visit"
      ? `ClassPano demo opened${returning ? ` (visit #${body.visitNumber})` : ""} · ${city || country || "unknown location"} · ${dev.label}`
      : `ClassPano demo session · ${dur(body.seconds)} · ${body.pages?.length ?? 0} pages${body.milestones?.length ? ` · ${body.milestones.length} actions` : ""}`;

  const utm = body.utm && Object.keys(body.utm).length ? Object.entries(body.utm).map(([k, v]) => `${esc(k)}=${esc(v)}`).join(" · ") : "";
  const rows = [
    row("When", `${esc(fmtWhen(ownerTz))} <span style="color:#8c8c8c">(${esc(ownerTz)})</span>`),
    row("Visitor", `${returning ? `Returning · visit #${body.visitNumber}` : "First visit"} <span style="color:#8c8c8c">· id ${esc(body.vid.slice(0, 8))}</span>`),
    row("Location", `${esc(place)} <span style="color:#8c8c8c">· IP ${esc(ip)}</span>`),
    row("Device", `${esc(dev.label)} · ${esc(dev.kind)}${body.screen ? ` · ${esc(body.screen)}` : ""}`),
    row("Their timezone", esc(body.tz || "—")),
    body.event === "visit" ? row("Landed on", `<a href="${esc(site + (body.path ?? "/"))}" style="color:#007b3b">${esc(body.path ?? "/")}</a>`) : "",
    body.event === "visit" ? row("Came from", esc(body.referrer || "Direct / no referrer")) : "",
    utm ? row("Campaign", utm) : "",
    body.event === "summary" ? row("Time on demo", esc(dur(body.seconds))) : "",
    body.event === "summary" && body.walkthroughStep != null ? row("Walkthrough", `Reached step ${body.walkthroughStep + 1}`) : "",
  ].join("");

  const pages =
    body.event === "summary" && body.pages?.length
      ? `<p style="margin:24px 0 8px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#626262">Pages viewed</p>
<table style="width:100%;border-collapse:collapse">${body.pages
          .slice(0, 40)
          .map((p) => `<tr><td style="padding:6px 0;border-top:1px solid #eee;font-size:14px">${esc(p.path)}</td><td style="padding:6px 0;border-top:1px solid #eee;font-size:13px;color:#626262;text-align:right">${esc(dur(p.seconds))}</td></tr>`)
          .join("")}</table>`
      : "";
  const actions = body.milestones?.length
    ? `<p style="margin:24px 0 8px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#626262">What they did</p><ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7">${body.milestones.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>`
    : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f3f3f3;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden">
<div style="background:#000;color:#fff;padding:20px 24px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#00c27a;margin-right:8px"></span><span style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#00c27a">ClassPano demo</span>
<p style="margin:10px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:300;letter-spacing:-.02em">${body.event === "visit" ? "Someone just opened your demo." : "Session summary"}</p></div>
<div style="padding:20px 24px 28px"><table style="width:100%;border-collapse:collapse">${rows}</table>${actions}${pages}
<p style="margin:28px 0 0;font-size:12px;color:#8c8c8c">Sent by the demo's visit tracker. Open the demo with ?notrack=1 once on your own browser to stop emails for your visits.</p></div></div></body></html>`;

  try {
    const transporter = nodemailer.createTransport({
      host: env.TITAN_SMTP_HOST || "smtp.titan.email",
      port: Number(env.TITAN_SMTP_PORT || 465),
      secure: (env.TITAN_SMTP_SECURE ?? "true") !== "false",
      auth: { user, pass },
      tls: { minVersion: "TLSv1.2" },
    });
    await transporter.sendMail({
      from: { name: env.TRACK_EMAIL_FROM_NAME || "ClassPano Demo Tracker", address: env.TRACK_EMAIL_FROM || user },
      to,
      subject,
      html,
      text: `${subject}\n${place} · ${dev.label} · ${body.path ?? ""}`,
    });
  } catch (err) {
    console.error("[track] email failed", err);
    return new Response(null, { status: 202 });
  }
  return new Response(null, { status: 204 });
}
