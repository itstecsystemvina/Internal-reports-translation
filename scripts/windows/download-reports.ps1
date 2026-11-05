# Downloads the weekly BCCV reports (Vietnamese + Korean Word files) into the folder chosen in install.ps1.
# Run by the "BCCV weekly reports" scheduled task. Settings live in config.json next to this file.
$ErrorActionPreference = 'Stop'
$log = Join-Path $PSScriptRoot 'download-log.txt'
function Log($msg) { Add-Content -Path $log -Value ('{0:yyyy-MM-dd HH:mm}  {1}' -f (Get-Date), $msg) }

try {
    $cfg = Get-Content (Join-Path $PSScriptRoot 'config.json') -Raw | ConvertFrom-Json
    $key = (New-Object System.Management.Automation.PSCredential 'x', (ConvertTo-SecureString $cfg.Key)).GetNetworkCredential().Password
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    # The week that most recently closed: reports are due Friday night, so from Saturday until the
    # next Friday "5 days ago" falls in that week. Dates use Vietnam time (UTC+7).
    $day = [DateTime]::UtcNow.AddHours(7).Date.AddDays(-5)
    $monday = $day.AddDays(-(([int]$day.DayOfWeek + 6) % 7))

    # Also fetch the week before again, to pick up reports submitted late.
    foreach ($week in @($monday, $monday.AddDays(-7))) {
        $weekStr = $week.ToString('yyyy-MM-dd')
        $dir = Join-Path $cfg.Folder $week.ToString('yyyy')
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        foreach ($lang in @(@{ code = 'vi'; tag = 'VN' }, @{ code = 'ko'; tag = 'Kr' })) {
            $file = Join-Path $dir ('{0}_BCCV_STEC({1}).docx' -f $weekStr, $lang.tag)
            $url = '{0}/api/export?week={1}&lang={2}' -f $cfg.SiteUrl.TrimEnd('/'), $weekStr, $lang.code
            Invoke-WebRequest -Uri $url -Headers @{ Authorization = "Bearer $key" } -OutFile "$file.part" -UseBasicParsing
            Move-Item -Force "$file.part" $file
            Log "Saved $file"
        }
    }
} catch {
    Log "FAILED: $($_.Exception.Message)"
    exit 1
}
