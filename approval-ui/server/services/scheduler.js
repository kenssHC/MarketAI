import { query } from '../db.js';
import callN8nWebhook from './n8n.js';
import config from '../config.js';
import { publishScheduledDraft } from './publisher.js';

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
        pushLog('info', `[scheduler] Publicando: ${pub.title} (draft_id: ${pub.draft_id})`);
        
        // Actualizar intento
        await query(
          `UPDATE scheduled_publications 
           SET attempts = attempts + 1, 
               last_attempt_at = NOW() 
           WHERE id = $1`,
          [pub.id]
        );

        await publishScheduledDraft(pub.draft_id, { schedule_id: pub.id, scheduled_datetime: pub.scheduled_datetime });
        
      } catch (error) {
        pushLog('error', `[scheduler] Error al publicar "${pub.title}"`, { error: error.message, draftId: pub.draft_id });
        
        // Registrar error
        const newStatus = pub.attempts >= 2 ? 'failed' : 'pending';
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


