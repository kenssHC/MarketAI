import config from '../config.js';
import { query } from '../db.js';
import { ensureContentHtmlValue } from './articleGenerator.js';

async function uploadFeaturedImage({ draftId, imageDataUrl, imageBase64, imageFormat, imageAlt }) {
  if (!config.wordpress.mediaEndpoint) {
    throw new Error('WordPress media endpoint no configurado');
  }

  const normalizedDataUrl = imageDataUrl && imageDataUrl.startsWith('data:') ? imageDataUrl : null;
  const base64 = imageBase64 || (normalizedDataUrl ? normalizedDataUrl.split(',').pop() : null);
  if (!base64 || base64.length < 50) {
    throw new Error('Preview sin datos base64 válidos para subir a WordPress');
  }

  const buffer = Buffer.from(base64, 'base64');
  const extension = (imageFormat || 'png').replace(/\./g, '').toLowerCase();
  const filename = `draft-${draftId}-${Date.now()}.${extension}`;

  const response = await fetch(`${config.wordpress.mediaEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': `image/${extension}`,
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...(config.wordpress.authHeader ? { Authorization: config.wordpress.authHeader } : {})
    },
    body: buffer
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress media upload failed: ${text}`);
  }

  const media = await response.json();
  return {
    wordpress_media_id: media.id,
    featured_image_url: media.source_url,
    featured_image_alt: imageAlt || media.alt_text || ''
  };
}

async function publishPostToWordPress({ draft, schedule }) {
  if (!config.wordpress.mediaEndpoint) {
    throw new Error('Configuración de WordPress incompleta (mediaEndpoint)');
  }

  const title = draft.title || draft.meta_title || 'Artículo';
  const excerpt = draft.meta_description || '';

  let dateGmt;
  if (schedule?.scheduled_datetime) {
    const date = new Date(schedule.scheduled_datetime);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Fecha de programación inválida');
    }
    dateGmt = date.toISOString();
  }

  const body = {
    title,
    content: draft.content_html || '',
    excerpt,
    status: schedule ? 'future' : 'publish',
    featured_media: draft.wordpress_media_id || undefined,
    date_gmt: dateGmt
  };

  const response = await fetch(`${config.wordpress.mediaEndpoint?.replace('/media', '')}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.wordpress.authHeader ? { Authorization: config.wordpress.authHeader } : {}),
      ...(config.wordpress.nonce ? { 'X-WP-Nonce': config.wordpress.nonce } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress post publish failed: ${text}`);
  }

  return response.json();
}

export async function publishScheduledDraft(draftId, schedule) {
  const draftResult = await query(
    `SELECT 
      id,
      title,
      meta_title,
      meta_description,
      content_html,
      content_markdown,
      featured_image_url,
      preview_image_base64,
      preview_image_data_url,
      preview_image_format,
      preview_image_alt,
      wordpress_media_id
     FROM drafts
     WHERE id = $1`,
    [draftId]
  );

  if (!draftResult.rowCount) {
    throw new Error('Draft no encontrado');
  }

  let draft = draftResult.rows[0];

  const missing = [];
  if (!draft.title && !draft.meta_title) missing.push('title/meta_title');
  if (!draft.meta_description) missing.push('meta_description');
  if (!draft.content_html && !draft.content_markdown) missing.push('content');

  if (missing.length) {
    throw new Error(`Draft incompleto, faltan: ${missing.join(', ')}`);
  }

  let contentHtml = ensureContentHtmlValue({
    contentHtml: draft.content_html,
    contentMarkdown: draft.content_markdown
  });

  if (!contentHtml) {
    throw new Error('El draft no tiene content_html para publicar');
  }

  if (!draft.content_html) {
    await query(
      `UPDATE drafts
       SET content_html = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [draftId, contentHtml]
    );
    draft.content_html = contentHtml;
  }

  if (!draft.wordpress_media_id && (draft.preview_image_base64 || draft.preview_image_data_url)) {
    const mediaInfo = await uploadFeaturedImage({
      draftId,
      imageDataUrl: draft.preview_image_data_url,
      imageBase64: draft.preview_image_base64,
      imageFormat: draft.preview_image_format,
      imageAlt: draft.preview_image_alt
    });

    if (mediaInfo) {
      await query(
        `UPDATE drafts
         SET featured_image_url = $2,
             featured_image_alt = $3,
             wordpress_media_id = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [draftId, mediaInfo.featured_image_url, mediaInfo.featured_image_alt, mediaInfo.wordpress_media_id]
      );

      draft = {
        ...draft,
        featured_image_url: mediaInfo.featured_image_url,
        featured_image_alt: mediaInfo.featured_image_alt,
        wordpress_media_id: mediaInfo.wordpress_media_id
      };
    }
  }

  const wpPost = await publishPostToWordPress({ draft, schedule });

  await query(
    `UPDATE drafts
     SET wordpress_post_id = $2,
         wordpress_post_url = $3,
         published_at = $4,
         updated_at = NOW()
     WHERE id = $1`,
    [draftId, wpPost.id, wpPost.link || wpPost.guid?.rendered || null, wpPost.date_gmt || new Date().toISOString()]
  );

  if (schedule?.schedule_id) {
    await query(
      `UPDATE scheduled_publications
       SET status = 'published',
           wordpress_post_id = $2,
           wordpress_post_url = $3,
           published_at = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [schedule.schedule_id, wpPost.id, wpPost.link || null, wpPost.date_gmt || new Date().toISOString()]
    );
  }

  return wpPost;
}

