const TARGET = "https://one-shot-2.pages.dev/api/dropbox/upload";

export async function onRequestPost(context) {
  const auth = context.request.headers.get("authorization") || "";
  const contentType = context.request.headers.get("content-type") || "";
  const body = await context.request.arrayBuffer();
  const headers = {};
  if (auth) headers.authorization = auth;
  if (contentType) headers["content-type"] = contentType;

  const upstream = await fetch(TARGET, {
    method: "POST",
    headers,
    body,
  });
  const responseBody = await upstream.arrayBuffer();
  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
