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
      is_private: true,
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
      {error && (
        <Alert className="rounded-lg border-[#E05555]/25 bg-[#E05555]/[0.06] px-3 py-2.5">
          <AlertDescription className="text-xs text-[#E05555]">
            {error.message || 'Failed to create workspace'}
          </AlertDescription>
        </Alert>
      )}

      {/* Name */}
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Workspace name is required'
              : value.length < 3
                ? 'At least 3 characters'
                : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <div className="space-y-1.5">
              <Label
                htmlFor={field.name}
                className="block text-[11px] font-medium text-[#B8B5C5]"
              >
                Workspace name
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                placeholder="Acme Inc."
                autoComplete="off"
                onChange={(e) => {
                  field.handleChange(e.target.value)
                  // auto-fill slug from name
                  const name = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')
                  form.setFieldValue('name', name)
                }}
                onBlur={field.handleBlur}
                className={cn(
                  'h-10 w-full rounded-lg border bg-[#111118]',
                  'px-3 text-xs text-[#F5F0E8] placeholder:text-[#4A4860]',
                  'outline-none transition-all duration-300',
                  hasError
                    ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                    : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                )}
              />
              {hasError && (
                <p className="text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {/* Slug */}
      <form.Field
        name="slug"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'Slug is required'
              : value.length < 3
                ? 'At least 3 characters'
                : !/^[a-z0-9-]+$/.test(value)
                  ? 'Lowercase letters, numbers, and hyphens only'
                  : undefined,
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label
                  htmlFor={field.name}
                  className="text-[11px] font-medium text-[#B8B5C5]"
                >
                  Workspace slug
                </Label>
                <span className="shrink-0 text-[10px] text-[#4A4860]">
                  threadcall.dev/
                  <span className="text-[#7A7890]">
                    {field.state.value || 'slug'}
                  </span>
                </span>
              </div>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                placeholder="acme-inc"
                autoComplete="off"
                onChange={(e) =>
                  field.handleChange(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  )
                }
                onBlur={field.handleBlur}
                className={cn(
                  'h-10 w-full rounded-lg border bg-[#111118]',
                  'px-3 text-xs text-[#F5F0E8] placeholder:text-[#4A4860]',
                  'outline-none transition-all duration-300',
                  hasError
                    ? 'border-[#E05555]/60 focus:border-[#E05555] focus:ring-1 focus:ring-[#E05555]/20'
                    : 'border-[#2A2A3A] focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A838]/30',
                )}
              />
              {hasError && (
                <p className="text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      <form.Field
        name="is_private"
        validators={{
          onChange: () => undefined,
        }}
      >
        {(field) => {
          const isPrivate = field.state.value
          const hasError = field.state.meta.errors.length > 0

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label
                    htmlFor={field.name}
                    className="text-[11px] font-medium text-[#B8B5C5]"
                  >
                    Workspace visibility
                  </Label>

                  <p className="mt-1 text-xs text-[#6F6D78]">
                    {isPrivate
                      ? 'Only invited members can access this workspace.'
                      : 'Anyone with the workspace link can join.'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      isPrivate ? 'text-[#E8A838]' : 'text-[#7CCB8A]',
                    )}
                  >
                    {isPrivate ? 'Private' : 'Public'}
                  </span>

                  <Switch
                    id={field.name}
                    checked={isPrivate}
                    onCheckedChange={(value) =>
                      field.handleChange(Boolean(value))
                    }
                    aria-label={`Workspace visibility: ${
                      isPrivate ? 'Private' : 'Public'
                    }`}
                  />
                </div>
              </div>

              {hasError && (
                <p className="text-[10px] text-[#E05555]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          'mt-1 h-10 w-full rounded-lg cursor-pointer text-sm font-semibold',
          'bg-[#E8A838] text-[#0A0A0F] hover:bg-[#F0B848]',
          'transition-all duration-500 hover:-translate-y-0.5',
          'hover:shadow-[0_6px_20px_rgba(232,168,56,0.28)]',
          'active:scale-[0.98] active:translate-y-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-[#16161F]',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F]" />
            Creating...
          </span>
        ) : (
          'Create workspace'
        )}
      </Button>
    </form>
  )
}
