import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useForm } from '@tanstack/react-form'
import { Eye, EyeOff } from 'lucide-react'
import { useLogin } from '#/hooks/use-auth'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: login, isPending, error: loginError } = useLogin()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      login({ data: value })
    },
  })

  return (
    <form
      role="form"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="w-full space-y-3"
    >
      {/* SERVER ERROR */}
      {loginError && (
        <Alert className="rounded-lg border-[#E05555]/25 bg-[#E05555]/[0.06] px-3 py-2.5">
          <AlertDescription className="text-xs text-[#E05555]">
            {loginError.message || 'Invalid email or password'}
          </AlertDescription>
        </Alert>
      )}

      {/* EMAIL */}
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Email is required'
              : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ? 'Invalid email format'
                : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0

          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={field.name}
                  className="block text-[11px] font-medium text-[#B8B5C5]"
                >
                  Email
                </Label>
              </div>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-describedby={
                    hasError ? `error-${field.name}` : undefined
                  }
                  className={cn(
                    'w-full rounded-lg border bg-[#111118]',
                    'px-3 py-2.5',
                    'text-xs text-[#F5F0E8]',
                    'placeholder:text-[#4A4860]',
                    hasError
                      ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                      : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                  )}
                />
              </div>
              {hasError && (
                <p
                  id={`error-${field.name}`}
                  className="mt-1 text-left text-[10px] text-[#E05555]"
                >
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {/* PASSWORD */}
      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Password is required'
              : value.length < 6
                ? 'Password must be at least 6 characters'
                : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0

          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={field.name}
                  className="block text-[11px] font-medium text-[#B8B5C5]"
                >
                  Password
                </Label>

                <a
                  href="/forgot-password"
                  className="text-[10px] text-[#4A4860] transition-colors duration-300 hover:text-[#E8A838]"
                >
                  Forgot password?
                </a>
              </div>

              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type={showPassword ? 'text' : 'password'}
                  value={field.state.value}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-describedby={
                    hasError ? `error-${field.name}` : undefined
                  }
                  className={cn(
                    'w-full rounded-lg border bg-[#111118]',
                    'px-3 py-2.5 pr-10',
                    'text-xs text-[#F5F0E8]',
                    'placeholder:text-[#4A4860]',
                    'transition-all duration-300',
                    hasError
                      ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                      : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                  )}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4860] transition-colors duration-200 hover:text-[#B8B5C5] focus-visible:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {hasError && (
                <p
                  id={`error-${field.name}`}
                  className="mt-1 text-left text-[10px] text-[#E05555]"
                >
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {/* BUTTON */}
      <div className="mt-2">
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            'h-10 w-full rounded-lg cursor-pointer',
            'text-sm font-semibold',
            'bg-[#E8A838] text-[#0A0A0F]',
            'hover:bg-[#F0B848]',
            'transition-all duration-500',
            'hover:-translate-y-0.5',
            'hover:shadow-[0_6px_20px_rgba(232,168,56,0.28)]',
            'active:scale-[0.98]',
            'active:translate-y-0',
            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-[#E8A838]',
            'focus-visible:ring-offset-2',
            'focus-visible:ring-offset-[#16161F]',
            'disabled:pointer-events-none',
            'disabled:opacity-50',
          )}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F]" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </div>
    </form>
  )
}
