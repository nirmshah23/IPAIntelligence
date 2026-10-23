$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Node.js is required. Use the toolchain specified in .mise.toml.'
    }
    if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
        throw 'Corepack is required to run the project pnpm version.'
    }

    if (-not (Test-Path -LiteralPath 'node_modules\vite\bin\vite.js')) {
        Write-Host 'Installing application dependencies with pnpm...'
        & corepack pnpm@10.34.3 install --frozen-lockfile
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    }

    $appPort = if ($env:PORT) { $env:PORT } else { '5173' }
    Write-Host "Starting Vite on port $appPort. Press Ctrl+C to stop."
    & corepack pnpm dev --port $appPort
    if ($LASTEXITCODE -ne 0) { throw 'Application startup failed. See the error above.' }
}
finally {
    Pop-Location
}
