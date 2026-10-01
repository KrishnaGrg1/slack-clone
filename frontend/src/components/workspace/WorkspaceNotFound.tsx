import { Link, useParams } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { Typography } from '#/components/ui/typography'
import { Button } from '../ui/button'

interface WorkspaceNotFoundProps {
  reset?: () => void
}

export function WorkspaceNotFound({ reset }: WorkspaceNotFoundProps) {
  const params = useParams({ strict: false })
  const slug = params?.slug

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      {/* Main Card Surface */}
      <div className="max-w-md w-full bg-[#16161F] border border-[#2A2A3A] rounded-2xl p-8 text-center shadow-2xl">
        {/* Error State Icon Header */}
        <div className="mx-auto w-16 h-16 bg-[#111118] border border-[#2A2A3A] rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-[#E05555]" />
        </div>

        {/* Heading Text using <Typography variant="h2" /> */}
        <Typography variant="h2" className="text-[#F5F0E8] mb-2">
          Workspace Not Available
        </Typography>

        {/* Body Text using <Typography variant="body" /> */}
        <Typography variant="body" className="text-[#7A7890] mb-4">
          {`The workspace with slug "${slug}" could not be found or you don't have authorization to access it.`}
        </Typography>

        {/* Workspace Slug Badge using <Typography variant="code" /> */}
        {slug && (
          <div className="mb-6">
            <Typography
              variant="code"
              className="text-[#B8B5C5] border border-[#2A2A3A]"
            >
              workspace/{slug}
            </Typography>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col gap-3">
          {/* Primary Action CTA */}
          <Link
            to="/workspace"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E8A838] hover:bg-[#d4962e] rounded-lg transition-colors shadow-sm"
          >
            <Home className="w-4 h-4 text-[#0A0A0F]" />
            <Typography
              variant="label"
              className="text-[#0A0A0F] font-semibold"
            >
              Go to My Workspaces
            </Typography>
          </Link>

          {/* Secondary Action */}
          {reset && (
            <Button
              onClick={reset}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111118] hover:bg-[#16161F] rounded-lg border border-[#2A2A3A] transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#7A7890]" />
              <Typography variant="label" className="text-[#B8B5C5]">
                Try Again
              </Typography>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
