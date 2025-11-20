import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  fetchKeywords,
  createKeywordManual,
  uploadKeywordsCsv,
  generateArticleFromKeyword,
  updateKeyword,
  deleteKeyword,
  deleteAllKeywords,
  fetchDrafts,
  updateDraft,
  approveDraft,
  returnDraft,
  generateDraftImage,
  scheduleDraft,
  publishDraftNow,
  fetchSettings,
  saveSettings,
  triggerAutoSchedule,
  hasManualSchedules,
  fetchDraftById,
  regenerateDraftManual
} from './api';
import './app.css';
import { deleteDraft as apiDeleteDraft } from './api';

const ENABLE_SCHEDULER_LOGS =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ENABLE_SCHEDULER_LOGS === 'true';

const NAV_ITEMS = [
  //{ id: 'marketing', label: 'Marketing', disabled: true },
  //{ id: 'campaigns', label: 'Campanas', disabled: true },
  { id: 'blog', label: 'Blog', disabled: false },
  //{ id: 'social', label: 'Redes Sociales', disabled: true },
  //{ id: 'crm', label: 'CRM', disabled: true }
];

const BLOG_TABS = [
  { id: 'configuracion', label: 'Configuración', disabled: false },
  { id: 'keywords', label: 'Keywords' },
  //{ id: 'revision', label: 'Revision QA' },
  { id: 'programacion', label: 'Calendario', disabled: false }
];

const normalizePreviewPayload = (preview) => {
  if (!preview) return null;
  const dataUrl = preview.imageDataUrl ?? preview.preview_image_data_url ?? null;
  const base64 = preview.base64 ?? preview.preview_image_base64 ?? null;
  const format = preview.format ?? preview.preview_image_format ?? null;
  const alt = preview.altText ?? preview.preview_image_alt ?? null;
  const prompt = preview.visualPrompt ?? preview.preview_image_visual_prompt ?? null;

  if (!dataUrl && !base64 && !alt && !prompt) {
    return null;
  }

  return {
    preview_image_data_url: dataUrl,
    preview_image_base64: base64,
    preview_image_format: format,
    preview_image_alt: alt,
    preview_image_visual_prompt: prompt
  };
};

const buildArticlePrompt = (ideaTitle = 'Artículo', wordCount = 600) => {
  const safeIdea = ideaTitle || 'Artículo';
  const targetWords = Math.max(400, Number(wordCount) || 600);
  return `Actúa como un redactor profesional especializado en SEO Y GEO (Generative Engine Optimization).

Recibirás una idea de contenido.

**Idea:** ${safeIdea}

Tu tarea es redactar un artículo optimizado para SEO Y GEO (Generative Engine Optimization):

1. Usar la idea como título principal (H1)
2. Incluir párrafo introductorio breve y atractivo
3. Desarrollar contenido de al menos ${targetWords} palabras
4. Usar subtítulos (H2, H3) para organizar la información
5. Lenguaje claro, fluido y fácil de leer
6. Integrar keywords naturalmente si son evidentes
7. Conclusión con resumen o CTA cuando sea relevante
8. Contenido 100% original, sin plagio

**Metadatos SEO:**
- Meta Title: máximo 60 caracteres, atractivo, con keyword
- Meta Description: máximo 155 caracteres, persuasiva, invite al clic
- Tags: 5 a 8 etiquetas relevantes separadas por comas

**Formato de salida (Markdown con frontmatter):**
---
Meta Title: [Texto aquí]
Meta Description: [Texto aquí]
Tags: [tag1, tag2, tag3, ...]
---

# [Título del artículo]

[Párrafo introductorio...]

## [Subtítulo H2]
[Contenido de la sección...]

## [Subtítulo H2]
[Contenido de la sección...]

**Conclusión:** [Párrafo final con resumen...]

IMPORTANTE:
- Responde SOLO con el Markdown completo, sin bloques de código.
- Incluye el frontmatter con los metadatos.
- El contenido debe tener al menos ${targetWords} palabras.`;
};

const deriveArticlePrompt = (draft, idea) => {
  const ideaTitle =
    idea?.idea_title ||
    draft?.ideaTitle ||
    draft?.title ||
    draft?.metaTitle ||
    'Artículo';
  const estimate =
    idea?.estimated_word_count ||
    draft?.estimatedWordCount ||
    draft?.estimated_word_count ||
    draft?.wordCount ||
    600;
  return buildArticlePrompt(ideaTitle, estimate);
};

const extractMetaFromContent = (markdown = '') => {
  if (!markdown) {
    return {};
  }

  const head = markdown.split('\n').slice(0, 20).join('\n');
  const descriptionMatch = head.match(/Meta Description?:?\s*["“”]?([^"\n]+)["“”]?/i);
  const tagsMatch = head.match(/Tags?:?\s*["“”]?([^"\n]+)["“”]?/i);

  const extracted = {};

  if (descriptionMatch) {
    extracted.metaDescription = descriptionMatch[1].trim();
  }

  if (tagsMatch) {
    let tagsText = tagsMatch[1].trim();
    if (/[;,|]/.test(tagsText)) {
      tagsText = tagsText
        .split(/[,;|]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(', ');
    }
    extracted.tags = tagsText;
  }

  return extracted;
};

const isMetaFieldEmpty = (value) => {
  if (value === undefined || value === null) {
    return true;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return true;
  }

  if (/^-{2,}$/.test(trimmed)) {
    return true;
  }

  return false;
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.variant || 'info'}`}>
      {toast.message}
    </div>
  );
}

function BlogCalendario({ onToast, onOpenEditor }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayStart = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    try {
      setLoading(true);
      const response = await fetchDrafts({ 
        status: 'draft,review',
        qaStatus: 'all', // Incluir drafts sin QA
        limit: 100 
      });
      setDrafts(response.drafts || []);
    } catch (error) {
      onToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  }

  function changeMonth(delta) {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  }

  function handleDraftClick(draft) {
    onOpenEditor({ 
      draft,
      keyword: null,
      idea: null
    });
  }
  async function handleDeleteDraft(draft, e) {
    e?.stopPropagation();
    try {
      if (!confirm('¿Eliminar este título? Esta acción no se puede deshacer.')) return;
      await apiDeleteDraft(draft.id);
      await loadDrafts();
      onToast('Título eliminado', 'success');
    } catch (error) {
      onToast(error.message, 'error');
    }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const draftsByDay = {};
  drafts.forEach(draft => {
    // Usar la fecha programada si existe, de lo contrario usar la fecha de creación
    const dateToUse = draft.scheduledDatetime ? new Date(draft.scheduledDatetime) : new Date(draft.createdAt);
    
    if (dateToUse.getFullYear() === year && dateToUse.getMonth() === month) {
      const day = dateToUse.getDate();
      if (!draftsByDay[day]) draftsByDay[day] = [];
      draftsByDay[day].push(draft);
    }
  });

  return (
    <div className="panel">
      <header className="panel__header">
        <div>
          <h2>Calendario de Articulos</h2>
          <p className="muted">{drafts.length} articulos creados</p>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={loadDrafts}>
          Actualizar
        </button>
      </header>
      {loading ? (
        <div className="empty-state">
          <p>Cargando...</p>
        </div>
      ) : (
        <div className="calendar-container">
          <div className="calendar-header">
            <button className="btn btn-ghost btn--sm" onClick={() => changeMonth(-1)}>
              &lt; Anterior
            </button>
            <h3>{monthName}</h3>
            <button className="btn btn-ghost btn--sm" onClick={() => changeMonth(1)}>
              Siguiente &gt;
            </button>
          </div>
          <div className="calendar-grid">
            <div className="calendar-weekdays">
              <div>Dom</div>
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div>Sáb</div>
            </div>
            <div className="calendar-days">
              {calendarDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-day ${!day ? 'calendar-day--empty' : ''} ${day && (new Date(year, month, day) < todayStart) ? 'calendar-day--past' : ''}`}
                >
                  {day && (
                    <>
                      <div className="calendar-day-number">{day}</div>
                      {draftsByDay[day] && (
                        <div className="calendar-day-drafts">
                          {draftsByDay[day].map(draft => (
                            <div 
                              key={draft.id}
                              className={`calendar-draft-item ${(day && (new Date(year, month, day) < todayStart)) ? 'calendar-draft-item--disabled' : ''}`}
                              onClick={(day && (new Date(year, month, day) < todayStart)) ? undefined : () => handleDraftClick(draft)}
                              aria-disabled={(day && (new Date(year, month, day) < todayStart)) ? 'true' : 'false'}
                              title={(day && (new Date(year, month, day) < todayStart)) ? 'Ya publicado / no editable' : undefined}
                            >
                              <span className="calendar-draft-title">
                                {draft.title || draft.metaTitle || 'Sin título'}
                              </span>
                              <button 
                                type="button"
                                className="calendar-draft-delete"
                                title="Eliminar título"
                                onClick={(ev) => handleDeleteDraft(draft, ev)}
                                aria-label="Eliminar título"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlogConfiguracion({ onToast }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publicationsPerDay, setPublicationsPerDay] = useState(1);
  const [includeImages, setIncludeImages] = useState(true);
  const [selectedDays, setSelectedDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

  const DAYS = [
    { id: 'sunday', label: 'Dom' },
    { id: 'monday', label: 'Lun' },
    { id: 'tuesday', label: 'Mar' },
    { id: 'wednesday', label: 'Mié' },
    { id: 'thursday', label: 'Jue' },
    { id: 'friday', label: 'Vie' },
    { id: 'saturday', label: 'Sáb' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await fetchSettings();
      setPublicationsPerDay(data.publicationsPerDay || 1);
      setIncludeImages(data.includeImages !== undefined ? data.includeImages : true);
      setSelectedDays(Array.isArray(data.publishDays) ? data.publishDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(dayId) {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  }

  async function handleSave() {
    if (selectedDays.length === 0) {
      onToast('Debes seleccionar al menos un día', 'warn');
      return;
    }
    if (publicationsPerDay < 1) {
      onToast('Las publicaciones por día deben ser al menos 1', 'warn');
      return;
    }
    try {
      setSaving(true);
      await saveSettings({
        publicationsPerDay,
        publishDays: selectedDays,
        includeImages
      });
      let forceManualReset = false;
      try {
        const manualCheck = await hasManualSchedules();
        if (manualCheck?.hasManualSchedules) {
          const confirmation = await Swal.fire({
            icon: 'warning',
            title: '¿Reprogramar artículos manuales?',
            html: 'Existen publicaciones programadas manualmente. Si continúas, se reordenarán junto con las automáticas.',
            confirmButtonText: 'Sí, reprogramar todo',
            cancelButtonText: 'Cancelar',
            showCancelButton: true,
            focusCancel: true
          });
          if (!confirmation.isConfirmed) {
            onToast('Configuración guardada, pero no se reordenó el calendario.', 'info');
            return;
          }
          forceManualReset = true;
        }
      } catch (manualError) {
        console.warn('[config] No se pudo validar programaciones manuales', manualError);
      }

      await triggerAutoSchedule(forceManualReset);
      onToast('Configuración guardada y artículos reprogramados', 'success');
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setPublicationsPerDay(1);
    setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    setIncludeImages(true);
  }

  return (
    <div className="panel">
      <header className="panel__header">
        <div>
          <h2>Configuración</h2>
          <p className="muted">Estos ajustes afectan a futuras publicaciones de contenido.</p>
        </div>
      </header>
      <div className="card">
        {loading ? (
          <div className="empty-state">
            <p>Cargando configuración...</p>
          </div>
        ) : (
          <>
            <div className="config-section">
              <h3>Frecuencia de publicación</h3>
              <div className="config-grid">
                <div>
                  <label htmlFor="pubs-per-day">Publicaciones por día</label>
                  <input 
                    id="pubs-per-day" 
                    type="number" 
                    min="1"
                    value={publicationsPerDay}
                    onChange={(e) => setPublicationsPerDay(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label>Días de la semana</label>
                  <div className="day-selector">
                    {DAYS.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        className={`day-selector__btn ${selectedDays.includes(day.id) ? 'day-selector__btn--active' : ''}`}
                        onClick={() => toggleDay(day.id)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h3>Configuración de contenido</h3>
              <div className="config-grid">
                <div>
                  <label>Incluir imágenes</label>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      id="include-images" 
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                    />
                    <label htmlFor="include-images" className="toggle-switch__label"></label>
                    <span className="toggle-switch__text">{includeImages ? 'Activado' : 'Desactivado'}</span>
                  </div>
                </div>
              </div>
            </div>

            <footer className="config-footer">
              <button className="btn btn-ghost" onClick={handleReset} disabled={saving}>
                Restablecer valores
              </button>
              <button className="btn btn-primary btn-pink" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function BlogKeywords({ onOpenEditor, onToast, refreshKey, onPreviewCacheUpdate = () => {} }) {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualKeyword, setManualKeyword] = useState('');
  const [clusterName, setClusterName] = useState('Blog Manual');
  const [projectName, setProjectName] = useState('Blog');
  const [csvUploading, setCsvUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationInfo, setGenerationInfo] = useState(null);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [includeImagesSetting, setIncludeImagesSetting] = useState(true);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      const data = await fetchKeywords({ limit: 200 });
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadContentSettings = async ({ notifyOnError = false } = {}) => {
    try {
      const data = await fetchSettings();
      const value =
        data && data.includeImages !== undefined ? !!data.includeImages : true;
      setIncludeImagesSetting(value);
      return value;
    } catch (error) {
      console.error(error);
      if (notifyOnError) {
        onToast(
          'No se pudo cargar la configuración. Se usará generación con imágenes por defecto.',
          'warn'
        );
      }
      setIncludeImagesSetting(true);
      return true;
    }
  };

  useEffect(() => {
    loadKeywords();
    loadContentSettings();
  }, [refreshKey]);

  async function handleManualSubmit(event) {
    event.preventDefault();
    if (!manualKeyword.trim()) {
      onToast('Ingresa al menos una keyword', 'warn');
      return;
    }
    try {
      await createKeywordManual({
        keywords: manualKeyword,
        clusterName,
        projectName
      });
      onToast('Keywords agregadas', 'success');
      setManualKeyword('');
      loadKeywords();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    }
  }

  async function handleCsvUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.csv'];
    const fileName = file.name?.toLowerCase() || '';
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExtension) {
      Swal.fire({
        icon: 'error',
        title: 'Formato incorrecto',
        html:
          'Debes subir un CSV UTF-8 (delimitado por comas).<br/><br/>' +
          '<strong>Excel:</strong> Archivo → Guardar como → CSV UTF-8 (delimitado por comas).<br/>' +
          '<strong>Google Sheets:</strong> Archivo → Descargar → Valores separados por comas (.csv).',
        confirmButtonText: 'Entendido'
      });
      event.target.value = '';
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: true });
      decoder.decode(buffer);
    } catch (_decodeError) {
      Swal.fire({
        icon: 'error',
        title: 'Codificación no soportada',
        html:
          'No pudimos leer el archivo como UTF-8.<br/><br/>' +
          '<strong>Excel:</strong> Archivo → Guardar como → CSV UTF-8 (delimitado por comas).<br/>' +
          '<strong>Google Sheets:</strong> Archivo → Descargar → CSV (.csv).',
        confirmButtonText: 'Entendido'
      });
      event.target.value = '';
      return;
    }

    try {
      setCsvUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clusterName', clusterName);
      formData.append('projectName', projectName);
      await uploadKeywordsCsv(formData);
      onToast('Archivo procesado', 'success');
      loadKeywords();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setCsvUploading(false);
      event.target.value = '';
    }
  }

  async function handleGenerateAll() {
    const pending = keywords.filter((item) => item.status !== 'processed');
    if (!pending.length) {
      onToast('No hay keywords pendientes para generar articulos.', 'warn');
      return;
    }

    const shouldGenerateImages = await loadContentSettings({
      notifyOnError: true
    });

    let stopRequested = false;
    const total = pending.length;

    const updateProgress = (completed, label) => {
      const container = Swal.getHtmlContainer();
      if (!container) return;
      const progressEl = container.querySelector('#swal-progress-text');
      const detailEl = container.querySelector('#swal-current-label');
      if (progressEl) {
        progressEl.textContent = `Artículos creados ${completed} de ${total}`;
      }
      if (detailEl) {
        detailEl.textContent = label || '';
      }
    };

    Swal.fire({
      title: 'Generando artículos',
      html: `
        <p id="swal-progress-text">Artículos creados 0 de ${total}</p>
        <p id="swal-current-label" class="muted"></p>
        <button type="button" id="swal-stop-btn" class="swal2-cancel swal2-styled" style="margin-top:12px;">Detener</button>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        const popup = Swal.getPopup();
        const stopBtn = popup?.querySelector('#swal-stop-btn');
        stopBtn?.addEventListener('click', () => {
          if (stopRequested) return;
          stopRequested = true;
          stopBtn.disabled = true;
          stopBtn.textContent = 'Deteniendo...';
        });
      }
    });

    try {
      setGenerating(true);
      let processed = 0;

      for (let index = 0; index < pending.length; index += 1) {
        const keywordItem = pending[index];
        setGenerationInfo({
          total,
          current: index + 1,
          label: keywordItem.keyword_principal
        });

        updateProgress(processed, `Procesando: ${keywordItem.keyword_principal}`);

        const generationResult = await generateArticleFromKeyword(keywordItem.id, {
          projectName: keywordItem.project_name || projectName,
          generateImage: shouldGenerateImages
        });

        if (generationResult?.draft?.id) {
          if (shouldGenerateImages && generationResult.imagePreview) {
            onPreviewCacheUpdate(generationResult.draft.id, generationResult.imagePreview);
          } else if (!shouldGenerateImages) {
            onPreviewCacheUpdate(generationResult.draft.id, null);
          }
        }

        processed += 1;
        updateProgress(
          processed,
          stopRequested ? 'Deteniendo después de completar el artículo actual...' : ''
        );

        onToast(
          shouldGenerateImages
            ? `Articulo e imagen generados para "${keywordItem.keyword_principal}"`
            : `Articulo generado para "${keywordItem.keyword_principal}"`,
          'success'
        );

        if (stopRequested) {
          break;
        }
      }

      Swal.close();
      loadKeywords();

      if (stopRequested) {
        onToast(`Proceso detenido. Se generaron ${processed} de ${total} artículos.`, 'info');
      } else {
        onToast('Todos los articulos fueron generados.', 'success');
      }
    } catch (error) {
      Swal.close();
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setGenerating(false);
      setGenerationInfo(null);
    }
  }

  const pendingCount = keywords.filter((item) => item.status !== 'processed').length;

  function startEditKeyword(item) {
    setEditingKeyword({
      id: item.id,
      keyword: item.keyword_principal,
      cluster: item.cluster_name || '',
      project: item.project_name || ''
    });
  }

  function cancelEditKeyword() {
    setEditingKeyword(null);
  }

  async function handleEditSave() {
    if (!editingKeyword) return;
    if (!editingKeyword.keyword.trim()) {
      onToast('La keyword no puede estar vacia.', 'warn');
      return;
    }
    try {
      setEditSaving(true);
      await updateKeyword(editingKeyword.id, {
        keyword: editingKeyword.keyword,
        clusterName: editingKeyword.cluster,
        projectName: editingKeyword.project
      });
      onToast('Keyword actualizada', 'success');
      setEditingKeyword(null);
      loadKeywords();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteKeyword(item) {
    const confirmed = window.confirm(`Eliminar la keyword "${item.keyword_principal}"?`);
    if (!confirmed) return;
    try {
      setDeleteLoadingId(item.id);
      await deleteKeyword(item.id);
      onToast('Keyword eliminada', 'success');
      if (editingKeyword?.id === item.id) {
        setEditingKeyword(null);
      }
      loadKeywords();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setDeleteLoadingId(null);
    }
  }

  async function handleDeleteAll() {
    const result = await Swal.fire({
      title: '¿Eliminar todas las keywords?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      await deleteAllKeywords();
      onToast('Se eliminaron todas las keywords', 'success');
      setKeywords([]);
      setEditingKeyword(null);
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <header className="panel__header">
        <div>
          <h2>Keywords</h2>
          <p className="muted">Carga manual o mediante CSV / Excel. Total: {keywords.length}</p>
        </div>
        <div className="panel__header-actions">
          <button className="btn btn-ghost" onClick={loadKeywords} disabled={loading}>
            {loading ? 'Actualizando...' : 'Refrescar'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleDeleteAll}
            disabled={loading || keywords.length === 0}
          >
            Borrar todo
          </button>
        </div>
      </header>

      <div className="panel__grid">
        <form className="card" onSubmit={handleManualSubmit}>
          <h3>Cargar keywords</h3>
          <p className="muted">Admite CSV o Excel. Tambien puedes agregarlas manualmente.</p>

          <label htmlFor="keyword-input">Agregar keyword</label>
          <div className="field-row">
            <input
              id="keyword-input"
              type="text"
              placeholder="Ej: inteligencia artificial"
              value={manualKeyword}
              onChange={(event) => setManualKeyword(event.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              Agregar
            </button>
          </div>

          {/*
          <div className="field-row field-row--even">
            <div>
              <label htmlFor="cluster-input">Cluster</label>
              <input
                id="cluster-input"
                type="text"
                value={clusterName}
                onChange={(event) => setClusterName(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="project-input">Proyecto</label>
              <input
                id="project-input"
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </div>
          </div>
          */}

          <label htmlFor="csv-upload">Subir CSV / Excel</label>
          <div className="field-row">
            <input
              id="csv-upload"
              type="file"
              accept=".csv,.txt"
              onChange={handleCsvUpload}
            />
            <button
              className="btn btn-secondary"
              type="button"
              disabled={csvUploading}
              onClick={() => document.getElementById('csv-upload').click()}
            >
              {csvUploading ? 'Procesando...' : 'Seleccionar archivo'}
            </button>
          </div>
        </form>

        <div className="card keyword-card">
          <h3>Listado de Keywords</h3>
          <p className="muted">Haz clic en crear articulos para ejecutar el pipeline automatico sobre todas las pendientes.</p>

          {generationInfo && (
            <div className="generation-status">
              Generando articulos ({generationInfo.current}/{generationInfo.total}) · {generationInfo.label}
            </div>
          )}
          <div className="keyword-list">
            {loading && <p className="muted">Cargando...</p>}
            {!loading && keywords.length === 0 && (
              <p className="muted">Sin keywords registradas.</p>
            )}
            {keywords.map((keyword) => (
              <div key={keyword.id} className="keyword-item">
                {editingKeyword?.id === keyword.id ? (
                  <div className="keyword-edit">
                    <div className="keyword-edit__fields">
                      <div>
                        <label>Keyword</label>
                        <input
                          type="text"
                          value={editingKeyword.keyword}
                          onChange={(event) =>
                            setEditingKeyword((prev) => ({ ...prev, keyword: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label>Cluster</label>
                        <input
                          type="text"
                          value={editingKeyword.cluster}
                          onChange={(event) =>
                            setEditingKeyword((prev) => ({ ...prev, cluster: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label>Proyecto</label>
                        <input
                          type="text"
                          value={editingKeyword.project}
                          onChange={(event) =>
                            setEditingKeyword((prev) => ({ ...prev, project: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="keyword-actions-row">
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={cancelEditKeyword}
                        disabled={editSaving}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={handleEditSave}
                        disabled={editSaving}
                      >
                        {editSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{keyword.keyword_principal}</strong>
                      <div className="keyword-item__meta">
                        <span>{keyword.cluster_name || 'Sin cluster'}</span>
                        <span className={`status-badge status-badge--${keyword.status}`}>
                          {keyword.status}
                        </span>
                        <span>{keyword.project_name || 'Sin proyecto'}</span>
                        <span>{keyword.ideas_total} ideas</span>
                        <span>{keyword.drafts_total} drafts</span>
                      </div>
                    </div>
                    <div className="keyword-actions-row">
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => startEditKeyword(keyword)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => handleDeleteKeyword(keyword)}
                        disabled={deleteLoadingId === keyword.id}
                      >
                        {deleteLoadingId === keyword.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="keyword-actions">
            <span className="muted">{pendingCount} keywords pendientes</span>
            <span className="muted">
              {includeImagesSetting
                ? 'Se generarán artículos con imágenes'
                : 'Se generarán artículos sin imágenes'}
            </span>
            <button
              className="btn btn-primary"
              onClick={handleGenerateAll}
              disabled={generating || pendingCount === 0}
            >
              {generating ? 'Generando...' : 'Crear articulos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBadge({ label, value }) {
  return (
    <div className="summary-badge">
      <span className="summary-badge__label">{label}</span>
      <span className="summary-badge__value">{value ?? 'N/A'}</span>
    </div>
  );
}

function QASection({ qaReport }) {
  if (!qaReport) {
    return (
      <div className="card">
        <h3>Reporte QA</h3>
        <p className="muted">Este draft aun no tiene evaluacion QA.</p>
      </div>
    );
  }

  const { summary, stats, checks } = qaReport;

  return (
    <div className="card">
      <h3>Reporte QA</h3>
      {summary && (
        <div className="qa-summary">
          <SummaryBadge label="Checks" value={summary.total_checks} />
          <SummaryBadge label="OK" value={summary.passed} />
          <SummaryBadge label="Warnings" value={summary.warnings} />
          <SummaryBadge label="Fails" value={summary.failed} />
          {summary.message && <p className="qa-message">{summary.message}</p>}
        </div>
      )}
      {stats && (
        <div className="qa-stats">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="qa-stat">
              <span className="qa-stat__label">{key}</span>
              <span className="qa-stat__value">{value ?? 'N/A'}</span>
            </div>
          ))}
        </div>
      )}
      {Array.isArray(checks) && checks.length > 0 && (
        <div className="qa-checks">
          <div className="qa-checks__header">
            <span>Check</span>
            <span>Estado</span>
            <span>Mensaje</span>
          </div>
          {checks.map((check) => (
            <div key={check.id} className={`qa-check qa-check--${check.status}`}>
              <span className="qa-check__label">{check.label || check.id}</span>
              <span className="qa-check__status">{check.status}</span>
              <span>{check.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftList({ drafts, selectedId, onSelect }) {
  if (!drafts.length) {
    return (
      <div className="empty-state">
        <h3>No hay drafts en revision</h3>
        <p className="muted">Cuando existan articulos pendientes de QA apareceran aqui.</p>
      </div>
    );
  }
  return (
    <ul className="draft-list">
      {drafts.map((draft) => (
        <li
          key={draft.id}
          className={`draft-list__item ${selectedId === draft.id ? 'draft-list__item--active' : ''}`}
          onClick={() => onSelect(draft.id)}
        >
          <h3>{draft.title}</h3>
          <p className="draft-list__meta">
            {(draft.clusterName || 'Sin cluster')} - {(draft.ideaCategory || 'Sin categoria')}
          </p>
          <p className="muted">{draft.ideaTitle}</p>
          <div className="draft-list__status">
            <span className={`status-badge status-badge--${draft.status}`}>{draft.status}</span>
            <span className="muted">{draft.metaTitle}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BlogRevision({ onToast }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [action, setAction] = useState(null);
  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === selectedId) || drafts[0],
    [drafts, selectedId]
  );

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const { drafts: data } = await fetchDrafts({ limit: 50 });
      setDrafts(data || []);
      if (data?.length) {
        const stillSelected = data.find((draft) => draft.id === selectedId);
        setSelectedId(stillSelected ? stillSelected.id : data[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  async function handleApprove() {
    if (!selectedDraft) return;
    try {
      setAction('approve');
      await approveDraft(selectedDraft.id, { reviewer: 'editor' });
      onToast('Draft aprobado', 'success');
      loadDrafts();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setAction(null);
    }
  }

  async function handleReturn() {
    if (!selectedDraft) return;
    const reason = window.prompt('Motivo para solicitar cambios:', selectedDraft.rejectionReason || '');
    if (reason === null) return;
    try {
      setAction('return');
      await returnDraft(selectedDraft.id, { reviewer: 'editor', reason });
      onToast('Observaciones enviadas', 'success');
      loadDrafts();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="panel panel--two-columns">
      <div className="card">
        <header className="panel__header">
          <div>
            <h2>Revision QA</h2>
            <p className="muted">Valida metadatos, contenido y decide siguiente accion.</p>
          </div>
          <button className="btn btn-ghost" onClick={loadDrafts} disabled={loading}>
            {loading ? 'Actualizando...' : 'Refrescar'}
          </button>
        </header>
        <DraftList drafts={drafts} selectedId={selectedDraft?.id} onSelect={setSelectedId} />
      </div>

      <div className="card">
        {selectedDraft ? (
          <>
            <div className="detail__header">
              <div>
                <p className="detail__meta">{selectedDraft.clusterName || 'Sin cluster'}</p>
                <h2>{selectedDraft.title}</h2>
                <p className="detail__idea">{selectedDraft.ideaTitle}</p>
              </div>
              <div className="detail__actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleReturn}
                  disabled={action === 'return'}
                >
                  {action === 'return' ? 'Enviando...' : 'Solicitar cambios'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleApprove}
                  disabled={action === 'approve'}
                >
                  {action === 'approve' ? 'Aprobando...' : 'Aprobar'}
                </button>
              </div>
            </div>

            <div className="qa-meta-grid">
              <div>
                <h3>Metadatos</h3>
                <dl className="meta-list">
                  <dt>Meta title</dt>
                  <dd>{selectedDraft.metaTitle || 'N/A'}</dd>
                  <dt>Meta description</dt>
                  <dd>{selectedDraft.metaDescription || 'N/A'}</dd>
                  <dt>Tags</dt>
                  <dd>
                    {selectedDraft.tags?.length ? (
                      <div className="tag-list">
                        {selectedDraft.tags.map((tag) => (
                          <span className="tag" key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : 'N/A'}
                  </dd>
                </dl>
              </div>
              <QASection qaReport={selectedDraft.qaReport} />
            </div>

            <div className="card card--sub">
              <h3>Contenido</h3>
              <pre className="content-preview">{selectedDraft.contentMarkdown}</pre>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>Selecciona un draft</h3>
            <p className="muted">Elige un articulo del listado para ver sus detalles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BlogEditor({ bundle, onClose, onSaved, onRegenerated, onToast }) {
  const { keyword, idea, draft } = bundle;
  const [content, setContent] = useState(draft.contentMarkdown || draft.content_markdown || '');
  const [metaTitle, setMetaTitle] = useState(draft.metaTitle || draft.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(draft.metaDescription || draft.meta_description || '');
  const [tags, setTags] = useState((draft.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Estados de programación
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const scheduledDatetimeValue = draft.scheduledDatetime ?? draft.scheduled_datetime ?? null;
  const scheduledStatusValue = draft.scheduleStatus ?? draft.schedule_status ?? null;
  const initialScheduledDate =
    draft.scheduledDate ??
    draft.scheduled_date ??
    (scheduledDatetimeValue ? new Date(scheduledDatetimeValue).toISOString().split('T')[0] : '');
  const initialScheduledTime =
    draft.scheduledTime ??
    draft.scheduled_time ??
    (scheduledDatetimeValue ? new Date(scheduledDatetimeValue).toISOString().slice(11, 16) : '12:00');
  const hasPendingSchedule = scheduledStatusValue === 'pending' && Boolean(scheduledDatetimeValue || initialScheduledDate);
  const scheduleButtonLabel = hasPendingSchedule ? 'Reprogramar fecha' : 'Programar fecha';

  const [scheduledDate, setScheduledDate] = useState(initialScheduledDate || '');
  const [scheduledTime, setScheduledTime] = useState(initialScheduledTime || '12:00');

  const previewDataUrl = draft.preview_image_data_url ?? draft.previewImageDataUrl ?? null;
  const previewBase64 = draft.preview_image_base64 ?? draft.previewImageBase64 ?? null;
  const previewFormat = draft.preview_image_format ?? draft.previewImageFormat ?? null;
  const previewAlt = draft.preview_image_alt ?? draft.previewImageAlt ?? null;
  const previewPrompt = draft.preview_image_visual_prompt ?? draft.previewImageVisualPrompt ?? null;

  const derivedArticlePrompt = useMemo(() => deriveArticlePrompt(draft, idea), [draft, idea]);
  const derivedImagePrompt = useMemo(() => {
    return (
      previewPrompt ||
      draft.imagePromptOverride ||
      draft.image_prompt_override ||
      draft.featuredImagePrompt ||
      draft.featured_image_prompt ||
      ''
    );
  }, [draft, previewPrompt]);

  const [articlePromptValue, setArticlePromptValue] = useState(
    draft.articlePromptOverride ?? draft.article_prompt_override ?? derivedArticlePrompt ?? ''
  );
  const [imagePromptValue, setImagePromptValue] = useState(
    draft.imagePromptOverride ?? draft.image_prompt_override ?? derivedImagePrompt ?? ''
  );

  const displayImageUrl = previewDataUrl || draft.featuredImageUrl || draft.featured_image_url || null;
  const displayAltText = previewAlt || draft.featuredImageAlt || draft.featured_image_alt || 'Imagen generada';
  const isPreviewImage = Boolean(previewDataUrl);

  useEffect(() => {
    setContent(draft.contentMarkdown || draft.content_markdown || '');
    setMetaTitle(draft.metaTitle || draft.meta_title || '');
    setMetaDescription(draft.metaDescription || draft.meta_description || '');
    setTags((draft.tags || []).join(', '));
    setArticlePromptValue(draft.articlePromptOverride ?? draft.article_prompt_override ?? derivedArticlePrompt ?? '');
    setImagePromptValue(
      draft.imagePromptOverride ??
        draft.image_prompt_override ??
        previewPrompt ??
        draft.featuredImagePrompt ??
        draft.featured_image_prompt ??
        ''
    );
    setScheduledDate(initialScheduledDate || '');
    setScheduledTime(initialScheduledTime || '12:00');
    setIsDirty(false);
  }, [draft, derivedArticlePrompt, previewPrompt, initialScheduledDate, initialScheduledTime]);

  useEffect(() => {
    if (!content) return;

    const needsMetaDescription = isMetaFieldEmpty(metaDescription);
    const needsTags = isMetaFieldEmpty(tags);

    if (!needsMetaDescription && !needsTags) {
      return;
    }

    const { metaDescription: extractedDescription, tags: extractedTags } = extractMetaFromContent(content);
    let updated = false;

    if (needsMetaDescription && extractedDescription) {
      setMetaDescription(extractedDescription);
      updated = true;
    }

    if (needsTags && extractedTags) {
      setTags(extractedTags);
      updated = true;
    }

    if (updated) {
      setIsDirty(true);
    }
  }, [content, metaDescription, tags]);

  async function handleSave(options = {}) {
    const { silent = false, force = false } = options;
    if (!isDirty && !force) {
      if (!silent) {
        onToast('No hay cambios por guardar.', 'info');
      }
      return false;
    }
    try {
      setSaving(true);
      const response = await updateDraft(draft.id, {
        title: metaTitle || draft.title,
        metaTitle,
        metaDescription,
        contentMarkdown: content,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        articlePromptOverride: (articlePromptValue || '').trim() || null,
        imagePromptOverride: (imagePromptValue || '').trim() || null
      });
      if (!silent) {
        onToast('Borrador actualizado', 'success');
      }
      const nextDraft = response?.draft
        ? {
            ...response.draft,
            preview_image_data_url:
              response.draft.previewImageDataUrl ??
              draft.preview_image_data_url ??
              draft.previewImageDataUrl ??
              null,
            preview_image_base64:
              response.draft.previewImageBase64 ??
              draft.preview_image_base64 ??
              draft.previewImageBase64 ??
              null,
            preview_image_format:
              response.draft.previewImageFormat ??
              draft.preview_image_format ??
              draft.previewImageFormat ??
              null,
            preview_image_alt:
              response.draft.previewImageAlt ??
              draft.preview_image_alt ??
              draft.previewImageAlt ??
              null,
            preview_image_visual_prompt:
              response.draft.previewImageVisualPrompt ??
              draft.preview_image_visual_prompt ??
              draft.previewImageVisualPrompt ??
              null,
            article_prompt_override: (articlePromptValue || '').trim() || null,
            image_prompt_override: (imagePromptValue || '').trim() || null
          }
        : draft;
      onSaved(nextDraft);
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    try {
      setApproving(true);
      const previewImage = previewBase64 ? {
        base64: previewBase64,
        format: previewFormat,
        altText: previewAlt,
        visualPrompt: (imagePromptValue || previewPrompt || '').trim() || null
      } : null;

      await approveDraft(draft.id, {
        reviewer: 'editor',
        previewImage: previewImage || undefined
      });
      onToast('Draft aprobado', 'success');
      onClose();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setApproving(false);
    }
  }

  async function handleGenerateImage() {
    try {
      setImageGenerating(true);
      const normalizedPrompt = (imagePromptValue || previewPrompt || '').trim();
      const response = await generateDraftImage(draft.id, {
        preview_visual_prompt: normalizedPrompt || undefined
      });
      console.log('RESPONSE COMPLETA:', response);
      const preview = response.preview || {};
      console.log('PREVIEW:', preview);
      const updated = {
        ...draft,
        featured_image_url: response.draft?.featured_image_url ?? draft.featured_image_url ?? null,
        featured_image_alt: response.draft?.featured_image_alt ?? draft.featured_image_alt ?? null,
        featured_image_prompt: response.draft?.featured_image_prompt ?? draft.featured_image_prompt ?? null,
        preview_image_data_url: preview.imageDataUrl || null,
        preview_image_base64: preview.base64 || null,
        preview_image_format: preview.format || null,
        preview_image_alt: preview.altText || null,
        preview_image_visual_prompt: preview.visualPrompt || null,
        image_prompt_override: normalizedPrompt || draft.image_prompt_override || null
      };
      onSaved(updated);
      setImagePromptValue(preview.visualPrompt || normalizedPrompt || '');
      onToast('Preview de imagen generada', 'success');
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setImageGenerating(false);
    }
  }

  async function handlePublishNow() {
    if (isDirty) {
      const saved = await handleSave({ silent: true });
      if (!saved) return;
    }
    try {
      setPublishing(true);
      await approveDraft(draft.id, {
        reviewer: 'editor',
        previewImage: previewBase64 ? {
          base64: previewBase64,
          format: previewFormat,
          altText: previewAlt,
          visualPrompt: (imagePromptValue || previewPrompt || '').trim() || null
        } : undefined
      });
      const response = await publishDraftNow(draft.id);
      onToast(`Publicado exitosamente: ${response.wordpress_post_url}`, 'success');
      onClose();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setPublishing(false);
    }
  }

  async function handleSchedule() {
    if (!scheduledDate) {
      onToast('Selecciona una fecha', 'error');
      return;
    }
    const normalizedTime = scheduledTime || '12:00';
    const selectedDateTime = new Date(`${scheduledDate}T${normalizedTime}`);
    if (selectedDateTime <= new Date()) {
      await Swal.fire({
        icon: 'error',
        title: 'Fecha inválida',
        text: 'Selecciona una fecha y hora futura.'
      });
      return;
    }
    if (hasPendingSchedule) {
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: 'Reprogramar publicación',
        text: 'Esto reemplazará la fecha programada anteriormente. ¿Deseas continuar?',
        showCancelButton: true,
        confirmButtonText: 'Sí, reprogramar',
        cancelButtonText: 'Cancelar',
        focusCancel: true
      });
      if (!confirmation.isConfirmed) {
        return;
      }
    }
    if (isDirty) {
      const saved = await handleSave({ silent: true });
      if (!saved) return;
    }
    try {
      setScheduling(true);
      const response = await scheduleDraft(draft.id, {
        scheduled_date: scheduledDate,
        scheduled_time: normalizedTime,
        created_by: 'editor'
      });

      const schedule = response?.schedule || {};
      const nextDraft = {
        ...draft,
        scheduledDate: schedule.scheduled_date || schedule.scheduledDate || scheduledDate,
        scheduledTime: schedule.scheduled_time || schedule.scheduledTime || normalizedTime,
        scheduledDatetime:
          schedule.scheduled_datetime || schedule.scheduledDatetime || `${scheduledDate}T${normalizedTime}`,
        scheduleStatus: schedule.status || 'pending'
      };

      setScheduledDate(nextDraft.scheduledDate || scheduledDate);
      setScheduledTime(nextDraft.scheduledTime || normalizedTime);
      onSaved(nextDraft);
      onToast(response?.message || `${hasPendingSchedule ? 'Reprogramado' : 'Programado'} para ${scheduledDate} ${normalizedTime}`, 'success');
      onClose();
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setScheduling(false);
    }
  }

  async function handleRegenerate() {
    const promptToUse = (articlePromptValue || '').trim();
    if (!promptToUse) {
      onToast('Debes escribir un prompt para regenerar el artículo.', 'error');
      return;
    }
    if (isDirty) {
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: '¿Reemplazar el contenido actual?',
        text: 'Perderás los cambios no guardados si generas un artículo nuevo.',
        confirmButtonText: 'Sí, regenerar',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        focusCancel: true
      });
      if (!confirmation.isConfirmed) {
        return;
      }
    }
    try {
      setRegenerating(true);
      await updateDraft(draft.id, {
        articlePromptOverride: promptToUse || null
      });

      const regenerated = await regenerateDraftManual(draft.id, {
        prompt: promptToUse
      });

      onToast('Contenido regenerado', 'success');

      const normalized = regenerated?.draft
        ? {
            keyword: keyword || null,
            idea: idea || null,
            draft: {
              ...regenerated.draft,
              preview_image_data_url: null,
              preview_image_base64: null,
              preview_image_format: null,
              preview_image_alt: null,
              preview_image_visual_prompt: null
            }
          }
        : { keyword: keyword || null, idea: idea || null, draft };

      onRegenerated(normalized);
      setIsDirty(false);
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setRegenerating(false);
    }
  }

  // Determinar el estado de publicación
  const getPublicationStatus = () => {
    if (draft.publishedAt) {
      const publishDate = new Date(draft.publishedAt);
      return {
        status: 'published',
        label: 'Publicado',
        date: publishDate.toLocaleString('es-ES', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        }),
        url: draft.wordpressPostUrl
      };
    }
    
    if (draft.scheduledDatetime) {
      const scheduleDate = new Date(draft.scheduledDatetime);
      return {
        status: 'scheduled',
        label: 'Programado para',
        date: scheduleDate.toLocaleString('es-ES', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        })
      };
    }
    
    return { status: 'draft', label: 'Borrador sin publicar' };
  };

  const publicationInfo = getPublicationStatus();

  return (
    <div className="editor-overlay">
      <div className="editor-panel">
        <header className="editor-header">
          <div className="editor-header__main">
            <div className="editor-header__title">
              <h2>Editar Artículo</h2>
              <div className={`publication-status publication-status--${publicationInfo.status}`}>
                <span className="publication-status__label">{publicationInfo.label}</span>
                {publicationInfo.date && (
                  <span className="publication-status__date">{publicationInfo.date}</span>
                )}
                {publicationInfo.url && (
                  <a 
                    href={publicationInfo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="publication-status__link"
                  >
                    Ver en WordPress
                  </a>
                )}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </header>

        <div className="editor-body">
          <section className="editor-content">
            <label htmlFor="editor-content-textarea">Contenido</label>
            <textarea
              id="editor-content-textarea"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setIsDirty(true);
              }}
            />
            <div className="article-prompt-block">
              <label>Prompt de Artículo</label>
              <textarea
                className="small-textarea"
                value={articlePromptValue}
                onChange={(event) => {
                  setArticlePromptValue(event.target.value);
                  setIsDirty(true);
                }}
              />
            </div>
            <div className="article-prompt-actions">
              <button
                className="btn btn-secondary"
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? 'Generando...' : 'Generar nuevamente'}
              </button>
            </div>
          </section>

          <section className="editor-sidebar">
            <h3>Metadatos</h3>
            <div className="card card--sub">
              <label>Meta Título</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(event) => {
                  setMetaTitle(event.target.value);
                  setIsDirty(true);
                }}
              />

              <label>Meta Descripción</label>
              <textarea
                className="small-textarea"
                value={metaDescription}
                onChange={(event) => {
                  setMetaDescription(event.target.value);
                  setIsDirty(true);
                }}
              />

              <label>Palabras Clave</label>
              <input
                type="text"
                value={tags}
                onChange={(event) => {
                  setTags(event.target.value);
                  setIsDirty(true);
                }}
              />
            </div>

            <h3>Imagen Principal</h3>
            <div className="card card--sub">
              {displayImageUrl ? (
                <>
                  <img
                    src={displayImageUrl}
                    alt={displayAltText}
                    className="hero-image"
                  />
                  {isPreviewImage && (
                    <p className="muted small">
                      Preview temporal. La imagen se subira a WordPress cuando apruebes el articulo.
                    </p>
                  )}
                </>
              ) : (
                <p className="muted">Aun no se ha generado una imagen para este articulo.</p>
              )}
              
              <label>Prompt de imagen</label>
              <textarea
                className="small-textarea"
                value={imagePromptValue}
                placeholder="Aún no se genera una imagen para este artículo."
                onChange={(event) => {
                  setImagePromptValue(event.target.value);
                  setIsDirty(true);
                }}
              />
              
            </div>
            <button
                className="btn btn-secondary btn-generate-image"
                type="button"
                onClick={handleGenerateImage}
                disabled={imageGenerating}
              >
                {imageGenerating ? 'Generando...' : 'Generar Imagen'}
              </button>
          </section>
        </div>

        <footer className="editor-footer">
          <div className="footer-publish-actions">
            <button
              className="btn btn-publish-now"
              onClick={handlePublishNow}
              disabled={publishing || !draft.id}
            >
              {publishing ? 'Publicando...' : 'Publicar Ahora'}
            </button>
            <button
              className="btn btn-schedule"
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              disabled={scheduling}
            >
              {scheduleButtonLabel}
            </button>
            {showScheduleForm && (
              <div className="schedule-inline-form">
                <div className="form-group">
                  <label htmlFor="scheduled-date">Fecha</label>
                  <input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="scheduled-time">Hora</label>
                  <input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleSchedule}
                  disabled={scheduling || !scheduledDate}
                >
                  {scheduling ? 'Programando...' : 'Confirmar'}
                </button>
              </div>
            )}
          </div>
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-secondary" disabled>Eliminar</button>
          <button className="btn btn-secondary" onClick={() => handleSave()} disabled={saving || !isDirty}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn btn-primary" onClick={handleApprove} disabled={approving}>
            {approving ? 'Aprobando...' : 'Aprobar'}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState('blog');
  const [activeBlogTab, setActiveBlogTab] = useState('keywords');
  const [editorBundle, setEditorBundle] = useState(null);
  const [toast, setToast] = useState(null);
  const [keywordsRefreshKey, setKeywordsRefreshKey] = useState(0);
  const [draftPreviewCache, setDraftPreviewCache] = useState({});

  useEffect(() => {
    if (!ENABLE_SCHEDULER_LOGS) {
      return undefined;
    }
    let isMounted = true;
    let lastTimestamp = null;

    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/scheduler/logs');
        if (!response.ok) return;
        const data = await response.json();
        if (!isMounted) return;
        const logs = Array.isArray(data?.logs) ? data.logs : [];
        let entries = logs;
        if (lastTimestamp) {
          const lastTime = new Date(lastTimestamp).getTime();
          entries = logs.filter((log) => new Date(log.timestamp).getTime() > lastTime);
        }
        if (entries.length) {
          entries.forEach((entry) => {
            const prefix = `[Scheduler][${(entry.level || 'info').toUpperCase()}] ${entry.message}`;
            const details = entry.meta && Object.keys(entry.meta).length ? entry.meta : undefined;
            if (entry.level === 'error') {
              console.error(prefix, details);
            } else {
              console.log(prefix, details);
            }
          });
          lastTimestamp = entries[entries.length - 1].timestamp;
        }
      } catch (error) {
        if (isMounted) {
          console.warn('[scheduler] log fetch error', error);
        }
      }
    };

    fetchLogs();
    const intervalId = setInterval(fetchLogs, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const updatePreviewCache = useCallback((draftId, preview) => {
    if (!draftId) return;
    setDraftPreviewCache((prev) => {
      const normalized = normalizePreviewPayload(preview);
      if (!normalized) {
        if (!prev[draftId]) return prev;
        const { [draftId]: _removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [draftId]: normalized
      };
    });
  }, []);

  function showToast(message, variant = 'info') {
    setToast({ message, variant });
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(null), 4000);
  }

  function requestKeywordsRefresh() {
    setKeywordsRefreshKey((key) => key + 1);
  }

  async function handleOpenEditor(bundle) {
    if (!bundle?.draft?.id) return;
    try {
      const latestDraft = await fetchDraftById(bundle.draft.id);
      const cachedPreview = draftPreviewCache[bundle.draft.id];
      const draftWithPreview = cachedPreview
        ? { ...latestDraft, ...cachedPreview }
        : latestDraft;
      setEditorBundle({ ...bundle, draft: draftWithPreview });
    } catch (error) {
      console.warn('[ui] No se pudo refrescar el draft, usando datos locales', error);
      const cachedPreview = draftPreviewCache[bundle.draft.id];
      const draftWithPreview = cachedPreview
        ? { ...bundle.draft, ...cachedPreview }
        : bundle.draft;
      setEditorBundle({ ...bundle, draft: draftWithPreview });
    }
  }

  function handleCloseEditor() {
    setEditorBundle(null);
  }

  let blogContent = null;
  if (activeBlogTab === 'keywords') {
    blogContent = (
      <BlogKeywords
        onOpenEditor={handleOpenEditor}
        onToast={showToast}
        refreshKey={keywordsRefreshKey}
        onPreviewCacheUpdate={updatePreviewCache}
      />
    );
  } else if (activeBlogTab === 'revision') {
    blogContent = <BlogRevision onToast={showToast} />;
  } else if (activeBlogTab === 'configuracion') {
    blogContent = <BlogConfiguracion onToast={showToast} />;
  } else if (activeBlogTab === 'programacion') {
    blogContent = <BlogCalendario onToast={showToast} onOpenEditor={handleOpenEditor} />;
  } else {
    blogContent = (
      <div className="panel">
        <header className="panel__header">
          <h2>{BLOG_TABS.find((tab) => tab.id === activeBlogTab)?.label || 'Seccion'}</h2>
        </header>
        <div className="empty-state">
          <h3>En construccion</h3>
          <p className="muted">Esta seccion estara disponible proximamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="sidebar__brand">MarketAI</h1>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar__item ${activeNav === item.id ? 'sidebar__item--active' : ''}`}
              disabled={item.disabled}
              onClick={() => setActiveNav(item.id)}
            >
              {item.label}
              {item.disabled && <span className="badge">Pronto</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="main__header">
          <div>
            <p className="muted">Panel de contenidos</p>
            <h2>{NAV_ITEMS.find((item) => item.id === activeNav)?.label || 'Blog'}</h2>
          </div>
        </header>

        {activeNav === 'blog' && (
          <div className="tabs">
            {BLOG_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeBlogTab === tab.id ? 'tab--active' : ''}`}
                disabled={tab.disabled}
                onClick={() => setActiveBlogTab(tab.id)}
              >
                {tab.label}
                {tab.disabled && <span className="badge badge--ghost">Pronto</span>}
              </button>
            ))}
          </div>
        )}

        <div className="main__content">
          {activeNav === 'blog' ? blogContent : (
            <div className="panel">
              <div className="empty-state">
                <h3>Seccion en construccion</h3>
                <p className="muted">Selecciona Blog para acceder al flujo disponible.</p>
              </div>
            </div>
          )}
        </div>

        <Toast toast={toast} />
      </main>

      {editorBundle && (
        <BlogEditor
          bundle={editorBundle}
          onClose={handleCloseEditor}
          onSaved={(updatedDraft) => {
            if (updatedDraft?.id) {
              updatePreviewCache(updatedDraft.id, updatedDraft);
            }
            setEditorBundle((prev) => (prev ? { ...prev, draft: updatedDraft } : prev));
            requestKeywordsRefresh();
          }}
          onRegenerated={(nextBundle) => {
            if (nextBundle?.draft?.id) {
              updatePreviewCache(nextBundle.draft.id, nextBundle.draft);
            }
            setEditorBundle(nextBundle);
            requestKeywordsRefresh();
          }}
          onToast={showToast}
        />
      )}
    </div>
  );
}
