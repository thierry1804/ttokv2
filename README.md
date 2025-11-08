# TikTok Live Messages API v2

Service permettant de lister en temps réel les messages d'un live TikTok et de les afficher sur une plateforme React.

## 🏗️ Architecture

Le projet est composé de deux parties :

- **Backend** : Service Node.js/TypeScript qui écoute les messages TikTok en temps réel via `@tobyg74/tiktok-api-live`
- **Frontend** : Application React qui affiche les messages reçus via WebSocket

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

```bash
cd backend
npm run dev
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

- `chat` : Messages de chat
- `gift` : Cadeaux reçus
- `follow` : Nouveaux followers
- `like` : Likes
- `share` : Partages
- `streamEnd` : Fin du stream
- `error` : Erreurs

## 🛠️ Technologies utilisées

- **Backend** : Node.js, TypeScript, Express, WebSocket (ws), @tobyg74/tiktok-api-live
- **Frontend** : React, TypeScript, Vite, Axios

## ⚠️ Notes importantes

- TikTok ne fournit pas d'API officielle pour les lives. Cette solution utilise une API non officielle qui peut être sujette à des changements.
- Assurez-vous que le créateur est en live avant de démarrer l'écoute.
- Respectez les conditions d'utilisation de TikTok.

## 📝 Variables d'environnement

### Backend

Créez un fichier `.env` dans le dossier `backend` :

```env
PORT=3001
WS_PORT=3002
```

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

