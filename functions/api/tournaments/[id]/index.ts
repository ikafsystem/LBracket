export async function onRequestGet(context: any) {
  const db = context.env.DB;
  const id = context.params.id;

  try {
    const result = await db.prepare('SELECT data FROM tournaments WHERE id = ?').bind(id).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Tournament not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tournament = JSON.parse(result.data as string);
    delete tournament.adminToken;

    return new Response(JSON.stringify(tournament), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tournament' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context: any) {
  const db = context.env.DB;
  const id = context.params.id;

  try {
    const tournament = await context.request.json();
    const adminToken = context.request.headers.get('X-Admin-Token');

    const existing = await db.prepare('SELECT data FROM tournaments WHERE id = ?').bind(id).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Tournament not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingData = JSON.parse(existing.data as string);
    if (!adminToken || existingData.adminToken !== adminToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare(
      'INSERT OR REPLACE INTO tournaments (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      id,
      tournament.name,
      JSON.stringify(tournament),
      tournament.createdAt,
      tournament.updatedAt
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update tournament' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context: any) {
  const db = context.env.DB;
  const id = context.params.id;

  try {
    const adminToken = context.request.headers.get('X-Admin-Token');

    const existing = await db.prepare('SELECT data FROM tournaments WHERE id = ?').bind(id).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Tournament not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingData = JSON.parse(existing.data as string);
    if (!adminToken || existingData.adminToken !== adminToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare('DELETE FROM tournaments WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete tournament' }), {
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
