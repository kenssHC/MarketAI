# ============================================
# Script de Preparacion para Railway Deploy
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PREPARANDO PROYECTO PARA RAILWAY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generar N8N_ENCRYPTION_KEY
Write-Host "[*] Generando N8N_ENCRYPTION_KEY..." -ForegroundColor Yellow
$encryptionKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "N8N_ENCRYPTION_KEY=$encryptionKey" -ForegroundColor Green
Write-Host ""

# Verificar archivos necesarios
Write-Host "[*] Verificando archivos necesarios..." -ForegroundColor Yellow

$requiredFiles = @(
    ".gitignore",
    "../railway.json",
    "n8n/Dockerfile",
    "approval-ui/package.json",
    "approval-ui/nixpacks.toml",
    "RAILWAY_DEPLOY.md"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [FALTA] $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}
Write-Host ""

# Verificar estructura de directorios
Write-Host "[*] Verificando estructura..." -ForegroundColor Yellow

$requiredDirs = @(
    "n8n/workflows",
    "n8n/migrations",
    "approval-ui/server",
    "approval-ui/client/src"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        $count = (Get-ChildItem $dir -File -ErrorAction SilentlyContinue).Count
        Write-Host "  [OK] $dir - $count archivos" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] $dir - NO EXISTE" -ForegroundColor Red
    }
}
Write-Host ""

# Verificar workflows de n8n
Write-Host "[*] Workflows de n8n encontrados:" -ForegroundColor Yellow
$workflows = Get-ChildItem "n8n/workflows/*.json" -ErrorAction SilentlyContinue
if ($workflows) {
    foreach ($workflow in $workflows) {
        Write-Host "  - $($workflow.Name)" -ForegroundColor Cyan
    }
    Write-Host "  Total: $($workflows.Count) workflows" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] No se encontraron workflows" -ForegroundColor Yellow
}
Write-Host ""

# Verificar migraciones SQL
Write-Host "[*] Migraciones SQL encontradas:" -ForegroundColor Yellow
$migrations = Get-ChildItem "n8n/migrations/*.sql" -ErrorAction SilentlyContinue | Sort-Object Name
if ($migrations) {
    foreach ($migration in $migrations) {
        Write-Host "  - $($migration.Name)" -ForegroundColor Cyan
    }
    Write-Host "  Total: $($migrations.Count) migraciones" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] No se encontraron migraciones" -ForegroundColor Yellow
}
Write-Host ""

# Checklist final
Write-Host "[CHECKLIST] PRE-DEPLOY:" -ForegroundColor Cyan
Write-Host "  [ ] Código subido a GitHub" -ForegroundColor White
Write-Host "  [ ] Cuenta en Railway.app creada" -ForegroundColor White
Write-Host "  [ ] Variables de entorno preparadas (ver RAILWAY_DEPLOY.md)" -ForegroundColor White
Write-Host "  [ ] API Key de OpenAI lista" -ForegroundColor White
Write-Host "  [ ] Credenciales de WordPress listas" -ForegroundColor White
Write-Host ""

Write-Host "[SIGUIENTE PASO]" -ForegroundColor Green
Write-Host "   1. Commitear y pushear cambios a GitHub" -ForegroundColor White
Write-Host "   2. Ir a Railway.app y crear nuevo proyecto" -ForegroundColor White
Write-Host "   3. Seguir los pasos en RAILWAY_DEPLOY.md" -ForegroundColor White
Write-Host ""

Write-Host "[IMPORTANTE] Guarda esta encryption key en un lugar seguro:" -ForegroundColor Yellow
Write-Host "N8N_ENCRYPTION_KEY=$encryptionKey" -ForegroundColor Cyan
Write-Host ""

Write-Host "[LISTO] Preparacion completada!" -ForegroundColor Green

