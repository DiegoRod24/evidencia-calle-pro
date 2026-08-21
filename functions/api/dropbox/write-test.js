const TARGET = "https://one-shot-2.pages.dev/api/dropbox/write-test";

export async function onRequestPost(context) {
  const auth = context.request.headers.get("authorization") || "";
  const upstream = await fetch(TARGET, {
    method: "POST",
    headers: auth ? { authorization: auth } : {},
  });
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
