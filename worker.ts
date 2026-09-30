export interface Env {
  ASSETS: Fetcher;
  BACKEND_URL: string;
}

function backendRequest(request: Request, env: Env): Request {
  const incoming = new URL(request.url);
  const backend = new URL(env.BACKEND_URL);
  backend.pathname = incoming.pathname;
  backend.search = incoming.search;
  return new Request(backend.toString(), request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Keep all existing Express APIs and the Paystack callback on the backend.
    if (url.pathname.startsWith('/api/') || url.pathname === '/payment/callback') {
      try {
        return await fetch(backendRequest(request, env));
      } catch (error) {
        console.error('Backend proxy error:', error);
        return new Response(JSON.stringify({ error: 'Backend service unavailable' }), {
          status: 502,
          headers: { 'content-type': 'application/json' },
        });
      }
    }

    // Cloudflare serves the Vite build. SPA fallback is configured in wrangler.toml.
    return env.ASSETS.fetch(request);
  },
};
