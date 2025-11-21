import { query } from '../db.js';
import callN8nWebhook from './n8n.js';
import config from '../config.js';
import { ensureContentHtmlValue } from './articleGenerator.js';

const schedulerLogs = [];
const MAX_LOGS = 200;

function pushLog(level, message, meta = {}) {
  const entry = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString()
  };
  schedulerLogs.push(entry);
  if (schedulerLogs.length > MAX_LOGS) {
    schedulerLogs.shift();
  }
  const logFn = level === 'error' ? console.error : console.log;
  logFn(`[scheduler][${level}] ${message}`, Object.keys(meta).length ? meta : '');
}

async function publishScheduledViaWorkflow({ draftId, scheduleId, scheduledDatetime, draftData }) {
  const payload = {
    draft_id: draftId,
    schedule_id: scheduleId,
    scheduled_datetime: scheduledDatetime,
    auto: true,
    
    // Datos del draft para validación en n8n
    title: draftData.title || draftData.meta_title,
    meta_title: draftData.meta_title || draftData.title,
    meta_description: draftData.meta_description,
    content_html: draftData.content_html,
    content_markdown: draftData.content_markdown,
    featured_image_url: draftData.featured_image_url,
    preview_image_base64: draftData.preview_image_base64,
    preview_image_data_url: draftData.preview_image_data_url,
    preview_image_format: draftData.preview_image_format,
    preview_image_alt: draftData.preview_image_alt,
    wordpress_media_id: draftData.wordpress_media_id,
    
    wordpress_endpoint: config.wordpress.mediaEndpoint?.replace('/media', ''),
    wordpress_auth_header: config.wordpress.authHeader,
    wordpress_nonce: config.wordpress.nonce
  };

  const response = await callN8nWebhook('seo/publicar', payload);
  if (!response || response.status !== 'success') {
    const message = response?.message || 'Workflow de publicación falló';
    const error = new Error(message);
    error.data = response;
    throw error;
  }
  return response;
}

async function generateSocialCopies(draftId) {
  try {
    const socialResponse = await callN8nWebhook('seo/social/copy/db', {
      draft_id: draftId,
      limit: 1,
      platforms: ['linkedin', 'facebook']
    });
    if (socialResponse?.status === 'success') {
      pushLog('info', '[scheduler] Copys sociales generadas', { draftId });
    } else if (socialResponse?.status === 'empty') {
      pushLog('info', '[scheduler] Copys sociales ya existentes', { draftId });
    } else {
      pushLog('warn', '[scheduler] Resultado inesperado al generar copys sociales', {
        draftId,
        response: socialResponse
      });
    }
  } catch (error) {
    pushLog('error', '[scheduler] Error al generar copys sociales', { draftId, error: error.message });
  }
}

export function getSchedulerLogs() {
  return [...schedulerLogs];
}

export async function autoScheduleApprovedDrafts(options = {}) {
  const { forceManualReset = false } = options;
  try {
    // Get settings
    const settingsResult = await query(`
      SELECT publications_per_day, publish_days, include_images
      FROM publication_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    if (settingsResult.rowCount === 0) {
      return;
    }

    const settings = settingsResult.rows[0];
    const daysMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    // Cancel pending schedules (automatic always, manual only if forced)
    await query(`
        UPDATE scheduled_publications
        SET status = 'cancelled',
            cancelled_at = NOW(),
            cancelled_by = 'auto-scheduler',
            cancellation_reason = 'Re-programación por cambio de configuración',
            updated_at = NOW()
        WHERE status = 'pending'
          AND scheduled_datetime > NOW()
          AND scheduled_automatically = true
      `);
    
    const draftsResult = await query(`
      SELECT 
        d.id, 
        d.title, 
        d.meta_title,
        d.meta_description,
        d.content_html,
        d.content_markdown,
        COALESCE(d.approved_at, d.updated_at, d.created_at) AS priority_date
      FROM drafts d
      WHERE d.status IN ('draft','review','approved')
        AND d.published_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM scheduled_publications sp
          WHERE sp.draft_id = d.id
            AND sp.status IN ('pending', 'published')
        )
      ORDER BY priority_date ASC
      LIMIT 500
    `);

    if (draftsResult.rowCount === 0) {
      return;
    }

    pushLog('info', `[auto-scheduler] Found ${draftsResult.rowCount} drafts to schedule`);

    // Get next available publication slots
    const rawPublishDays = Array.isArray(settings.publish_days)
      ? settings.publish_days
      : [];
    const publishDays = rawPublishDays
      .map((day) => daysMap[String(day).toLowerCase()])
      .filter((value) => typeof value === 'number');
    if (!publishDays.length) {
      console.warn('[auto-scheduler] No hay días configurados. Abortando programación.');
      return;
    }
    const publicationsPerDay = Math.max(1, settings.publications_per_day || 1);

    // Get already scheduled publications count per day
    const scheduledResult = await query(`
      SELECT 
        scheduled_date as date,
        COUNT(*) as count
      FROM scheduled_publications
      WHERE status = 'pending'
        AND scheduled_date >= CURRENT_DATE
      GROUP BY scheduled_date
    `);

    const scheduledCounts = {};
    scheduledResult.rows.forEach(row => {
      scheduledCounts[row.date] = parseInt(row.count);
    });

    // Schedule drafts
    let currentDate = new Date();
    const currentHour = currentDate.getHours();
    
    if (currentHour >= 18) {
      // Si ya son más de las 6PM, empezar desde mañana
      currentDate.setDate(currentDate.getDate() + 1);
    }
    currentDate.setHours(9, 0, 0, 0); // Start at 9 AM
    // Force scheduling to start TODAY at 12:00 regardless of current hour
    currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0);
    // If today is not an allowed publish day, move to the next allowed day
    while (!publishDays.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    pushLog('info', `[auto-scheduler] Start date: ${currentDate.toISOString().split('T')[0]} 12:00`);

    for (const draft of draftsResult.rows) {
      const issues = [];
      const resolvedTitle = draft.title || draft.meta_title;
      const resolvedMetaTitle = draft.meta_title || draft.title;

      if (!resolvedTitle) {
        issues.push('title');
      }
      if (!resolvedMetaTitle) {
        issues.push('meta_title');
      }
      if (!draft.meta_description) {
        issues.push('meta_description');
      }

      let ensuredHtml = draft.content_html;
      if (!ensuredHtml && draft.content_markdown) {
        ensuredHtml = ensureContentHtmlValue({
          contentHtml: draft.content_html,
          contentMarkdown: draft.content_markdown
        });
      }

      if (!ensuredHtml) {
        issues.push('content_html');
      }

      if (issues.length) {
        pushLog('warn', '[auto-scheduler] Draft omitido por campos faltantes', {
          draftId: draft.id,
          missing: issues
        });
        // Normalizar meta_title/meta_description si podemos
        if (!draft.meta_title && resolvedMetaTitle) {
          await query(
            `UPDATE drafts
             SET meta_title = $2,
                 updated_at = NOW()
             WHERE id = $1`,
            [draft.id, resolvedMetaTitle]
          );
        }
        if (!draft.meta_description) {
          pushLog('warn', '[auto-scheduler] Draft sin meta_description requiere intervención', { draftId: draft.id });
        }
        continue;
      }

      let scheduled = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!scheduled && attempts < maxAttempts) {
        const dayOfWeek = currentDate.getDay();
        const dateKey = currentDate.toISOString().split('T')[0];

        if (publishDays.includes(dayOfWeek)) {
          const count = scheduledCounts[dateKey] || 0;
          
          if (count < publicationsPerDay) {
            // Hora predeterminada de publicación: 12:00
            const time = '12:00:00';

            // Upsert para evitar conflicto por unique(draft_id) y no tocar programaciones manuales pendientes
            await query(`
              INSERT INTO scheduled_publications 
                (draft_id, scheduled_date, scheduled_time, scheduled_automatically, status, created_by)
              VALUES ($1, $2, $3, true, 'pending', 'auto-scheduler')
              ON CONFLICT (draft_id) DO UPDATE
              SET 
                scheduled_date = EXCLUDED.scheduled_date,
                scheduled_time = EXCLUDED.scheduled_time,
                status = 'pending',
                scheduled_automatically = true,
                updated_at = NOW(),
                cancelled_at = NULL,
                cancellation_reason = NULL,
                cancelled_by = NULL
              WHERE scheduled_publications.scheduled_automatically = true
            `, [draft.id, dateKey, time]);

            scheduledCounts[dateKey] = count + 1;
            scheduled = true;
            pushLog('info', `[auto-scheduler] Scheduled "${draft.title}" for ${dateKey} ${time}`);
          }
        }

        if (!scheduled) {
          currentDate.setDate(currentDate.getDate() + 1);
          attempts++;
        }
      }
    }

    pushLog('info', `[auto-scheduler] Scheduling completed. Total slots used: ${Object.keys(scheduledCounts).length} days`);

  } catch (error) {
    pushLog('error', '[auto-scheduler] Error', { error: error.message });
  }
}

export async function checkAndPublishScheduled() {
  try {
    // Obtener publicaciones listas para publicar
    const result = await query(`
      SELECT 
        sp.id,
        sp.draft_id,
        sp.scheduled_date,
        sp.scheduled_time,
        sp.scheduled_datetime,
        sp.attempts,
        d.title
      FROM scheduled_publications sp
      JOIN drafts d ON d.id = sp.draft_id
      WHERE sp.status = 'pending'
        AND sp.scheduled_datetime <= NOW()
      ORDER BY sp.scheduled_datetime ASC
      LIMIT 10
    `);

    if (result.rowCount === 0) {
      return;
    }

    pushLog('info', `[scheduler] Encontradas ${result.rowCount} publicaciones para procesar`);

    for (const pub of result.rows) {
      try {
        pushLog('info', `[scheduler] Publicando: ${pub.title} (draft_id: ${pub.draft_id})`, {
          scheduleId: pub.id,
          scheduledDatetime: pub.scheduled_datetime,
          attempts: pub.attempts
        });
        
        // Actualizar intento
        await query(
          `UPDATE scheduled_publications 
           SET attempts = attempts + 1, 
               last_attempt_at = NOW() 
           WHERE id = $1`,
          [pub.id]
        );

        const draftCheck = await query(
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
          [pub.draft_id]
        );

        if (!draftCheck.rowCount) {
          throw new Error('Draft no encontrado antes de publicar');
        }

        const draftData = draftCheck.rows[0];
        const missingFields = [];
        if (!draftData.title && !draftData.meta_title) missingFields.push('title/meta_title');
        if (!draftData.meta_description) missingFields.push('meta_description');
        let ensuredHtml = draftData.content_html;
        if (!ensuredHtml && draftData.content_markdown) {
          ensuredHtml = ensureContentHtmlValue({
            contentHtml: draftData.content_html,
            contentMarkdown: draftData.content_markdown
          });
        }
        if (!ensuredHtml) missingFields.push('content_html');

        if (missingFields.length) {
          throw new Error(`Draft incompleto antes de publicar: faltan ${missingFields.join(', ')}`);
        }

        if (!draftData.content_html && ensuredHtml) {
          await query(
            `UPDATE drafts
             SET content_html = $2,
                 updated_at = NOW()
             WHERE id = $1`,
            [pub.draft_id, ensuredHtml]
          );
        }

        const wpResponse = await publishScheduledViaWorkflow({
          draftId: pub.draft_id,
          scheduleId: pub.id,
          scheduledDatetime: pub.scheduled_datetime,
          draftData: draftData
        });

        const publishedAt = wpResponse.published_at || new Date().toISOString();

        await query(
          `UPDATE scheduled_publications
           SET status = 'published',
               wordpress_post_id = $2,
               wordpress_post_url = $3,
               published_at = $4,
               last_error = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [pub.id, wpResponse.wordpress_post_id || null, wpResponse.wordpress_post_url || null, publishedAt]
        );

        await generateSocialCopies(pub.draft_id);
        
      } catch (error) {
        pushLog('error', `[scheduler] Error al publicar "${pub.title}"`, {
          error: error.message,
          draftId: pub.draft_id,
          scheduleId: pub.id,
          scheduledDatetime: pub.scheduled_datetime,
          attempts: pub.attempts + 1
        });
        
        // Registrar error
        const attemptsAfter = pub.attempts + 1;
        const newStatus = attemptsAfter >= 2 ? 'failed' : 'pending';
        await query(
          `UPDATE scheduled_publications 
           SET last_error = $1,
               status = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [error.message, newStatus, pub.id]
        );

        if (newStatus === 'failed') {
          pushLog('error', `[scheduler] Máximo de intentos alcanzado para: ${pub.title}`, { draftId: pub.draft_id });
        }
      }
    }
    
  } catch (error) {
    pushLog('error', '[scheduler] Error general', { error: error.message });
  }
}

let schedulerInterval = null;

export function startScheduler() {
  if (schedulerInterval) {
    pushLog('info', '[scheduler] Ya está corriendo');
    return;
  }

  pushLog('info', '[scheduler] Iniciando servicio de publicación programada');
  pushLog('info', '[scheduler] Revisando cada 60 segundos');
  
  // Ejecutar inmediatamente una vez
  autoScheduleApprovedDrafts();
  checkAndPublishScheduled();
  
  // Ejecutar cada minuto
  schedulerInterval = setInterval(() => {
    autoScheduleApprovedDrafts();
    checkAndPublishScheduled();
  }, 60000);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    pushLog('info', '[scheduler] Servicio detenido');
  }
}


