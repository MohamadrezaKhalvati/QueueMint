param(
  [string]$ZipPath
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $projectRoot "public\fonts"
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("raadco-samim-" + [guid]::NewGuid().ToString("N"))

if (-not $ZipPath) {
  $candidates = @(
    (Join-Path $HOME "Downloads\samim-font-v4.0.5.zip"),
    (Join-Path $HOME "Desktop\samim-font-v4.0.5.zip"),
    (Join-Path (Get-Location) "samim-font-v4.0.5.zip")
  )

  $autoDetected = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if ($autoDetected) {
    $ZipPath = $autoDetected
    Write-Host "Found Samim zip: $ZipPath" -ForegroundColor Cyan
  }
  else {
    throw "Samim zip was not found automatically. Re-run with: npm run font:install -- -ZipPath 'C:\path\to\samim-font-v4.0.5.zip'"
  }
}

$resolvedZip = (Resolve-Path -LiteralPath $ZipPath).Path

New-Item -ItemType Directory -Path $destination -Force | Out-Null
New-Item -ItemType Directory -Path $temp -Force | Out-Null

try {
  Expand-Archive -LiteralPath $resolvedZip -DestinationPath $temp -Force
  $required = @("Samim.woff2", "Samim-Medium.woff2", "Samim-Bold.woff2")

  foreach ($name in $required) {
    $source = Get-ChildItem -Path $temp -Recurse -File -Filter $name | Select-Object -First 1
    if (-not $source) {
      throw "Could not find $name in the supplied Samim zip."
    }
    Copy-Item -LiteralPath $source.FullName -Destination (Join-Path $destination $name) -Force
  }

  Write-Host "Samim fonts installed into public/fonts." -ForegroundColor Green
  Write-Host "Now run: npm run build"
}
finally {
  if (Test-Path $temp) {
    Remove-Item -LiteralPath $temp -Recurse -Force
  }
}
