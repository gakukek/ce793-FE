export default {
  async fetch(request, env) {
    try {
      // Try to serve the requested asset (JS, CSS, image, etc.)
      return await env.ASSETS.fetch(request);
    } catch (err) {
      // SPA fallback: always return index.html
      return await env.ASSETS.fetch(
        new Request(new URL("/index.html", request.url))
      );
    }
  }
};
