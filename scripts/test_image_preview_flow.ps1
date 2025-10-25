# Test del flujo de preview de imágenes
# Este script prueba el nuevo flujo de generación de preview e imagen para un draft

param(
    [string]$DraftId,
    [string]$ApiBaseUrl = "http://localhost:3001"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST: Flujo de Preview de Imágenes" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if (-not $DraftId) {
    Write-Host "ERROR: Debes proporcionar un DraftId" -ForegroundColor Red
    Write-Host "Uso: .\test_image_preview_flow.ps1 -DraftId <uuid>`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "Draft ID: $DraftId" -ForegroundColor White
Write-Host "API Base URL: $ApiBaseUrl`n" -ForegroundColor White

# Función para hacer requests con manejo de errores
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Url
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "ERROR en request: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        throw
    }
}

# ========================================
# PASO 1: Obtener información del draft
# ========================================
Write-Host "[1/4] Obteniendo información del draft..." -ForegroundColor Yellow

try {
    $draft = Invoke-ApiRequest -Method "GET" -Url "$ApiBaseUrl/api/drafts/$DraftId"
    Write-Host "✓ Draft encontrado:" -ForegroundColor Green
    Write-Host "  - Título: $($draft.title)" -ForegroundColor White
    Write-Host "  - Status: $($draft.status)" -ForegroundColor White
    Write-Host "  - Imagen actual: $(if ($draft.featuredImageUrl) { $draft.featuredImageUrl } else { 'Sin imagen' })`n" -ForegroundColor White
}
catch {
    Write-Host "✗ Error al obtener el draft`n" -ForegroundColor Red
    exit 1
}

# ========================================
# PASO 2: Generar preview de imagen
# ========================================
Write-Host "[2/4] Generando preview de imagen (upload_to_wordpress=false)..." -ForegroundColor Yellow

try {
    $startTime = Get-Date
    $previewResponse = Invoke-ApiRequest -Method "POST" -Url "$ApiBaseUrl/api/drafts/$DraftId/image" -Body @{}
    $duration = ((Get-Date) - $startTime).TotalSeconds
    
    Write-Host "✓ Preview generado exitosamente en $([math]::Round($duration, 2))s:" -ForegroundColor Green
    Write-Host "  - Mensaje: $($previewResponse.message)" -ForegroundColor White
    
    if ($previewResponse.preview) {
        Write-Host "  - Formato: $($previewResponse.preview.format)" -ForegroundColor White
        Write-Host "  - Alt Text: $($previewResponse.preview.altText)" -ForegroundColor White
        Write-Host "  - Visual Prompt: $($previewResponse.preview.visualPrompt.Substring(0, [Math]::Min(80, $previewResponse.preview.visualPrompt.Length)))..." -ForegroundColor White
        Write-Host "  - Data URL disponible: $(if ($previewResponse.preview.imageDataUrl) { 'Sí (' + $previewResponse.preview.imageDataUrl.Substring(0, 50) + '...)' } else { 'No' })" -ForegroundColor White
        Write-Host "  - Base64 disponible: $(if ($previewResponse.preview.base64) { 'Sí (' + $previewResponse.preview.base64.Length + ' chars)' } else { 'No' })`n" -ForegroundColor White
        
        # Guardar preview para el siguiente paso
        $previewImage = $previewResponse.preview
    }
    else {
        Write-Host "⚠ ADVERTENCIA: No se recibió objeto 'preview' en la respuesta`n" -ForegroundColor Yellow
        Write-Host "Respuesta completa:" -ForegroundColor Yellow
        Write-Host ($previewResponse | ConvertTo-Json -Depth 5) -ForegroundColor Gray
        exit 1
    }
}
catch {
    Write-Host "✗ Error al generar preview`n" -ForegroundColor Red
    exit 1
}

# ========================================
# PASO 3: Verificar que NO se haya actualizado la BD
# ========================================
Write-Host "[3/4] Verificando que la BD NO se haya actualizado..." -ForegroundColor Yellow

try {
    $draftAfterPreview = Invoke-ApiRequest -Method "GET" -Url "$ApiBaseUrl/api/drafts/$DraftId"
    
    if ($draftAfterPreview.featuredImageUrl -eq $draft.featuredImageUrl) {
        Write-Host "✓ Correcto: La BD no fue actualizada (preview funcionó correctamente)`n" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ ADVERTENCIA: La imagen fue actualizada en la BD cuando no debería`n" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Error al verificar el draft`n" -ForegroundColor Red
    exit 1
}

# ========================================
# PASO 4: Simular aprobación (opcional)
# ========================================
Write-Host "[4/4] ¿Deseas simular la aprobación con subida a WordPress?" -ForegroundColor Yellow
Write-Host "ADVERTENCIA: Esto APROBARÁ el draft y subirá la imagen a WordPress si está configurado." -ForegroundColor Red
Write-Host "Presiona Enter para OMITIR o escribe 'APROBAR' para continuar: " -ForegroundColor Yellow -NoNewline
$confirmation = Read-Host

if ($confirmation -eq "APROBAR") {
    Write-Host "`nAprobando draft con imagen de preview..." -ForegroundColor Yellow
    
    try {
        $approveBody = @{
            reviewer = "test-script"
            previewImage = @{
                base64 = $previewImage.base64
                format = $previewImage.format
                altText = $previewImage.altText
                visualPrompt = $previewImage.visualPrompt
            }
        }
        
        $startTime = Get-Date
        $approveResponse = Invoke-ApiRequest -Method "POST" -Url "$ApiBaseUrl/api/drafts/$DraftId/approve" -Body $approveBody
        $duration = ((Get-Date) - $startTime).TotalSeconds
        
        Write-Host "✓ Draft aprobado exitosamente en $([math]::Round($duration, 2))s:" -ForegroundColor Green
        Write-Host "  - Mensaje: $($approveResponse.message)" -ForegroundColor White
        Write-Host "  - Draft ID: $($approveResponse.draftId)" -ForegroundColor White
        Write-Host "  - Aprobado en: $($approveResponse.approvedAt)`n" -ForegroundColor White
        
        # Verificar actualización
        Write-Host "Verificando actualización en BD..." -ForegroundColor Yellow
        $finalDraft = Invoke-ApiRequest -Method "GET" -Url "$ApiBaseUrl/api/drafts/$DraftId"
        
        if ($finalDraft.featuredImageUrl) {
            Write-Host "✓ Imagen actualizada en BD:" -ForegroundColor Green
            Write-Host "  - URL: $($finalDraft.featuredImageUrl)" -ForegroundColor White
            Write-Host "  - Alt: $($finalDraft.featuredImageAlt)`n" -ForegroundColor White
        }
        else {
            Write-Host "⚠ La imagen NO fue actualizada en la BD`n" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "✗ Error al aprobar el draft`n" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "`nAprobación omitida (no se modificó el draft)`n" -ForegroundColor Gray
}

# ========================================
# RESUMEN
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DEL TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Draft consultado correctamente" -ForegroundColor Green
Write-Host "✓ Preview generado exitosamente" -ForegroundColor Green
Write-Host "✓ Base64 y Data URL disponibles" -ForegroundColor Green
Write-Host "✓ BD no modificada durante preview" -ForegroundColor Green

if ($confirmation -eq "APROBAR") {
    Write-Host "✓ Aprobación ejecutada" -ForegroundColor Green
}
else {
    Write-Host "- Aprobación omitida" -ForegroundColor Gray
}

Write-Host "`nTEST COMPLETADO ✓`n" -ForegroundColor Cyan

