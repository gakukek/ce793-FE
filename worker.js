export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Try to serve the static asset first
    const response = await env.ASSETS.fetch(request)

    // If asset exists, return it
    if (response.status !== 404) {
      return response
    }

    // SPA fallback → index.html
    return env.ASSETS.fetch(
      new Request(new URL('/index.html', request.url))
    )
  }
}
