$appPorts = @(5173, 4173)
if ($env:PORT) { $appPorts += [int]$env:PORT }

Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in $appPorts } |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force }