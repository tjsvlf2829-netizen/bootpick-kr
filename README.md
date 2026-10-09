# FootRank

풋살화·축구화 티어리스트, 모델별 특징, 플레이 스타일 추천 사이트. 유저 리뷰(로그인 없음)로 티어가 계속 바뀐다.

- `src/app.html`: 메인 화면(데이터·점수 공식·화면 코드 전부). 모델 추가·수정은 여기서.
- `build.mjs`: `dist/`에 메인, 모델별 페이지(`/m/<id>/`), sitemap.xml, robots.txt 생성.
- `functions/api/ratings.js`: 리뷰 저장 API (Cloudflare Pages Functions + D1).
- `schema.sql`: 리뷰 테이블.

## 점수 방식
시작 점수(공개 리뷰 종합)를 유저 리뷰 `SEED_W`(50)명분 무게로 두고, 항목마다 `(시작×50 + 유저합) ÷ (50 + 인원)`으로 섞은 뒤 티어 공식으로 다시 계산한다.

## 조작 방지 (로그인 없음)
브라우저마다 임의 id로 모델당 1개(다시 쓰면 덮어씀). 같은 IP에서 한 시간 20개, 한 모델 3개까지. IP는 해시로만 저장.

## Cloudflare Pages 배포 (한 번만)
1. Cloudflare 가입 → Workers & Pages → Create → Pages → Connect to Git → 이 저장소 선택.
2. Build command `node build.mjs`, Build output directory `dist` → Save and Deploy.
3. Storage & Databases → D1 → Create database `bootpick` → Console 탭에 `schema.sql` 내용을 붙여 넣고 실행.
4. Pages 프로젝트 → Settings → Bindings → Add → D1 database, Variable name `DB`, 데이터베이스 `bootpick` 선택.
5. (선택) Settings → Variables에 `IP_SALT`(아무 긴 문자열), 도메인을 바꾸면 `SITE_URL`도 추가 → Deployments에서 Retry deployment.
