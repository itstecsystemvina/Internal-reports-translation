# One-time setup on the Windows computer that should keep copies of the weekly reports.
# Asks for the site address, the export key and a folder, then creates a scheduled task
# that runs download-reports.ps1 every Saturday at 08:00 and downloads once right away.
$ErrorActionPreference = 'Stop'

$site = Read-Host 'Site address (for example https://your-app.vercel.app)'
$key = Read-Host 'Export key (EXPORT_SECRET from Vercel)' -AsSecureString
$defaultFolder = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'BCCV Reports'
$folder = Read-Host "Folder for the reports [$defaultFolder]"
if (-not $folder) { $folder = $defaultFolder }

# The key is encrypted so that only this Windows user on this computer can read it.
@{ SiteUrl = $site.Trim(); Folder = $folder; Key = (ConvertFrom-SecureString $key) } |
    ConvertTo-Json | Set-Content -Path (Join-Path $PSScriptRoot 'config.json')

$script = Join-Path $PSScriptRoot 'download-reports.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Saturday -At '08:00'
# Run as soon as possible if the computer was off at 08:00; retry if the download fails.
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName 'BCCV weekly reports' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host 'Scheduled task "BCCV weekly reports" created (Saturdays 08:00). Downloading now as a test...'
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script
if ($LASTEXITCODE -eq 0) { Write-Host "Done. Files are in: $folder" -ForegroundColor Green }
else { Write-Host "Download failed. See $(Join-Path $PSScriptRoot 'download-log.txt')" -ForegroundColor Red }
