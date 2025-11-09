# Script de test API pour prettypetals2026
Write-Host "🧪 Test de l'API backend (prettypetals2026)" -ForegroundColor Cyan
Write-Host ""

# Attendre que le serveur soit prêt
Write-Host "⏳ Attente du démarrage du serveur (5 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# Test 1: Health check
Write-Host "1️⃣ Test Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Health check OK" -ForegroundColor Green
    Write-Host "   Réponse: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check échoué: $_" -ForegroundColor Red
    Write-Host "   Le serveur n'est peut-être pas encore démarré. Réessayez dans quelques secondes." -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Active connections
Write-Host "2️⃣ Test Active Connections..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/tiktok/active" -Method Get -TimeoutSec 5
    Write-Host "✅ Active connections récupérées" -ForegroundColor Green
    Write-Host "   Connexions actives: $($response.activeConnections -join ', ')" -ForegroundColor Gray
    if ($response.activeConnections.Count -gt 0) {
        Write-Host "   ✅ Connexion TikTok active!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Aucune connexion active (l'utilisateur n'est peut-être pas en live)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Active connections échoué: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Démarrage manuel (si pas déjà démarré)
Write-Host "3️⃣ Test Démarrage manuel..." -ForegroundColor Yellow
try {
    $body = @{
        uniqueId = "prettypetals2026"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/tiktok/start" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Démarrage manuel réussi" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
} catch {
    $errorMsg = $_.Exception.Response
    if ($errorMsg) {
        Write-Host "⚠️  Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   (La connexion est peut-être déjà active ou l'utilisateur n'est pas en live)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Démarrage manuel échoué: $_" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "✅ Tests terminés" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Pour tester le frontend:" -ForegroundColor Cyan
Write-Host "   1. Ouvrez un nouveau terminal" -ForegroundColor White
Write-Host "   2. cd frontend" -ForegroundColor White
Write-Host "   3. npm run dev" -ForegroundColor White
Write-Host "   4. Ouvrez http://localhost:3000 dans votre navigateur" -ForegroundColor White

