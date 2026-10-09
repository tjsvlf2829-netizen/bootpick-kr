// 정적 사이트 생성: src/app.html -> dist/index.html, 모델마다 dist/m/<id>/index.html, sitemap.xml, robots.txt
// 실행: node build.mjs   (SITE_URL 환경변수로 주소 지정, 기본 https://bootpick-kr.pages.dev)
import fs from "node:fs";
import vm from "node:vm";

const SITE = (process.env.SITE_URL || "https://bootpick-kr.pages.dev").replace(/\/$/, "");
const NAME = "FootRank";
const DISCLOSURE = "이 사이트의 일부 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
const app = fs.readFileSync("src/app.html", "utf8");
const style = app.match(/<style>[\s\S]*?<\/style>/)[0];
const fonts = app.match(/<link rel="preconnect"[\s\S]*?display=swap">/)[0];
const script = app.match(/<script>([\s\S]*)<\/script>/)[1];

// 데이터 부분만 실행해서 모델 목록을 얻음 (DOM 코드 이전까지)
const ctx = {};
vm.createContext(ctx);
vm.runInContext(script.slice(0, script.indexOf('document.querySelectorAll("nav button").forEach(b=>b.addEventListener')) + ";this.D={M,REL,SIZE,SRC,STUD,shoe,comfortOf};", ctx);
const { M, REL, SIZE, SRC, STUD, shoe } = ctx.D;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const wtxt = (w) => (w <= 2 ? "좁은 편" : w >= 4 ? "넓은 편" : "보통");
const catName = (m) => (m.cat === "fg" ? "축구화" : "풋살화");
const bar = (v) => `<div class="bar">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= Math.round(v) ? "on" : ""}"></i>`).join("")}</div>`;
const shop = (m) => `https://www.coupang.com/np/search?q=${encodeURIComponent(m.b + " " + m.n)}`;
const head = (title, desc, path) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${path}"><meta property="og:locale" content="ko_KR">
${fonts}
${style}
<style>.pg{max-width:760px;margin:0 auto;padding:16px}.crumb{font-size:.82rem;color:var(--muted)}.crumb a,.pg a{color:var(--turf)}
.hero{display:grid;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px;margin:12px 0}
.pg table{border-collapse:collapse;width:100%;font-size:.9rem}.pg td,.pg th{padding:6px 8px;border-bottom:1px solid var(--line);text-align:left}
.cta{display:flex;gap:8px;flex-wrap:wrap}.cta a{font-weight:700;text-decoration:none;border:1px solid var(--turf);border-radius:8px;padding:8px 14px}
.cta a.pri{background:var(--turf);color:var(--chalk)}.rel-list{columns:2;font-size:.88rem;padding-left:18px}.disc{font-size:.75rem;color:var(--muted);margin-top:24px}
body{background:var(--bg);color:var(--ink);font-family:var(--body)}</style></head><body>`;

fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist", { recursive: true });

// 메인 페이지: 앱 + 검색엔진용 전체 모델 링크 + 제휴 고지
const links = ["tf", "fg"].map((c) => `<h3>${c === "fg" ? "축구화" : "풋살화"} 모델</h3><ul class="rel-list">${M.filter((m) => m.cat === c).map((m) => `<li><a href="/m/${m.id}/">${esc(m.b + " " + m.n)}</a></li>`).join("")}</ul>`).join("");
const body = app.replace(/<title>[\s\S]*?<\/style>/, "");
fs.writeFileSync("dist/index.html",
  head(`${NAME} 풋랭크 | 2026 풋살화·축구화 티어리스트와 발볼별 추천`, "풋살화·축구화 56개 모델의 티어리스트, 발볼·쿠션·터치 비교, 플레이 스타일 추천. 유저 리뷰로 티어가 계속 바뀌어요.", "/") +
  body.replace(/<script>/, `<footer class="pg"><nav aria-label="전체 모델">${links}</nav><p class="disc">${DISCLOSURE}</p></footer>\n<script>`) + "</body></html>");

// 모델 페이지
for (const m of M) {
  const r = REL[m.id];
  const gen = r ? `<tr><th>세대</th><td>${esc(r[0])} · ${esc(r[1])} 출시 · ${esc(STUD[r[2]]?.[r[3]]?.[0] || "")} 등급</td></tr>` : "";
  const src = m.rev ? `${m.rsum ? `<h2>리뷰 요약</h2><p>${esc(m.rsum)}</p>` : ""}<h2>점수 참고 출처</h2><ul>${m.rev.map((i) => `<li><a href="${SRC[i][1]}" rel="noopener nofollow" target="_blank">${esc(SRC[i][0])}</a></li>`).join("")}</ul>` : "";
  const same = M.filter((x) => x.b === m.b && x.id !== m.id).slice(0, 8);
  const similar = M.filter((x) => x.cat === m.cat && x.id !== m.id && Math.abs(x.width - m.width) <= 0.5).sort((a, b) => b.sc - a.sc).slice(0, 6);
  const title = `${m.b} ${m.n} 리뷰 · 발볼 ${wtxt(m.width)} · ${m.tier}티어 | ${NAME}`;
  const desc = `${m.b} ${m.n}: ${m.note} 발볼 ${wtxt(m.width)}, 약 ${m.won.toLocaleString("ko-KR")}원. 사이즈 팁과 유저 리뷰 점수.`;
  const ld = { "@context": "https://schema.org", "@type": "Product", name: `${m.b} ${m.n}`, brand: { "@type": "Brand", name: m.b }, category: catName(m), description: m.note };
  fs.mkdirSync(`dist/m/${m.id}`, { recursive: true });
  fs.writeFileSync(`dist/m/${m.id}/index.html`, head(title, desc, `/m/${m.id}/`) + `<main class="pg">
<p class="crumb"><a href="/">${NAME}</a> › ${catName(m)} › ${esc(m.b)}</p>
<h1>${esc(m.b)} ${esc(m.n)}</h1>
<div class="hero"><div class="shot">${shoe(m.id)}</div>
<p><span class="tb" style="background:var(--${m.tier.toLowerCase()})">${m.tier}</span> 현재 ${m.tier}티어 · ${m.sc.toFixed(2)}점 <span class="k">(유저 리뷰가 쌓이면 바뀌어요)</span></p>
<p>${esc(m.note)}</p>
<div class="cta"><a class="pri" href="${shop(m)}" target="_blank" rel="noopener sponsored">최저가 보기</a><a href="/#m-${m.id}">리뷰 남기기 · 다른 모델과 비교</a></div></div>
<h2>특징 한눈에 보기</h2>
<table><tbody><tr><th>종류</th><td>${catName(m)}</td></tr><tr><th>어퍼</th><td>${esc(m.up)}</td></tr><tr><th>가격</th><td>약 ${m.won.toLocaleString("ko-KR")}원</td></tr>${gen}
<tr><th>사이즈</th><td>${esc(SIZE[m.id] || "정보 없음")}</td></tr></tbody></table>
<div class="bars" style="margin-top:12px"><span>발볼</span>${bar(m.width)}<span>가벼움</span>${bar(m.light)}<span>쿠션</span>${bar(m.cushion)}<span>터치</span>${bar(m.touch)}<span>내구성</span>${bar(m.dur)}</div>
<p class="k">발볼 ${wtxt(m.width)} · 막대는 1~5점. ${m.rev ? "공개 리뷰를 종합한 시작 점수에 유저 리뷰가 더해져요." : "아직 예시 값이며 유저 리뷰로 채워져요."}</p>
${src}
<h2>발볼이 비슷한 ${catName(m)}</h2><ul class="rel-list">${similar.map((x) => `<li><a href="/m/${x.id}/">${esc(x.b + " " + x.n)}</a> (${x.tier})</li>`).join("")}</ul>
<h2>${esc(m.b)} 다른 모델</h2><ul class="rel-list">${same.map((x) => `<li><a href="/m/${x.id}/">${esc(x.n)}</a></li>`).join("")}</ul>
<p class="disc">${DISCLOSURE}</p></main>
<script type="application/ld+json">${JSON.stringify(ld)}</script></body></html>`);
}

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ["/", ...M.map((m) => `/m/${m.id}/`)].map((p) => `<url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n") + "\n</urlset>\n");
fs.writeFileSync("dist/robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`built ${M.length} model pages -> dist/`);
