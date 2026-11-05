import { useRef, useState } from 'react';
import { api } from '../api';
import type { MediaItem } from '../api';
import { useApp } from '../store';
import type { ImageValue } from '@engine/types';

interface ImagePickerProps {
  value: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
}

/**
 * Image selection.
 *
 * Upload a new picture, reuse one from the school library, or run without a
 * picture — the template adapts either way.
 */
export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const { media, setMedia, user, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const item = await api.upload<MediaItem>('/media', file);
      setMedia([item, ...media]);
      onChange({
        url: item.url,
        width: item.width,
        height: item.height,
        focalX: 0.5,
        focalY: 0.5,
        alt: item.name,
      });
      notify('Image uploaded.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The upload failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return <p className="hint">Sign in to upload an image.</p>;
  }

  return (
    <div className="image-picker">
      {value ? (
        <div className="image-picker__preview">
          <img src={value.url} alt={value.alt ?? 'Selected flyer image'} />
          <div className="image-picker__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
              Replace
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="image-picker__empty">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : 'Upload an image'}
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowLibrary((open) => !open)}>
            {showLibrary ? 'Hide library' : 'Use school library'}
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file);
          event.target.value = '';
        }}
      />

      {showLibrary && media.length > 0 ? (
        <div className="image-picker__library">
          {media.map((item) => (
            <button
              key={item.id}
              type="button"
              className="image-picker__thumb"
              onClick={() => {
                onChange({ url: item.url, width: item.width, height: item.height, focalX: 0.5, focalY: 0.5, alt: item.name });
                setShowLibrary(false);
              }}
            >
              <img src={item.url} alt={item.name} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}

      {showLibrary && media.length === 0 ? (
        <p className="hint">No images in the school library yet.</p>
      ) : null}
    </div>
  );
}
