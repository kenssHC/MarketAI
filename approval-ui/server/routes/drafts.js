import express from 'express';
import { query, getClient } from '../db.js';

const router = express.Router();

const baseSelect = `
SELECT
  d.id,
  d.idea_id,
  d.keyword_cluster_id,
  d.title,
  d.meta_title,
  d.meta_description,
  d.tags,
  d.content_markdown,
  d.content_html,
  d.word_count,
  d.qa_passed,
  d.qa_report,
  d.qa_checked_at,
  d.status,
  d.rejection_reason,
  d.featured_image_url,
  d.featured_image_alt,
  d.featured_image_prompt,
  d.linkedin_copy,
  d.facebook_copy,
  d.created_at,
  d.updated_at,
  d.approved_at,
  d.approved_by,
  i.idea_title,
  i.categoria,
  i.status AS idea_status,
  k.cluster_name,
  k.project_name,
  k.keyword_principal
FROM drafts d
LEFT JOIN ideas i ON i.id = d.idea_id
LEFT JOIN keywords k ON k.id = d.keyword_cluster_id
`;

function buildFilters({ status, qaStatus, search, project }) {
  const clauses = [];
  const params = [];

  if (status) {
    const statuses = Array.isArray(status) ? status : String(status).split(',');
    clauses.push(`d.status = ANY($${params.length + 1})`);
    params.push(statuses);
  } else {
    clauses.push(`d.status = ANY($${params.length + 1})`);
    params.push(['draft', 'review']);
  }

  if (qaStatus) {
    if (qaStatus === 'passed') {
      clauses.push('COALESCE(d.qa_passed, false) = true');
    } else if (qaStatus === 'pending') {
      clauses.push('(d.qa_passed IS NULL OR d.qa_passed = false)');
    }
  } else {
    clauses.push('COALESCE(d.qa_passed, false) = true');
  }

  if (project) {
    clauses.push(`k.project_name = $${params.length + 1}`);
    params.push(project);
  }

  if (search) {
    const likeParam = `%${search}%`;
    clauses.push(`(
      d.title ILIKE $${params.length + 1}
      OR d.meta_title ILIKE $${params.length + 2}
      OR i.idea_title ILIKE $${params.length + 3}
      OR k.cluster_name ILIKE $${params.length + 4}
      OR k.keyword_principal ILIKE $${params.length + 5}
    )`);
    params.push(likeParam, likeParam, likeParam, likeParam, likeParam);
  }

  return { clauses, params };
}

function mapDraftRow(row) {
  return {
    id: row.id,
    ideaId: row.idea_id,
    keywordClusterId: row.keyword_cluster_id,
    title: row.title,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    tags: row.tags || [],
    contentMarkdown: row.content_markdown,
    contentHtml: row.content_html,
    wordCount: row.word_count,
    qaPassed: row.qa_passed,
    qaReport: row.qa_report,
    qaCheckedAt: row.qa_checked_at,
    status: row.status,
    rejectionReason: row.rejection_reason,
    featuredImageUrl: row.featured_image_url,
    featuredImageAlt: row.featured_image_alt,
    featuredImagePrompt: row.featured_image_prompt,
    linkedinCopy: row.linkedin_copy,
    facebookCopy: row.facebook_copy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    ideaTitle: row.idea_title,
    ideaStatus: row.idea_status,
    ideaCategory: row.categoria,
    clusterName: row.cluster_name,
    projectName: row.project_name,
    keywordPrincipal: row.keyword_principal
  };
}

router.get('/', async (req, res) => {
  try {
    const { clauses, params } = buildFilters(req.query);
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Number(req.query.limit) || 25;
    const sql = `${baseSelect} ${where} ORDER BY d.updated_at DESC NULLS LAST, d.created_at DESC LIMIT $${params.length + 1}`;
    const result = await query(sql, [...params, limit]);
    const drafts = result.rows.map((row) => mapDraftRow({
      ...row,
      qa_report: row.qa_report ? row.qa_report : null
    }));
    res.json({ drafts, total: drafts.length });
  } catch (error) {
    console.error('[api] failed to load drafts', error);
    res.status(500).json({ message: 'Error al obtener los drafts', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(`${baseSelect} WHERE d.id = $1`, [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ message: 'Draft no encontrado' });
    }
    const draft = mapDraftRow(result.rows[0]);
    res.json(draft);
  } catch (error) {
    console.error('[api] failed to load draft', error);
    res.status(500).json({ message: 'Error al obtener el draft', details: error.message });
  }
});

async function registerJobLog(client, { draft, reviewer, action, payload, status = 'success' }) {
  const now = new Date();
  const inputData = {
    reviewer,
    action,
    payload
  };
  const outputData = {
    draft_status: draft.status,
    rejection_reason: draft.rejection_reason,
    approved_at: draft.approved_at,
    approved_by: draft.approved_by
  };

  const fields = [
    'Editorial Review',
    action === 'approve' ? 'review_approval' : 'review_feedback',
    status,
    draft.keyword_cluster_id,
    draft.idea_id,
    draft.id,
    now.toISOString(),
    now.toISOString(),
    0,
    inputData,
    outputData
  ];

  await client.query(
    `INSERT INTO jobs_log (
      job_name,
      job_type,
      status,
      related_keyword_id,
      related_idea_id,
      related_draft_id,
      started_at,
      completed_at,
      duration_ms,
      input_data,
      output_data
    ) VALUES (
      $1, $2, $3, $4::uuid, $5::uuid, $6::uuid, $7::timestamp, $8::timestamp, $9, $10::jsonb, $11::jsonb
    )`,
    fields
  );
}

router.post('/:id/approve', async (req, res) => {
  const reviewer = req.body?.reviewer || 'editor';
  const notes = req.body?.notes || null;

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const updateResult = await client.query(
      `UPDATE drafts
        SET status = 'approved',
            approved_at = NOW(),
            approved_by = $2,
            rejection_reason = NULL,
            updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING *`,
      [req.params.id, reviewer]
    );

    if (!updateResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Draft no encontrado' });
    }

    const draftRow = updateResult.rows[0];
    await registerJobLog(client, {
      draft: draftRow,
      reviewer,
      action: 'approve',
      payload: { notes }
    });

    await client.query('COMMIT');
    res.json({ message: 'Draft aprobado correctamente', draftId: draftRow.id, approvedAt: draftRow.approved_at });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[api] failed to approve draft', error);
    res.status(500).json({ message: 'Error al aprobar el draft', details: error.message });
  } finally {
    client.release();
  }
});

router.post('/:id/return', async (req, res) => {
  const reviewer = req.body?.reviewer || 'editor';
  const reason = req.body?.reason || 'Sin motivo especificado';
  const setStatus = req.body?.status || 'review';

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const updateResult = await client.query(
      `UPDATE drafts
        SET status = $2,
            rejection_reason = $3,
            approved_at = NULL,
            approved_by = NULL,
            updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING *`,
      [req.params.id, setStatus, reason]
    );

    if (!updateResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Draft no encontrado' });
    }

    const draftRow = updateResult.rows[0];
    await registerJobLog(client, {
      draft: draftRow,
      reviewer,
      action: 'return',
      payload: { reason }
    });

    await client.query('COMMIT');
    res.json({ message: 'Cambios solicitados al draft', draftId: draftRow.id, status: draftRow.status });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[api] failed to return draft', error);
    res.status(500).json({ message: 'Error al devolver el draft', details: error.message });
  } finally {
    client.release();
  }
});

export default router;
