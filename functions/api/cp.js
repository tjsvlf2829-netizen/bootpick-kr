// GET /api/cp  쿠팡 파트너스 API로 모은 모델별 가격·상품 사진·파트너스 링크(D1 캐시)를 돌려줌
// 키는 Cloudflare Pages 비밀 환경변수 COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY (저장소에 두지 않음). 없으면 빈 목록.
// 검색 API는 호출 제한이 빡빡해서(넘기면 계정 정지) 요청이 올 때마다 시간당 HOURLY 회 안에서 오래된 모델 1개씩만 새로 검색함.
// 모델 목록은 빌드가 만든 /cp-models.json. 상품명이 브랜드·모델명 낱말을 모두 담은 결과만 씀(엉뚱한 상품 방지).
// 확인: /api/cp?all=1 또는 D1 콘솔에서 SELECT id, n, p, t FROM cp ORDER BY t DESC;
const HOST = "https://api-gateway.coupang.com";
const SEARCH = "/v2/providers/affiliate_open_api/apis/openapi/products/search";
const HOURLY = 8; // 알려진 한도(시간당 10회)보다 여유 있게
const FRESH = 24 * 3600e3, MISS_RETRY = 7 * 24 * 3600e3;
let ready = false;
// 대시보드에서 이름을 소문자 등으로 넣어도 찾도록(coupang_access_key 등) 이름에 coupang + access/secret 이 들어간 변수를 씀
function keysOf(env) {
  const k = Object.keys(env), pick = (w) => (env[k.find((n) => /coupang/i.test(n) && new RegExp(w, "i").test(n))] || "").trim();
  return { ak: pick("access"), sk: pick("secret") };
}

const enc = new TextEncoder();
async function sign(secret, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function coupang(env, path, query) {
  const d = new Date().toISOString(); // yyMMddTHHmmssZ (GMT)
  const dt = d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10) + "T" + d.slice(11, 13) + d.slice(14, 16) + d.slice(17, 19) + "Z";
  const { ak, sk } = keysOf(env);
  const sig = await sign(sk, dt + "GET" + path + query);
  const r = await fetch(HOST + path + "?" + query, {
    headers: { Authorization: `CEA algorithm=HmacSHA256, access-key=${ak}, signed-date=${dt}, signature=${sig}` },
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

// 상품명이 이 모델인지: 브랜드 + 모델명 낱말 전부. 영숫자 낱말은 앞뒤가 영숫자가 아니어야 함("6"이 "260"에 걸리지 않게)
const SYN = { tf: ["tf", "터프"], ic: ["ic", "인도어"], in: ["in", "인도어"], tt: ["tt", "터프"] };
const KIDS = /주니어|키즈|아동|유아|\bjr\b|kids/i;
function matches(m, name) {
  const low = name.toLowerCase(), flat = low.replace(/\s+/g, "");
  if (!flat.includes(m.b.replace(/\s+/g, "").toLowerCase())) return false;
  if (KIDS.test(low) && !KIDS.test(m.n)) return false;
  return m.n.toLowerCase().split(/\s+/).filter(Boolean).every((t) =>
    (SYN[t] || [t]).some((s) => /^[0-9a-z]+$/.test(s) ? new RegExp(`(^|[^0-9a-z])${s}([^0-9a-z]|$)`).test(low) : flat.includes(s)));
}

async function refreshOne(env, origin) {
  // 한도 안이면 호출 1회를 먼저 기록(동시에 여러 요청이 와도 한도를 넘지 않게 한 문장으로)
  const now = Date.now();
  const ok = await env.DB.prepare("INSERT INTO cp_calls (t) SELECT ?1 WHERE (SELECT COUNT(*) FROM cp_calls WHERE t > ?2) < ?3").bind(now, now - 3600e3, HOURLY).run();
  if (!ok.meta.changes) return;
  const models = await (await env.ASSETS.fetch(new URL("/cp-models.json", origin))).json();
  const seen = Object.fromEntries((await env.DB.prepare("SELECT id, t, p FROM cp").all()).results.map((r) => [r.id, r]));
  const due = models.filter((m) => { const s = seen[m.id]; return !s || now - s.t > (s.p ? FRESH : MISS_RETRY); })
    .sort((a, b) => (seen[a.id]?.t || 0) - (seen[b.id]?.t || 0));
  if (!due.length) return;
  const m = due[0];
  const { status, body } = await coupang(env, SEARCH, `keyword=${encodeURIComponent(m.q)}&limit=10`);
  if (status !== 200 || !body || body.rCode !== "0") {
    // 키 문제(401·403)면 이번 한 시간은 더 부르지 않음: 한도만큼 호출을 채워 둠
    if (status === 401 || status === 403) await env.DB.batch(Array.from({ length: HOURLY }, () => env.DB.prepare("INSERT INTO cp_calls (t) VALUES (?)").bind(now)));
    await log(env, m.id, `실패 ${status} ${(body && (body.rMessage || body.message)) || ""}`.slice(0, 200));
    return;
  }
  const hit = (body.data?.productData || []).filter((p) => matches(m, p.productName || "")).sort((a, b) => a.productPrice - b.productPrice)[0];
  await env.DB.prepare("INSERT OR REPLACE INTO cp (id, n, p, i, u, r, t) VALUES (?,?,?,?,?,?,?)")
    .bind(m.id, hit ? hit.productName : "", hit ? hit.productPrice : 0, hit ? hit.productImage : "", hit ? hit.productUrl : "", hit && hit.isRocket ? 1 : 0, now).run();
  await log(env, m.id, hit ? `찾음 ${hit.productPrice}원` : `못 찾음(결과 ${(body.data?.productData || []).length}개)`);
  await env.DB.prepare("DELETE FROM cp_calls WHERE t < ?").bind(now - 2 * 3600e3).run();
}
// 최근 검색 결과 기록(/api/cp?all=1 에서 보임). 최근 50개만 남김
async function log(env, id, s) {
  await env.DB.batch([
    env.DB.prepare("INSERT INTO cp_log (t, id, s) VALUES (?,?,?)").bind(Date.now(), id, s),
    env.DB.prepare("DELETE FROM cp_log WHERE t < (SELECT MIN(t) FROM (SELECT t FROM cp_log ORDER BY t DESC LIMIT 50))"),
  ]);
}

export async function onRequestGet({ request, env, waitUntil }) {
  if (!ready) {
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS cp (id TEXT PRIMARY KEY, n TEXT NOT NULL, p INTEGER NOT NULL, i TEXT NOT NULL, u TEXT NOT NULL, r INTEGER NOT NULL, t INTEGER NOT NULL)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS cp_calls (t INTEGER NOT NULL)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS cp_log (t INTEGER NOT NULL, id TEXT NOT NULL, s TEXT NOT NULL)"),
    ]);
    ready = true;
  }
  const { ak, sk } = keysOf(env), keys = !!(ak && sk);
  if (keys) waitUntil(refreshOne(env, request.url).catch((e) => log(env, "-", ("오류 " + e).slice(0, 200))));
  // ?all=1 이면 못 찾은 모델(p=0)까지: 매칭 확인용
  const all = new URL(request.url).searchParams.get("all") === "1";
  const rows = (await env.DB.prepare(`SELECT id, n, p, i, u, r, t FROM cp${all ? "" : " WHERE p > 0"}`).all()).results;
  const d = Object.fromEntries(rows.map(({ id, ...x }) => [id, x]));
  if (!all) return Response.json({ now: Date.now(), d }, { headers: { "cache-control": "public, max-age=300" } });
  const calls = (await env.DB.prepare("SELECT COUNT(*) AS c FROM cp_calls WHERE t > ?").bind(Date.now() - 3600e3).first()).c;
  const logs = (await env.DB.prepare("SELECT t, id, s FROM cp_log ORDER BY t DESC LIMIT 50").all()).results;
  return Response.json({ now: Date.now(), keys, calls, logs, d }, { headers: { "cache-control": "no-store" } });
}
