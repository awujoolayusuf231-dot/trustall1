import { Component } from 'react'

/**
 * ErrorBoundary component - catches React rendering errors
 * and displays a user-friendly error page instead of a blank screen
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
          <div className="max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">Something went wrong</h1>
            <p className="text-muted mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            {import.meta.env.DEV && (
              <details className="mt-8 text-left rounded-lg border border-marigold/30 bg-marigold/5 p-4">
                <summary className="cursor-pointer font-mono text-xs font-semibold text-marigold-deep mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="font-mono text-[10px] text-muted overflow-auto max-h-40 whitespace-pre-wrap break-words">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              </details>
            )}
            
            <div className="flex gap-3 mt-8 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-seal px-6 py-2.5 font-body text-sm font-semibold text-surface hover:bg-seal-deep transition"
              >
                Refresh page
              </button>
              <a
                href="/"
                className="rounded-full border border-hairline px-6 py-2.5 font-body text-sm font-semibold text-ink hover:border-seal hover:text-seal transition"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * RouteErrorBoundary - Catches errors during route loading/rendering
 * and shows a minimal error state
 */
export function RouteErrorBoundary({ error, reset }) {
  if (!error) return null

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-3xl mb-3">⚠️</div>
      <h2 className="font-display text-xl font-bold text-ink mb-2">Unable to load</h2>
      <p className="text-sm text-muted mb-4 max-w-md">
        {error?.message || 'This page could not be loaded. Please try again.'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="rounded-full bg-seal px-4 py-2 font-body text-sm font-semibold text-surface hover:bg-seal-deep transition"
        >
          Try again
        </button>
        <a
          href="/messages"
          className="rounded-full border border-hairline px-4 py-2 font-body text-sm font-semibold text-ink hover:border-seal transition"
        >
          Back to messages
        </a>
      </div>
    </div>
  )
}

/**
 * Generic error state component for data loading failures
 */
export function DataError({ error, onRetry, actionLabel = 'Try again', actionHref }) {
  return (
    <div className="rounded-2xl border border-marigold/30 bg-marigold/5 p-8 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="font-display text-lg font-bold text-ink mb-2">Unable to load data</h3>
      <p className="text-sm text-muted mb-6">
        {error?.message || 'The data you requested could not be loaded. Please try again.'}
      </p>
      <div className="flex gap-2 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-full bg-seal px-4 py-2 font-body text-sm font-semibold text-surface hover:bg-seal-deep transition"
          >
            {actionLabel}
          </button>
        )}
        {actionHref && (
          <a
            href={actionHref}
            className="rounded-full border border-hairline px-4 py-2 font-body text-sm font-semibold text-ink hover:border-seal transition"
          >
            Go back
          </a>
        )}
      </div>
    </div>
  )
}

/**
 * Generic loading state component
 */
export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="inline-flex gap-1 mb-4">
        <div className="h-2 w-2 rounded-full bg-seal animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-2 w-2 rounded-full bg-seal animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-2 w-2 rounded-full bg-seal animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-muted">{message}</p>
    </div>
  )
}

/**
 * Not found state component
 */
export function NotFound({ message = 'Page not found', actionHref = '/' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="font-display text-2xl font-bold text-ink mb-2">Not found</h2>
      <p className="text-muted mb-8 max-w-md">{message}</p>
      <a
        href={actionHref}
        className="rounded-full bg-seal px-6 py-2.5 font-body text-sm font-semibold text-surface hover:bg-seal-deep transition"
      >
        Go back
      </a>
    </div>
  )
}
