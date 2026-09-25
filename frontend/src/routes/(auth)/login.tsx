import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Typography } from '#/components/ui/typography'
import { cn } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import LoginForm from '#/components/auth/login'

export const Route = createFileRoute('/(auth)/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="text-center mb-6">
            <a
              href="/"
              className="text-2xl font-display font-semibold text-foreground"
            >
              Thread<span className="text-primary">Call</span>
            </a>
          </div>
          <Typography variant="body" className="mb-6 text-muted-foreground">
            Welcome back. Sign in to your workspace to continue.
          </Typography>
          <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-popover px-4 py-3">
              <Typography
                variant="caption"
                className="ml-2 text-muted-foreground"
              >
                ThreadCall — sign in
              </Typography>
            </div>

            {/* Tab switcher */}
            <div className="px-5 pt-5">
              <div className="flex rounded-lg border border-border bg-popover p-0.5">
                <Button
                  variant={'secondary'}
                  type="button"
                  className={cn(
                    'flex-1 rounded-md py-1.5 text-xs font-semibold cursor-pointer',
                    'transition-all duration-400',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                    'bg-secondary text-foreground',
                  )}
                >
                  Sign in
                </Button>
                <Button
                  variant={'secondary'}
                  type="button"
                  onClick={() => navigate({ to: '/register' })}
                  className={cn(
                    'flex-1 rounded-md py-1.5 text-xs font-semibold cursor-pointer',
                    'transition-all duration-400',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                    'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Create account
                </Button>
              </div>
            </div>

            <CardContent className="px-5 pt-5 pb-5">
              <LoginForm />
            </CardContent>

            <Separator className="bg-[#2A2A3A]" />

            <CardFooter className="flex justify-center px-5 py-4">
              <Typography
                variant="caption"
                className="text-center text-muted-foreground"
              >
                By continuing you agree to our{' '}
                <a
                  href="/terms"
                  className="text-muted-foreground underline transition-colors hover:text-foreground"
                >
                  terms
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  className="text-muted-foreground underline transition-colors hover:text-foreground"
                >
                  privacy policy
                </a>
              </Typography>
            </CardFooter>
          </Card>

          {/* <Typography
            variant="caption"
            className="mt-6 text-center text-muted-foreground"
          >
            <a href="/" className="transition-colors hover:text-foreground">
              ← Back to home
            </a>
          </Typography> */}
        </div>
      </div>
    </div>
  )
}
