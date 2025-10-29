# ============================================
# Script: Aplicar Migración 003 - Scheduled Publications
# Descripción: Aplica la migración para el sistema de publicación programada
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Aplicando Migración 003" -ForegroundColor Cyan
Write-Host "  Sistema de Publicación Programada" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$migrationFile = Join-Path $projectRoot "n8n\migrations\003_add_scheduled_publications.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: No se encuentra el archivo de migración" -ForegroundColor Red
    Write-Host "   Esperado en: $migrationFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Archivo de migración encontrado" -ForegroundColor Green
Write-Host ""

# Verificar que Docker está corriendo
try {
    $dockerRunning = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Docker no está corriendo" -ForegroundColor Red
        Write-Host "   Inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: No se pudo verificar Docker" -ForegroundColor Red
    exit 1
}

# Verificar que el contenedor de PostgreSQL está corriendo
Write-Host ""
Write-Host "🔍 Verificando contenedor PostgreSQL..." -ForegroundColor Cyan

$n8nDir = Join-Path $projectRoot "n8n"
Push-Location $n8nDir

$postgresContainer = docker-compose ps postgres 2>&1 | Select-String "Up"

if (-not $postgresContainer) {
    Write-Host "⚠️  El contenedor PostgreSQL no está corriendo" -ForegroundColor Yellow
    Write-Host "   Iniciando contenedores..." -ForegroundColor Cyan
    docker-compose up -d
    Start-Sleep -Seconds 5
}

Write-Host "✅ PostgreSQL está listo" -ForegroundColor Green
Write-Host ""

# Aplicar la migración
Write-Host "📝 Aplicando migración..." -ForegroundColor Cyan
Write-Host ""

try {
    # Leer el contenido del archivo de migración
    $migrationContent = Get-Content $migrationFile -Raw
    
    # Aplicar la migración usando docker-compose exec
    $result = $migrationContent | docker-compose exec -T postgres psql -U marketai_user -d marketai_seo 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migración aplicada exitosamente" -ForegroundColor Green
        Write-Host ""
        
        # Verificar las tablas creadas
        Write-Host "🔍 Verificando tablas creadas..." -ForegroundColor Cyan
        $tables = docker-compose exec -T postgres psql -U marketai_user -d marketai_seo -c "\dt" 2>&1
        
        if ($tables -match "scheduled_publications") {
            Write-Host "✅ Tabla 'scheduled_publications' creada correctamente" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "📊 Estructura de la nueva tabla:" -ForegroundColor Cyan
        docker-compose exec -T postgres psql -U marketai_user -d marketai_seo -c "\d scheduled_publications"
        
        Write-Host ""
        Write-Host "🎉 Migración completada con éxito" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos pasos:" -ForegroundColor Cyan
        Write-Host "  1. Crear Workflow 14 (Publicación en WordPress)" -ForegroundColor White
        Write-Host "  2. Agregar endpoints de programación al backend" -ForegroundColor White
        Write-Host "  3. Actualizar la UI para programar publicaciones" -ForegroundColor White
        Write-Host "  4. Implementar el servicio de scheduler (cron job)" -ForegroundColor White
        
    } else {
        Write-Host "❌ ERROR al aplicar la migración" -ForegroundColor Red
        Write-Host $result -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

