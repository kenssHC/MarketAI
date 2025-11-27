import express from 'express';
import multer from 'multer';
import { parse as parseCsv } from 'csv-parse/sync';
import { getClient, query } from '../db.js';
import callN8nWebhook from '../services/n8n.js';
import config from '../config.js';

const router = express.Router();

// Helper para mapear drafts a camelCase (consistente con drafts.js)
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
    articlePromptOverride: row.article_prompt_override,
    imagePromptOverride: row.image_prompt_override,
    linkedinCopy: row.linkedin_copy,
    facebookCopy: row.facebook_copy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

function normalizeKeywords(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((value) => {
        if (!value) return null;
        if (typeof value === 'string') {
          return value.trim();
        }
        if (typeof value === 'object' && value.keyword) {
          return String(value.keyword).trim();
        }
        return String(value).trim();
      })
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    const value = input.trim();
    if (!value) return [];
    if (value.includes('\n')) {
      return value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (value.includes(',')) {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [value];
  }
  return [];
}

async function insertKeywords(items, { clusterName, projectName, intent }) {
  if (!items.length) return [];

  const client = await getClient();
  const inserted = [];

  try {
    await client.query('BEGIN');
    for (const keyword of items) {
      const result = await client.query(
        `
          INSERT INTO keywords (
            cluster_name,
            keyword_principal,
            keywords_secundarias,
            source,
            search_volume,
            competition,
            search_intent,
            status,
            project_name
          )
          VALUES (
            $1,
            $2,
            '[]'::jsonb,
            'manual_ui',
            0,
            'Unknown',
            $3,
            'pending',
            $4
          )
          ON CONFLICT (keyword_principal) DO UPDATE SET
            cluster_name = EXCLUDED.cluster_name,
            search_intent = EXCLUDED.search_intent,
            project_name = COALESCE(EXCLUDED.project_name, keywords.project_name),
            status = 'pending',
            updated_at = CURRENT_TIMESTAMP
          RETURNING id, keyword_principal, cluster_name, project_name, status, created_at
        `,
        [clusterName || 'Manual Import', keyword, intent || 'informacional', projectName || null]
      );

      inserted.push(result.rows[0]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return inserted;
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const status = req.query.status;
    const project = req.query.project;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push(`k.status = $${params.length + 1}`);
      params.push(status);
    }
    if (project) {
      conditions.push(`k.project_name = $${params.length + 1}`);
      params.push(project);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        k.id,
        k.keyword_principal,
        k.cluster_name,
        k.project_name,
        k.status,
        k.source,
        k.search_intent,
        k.search_volume,
        k.created_at,
        (SELECT COUNT(*) FROM ideas i WHERE i.keyword_cluster_id = k.id) AS ideas_total,
        (SELECT COUNT(*) FROM drafts d WHERE d.keyword_cluster_id = k.id) AS drafts_total
      FROM keywords k
      ${where}
      ORDER BY k.created_at DESC
      LIMIT $${params.length + 1}
    `;

    const result = await query(sql, [...params, limit]);

    res.json({
      keywords: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('[api] failed to fetch keywords', error);
    res.status(500).json({ message: 'Error al obtener las keywords', details: error.message });
  }
});

router.post('/manual', async (req, res) => {
  try {
    const keywordsInput = req.body?.keywords ?? req.body?.keyword;
    const keywords = normalizeKeywords(keywordsInput);
    if (!keywords.length) {
      return res.status(400).json({ message: 'Debes enviar al menos una keyword' });
    }

    const clusterName = req.body?.clusterName || req.body?.cluster_name || 'Manual Import';
    const projectName = req.body?.projectName || req.body?.project_name || null;
    const intent = req.body?.searchIntent || req.body?.search_intent || 'informacional';

    const inserted = await insertKeywords(keywords, { clusterName, projectName, intent });
    res.json({ inserted, total: inserted.length });
  } catch (error) {
    console.error('[api] failed to insert keywords', error);
    res.status(500).json({ message: 'Error al guardar las keywords', details: error.message });
  }
});


router.post('/cluster-pending', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.body?.limit) || 100, 25), 500);

    const pendingResult = await query(
      `
        SELECT 
          COALESCE(project_name, '__default__') AS project_name,
          COUNT(*) AS pending_count
        FROM keywords
        WHERE status = 'pending'
        GROUP BY COALESCE(project_name, '__default__')
        ORDER BY pending_count DESC
      `
    );

    if (!pendingResult.rowCount) {
      return res.json({
        message: 'No hay keywords pendientes por clusterear.',
        processedProjects: 0,
        successes: 0,
        failures: 0,
        limit,
        details: []
      });
    }

    const summary = [];
    for (const row of pendingResult.rows) {
      const projectName = row.project_name === '__default__' ? null : row.project_name;
      try {
        const response = await callN8nWebhook('seo/clustering', {
          project_name: projectName || undefined,
          limit
        });
        summary.push({
          projectName: projectName || null,
          status: 'success',
          pendingCount: Number(row.pending_count),
          response
        });
      } catch (error) {
        summary.push({
          projectName: projectName || null,
          status: 'error',
          pendingCount: Number(row.pending_count),
          error: error.message
        });
      }
    }

    const successes = summary.filter((item) => item.status === 'success').length;
    const failures = summary.length - successes;

    res.json({
      message:
        failures > 0
          ? 'El clustering se ejecutó con advertencias. Revisa los proyectos con error.'
          : 'Clustering ejecutado correctamente.',
      processedProjects: summary.length,
      successes,
      failures,
      limit,
      details: summary
    });
  } catch (error) {
    console.error('[api] failed to cluster pending keywords', error);
    res.status(500).json({
      message: 'Error al ejecutar el clustering global',
      details: error.message
    });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Debes adjuntar un archivo CSV' });
    }

    const csvString = req.file.buffer.toString('utf-8');

    const rawRows = parseCsv(csvString, {
      skip_empty_lines: true,
      trim: true,
      delimiter: [',', ';', '\t']
    });

    if (!rawRows.length) {
      return res.status(400).json({ message: 'El archivo CSV no contiene datos' });
    }

    const headerIndex = rawRows.findIndex((row) =>
      row.some((cell) => String(cell).toLowerCase().includes('keyword'))
    );

    const effectiveHeaderIndex = headerIndex >= 0 ? headerIndex : 0;
    const headerRow = rawRows[effectiveHeaderIndex].map((cell) => String(cell).trim());
    const dataRows = rawRows.slice(effectiveHeaderIndex + 1);

    const rows = dataRows.map((row) => {
      const record = {};
      row.forEach((value, index) => {
        const key = headerRow[index] || `column_${index}`;
        record[key] = value;
      });
      return record;
    });

    const sanitizeKeyword = (input) => {
      if (!input) return '';
      return String(input)
        .replace(/\s+/g, ' ')
        .split(/[,;|\t]/)[0]
        .trim();
    };

    const clusterName = req.body?.clusterName || req.body?.cluster_name || 'CSV Import';
    const projectName = req.body?.projectName || req.body?.project_name || null;
    const intent = req.body?.searchIntent || req.body?.search_intent || 'informacional';

    const keywordColumns = headerRow.filter((name) => name.toLowerCase().includes('keyword'));

    const keywords = rows
      .map((row) => {
        for (const column of keywordColumns) {
          const value = row[column];
          if (value) {
            const keyword = sanitizeKeyword(value);
            if (keyword) {
              return keyword;
            }
          }
        }
        const firstValue = Object.values(row).find((value) => value);
        const keyword = firstValue ? sanitizeKeyword(firstValue) : null;
        return keyword || null;
      })
      .filter(Boolean);

    const inserted = await insertKeywords(keywords, { clusterName, projectName, intent });

    res.json({
      inserted,
      total: inserted.length
    });
  } catch (error) {
    console.error('[api] failed to process CSV upload', error);
    res.status(500).json({ message: 'Error al procesar el archivo', details: error.message });
  }
});

router.post('/:keywordId/generate', async (req, res) => {
  const { keywordId } = req.params;
  const projectOverride = req.body?.projectName || req.body?.project_name || null;
  const generateImage = req.body?.generateImage || false;
  const articlePromptOverride = req.body?.articlePromptOverride || req.body?.article_prompt_override || null;

  try {
    const keywordResult = await query(
      'SELECT id, keyword_principal, cluster_name, project_name, status FROM keywords WHERE id = $1',
      [keywordId]
    );
    if (!keywordResult.rowCount) {
      return res.status(404).json({ message: 'Keyword no encontrada' });
    }
    const keyword = keywordResult.rows[0];
    const projectName = projectOverride || keyword.project_name || null;

    let clusterId = keyword.id;
    let clusterKeywordValue = keyword.keyword_principal;

    const clusterResponse = await callN8nWebhook('seo/clustering', {
        project_name: projectName,
        limit: 100
      });

    const clusterDetails = Array.isArray(clusterResponse?.clusters_details)
      ? clusterResponse.clusters_details
      : [];

    const matchingCluster = clusterDetails.find((detail) => {
      const principal = (detail.keyword_principal || '').toLowerCase();
      const secundarias = Array.isArray(detail.keywords_secundarias)
        ? detail.keywords_secundarias.map((value) => String(value).toLowerCase())
        : [];
      const original = (keyword.keyword_principal || '').toLowerCase();
      return principal === original || secundarias.includes(original);
    });

    if (matchingCluster?.id) {
      clusterId = matchingCluster.id;
    } else if (clusterDetails[0]?.id) {
      clusterId = clusterDetails[0].id;
    }

    if (matchingCluster?.keyword_principal) {
      clusterKeywordValue = matchingCluster.keyword_principal;
    }

    let refreshedKeyword = await query(
      'SELECT id, keyword_principal, cluster_name, project_name, status FROM keywords WHERE id = $1',
      [clusterId]
    );

    let keywordAfter = refreshedKeyword.rows[0];

    if (!keywordAfter || keywordAfter.status !== 'processed') {
      const fallback = await query(
        `SELECT id, keyword_principal, cluster_name, project_name, status
         FROM keywords
         WHERE keyword_principal = $1
         ORDER BY updated_at DESC
         LIMIT 1`,
        [clusterKeywordValue]
      );

      if (fallback.rowCount) {
        keywordAfter = fallback.rows[0];
        clusterId = keywordAfter.id;
      }
    }

    if (!keywordAfter || keywordAfter.status !== 'processed') {
      return res.status(400).json({ message: 'La keyword no pudo ser procesada por el clustering' });
    }

    // Verificar si ya existen ideas para este cluster
    const existingIdeas = await query(
      `SELECT id, idea_title, categoria, status, created_at
       FROM ideas
       WHERE keyword_cluster_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [clusterId]
    );

    // Solo llamar a ideas-generation si NO hay ideas
    if (!existingIdeas.rowCount) {
      await callN8nWebhook('seo/ideas-generation', {
        keyword_cluster_id: clusterId,
        limit: 1
      });
    }

    // Obtener las ideas (existentes o recién creadas)
    const ideasResult = existingIdeas.rowCount > 0 
      ? existingIdeas
      : await query(
          `SELECT id, idea_title, categoria, status, created_at
           FROM ideas
           WHERE keyword_cluster_id = $1
           ORDER BY created_at DESC
           LIMIT 20`,
          [clusterId]
        );

    if (!ideasResult.rowCount) {
      return res.status(400).json({ message: 'No se generaron ideas para esta keyword' });
    }

    // Buscar una idea que sea "No requiere investigación" Y que esté "pending"
    const idea =
      ideasResult.rows.find((row) => 
        row.categoria?.toLowerCase().includes('no requiere') && 
        row.status === 'pending'
      )
      || ideasResult.rows.find((row) => row.status === 'pending')
      || ideasResult.rows[0];

    // Verificar que la idea esté en estado pending
    if (!idea || idea.status !== 'pending') {
      return res.status(400).json({ 
        message: 'No hay ideas pendientes disponibles para generar un artículo. Todas las ideas ya fueron procesadas.',
        ideasAvailable: ideasResult.rowCount,
        ideasPending: ideasResult.rows.filter(r => r.status === 'pending').length
      });
    }

    await callN8nWebhook('seo/redaccion/simple', {
      idea_id: idea.id,
      limit: 1,
      article_prompt_override: articlePromptOverride || undefined
    });

    const draftResult = await query(
      `SELECT
        d.id,
        d.idea_id,
        d.keyword_cluster_id,
        d.title,
        d.meta_title,
        d.meta_description,
        d.tags,
        d.content_markdown,
        d.word_count,
        d.qa_passed,
        d.qa_report,
        d.created_at,
        d.updated_at,
        d.preview_image_data_url,
        d.preview_image_base64,
        d.preview_image_format,
        d.preview_image_alt,
        d.preview_image_visual_prompt,
        d.article_prompt_override,
        d.image_prompt_override
      FROM drafts d
      WHERE d.idea_id = $1
      ORDER BY d.created_at DESC
      LIMIT 1`,
      [idea.id]
    );

    if (!draftResult.rowCount) {
      return res.status(400).json({ message: 'No se pudo generar el borrador del articulo' });
    }

    let draft = mapDraftRow(draftResult.rows[0]);

    if (articlePromptOverride) {
      await query(
        `UPDATE drafts
         SET article_prompt_override = $2,
             updated_at = NOW()
         WHERE id = $1::uuid`,
        [draft.id, articlePromptOverride]
      );
      draft = {
        ...draft,
        articlePromptOverride
      };
    }

    // Generate image if requested
    let imagePreview = null;
    if (generateImage) {
      try {
        const imageResponse = await callN8nWebhook('seo/imagenes/generar', {
          draft_id: draft.id,
          limit: 1,
          force: true,
          upload_to_wordpress: false
        });

        const firstDraft = imageResponse.drafts?.[0];
        if (firstDraft) {
          imagePreview = {
            imageDataUrl: firstDraft.preview_image_data_url || null,
            base64: firstDraft.preview_image_base64 || null,
            format: firstDraft.image_format || null,
            altText: firstDraft.alt_text || null,
            visualPrompt: firstDraft.visual_prompt || null
          };

          await updateDraftPreviewFields(draft.id, imagePreview);
        }

        // Refrescar el draft para incluir datos de preview almacenados
        const imageRefresh = await query(
          `SELECT 
             featured_image_url,
             featured_image_alt,
             featured_image_prompt,
             preview_image_data_url,
             preview_image_base64,
             preview_image_format,
             preview_image_alt,
             preview_image_visual_prompt
           FROM drafts
           WHERE id = $1`,
          [draft.id]
        );
        if (imageRefresh.rowCount) {
          draft = {
            ...draft,
            featuredImageUrl: imageRefresh.rows[0].featured_image_url,
            featuredImageAlt: imageRefresh.rows[0].featured_image_alt,
            featuredImagePrompt: imageRefresh.rows[0].featured_image_prompt,
            previewImageDataUrl: imageRefresh.rows[0].preview_image_data_url,
            previewImageBase64: imageRefresh.rows[0].preview_image_base64,
            previewImageFormat: imageRefresh.rows[0].preview_image_format,
            previewImageAlt: imageRefresh.rows[0].preview_image_alt,
            previewImageVisualPrompt: imageRefresh.rows[0].preview_image_visual_prompt
          };
        }
      } catch (imageError) {
        console.warn('[api] Image generation failed', imageError);
      }
    }

    res.json({
      keyword: keywordAfter,
      idea,
      draft,
      imagePreview
    });
  } catch (error) {
    console.error('[api] failed to generate article', error);
    res.status(500).json({ message: 'Error al generar el articulo', details: error.message });
  }
});

router.put('/:keywordId', async (req, res) => {
  const { keywordId } = req.params;
  const keywordValue = req.body?.keyword || req.body?.keyword_principal;
  const clusterName = req.body?.clusterName || req.body?.cluster_name;
  const projectName = req.body?.projectName || req.body?.project_name;
  const searchIntent = req.body?.searchIntent || req.body?.search_intent;

  if (!keywordValue) {
    return res.status(400).json({ message: 'Debes enviar el nuevo valor de la keyword.' });
  }

  try {
    const result = await query(
      `
        UPDATE keywords
        SET
          keyword_principal = $2,
          cluster_name = COALESCE($3, cluster_name),
          project_name = COALESCE($4, project_name),
          search_intent = COALESCE($5, search_intent),
          status = 'pending',
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [keywordId, keywordValue.trim(), clusterName || null, projectName || null, searchIntent || null]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Keyword no encontrada' });
    }

    res.json({ message: 'Keyword actualizada', keyword: result.rows[0] });
  } catch (error) {
    console.error('[api] failed to update keyword', error);
    res.status(500).json({ message: 'Error al actualizar la keyword', details: error.message });
  }
});

router.delete('/:keywordId', async (req, res) => {
  const { keywordId } = req.params;
  try {
    const result = await query('DELETE FROM keywords WHERE id = $1 RETURNING id', [keywordId]);
    if (!result.rowCount) {
      return res.status(404).json({ message: 'Keyword no encontrada' });
    }
    res.json({ message: 'Keyword eliminada', keywordId });
  } catch (error) {
    console.error('[api] failed to delete keyword', error);
    res.status(500).json({ message: 'Error al eliminar la keyword', details: error.message });
  }
});

router.delete('/', async (_req, res) => {
  try {
    await query('DELETE FROM keywords');
    res.json({ message: 'Todas las keywords fueron eliminadas' });
  } catch (error) {
    console.error('[api] failed to truncate keywords', error);
    res.status(500).json({ message: 'Error al eliminar todas las keywords', details: error.message });
  }
});

export default router;
