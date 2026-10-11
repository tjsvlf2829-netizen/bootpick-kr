// 신상 소식 인스타 카드뉴스 생성기 (매일 아침 신상 루틴이 사용)
// 실행: node tools/newcard.mjs <키> <릴리스id> [<릴리스id> ...]
//  예) node tools/newcard.mjs new-20261012 nike-superfly-11 adidas-predator-27
// 결과: src/media/<키>/ 1.jpg..N.jpg(피드 1080x1350), story.jpg(1080x1920), reel.mp4(첫 장면 1초), caption.txt
// 데이터는 src/releases.json, 일러스트는 app.html의 shoe() (release.like = 비슷한 기존 모델 id로 색·밑창 빌림)
// 원칙: 브랜드·쇼핑몰 사진은 쓰지 않음. 점수는 지어내지 않음(사이트에 평가가 있을 때만 표시)
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path";
import { execFileSync } from "node:child_process"; import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const [key, ...ids] = process.argv.slice(2);
if (!key || !ids.length) { console.error("사용법: node tools/newcard.mjs <키> <릴리스id>..."); process.exit(1); }

// Playwright 위치는 환경마다 달라서 후보를 차례로 찾음
const PW = ["/opt/node22/lib/node_modules/playwright/index.mjs", "/opt/node-tools/node_modules/playwright/index.mjs", path.join(ROOT, "node_modules/playwright/index.mjs")].find((f) => fs.existsSync(f));
if (!PW) { console.error("playwright를 찾지 못했어요"); process.exit(1); }
const { chromium } = await import(pathToFileURL(PW).href);

const src = fs.readFileSync(path.join(ROOT, "src/app.html"), "utf8").match(/<script>([\s\S]*)<\/script>/)[1];
const c = {}; vm.createContext(c);
vm.runInContext(src.slice(0, src.indexOf('document.querySelectorAll("nav button").forEach(b=>b.addEventListener')) + ";this.D={M,shoe};", c);
const { M, shoe } = c.D;
const REL = JSON.parse(fs.readFileSync(path.join(ROOT, "src/releases.json"), "utf8"));
const R = ids.map((id) => { const r = REL.find((x) => x.id === id); if (!r) throw new Error("releases.json에 없는 id: " + id); return r; });

const b64 = (f, t) => `data:${t};base64,` + fs.readFileSync(path.join(ROOT, f)).toString("base64");
const F = (n) => b64(`tools/fonts/Pretendard-${n}.woff2`, "font/woff2");
const LOGO = b64("tools/assets/logo.png", "image/png");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const CAT = { fg: "축구화", tf: "풋살화", ic: "인도어화" };
const KIND = { "new-model": "신규 모델", "new-generation": "새 세대", colorway: "새 컬러" };
const md = (d) => { const [, m, dd] = d.split("-"); return `${+m}/${+dd}`; };
const ill = (r, w) => `<div style="width:${w}px">${shoe(r.like || r.modelId || "_").replace('class="shoe"', 'class="shoe" style="width:100%;display:block;filter:drop-shadow(0 18px 22px rgba(0,0,0,.18))"')}</div>`;
const rated = (r) => r.modelId && M.find((m) => m.id === r.modelId);

const css = `@font-face{font-family:P;src:url(${F("Bold")});font-weight:700}@font-face{font-family:P;src:url(${F("ExtraBold")});font-weight:800}@font-face{font-family:P;src:url(${F("Black")});font-weight:900}
*{box-sizing:border-box;margin:0}body{margin:0;font-family:P;word-break:keep-all}
.lt{width:1080px;height:1350px;position:relative;overflow:hidden;background:#eef0ef;color:#111;
 background-image:linear-gradient(#d9dddb 1.5px,transparent 1.5px),linear-gradient(90deg,#d9dddb 1.5px,transparent 1.5px);background-size:54px 54px}
.top{position:absolute;top:34px;left:44px;right:44px;display:flex;justify-content:space-between;align-items:center;font-weight:900;font-size:26px;color:#222}
.top img{width:64px;height:64px;border-radius:50%}.pgn{background:#111;color:#fff;border-radius:99px;padding:6px 18px;font-size:26px}
.big1{font-weight:900;letter-spacing:-6px;line-height:1.02;color:#4ef0c0;-webkit-text-stroke:5px #111;paint-order:stroke fill;text-shadow:8px 8px 0 #111}
.big2{display:inline-block;background:#4ef0c0;color:#111;font-weight:900;font-size:60px;letter-spacing:-2px;padding:4px 22px;border:4px solid #111}
.band{display:inline-block;background:#111;color:#4ef0c0;font-weight:900;font-size:38px;padding:8px 24px;border-radius:10px}
.mname{font-size:64px;font-weight:900;letter-spacing:-2.5px;color:#0f9f74;text-align:center;line-height:1.15}
.meta{font-size:32px;font-weight:800;text-align:center;color:#222}
.pts{display:grid;gap:16px;margin:0 70px}.pts div{background:#fff;border:3px solid #111;border-radius:18px;padding:20px 26px;font-size:34px;font-weight:700;letter-spacing:-1px;box-shadow:6px 6px 0 #111}
.lab{display:inline-block;background:#111;color:#fff;font-weight:800;padding:10px 18px;font-size:26px;letter-spacing:-1px}
.foot{position:absolute;bottom:34px;left:44px;right:44px;display:flex;justify-content:space-between;font-size:23px;color:#555;font-weight:700}
.st{width:1080px;height:1920px;position:relative;background:#eef0ef;background-image:linear-gradient(#d9dddb 1.5px,transparent 1.5px),linear-gradient(90deg,#d9dddb 1.5px,transparent 1.5px);background-size:54px 54px}
.q{display:inline-block;background:#111;color:#4ef0c0;font-weight:900;font-size:56px;letter-spacing:-2px;padding:16px 36px;border-radius:24px}`;
const top = (n) => `<div class="top"><span>FOOTPICK · 신상 소식</span><span style="display:flex;align-items:center;gap:14px">${n ? `<span class="pgn">${n}</span>` : ""}<img src="${LOGO}"></span></div>`;
const foot = (r) => `<div class="foot"><span>footpick.kr/new · 공식 발표 기준</span><span>${r ? "출처: " + esc((r.sources || []).map((s) => s.name.replace(/\s*\(.*?\)/g, "")).slice(0, 2).join(", ")) : "가격은 정가 기준"}</span></div>`;

const N = R.length + 2, slides = [];
const pos = R.length === 1 ? [[240, 170, 600]] : R.length === 2 ? [[60, 200, 460], [560, 200, 460]] : R.length === 3 ? [[60, 170, 460], [560, 170, 460], [310, 460, 460]] : R.map((_, i) => [60 + (i % 2) * 500, 150 + Math.floor(i / 2) * 290, 460]);
slides.push(`<div class="lt">${top("")}
${R.map((r, i) => `<div style="position:absolute;left:${pos[i][0]}px;top:${pos[i][1]}px;width:${pos[i][2]}px">${ill(r, pos[i][2])}<div style="text-align:center;margin-top:-4px"><span class="lab">${esc(r.brand)} ${esc(r.model)}</span></div></div>`).join("")}
<div style="position:absolute;left:0;right:0;bottom:80px;text-align:center"><div class="big2">${R.length === 1 ? md(R[0].date) + " " + (R[0].status === "released" ? "출시" : "발표") : "최근 출시 " + R.length + "켤레"}</div>
<div class="big1" style="margin-top:16px;font-size:${R.length === 1 ? 118 : 130}px">${R.length === 1 ? "신상 " + esc(CAT[R[0].cats?.[0]] || "축구화") + "<br>나왔다" : "새로 나온<br>축구화"}</div></div></div>`);
R.forEach((r, i) => { const m = rated(r);
  slides.push(`<div class="lt">${top(`${i + 2}/${N}`)}
<div style="position:absolute;top:140px;left:0;right:0;display:grid;justify-items:center;gap:22px">
 ${ill(r, 700)}
 <span class="band">${md(r.date)} ${r.status === "released" ? "출시" : "출시 예정"} · ${KIND[r.kind] || "신상"}</span>
 <div class="mname">“${esc(r.brand)} ${esc(r.model)}”</div>
 <div class="meta">${(r.cats || []).map((x) => CAT[x]).filter(Boolean).join("·")}${r.grades?.length ? " · " + r.grades.map(esc).join("/") : ""}${r.price ? " · " + esc(r.price) : ""}</div>
 ${m ? `<div class="meta">풋픽 평가(${esc(m.n)}) ${m.tier}티어 · ${m.pt}점</div>` : ""}
<div class="pts" style="width:940px;margin-top:20px">${(r.points || []).slice(0, 3).map((t) => `<div>✔ ${esc(t)}</div>`).join("")}</div>
</div>${foot(r)}</div>`); });
slides.push(`<div class="lt">${top(`${N}/${N}`)}
<div style="position:absolute;inset:150px 70px 120px;display:grid;align-content:center;gap:36px;text-align:center">
 <div class="big1" style="font-size:96px;letter-spacing:-4px">신발 고르기 전<br>점수부터 확인</div>
 <div class="pts" style="margin:0">${R.map((r) => `<div style="display:flex;justify-content:space-between;gap:20px;font-size:30px"><span>${md(r.date)}</span><b>${esc(r.brand)} ${esc(r.model)}</b></div>`).join("")}</div>
 <p style="font-size:32px;font-weight:700;background:#fff;border:3px dashed #111;border-radius:18px;padding:18px 24px">💡 신상은 리뷰 자료가 모이면 풋픽 티어에 추가돼요</p>
 <p style="font-size:36px;font-weight:800">신상 소식 매일 업데이트 <span style="background:#111;color:#4ef0c0;padding:4px 18px">footpick.kr</span></p>
 <p style="font-size:28px;color:#444;font-weight:700">저장해 두고, 신발 바꿀 친구에게 보내 주세요</p></div>${foot(null)}</div>`);

const OUT = path.join(ROOT, "src/media", key); fs.mkdirSync(OUT, { recursive: true });
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "newcard-"));
const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
const shot = async (html, sel, file) => { await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120); await p.locator(sel).screenshot({ path: file }); };
const jpg = (png, out) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "2", out]);
for (let i = 0; i < slides.length; i++) { const f = `${TMP}/f${i}.png`; await shot(slides[i], ".lt", f); jpg(f, `${OUT}/${i + 1}.jpg`); }
// 스토리: 표지를 카드로 넣고 새 게시물 안내
const cover = "data:image/png;base64," + fs.readFileSync(`${TMP}/f0.png`).toString("base64");
await shot(`<div class="st"><div style="position:absolute;top:150px;left:0;right:0;text-align:center"><span class="q">신상 소식 🆕</span></div>
<img src="${cover}" style="position:absolute;left:90px;top:300px;width:900px;border:4px solid #111;border-radius:24px;box-shadow:12px 12px 0 #111">
<div style="position:absolute;left:0;right:0;top:1520px;text-align:center;font-weight:900;font-size:52px">새 게시물</div>
<div style="position:absolute;left:0;right:0;top:1600px;text-align:center;font-weight:700;font-size:36px;color:#333">프로필에서 전체 보기 · footpick.kr</div></div>`, ".st", `${TMP}/story.png`);
jpg(`${TMP}/story.png`, `${OUT}/story.jpg`);
// 릴스: 카드마다 질문 띠를 얹은 세로 장면. 첫 장면 1초(초반 이탈 대응)
const Q = R.length === 1 ? `${R[0].brand} 신상 나왔다` : "요즘 나온 신상 축구화";
const scenes = [];
for (let i = 0; i < slides.length; i++) {
  const img = "data:image/png;base64," + fs.readFileSync(`${TMP}/f${i}.png`).toString("base64");
  await shot(`<div class="st"><div style="position:absolute;top:150px;left:40px;right:40px;text-align:center"><span class="q">${esc(Q)}</span></div>
<img src="${img}" style="position:absolute;left:0;top:300px;width:1080px">
<div style="position:absolute;left:0;right:0;top:1700px;text-align:center;font-weight:700;font-size:36px;color:#333"><div style="display:flex;gap:10px;justify-content:center;margin-bottom:18px">${slides.map((_, j) => `<i style="width:14px;height:14px;border-radius:50%;background:${j === i ? "#111" : "#bbb"}"></i>`).join("")}</div>저장해 두고 친구에게 공유 · footpick.kr</div></div>`, ".st", `${TMP}/r${i}.png`);
  scenes.push([`${TMP}/r${i}.png`, i === 0 ? 1.0 : i === slides.length - 1 ? 3.0 : 2.6]);
}
await br.close();
const X = 0.3, args = ["-y", "-loglevel", "error"];
scenes.forEach(([f, d]) => args.push("-loop", "1", "-t", String(d), "-framerate", "30", "-i", f));
args.push("-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo");
let fc = "", prev = "[0:v]", off = 0;
for (let i = 1; i < scenes.length; i++) { off += scenes[i - 1][1] - X; const o = i === scenes.length - 1 ? "[v]" : `[x${i}]`; fc += `${prev}[${i}:v]xfade=transition=slideleft:duration=${X}:offset=${off.toFixed(2)}${o};`; prev = o; }
fc += "[v]format=yuv420p[vo]";
args.push("-filter_complex", fc, "-map", "[vo]", "-map", `${scenes.length}:a`, "-shortest", "-c:v", "libx264", "-r", "30", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-movflags", "+faststart", `${OUT}/reel.mp4`);
execFileSync("ffmpeg", args);
// 캡션 초안
const tags = ["#신상축구화", "#축구화", "#풋살화", "#축구화추천", "#풋살화추천", ...new Set(R.map((r) => "#" + r.brand + "축구화")), "#풋픽"];
fs.writeFileSync(`${OUT}/caption.txt`, `${R.length === 1 ? `${R[0].brand} ${R[0].model} ${R[0].status === "released" ? "출시" : "출시 예정"} 🆕` : `최근 새로 나온 축구화 ${R.length}켤레 🆕`}

${R.map((r) => `${md(r.date)}  ${r.brand} ${r.model}${r.price ? ` (${r.price})` : ""}\n${(r.points || []).slice(0, 2).map((t) => "· " + t).join("\n")}`).join("\n\n")}

📌 저장해 두고, 신발 바꿀 친구에게 보내 주세요.
신상 소식·154개 모델 티어 👉 프로필 링크 (footpick.kr)
※ 브랜드 공식 발표 기준이에요. 풋픽 점수는 리뷰 자료가 모이면 매겨요.

${tags.join(" ")}\n`);
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`${key}: 피드 ${slides.length}장, story.jpg, reel.mp4, caption.txt → src/media/${key}/`);
