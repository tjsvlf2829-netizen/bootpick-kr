// 정적 사이트 생성: src/app.html -> dist/index.html, 모델마다 dist/m/<id>/index.html, sitemap.xml, robots.txt
// 실행: node build.mjs   (SITE_URL 환경변수로 주소 지정, 기본 https://bootpick-kr.pages.dev)
import fs from "node:fs";
import vm from "node:vm";
import { COMPARE, BEST, GUIDES } from "./content.mjs";

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
vm.runInContext(script.slice(0, script.indexOf('document.querySelectorAll("nav button").forEach(b=>b.addEventListener')) + ";this.D={M,REL,SIZE,SRC,STUD,shoe,comfortOf,SLUG,BRAND_EN};", ctx);
const { M, REL, SIZE, SRC, STUD, shoe, SLUG, BRAND_EN } = ctx.D;
const url = (m) => `/products/${SLUG[m.id]}/`;
const burl = (b) => `/brands/${BRAND_EN[b]}/`;

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
.cta a.pri{background:var(--turf);color:var(--chalk)}.rel-list{columns:2;font-size:.88rem;padding-left:18px}.best{padding-left:20px}.best li{margin:18px 0;padding-bottom:14px;border-bottom:1px solid var(--line)}.best h2{font-size:1.05rem;margin:0 0 4px}.guide h2{margin-top:22px}.pg td .bar{min-width:90px}.pg th{white-space:nowrap}.fit{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fit ul{list-style:none;padding:0;margin:0;font-size:.9rem;display:grid;gap:4px}@media(max-width:560px){.fit{grid-template-columns:1fr}.rel-list{columns:1}}.disc{font-size:.75rem;color:var(--muted);margin-top:24px}
body{background:var(--bg);color:var(--ink);font-family:var(--body)}</style></head><body>`;

fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist", { recursive: true });

const page = (path, html) => { fs.mkdirSync("dist" + path, { recursive: true }); fs.writeFileSync("dist" + path + "index.html", html); };
const foot = `<p class="disc">${DISCLOSURE}</p><script>document.addEventListener("click",function(e){var a=e.target.closest("a[data-m]");if(a)try{navigator.sendBeacon("/api/events",new Blob([JSON.stringify({type:"buy",model:a.dataset.m,page:location.pathname})],{type:"application/json"}))}catch(x){}})</script>`;
const nav = `<p class="crumb"><a href="/">${NAME}</a> · <a href="/futsal/">풋살화</a> · <a href="/football/">축구화</a> · <a href="/best/">추천</a> · <a href="/compare/">비교</a> · <a href="/guides/">가이드</a> · <a href="/brands/">브랜드</a></p>`;
const byId = (id) => M.find((m) => m.id === id);
const RL = { width: "발볼", light: "가벼움", cushion: "쿠션", touch: "터치", dur: "내구성" };
const cmpOf = (m) => COMPARE.filter((c) => c[0] === m.id || c[1] === m.id);
const li = (x, extra = "") => `<li><a href="${url(x)}">${esc(x.b + " " + x.n)}</a>${extra}</li>`;

// 메인 페이지: 앱 + 검색엔진용 전체 모델 링크 + 제휴 고지
const links = ["tf", "fg"].map((c) => `<h3>${c === "fg" ? "축구화" : "풋살화"} 모델</h3><ul class="rel-list">${M.filter((m) => m.cat === c).map((m) => li(m)).join("")}</ul>`).join("");
const body = app.replace(/<title>[\s\S]*?<\/style>/, "");
fs.writeFileSync("dist/index.html",
  head(`${NAME} 풋랭크 | 나에게 맞는 축구화·풋살화 찾기, 2026 티어리스트`, "구장·발볼·플레이 스타일·예산으로 나에게 맞는 축구화와 풋살화를 30초 만에 찾아요. 56개 모델 티어리스트와 리뷰 기반 비교.", "/") +
  body.replace(/<script>/, `<footer class="pg"><nav aria-label="전체 모델">${links}</nav>${foot}</footer>\n<script>`) + "</body></html>");

// 이런 사람 추천 / 비추천: 항목 점수에서 규칙으로 뽑음
function fitFor(m) {
  const yes = [], no = [];
  if (m.width >= 4) yes.push("발볼이 넓은 편인 사람"); else if (m.width <= 2) { yes.push("발볼이 좁거나 발에 딱 붙는 핏을 좋아하는 사람"); no.push("발볼이 넓은 사람 (신어 보거나 반 치수 업 권장)"); }
  if (m.touch >= 4.5) yes.push("공 터치감을 가장 중요하게 보는 사람"); else if (m.touch <= 2) no.push("부드러운 터치감을 원하는 사람");
  if (m.light >= 4.5) yes.push("순간 스피드가 중요한 윙어·공격수"); else if (m.light <= 2.5) no.push("아주 가벼운 신발을 원하는 사람");
  if (m.cushion >= 4) yes.push("딱딱한 인조잔디에서 오래 뛰어도 발이 편해야 하는 사람"); else if (m.cushion <= 2) no.push("쿠션이 푹신한 신발을 원하는 사람");
  if (m.dur >= 4) yes.push("자주 뛰어서 오래 신을 신발이 필요한 사람"); else if (m.dur <= 2) no.push("주 2회 이상 뛰며 한 켤레를 오래 신으려는 사람");
  if (m.won <= 100000) yes.push("10만원 안팎에서 고르는 사람"); else if (m.won >= 250000) no.push("가성비가 최우선인 사람");
  return { yes: yes.slice(0, 4), no: no.slice(0, 3) };
}

// 모델 페이지 + 옛 주소(/m/<id>/) 넘김
const redirects = [];
for (const m of M) {
  redirects.push(`/m/${m.id}/ ${url(m)} 301`, `/m/${m.id} ${url(m)} 301`);
  const r = REL[m.id];
  const gen = r ? `<tr><th>세대</th><td>${esc(r[0])} · ${r[1] ? esc(r[1]) + " 출시" : "출시 연도 확인 중"} · ${esc(STUD[r[2]]?.[r[3]]?.[0] || "")} 등급</td></tr>` : "";
  const src = m.rev ? `${m.rsum ? `<h2>리뷰 요약</h2><p>${esc(m.rsum)}</p>` : ""}<h2>점수 참고 출처</h2><ul>${m.rev.map((i) => `<li><a href="${SRC[i][1]}" rel="noopener nofollow" target="_blank">${esc(SRC[i][0])}</a></li>`).join("")}</ul>` : "";
  const same = M.filter((x) => x.b === m.b && x.id !== m.id).slice(0, 8);
  const similar = M.filter((x) => x.cat === m.cat && x.id !== m.id && Math.abs(x.width - m.width) <= 0.5).sort((a, b) => b.sc - a.sc).slice(0, 6);
  const f = fitFor(m);
  const title = `${m.b} ${m.n} 리뷰 · 발볼 ${wtxt(m.width)} · ${m.tier}티어 | ${NAME}`;
  const desc = `${m.b} ${m.n}: ${m.note} 발볼 ${wtxt(m.width)}, 약 ${m.won.toLocaleString("ko-KR")}원. 사이즈 팁과 유저 리뷰 점수.`;
  const ld = { "@context": "https://schema.org", "@type": "Product", name: `${m.b} ${m.n}`, brand: { "@type": "Brand", name: m.b }, category: catName(m), description: m.note };
  page(url(m), head(title, desc, url(m)) + `<main class="pg">
<p class="crumb"><a href="/">${NAME}</a> › <a href="/${m.cat === "fg" ? "football" : "futsal"}/">${catName(m)}</a> › <a href="${burl(m.b)}">${esc(m.b)}</a></p>
<h1>${esc(m.b)} ${esc(m.n)}</h1>
<div class="hero"><div class="shot">${shoe(m.id)}</div>
<p><span class="tb" style="background:var(--${m.tier.toLowerCase()})">${m.tier}</span> 현재 ${m.tier}티어 · ${m.sc.toFixed(2)}점 <span class="k">(유저 리뷰가 쌓이면 바뀌어요)</span></p>
<p><b>${esc(m.note)}</b></p>
<div class="cta"><a class="pri" href="${shop(m)}" target="_blank" rel="noopener sponsored" data-m="${m.id}">가격 확인</a><a href="/#m-${m.id}">리뷰 남기기 · 다른 모델과 비교</a></div></div>
<div class="fit"><div><h2>이런 사람에게 추천</h2><ul>${f.yes.map((t) => `<li>✔ ${t}</li>`).join("") || "<li>무난한 올라운드형</li>"}</ul></div>
<div><h2>이런 사람에겐 비추천</h2><ul>${f.no.map((t) => `<li>✕ ${t}</li>`).join("") || "<li>뚜렷한 약점이 적은 편이에요</li>"}</ul></div></div>
<h2>특징 한눈에 보기</h2>
<table><tbody><tr><th>종류</th><td>${catName(m)}</td></tr><tr><th>어퍼</th><td>${esc(m.up)}</td></tr><tr><th>가격</th><td>약 ${m.won.toLocaleString("ko-KR")}원</td></tr>${gen}
<tr><th>사이즈</th><td>${esc(SIZE[m.id] || "정보 없음")}</td></tr></tbody></table>
<div class="bars" style="margin-top:12px"><span>발볼</span>${bar(m.width)}<span>가벼움</span>${bar(m.light)}<span>쿠션</span>${bar(m.cushion)}<span>터치</span>${bar(m.touch)}<span>내구성</span>${bar(m.dur)}</div>
<p class="k">발볼 ${wtxt(m.width)} · 막대는 1~5점. 공개 리뷰를 종합한 시작 점수에 유저 리뷰가 더해져요.</p>
${src}
${cmpOf(m).length ? `<h2>비교해 보기</h2><ul>${cmpOf(m).map((c) => `<li><a href="/compare/${c[2]}/">${esc(byId(c[0]).n)} vs ${esc(byId(c[1]).n)}</a></li>`).join("")}</ul>` : ""}
<h2>발볼이 비슷한 ${catName(m)}</h2><ul class="rel-list">${similar.map((x) => li(x, ` (${x.tier})`)).join("")}</ul>
<h2><a href="${burl(m.b)}">${esc(m.b)}</a> 다른 모델</h2><ul class="rel-list">${same.map((x) => li(x)).join("")}</ul>
${foot}</main>
<script type="application/ld+json">${JSON.stringify(ld)}</script></body></html>`);
}

// 풋살화 / 축구화 티어리스트 페이지 (정적)
const TIERS = ["S", "A", "B", "C"];
for (const [c, path, label, sub] of [["tf", "/futsal/", "풋살화", "TF · IC"], ["fg", "/football/", "축구화", "FG · AG · MG"]]) {
  const L = M.filter((m) => m.cat === c).sort((a, b) => b.sc - a.sc);
  const rows = TIERS.map((t) => { const T = L.filter((m) => m.tier === t); return T.length ? `<h2><span class="tb" style="background:var(--${t.toLowerCase()})">${t}</span> ${t}티어 (${T.length})</h2><ul>${T.map((m) => li(m, ` · ${m.sc.toFixed(2)}점 · 발볼 ${wtxt(m.width)} · 약 ${(m.won / 10000).toFixed(1)}만원`)).join("")}</ul>` : ""; }).join("");
  page(path, head(`2026 ${label} 티어리스트 ${L.length}개 모델 순위 | ${NAME}`, `${label}(${sub}) ${L.length}개 모델을 터치·쿠션·발볼·무게·내구성·가성비로 점수 매긴 2026 티어리스트. 유저 리뷰로 계속 바뀌어요.`, path) +
    `<main class="pg">${nav}<h1>2026 ${label} 티어리스트</h1><p>${label}(${sub}) ${L.length}개 모델을 공개 리뷰로 매긴 시작 점수와 유저 리뷰로 순위를 매겨요. <a href="/">내 스타일로 추천받기 →</a></p>${rows}${foot}</main></body></html>`);
}

// 브랜드 페이지
const brands = [...new Set(M.map((m) => m.b))];
page("/brands/", head(`축구화·풋살화 브랜드별 모델 | ${NAME}`, "나이키, 아디다스, 미즈노, 푸마, 아식스, 뉴발란스 등 브랜드별 축구화·풋살화 모델과 티어.", "/brands/") +
  `<main class="pg">${nav}<h1>브랜드별 축구화·풋살화</h1><ul class="rel-list">${brands.map((b) => `<li><a href="${burl(b)}">${esc(b)}</a> (${M.filter((m) => m.b === b).length})</li>`).join("")}</ul>${foot}</main></body></html>`);
for (const b of brands) {
  const L = M.filter((m) => m.b === b).sort((x, y) => y.sc - x.sc);
  const part = (c, label) => { const T = L.filter((m) => m.cat === c); return T.length ? `<h2>${esc(b)} ${label}</h2><ul>${T.map((m) => li(m, ` · ${m.tier}티어 · 발볼 ${wtxt(m.width)}`)).join("")}</ul>` : ""; };
  const wide = L.filter((m) => m.width >= 4).map((m) => m.n);
  page(burl(b), head(`${b} 축구화·풋살화 추천 · 티어 · 발볼 | ${NAME}`, `${b} 축구화와 풋살화 ${L.length}개 모델의 티어, 발볼, 가격 비교.`, burl(b)) +
    `<main class="pg">${nav}<h1>${esc(b)} 축구화·풋살화</h1><p>${esc(b)} ${L.length}개 모델을 점수 순으로 정리했어요.${wide.length ? ` 발볼이 넓은 편인 모델은 ${esc(wide.join(", "))}이에요.` : " 대체로 발볼이 보통이거나 좁은 편이에요."}</p>${part("tf", "풋살화")}${part("fg", "축구화")}${foot}</main></body></html>`);
}
// 비교 페이지
const scoreRow = (k, a, b) => `<tr><th>${RL[k]}</th><td>${bar(a[k])}</td><td>${bar(b[k])}</td></tr>`;
for (const [ia, ib, slug, intro] of COMPARE) {
  const a = byId(ia), b = byId(ib), path = `/compare/${slug}/`;
  const verdict = Object.keys(RL).filter((k) => Math.abs(a[k] - b[k]) >= 1).map((k) => {
    const w = a[k] > b[k] ? a : b;
    return k === "width" ? `<li>발볼이 넓다면 <a href="${url(w)}">${esc(w.n)}</a>, 좁다면 <a href="${url(w === a ? b : a)}">${esc((w === a ? b : a).n)}</a></li>` : `<li>${({ light: "가벼움이", cushion: "쿠션이", touch: "터치가", dur: "내구성이" })[k]} 중요하면 <a href="${url(w)}">${esc(w.n)}</a></li>`;
  });
  const cheap = a.won < b.won ? a : b;
  if (Math.abs(a.won - b.won) >= 20000) verdict.push(`<li>예산이 우선이면 약 ${((Math.abs(a.won - b.won)) / 10000).toFixed(1)}만원 저렴한 <a href="${url(cheap)}">${esc(cheap.n)}</a></li>`);
  const t = `${a.n} vs ${b.n} 비교`;
  page(path, head(`${t} · 발볼 터치 쿠션 차이 | ${NAME}`, `${a.b} ${a.n}과 ${b.b} ${b.n}의 발볼, 터치, 쿠션, 무게, 내구성, 가격 비교. ${intro}`, path) +
    `<main class="pg">${nav}<h1>${esc(a.n)} vs ${esc(b.n)}</h1><p>${esc(intro)}</p>
<table><thead><tr><th></th><th><a href="${url(a)}">${esc(a.b + " " + a.n)}</a></th><th><a href="${url(b)}">${esc(b.b + " " + b.n)}</a></th></tr></thead><tbody>
<tr><th>티어</th><td>${a.tier} · ${a.sc.toFixed(2)}점</td><td>${b.tier} · ${b.sc.toFixed(2)}점</td></tr>
<tr><th>가격</th><td>약 ${a.won.toLocaleString("ko-KR")}원</td><td>약 ${b.won.toLocaleString("ko-KR")}원</td></tr>
<tr><th>어퍼</th><td>${esc(a.up)}</td><td>${esc(b.up)}</td></tr>
${Object.keys(RL).map((k) => scoreRow(k, a, b)).join("")}
<tr><th>사이즈</th><td>${esc(SIZE[a.id] || "")}</td><td>${esc(SIZE[b.id] || "")}</td></tr></tbody></table>
<h2>결론: 이렇게 고르세요</h2><ul>${verdict.join("") || "<li>항목 점수가 거의 같아요. 디자인과 가격으로 골라도 괜찮아요.</li>"}</ul>
<h2>한 줄 평</h2><ul><li><b>${esc(a.n)}</b>: ${esc(a.note)}</li><li><b>${esc(b.n)}</b>: ${esc(b.note)}</li></ul>
<div class="cta"><a class="pri" href="${shop(a)}" target="_blank" rel="noopener sponsored" data-m="${a.id}">${esc(a.n)} 가격 확인</a><a class="pri" href="${shop(b)}" target="_blank" rel="noopener sponsored" data-m="${b.id}">${esc(b.n)} 가격 확인</a></div>
<p><a href="/">내 스타일로 다시 추천받기 →</a></p>${foot}</main></body></html>`);
}
page("/compare/", head(`축구화·풋살화 비교 | ${NAME}`, "많이 고민하는 축구화·풋살화 두 모델을 발볼, 터치, 쿠션, 가격으로 비교했어요.", "/compare/") +
  `<main class="pg">${nav}<h1>모델 비교</h1><ul>${COMPARE.map((c) => `<li><a href="/compare/${c[2]}/">${esc(byId(c[0]).n)} vs ${esc(byId(c[1]).n)}</a><br><span class="k">${esc(c[3])}</span></li>`).join("")}</ul>${foot}</main></body></html>`);

// 조건별 추천 페이지
const why = (m) => { const r = []; if (m.width >= 4) r.push("발볼 넓음"); if (m.touch >= 4.5) r.push("터치 최상급"); if (m.light >= 4.5) r.push("매우 가벼움"); if (m.cushion >= 4) r.push("쿠션 좋음"); if (m.dur >= 4) r.push("튼튼함"); if (m.won <= 100000) r.push("10만원 이하"); return r.join(" · "); };
for (const B of BEST) {
  const L = M.filter((m) => m.cat === B.cat && B.filter(m)).sort(B.sort).slice(0, B.n), path = `/best/${B.slug}/`;
  page(path, head(`${B.title} TOP ${L.length} (2026) | ${NAME}`, `${B.intro.slice(0, 110)}`, path) +
    `<main class="pg">${nav}<h1>${B.title} TOP ${L.length}</h1><p>${esc(B.intro)}</p>
<ol class="best">${L.map((m) => `<li><h2><a href="${url(m)}">${esc(m.b + " " + m.n)}</a> <span class="tb" style="background:var(--${m.tier.toLowerCase()})">${m.tier}</span></h2>
<p class="k">${why(m) || "균형형"} · 약 ${m.won.toLocaleString("ko-KR")}원 · 사이즈 ${esc(SIZE[m.id] || "정보 없음")}</p><p>${esc(m.note)}</p>
<div class="bars"><span>발볼</span>${bar(m.width)}<span>터치</span>${bar(m.touch)}<span>쿠션</span>${bar(m.cushion)}<span>가벼움</span>${bar(m.light)}</div>
<div class="cta"><a href="${url(m)}">자세히 보기</a><a href="${shop(m)}" target="_blank" rel="noopener sponsored" data-m="${m.id}">가격 확인</a></div></li>`).join("")}</ol>
<h2>고를 때 팁</h2><p>${esc(B.tip)}</p><p><a href="/">내 구장·스타일·예산으로 다시 추천받기 →</a></p>${foot}</main></body></html>`);
}
page("/best/", head(`조건별 축구화·풋살화 추천 | ${NAME}`, "발볼 넓은, 10만원 이하, 가벼운, 터치 좋은, 발 편한 풋살화와 축구화 추천 모음.", "/best/") +
  `<main class="pg">${nav}<h1>조건별 추천</h1><ul>${BEST.map((B) => `<li><a href="/best/${B.slug}/">${B.title}</a></li>`).join("")}</ul>${foot}</main></body></html>`);

// 가이드
for (const G of GUIDES) {
  const path = `/guides/${G.slug}/`;
  page(path, head(`${G.title} | ${NAME}`, G.desc, path) + `<main class="pg">${nav}<article class="guide"><h1>${esc(G.title)}</h1>${G.body}</article>
<h2>같이 보면 좋은 추천</h2><ul>${G.rel.map((r) => BEST.find((B) => B.slug === r)).map((B) => `<li><a href="/best/${B.slug}/">${B.title}</a></li>`).join("")}</ul>
<p><a href="/">30초 만에 내 신발 찾기 →</a></p>${foot}</main></body></html>`);
}
page("/guides/", head(`축구화·풋살화 가이드 | ${NAME}`, "TF와 IC 차이, FG·AG 차이, 사이즈 고르는 법, 발볼 넓은 발 고르는 법, 가죽 관리법.", "/guides/") +
  `<main class="pg">${nav}<h1>가이드</h1><ul>${GUIDES.map((G) => `<li><a href="/guides/${G.slug}/">${esc(G.title)}</a><br><span class="k">${esc(G.desc)}</span></li>`).join("")}</ul>${foot}</main></body></html>`);

fs.writeFileSync("dist/_redirects", redirects.join("\n") + "\n");

const urls = ["/", "/futsal/", "/football/", "/brands/", "/compare/", "/best/", "/guides/", ...BEST.map((B) => `/best/${B.slug}/`), ...COMPARE.map((c) => `/compare/${c[2]}/`), ...GUIDES.map((G) => `/guides/${G.slug}/`), ...brands.map(burl), ...M.map(url)];
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((p) => `<url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n") + "\n</urlset>\n");
fs.writeFileSync("dist/robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`built ${M.length} model pages -> dist/`);
