import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useForm } from '@tanstack/react-form'

import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'
import { useCreateWorkspace } from '#/hooks/use-workspace'
import { Switch } from '../ui/switch'

export default function CreateWorkspaceForm() {
  const { mutate, isPending, error } = useCreateWorkspace()

  const form = useForm({
    defaultValues: {
      name: '',
      slug: '',
      isPrivate: true,
    },
    onSubmit: async ({ value }) => {
      mutate({ data: value })
    },
  })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      {/* SERVER ERROR */}
      {error && (
        <Alert className="rounded-lg border-[#E05555]/25 bg-[#E05555]/[0.06] px-3 py-2.5">
          <AlertDescription className="text-xs text-[#E05555]">
            {error.message || 'Invalid name'}
          </AlertDescription>
        </Alert>
      )}

      {/* name */}
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Workspace name is required'
              : value.length < 3
                ? 'Workspace name must be at least 3 characters'
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
                  Workspace name
                </Label>
              </div>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  placeholder="Ex. Acme Inc."
                  autoComplete="name"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full rounded-lg border bg-[#111118]',
                    'px-3 py-2.5',
                    'text-xs text-[#F5F0E8]',
                    'placeholder:text-[#4A4860]',
                    'outline-none',
                    'transition-all duration-300',
                    hasError
                      ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                      : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                  )}
                />
              </div>
              {hasError && (
                <p className="mt-1 text-left text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {/* slug */}
      <form.Field
        name="slug"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Workspace slug is required'
              : value.length < 3
                ? 'Workspace slug must be at least 3 characters'
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
                  Workspace slug
                </Label>
              </div>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  placeholder="slug_oo1"
                  autoComplete="slug"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={cn(
                    'w-full rounded-lg border bg-[#111118]',
                    'px-3 py-2.5',
                    'text-xs text-[#F5F0E8]',
                    'placeholder:text-[#4A4860]',
                    'outline-none',
                    'transition-all duration-300',
                    hasError
                      ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                      : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                  )}
                />
              </div>
              {hasError && (
                <p className="mt-1 text-left text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {/* isPrivate */}
      <form.Field
        name="isPrivate"
        validators={{
          onChange: ({ value }) =>
            value === undefined ? 'Workspace Status is required' : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0

          return (
            <div>
              <div className="mb-1.5 flex items-start justify-between">
                <div className="max-w-[70%]">
                  <Label
                    htmlFor={field.name}
                    className="block text-[11px] font-medium text-[#B8B5C5]"
                  >
                    Workspace visibility
                  </Label>
                  <p className="text-xs text-[#9A98A6]">
                    Private: only invited members can access
                  </p>
                </div>

                <div className="mt-1">
                  <Switch
                    checked={!!field.state.value}
                    onCheckedChange={(v) => field.handleChange(Boolean(v))}
                  />
                </div>
              </div>
              {hasError && (
                <p className="mt-1 text-left text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>
      {/* BUTTON */}
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
            Creating workspace...
          </span>
        ) : (
          'Create workspace'
        )}
      </Button>
    </form>
  )
}
