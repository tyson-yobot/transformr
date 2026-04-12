Set-Location 'C:\dev\transformr'

Write-Host "=== Step 1: Remove node_modules and lockfile ==="
if (Test-Path node_modules) { cmd /c "rmdir /s /q node_modules" 2>&1 | Out-Null }
if (Test-Path apps\mobile\node_modules) { cmd /c "rmdir /s /q apps\mobile\node_modules" 2>&1 | Out-Null }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
Write-Host "  cleanup done"

Write-Host ""
Write-Host "=== Step 2: npm install ==="
$startTime = Get-Date
$process = Start-Process -FilePath "npm" `
    -ArgumentList "install","--no-audit","--no-fund" `
    -NoNewWindow -PassThru -Wait `
    -RedirectStandardOutput "npm-install.log" `
    -RedirectStandardError "npm-install-err.log"

$duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 0)
Write-Host "=== exit code: $($process.ExitCode), duration: ${duration}s ==="

if (Test-Path 'node_modules') {
    $cnt = (Get-ChildItem 'node_modules' -Directory -ErrorAction SilentlyContinue).Count
    Write-Host "root node_modules: $cnt dirs"
}

Write-Host ""
Write-Host "=== Step 3: Verify ==="
# Check expo version
$expoVer = & node -e "console.log(require('expo/package.json').version)" 2>&1
Write-Host "expo: $expoVer"

$rnVer = & node -e "console.log(require('react-native/package.json').version)" 2>&1
Write-Host "react-native: $rnVer"

$tsVer = & node -e "console.log(require('typescript/package.json').version)" 2>&1
Write-Host "typescript: $tsVer"

Write-Host ""
Write-Host "--- stderr tail ---"
if (Test-Path 'npm-install-err.log') {
    Get-Content 'npm-install-err.log' -Tail 10
}
