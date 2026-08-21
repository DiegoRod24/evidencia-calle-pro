const TARGET = "https://one-shot-2.pages.dev/api/dropbox/upload";

export async function onRequest(context) {
  const method = context.request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204 });
  if (method !== "POST") {
    return new Response(JSON.stringify({ ok: false, message: `Método no permitido: ${method}` }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8", allow: "POST, OPTIONS" },
    });
  }

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
