import { createRoot } from 'react-dom/client'
import BrowserWorkspace from './BrowserWorkspace'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  window.location.pathname === '/' || window.location.pathname === '/index.html'
    ? <BrowserWorkspace />
    : <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-semibold">Page Not Found</h1>
        <p className="mt-4 text-zinc-600">The page you’re looking for doesn’t exist or has been moved.</p>
        <a className="mt-6 text-blue-600 underline" href="/">Back to Home</a>
      </main>,
)
