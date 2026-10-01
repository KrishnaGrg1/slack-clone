import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { cn } from '#/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Typography } from '#/components/ui/typography'
import RegisterForm from '#/components/auth/register'

export const Route = createFileRoute('/(auth)/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-sm relative z-10">
        {/* Logo — identical to NavBar */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <a href="/" className="inline-block no-underline">
              <Typography
                as="span"
                variant="h2"
                className="font-display text-[#F5F0E8] tracking-[-0.02em]"
              >
                Thread<span className="text-[#E8A838]">Call</span>
              </Typography>
            </a>
          </div>
          <Typography variant="body" className="mb-6 text-[#7A7890]">
            Create your account. Your first workspace is free.
          </Typography>
          <Card className="border-[#2A2A3A] bg-[#16161F] rounded-2xl overflow-hidden shadow-2xl">
            {/* Window chrome — same as HeroDemo */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#111118] border-b border-[#2A2A3A]">
              <Typography
                as="span"
                variant="caption"
                className="ml-2 text-[#7A7890]"
              >
                ThreadCall — Create an account
              </Typography>
            </div>

            {/* Tab switcher */}
            <div className="px-5 pt-5">
              <div className="flex bg-[#111118] rounded-lg p-0.5 border border-[#2A2A3A]">
                <Button
                  variant={'secondary'}
                  type="button"
                  onClick={() => navigate({ to: '/login' })}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-semibold rounded-md cursor-pointer',
                    'transition-all duration-400',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8A838]',

                    'text-[#7A7890] hover:text-[#F5F0E8]',
                  )}
                >
                  Sign in
                </Button>
                <Button
                  variant={'secondary'}
                  type="button"
                  className={cn(
                    'flex-1 py-1.5 text-xs font-semibold rounded-md cursor-pointer',
                    'transition-all duration-400',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8A838]',
                    'bg-[#1C1C28] text-[#F5F0E8]',
                  )}
                >
                  Create account
                </Button>
              </div>
            </div>

            <CardContent className="px-5 pt-5 pb-5">
              <RegisterForm />
            </CardContent>

            <Separator className="bg-[#2A2A3A]" />

            <CardFooter className="px-5 py-4 flex justify-center">
              <Typography
                variant="caption"
                className="text-center text-[#4A4860]"
              >
                By continuing you agree to our{' '}
                <a
                  href="/terms"
                  className="text-[#7A7890] hover:text-[#F5F0E8] transition-colors underline"
                >
                  terms
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  className="text-[#7A7890] hover:text-[#F5F0E8] transition-colors underline"
                >
                  privacy policy
                </a>
              </Typography>
            </CardFooter>
          </Card>

          {/* Back link */}
          {/* <Typography
            variant="body-sm"
            className="mt-6 text-center text-[#7A7890]"
          >
            <a href="/" className="hover:text-[#F5F0E8] transition-colors">
              ← Back to home
            </a>
          </Typography> */}
        </div>
      </div>
    </div>
  )
}
