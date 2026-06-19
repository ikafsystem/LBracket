export async function onRequestGet(context: any) {
  const db = context.env.DB;
  const id = context.params.id;

  try {
    const result = await db.prepare('SELECT data FROM tournaments WHERE id = ?').bind(id).first();
    if (!result) {
      return new Response(null, { status: 302, headers: { Location: '/logo.png' } });
    }

    const tournament = JSON.parse(result.data as string);
    if (tournament.logo) {
      const matches = tournament.logo.match(/^data:(.+?);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const base64 = matches[2];
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return new Response(bytes, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' },
        });
      }
    }
  } catch {
    // fall through to redirect
  }

  return new Response(null, { status: 302, headers: { Location: '/logo.png' } });
}
