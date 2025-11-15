import { query } from '../db.js';
import callN8nWebhook from './n8n.js';
import config from '../config.js';

export async function autoScheduleApprovedDrafts(options = {}) {
  const { resetPending = false } = options;
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

    // Cancelar programaciones automáticas previas solo cuando se fuerza un reseteo (cambio de config)
    if (resetPending) {
      await query(`
        UPDATE scheduled_publications
        SET status = 'cancelled',
            cancelled_at = NOW(),
            cancelled_by = 'auto-scheduler',
            cancellation_reason = 'Re-programación por cambio de configuración'
        WHERE status = 'pending'
          AND scheduled_automatically = true
          AND scheduled_datetime > NOW()
      `);
    }
    
    const draftsResult = await query(`
      WITH pending_drafts AS (
        SELECT d.id, d.title, d.created_at
        FROM drafts d
        WHERE d.status IN ('draft', 'review')
          AND d.published_at IS NULL
          AND d.created_at >= CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM scheduled_publications sp
            WHERE sp.draft_id = d.id AND sp.status = 'pending'
          )
        ORDER BY d.created_at ASC
        LIMIT 150
      ),
      manual_pending AS (
        SELECT sp.draft_id
        FROM scheduled_publications sp
        JOIN drafts d ON d.id = sp.draft_id
        WHERE sp.status = 'pending'
          AND sp.scheduled_automatically = false
          AND d.published_at IS NULL
        LIMIT 50
      )
      SELECT * FROM pending_drafts
      UNION ALL
      SELECT d.id, d.title, d.created_at
      FROM drafts d
      JOIN manual_pending m ON m.draft_id = d.id
    `);

    if (draftsResult.rowCount === 0) {
      return;
    }

    console.log(`[auto-scheduler] Found ${draftsResult.rowCount} drafts to schedule`);

    // Get next available publication slots
    const publishDays = settings.publish_days.map(day => daysMap[day]);
    const publicationsPerDay = settings.publications_per_day || 1;

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
    console.log(`[auto-scheduler] Start date: ${currentDate.toISOString().split('T')[0]} 12:00`);

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
              WHERE scheduled_publications.scheduled_automatically = true OR scheduled_publications.status <> 'pending'
            `, [draft.id, dateKey, time]);

            scheduledCounts[dateKey] = count + 1;
            scheduled = true;
            console.log(`[auto-scheduler] Scheduled "${draft.title}" for ${dateKey} ${time}`);
          }
        }

        if (!scheduled) {
          currentDate.setDate(currentDate.getDate() + 1);
          attempts++;
        }
      }
    }

    console.log(`[auto-scheduler] Scheduling completed. Total slots used: ${Object.keys(scheduledCounts).length} days`);

  } catch (error) {
    console.error('[auto-scheduler] Error:', error);
  }
}

export async function checkAndPublishScheduled() {
  try {
    // Obtener publicaciones listas para publicar
    const result = await query(`
      SELECT 
        sp.id,
        sp.draft_id,
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

    console.log(`[scheduler] Encontradas ${result.rowCount} publicaciones para procesar`);

    for (const pub of result.rows) {
      try {
        console.log(`[scheduler] Publicando: ${pub.title} (draft_id: ${pub.draft_id})`);
        
        // Actualizar intento
        await query(
          `UPDATE scheduled_publications 
           SET attempts = attempts + 1, 
               last_attempt_at = NOW() 
           WHERE id = $1`,
          [pub.id]
        );

        // Llamar al workflow 14
        const wpResponse = await callN8nWebhook('seo/publicar', {
          draft_id: pub.draft_id,
          wordpress_endpoint: config.wordpress.mediaEndpoint?.replace('/media', ''),
          wordpress_auth_header: config.wordpress.authHeader,
          wordpress_nonce: config.wordpress.nonce
        });

        if (wpResponse.status === 'success') {
          // Marcar como publicado (el workflow ya actualiza la tabla)
          console.log(`[scheduler] Publicado: ${pub.title}`);

          try {
            const socialResponse = await callN8nWebhook('seo/social/copy/db', {
              draft_id: pub.draft_id,
              limit: 1,
              platforms: ['linkedin', 'facebook']
            });

            if (socialResponse?.status === 'success') {
              console.log(`[scheduler] Copys sociales generadas para ${pub.title}`);
            } else if (socialResponse?.status === 'empty') {
              console.log(`[scheduler] Copys sociales ya existentes para ${pub.title}`);
            } else {
              console.warn(`[scheduler] Resultado inesperado al generar copys sociales para ${pub.title}:`, socialResponse);
            }
          } catch (socialError) {
            console.error(`[scheduler] Error al generar copys sociales para "${pub.title}":`, socialError.message);
            await query(
              `UPDATE scheduled_publications 
               SET last_error = $1,
                   updated_at = NOW()
               WHERE id = $2`,
              [`Social copy workflow failed: ${socialError.message}`, pub.id]
            );
          }
        } else {
          throw new Error(wpResponse.message || 'Error desconocido del workflow');
        }
        
      } catch (error) {
        console.error(`[scheduler] Error al publicar "${pub.title}":`, error.message);
        
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
          console.error(`[scheduler] Máximo de intentos alcanzado para: ${pub.title}`);
        }
      }
    }
    
  } catch (error) {
    console.error('[scheduler] Error general:', error);
  }
}

let schedulerInterval = null;

export function startScheduler() {
  if (schedulerInterval) {
    console.log('[scheduler] Ya está corriendo');
    return;
  }

  console.log('[scheduler] Iniciando servicio de publicación programada');
  console.log('[scheduler] Revisando cada 60 segundos');
  
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
    console.log('[scheduler] Servicio detenido');
  }
}


