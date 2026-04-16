# TRANSFORMR Autonomous Monitor Script
# Emits one stdout line per event (triggers Monitor notifications in Claude Code):
#   SCREENSHOT:<path>   — new screenshot detected
#   ERROR:<line>        — logcat error line

$screenshotsDir = "C:\dev\transformr\apps\mobile\screenshots"
$knownFiles = @{}

# Seed known files so we only emit NEW screenshots
if (Test-Path $screenshotsDir) {
    Get-ChildItem $screenshotsDir -Filter "*.png" | ForEach-Object {
        $knownFiles[$_.FullName] = $true
    }
}

# Launch adb logcat as a process with redirected output
$adbInfo = New-Object System.Diagnostics.ProcessStartInfo
$adbInfo.FileName = "adb"
$adbInfo.Arguments = "logcat -v brief"
$adbInfo.RedirectStandardOutput = $true
$adbInfo.RedirectStandardError = $true
$adbInfo.UseShellExecute = $false
$adbInfo.CreateNoWindow = $true

$adbProcess = New-Object System.Diagnostics.Process
$adbProcess.StartInfo = $adbInfo

$errorLines = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()

$adbStarted = $false
try {
    $adbProcess.Start() | Out-Null
    $adbStarted = $true

    # Read logcat async
    $reader = $adbProcess.StandardOutput
    $readTask = $null
} catch {
    Write-Output "WARN:adb not available — screenshot-only mode"
}

[Console]::Out.Flush()
Write-Output "MONITOR:started"
[Console]::Out.Flush()

$errorKeywords = @("Error", "Exception", "FATAL", "TypeError", "ReferenceError", "NullPointerException", "ANR", "CRASH")
$sourceKeywords = @("ReactNativeJS", "com.transformr", "AndroidRuntime", "ReactNative", "yoga")

while ($true) {
    # --- Check for new screenshots ---
    if (Test-Path $screenshotsDir) {
        Get-ChildItem $screenshotsDir -Filter "*.png" | ForEach-Object {
            if (-not $knownFiles.ContainsKey($_.FullName)) {
                $knownFiles[$_.FullName] = $true
                Write-Output "SCREENSHOT:$($_.FullName)"
                [Console]::Out.Flush()
            }
        }
    }

    # --- Drain logcat ---
    if ($adbStarted -and -not $adbProcess.HasExited) {
        # Non-blocking read with timeout
        $available = $false
        try {
            # Peek by checking if there's data with a short async wait
            if ($readTask -eq $null -or $readTask.IsCompleted) {
                if ($readTask -ne $null -and $readTask.IsCompleted -and $readTask.Result -ne $null) {
                    $line = $readTask.Result
                    $matchesSource = $sourceKeywords | Where-Object { $line -match $_ }
                    $matchesError  = $errorKeywords  | Where-Object { $line -match $_ }
                    if ($matchesSource -and $matchesError) {
                        Write-Output "ERROR:$line"
                        [Console]::Out.Flush()
                    }
                }
                $readTask = $reader.ReadLineAsync()
            }
        } catch { }
    }

    Start-Sleep -Milliseconds 800
}
