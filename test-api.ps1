# Script de test pour l'API
Write-Host "🧪 Test de l'API backend" -ForegroundColor Cyan
Write-Host ""

# Attendre que le serveur soit prêt
Start-Sleep -Seconds 3

# Test 1: Health check
Write-Host "1️⃣ Test Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "✅ Health check OK: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check échoué: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Active connections
Write-Host "2️⃣ Test Active Connections..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/tiktok/active" -Method Get
    Write-Host "✅ Active connections: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Active connections échoué: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Tests terminés" -ForegroundColor Green

