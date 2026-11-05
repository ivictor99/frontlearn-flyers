import { useState } from 'react';
import { FIELDS } from '@engine/fields';
import { ASPECTS, ASPECT_KEYS } from '@engine/brand';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@engine/templates';
import type { LayoutBand, LayoutBlock, Template, TextRole } from '@engine/types';
import { api } from '../api';
import { useApp } from '../store';
import { TemplateThumb } from '../components/TemplateThumb';

const COLOR_TOKENS = [
  'primary', 'secondary', 'accent', 'ink', 'paper', 'muted',
  'primary-soft', 'secondary-soft', 'accent-soft',
  'on-primary', 'on-secondary', 'on-accent',
];

const ROLES: TextRole[] = ['eyebrow', 'headline', 'subhead', 'body', 'cta', 'meta', 'label', 'display', 'number'];
const BLOCK_KINDS: LayoutBlock['kind'][] = ['text', 'facts', 'list', 'image', 'cta', 'logo', 'divider', 'space'];

/**
 * Template administration.
 *
 * Templates are data, so this screen edits data: the metadata, the fields a
 * template expects, and the band/column/block structure that defines its
 * layout. Changes render live.
 */
export function TemplatesAdmin() {
  const { templates, setTemplates, brand, user, notify } = useApp();
  const [editing, setEditing] = useState<Template | null>(null);
  const isAdmin = user?.role === 'admin';

  const refresh = async () => {
    const list = await api.get<Template[]>('/templates');
    setTemplates(list);
  };

  const toggle = async (template: Template) => {
    try {
      await api.post(`/templates/${template.id}/toggle`);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update the template.');
    }
  };

  const duplicate = async (template: Template) => {
    try {
      await api.post(`/templates/${template.id}/duplicate`);
      await refresh();
      notify('Template duplicated.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not duplicate the template.');
    }
  };

  const remove = async (template: Template) => {
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/templates/${template.id}`);
      await refresh();
      notify('Template deleted.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete the template.');
    }
  };

  if (editing) {
    return (
      <TemplateEditor
        template={editing}
        onCancel={() => setEditing(null)}
        onSaved={async () => {
          await refresh();
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>Templates</h1>
          <p className="muted">
            {templates.length} templates. Each one is a design blueprint that every flyer inherits from.
          </p>
        </div>
      </header>

      {!isAdmin ? <div className="notice notice--info">Only administrators can change templates.</div> : null}

      <div className="table">
        <div className="table__row table__row--head">
          <div>Template</div>
          <div>Category</div>
          <div>Size</div>
          <div>Status</div>
          <div />
        </div>
        {templates.map((template) => (
          <div className="table__row" key={template.id}>
            <div className="table__template">
              <div className="table__thumb">
                <TemplateThumb template={template} brand={brand} />
              </div>
              <div>
                <strong>{template.name}</strong>
                <p className="muted small">{template.description}</p>
              </div>
            </div>
            <div>{CATEGORY_LABELS[template.category] ?? template.category}</div>
            <div className="muted small">{ASPECTS[template.aspect].label}</div>
            <div>
              <span className={`pill ${template.active ? 'pill--on' : 'pill--off'}`}>
                {template.active ? 'Active' : 'Hidden'}
              </span>
            </div>
            <div className="table__actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(template)} disabled={!isAdmin}>
                Edit
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => void duplicate(template)} disabled={!isAdmin}>
                Duplicate
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => void toggle(template)} disabled={!isAdmin}>
                {template.active ? 'Hide' : 'Show'}
              </button>
              <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => void remove(template)} disabled={!isAdmin}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EditorProps {
  template: Template;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}

function TemplateEditor({ template, onCancel, onSaved }: EditorProps) {
  const { brand, notify } = useApp();
  const [draft, setDraft] = useState<Template>(() => JSON.parse(JSON.stringify(template)) as Template);
  const [saving, setSaving] = useState(false);

  const bands = draft.layout.bands;

  const setBand = (index: number, patch: Partial<LayoutBand>) => {
    setDraft((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        bands: prev.layout.bands.map((band, i) => (i === index ? { ...band, ...patch } : band)),
      },
    }));
  };

  const setBlock = (bandIndex: number, blockIndex: number, patch: Partial<LayoutBlock>) => {
    setDraft((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        bands: prev.layout.bands.map((band, i) => {
          if (i !== bandIndex) return band;
          const columns = band.columns ?? [{ w: 1, blocks: band.blocks ?? [] }];
          return {
            ...band,
            columns: columns.map((column) => ({
              ...column,
              blocks: column.blocks.map((block, j) => (j === blockIndex ? { ...block, ...patch } : block)),
            })),
          };
        }),
      },
    }));
  };

  const addBlock = (bandIndex: number) => {
    setDraft((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        bands: prev.layout.bands.map((band, i) => {
          if (i !== bandIndex) return band;
          const columns = band.columns?.length ? band.columns : [{ w: 1, blocks: band.blocks ?? [] }];
          const next = columns.map((column, index) =>
            index === 0
              ? {
                  ...column,
                  blocks: [
                    ...column.blocks,
                    {
                      id: `block-${Math.random().toString(36).slice(2, 8)}`,
                      kind: 'text',
                      field: 'body',
                      role: 'body',
                    } as LayoutBlock,
                  ],
                }
              : column,
          );
          return { ...band, columns: next };
        }),
      },
    }));
  };

  const removeBlock = (bandIndex: number, blockIndex: number) => {
    setDraft((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        bands: prev.layout.bands.map((band, i) => {
          if (i !== bandIndex) return band;
          const columns = band.columns ?? [{ w: 1, blocks: band.blocks ?? [] }];
          return {
            ...band,
            columns: columns.map((column) => ({
              ...column,
              blocks: column.blocks.filter((_, j) => j !== blockIndex),
            })),
          };
        }),
      },
    }));
  };

  const addBand = () => {
    setDraft((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        bands: [
          ...prev.layout.bands,
          {
            id: `band-${Math.random().toString(36).slice(2, 8)}`,
            padX: 72,
            padY: 32,
            columns: [{ w: 1, blocks: [] }],
          } as LayoutBand,
        ],
      },
    }));
  };

  const removeBand = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      layout: { ...prev.layout, bands: prev.layout.bands.filter((_, i) => i !== index) },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/templates/${draft.id}`, {
        name: draft.name,
        category: draft.category,
        description: draft.description,
        aspect: draft.aspect,
        active: draft.active,
        fields: draft.fields,
        style: draft.style,
        layout: draft.layout,
        previewUrl: draft.previewUrl ?? null,
      });
      notify('Template saved.');
      await onSaved();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the template.');
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (key: string) => {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.includes(key) ? prev.fields.filter((f) => f !== key) : [...prev.fields, key],
    }));
  };

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>Edit template</h1>
          <p className="muted">{draft.name}</p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save template'}
          </button>
        </div>
      </header>

      <div className="editor-grid">
        <div className="editor-grid__main">
          <section className="card">
            <h2 className="card__title">Details</h2>
            <div className="grid-2">
              <div className="field">
                <label className="field__label" htmlFor="t-name">
                  Name
                </label>
                <input
                  id="t-name"
                  className="input"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="t-category">
                  Category
                </label>
                <select
                  id="t-category"
                  className="input"
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value as Template['category'] })}
                >
                  {CATEGORY_ORDER.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="t-aspect">
                  Size
                </label>
                <select
                  id="t-aspect"
                  className="input"
                  value={draft.aspect}
                  onChange={(event) => setDraft({ ...draft, aspect: event.target.value as Template['aspect'] })}
                >
                  {ASPECT_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {ASPECTS[key].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="t-active">
                  Visibility
                </label>
                <select
                  id="t-active"
                  className="input"
                  value={draft.active ? 'active' : 'hidden'}
                  onChange={(event) => setDraft({ ...draft, active: event.target.value === 'active' })}
                >
                  <option value="active">Active — visible to staff</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="t-description">
                Description
              </label>
              <input
                id="t-description"
                className="input"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </div>
          </section>

          <section className="card">
            <h2 className="card__title">Expected details</h2>
            <p className="muted small">Staff only see these fields when this template is selected.</p>
            <div className="check-grid">
              {FIELDS.map((field) => (
                <label className="check" key={field.key}>
                  <input
                    type="checkbox"
                    checked={draft.fields.includes(field.key)}
                    onChange={() => toggleField(field.key)}
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="card__title">Structure</h2>
            <p className="muted small">
              Bands run top to bottom. Each band holds blocks; blocks pull a detail from the content and give it a
              typographic role.
            </p>
            {bands.map((band, bandIndex) => {
              const columns = band.columns?.length ? band.columns : [{ w: 1, blocks: band.blocks ?? [] }];
              return (
                <div className="band" key={band.id}>
                  <div className="band__head">
                    <strong>{band.id}</strong>
                    <div className="band__controls">
                      <label className="inline-field">
                        Pin
                        <select
                          className="input input--sm"
                          value={band.pin ?? 'none'}
                          onChange={(event) =>
                            setBand(bandIndex, { pin: event.target.value === 'none' ? undefined : (event.target.value as 'top' | 'bottom') })
                          }
                        >
                          <option value="none">Flow</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </label>
                      <label className="inline-field">
                        Align
                        <select
                          className="input input--sm"
                          value={band.align ?? 'left'}
                          onChange={(event) => setBand(bandIndex, { align: event.target.value as LayoutBand['align'] })}
                        >
                          <option value="left">Left</option>
                          <option value="center">Centre</option>
                          <option value="right">Right</option>
                        </select>
                      </label>
                      <label className="inline-field">
                        Flex
                        <input
                          type="checkbox"
                          checked={!!band.flex}
                          onChange={(event) => setBand(bandIndex, { flex: event.target.checked || undefined })}
                        />
                      </label>
                      <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => removeBand(bandIndex)}>
                        Remove band
                      </button>
                    </div>
                  </div>

                  {columns.map((column, columnIndex) => (
                    <div className="band__column" key={`${band.id}-col-${columnIndex}`}>
                      <p className="muted small">
                        Column {columnIndex + 1} — {Math.round(column.w * 100)}% wide
                      </p>
                      {column.blocks.map((block, blockIndex) => (
                        <div className="block" key={block.id}>
                          <div className="block__row">
                            <select
                              className="input input--sm"
                              value={block.kind}
                              onChange={(event) => setBlock(bandIndex, blockIndex, { kind: event.target.value as LayoutBlock['kind'] })}
                            >
                              {BLOCK_KINDS.map((kind) => (
                                <option key={kind} value={kind}>
                                  {kind}
                                </option>
                              ))}
                            </select>
                            <select
                              className="input input--sm"
                              value={block.field ?? ''}
                              onChange={(event) => setBlock(bandIndex, blockIndex, { field: event.target.value || undefined })}
                            >
                              <option value="">— no field —</option>
                              {FIELDS.map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                            <select
                              className="input input--sm"
                              value={block.role}
                              onChange={(event) => setBlock(bandIndex, blockIndex, { role: event.target.value as TextRole })}
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm btn--danger"
                              onClick={() => removeBlock(bandIndex, blockIndex)}
                            >
                              Remove
                            </button>
                          </div>
                          <div className="block__row">
                            <input
                              className="input input--sm"
                              placeholder="Fixed text (supports {{schoolName}})"
                              value={block.text ?? ''}
                              onChange={(event) => setBlock(bandIndex, blockIndex, { text: event.target.value })}
                            />
                            <input
                              className="input input--sm input--mono"
                              type="color"
                              value={/^#[0-9a-f]{6}$/i.test(block.style?.color ?? '') ? block.style!.color! : '#12203A'}
                              onChange={(event) =>
                                setBlock(bandIndex, blockIndex, { style: { ...(block.style ?? {}), color: event.target.value } })
                              }
                              title="Text colour"
                            />
                            <select
                              className="input input--sm"
                              value={block.style?.color && COLOR_TOKENS.includes(block.style.color) ? block.style.color : ''}
                              onChange={(event) =>
                                setBlock(bandIndex, blockIndex, {
                                  style: { ...(block.style ?? {}), color: event.target.value || undefined },
                                })
                              }
                            >
                              <option value="">brand colour</option>
                              {COLOR_TOKENS.map((token) => (
                                <option key={token} value={token}>
                                  {token}
                                </option>
                              ))}
                            </select>
                            <input
                              className="input input--sm input--number"
                              type="number"
                              placeholder="gap"
                              value={block.gap ?? ''}
                              onChange={(event) =>
                                setBlock(bandIndex, blockIndex, { gap: event.target.value ? Number(event.target.value) : undefined })
                              }
                            />
                          </div>
                        </div>
                      ))}
                      {columnIndex === 0 ? (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => addBlock(bandIndex)}>
                          + Add block
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              );
            })}
            <button type="button" className="btn btn--ghost btn--sm" onClick={addBand}>
              + Add band
            </button>
          </section>
        </div>

        <aside className="editor-grid__side">
          <section className="card">
            <h2 className="card__title">Preview</h2>
            <div className="brand-preview">
              <TemplateThumb template={draft} brand={brand} />
            </div>
            <p className="muted small">Preview uses sample content.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
