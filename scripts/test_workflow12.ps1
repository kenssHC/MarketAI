param(
    [int]$Limit = 1,
    [string]$DraftId,
    [string]$IdeaId,
    [switch]$Force,
    [string]$WordpressEndpoint,
    [string]$WordpressAuthHeader,
    [string]$WordpressNonce,
    [string]$GeminiModel,
    [string]$OpenAIModel,
    [string]$WordpressTitle,
    [switch]$VerboseBody
)

$baseUrl = "http://localhost:5678/webhook"
$uri = "$baseUrl/seo/imagenes/generar"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Test Workflow 12: Generacion de Imagenes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$body = @{
    limit = $Limit
    force = $Force.IsPresent
}

if ($DraftId) { $body.draft_id = $DraftId }
if ($IdeaId) { $body.idea_id = $IdeaId }
if ($WordpressEndpoint) { $body.wordpress_endpoint = $WordpressEndpoint }
if ($WordpressAuthHeader) { $body.wordpress_auth_header = $WordpressAuthHeader }
if ($WordpressNonce) { $body.wordpress_nonce = $WordpressNonce }
if ($WordpressTitle) { $body.wordpress_title = $WordpressTitle }
if ($GeminiModel) { $body.gemini_model = $GeminiModel }
if ($OpenAIModel) { $body.openai_model = $OpenAIModel }

$bodyJson = $body | ConvertTo-Json -Depth 5

Write-Host "Endpoint: $uri" -ForegroundColor Gray
if ($VerboseBody.IsPresent) {
    Write-Host "Body:" -ForegroundColor Gray
    Write-Host $bodyJson -ForegroundColor DarkGray
}
Write-Host ""

try {
    Write-Host "Ejecutando workflow..." -ForegroundColor White
    $response = Invoke-RestMethod -Method Post -Uri $uri -Body $bodyJson -ContentType "application/json" -TimeoutSec 120

    if ($response.status -eq 'success') {
        Write-Host "Estado: $($response.status)" -ForegroundColor Green
        Write-Host "Drafts procesados: $($response.total_drafts_processed)" -ForegroundColor Cyan
        Write-Host "Imagenes generadas: $($response.total_images_created)" -ForegroundColor Cyan

        if ($response.drafts) {
            foreach ($item in $response.drafts) {
                Write-Host "  - Draft: $($item.draft_id)" -ForegroundColor White
                Write-Host "    Idea:  $($item.idea_id)" -ForegroundColor DarkGray
                Write-Host "    Cluster: $($item.cluster_name)" -ForegroundColor DarkGray
                if ($item.media_id) {
                    Write-Host "    Media ID: $($item.media_id)" -ForegroundColor DarkGray
                }
                Write-Host "    URL: $($item.image_url)" -ForegroundColor Green
                if ($item.wordpress_media_url -and $item.wordpress_media_url -ne $item.image_url) {
                    Write-Host "    Media URL: $($item.wordpress_media_url)" -ForegroundColor Gray
                }
                Write-Host "    Alt: $($item.alt_text)" -ForegroundColor Gray
                Write-Host "    Prompt: $($item.visual_prompt)" -ForegroundColor Gray
                if ($item.job_log_id) {
                    Write-Host "    Job Log: $($item.job_log_id)" -ForegroundColor DarkGray
                }
                Write-Host ""
            }
        }
    }
    else {
        Write-Host "Estado: $($response.status)" -ForegroundColor Yellow
        if ($response.message) {
            Write-Host "Mensaje: $($response.message)" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "Error al ejecutar el workflow" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response -and $_.Exception.Response.Content) {
        Write-Host "Respuesta:" -ForegroundColor DarkRed
        Write-Host $_.Exception.Response.Content -ForegroundColor DarkRed
    }
    exit 1
}
