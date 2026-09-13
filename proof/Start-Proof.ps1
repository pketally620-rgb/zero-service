$ErrorActionPreference = 'Stop'
$proofRoot = $PSScriptRoot
$proofUrl = 'http://127.0.0.1:4173'
try { $proofResponse = Invoke-RestMethod "$proofUrl/api/catalog" -TimeoutSec 2 } catch { $proofResponse = $null }
if (-not $proofResponse) {
  $proofNode = (Get-Command node -ErrorAction Stop).Source
  Start-Process -FilePath $proofNode -ArgumentList ('"' + (Join-Path $proofRoot 'server.mjs') + '"') -WorkingDirectory $proofRoot -WindowStyle Hidden
  for ($proofAttempt = 0; $proofAttempt -lt 20; $proofAttempt++) {
    try { $proofResponse = Invoke-RestMethod "$proofUrl/api/catalog" -TimeoutSec 1; break } catch { Start-Sleep -Milliseconds 200 }
  }
}
if (-not $proofResponse.vehicles) { throw 'ZERO Proof could not start on port 4173.' }
Start-Process $proofUrl
