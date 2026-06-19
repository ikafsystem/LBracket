function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function onRequest(context: any) {
  if (context.request.method !== 'GET') {
    return context.env.ASSETS.fetch(context.request);
  }

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  const ua = (context.request.headers.get('User-Agent') || '').toLowerCase();
  const isBot = /bot|facebook|twitter|whatsapp|telegram|discord|slack|pinterest|linkedin|embedly|slurp|duckduckbot|baiduspider|yandex|facebot|outbrain|ambassador/i.test(ua);

  if (id && isBot) {
    try {
      const db = context.env.DB;
      const result = await db.prepare('SELECT data FROM tournaments WHERE id = ?').bind(id).first();

      if (result) {
        const tournament = JSON.parse(result.data as string);
        const name = escapeHtml(tournament.name || 'Tournament');
        const origin = url.origin;
        const logoUrl = tournament.logo
          ? `${origin}/api/logo/${encodeURIComponent(id)}`
          : `${origin}/logo.png`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${name} - L-Bracket</title>
<meta property="og:title" content="${name}"/>
<meta property="og:description" content="L-Bracket Tournament"/>
<meta property="og:image" content="${logoUrl}"/>
<meta property="og:image:width" content="512"/>
<meta property="og:image:height" content="512"/>
<meta property="og:site_name" content="L-Bracket"/>
<meta property="og:type" content="website"/>
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${name}"/>
<meta name="twitter:description" content="L-Bracket Tournament"/>
<meta name="twitter:image" content="${logoUrl}"/>
<meta http-equiv="refresh" content="0;url=/tournament?id=${encodeURIComponent(id)}"/>
</head>
<body>
<script>location.href="/tournament?id=${encodeURIComponent(id)}"</script>
</body>
</html>`;

        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    } catch {
      // fall through to static assets
    }
  }

  return context.env.ASSETS.fetch(context.request);
}
