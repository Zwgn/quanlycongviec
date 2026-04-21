import React, { ChangeEvent, FormEvent } from 'react';

type AuthField = {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
};

type AuthFormProps = {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'login';
  fields: AuthField[];
  values: Record<string, string>;
  errors: Record<string, string>;
  isSubmitting?: boolean;
  submitError?: string;
  submitSuccess?: string;
  submitLabel: string;
  forgotPasswordLabel?: string;
  onForgotPassword?: () => void;
  switchText: string;
  switchActionLabel: string;
  onSwitchAction: () => void;
  onBackHome: () => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function AuthForm({
  title = '',
  subtitle = '',
  variant = 'default',
  fields,
  values,
  errors,
  isSubmitting = false,
  submitError,
  submitSuccess,
  submitLabel,
  forgotPasswordLabel,
  onForgotPassword,
  switchText,
  switchActionLabel,
  onSwitchAction,
  onBackHome,
  onInputChange,
  onSubmit,
}: AuthFormProps) {
  const shouldRenderHeader = Boolean(title.trim() || subtitle.trim());
  const isLoginVariant = variant === 'login';

  return (
    <div className={`auth-card${isLoginVariant ? ' auth-card--login' : ''}`}>
      <button type="button" className="auth-back-link" onClick={onBackHome}>
        Quay lại landing
      </button>

      {shouldRenderHeader ? (
        <header className="auth-header">
          {title.trim() ? <h2>{title}</h2> : null}
          {subtitle.trim() ? <p>{subtitle}</p> : null}
        </header>
      ) : null}

      <form className={`auth-form${shouldRenderHeader ? '' : ' auth-form--compact'}`} onSubmit={onSubmit} noValidate>
        {fields.map((field) => (
          <label key={field.name} className="auth-field">
            <span>{field.label}</span>
            <input
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={values[field.name] || ''}
              onChange={onInputChange}
              autoComplete={field.name}
            />
            {errors[field.name] ? <small>{errors[field.name]}</small> : null}
          </label>
        ))}

        {forgotPasswordLabel && onForgotPassword ? (
          <div className="auth-forgot-row">
            <button type="button" className="auth-inline-link" onClick={onForgotPassword}>
              {forgotPasswordLabel}
            </button>
          </div>
        ) : null}

        {submitError ? <p className="auth-feedback auth-feedback--error">{submitError}</p> : null}
        {submitSuccess ? <p className="auth-feedback auth-feedback--success">{submitSuccess}</p> : null}

        <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Dang xu ly...' : submitLabel}
        </button>
      </form>

      <p className="auth-switch-row">
        {switchText}{' '}
        <button type="button" className="auth-switch-button" onClick={onSwitchAction}>
          {switchActionLabel}
        </button>
      </p>
    </div>
  );
}

export type { AuthField };
export default AuthForm;
