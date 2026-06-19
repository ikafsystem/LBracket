function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function onRequestGet(context: any) {
  const id = context.params.id;

  try {
    const db = context.env.DB;
    const result = await db.prepare('SELECT data FROM tournaments WHERE id = ?').bind(id).first();

    if (result) {
      const tournament = JSON.parse(result.data as string);
      const name = escapeHtml(tournament.name || 'Tournament');
      const origin = new URL(context.request.url).origin;
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
<meta http-equiv="refresh" content="0;url=/tournament/?id=${id}"/>
</head>
<body>
<script>location.href="/tournament/?id=${id}"</script>
</body>
</html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  } catch {
    // fall through
  }

  const fallback = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta http-equiv="refresh" content="0;url=/"/>
</head>
<body>
<script>location.href="/"</script>
</body>
</html>`;
  return new Response(fallback, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
