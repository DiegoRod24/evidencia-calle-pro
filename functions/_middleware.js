export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.append('<link rel="stylesheet" href="/one-dropbox-legacy-sync.css">', { html: true });
      },
    })
    .on("body", {
      element(el) {
        el.append('<script src="/one-dropbox-legacy-sync.js"></script>', { html: true });
        el.append('<script src="/one-dropbox-write-diagnostic.js"></script>', { html: true });
        el.append('<script src="/one-dropbox-same-origin-proxy.js"></script>', { html: true });
        el.append('<script src="/one-phase1-batch-migration.js"></script>', { html: true });
      },
    })
    .transform(response);
}
