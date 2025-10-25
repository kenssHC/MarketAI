import { useEffect, useMemo, useState } from 'react';
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
  generateDraftImage
} from './api';
import './app.css';

const NAV_ITEMS = [
  //{ id: 'marketing', label: 'Marketing', disabled: true },
  //{ id: 'campaigns', label: 'Campanas', disabled: true },
  { id: 'blog', label: 'Blog', disabled: false },
  //{ id: 'social', label: 'Redes Sociales', disabled: true },
  //{ id: 'crm', label: 'CRM', disabled: true }
];

const BLOG_TABS = [
  { id: 'keywords', label: 'Keywords' },
  { id: 'revision', label: 'Revision QA' },
  //{ id: 'programacion', label: 'Programacion', disabled: true },
  //{ id: 'configuracion', label: 'Configuracion', disabled: true }
];

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.variant || 'info'}`}>
      {toast.message}
    </div>
  );
}

function BlogKeywords({ onOpenEditor, onToast, refreshKey }) {
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

  useEffect(() => {
    loadKeywords();
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

    try {
      setGenerating(true);
      let lastBundle = null;

      for (let index = 0; index < pending.length; index += 1) {
        const keywordItem = pending[index];
        setGenerationInfo({
          total: pending.length,
          current: index + 1,
          label: keywordItem.keyword_principal
        });

        const result = await generateArticleFromKeyword(keywordItem.id, {
          projectName: keywordItem.project_name || projectName
        });

        lastBundle = result;
        onToast(`Articulo generado para "${keywordItem.keyword_principal}"`, 'success');
      }

      loadKeywords();
      if (lastBundle) {
        onOpenEditor(lastBundle);
      }
    } catch (error) {
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
    const confirmed = window.confirm('Eliminar TODAS las keywords? Esta accion no se puede deshacer.');
    if (!confirmed) return;
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
  const [content, setContent] = useState(draft.content_markdown || '');
  const [metaTitle, setMetaTitle] = useState(draft.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(draft.meta_description || '');
  const [tags, setTags] = useState((draft.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);

  const displayImageUrl = draft.preview_image_data_url || draft.featured_image_url || null;
  const displayAltText = draft.preview_image_alt || draft.featured_image_alt || 'Imagen generada';
  const displayPrompt = draft.preview_image_visual_prompt || draft.featured_image_prompt || '';
  const isPreviewImage = Boolean(draft.preview_image_data_url);

  useEffect(() => {
    setContent(draft.content_markdown || '');
    setMetaTitle(draft.meta_title || '');
    setMetaDescription(draft.meta_description || '');
    setTags((draft.tags || []).join(', '));
  }, [draft]);

  async function handleSave() {
    try {
      setSaving(true);
      const response = await updateDraft(draft.id, {
        title: metaTitle || draft.title,
        metaTitle,
        metaDescription,
        contentMarkdown: content,
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      });
      onToast('Borrador actualizado', 'success');
      const nextDraft = response?.draft
        ? {
            ...response.draft,
            preview_image_data_url: draft.preview_image_data_url || null,
            preview_image_base64: draft.preview_image_base64 || null,
            preview_image_format: draft.preview_image_format || null,
            preview_image_alt: draft.preview_image_alt || null,
            preview_image_visual_prompt: draft.preview_image_visual_prompt || null
          }
        : draft;
      onSaved(nextDraft);
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    try {
      setApproving(true);
      const previewImage = draft.preview_image_base64 ? {
        base64: draft.preview_image_base64,
        format: draft.preview_image_format,
        altText: draft.preview_image_alt,
        visualPrompt: draft.preview_image_visual_prompt
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
      const response = await generateDraftImage(draft.id);
      const preview = response.preview || {};
      const updated = {
        ...draft,
        featured_image_url: response.draft?.featured_image_url ?? draft.featured_image_url ?? null,
        featured_image_alt: response.draft?.featured_image_alt ?? draft.featured_image_alt ?? null,
        featured_image_prompt: response.draft?.featured_image_prompt ?? draft.featured_image_prompt ?? null,
        preview_image_data_url: preview.imageDataUrl || null,
        preview_image_base64: preview.base64 || null,
        preview_image_format: preview.format || null,
        preview_image_alt: preview.altText || null,
        preview_image_visual_prompt: preview.visualPrompt || null
      };
      onSaved(updated);
      onToast('Preview de imagen generada', 'success');
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setImageGenerating(false);
    }
  }

  async function handleRegenerate() {
    try {
      setRegenerating(true);
      const regenerated = await generateArticleFromKeyword(keyword.id, {
        projectName: keyword.project_name
      });
      onToast('Contenido regenerado', 'success');
      const normalized = regenerated?.draft
        ? {
            ...regenerated,
            draft: {
              ...regenerated.draft,
              preview_image_data_url: null,
              preview_image_base64: null,
              preview_image_format: null,
              preview_image_alt: null,
              preview_image_visual_prompt: null
            }
          }
        : regenerated;
      onRegenerated(normalized);
    } catch (error) {
      console.error(error);
      onToast(error.message, 'error');
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="editor-overlay">
      <div className="editor-panel">
        <header className="editor-header">
          <div>
            <h2>Editar articulo</h2>
            <p className="muted">
              Keyword: {keyword.keyword_principal} - Idea: {idea.idea_title}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </header>

        <div className="editor-body">
          <section className="editor-content">
            <label htmlFor="editor-content-textarea">Contenido</label>
            <textarea
              id="editor-content-textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <div className="editor-actions">
              <button
                className="btn btn-secondary"
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? 'Generando...' : 'Generar de nuevo'}
              </button>
            </div>
          </section>

          <section className="editor-sidebar">
            <div className="card card--sub">
              <h3>Metadatos</h3>
              <label>Meta titulo</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(event) => setMetaTitle(event.target.value)}
              />

              <label>Meta descripcion</label>
              <textarea
                className="small-textarea"
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
              />

              <label>Palabras clave (separadas por coma)</label>
              <input
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </div>

            <div className="card card--sub">
              <h3>Imagen principal</h3>
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
              <label>Alt text</label>
              <textarea
                className="small-textarea"
                value={displayAltText}
                readOnly
              />
              <label>Prompt de imagen</label>
              <textarea
                className="small-textarea"
                value={displayPrompt}
                readOnly
              />
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleGenerateImage}
                disabled={imageGenerating}
              >
                {imageGenerating ? 'Generando...' : 'Generar imagen'}
              </button>
            </div>
          </section>
        </div>

        <footer className="editor-footer">
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-secondary" disabled>Eliminar</button>
          <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
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

  function showToast(message, variant = 'info') {
    setToast({ message, variant });
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(null), 4000);
  }

  function requestKeywordsRefresh() {
    setKeywordsRefreshKey((key) => key + 1);
  }

  function handleOpenEditor(bundle) {
    if (!bundle?.draft) return;
    setEditorBundle(bundle);
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
      />
    );
  } else if (activeBlogTab === 'revision') {
    blogContent = <BlogRevision onToast={showToast} />;
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
          onSaved={(draft) => {
            setEditorBundle((prev) => (prev ? { ...prev, draft } : prev));
            requestKeywordsRefresh();
          }}
          onRegenerated={(bundle) => {
            setEditorBundle(bundle);
            requestKeywordsRefresh();
          }}
          onToast={showToast}
        />
      )}
    </div>
  );
}
