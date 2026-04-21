import React from 'react';
import '../../assets/styles/Auth.css';

type AuthShellProps = {
  tag: string;
  title: string;
  description: string;
  highlights: string[];
  variant?: 'default' | 'login';
  children: React.ReactNode;
};

function AuthShell({ tag, title, description, highlights, variant = 'default', children }: AuthShellProps) {
  const isLoginVariant = variant === 'login';

  return (
    <div className={`auth-root${isLoginVariant ? ' auth-root--login' : ''}`}>
      <div className={`auth-layout${isLoginVariant ? ' auth-layout--login' : ''}`}>
        <aside className="auth-brand-panel" aria-label="TaskFlow introduction">
          <p className="auth-tag">{tag}</p>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>

          <div className="auth-highlight-grid">
            {highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <div className="auth-brand-glow" aria-hidden="true" />
        </aside>

        <section className="auth-form-panel">{children}</section>
      </div>
    </div>
  );
}

export default AuthShell;
