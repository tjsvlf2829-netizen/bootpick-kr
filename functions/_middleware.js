// 예전 주소(bootpick-kr.pages.dev)와 www로 들어오면 대표 주소 footpick.kr로 영구 이동.
// 미리보기 배포(<hash>.bootpick-kr.pages.dev)는 그대로 둔다.
const MAIN = "footpick.kr";
const OLD = new Set(["bootpick-kr.pages.dev", "www.footpick.kr"]);

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (OLD.has(url.hostname)) {
    url.hostname = MAIN;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
