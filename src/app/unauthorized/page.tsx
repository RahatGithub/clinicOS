'use client'

import { useRouter } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { roleHomePath } from '@/lib/nav-config'

export default function UnauthorizedPage() {
  const { user } = useAuth()
  const router = useRouter()

  function handleBack() {
    if (user) {
      router.push(roleHomePath(user.role))
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <ShieldX className="h-7 w-7 text-danger" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          You don&apos;t have permission to view this page.
        </p>
        <Button
          className="mt-6 bg-brand-gradient text-white border-none"
          onClick={handleBack}
        >
          Back to my dashboard
        </Button>
      </div>
    </div>
  )
}
