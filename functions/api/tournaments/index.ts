export async function onRequestGet(context: any) {
  const db = context.env.DB;

  try {
    const result = await db.prepare(
      'SELECT id, name, data, created_at, updated_at FROM tournaments ORDER BY created_at DESC'
    ).all();

    const tournaments = result.results.map((row: any) => {
      const t = JSON.parse(row.data);
      delete t.adminToken;
      return t;
    });

    return new Response(JSON.stringify(tournaments), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tournaments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: any) {
  const db = context.env.DB;

  try {
    const tournament = await context.request.json();
    const adminToken = context.request.headers.get('X-Admin-Token');

    const existing = await db.prepare('SELECT data FROM tournaments WHERE id = ?').bind(tournament.id).first();

    if (existing) {
      const existingData = JSON.parse(existing.data as string);
      if (!adminToken || existingData.adminToken !== adminToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Insert tournament data
    const dataStr = JSON.stringify(tournament);
    await db.prepare(
      'INSERT OR REPLACE INTO tournaments (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      tournament.id,
      tournament.name,
      dataStr,
      tournament.createdAt,
      tournament.updatedAt
    ).run();

    // Server-side max enforcement: delete oldest if over 3
    try {
      const all = await db.prepare('SELECT id, created_at FROM tournaments ORDER BY created_at DESC').all();
      if (all.results.length > 5) {
        const toDelete = all.results.slice(5);
        for (const row of toDelete) {
          await db.prepare('DELETE FROM tournaments WHERE id = ?').bind(row.id).run();
        }
      }
    } catch {
      // non-critical cleanup, ignore errors
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to save tournament', detail: error?.message || String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    },
  });
}
