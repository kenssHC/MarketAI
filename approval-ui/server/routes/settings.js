import express from 'express';
import { query } from '../db.js';
import { autoScheduleApprovedDrafts } from '../services/scheduler.js';

const router = express.Router();

// GET /api/settings - Get publication settings
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        publications_per_day,
        publish_days,
        include_images,
        created_at,
        updated_at
      FROM publication_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No settings found' });
    }

    const settings = result.rows[0];
    res.json({
      publicationsPerDay: settings.publications_per_day,
      publishDays: settings.publish_days,
      includeImages: settings.include_images,
      updatedAt: settings.updated_at
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error al cargar configuracion' });
  }
});

// POST /api/settings - Update publication settings
router.post('/', async (req, res) => {
  try {
    const { publicationsPerDay, publishDays, includeImages } = req.body;

    if (!publicationsPerDay || !Array.isArray(publishDays)) {
      return res.status(400).json({ message: 'Datos de configuracion invalidos' });
    }

    // Update or insert settings
    const result = await query(`
      INSERT INTO publication_settings (publications_per_day, publish_days, include_images, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE
      SET 
        publications_per_day = EXCLUDED.publications_per_day,
        publish_days = EXCLUDED.publish_days,
        include_images = EXCLUDED.include_images,
        updated_at = NOW()
      RETURNING *
    `, [publicationsPerDay, JSON.stringify(publishDays), includeImages]);

    const settings = result.rows[0];
    
    // Re-programar artículos con la nueva configuración
    try {
      await autoScheduleApprovedDrafts({ forceManualReset: true });
      console.log('[settings] Artículos re-programados con nueva configuración');
    } catch (scheduleError) {
      console.error('[settings] Error al re-programar artículos:', scheduleError);
      // Continuar aunque falle la re-programación
    }
    
    res.json({
      message: 'Configuracion guardada y artículos re-programados',
      publicationsPerDay: settings.publications_per_day,
      publishDays: settings.publish_days,
      includeImages: settings.include_images,
      updatedAt: settings.updated_at
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ message: 'Error al guardar configuracion' });
  }
});

export default router;

