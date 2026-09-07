import { LoadingDots } from '@/components/loading-dots'

// Rendered by each protected route's loading.tsx while its page.tsx (usually
// force-dynamic with real DB queries) resolves. The parent layout — and the
// Navbar inside it — stays mounted the whole time; only this fills the
// content area, so a nav click switches the screen instantly instead of
// leaving the previous page frozen until the new one's data is ready.
export function RouteLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingDots className="text-primary" />
    </div>
  )
}
