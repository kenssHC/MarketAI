import { useEffect, useMemo, useState } from 'react';
import { approveDraft, fetchDrafts, returnDraft } from './api';
import './app.css';

const DEFAULT_FILTERS = {
  search: '',
  limit: 25
};

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
        <h3>QA SEO</h3>
        <p className="muted">No hay reporte de QA para este draft.</p>
      </div>
    );
  }

  const { summary, stats, checks } = qaReport;

  return (
    <div className="card">
      <h3>QA SEO</h3>
      {summary && (
        <div className="qa-summary">
          <SummaryBadge label="Total checks" value={summary.total_checks} />
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

function DraftDetail({ draft, onApprove, onReturn, loadingAction }) {
  if (!draft) {
    return (
      <div className="empty-state">
        <h2>Selecciona un draft</h2>
        <p>Elige un draft de la lista para revisar sus detalles y aplicar decisiones editoriales.</p>
      </div>
    );
  }

  return (
    <div className="detail">
      <header className="detail__header">
        <div>
          <p className="detail__meta">
            {draft.projectName ? `${draft.projectName} - ` : ''}
            {draft.clusterName || 'Sin cluster'}
          </p>
          <h2>{draft.title}</h2>
          <p className="detail__idea">{draft.ideaTitle}</p>
        </div>
        <div className="detail__actions">
          <button
            className="btn btn-secondary"
            onClick={onReturn}
            disabled={loadingAction}
          >
            {loadingAction === 'return' ? 'Enviando...' : 'Solicitar cambios'}
          </button>
          <button
            className="btn btn-primary"
            onClick={onApprove}
            disabled={loadingAction}
          >
            {loadingAction === 'approve' ? 'Aprobando...' : 'Aprobar'}
          </button>
        </div>
      </header>

      <div className="grid">
        <div className="card">
          <h3>Metadatos</h3>
          <dl className="meta-list">
            <dt>Meta Title</dt>
            <dd>{draft.metaTitle || 'N/A'}</dd>
            <dt>Meta Description</dt>
            <dd>{draft.metaDescription || 'N/A'}</dd>
            <dt>Tags</dt>
            <dd>
              {draft.tags?.length ? (
                <div className="tag-list">
                  {draft.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              ) : 'N/A'}
            </dd>
            <dt>Palabra clave principal</dt>
            <dd>{draft.keywordPrincipal || 'N/A'}</dd>
            <dt>Estado</dt>
            <dd>{draft.status}</dd>
            {draft.rejectionReason && (
              <>
                <dt>Ultima observacion</dt>
                <dd>{draft.rejectionReason}</dd>
              </>
            )}
          </dl>
        </div>

        <QASection qaReport={draft.qaReport} />

        {draft.featuredImageUrl && (
          <div className="card">
            <h3>Imagen destacada</h3>
            <img
              src={draft.featuredImageUrl}
              alt={draft.featuredImageAlt || 'Imagen generada'}
              className="hero-image"
            />
            <dl className="meta-list">
              <dt>Alt text</dt>
            <dd>{draft.featuredImageAlt || 'N/A'}</dd>
              <dt>Prompt</dt>
              <dd className="mono">{draft.featuredImagePrompt || 'N/A'}</dd>
            </dl>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Contenido</h3>
        <pre className="content-preview">{draft.contentMarkdown}</pre>
      </div>

      {(draft.linkedinCopy || draft.facebookCopy) && (
        <div className="card">
          <h3>Copys preparados</h3>
          <dl className="meta-list">
            {draft.linkedinCopy && (
              <>
                <dt>LinkedIn</dt>
                <dd>{draft.linkedinCopy}</dd>
              </>
            )}
            {draft.facebookCopy && (
              <>
                <dt>Facebook</dt>
                <dd>{draft.facebookCopy}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function DraftList({ drafts, selectedId, onSelect }) {
  if (drafts.length === 0) {
    return (
      <div className="empty-state">
        <h2>No hay drafts listos</h2>
        <p>Cuando los workflows generen articulos y aprueben QA, aparecera aqui automaticamente.</p>
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
            {draft.clusterName || 'Sin cluster'}
            {' - '}
            {draft.ideaCategory}
            {' - '}
            {draft.wordCount ? `${draft.wordCount} palabras` : 'Sin conteo'}
          </p>
          <p className="draft-list__idea">{draft.ideaTitle}</p>
          <div className="draft-list__status">
            <span className={`status-badge status-badge--${draft.status}`}>{draft.status}</span>
            {draft.qaReport?.summary?.message && (
              <span className="muted">{draft.qaReport.summary.message}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === selectedId) || drafts[0],
    [drafts, selectedId]
  );

  useEffect(() => {
    loadDrafts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDrafts(customFilters = filters) {
    try {
      setLoading(true);
      setError(null);
      const { drafts: data } = await fetchDrafts(customFilters);
      setDrafts(data);
      if (data.length > 0) {
        const stillSelected = data.find((draft) => draft.id === selectedId);
        setSelectedId(stillSelected ? stillSelected.id : data[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedDraft) return;
    const notes = window.prompt('Notas para la aprobacion (opcional):', '');
    try {
      setActionLoading('approve');
      await approveDraft(selectedDraft.id, { reviewer: 'editor', notes });
      await loadDrafts();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReturn() {
    if (!selectedDraft) return;
    const reason = window.prompt('Describe el motivo para solicitar cambios:', selectedDraft.rejectionReason || '');
    if (reason === null) return;
    try {
      setActionLoading('return');
      await returnDraft(selectedDraft.id, { reviewer: 'editor', reason });
      await loadDrafts();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  function handleSearchChange(event) {
    const nextFilters = { ...filters, search: event.target.value };
    setFilters(nextFilters);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    loadDrafts(filters);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <header className="sidebar__header">
          <h1>QA & Aprobacion</h1>
          <p className="muted">Revisa y decide que drafts avanzan a publicacion.</p>
        </header>

        <form className="search-form" onSubmit={handleSearchSubmit}>
          <label htmlFor="search">Buscar</label>
          <input
            id="search"
            type="search"
            placeholder="Titulo, cluster, keyword..."
            value={filters.search}
            onChange={handleSearchChange}
          />
          <div className="search-form__actions">
            <button type="submit" className="btn btn-small">Buscar</button>
            <button
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                loadDrafts(DEFAULT_FILTERS);
              }}
            >
              Limpiar
            </button>
          </div>
        </form>

        <button
          className="btn btn-ghost btn-refresh"
          type="button"
          onClick={() => loadDrafts()}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Refrescar lista'}
        </button>

        {error && <p className="error">{error}</p>}

        <DraftList drafts={drafts} selectedId={selectedDraft?.id} onSelect={setSelectedId} />
      </aside>

      <main className="content">
        {loading && drafts.length === 0 ? (
          <div className="empty-state">
            <h2>Cargando drafts...</h2>
          </div>
        ) : (
          <DraftDetail
            draft={selectedDraft}
            onApprove={handleApprove}
            onReturn={handleReturn}
            loadingAction={actionLoading}
          />
        )}
      </main>
    </div>
  );
}
