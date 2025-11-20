import express from 'express';
import { query, getClient } from '../db.js';
import callN8nWebhook from '../services/n8n.js';
import config from '../config.js';
import { generateArticleFromPrompt, ensureContentHtmlValue } from '../services/articleGenerator.js';

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
  d.preview_image_data_url,
  d.preview_image_base64,
  d.preview_image_format,
  d.preview_image_alt,
  d.preview_image_visual_prompt,
  d.article_prompt_override,
  d.image_prompt_override,
  d.linkedin_copy,
  d.facebook_copy,
  d.created_at,
  d.updated_at,
  d.approved_at,
  d.approved_by,
  d.published_at,
  d.wordpress_post_id,
  d.wordpress_post_url,
  i.idea_title,
  i.categoria,
  i.status AS idea_status,
  k.cluster_name,
  k.project_name,
  k.keyword_principal,
  sp.scheduled_date,
  sp.scheduled_time,
  sp.scheduled_datetime,
  sp.status AS schedule_status,
  sp.scheduled_automatically
FROM drafts d
LEFT JOIN ideas i ON i.id = d.idea_id
LEFT JOIN keywords k ON k.id = d.keyword_cluster_id
LEFT JOIN scheduled_publications sp ON sp.draft_id = d.id AND sp.status = 'pending'
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
    } else if (qaStatus === 'all') {
      // No aplicar filtro QA, incluir todos los drafts
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
    previewImageDataUrl: row.preview_image_data_url,
    previewImageBase64: row.preview_image_base64,
    previewImageFormat: row.preview_image_format,
    previewImageAlt: row.preview_image_alt,
    previewImageVisualPrompt: row.preview_image_visual_prompt,
    articlePromptOverride: row.article_prompt_override,
    imagePromptOverride: row.image_prompt_override,
    linkedinCopy: row.linkedin_copy,
    facebookCopy: row.facebook_copy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    publishedAt: row.published_at,
    wordpressPostId: row.wordpress_post_id,
    wordpressPostUrl: row.wordpress_post_url,
    ideaTitle: row.idea_title,
    ideaStatus: row.idea_status,
    ideaCategory: row.categoria,
    clusterName: row.cluster_name,
    projectName: row.project_name,
    keywordPrincipal: row.keyword_principal,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    scheduledDatetime: row.scheduled_datetime,
    scheduleStatus: row.schedule_status,
    scheduledAutomatically: row.scheduled_automatically,
    previewImageDataUrl: row.preview_image_data_url,
    previewImageBase64: row.preview_image_base64,
    previewImageFormat: row.preview_image_format,
    previewImageAlt: row.preview_image_alt,
    previewImageVisualPrompt: row.preview_image_visual_prompt
  };
}

async function updateDraftPreviewFields(draftId, preview) {
  const payload = preview || {};
  await query(
    `UPDATE drafts
     SET
       preview_image_data_url = $2,
       preview_image_base64 = $3,
       preview_image_format = $4,
       preview_image_alt = $5,
       preview_image_visual_prompt = $6,
       updated_at = NOW()
     WHERE id = $1`,
    [
      draftId,
      payload.imageDataUrl || null,
      payload.base64 || null,
      payload.format || null,
      payload.altText || null,
      payload.visualPrompt || null
    ]
  );
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

router.put('/:id', async (req, res) => {
  try {
    const fields = req.body || {};
    const assignments = [];
    const params = [];

    const map = [
      ['title', 'title'],
      ['metaTitle', 'meta_title'],
      ['metaDescription', 'meta_description'],
      ['contentMarkdown', 'content_markdown'],
      ['contentHtml', 'content_html'],
      ['featuredImageUrl', 'featured_image_url'],
      ['featuredImageAlt', 'featured_image_alt'],
      ['featuredImagePrompt', 'featured_image_prompt'],
      ['articlePromptOverride', 'article_prompt_override'],
      ['imagePromptOverride', 'image_prompt_override'],
      ['linkedinCopy', 'linkedin_copy'],
      ['facebookCopy', 'facebook_copy'],
      ['status', 'status'],
      ['rejectionReason', 'rejection_reason']
    ];

    for (const [inputKey, column] of map) {
      if (Object.prototype.hasOwnProperty.call(fields, inputKey)) {
        assignments.push(`${column} = $${params.length + 1}`);
        params.push(fields[inputKey]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'tags')) {
      assignments.push(`tags = $${params.length + 1}::text[]`);
      params.push(Array.isArray(fields.tags) ? fields.tags : []);
    }

    if (!assignments.length) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
    }

    assignments.push('updated_at = NOW()');
    params.push(req.params.id);

    const sql = `
      UPDATE drafts
      SET ${assignments.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const result = await query(sql, params);
    if (!result.rowCount) {
      return res.status(404).json({ message: 'Draft no encontrado' });
    }

    const draftRow = result.rows[0];
    const joined = await query(`${baseSelect} WHERE d.id = $1`, [draftRow.id]);
    const draft = joined.rowCount ? mapDraftRow(joined.rows[0]) : mapDraftRow(draftRow);

    res.json({ message: 'Draft actualizado', draft });
  } catch (error) {
    console.error('[api] failed to update draft', error);
    res.status(500).json({ message: 'Error al actualizar el draft', details: error.message });
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
  const previewImage = req.body?.previewImage || null;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Si hay imagen de preview, subirla a WordPress primero
    if (previewImage?.base64) {
      try {
        const workflowResponse = await callN8nWebhook('seo/imagenes/generar', {
          draft_id: req.params.id,
          limit: 1,
          force: true,
          upload_to_wordpress: true,
          preview_image_base64: previewImage.base64,
          preview_image_format: previewImage.format || 'png',
          preview_alt_text: previewImage.altText || null,
          preview_visual_prompt: previewImage.visualPrompt || null,

          wordpress_endpoint: config.wordpress.mediaEndpoint,
          wordpress_auth_header: config.wordpress.authHeader,
          wordpress_nonce: config.wordpress.nonce
        });

        // El workflow ya actualiza la BD con la URL de WordPress
        console.log('[api] imagen subida a WordPress durante aprobación', workflowResponse);

        await updateDraftPreviewFields(req.params.id, null);
      } catch (imageError) {
        console.error('[api] error al subir imagen durante aprobación', imageError);
        // Continuar con la aprobación aunque falle la imagen
      }
    }

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
      payload: { notes, hadPreviewImage: Boolean(previewImage) }
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

router.post('/:id/image', async (req, res) => {
  const { id } = req.params;
  try {
    const customPrompt =
      req.body?.preview_visual_prompt ||
      req.body?.visualPrompt ||
      req.body?.visual_prompt ||
      req.body?.imagePrompt ||
      null;

    if (customPrompt) {
      await query(
        `UPDATE drafts
         SET image_prompt_override = $2,
             updated_at = NOW()
         WHERE id = $1::uuid`,
        [id, customPrompt.trim()]
      );
    }

    // Llamar al workflow con upload_to_wordpress=false para generar solo preview
    const workflowResponse = await callN8nWebhook('seo/imagenes/generar', {
      draft_id: id,
      limit: 1,
      force: true,
      upload_to_wordpress: false,
      preview_visual_prompt: customPrompt || undefined
    });

    console.log('WORKFLOW RESPONSE:', JSON.stringify(workflowResponse, null, 2));

    // Extraer los datos del primer draft procesado
    const firstDraft = workflowResponse.drafts?.[0];
    console.log('FIRST DRAFT:', JSON.stringify(firstDraft, null, 2));
    if (!firstDraft) {
      return res.status(500).json({ 
        message: 'El workflow no devolvió datos de imagen',
        workflowResponse 
      });
    }

    const previewPayload = {
      imageDataUrl: firstDraft.preview_image_data_url || null,
      base64: firstDraft.preview_image_base64 || null,
      format: firstDraft.image_format || null,
      altText: firstDraft.alt_text || null,
      visualPrompt: firstDraft.visual_prompt || null
    };

    await updateDraftPreviewFields(id, previewPayload);

    // Consultar el draft actualizado de la BD (puede no tener cambios si es preview)
    const refreshed = await query(
      `SELECT 
         id,
         featured_image_url,
         featured_image_alt,
         featured_image_prompt,
         preview_image_data_url,
         preview_image_base64,
         preview_image_format,
         preview_image_alt,
         preview_image_visual_prompt,
         image_prompt_override,
         article_prompt_override
       FROM drafts
       WHERE id = $1`,
      [id]
    );

    // Devolver TANTO los datos de la BD COMO los de preview
    res.json({
      message: 'Preview de imagen generada',
      draft: refreshed.rowCount ? refreshed.rows[0] : null,
      preview: {
        imageDataUrl: firstDraft.preview_image_data_url || null,
        base64: firstDraft.preview_image_base64 || null,
        format: firstDraft.image_format || null,
        altText: firstDraft.alt_text || null,
        visualPrompt: firstDraft.visual_prompt || null
      }
    });
  } catch (error) {
    console.error('[api] failed to generate image', error);
    res.status(500).json({ message: 'Error al generar la imagen', details: error.message });
  }
});

router.post('/:id/regenerate', async (req, res) => {
  const { id } = req.params;
  const prompt = (req.body?.prompt || '').toString().trim();

  if (!prompt) {
    return res.status(400).json({ message: 'Debes enviar el prompt para regenerar el articulo.' });
  }

  try {
    const draftResult = await query('SELECT id, title FROM drafts WHERE id = $1', [id]);
    if (!draftResult.rowCount) {
      return res.status(404).json({ message: 'Draft no encontrado' });
    }

    const generation = await generateArticleFromPrompt({ prompt });

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        `UPDATE drafts
         SET
           title = $2,
           meta_title = $3,
           meta_description = $4,
           tags = $5::text[],
           content_markdown = $6,
           content_html = $7,
           word_count = $8,
           preview_image_data_url = NULL,
           preview_image_base64 = NULL,
           preview_image_format = NULL,
           preview_image_alt = NULL,
           preview_image_visual_prompt = NULL,
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          generation.title || draftResult.rows[0].title,
          generation.metaTitle || generation.title || draftResult.rows[0].title,
          generation.metaDescription || null,
          Array.isArray(generation.tags) ? generation.tags : [],
          generation.contentMarkdown,
          generation.contentHtml,
          generation.wordCount || 0
        ]
      );

      const updatedDraftRow = updated.rows[0];

      await registerJobLog(client, {
        draft: updatedDraftRow,
        reviewer: 'system',
        action: 'manual_regenerate',
        payload: {
          prompt_length: prompt.length,
          llm_tokens_used: generation.llmTokensUsed || null
        }
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const refreshed = await query(`${baseSelect} WHERE d.id = $1`, [id]);
    res.json({
      message: 'Draft regenerado con el prompt proporcionado.',
      draft: refreshed.rowCount ? mapDraftRow(refreshed.rows[0]) : null,
      metadata: {
        wordCount: generation.wordCount || 0,
        llmTokensUsed: generation.llmTokensUsed || null
      }
    });
  } catch (error) {
    console.error('[api] failed to regenerate draft manually', error);
    res.status(500).json({ message: 'Error al regenerar el draft', details: error.message });
  }
});

// Programar publicación
router.post('/:id/schedule', async (req, res) => {
  const { id } = req.params;
  const { scheduled_date, scheduled_time, created_by } = req.body;

  try {
    if (!scheduled_date) {
      return res.status(400).json({ message: 'scheduled_date es requerido' });
    }

    // Validar que la fecha sea futura
  const scheduledDateTime = new Date(`${scheduled_date}T${scheduled_time || '12:00:00'}`);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({ message: 'La fecha debe ser futura' });
    }

    const draftCheck = await query('SELECT id, content_html, content_markdown FROM drafts WHERE id = $1', [id]);
    if (!draftCheck.rowCount) {
      return res.status(404).json({ message: 'Draft no encontrado' });
    }
    const draftRow = draftCheck.rows[0];
    const ensuredHtml = ensureContentHtmlValue({
      contentHtml: draftRow.content_html,
      contentMarkdown: draftRow.content_markdown
    });
    if (!ensuredHtml) {
      return res.status(400).json({
        message: 'El draft no tiene contenido HTML. Genera o edita el artículo antes de programarlo.'
      });
    }
    if (!draftRow.content_html) {
      await query(
        `UPDATE drafts SET content_html = $2, updated_at = NOW() WHERE id = $1`,
        [id, ensuredHtml]
      );
    }

    // Verificar si ya tiene una programación
    const existingSchedule = await query(
      'SELECT id FROM scheduled_publications WHERE draft_id = $1 AND status = $2',
      [id, 'pending']
    );

    let scheduleRow;
    let message = 'Publicación programada exitosamente';

    if (existingSchedule.rowCount > 0) {
      const scheduleId = existingSchedule.rows[0].id;
      const updateResult = await query(
        `UPDATE scheduled_publications
         SET
           scheduled_date = $2,
           scheduled_time = $3,
           status = 'pending',
           scheduled_automatically = false,
           cancelled_at = NULL,
           cancelled_by = NULL,
           cancellation_reason = NULL,
           published_at = NULL,
           wordpress_post_id = NULL,
           wordpress_post_url = NULL,
           wordpress_status = NULL,
           attempts = 0,
           last_error = NULL,
           last_attempt_at = NULL
         WHERE id = $1
         RETURNING id, draft_id, scheduled_date, scheduled_time, scheduled_datetime, status, scheduled_automatically, created_at, updated_at`,
        [scheduleId, scheduled_date, scheduled_time || '12:00:00']
      );
      scheduleRow = updateResult.rows[0];
      message = 'Publicación reprogramada exitosamente';
    } else {
      const insertResult = await query(
        `INSERT INTO scheduled_publications (draft_id, scheduled_date, scheduled_time, created_by, status, scheduled_automatically)
         VALUES ($1, $2, $3, $4, 'pending', false)
         RETURNING id, draft_id, scheduled_date, scheduled_time, scheduled_datetime, status, scheduled_automatically, created_at`,
        [id, scheduled_date, scheduled_time || '12:00:00', created_by || 'system']
      );
      scheduleRow = insertResult.rows[0];
    }

    res.json({
      message,
      schedule: scheduleRow
    });
  } catch (error) {
    console.error('[api] failed to schedule publication', error);
    res.status(500).json({ message: 'Error al programar la publicación', details: error.message });
  }
});

// Publicar inmediatamente
router.post('/:id/publish-now', async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el draft existe y está aprobado
    const draftCheck = await query(
      'SELECT id, status, title FROM drafts WHERE id = $1',
      [id]
    );

    if (!draftCheck.rowCount) {
      return res.status(404).json({ message: 'Draft no encontrado' });
    }

    if (draftCheck.rows[0].status !== 'approved') {
      return res.status(400).json({ message: 'El draft debe estar aprobado para publicar' });
    }

    // Llamar al workflow 14
    const wpResponse = await callN8nWebhook('seo/publicar', {
      draft_id: id,
      wordpress_endpoint: config.wordpress.mediaEndpoint?.replace('/media', ''),
      wordpress_auth_header: config.wordpress.authHeader,
      wordpress_nonce: config.wordpress.nonce
    });

    if (wpResponse.status === 'success') {
      // Tras publicar en WP, generar/guardar copys sociales (LinkedIn/Facebook)
      try {
        const socialResponse = await callN8nWebhook('seo/social/copy/db', {
          draft_id: id,
          limit: 1,
          platforms: ['linkedin', 'facebook']
        });
        if (socialResponse?.status === 'success') {
          console.log('[api] Copys sociales generadas para publicación inmediata');
        } else if (socialResponse?.status === 'empty') {
          console.log('[api] Copys sociales ya existentes para publicación inmediata');
        } else {
          console.warn('[api] Resultado inesperado al generar copys sociales (publish-now):', socialResponse);
        }
      } catch (socialError) {
        console.error('[api] failed to generate social copies (publish-now)', socialError);
      }
      res.json({
        message: 'Artículo publicado exitosamente',
        wordpress_post_id: wpResponse.wordpress_post_id,
        wordpress_post_url: wpResponse.wordpress_post_url,
        published_at: wpResponse.published_at
      });
    } else {
      res.status(500).json({
        message: 'Error al publicar en WordPress',
        details: wpResponse.message || 'Error desconocido'
      });
    }
  } catch (error) {
    console.error('[api] failed to publish now', error);
    res.status(500).json({ message: 'Error al publicar', details: error.message });
  }
});

// Obtener publicaciones programadas
router.get('/scheduled', async (req, res) => {
  const { status, date_from, date_to, limit } = req.query;

  try {
    let whereClause = '1=1';
    const params = [];

    if (status) {
      params.push(status);
      whereClause += ` AND sp.status = $${params.length}`;
    }

    if (date_from) {
      params.push(date_from);
      whereClause += ` AND sp.scheduled_date >= $${params.length}`;
    }

    if (date_to) {
      params.push(date_to);
      whereClause += ` AND sp.scheduled_date <= $${params.length}`;
    }

    const limitValue = Math.min(parseInt(limit) || 50, 100);

    const result = await query(
      `SELECT 
        sp.id,
        sp.draft_id,
        sp.scheduled_date,
        sp.scheduled_time,
        sp.scheduled_datetime,
        sp.status,
        sp.wordpress_post_id,
        sp.wordpress_post_url,
        sp.published_at,
        sp.attempts,
        sp.last_error,
        sp.created_at,
        d.title,
        d.meta_title,
        d.featured_image_url,
        d.status as draft_status,
        k.project_name,
        k.cluster_name
      FROM scheduled_publications sp
      JOIN drafts d ON d.id = sp.draft_id
      LEFT JOIN keywords k ON k.id = d.keyword_cluster_id
      WHERE ${whereClause}
      ORDER BY sp.scheduled_datetime ASC
      LIMIT ${limitValue}`,
      params
    );

    res.json({
      total: result.rowCount,
      scheduled: result.rows
    });
  } catch (error) {
    console.error('[api] failed to get scheduled publications', error);
    res.status(500).json({ message: 'Error al obtener publicaciones programadas', details: error.message });
  }
});

// Cancelar publicación programada
router.delete('/schedule/:schedule_id', async (req, res) => {
  const { schedule_id } = req.params;
  const { reason, cancelled_by } = req.body;

  try {
    const result = await query(
      `UPDATE scheduled_publications
       SET status = 'cancelled',
           cancelled_at = NOW(),
           cancelled_by = $2,
           cancellation_reason = $3,
           updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id, draft_id, status`,
      [schedule_id, cancelled_by || 'system', reason || 'Cancelado por el usuario']
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Programación no encontrada o ya fue procesada' });
    }

    res.json({
      message: 'Publicación cancelada',
      schedule: result.rows[0]
    });
  } catch (error) {
    console.error('[api] failed to cancel schedule', error);
    res.status(500).json({ message: 'Error al cancelar la programación', details: error.message });
  }
});

// Endpoint para disparar la programación automática
router.post('/auto-schedule', async (req, res) => {
  try {
    const { autoScheduleApprovedDrafts } = await import('../services/scheduler.js');
    const forceManualReset = req.body?.forceManualReset === true;
    await autoScheduleApprovedDrafts({ forceManualReset });
    res.json({ message: 'Artículos programados automáticamente según configuración' });
  } catch (error) {
    console.error('[api] failed to auto-schedule', error);
    res.status(500).json({ message: 'Error al programar automáticamente', details: error.message });
  }
});

router.get('/has-manual-schedules', async (_req, res) => {
  try {
    const result = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM scheduled_publications
        WHERE status = 'pending'
          AND scheduled_automatically = false
      ) AS has_manual
    `);

    res.json({ hasManualSchedules: result.rows[0]?.has_manual || false });
  } catch (error) {
    console.error('[api] failed to check manual schedules', error);
    res.status(500).json({ message: 'Error al verificar programaciones manuales', details: error.message });
  }
});

// Eliminar un draft por id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM drafts WHERE id = $1::uuid RETURNING id', [id]);
    if (!result.rowCount) {
      return res.status(404).json({ message: 'Draft no encontrado' });
    }
    res.json({ message: 'Draft eliminado', id: result.rows[0].id });
  } catch (error) {
    console.error('[api] failed to delete draft', error);
    res.status(500).json({ message: 'Error al eliminar el draft', details: error.message });
  }
});

export default router;
