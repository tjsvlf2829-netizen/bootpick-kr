// POST /api/events {type, model?, page?, q?}  익명 사용 기록: 구매 링크 클릭(buy), 추천 사용(quiz), 결과 공유(share)
// 통계는 Cloudflare D1 콘솔에서: SELECT type, model, COUNT(*) FROM events GROUP BY 1,2 ORDER BY 3 DESC;
const TYPES = new Set(["buy", "quiz", "share", "sheet"]);
let ready = false;

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => null);
  if (!b || !TYPES.has(b.type)) return new Response(null, { status: 204 });
  if (!ready) {
    await env.DB.exec("CREATE TABLE IF NOT EXISTS events (type TEXT NOT NULL, model TEXT NOT NULL DEFAULT '', page TEXT NOT NULL DEFAULT '', q TEXT NOT NULL DEFAULT '', t INTEGER NOT NULL)");
    ready = true;
  }
  const s = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
  await env.DB.prepare("INSERT INTO events (type, model, page, q, t) VALUES (?,?,?,?,?)")
    .bind(b.type, /^[a-z0-9_]{0,32}$/.test(b.model || "") ? b.model || "" : "", s(b.page, 120), s(b.q, 120), Date.now()).run();
  return new Response(null, { status: 204 });
}
