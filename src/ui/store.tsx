import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { api } from './api';
import type { FlyerRecord, MediaItem, UserInfo } from './api';
import { DEFAULT_BRAND } from '@engine/brand';
import type { BrandConfig, FlyerContent, Template } from '@engine/types';

/**
 * Application state.
 *
 * One editor, one source of truth. A reducer would add ceremony without
 * buying anything here, so the store keeps a small amount of plain state and
 * a handful of actions.
 */

interface AppState {
  ready: boolean;
  user: UserInfo | null;
  brand: BrandConfig;
  templates: Template[];
  media: MediaItem[];
  flyers: FlyerRecord[];
  error: string | null;
}

interface AppContextValue extends AppState {
  refresh: () => Promise<void>;
  setBrand: (brand: BrandConfig) => void;
  setTemplates: (templates: Template[]) => void;
  setMedia: (media: MediaItem[]) => void;
  setFlyers: (flyers: FlyerRecord[]) => void;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  notify: (message: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    ready: false,
    user: null,
    brand: DEFAULT_BRAND,
    templates: [],
    media: [],
    flyers: [],
    error: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const bootstrap = await api.get<{
        brand: BrandConfig;
        templates: Template[];
        media: MediaItem[];
        user: UserInfo | null;
      }>('/bootstrap');
      setState((prev) => ({
        ...prev,
        ready: true,
        brand: bootstrap.brand,
        templates: bootstrap.templates,
        media: bootstrap.media,
        user: bootstrap.user,
      }));
      if (bootstrap.user) {
        const flyers = await api.get<FlyerRecord[]>('/flyers');
        setState((prev) => ({ ...prev, flyers }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        ready: true,
        error: error instanceof Error ? error.message : 'Could not reach the server.',
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const result = await api.post<{ user: UserInfo }>('/auth/login', { username, password });
      setState((prev) => ({ ...prev, user: result.user }));
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await api.post('/auth/logout');
    setState((prev) => ({ ...prev, user: null, flyers: [] }));
  }, []);

  const notify = useCallback((next: string | null) => {
    setMessage(next);
    if (next) {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setMessage(null), 4000);
    }
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      refresh,
      setBrand: (brand) => setState((prev) => ({ ...prev, brand })),
      setTemplates: (templates) => setState((prev) => ({ ...prev, templates })),
      setMedia: (media) => setState((prev) => ({ ...prev, media })),
      setFlyers: (flyers) => setState((prev) => ({ ...prev, flyers })),
      signIn,
      signOut,
      notify,
    }),
    [state, refresh, signIn, signOut, notify],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {message ? (
        <div className="toast" role="status" onClick={() => setMessage(null)}>
          {message}
        </div>
      ) : null}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

/** Persist the working flyer in the browser so a refresh does not lose it. */
export function useLocalDraft<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });
  const update = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(current) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* storage is optional */
        }
        return resolved;
      });
    },
    [key],
  );
  return [value, update];
}

export type { FlyerContent };
