import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@engine/templates';
import { useApp } from '../store';
import { TemplateThumb } from '../components/TemplateThumb';

/**
 * The template gallery.
 *
 * Every thumbnail is a real render of that template, so what a staff member
 * sees here is exactly what they will get.
 */
export function Gallery() {
  const { templates, brand } = useApp();
  const [category, setCategory] = useState<string>('all');

  const active = useMemo(() => templates.filter((t) => t.active), [templates]);
  const categories = useMemo(() => {
    const used = new Set(active.map((t) => t.category));
    return CATEGORY_ORDER.filter((c) => used.has(c));
  }, [active]);

  const visible = useMemo(
    () => (category === 'all' ? active : active.filter((t) => t.category === category)),
    [active, category],
  );

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>Template gallery</h1>
          <p className="muted">
            {active.length} designs, each with its own structure. Choose one in the studio to start a flyer.
          </p>
        </div>
        <Link className="btn btn--primary" to="/">
          Back to the studio
        </Link>
      </header>

      <div className="filter-row">
        <button
          type="button"
          className={`chip${category === 'all' ? ' is-active' : ''}`}
          onClick={() => setCategory('all')}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={`chip${category === item ? ' is-active' : ''}`}
            onClick={() => setCategory(item)}
          >
            {CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="gallery">
        {visible.map((template) => (
          <article className="gallery__card" key={template.id}>
            <div className="gallery__thumb">
              <TemplateThumb template={template} brand={brand} />
            </div>
            <div className="gallery__body">
              <h2>{template.name}</h2>
              <p className="muted">{template.description}</p>
              <div className="gallery__meta">
                <span className="tag">{CATEGORY_LABELS[template.category]}</span>
                <span className="tag tag--quiet">{template.aspect}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
