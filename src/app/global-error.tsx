'use client'

// Top-level error boundary. Same rationale as the admin error page: never
// render error.message to the client. Real diagnostics live in server logs and
// can be correlated to a user report via the digest.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', background: '#fff', color: '#1A1A1A' }}>
        <title>Something went wrong | Transformidable</title>
        <main>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try again.</p>
          {error.digest && (
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Reference: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
