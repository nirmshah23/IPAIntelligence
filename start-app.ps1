$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
try {
    $appPort = if ($env:PORT) { $env:PORT } else { '5173' }
    $portNumber = 0
    if (-not [int]::TryParse($appPort, [ref]$portNumber) -or $portNumber -lt 1 -or $portNumber -gt 65535) {
        throw 'PORT must be a number between 1 and 65535.'
    }
    $appUrl = "http://localhost:$portNumber/"
    $listeners = @(Get-NetTCPConnection -LocalPort $portNumber -State Listen -ErrorAction SilentlyContinue)
    if ($listeners.Count -gt 0) {
        $existingApp = $false
        try {
            $response = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 5
            $existingApp = $response.Content -match '<title>Arcwell IPA Workspace</title>' -and $response.Content -match '/@vite/client'
        }
        catch {
            # An occupied port may belong to another service or an unresponsive app.
        }
        if ($existingApp) {
            Write-Host "Arcwell IPA is already running at $appUrl"
            Write-Host 'Open that address in your browser. No second server was started.'
            return
        }
        $listenerIds = ($listeners.OwningProcess | Sort-Object -Unique) -join ', '
        throw "Port $portNumber is already used by another service (PID: $listenerIds). Stop that service or set `$env:PORT to a different port, then run this script again."
    }

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

    Write-Host "Starting Vite on port $appPort. Press Ctrl+C to stop."
    & corepack pnpm dev --port $appPort
    if ($LASTEXITCODE -ne 0) { throw 'Application startup failed. See the error above.' }
}
finally {
    Pop-Location
}
