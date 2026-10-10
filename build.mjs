// 정적 사이트 생성: src/app.html -> dist/index.html, 모델마다 dist/m/<id>/index.html, sitemap.xml, robots.txt
// 실행: node build.mjs   (SITE_URL 환경변수로 주소 지정, 기본 https://footpick.kr)
import fs from "node:fs";
import vm from "node:vm";
import { COMPARE, BEST, GUIDES } from "./content.mjs";

const SITE = (process.env.SITE_URL || "https://footpick.kr").replace(/\/$/, "");
const NAME = "FootPick";
const DISCLOSURE = "이 사이트의 일부 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
const app = fs.readFileSync("src/app.html", "utf8");
const style = app.match(/<style>[\s\S]*?<\/style>/)[0];
const fonts = app.match(/<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard[^>]*>/)[0];
const script = app.match(/<script>([\s\S]*)<\/script>/)[1];

// 데이터 부분만 실행해서 모델 목록을 얻음 (DOM 코드 이전까지)
const ctx = {};
vm.createContext(ctx);
vm.runInContext(script.slice(0, script.indexOf('document.querySelectorAll("nav button").forEach(b=>b.addEventListener')) + ";this.D={M,REL,SIZE,SRC,STUD,shoe,comfortOf,SLUG,BRAND_EN,UPDATED,shop};", ctx);
const { M, REL, SIZE, SRC, STUD, shoe, SLUG, BRAND_EN, UPDATED, shop } = ctx.D;
const url = (m) => `/products/${SLUG[m.id]}/`;
const burl = (b) => `/brands/${BRAND_EN[b]}/`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const wtxt = (w) => (w <= 2 ? "좁은 편" : w >= 4 ? "넓은 편" : "보통");
const catName = (m) => (m.cat === "fg" ? "축구화" : "풋살화");
const bar = (v) => `<div class="bar">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= Math.round(v) ? "on" : ""}"></i>`).join("")}</div>`;
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
const foot = `<p class="disc">${DISCLOSURE}</p><p class="disc"><a href="/about/">평가 방법·운영 정보</a> · <a href="/privacy/">개인정보처리방침</a> · 문의 <a href="mailto:contact@footpick.kr">contact@footpick.kr</a></p><script>document.addEventListener("click",function(e){var a=e.target.closest("a[data-m]");if(a)try{navigator.sendBeacon("/api/events",new Blob([JSON.stringify({type:"buy",model:a.dataset.m,page:location.pathname})],{type:"application/json"}))}catch(x){}})</script>`;
const nav = `<p class="crumb"><a href="/">${NAME}</a> · <a href="/futsal/">풋살화</a> · <a href="/football/">축구화</a> · <a href="/best/">추천</a> · <a href="/compare/">비교</a> · <a href="/guides/">가이드</a> · <a href="/brands/">브랜드</a></p>`;
const byId = (id) => M.find((m) => m.id === id);
const RL = { width: "발볼", light: "가벼움", cushion: "쿠션", touch: "터치", dur: "내구성" };
const cmpOf = (m) => COMPARE.filter((c) => c[0] === m.id || c[1] === m.id);
const li = (x, extra = "") => `<li><a href="${url(x)}">${esc(x.b + " " + x.n)}</a>${extra}</li>`;

// 메인 페이지: 앱 + 검색엔진용 전체 모델 링크 + 제휴 고지
const links = ["tf", "fg"].map((c) => `<h3>${c === "fg" ? "축구화" : "풋살화"} 모델</h3><ul class="rel-list">${M.filter((m) => m.cat === c).map((m) => li(m)).join("")}</ul>`).join("");
const body = app.replace(/<title>[\s\S]*?<\/style>/, "");
fs.writeFileSync("dist/index.html",
  head(`${NAME} 풋픽 | 축구화·풋살화 비교는 ㅍㅍ! 2026 티어리스트·추천`, `구장·발볼·플레이 스타일·예산으로 나에게 맞는 축구화와 풋살화를 30초 만에 찾아요. ${M.length}개 모델 티어리스트, 사이즈 환승, VS 비교.`, "/") +
  body.replace(/<script>/, `<footer class="pg"><nav aria-label="전체 모델">${links}</nav>${foot}</footer>\n<script>`) + "</body></html>");

// 이런 사람 추천 / 비추천: 항목 점수를 같은 종류 평균과 비교해 규칙으로 뽑음. 비추천은 모델마다 최소 2개
const AVG = {};
for (const c of ["tf", "fg"]) { const L = M.filter((m) => m.cat === c); AVG[c] = Object.fromEntries(["width", "light", "cushion", "touch", "dur"].map((k) => [k, L.reduce((a, m) => a + m[k], 0) / L.length])); }
const indoor = (m) => /\b(IC|IN)\b|실내|살라 .*IN/.test(m.n);
function fitFor(m) {
  const yes = [], no = [], A = AVG[m.cat], leather = /천연 ?가죽|캥거루|소가죽|풀그레인|K-?레더|가죽 앞코/.test(m.up);
  if (m.width >= 4) { yes.push("발볼이 넓은 편인 사람"); no.push("발볼이 좁은 사람 (안에서 발이 놀 수 있어 끈을 단단히 묶거나 반 치수 다운 고려)"); }
  else if (m.width <= 2) { yes.push("발볼이 좁거나 발에 딱 붙는 핏을 좋아하는 사람"); no.push("발볼이 넓은 사람 (신어 보거나 반 치수 업 권장)"); }
  if (m.touch >= 4.5) yes.push("공 터치감을 가장 중요하게 보는 사람"); else if (m.touch <= A.touch - 0.5) no.push("맨발 같은 부드러운 터치감을 원하는 사람");
  if (m.light >= 4.5) yes.push("순간 스피드가 중요한 윙어·공격수"); else if (m.light <= A.light - 0.5) no.push("가벼움을 가장 중요하게 보는 스피드형 선수");
  if (m.cushion >= 4) yes.push("딱딱한 인조잔디에서 오래 뛰어도 발이 편해야 하는 사람"); else if (m.cushion <= A.cushion - 0.5) no.push("쿠션이 푹신한 신발을 원하는 사람");
  if (m.dur >= 4) yes.push("자주 뛰어서 오래 신을 신발이 필요한 사람"); else if (m.dur <= A.dur - 0.5) no.push("주 2회 이상 뛰며 한 켤레를 오래 신으려는 사람");
  if (m.grip != null && m.gripKnown && m.grip >= 4.5) yes.push("급정지·방향 전환이 많은 플레이");
  if (leather) no.push("가죽 관리(젖은 뒤 말리기·오염 관리)가 번거로운 사람");
  if (m.won <= 100000) yes.push("10만원 안팎에서 고르는 사람"); else if (m.won >= 200000) no.push(`예산이 15만원 이하인 사람 (약 ${Math.round(m.won / 10000)}만원대)`);
  if (m.cat === "tf" && indoor(m)) no.push("인조잔디 구장 위주로 뛰는 사람 (실내 코트용 평평한 밑창)");
  else if (m.cat === "tf") no.push("실내 마룻바닥 코트 위주로 뛰는 사람 (인조잔디용 고무 스터드)");
  if (m.cat === "fg" && /FG/.test(m.n) && !/AG|MG/.test(m.n)) no.push("인조잔디 구장 위주인 사람 (FG 전용 스터드는 AG·MG 모델이 더 안전)");
  if (m.cat === "fg" && /AG/.test(m.n) && !/FG/.test(m.n)) no.push("천연잔디 경기 위주인 사람 (AG 스터드는 짧아 천연잔디에선 덜 박혀요)");
  // 상대적으로 가장 약한 항목을 하나 더 짚어 줌 (중복 방지)
  const weaks = ["touch", "light", "cushion", "dur"].map((k) => [k, m[k] - A[k]]).sort((a, b) => a[1] - b[1]);
  const W = { touch: "터치감", light: "가벼움", cushion: "쿠션", dur: "내구성" };
  no.splice(0, no.length, ...new Set(no));
  for (const [k] of weaks) { if (no.length >= 2) break; const t = `${W[k]}을 가장 중요하게 보는 사람 (이 모델에서 상대적으로 약한 항목)`; if (!no.includes(t)) no.push(t); }
  return { yes: yes.slice(0, 4), no: no.slice(0, 3) };
}

// 모델 페이지 + 옛 주소(/m/<id>/) 넘김
const redirects = [];
for (const m of M) {
  redirects.push(`/m/${m.id}/ ${url(m)} 301`, `/m/${m.id} ${url(m)} 301`);
  const r = REL[m.id];
  const gen = r ? `<tr><th>세대</th><td>${esc(r[0])} · ${r[1] ? esc(r[1]) + " 출시" : "출시 연도 확인 중"} · ${esc(STUD[r[2]]?.[r[3]]?.[0] || "")} 등급</td></tr>` : "";
  const src = m.rev ? `${m.rsum ? `<h2>리뷰 요약</h2><p>${esc(m.rsum)}</p>` : ""}` : "";
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
<p><span class="tb" style="background:var(--${m.tier.toLowerCase()})">${m.tier}</span> 현재 ${m.tier}티어 · 성능 ${m.pt}점 · ${m.cat === "fg" ? "축구화" : "풋살화"} ${m.of}개 중 ${m.rank}위${m.vgood ? " · <b>가성비 좋음</b>" : ""}${m.vgood ? " · 가성비 좋음" : ""} <span class="k">(100점 만점, 가격 제외)</span></p>
<p class="k">평가 근거: 공개 리뷰·판매처 구매평·제조사 핏 안내 ${m.rev ? m.rev.length : 0}곳을 종합한 운영자 평가예요. 평가 신뢰도는 <b>${(m.rev ? m.rev.length : 0) >= 7 ? "높음" : (m.rev ? m.rev.length : 0) >= 4 ? "보통" : "낮음"}</b>이에요(점수에는 영향 없음). ${UPDATED} 기준이고, 유저 리뷰가 쌓이면 메인 페이지 점수에 실시간으로 반영돼요. <a href="/about/">평가 방법 보기</a></p>
<p><b>${esc(m.note)}</b></p>
<div class="cta"><a class="pri" href="${shop(m)}" target="_blank" rel="noopener sponsored" data-m="${m.id}">가격 확인</a><a href="/#m-${m.id}">리뷰 남기기</a><a href="/#vs-${m.id}">다른 모델과 VS 비교</a><a href="/#size-${m.id}">내 사이즈 찾기</a></div></div>
<div class="fit"><div><h2>이런 사람에게 추천</h2><ul>${f.yes.map((t) => `<li>✔ ${t}</li>`).join("") || "<li>무난한 올라운드형</li>"}</ul></div>
<div><h2>이런 사람에겐 비추천</h2><ul>${f.no.map((t) => `<li>✕ ${t}</li>`).join("")}</ul></div></div>
<h2>특징 한눈에 보기</h2>
<table><tbody><tr><th>종류</th><td>${catName(m)}</td></tr><tr><th>어퍼</th><td>${esc(m.up)}</td></tr><tr><th>가격</th><td>약 ${m.won.toLocaleString("ko-KR")}원 <span class="k">(정가 기준 참고값, 실제 판매가는 판매처에서 확인)</span></td></tr>${gen}
<tr><th>사이즈</th><td>${esc(SIZE[m.id] || "정보 없음")} · <a href="/#size-${m.id}">지금 신는 신발로 사이즈 계산</a></td></tr></tbody></table>
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
  const rows = TIERS.map((t) => { const T = L.filter((m) => m.tier === t); return T.length ? `<h2><span class="tb" style="background:var(--${t.toLowerCase()})">${t}</span> ${t}티어 (${T.length})</h2><ul>${T.map((m) => li(m, ` · ${m.pt}점 · 발볼 ${wtxt(m.width)} · 약 ${(m.won / 10000).toFixed(1)}만원`)).join("")}</ul>` : ""; }).join("");
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
<tr><th>티어</th><td>${a.tier} · ${a.pt}점</td><td>${b.tier} · ${b.pt}점</td></tr>
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

page("/about/", head(`평가 방법·운영 정보 | ${NAME}`, "풋픽 점수와 티어를 매기는 방법, 데이터 출처, 업데이트 주기, 제휴 고지.", "/about/") +
  `<main class="pg guide">${nav}<h1>평가 방법·운영 정보</h1>
<h2>점수는 이렇게 매겨요</h2><p>모델마다 발볼·가벼움·쿠션·터치·내구성·접지력을 1~5점으로 매긴 뒤, 항목별 비중을 곱해 100점 만점으로 바꿔요. 티어는 성능만으로 정하고 가격은 넣지 않아요. 풋살화는 터치 37%·발 편안함 26%·가벼움 16%·내구성 11%·접지력 10%, 축구화는 터치 30%·가벼움 30%·접지력 15%·발 편안함 15%·내구성 10%예요. 접지력은 리뷰에서 근거를 찾은 모델만 넣고, 근거가 없는 모델은 접지력을 빼고 나머지 항목 비중을 그만큼 키워 계산해요. 근거가 없다고 감점하지 않기 위해서예요. 티어 기준은 풋살화가 S 78점·A 72점·B 62점 이상, 축구화는 고득점 모델이 많아 S 83점·A 76점·B 66점 이상이에요.</p>
<h2>처음 점수는 운영자 평가예요</h2><p>직접 신어 본 측정값이 아니라, 모델마다 공개 리뷰·판매처 구매평·제조사 핏 안내 3~10곳(평균 6곳)을 읽고 운영자가 매긴 값이에요. 자료가 2곳 이하인 모델은 상세 페이지에 "추정 비중이 커요"라고 표시해요. 문장은 그대로 옮기지 않고 직접 요약해요.</p>
<h2>평가 신뢰도와 가성비</h2><p><b>평가 신뢰도</b>는 참고 자료 수와 유저 리뷰 수로 정해요(높음: 자료 7곳 이상 또는 리뷰 20명 이상, 보통: 자료 4곳 이상 또는 리뷰 5명 이상). 근거가 적다고 성능이 낮은 건 아니라서 점수에는 더하거나 빼지 않아요. <b>가성비 좋음</b>은 12만 원 이하 모델 중 성능 상위 4분의 1이면서 같은 종류 전체에서 중간보다 높은 모델에 붙고, 티어와는 따로 계산해요. 리뷰를 남길 때 <b>접지력</b>도 선택으로 매길 수 있어요. 데이터가 충분히 쌓이면 평가 항목에 넣을 예정이에요.</p>
<h2>유저 리뷰는 이렇게 반영돼요</h2><p>로그인 없이 브라우저마다 모델당 1개씩 항목별 점수를 남길 수 있어요. 운영자 평가는 유저 10명분의 무게로 시작하고, 유저 리뷰가 쌓일수록 유저 평균 쪽으로 옮겨가요(10명이 모이면 반반). 카드에는 자료 종합 점수와 유저 평균 점수를 따로 보여줘요. 같은 곳에서 짧은 시간에 리뷰를 몰아서 남기는 것은 막고 있어요.</p>
<h2>사이즈 환승기</h2><p>브랜드 실측값이 아니라 판매처·제조사 사이즈 안내, 발볼 점수, 갑피 소재, 유저 사이즈 리뷰를 합친 참고값이에요. 근거가 적으면 "추천 신뢰도 낮음"으로 표시해요.</p>
<h2>가격과 제휴</h2><p>가격은 정가 기준 참고값이고, 해외 정가를 환산한 추정치가 섞여 있어요. 실제 판매가와 재고는 판매처에서 확인해 주세요. ${DISCLOSURE} 제휴 여부는 점수와 티어에 영향을 주지 않아요.</p>
<h2>업데이트</h2><p>마지막 업데이트: ${UPDATED}. 새 모델이 나오면 추가하고 점수를 다시 매겨요.</p>
<h2>문의</h2><p>점수가 이상하거나 빠진 모델, 틀린 정보, 제휴 제안은 <a href="mailto:contact@footpick.kr">contact@footpick.kr</a> 로 보내 주세요.</p>${foot}</main></body></html>`);
page("/privacy/", head(`개인정보처리방침 | ${NAME}`, "풋픽이 수집하는 정보와 이용 목적.", "/privacy/") +
  `<main class="pg guide">${nav}<h1>개인정보처리방침</h1>
<p>풋픽은 회원가입이 없고, 이름·이메일·전화번호 같은 개인정보를 받지 않아요.</p>
<h2>수집하는 정보</h2><ul><li>리뷰를 남길 때: 브라우저에 저장되는 임의의 식별값(같은 브라우저의 리뷰 수정·삭제용), 항목 점수, 한줄평, 사이즈 체감, 작성 시각</li><li>도배 방지를 위해 접속 IP를 복원할 수 없게 변환(해시)한 값</li><li>서비스 개선용 익명 이용 기록: 구매처 버튼 클릭, 추천·비교 사용, 공유 버튼 사용(개인을 알아볼 수 없는 형태)</li></ul>
<h2>이용 목적과 보관</h2><p>리뷰 표시, 점수 계산, 도배 방지, 기능 개선에만 써요. 리뷰는 작성한 브라우저에서 언제든 삭제할 수 있고, 삭제하면 서버에서도 지워져요.</p>
<h2>외부 서비스</h2><p>사이트는 Cloudflare에서 운영되고, 구매처 링크를 누르면 쿠팡 등 판매처 사이트로 이동해요. 이동한 사이트의 개인정보 처리는 그 사이트의 방침을 따라요.</p>
<h2>문의</h2><p>개인정보 관련 문의: <a href="mailto:contact@footpick.kr">contact@footpick.kr</a></p>
<p class="k">시행일: ${UPDATED}</p>${foot}</main></body></html>`);
const urls = ["/", "/about/", "/futsal/", "/football/", "/brands/", "/compare/", "/best/", "/guides/", ...BEST.map((B) => `/best/${B.slug}/`), ...COMPARE.map((c) => `/compare/${c[2]}/`), ...GUIDES.map((G) => `/guides/${G.slug}/`), ...brands.map(burl), ...M.map(url)];
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((p) => `<url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n") + "\n</urlset>\n");
fs.writeFileSync("dist/robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`built ${M.length} model pages -> dist/`);
