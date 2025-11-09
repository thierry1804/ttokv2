# TikTok Live Messages API v2

Service permettant de lister en temps réel les messages d'un live TikTok et de les afficher sur une plateforme React avec statistiques en temps réel (viewers et likes).

## 🏗️ Architecture

Le projet est composé de deux parties :

- **Backend** : Service Node.js/TypeScript qui écoute les messages TikTok en temps réel via `tiktok-live-connector`
- **Frontend** : Application React qui affiche les messages reçus via WebSocket avec statistiques en temps réel

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn

## 🚀 Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## ▶️ Démarrage

### 1. Démarrer le backend

#### Mode développement

```bash
cd backend
npm run dev
```

#### Mode production avec auto-démarrage

Le backend peut démarrer automatiquement l'écoute d'un live TikTok si la variable d'environnement `TIKTOK_UNIQUE_ID` est configurée.

**Linux/Mac :**
```bash
cd backend
export TIKTOK_UNIQUE_ID=shentyandrianirina
export PORT=3001
export WS_PORT=3002
npm run build
npm start
```

**Windows (PowerShell) :**
```powershell
cd backend
$env:TIKTOK_UNIQUE_ID="shentyandrianirina"
$env:PORT=3001
$env:WS_PORT=3002
npm run build
npm start
```

**Ou utiliser les scripts fournis :**

Linux/Mac :
```bash
cd backend
chmod +x start.sh
./start.sh
```

Windows :
```powershell
cd backend
.\start.ps1
```

Le serveur démarre sur :
- HTTP API : `http://localhost:3001`
- WebSocket : `ws://localhost:3002`

### 2. Démarrer le frontend

Dans un nouveau terminal :

```bash
cd frontend
npm run dev
```

L'application React démarre sur `http://localhost:3000`

## 📖 Utilisation

1. Ouvrez votre navigateur sur `http://localhost:3000`
2. Entrez l'`uniqueId` du créateur TikTok (ex: `username` sans le @)
3. Cliquez sur "Démarrer" pour commencer à écouter le live
4. Les messages apparaîtront en temps réel dans l'interface
5. Les statistiques (viewers et likes) s'affichent automatiquement en temps réel dans le panneau de contrôle

## ✨ Fonctionnalités

- **Messages en temps réel** : Affichage des messages de chat uniquement (filtrage des likes, gifts, follows, etc.)
- **Statistiques en direct** : Affichage du nombre de viewers et de likes en temps réel
- **Marquage intelligent** : Le premier message contenant "jp" suivi de chiffres ou uniquement des chiffres est automatiquement marqué
- **Informations utilisateur** : Affichage du nom d'utilisateur avec son pseudo TikTok (@uniqueId)
- **Précision temporelle** : Affichage de l'heure avec centièmes de seconde

## 🔌 API Endpoints

### `POST /api/tiktok/start`
Démarre l'écoute d'un live TikTok.

**Body:**
```json
{
  "uniqueId": "username"
}
```

### `POST /api/tiktok/stop`
Arrête l'écoute d'un live TikTok.

**Body:**
```json
{
  "uniqueId": "username"
}
```

### `GET /api/tiktok/active`
Liste les connexions actives.

### `GET /health`
Vérifie l'état du serveur.

## 📡 Types de messages WebSocket

Les messages sont transmis via WebSocket avec les types suivants :

- `chat` : Messages de chat (seul type affiché dans l'interface)
- `stats` : Statistiques en temps réel (viewers et likes) - affichées dans le panneau de contrôle
- `streamEnd` : Fin du stream
- `error` : Erreurs

**Note** : Les événements `gift`, `follow`, `like` et `share` sont capturés mais non affichés dans la liste des messages (uniquement utilisés pour les statistiques).

## 🛠️ Technologies utilisées

- **Backend** : Node.js, TypeScript, Express, WebSocket (ws), tiktok-live-connector
- **Frontend** : React, TypeScript, Vite, Axios

## ⚠️ Notes importantes

- TikTok ne fournit pas d'API officielle pour les lives. Cette solution utilise une API non officielle qui peut être sujette à des changements.
- Assurez-vous que le créateur est en live avant de démarrer l'écoute.
- Respectez les conditions d'utilisation de TikTok.

## 📝 Variables d'environnement

### Backend

Vous pouvez configurer les variables d'environnement de deux façons :

#### Option 1 : Variables d'environnement système (recommandé pour la production)

**Linux/Mac :**
```bash
export PORT=3001
export WS_PORT=3002
export TIKTOK_UNIQUE_ID=shentyandrianirina
```

**Windows (PowerShell) :**
```powershell
$env:PORT=3001
$env:WS_PORT=3002
$env:TIKTOK_UNIQUE_ID="shentyandrianirina"
```

#### Option 2 : Fichier `.env` (nécessite dotenv)

Créez un fichier `.env` dans le dossier `backend` :

```env
PORT=3001
WS_PORT=3002
TIKTOK_UNIQUE_ID=shentyandrianirina
```

**Note :** Si `TIKTOK_UNIQUE_ID` est configuré, l'écoute démarre automatiquement au lancement du serveur.

### Frontend

Créez un fichier `.env` dans le dossier `frontend` :

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002
```

## 🐛 Dépannage

- Si les messages n'apparaissent pas, vérifiez que le créateur est bien en live
- Vérifiez la console du navigateur pour les erreurs WebSocket
- Assurez-vous que les ports 3000, 3001 et 3002 sont disponibles
- Les statistiques (viewers/likes) peuvent prendre quelques secondes à apparaître après le démarrage

## 📊 Format des messages

Chaque message affiché contient :
- **Nom d'utilisateur** : Le nom d'affichage du créateur
- **Pseudo** : Le pseudo TikTok (@uniqueId) si différent du nom
- **Message** : Le contenu du message de chat
- **Heure** : Timestamp avec centièmes de seconde (format: HH:MM:SS.CC)
- **Marquage** : Badge "⭐ Premier match" pour le premier message correspondant au pattern

## 🎯 Pattern de détection

Le système marque automatiquement le premier message contenant :
- "jp" suivi de chiffres (ex: "jp1", "jp2", "jp10")
- Ou uniquement des chiffres (ex: "1", "2", "10")

