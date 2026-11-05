import { useState } from 'react';
import { useApp } from '../store';

/** Sign-in screen. */
export function Login() {
  const { signIn, brand, notify } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(username, password);
      notify(`Welcome back, ${username}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__brand">
          {brand.logoUrl ? (
            <div className="login__stack">
              <img className="login__logo" src={brand.logoUrl} alt={brand.schoolName} />
              <p className="muted small">Flyer Studio</p>
            </div>
          ) : (
            <>
              <span className="login__mark" style={{ background: brand.colors.primary }} />
              <div>
                <h1>{brand.schoolName}</h1>
                <p className="muted small">Flyer Studio</p>
              </div>
            </>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input"
            value={username}
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <div className="notice notice--error">{error}</div> : null}

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="muted small">
          Staff can create flyers. Administrators can also manage the brand and templates.
        </p>
      </form>
    </div>
  );
}
