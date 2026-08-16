import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'register'

interface FieldError {
  email?: string
  username?: string
  password?: string
  confirm?: string
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(mode: AuthMode, fields: Record<string, string>): FieldError {
  const errors: FieldError = {}

  if (!fields.email) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Enter a valid email address'
  }

  if (mode === 'register') {
    if (!fields.username) {
      errors.username = 'Username is required'
    } else if (fields.username.length < 3) {
      errors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-z0-9_]+$/.test(fields.username)) {
      errors.username = 'Only lowercase letters, numbers, and underscores'
    }
  }

  if (!fields.password) {
    errors.password = 'Password is required'
  } else if (fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  if (
    mode === 'register' &&
    fields.password &&
    fields.confirm !== fields.password
  ) {
    errors.confirm = 'Passwords do not match'
  }

  return errors
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  autoComplete,
}: {
  label: string
  id: string
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  autoComplete?: string
}) {
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPw ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-semibold text-[var(--tc-muted)] uppercase tracking-wider"
      >
        {label}
      </Label>

      <div className="relative">
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'bg-[var(--tc-surface)] border-[var(--tc-border)] text-[var(--tc-text)]',
            'placeholder:text-[var(--tc-subtle)] text-sm h-10',
            'focus-visible:ring-[var(--tc-amber)] focus-visible:border-[var(--tc-amber)]',
            'transition-colors duration-300',
            error &&
              'border-[var(--tc-danger)] focus-visible:ring-[var(--tc-danger)]',
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--tc-muted)] hover:text-[var(--tc-text)] transition-colors duration-300 focus-visible:outline-none focus-visible:text-[var(--tc-amber)]"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? 'hide' : 'show'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--tc-danger)] mt-0.5">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--tc-subtle)] mt-0.5">{hint}</p>
      )}
    </div>
  )
}

// ── Password strength ─────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length

  const label = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const colors = [
    'bg-[var(--tc-danger)]',
    'bg-[var(--tc-danger)]',
    'bg-[var(--tc-warning,#FEBC2E)]',
    'bg-[var(--tc-amber)]',
    'bg-[var(--tc-teal)]',
  ]

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-0.5 flex-1 rounded-full transition-all duration-500',
              i < score ? colors[score] : 'bg-[var(--tc-border)]',
            )}
          />
        ))}
      </div>
      <p className="text-[10px] text-[var(--tc-subtle)]">{label}</p>
    </div>
  )
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldError>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const errs = validate('login', { email, password })
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error ?? 'Login failed. Check your credentials.')
        return
      }

      // store token, redirect
      localStorage.setItem('tc_token', data.data.Token)
      window.location.href = '/app'
    } catch {
      setServerError('Connection failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <Alert className="border-[var(--tc-danger)]/30 bg-[var(--tc-danger)]/08 text-[var(--tc-danger)] text-sm py-3">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Field
        label="Email"
        id="login-email"
        type="email"
        placeholder="krishna@example.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
        autoComplete="email"
      />

      <Field
        label="Password"
        id="login-password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="current-password"
      />

      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs text-[var(--tc-muted)] hover:text-[var(--tc-amber)] transition-colors duration-300 focus-visible:outline-none focus-visible:text-[var(--tc-amber)]"
        >
          Forgot password?
        </button>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full h-10 bg-[var(--tc-amber)] hover:bg-amber-400 text-[var(--tc-base)]',
          'font-semibold text-sm rounded-lg transition-all duration-500',
          'hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(232,168,56,0.3)]',
          'active:scale-[0.98] active:translate-y-0',
          'focus-visible:ring-2 focus-visible:ring-[var(--tc-amber)] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-[var(--tc-base)]/30 border-t-[var(--tc-base)] rounded-full animate-spin" />
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </Button>

      <p className="text-xs text-center text-[var(--tc-muted)]">
        No account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-[var(--tc-amber)] hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Create one
        </button>
      </p>
    </form>
  )
}

// ── Register form ─────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldError>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const errs = validate('register', { email, username, password, confirm })
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setServerError(
          data.error ?? 'Registration failed. Try a different email.',
        )
        return
      }

      localStorage.setItem('tc_token', data.data.Token)
      window.location.href = '/app'
    } catch {
      setServerError('Connection failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <Alert className="border-[var(--tc-danger)]/30 bg-[var(--tc-danger)]/08 text-[var(--tc-danger)] text-sm py-3">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Field
        label="Username"
        id="reg-username"
        placeholder="krishna_grg"
        value={username}
        onChange={setUsername}
        error={errors.username}
        hint="Lowercase letters, numbers, underscores only"
        autoComplete="username"
      />

      <Field
        label="Email"
        id="reg-email"
        type="email"
        placeholder="krishna@example.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
        autoComplete="email"
      />

      <div className="flex flex-col gap-1.5">
        <Field
          label="Password"
          id="reg-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordStrength password={password} />
      </div>

      <Field
        label="Confirm password"
        id="reg-confirm"
        type="password"
        placeholder="••••••••"
        value={confirm}
        onChange={setConfirm}
        error={errors.confirm}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full h-10 bg-[var(--tc-amber)] hover:bg-amber-400 text-[var(--tc-base)]',
          'font-semibold text-sm rounded-lg transition-all duration-500',
          'hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(232,168,56,0.3)]',
          'active:scale-[0.98] active:translate-y-0',
          'focus-visible:ring-2 focus-visible:ring-[var(--tc-amber)] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-[var(--tc-base)]/30 border-t-[var(--tc-base)] rounded-full animate-spin" />
            Creating account...
          </span>
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-xs text-center text-[var(--tc-muted)]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-[var(--tc-amber)] hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}

// ── Auth page ─────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')

  return (
    <div className="min-h-screen bg-[var(--tc-base)] flex items-center justify-center px-4 relative overflow-hidden">
      {/* ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full bg-[var(--tc-amber)]/06 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[320px] h-[200px] rounded-full bg-[var(--tc-teal)]/04 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <a
            href="/"
            className="font-display text-2xl font-semibold text-[var(--tc-text)] tracking-tight no-underline inline-block"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Thread<span className="text-[var(--tc-amber)]">Call</span>
          </a>
          <p className="text-xs text-[var(--tc-muted)] mt-2">
            {mode === 'login'
              ? 'Welcome back. Sign in to your workspace.'
              : 'Create your account and start a workspace.'}
          </p>
        </div>

        {/* Card */}
        <Card className="border-[var(--tc-border)] bg-[var(--tc-card)] shadow-2xl">
          <CardHeader className="pb-0 pt-6 px-6">
            {/* Mode tabs */}
            <div className="flex bg-[var(--tc-surface)] rounded-lg p-0.5 gap-0.5">
              {(['login', 'register'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-400',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tc-amber)]',
                    mode === m
                      ? 'bg-[var(--tc-card-hover)] text-[var(--tc-text)] shadow-sm'
                      : 'text-[var(--tc-muted)] hover:text-[var(--tc-text)]',
                  )}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="px-6 pt-6 pb-6">
            {mode === 'login' ? (
              <LoginForm onSwitch={() => setMode('register')} />
            ) : (
              <RegisterForm onSwitch={() => setMode('login')} />
            )}
          </CardContent>

          <Separator className="bg-[var(--tc-border)]" />

          <CardFooter className="px-6 py-4 flex justify-center">
            <p className="text-[10px] text-[var(--tc-subtle)] text-center">
              By continuing you agree to our{' '}
              <a
                href="/terms"
                className="text-[var(--tc-muted)] hover:text-[var(--tc-text)] transition-colors underline"
              >
                terms of use
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="text-[var(--tc-muted)] hover:text-[var(--tc-text)] transition-colors underline"
              >
                privacy policy
              </a>
            </p>
          </CardFooter>
        </Card>

        {/* Back to landing */}
        <p className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-[var(--tc-subtle)] hover:text-[var(--tc-muted)] transition-colors duration-300 no-underline"
          >
            ← Back to threadcall.dev
          </a>
        </p>
      </div>
    </div>
  )
}
