import { query } from '../db.js';
import callN8nWebhook from './n8n.js';
import config from '../config.js';

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
          console.log(`[scheduler] ✅ Publicado: ${pub.title}`);
        } else {
          throw new Error(wpResponse.message || 'Error desconocido del workflow');
        }
        
      } catch (error) {
        console.error(`[scheduler] ❌ Error al publicar "${pub.title}":`, error.message);
        
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
          console.error(`[scheduler] 💀 Máximo de intentos alcanzado para: ${pub.title}`);
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

  console.log('[scheduler] 🚀 Iniciando servicio de publicación programada');
  console.log('[scheduler] ⏰ Revisando cada 60 segundos');
  
  // Ejecutar inmediatamente una vez
  checkAndPublishScheduled();
  
  // Ejecutar cada minuto
  schedulerInterval = setInterval(checkAndPublishScheduled, 60000);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[scheduler] 🛑 Servicio detenido');
  }
}

