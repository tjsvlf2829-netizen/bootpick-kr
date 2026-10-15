# 신상 소식 루틴 작업 순서

매일 아침 06:52 자동 작업(루틴)이 이 순서대로 실행해요. 사람이 직접 돌릴 때도 같아요.

## 원칙
- **공식 발표된 것만** 다뤄요. 브랜드 뉴스룸·공식 몰, 구단 스폰서 발표, 축구화 전문 매체(Footy Headlines, SoccerBible, Soccer.com, Unisport 등)에서 출시나 공식 공개가 확인된 것만 넣어요.
- **유출 소식**(2026-10-14 선팔님 요청)은 `status: "leak"`으로 따로 넣어요. 조건: 축구화 전문 매체·스니커 매체 **2곳 이상**이 같은 유출을 보도했을 때만(한 계정의 추측·컨셉 렌더·"가짜로 의심" 표시된 것은 제외). 나이키·아디다스·푸마·미즈노·아식스의 주요 라인(새 세대, 시그니처·큰 팩)만, 하루 최대 1개. 사이트·카드·캡션에 "유출·미확정"을 꼭 표시하고, 나중에 공식 발표되면 같은 항목을 `announced`/`released`로 바꿔요(새 항목 만들지 않음). 틀린 것으로 밝혀지면 지워요.
  - 유출 항목에는 `expected`(예: "2026 연말"), `colors`([어퍼, 포인트, 밑창] 색), 필요하면 `grad`([앞, 뒤] 어퍼 그라데이션), `hook`(표지 문구, `<br>`로 줄바꿈)을 넣어요. `price`는 보도된 예상가. `date`는 보도를 확인한 날.
- 출처는 **서로 다른 곳 2곳 이상**이고, 그중 하나는 가능하면 공식 출처예요.
- **사진은 쓰지 않아요.** 브랜드·쇼핑몰·매체 이미지를 내려받거나 링크하지 않아요(유출 사진도 저작권이 원작자·브랜드에 있어요). 그림은 사이트 일러스트(shoe)만 쓰고, 유출 컬러는 `colors`로 색만 옮겨요.
- 문장을 베끼지 않고 사실만 짧게 한국어로 정리해요.
- **점수를 지어내지 않아요.** 새 모델은 티어 점수 없이 올리고, 리뷰 자료가 3곳 이상 모이면 따로 평가해요.
- 다루는 것: 새 모델, 새 세대(숫자가 바뀌는 것). 컬러웨이는 월드컵 팩처럼 아주 큰 것만 `kind: "colorway"`로 넣어요.

## 순서
1. `git pull origin main`
2. `src/releases.json`을 읽고 가장 최근 날짜를 확인해요.
3. 최근 14일 안에 공식 출시·공개된 것과, 위 조건에 맞는 유출을 찾아요. 공식 출시·공개된 축구화(FG/AG/MG)·풋살화(TF)·인도어화(IC/IN)를 웹 검색으로 찾아요. 이미 `releases.json`에 있는 것은 건너뛰어요.
4. 새로 찾은 것마다 `releases.json`에 항목을 추가해요.
   ```json
   {"id":"nike-mercurial-superfly-11","date":"2026-10-07","status":"released","brand":"나이키",
    "model":"머큐리얼 슈퍼플라이 11","model_en":"Mercurial Superfly 11","kind":"new-generation",
    "cats":["fg","tf"],"grades":["엘리트","프로","아카데미"],"price":"$300",
    "points":["40자 이하 사실 2~3개"],"like":"비슷한 기존 모델 id(일러스트 색·밑창용)",
    "modelId":"사이트에 똑같은 모델이 있으면 그 id, 없으면 생략",
    "sources":[{"name":"Nike","url":"..."},{"name":"Footy Headlines","url":"..."}]}
   ```
   - `status`: 출시됐으면 `released`, 공개만 됐으면 `announced`
   - `like`/`modelId`는 `src/app.html`의 `M` 목록 id에서 골라요(같은 라인의 직전 세대가 좋아요).
5. 라인업에도 반영해요. `src/app.html`의 `LINES`에서 같은 라인을 찾아 `g` 맨 끝에 `["모델명","YYYY-MM",1]`을 더해요(날짜를 공식 출처로 확인했으면 1, 아니면 0). 기존 라인의 후속이 아닌 새 라인이면 `LINES`에 새 줄을 추가해요. 라인업 화면은 점수가 있는 모델이 생긴 라인만 보여 줘요.
6. 리뷰 자료(공개 리뷰·구매평)가 3곳 이상 모인 새 모델은 기존 모델과 같은 방식으로 `M`에 항목을 추가해 티어에 넣고, `releases.json`에 `modelId`를 적어요. 자료가 부족하면 넣지 않아요.
7. `node build.mjs`가 오류 없이 끝나는지 확인하고, `Add release news: <모델>` 메시지로 커밋·푸시해요. 푸시하면 사이트(footpick.kr/new/)에 바로 반영돼요.
8. 새 항목이 하나도 없으면 여기서 끝내요.
9. 새 항목이 있으면 카드뉴스를 만들어요(한 번에 최대 4개, 컬러웨이보다 새 모델 우선).
   `node tools/newcard.mjs new-YYYYMMDD <id> [<id> ...]` → `src/media/new-YYYYMMDD/`에 피드 사진, story.jpg, reel.mp4, caption.txt가 생겨요. 커밋·푸시하고 배포가 끝날 때까지 기다려요
   (`gh api repos/tjsvlf2829-netizen/bootpick-kr/commits/<커밋>/check-runs`가 completed/success).
10. Metricool(brandId 7352735, Asia/Seoul)에 인스타 게시를 넣어요. **하루 1개, 17:30만** 올려요(2026-10-16 선팔님 결정: Metricool 무료 월 한도 때문에 07:00 아침 게시는 멈춤). 신상 소식은 피드(캐러셀, caption.txt) 하나만 넣어요. 릴스·스토리는 올리지 않아요.
   - 미디어 주소: `https://footpick.kr/media/new-YYYYMMDD/1.jpg` 등
   - 신상 소식은 **임시 저장(draft:true)으로 그날 17:30에** 넣어요. 무료 한도를 아껴야 해서 자동 게시는 하지 않고, 선팔님이 보고 직접 올리거나 예약을 켜요. 그날 17:30에 이미 있는 예약은 건드리지 않아요.
   - 예약 중에 "account limit" 오류가 나면 더 시도하지 말고 요약에 적어요.
11. 마지막에 무엇을 추가했고 무엇을 예약했는지 짧게 요약해요.

## 게시 방식
- `review`: `createScheduledPost`에 `"draft": true`로 넣어요. 임시 저장 상태라 선팔님이 Metricool 앱에서 내용을 보고 예약을 눌러야 게시돼요.
- `auto`: `createScheduledPost`로 바로 예약해요.
