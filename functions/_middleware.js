// 예전 주소(bootpick-kr.pages.dev)와 www로 들어오면 대표 주소 footpick.kr로 영구 이동.
// 미리보기 배포(<hash>.bootpick-kr.pages.dev)는 그대로 둔다.
const MAIN = "footpick.kr";
const OLD = new Set(["bootpick-kr.pages.dev", "www.footpick.kr"]);

// 네이버 서치어드바이저 HTML 파일 인증. Pages는 .html 주소를 확장자 없는 주소로 돌려보내서
// 인증 봇이 리디렉트를 만나지 않도록 여기서 바로 응답한다.
const NAVER = "naver4b970859ad6953ce337f31212f1016e2.html";

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.pathname === "/" + NAVER) {
    return new Response("naver-site-verification: " + NAVER, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  if (OLD.has(url.hostname)) {
    url.hostname = MAIN;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
