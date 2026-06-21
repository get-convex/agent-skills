param(
  [string]$PhotoDir = "G:\My Drive\Personal\Photos of Me\convex\Backgrounds Removed",
  [string]$AssetDir = "C:\Users\mikec\Assets\Images"
)

$ErrorActionPreference = "Stop"

$requiredFiles = @(
  (Join-Path $AssetDir "symbol-color (1).png"),
  (Join-Path $AssetDir "logo-color.png"),
  (Join-Path $AssetDir "wordmark-white.png"),
  (Join-Path $AssetDir "symbol-white.png")
)

$preferredPhotos = @(
  "WIN_20250626_10_41_38_Pro.png",
  "WIN_20250626_10_39_35_Pro.png",
  "WIN_20250701_07_35_49_Pro.png",
  "WIN_20250701_07_36_01_Pro.png",
  "WIN_20250701_07_34_53_Pro.png"
) | ForEach-Object { Join-Path $PhotoDir $_ }

$missing = @()

if (-not (Test-Path -LiteralPath $PhotoDir -PathType Container)) {
  $missing += $PhotoDir
}

if (-not (Test-Path -LiteralPath $AssetDir -PathType Container)) {
  $missing += $AssetDir
}

foreach ($path in $requiredFiles + $preferredPhotos) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    $missing += $path
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing Mike/Convex thumbnail assets:"
  foreach ($path in $missing) {
    Write-Host "  $path"
  }
  exit 1
}

Write-Host "Mike/Convex thumbnail assets found."
Write-Host ""
Write-Host "Preferred Mike photos:"
foreach ($path in $preferredPhotos) {
  Write-Host "  $path"
}
Write-Host ""
Write-Host "Convex brand assets:"
foreach ($path in $requiredFiles) {
  Write-Host "  $path"
}
