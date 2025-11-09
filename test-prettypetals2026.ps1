# Script de test complet pour le compte prettypetals2026
Write-Host "🧪 Test complet avec le compte prettypetals2026" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Compilation
Write-Host "1️⃣ Compilation du backend..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "dist/index.js")) {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur de compilation" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Compilation réussie" -ForegroundColor Green
Write-Host ""

# Étape 2: Démarrage du backend
Write-Host "2️⃣ Démarrage du backend avec prettypetals2026..." -ForegroundColor Yellow
$env:TIKTOK_UNIQUE_ID = "prettypetals2026"
$env:PORT = "3001"
$env:WS_PORT = "3002"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "  - TIKTOK_UNIQUE_ID: $env:TIKTOK_UNIQUE_ID"
Write-Host "  - PORT: $env:PORT"
Write-Host "  - WS_PORT: $env:WS_PORT"
Write-Host ""

Write-Host "🚀 Démarrage du serveur..." -ForegroundColor Green
Write-Host "⚠️  Le serveur va démarrer. Ouvrez un autre terminal pour tester l'API." -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur (bloquant)
node dist/index.js

