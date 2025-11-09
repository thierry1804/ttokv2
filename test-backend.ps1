# Script de test pour le backend
Write-Host "🧪 Test du backend TikTok Live API" -ForegroundColor Cyan
Write-Host ""

# Aller dans le dossier backend
Set-Location backend

# Vérifier que le build existe
if (-not (Test-Path "dist/index.js")) {
    Write-Host "❌ Le build n'existe pas. Compilation en cours..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur de compilation" -ForegroundColor Red
        exit 1
    }
}

# Définir les variables d'environnement
$env:TIKTOK_UNIQUE_ID = "shentyandrianirina"
$env:PORT = "3001"
$env:WS_PORT = "3002"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "  - TIKTOK_UNIQUE_ID: $env:TIKTOK_UNIQUE_ID"
Write-Host "  - PORT: $env:PORT"
Write-Host "  - WS_PORT: $env:WS_PORT"
Write-Host ""

Write-Host "🚀 Démarrage du serveur..." -ForegroundColor Green
Write-Host ""

# Démarrer le serveur
node dist/index.js

