import 'dotenv/config';
import { query } from '../db.js';
import { markdownToHtml } from '../services/articleGenerator.js';

async function backfill(limit = 200) {
  const { rows } = await query(
    `SELECT id, content_markdown
     FROM drafts
     WHERE (content_html IS NULL OR content_html = '')
       AND content_markdown IS NOT NULL
     LIMIT $1`,
    [limit]
  );

  if (!rows.length) {
    console.log('[backfill] No hay drafts pendientes');
    return;
  }

  console.log(`[backfill] Procesando ${rows.length} drafts...`);
  for (const row of rows) {
    const markdown = (row.content_markdown || '').trim();
    if (!markdown) continue;
    const html = markdownToHtml(markdown);
    if (!html) continue;
    await query(
      `UPDATE drafts
       SET content_html = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, html]
    );
    console.log(`[backfill] Draft ${row.id} actualizado`);
  }
}

backfill(process.argv[2] ? Number(process.argv[2]) : 200)
  .then(() => {
    console.log('[backfill] Completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[backfill] Error', error);
    process.exit(1);
  });

