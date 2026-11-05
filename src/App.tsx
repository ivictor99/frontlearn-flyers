import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './ui/store';
import { Studio } from './ui/pages/Studio';
import { Gallery } from './ui/pages/Gallery';
import { BrandPage } from './ui/pages/BrandPage';
import { TemplatesAdmin } from './ui/pages/TemplatesAdmin';
import { Login } from './ui/pages/Login';

export function App() {
  const { user, brand, signOut, ready } = useApp();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="boot">
        <div className="boot__mark" style={{ background: brand.colors.primary }} />
        <p>Loading Flyer Studio…</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          {brand.logoUrl ? (
            <>
              <img className="topbar__logo" src={brand.logoUrl} alt={brand.schoolName} />
              <span className="topbar__product">Flyer Studio</span>
            </>
          ) : (
            <>
              <span className="topbar__mark" style={{ background: brand.colors.primary }} />
              <div className="topbar__title">
                <strong>{brand.schoolName}</strong>
                <span>Flyer Studio</span>
              </div>
            </>
          )}
        </div>

        <nav className="topbar__nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Studio
          </NavLink>
          <NavLink to="/templates" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Templates
          </NavLink>
          {isAdmin ? (
            <>
              <NavLink to="/brand" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Brand
              </NavLink>
              <NavLink to="/admin/templates" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Manage templates
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="topbar__user">
          {user ? (
            <>
              <span className="topbar__username">
                {user.username}
                <span className="topbar__role">{user.role}</span>
              </span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink className="btn btn--primary btn--sm" to="/login" state={{ from: location.pathname }}>
              Sign in
            </NavLink>
          )}
        </div>
      </header>

      {!user ? (
        <div className="banner">
          <span>You can design and download flyers without signing in. Sign in to save drafts and upload images.</span>
          <NavLink to="/login">Sign in</NavLink>
        </div>
      ) : null}

      <main className="app__body">
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route path="/templates" element={<Gallery />} />
          <Route path="/brand" element={<BrandPage />} />
          <Route path="/admin/templates" element={<TemplatesAdmin />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
