// GET  /api/ratings?vid=...  -> { agg: {모델: {n, sum:{항목:합}, cm:[{c,t,mine}]}}, mine: {모델: {항목..., c}} }
// POST /api/ratings {vid, model, width, light, cushion, touch, dur, c, fit, grip}  fit: -1 작게 나옴, 0 맞음, 1 크게 나옴 (선택), grip: 접지력 1~5 (선택, 아직 점수 계산엔 안 씀)
// DELETE /api/ratings {vid, model}
const RK = ["width", "light", "cushion", "touch", "dur"];
const MAX_PER_HOUR = 20; // 같은 IP에서 한 시간에 저장할 수 있는 리뷰 수
const MAX_PER_MODEL = 3; // 같은 IP에서 한 모델에 남길 수 있는 리뷰 수 (PC방·회사 공용망 고려)

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const okVid = (v) => typeof v === "string" && /^[A-Za-z0-9-]{8,64}$/.test(v);
const okModel = (v) => typeof v === "string" && /^[a-z0-9_]{2,32}$/.test(v);

// 2026-10 사이즈 체감(fit)·접지력(grip) 칸 추가. 예전 DB에는 칸이 없으니 처음 한 번 추가 시도(이미 있으면 오류 무시)
let migrated = false;
async function ensureCols(env) {
  if (migrated) return;
  for (const col of ["fit", "grip"]) {
    try { await env.DB.prepare(`ALTER TABLE reviews ADD COLUMN ${col} INTEGER`).run(); } catch (e) {}
  }
  migrated = true;
}

async function ipHash(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + (env.IP_SALT || "bootpick")));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet({ request, env }) {
  await ensureCols(env);
  const vid = new URL(request.url).searchParams.get("vid") || "";
  const { results: sums } = await env.DB.prepare(
    "SELECT model, COUNT(*) n, SUM(width) width, SUM(light) light, SUM(cushion) cushion, SUM(touch) touch, SUM(dur) dur, SUM(fit = -1) fs, SUM(fit = 0) fm, SUM(fit = 1) fl, SUM(grip) gs, COUNT(grip) gn FROM reviews GROUP BY model"
  ).all();
  const agg = {};
  for (const r of sums) agg[r.model] = { n: r.n, sum: Object.fromEntries(RK.map((k) => [k, r[k]])), cm: [], fit: [r.fs || 0, r.fm || 0, r.fl || 0], grip: [r.gs || 0, r.gn || 0] };
  const { results: cms } = await env.DB.prepare("SELECT model, vid, c, t FROM reviews WHERE c <> '' ORDER BY t DESC LIMIT 1000").all();
  for (const r of cms) {
    const a = agg[r.model];
    if (a && a.cm.length < 20) a.cm.push({ c: r.c, t: r.t, mine: r.vid === vid });
  }
  const mine = {};
  if (okVid(vid)) {
    const { results } = await env.DB.prepare("SELECT model, width, light, cushion, touch, dur, c, fit, grip FROM reviews WHERE vid = ?").bind(vid).all();
    for (const r of results) mine[r.model] = { width: r.width, light: r.light, cushion: r.cushion, touch: r.touch, dur: r.dur, c: r.c, fit: r.fit, grip: r.grip };
  }
  return json({ agg, mine });
}

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => null);
  if (!b || !okVid(b.vid) || !okModel(b.model) || !RK.every((k) => Number.isInteger(b[k]) && b[k] >= 1 && b[k] <= 5))
    return json({ error: "다섯 항목을 모두 1~5점으로 골라 주세요" }, 400);
  await ensureCols(env);
  const fit = [-1, 0, 1].includes(b.fit) ? b.fit : null;
  const grip = Number.isInteger(b.grip) && b.grip >= 1 && b.grip <= 5 ? b.grip : null;
  const c = typeof b.c === "string" ? b.c.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 60) : "";
  const iph = await ipHash(request, env);
  const now = Date.now();
  const recent = await env.DB.prepare("SELECT COUNT(*) n FROM reviews WHERE iph = ? AND t > ?").bind(iph, now - 3600_000).first();
  if (recent.n >= MAX_PER_HOUR) return json({ error: "잠시 후 다시 남겨 주세요" }, 429);
  const same = await env.DB.prepare("SELECT COUNT(*) n FROM reviews WHERE iph = ? AND model = ? AND vid <> ?").bind(iph, b.model, b.vid).first();
  if (same.n >= MAX_PER_MODEL) return json({ error: "이 모델에는 이미 리뷰를 남기셨어요" }, 409);
  await env.DB.prepare(
    `INSERT INTO reviews (model, vid, width, light, cushion, touch, dur, c, t, iph, fit, grip) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT (model, vid) DO UPDATE SET width=excluded.width, light=excluded.light, cushion=excluded.cushion,
     touch=excluded.touch, dur=excluded.dur, c=excluded.c, t=excluded.t, iph=excluded.iph, fit=excluded.fit, grip=excluded.grip`
  ).bind(b.model, b.vid, b.width, b.light, b.cushion, b.touch, b.dur, c, now, iph, fit, grip).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const b = await request.json().catch(() => null);
  if (!b || !okVid(b.vid) || !okModel(b.model)) return json({ error: "잘못된 요청이에요" }, 400);
  await env.DB.prepare("DELETE FROM reviews WHERE model = ? AND vid = ?").bind(b.model, b.vid).run();
  return json({ ok: true });
}
