param(
    [int]$Limit = 3,
    [string]$DraftId,
    [string]$IdeaId,
    [string]$KeywordClusterId,
    [string]$ProjectName,
    [switch]$Force,
    [switch]$IncludePassed,
    [switch]$IncludePublished,
    [string]$InternalDomain,
    [switch]$VerboseBody,
    [switch]$VerboseReport
)

$baseUrl = "http://localhost:5678/webhook"
$uri = "$baseUrl/seo/qa"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Test Workflow 13: QA SEO Automatizado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$body = @{
    limit = $Limit
    force = $Force.IsPresent
    include_passed = $IncludePassed.IsPresent
    include_published = $IncludePublished.IsPresent
}

if ($DraftId) { $body.draft_id = $DraftId }
if ($IdeaId) { $body.idea_id = $IdeaId }
if ($KeywordClusterId) { $body.keyword_cluster_id = $KeywordClusterId }
if ($ProjectName) { $body.project_name = $ProjectName }
if ($InternalDomain) { $body.internal_domain = $InternalDomain }

$bodyJson = $body | ConvertTo-Json -Depth 6

Write-Host "Endpoint: $uri" -ForegroundColor Gray
if ($VerboseBody.IsPresent) {
    Write-Host "Body:" -ForegroundColor Gray
    Write-Host $bodyJson -ForegroundColor DarkGray
}
Write-Host ""

try {
    Write-Host "Ejecutando workflow..." -ForegroundColor White
    $response = Invoke-RestMethod -Method Post -Uri $uri -Body $bodyJson -ContentType "application/json" -TimeoutSec 120

    switch ($response.status) {
        "success" {
            $summary = $response.summary
            Write-Host "Estado: success" -ForegroundColor Green
            Write-Host ("Drafts procesados: {0}" -f ($summary.total)) -ForegroundColor Cyan
            Write-Host ("[OK] Aprobados: {0}" -f ($summary.passed)) -ForegroundColor Green
            Write-Host ("[!] Con observaciones: {0}" -f ($summary.warnings)) -ForegroundColor Yellow
            Write-Host ("[X] Rechazados: {0}" -f ($summary.failed)) -ForegroundColor Red
            Write-Host ""

            foreach ($item in ($response.drafts | Where-Object { $_ })) {
                $color = if ($item.qa_passed) {
                    if ($item.qa_status -eq 'pass_with_warnings') { 'Yellow' } else { 'Green' }
                } else { 'Red' }

                Write-Host "Draft: $($item.draft_id)" -ForegroundColor White
                Write-Host "  Idea: $($item.idea_id)" -ForegroundColor DarkGray
                if ($item.cluster_name) {
                    Write-Host "  Cluster: $($item.cluster_name)" -ForegroundColor DarkGray
                }
                Write-Host ("  Resultado: {0}" -f $item.qa_status) -ForegroundColor $color
                if ($item.qa_checked_at) {
                    Write-Host "  QA At: $($item.qa_checked_at)" -ForegroundColor Gray
                }
                if ($item.qa_stats) {
                    Write-Host ("  Word count: {0}" -f $item.qa_stats.word_count) -ForegroundColor Gray
                    Write-Host ("  Densidad keyword: {0}%" -f $item.qa_stats.keyword_density) -ForegroundColor Gray
                    Write-Host ("  Links: {0} (internos {1})" -f $item.qa_stats.links_total, $item.qa_stats.links_internal) -ForegroundColor Gray
                }
                if ($item.failures -and $item.failures.Count -gt 0) {
                    Write-Host "  Fails:" -ForegroundColor Red
                    foreach ($fail in $item.failures) {
                        Write-Host ("    - [{0}] {1}" -f $fail.id, $fail.message) -ForegroundColor Red
                    }
                }
                if ($item.warnings -and $item.warnings.Count -gt 0) {
                    Write-Host "  Warnings:" -ForegroundColor Yellow
                    foreach ($warn in $item.warnings) {
                        Write-Host ("    - [{0}] {1}" -f $warn.id, $warn.message) -ForegroundColor Yellow
                    }
                }
                if ($item.job_log_id) {
                    Write-Host "  Job Log: $($item.job_log_id)" -ForegroundColor DarkGray
                }

                if ($VerboseReport.IsPresent -and $item.qa_report) {
                    Write-Host "  Detalle de checks:" -ForegroundColor Gray
                    foreach ($check in $item.qa_report.checks) {
                        $checkColor = switch ($check.status) {
                            "pass" { "Green" }
                            "warn" { "Yellow" }
                            "fail" { "Red" }
                            default { "Gray" }
                        }
                        $statusText = $check.status.ToUpper()
                        Write-Host ("    [{0}] {1}: {2}" -f $statusText, $check.label, $check.message) -ForegroundColor $checkColor
                    }
                }

            }
        }
        "empty" {
            Write-Host "Estado: empty" -ForegroundColor Yellow
            if ($response.message) {
                Write-Host "Mensaje: $($response.message)" -ForegroundColor Yellow
            }
        }
        default {
            Write-Host "Estado: $($response.status)" -ForegroundColor Yellow
            if ($response.message) {
                Write-Host "Mensaje: $($response.message)" -ForegroundColor Yellow
            }
        }
    }
}
catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "  [X] Inactivo (404)" -ForegroundColor Red
    }
    elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "  [~] Activo pero timeout" -ForegroundColor Yellow
    }
    else {
        Write-Host "  [?] Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
