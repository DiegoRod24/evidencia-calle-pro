"use strict";

(() => {
  if (window.__oneShotSameOriginProxyInstalled) return;
  window.__oneShotSameOriginProxyInstalled = true;

  const remoteBase = "https://one-shot-2.pages.dev/api/dropbox/";
  const nativeFetch = window.fetch.bind(window);

  window.fetch = function(input, init) {
    if (typeof input === "string" && input.startsWith(remoteBase)) {
      const localUrl = "/api/dropbox/" + input.slice(remoteBase.length);
      return nativeFetch(localUrl, init);
    }
    if (input instanceof Request && input.url.startsWith(remoteBase)) {
      const localUrl = new URL("/api/dropbox/" + input.url.slice(remoteBase.length), location.origin).href;
      const next = new Request(localUrl, input);
      return nativeFetch(next, init);
    }
    return nativeFetch(input, init);
  };
})();
