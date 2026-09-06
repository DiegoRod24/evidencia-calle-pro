export async function onRequest(context) {
  const response = await context.next();
  const pathname = new URL(context.request.url).pathname;
  // CONTROL es un dashboard independiente: no debe recibir el runtime de la cámara móvil.
  if (pathname === "/control" || pathname.startsWith("/control/")) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  return new HTMLRewriter()
    // Producción: cámara primero. Excel, mapas y nube se cargan solo al pedirlos.
    .on('link[href*="leaflet@1.9.4/dist/leaflet.css"]', { element(el) { el.remove(); } })
    .on('script[src*="exceljs@4.4.0"]', { element(el) { el.remove(); } })
    .on('script[src*="leaflet@1.9.4/dist/leaflet.js"]', { element(el) { el.remove(); } })
    .on("body", {
      element(el) {
        el.append('<script src="/one-shop-stable-runtime.js"></script>', { html: true });
      },
    })
    .transform(response);
}
