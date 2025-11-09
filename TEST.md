# Guide de test complet

## 🚀 Test rapide avec prettypetals2026

### Terminal 1 - Backend
```powershell
.\test-prettypetals2026.ps1
```

### Terminal 2 - Test API (après démarrage du backend)
```powershell
.\test-api-prettypetals.ps1
```

### Terminal 3 - Frontend
```powershell
cd frontend
npm run dev
```
Puis ouvrez `http://localhost:3000` dans votre navigateur.

---

## Guide de test complet

## ✅ Corrections apportées

1. **Démarrage non-bloquant** : Utilisation de `setImmediate()` pour éviter de bloquer le démarrage du serveur
2. **Gestion d'erreur améliorée** : Retry automatique avec backoff exponentiel
3. **Nettoyage des connexions** : Nettoyage automatique en cas d'échec

## 🧪 Tests à effectuer

### Test 1 : Compilation

```powershell
cd backend
npm run build
```

**Résultat attendu** : Compilation réussie sans erreur

### Test 2 : Démarrage du backend avec auto-démarrage

```powershell
cd backend
$env:TIKTOK_UNIQUE_ID="shentyandrianirina"
$env:PORT=3001
$env:WS_PORT=3002
npm start
```

**Vérifications attendues** :
- ✅ `🚀 Serveur HTTP démarré sur le port 3001`
- ✅ `🔌 Serveur WebSocket démarré sur le port 3002`
- ✅ `📡 Prêt à écouter les lives TikTok`
- ✅ `🔄 Démarrage automatique de l'écoute pour shentyandrianirina...`
- ✅ Si l'utilisateur est en live : `✅ Écoute automatique démarrée pour shentyandrianirina`
- ✅ Si l'utilisateur n'est pas en live : Messages de retry automatique

### Test 3 : Health Check API

Dans un **nouveau terminal** (pendant que le serveur tourne) :

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
```

**Résultat attendu** :
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

### Test 4 : Active Connections API

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/tiktok/active" -Method Get
```

**Résultat attendu** :
- Si connexion réussie : `{"activeConnections":["shentyandrianirina"]}`
- Si connexion échouée : `{"activeConnections":[]}`

### Test 5 : Démarrage manuel via API

```powershell
$body = @{
    uniqueId = "shentyandrianirina"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/tiktok/start" -Method Post -Body $body -ContentType "application/json"
```

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Écoute du live de shentyandrianirina démarrée",
  "uniqueId": "shentyandrianirina"
}
```

### Test 6 : Frontend

Dans un **nouveau terminal** :

```powershell
cd frontend
npm run dev
```

Puis ouvrir `http://localhost:3000` dans le navigateur.

**Vérifications** :
- ✅ L'interface se charge
- ✅ Le champ uniqueId peut être rempli
- ✅ Les messages arrivent en temps réel si le live est actif
- ✅ Les statistiques (viewers/likes) s'affichent

### Test 7 : Gestion d'erreur (utilisateur non en live)

```powershell
cd backend
$env:TIKTOK_UNIQUE_ID="utilisateur_inexistant"
npm start
```

**Vérifications** :
- ✅ Le serveur démarre quand même
- ✅ Messages de retry apparaissent (3 tentatives)
- ✅ Pas de crash du serveur
- ✅ Message final : `ℹ️  Le serveur continue de fonctionner. Vous pouvez démarrer manuellement via l'API.`

## 📝 Notes importantes

1. **L'utilisateur doit être en live** : L'auto-démarrage ne fonctionnera que si l'utilisateur TikTok est actuellement en live
2. **Retry automatique** : Le système réessayera automatiquement 3 fois avec des délais de 1s, 2s, 4s
3. **Le serveur continue** : Même si la connexion TikTok échoue, le serveur HTTP/WebSocket continue de fonctionner
4. **Démarrage manuel possible** : Vous pouvez toujours démarrer manuellement via l'API `/api/tiktok/start`

## 🔧 Scripts de test fournis

- `test-backend.ps1` : Démarre le backend avec les bonnes variables d'environnement
- `test-api.ps1` : Teste les endpoints de l'API (à lancer dans un autre terminal)

