export async function onRequestGet(context: any) {
  const db = context.env.DB;

  try {
    const result = await db.prepare(
      'SELECT id, name, data, created_at, updated_at FROM tournaments ORDER BY created_at DESC'
    ).all();

    const tournaments = result.results.map((row: any) => JSON.parse(row.data));

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

    await db.prepare(
      'INSERT OR REPLACE INTO tournaments (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      tournament.id,
      tournament.name,
      JSON.stringify(tournament),
      tournament.createdAt,
      tournament.updatedAt
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to save tournament' }), {
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
