# 🎮 Advanced Pong Game

Ce projet est une version améliorée du jeu **Pong**, intégrant des fonctionnalités avancées comme une **IA intelligente**, une **personnalisation du jeu**, un **chat en direct**, une **compatibilité multi-navigateurs** et bien plus encore.  
Il a été réalisé en équipe de **trois développeurs** avec une architecture **backend en Django** et une interface dynamique en **JavaScript et WebSockets**.

---

## 🚀 Fonctionnalités Principales

- 🎭 **Personnalisation du jeu** : choix des thèmes, des effets et des règles.
- 🏆 **Mode IA avancé** : un bot qui simule un joueur humain et anticipe les mouvements.
- 🌍 **Multijoueur en ligne** : avec **Django Channels** pour une communication en **temps réel**.
- 💬 **Chat en direct** : communication instantanée entre les joueurs.
- 🔄 **Support multi-langues** : interface disponible en plusieurs langues.
- 📱 **Compatibilité accrue** : fonctionne sur tous les navigateurs modernes.
- 🎨 **Effets visuels dynamiques** : traînée de balle personnalisable.
- 🔗 **API RESTful** : permettant d'intégrer le jeu avec d'autres services.

---

## 🛠 Technologies Utilisées

- **Backend** : Django, Django REST Framework, Django Channels, WebSockets.
- **Base de données** : PostgreSQL.
- **Frontend** : HTML, CSS, JavaScript, WebSockets.
- **Conteneurisation** : Docker & Docker Compose.
- **Authentification** : OAuth2 avec des providers externes.
- **Déploiement** : Nginx & Gunicorn.

---

## 🏗 Structure du Projet

📁 **backend/** *(Django, API, WebSockets, gestion des scores, etc.)*  
📁 **frontend/** *(Interface utilisateur, rendu du jeu, animations, etc.)*  
📁 **database/** *(Gestion des utilisateurs et des parties stockées)*  
📁 **config/** *(Fichiers de configuration pour Docker et le serveur)*  

---

## 🐳 Démarrer avec Docker

### 1️⃣ **Prérequis**
- [Docker](https://www.docker.com/get-started) installé sur votre machine.
- [Docker Compose](https://docs.docker.com/compose/) configuré.

### 2️⃣ **Installation**
```bash
git clone git@github.com:ykifadji/ft_transcendence.git
cd ft_transcendence
make
```

## 🎮 Explication du Code

### 🕹️ Backend du Jeu
- **Mécaniques principales** : Déplacement de la balle, gestion des **collisions** avec les murs et les **paddles**.
- **Gestion des scores** : Lorsque la balle sort du terrain, le score est mis à jour.
- **Gestion du multijoueur** : Implémenté avec **Django Channels** pour une synchronisation en **temps réel**.

### 🤖 Mode IA
- **Prédiction de la balle** : L’IA calcule la trajectoire en fonction des rebonds.
- **Simulation d’un humain** : Limitation des mises à jour pour éviter un bot parfait.
- **Adaptabilité** : Le bot s’ajuste aux **power-ups** et aux changements de vitesse.

### ☄️ Effet de Traînée de la Balle
- **Stockage des positions** : Chaque frame, les anciennes positions sont sauvegardées.
- **Rendu progressif** : Un effet de dégradé et de flou est appliqué pour une sensation de vitesse.
- **Personnalisation** : L’effet change selon le **thème sélectionné**.
