import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ASPECTS } from '@engine/brand';
import { FIELD_GROUPS, FIELD_MAP } from '@engine/fields';
import { contentScore, fieldsForTemplate, getImage, mergeContent } from '@engine/content';
import { exportFlyer } from '@engine/export';
import { CATEGORY_LABELS } from '@engine/templates';
import type { FlyerContent, Template } from '@engine/types';
import { api } from '../api';
import { useApp, useLocalDraft } from '../store';
import { FlyerCanvas } from '../components/FlyerCanvas';
import { TemplateThumb } from '../components/TemplateThumb';
import { FieldEditor } from '../components/FieldEditor';
import { ImagePicker } from '../components/ImagePicker';

interface Draft {
  templateId: string;
  content: FlyerContent;
  name: string;
}

/**
 * The Studio — the one screen a staff member needs.
 *
 * Pick a template, type the information, watch the flyer build itself.
 */
export function Studio() {
  const { brand, templates, user, notify, media } = useApp();
  const [draft, setDraft] = useLocalDraft<Draft>('flyer-studio:draft', {
    templateId: 'admissions-open',
    content: {},
    name: '',
  });
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState<{ suggestedTemplateId: string; notes: string[]; content: FlyerContent } | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const activeTemplates = useMemo(() => templates.filter((t) => t.active), [templates]);
  const template: Template = useMemo(
    () => templates.find((t) => t.id === draft.templateId) ?? activeTemplates[0] ?? templates[0],
    [templates, draft.templateId, activeTemplates],
  );

  const fields = useMemo(() => (template ? fieldsForTemplate(template) : []), [template]);
  const grouped = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const key of fields) {
      const group = FIELD_MAP[key]?.group ?? 'Other';
      groups.set(group, [...(groups.get(group) ?? []), key]);
    }
    return groups;
  }, [fields]);

  const score = useMemo(
    () => (template ? contentScore(template, draft.content) : { filled: 0, total: 0 }),
    [template, draft.content],
  );

  const assets = useMemo(() => {
    const map: Record<string, { width: number; height: number }> = {};
    for (const item of media) map[item.url] = { width: item.width, height: item.height };
    if (brand.logoUrl && brand.logoWidth && brand.logoHeight) {
      map[brand.logoUrl] = { width: brand.logoWidth, height: brand.logoHeight };
    }
    return map;
  }, [media, brand.logoUrl, brand.logoWidth, brand.logoHeight]);

  const setField = useCallback(
    (key: string, value: FlyerContent[string]) => {
      setDraft((prev) => {
        const next = { ...prev.content };
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) delete next[key];
        else next[key] = value;
        return { ...prev, content: next };
      });
    },
    [setDraft],
  );

  const selectTemplate = useCallback(
    (id: string) => {
      setDraft((prev) => ({ ...prev, templateId: id }));
    },
    [setDraft],
  );

  const runAiAssist = useCallback(async () => {
    if (!aiText.trim() || !user) return;
    setAiBusy(true);
    try {
      const result = await api.post<{
        content: FlyerContent;
        detectedType: string;
        suggestedTemplateId: string;
        notes: string[];
      }>('/ai/parse', { text: aiText });
      setAiResult(result);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not read that text.');
    } finally {
      setAiBusy(false);
    }
  }, [aiText, user, notify]);

  const applyAiResult = useCallback(
    (alsoSwitchTemplate: boolean) => {
      if (!aiResult) return;
      setDraft((prev) => ({
        ...prev,
        content: mergeContent(prev.content, aiResult.content),
        templateId: alsoSwitchTemplate ? aiResult.suggestedTemplateId : prev.templateId,
      }));
      setAiResult(null);
      setAiText('');
      notify('Details added to your flyer.');
    },
    [aiResult, setDraft, notify],
  );

  const handleExport = useCallback(
    async (format: 'png' | 'jpg' | 'pdf') => {
      if (!template) return;
      setExporting(format);
      try {
        await exportFlyer({
          template,
          brand,
          content: draft.content,
          format,
          scale: format === 'pdf' ? 2 : 2,
          fileName: draft.name || template.name,
          assets,
        });
        notify(`Flyer exported as ${format.toUpperCase()}.`);
      } catch (error) {
        notify(error instanceof Error ? error.message : 'The export failed.');
      } finally {
        setExporting(null);
      }
    },
    [template, brand, draft.content, draft.name, assets, notify],
  );

  const saveDraft = useCallback(async () => {
    if (!user || !template) return;
    try {
      const record = await api.post('/flyers', {
        name: draft.name || `${template.name} flyer`,
        templateId: template.id,
        content: draft.content,
      });
      notify('Flyer saved to your drafts.');
      void record;
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the flyer.');
    }
  }, [user, template, draft, notify]);

  if (!template) {
    return (
      <div className="empty-state">
        <h2>No templates yet</h2>
        <p>An administrator needs to publish at least one template before flyers can be made.</p>
      </div>
    );
  }

  const aspect = ASPECTS[template.aspect];
  const previewTemplates = showAllTemplates ? activeTemplates : activeTemplates.slice(0, 8);

  return (
    <div className="studio">
      <aside className="studio__panel">
        <section className="panel">
          <header className="panel__head">
            <h2>
              <span className="step">1</span> Choose a template
            </h2>
            <p className="panel__hint">{template.description}</p>
          </header>

          <div className="template-strip">
            {previewTemplates.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`template-chip${item.id === template.id ? ' is-active' : ''}`}
                onClick={() => selectTemplate(item.id)}
              >
                <TemplateThumb template={item} brand={brand} />
                <span className="template-chip__label">{item.name}</span>
                <span className="template-chip__meta">{CATEGORY_LABELS[item.category]}</span>
              </button>
            ))}
          </div>

          <div className="panel__foot">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setShowAllTemplates((open) => !open)}
            >
              {showAllTemplates ? 'Show fewer' : `Browse all ${activeTemplates.length} templates`}
            </button>
            <Link className="btn btn--ghost btn--sm" to="/templates">
              Full gallery
            </Link>
          </div>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2>
              <span className="step">2</span> Add the details
            </h2>
            <p className="panel__hint">
              Only the fields this template uses are shown. Leave anything blank and the design closes
              that section for you.
            </p>
            <div className="progress" aria-label={`${score.filled} of ${score.total} details filled`}>
              <div className="progress__bar" style={{ width: `${score.total ? (score.filled / score.total) * 100 : 0}%` }} />
            </div>
          </header>

          {user ? (
            <div className="ai-box">
              <details>
                <summary>
                  <span className="ai-box__title">Write it in your own words</span>
                  <span className="ai-box__sub">Paste a message and we will fill the flyer in</span>
                </summary>
                <textarea
                  className="input input--area"
                  rows={4}
                  placeholder="e.g. Admissions are now open for our January intake. Applications close on 20 December. Call 0712 345 678."
                  value={aiText}
                  onChange={(event) => setAiText(event.target.value)}
                />
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => void runAiAssist()}
                  disabled={aiBusy || !aiText.trim()}
                >
                  {aiBusy ? 'Reading…' : 'Fill in the details'}
                </button>
                {aiResult ? (
                  <div className="ai-result">
                    <p className="ai-result__line">
                      Suggested template:{' '}
                      <strong>
                        {templates.find((t) => t.id === aiResult.suggestedTemplateId)?.name ?? 'Custom'}
                      </strong>
                    </p>
                    {aiResult.notes.length ? (
                      <ul className="ai-result__notes">
                        {aiResult.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="ai-result__actions">
                      <button type="button" className="btn btn--primary btn--sm" onClick={() => applyAiResult(true)}>
                        Use these details
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => applyAiResult(false)}>
                        Fill details only
                      </button>
                    </div>
                  </div>
                ) : null}
              </details>
            </div>
          ) : null}

          <div className="field-groups">
            {FIELD_GROUPS.filter((group) => grouped.has(group)).map((group) => (
              <div className="field-group" key={group}>
                <h3 className="field-group__title">{group}</h3>
                {grouped.get(group)!.map((key) => {
                  const def = FIELD_MAP[key];
                  if (!def) return null;
                  const id = `field-${key}`;
                  const isImage = def.type === 'image';
                  return (
                    <div className="field" key={key}>
                      <label className="field__label" htmlFor={id}>
                        {def.label}
                        {def.headline ? <span className="field__badge">key</span> : null}
                      </label>
                      {isImage ? (
                        <ImagePicker value={getImage(draft.content, key)} onChange={(value) => setField(key, value)} />
                      ) : (
                        <FieldEditor
                          id={id}
                          fieldKey={key}
                          value={draft.content[key]}
                          onChange={(value) => setField(key, value)}
                        />
                      )}
                      {def.help ? <p className="field__help">{def.help}</p> : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="panel__foot">
            <label className="field__label" htmlFor="flyer-name">
              Flyer name <span className="field__optional">(for your files)</span>
            </label>
            <input
              id="flyer-name"
              className="input"
              value={draft.name}
              placeholder="January 2027 admissions"
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
        </section>
      </aside>

      <main className="studio__preview">
        <div className="preview-toolbar">
          <div className="preview-toolbar__meta">
            <strong>{template.name}</strong>
            <span className="dot" />
            <span>{aspect.label}</span>
            <span className="dot" />
            <span>{aspect.width} × {aspect.height}px</span>
          </div>
          <div className="preview-toolbar__meta">
            <span className="muted">
              {score.filled} of {score.total} details filled
            </span>
          </div>
        </div>

        <div className="preview-stage" ref={previewRef}>
          <div className="preview-frame">
            <FlyerCanvas
              template={template}
              brand={brand}
              content={draft.content}
              assets={assets}
              scale={Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)}
            />
          </div>
        </div>

        <div className="export-bar">
          <div className="export-bar__group">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void handleExport('png')}
              disabled={exporting !== null}
            >
              {exporting === 'png' ? 'Exporting…' : 'Download PNG'}
            </button>
            <button type="button" className="btn" onClick={() => void handleExport('jpg')} disabled={exporting !== null}>
              JPG
            </button>
            <button type="button" className="btn" onClick={() => void handleExport('pdf')} disabled={exporting !== null}>
              PDF
            </button>
          </div>
          <div className="export-bar__group">
            {user ? (
              <button type="button" className="btn btn--ghost" onClick={() => void saveDraft()}>
                Save draft
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
