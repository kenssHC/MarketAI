param(
    [Parameter(Mandatory=$true)]
    [string]$DraftId,
    [string]$WpStatus = "publish",
    [string]$WordpressEndpoint,
    [string]$WordpressAuthHeader,
    [string]$WordpressNonce,
    [switch]$VerboseBody
)

$baseUrl = "http://localhost:5678/webhook"
$uri = "$baseUrl/seo/publicar"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Test Workflow 14: Publicacion WordPress" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$body = @{
    draft_id = $DraftId
    wp_status = $WpStatus
}

if ($WordpressEndpoint) { $body.wordpress_endpoint = $WordpressEndpoint }
if ($WordpressAuthHeader) { $body.wordpress_auth_header = $WordpressAuthHeader }
if ($WordpressNonce) { $body.wordpress_nonce = $WordpressNonce }

$bodyJson = $body | ConvertTo-Json -Depth 5

Write-Host "Endpoint: $uri" -ForegroundColor Gray
Write-Host "Draft ID: $DraftId" -ForegroundColor White
if ($VerboseBody.IsPresent) {
    Write-Host "Body:" -ForegroundColor Gray
    Write-Host $bodyJson -ForegroundColor DarkGray
}
Write-Host ""

try {
    Write-Host "Publicando en WordPress..." -ForegroundColor White
    $response = Invoke-RestMethod -Method Post -Uri $uri -Body $bodyJson -ContentType "application/json" -TimeoutSec 120

    if ($response.status -eq 'success') {
        Write-Host "✅ Estado: $($response.status)" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Artículo Publicado:" -ForegroundColor Cyan
        Write-Host "  Título: $($response.draft_title)" -ForegroundColor White
        Write-Host "  Draft ID: $($response.draft_id)" -ForegroundColor DarkGray
        Write-Host "  WordPress Post ID: $($response.wordpress_post_id)" -ForegroundColor Green
        Write-Host "  URL: $($response.wordpress_post_url)" -ForegroundColor Green
        Write-Host "  Estado WP: $($response.wordpress_status)" -ForegroundColor Cyan
        Write-Host "  Publicado: $($response.published_at)" -ForegroundColor Gray
        if ($response.project_name) {
            Write-Host "  Proyecto: $($response.project_name)" -ForegroundColor DarkGray
        }
        if ($response.job_log_id) {
            Write-Host "  Job Log ID: $($response.job_log_id)" -ForegroundColor DarkGray
        }
        Write-Host ""
        Write-Host "✅ Verificar en: $($response.wordpress_post_url)" -ForegroundColor Green
    }
    elseif ($response.status -eq 'error') {
        Write-Host "❌ Estado: error" -ForegroundColor Red
        Write-Host "Mensaje: $($response.message)" -ForegroundColor Yellow
        if ($response.draft_id) {
            Write-Host "Draft ID: $($response.draft_id)" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "⚠️  Estado: $($response.status)" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Error al ejecutar el workflow" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Detalles del error:" -ForegroundColor Yellow
        try {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host ($errorJson | ConvertTo-Json -Depth 5) -ForegroundColor DarkYellow
        }
        catch {
            Write-Host $_.ErrorDetails.Message -ForegroundColor DarkYellow
        }
    }
    
    exit 1
}

