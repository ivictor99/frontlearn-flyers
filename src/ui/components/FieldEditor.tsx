import { FIELD_MAP } from '@engine/fields';
import type { FlyerContent } from '@engine/types';

interface FieldEditorProps {
  fieldKey: string;
  value: FlyerContent[string];
  onChange: (value: FlyerContent[string]) => void;
  id: string;
}

/**
 * One content field.
 *
 * Each field type gets the simplest possible editor — a staff member should
 * never have to think about how the value is stored.
 */
export function FieldEditor({ fieldKey, value, onChange, id }: FieldEditorProps) {
  const def = FIELD_MAP[fieldKey];
  if (!def) return null;

  const stringValue = typeof value === 'string' ? value : '';
  const listValue = Array.isArray(value) ? value : [];

  const common = {
    id,
    placeholder: def.placeholder,
    maxLength: def.type === 'longtext' || def.type === 'list' ? undefined : def.max,
  };

  if (def.type === 'list') {
    return (
      <textarea
        {...common}
        className="input input--area"
        rows={Math.min(6, Math.max(3, listValue.length + 1))}
        value={listValue.join('\n')}
        onChange={(event) => {
          const items = event.target.value.split('\n').map((item) => item.trim()).filter(Boolean);
          onChange(items);
        }}
      />
    );
  }

  if (def.type === 'longtext') {
    return (
      <textarea
        {...common}
        className="input input--area"
        rows={4}
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      {...common}
      className="input"
      type="text"
      value={stringValue}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
