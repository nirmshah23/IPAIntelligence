import WorkspaceApp from './WorkspaceApp'

// Vite mounts this boundary only in the browser. Keep storage initialization
// in the data-owning views so it happens before their persistence effects.
export default function BrowserWorkspace() {
  return <WorkspaceApp />
}
