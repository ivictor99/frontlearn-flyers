import { useEffect, useRef, useState } from 'react';
import { BRAND_PRESETS, FONT_KEYS, FONT_LABELS } from '@engine/brand';
import type { BrandConfig, FontKey } from '@engine/types';
import { api } from '../api';
import { useApp } from '../store';
import { TemplateThumb } from '../components/TemplateThumb';
import { DEMO_CONTENT } from '../components/TemplateThumb';

const COLOR_FIELDS: { key: keyof BrandConfig['colors']; label: string; hint: string }[] = [
  { key: 'primary', label: 'Primary', hint: 'Deep brand colour for backgrounds' },
  { key: 'secondary', label: 'Secondary', hint: 'Supporting bands and footers' },
  { key: 'accent', label: 'Accent', hint: 'Buttons, highlights, emphasis' },
  { key: 'ink', label: 'Ink', hint: 'Body text colour' },
  { key: 'paper', label: 'Paper', hint: 'Page background' },
  { key: 'muted', label: 'Muted', hint: 'Secondary text and labels' },
];

/**
 * Brand settings.
 *
 * Everything here flows into every template automatically — change the school
 * colour once and all sixteen designs follow.
 */
export function BrandPage() {
  const { brand, setBrand, templates, user, notify } = useApp();
  const [draft, setDraft] = useState<BrandConfig>(brand);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setDraft(brand), [brand]);

  const isAdmin = user?.role === 'admin';

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.put<BrandConfig>('/brand', draft);
      setBrand(updated);
      notify('Brand settings saved.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the brand settings.');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      const item = await api.upload<{ id: string; url: string; width: number; height: number }>('/media', file);
      setDraft((prev) => ({
        ...prev,
        logoUrl: item.url,
        logoWidth: item.width,
        logoHeight: item.height,
      }));
      notify('Logo uploaded — remember to save.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The upload failed.');
    }
  };

  const previewTemplate = templates.find((t) => t.id === 'admissions-open') ?? templates[0];

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>School brand</h1>
          <p className="muted">
            These details appear on every flyer. Change them once and all templates update.
          </p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--primary" onClick={() => void save()} disabled={!isAdmin || saving}>
            {saving ? 'Saving…' : 'Save brand'}
          </button>
        </div>
      </header>

      {!isAdmin ? (
        <div className="notice notice--info">
          You are signed in as staff. An administrator can change the brand settings.
        </div>
      ) : null}

      <div className="brand-grid">
        <div className="brand-grid__main">
          <section className="card">
            <h2 className="card__title">Identity</h2>
            <div className="grid-2">
              <div className="field">
                <label className="field__label" htmlFor="schoolName">
                  School name
                </label>
                <input
                  id="schoolName"
                  className="input"
                  value={draft.schoolName}
                  onChange={(event) => setDraft({ ...draft, schoolName: event.target.value })}
                  disabled={!isAdmin}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="tagline">
                  Tagline
                </label>
                <input
                  id="tagline"
                  className="input"
                  value={draft.tagline}
                  onChange={(event) => setDraft({ ...draft, tagline: event.target.value })}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="logo">
                School logo
              </label>
              <div className="logo-row">
                <div className="logo-preview">
                  {draft.logoUrl ? (
                    <img src={draft.logoUrl} alt="School logo" />
                  ) : (
                    <span className="muted">No logo — a wordmark is used instead</span>
                  )}
                </div>
                <div className="logo-row__actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => logoRef.current?.click()} disabled={!isAdmin}>
                    Upload logo
                  </button>
                  {draft.logoUrl ? (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDraft({ ...draft, logoUrl: null, logoWidth: null, logoHeight: null })} disabled={!isAdmin}>
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                  event.target.value = '';
                }}
              />
            </div>
          </section>

          <section className="card">
            <h2 className="card__title">Colours</h2>
            <div className="swatches">
              {COLOR_FIELDS.map((field) => (
                <div className="swatch" key={field.key}>
                  <label className="field__label" htmlFor={`color-${field.key}`}>
                    {field.label}
                  </label>
                  <div className="swatch__row">
                    <input
                      id={`color-${field.key}`}
                      type="color"
                      className="color-input"
                      value={draft.colors[field.key]}
                      onChange={(event) =>
                        setDraft({ ...draft, colors: { ...draft.colors, [field.key]: event.target.value } })
                      }
                      disabled={!isAdmin}
                    />
                    <input
                      className="input input--mono"
                      value={draft.colors[field.key]}
                      onChange={(event) =>
                        setDraft({ ...draft, colors: { ...draft.colors, [field.key]: event.target.value } })
                      }
                      disabled={!isAdmin}
                    />
                  </div>
                  <p className="field__help">{field.hint}</p>
                </div>
              ))}
            </div>

            <h3 className="card__subtitle">Colour presets</h3>
            <div className="preset-row">
              {BRAND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="preset"
                  disabled={!isAdmin}
                  onClick={() => setDraft({ ...draft, colors: { ...preset.colors } })}
                >
                  <span className="preset__chips">
                    <i style={{ background: preset.colors.primary }} />
                    <i style={{ background: preset.colors.secondary }} />
                    <i style={{ background: preset.colors.accent }} />
                  </span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="card__title">Typography</h2>
            <div className="grid-2">
              <div className="field">
                <label className="field__label" htmlFor="heading-font">
                  Heading font
                </label>
                <select
                  id="heading-font"
                  className="input"
                  value={draft.fonts.heading}
                  onChange={(event) =>
                    setDraft({ ...draft, fonts: { ...draft.fonts, heading: event.target.value as FontKey } })
                  }
                  disabled={!isAdmin}
                >
                  {FONT_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {FONT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="body-font">
                  Body font
                </label>
                <select
                  id="body-font"
                  className="input"
                  value={draft.fonts.body}
                  onChange={(event) =>
                    setDraft({ ...draft, fonts: { ...draft.fonts, body: event.target.value as FontKey } })
                  }
                  disabled={!isAdmin}
                >
                  {FONT_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {FONT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card__title">Contact & defaults</h2>
            <div className="grid-2">
              {(
                [
                  ['website', 'Website'],
                  ['phone', 'Phone'],
                  ['email', 'Email'],
                  ['address', 'Address'],
                  ['defaultCta', 'Default call to action'],
                  ['footerNote', 'Default footer note'],
                ] as const
              ).map(([key, label]) => (
                <div className="field" key={key}>
                  <label className="field__label" htmlFor={`brand-${key}`}>
                    {label}
                  </label>
                  <input
                    id={`brand-${key}`}
                    className="input"
                    value={draft[key]}
                    onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                    disabled={!isAdmin}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="brand-grid__side">
          <section className="card">
            <h2 className="card__title">Live preview</h2>
            <p className="muted small">The brand applied to one of the templates.</p>
            {previewTemplate ? (
              <div className="brand-preview">
                <TemplateThumb template={previewTemplate} brand={draft} content={DEMO_CONTENT} />
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
