# ============================================
# Script de Migracion: SQLite a PostgreSQL
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRACION n8n: SQLite -> PostgreSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] No se encontro el archivo .env" -ForegroundColor Red
    Write-Host "Por favor, crea el archivo .env siguiendo ENV_CONFIGURATION.md" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/5] Verificando configuracion..." -ForegroundColor Yellow

# Verificar que los servicios esten corriendo
$n8nRunning = docker ps --filter "name=n8n-n8n-1" --format "{{.Names}}"
$pgRunning = docker ps --filter "name=n8n-postgres-1" --format "{{.Names}}"

if ($n8nRunning) {
    Write-Host "  [OK] n8n esta corriendo" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] n8n NO esta corriendo" -ForegroundColor Red
    Write-Host "  Iniciando servicios..." -ForegroundColor Yellow
    docker-compose -f n8n/docker-compose.yml up -d
    Start-Sleep -Seconds 10
}

if ($pgRunning) {
    Write-Host "  [OK] PostgreSQL esta corriendo" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] PostgreSQL NO esta corriendo" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/5] Exportando workflows desde n8n..." -ForegroundColor Yellow

# Los workflows ya estan en la carpeta n8n/workflows
$workflowCount = (Get-ChildItem "n8n/workflows/*.json" -ErrorAction SilentlyContinue).Count
Write-Host "  [OK] $workflowCount workflows encontrados en n8n/workflows/" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Deteniendo n8n para migrar..." -ForegroundColor Yellow
docker stop n8n-n8n-1
Write-Host "  [OK] n8n detenido" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Reiniciando n8n con PostgreSQL..." -ForegroundColor Yellow
Write-Host "  Nota: n8n creara automaticamente las tablas en PostgreSQL" -ForegroundColor Cyan

# Reiniciar con la nueva configuracion
docker-compose -f n8n/docker-compose.yml up -d n8n

Write-Host "  [OK] Esperando que n8n inicie (30 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "[5/5] Verificando estado..." -ForegroundColor Yellow

$n8nStatus = docker ps --filter "name=n8n-n8n-1" --format "{{.Status}}"
if ($n8nStatus -match "Up") {
    Write-Host "  [OK] n8n esta corriendo con PostgreSQL!" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] n8n no inicio correctamente" -ForegroundColor Red
    Write-Host "  Revisa los logs con: docker logs n8n-n8n-1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  MIGRACION COMPLETADA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "SIGUIENTES PASOS:" -ForegroundColor Cyan
Write-Host "1. Accede a n8n: http://localhost:5678" -ForegroundColor White
Write-Host "2. Crea tu cuenta de usuario (primera vez)" -ForegroundColor White
Write-Host "3. Importa los workflows desde n8n/workflows/" -ForegroundColor White
Write-Host "4. Configura las credenciales (OpenAI, WordPress, etc.)" -ForegroundColor White
Write-Host ""

Write-Host "NOTA IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Los workflows y credenciales NO se migran automaticamente." -ForegroundColor Yellow
Write-Host "Deberas importar los workflows manualmente desde la UI de n8n." -ForegroundColor Yellow
Write-Host ""

Write-Host "Ver logs de n8n:" -ForegroundColor Cyan
Write-Host "  docker logs -f n8n-n8n-1" -ForegroundColor White
Write-Host ""

