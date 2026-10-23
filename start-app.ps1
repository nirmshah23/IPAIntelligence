$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Node.js is required. Install Node.js 22.12 or newer, then run this script again.'
    }

    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw 'npm is required. Reinstall Node.js with npm included, then try again.'
    }

    if (-not (Test-Path -LiteralPath 'node_modules\.bin\vite.cmd')) {
        Write-Host 'Installing application dependencies...'
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) {
            throw 'Dependency installation failed.'
        }
    }

    Write-Host 'Starting the application. Press Ctrl+C to stop it.'
    & npm.cmd run dev -- --host 127.0.0.1 --open
    if ($LASTEXITCODE -ne 0) {
        throw 'Application startup failed. See the error above.'
    }
}
finally {
    Pop-Location
}
