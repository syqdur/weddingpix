# 💖 WeddingPix: Eure interaktive Hochzeitsgalerie & Musikwunsch-Plattform


_Ein modernes, interaktives Web-Erlebnis für euren besonderen Tag._

## ✨ Über WeddingPix

WeddingPix ist eine innovative Webanwendung, die speziell dafür entwickelt wurde, die schönsten Momente eurer Hochzeit festzuhalten und zu teilen. Gäste können Fotos und Videos im Instagram-Stil hochladen, persönliche Notizen hinterlassen, Musikwünsche über Spotify einreichen und die Liebesgeschichte des Paares in einer interaktiven Timeline verfolgen. Mit einem intuitiven Admin-Panel behaltet ihr stets die volle Kontrolle über eure Inhalte.

## 🚀 Features auf einen Blick

*   **📸 Instagram-Style Galerie:** Eine wunderschöne, mobile-first Galerie, in der Gäste ihre Fotos und Videos teilen, liken und kommentieren können.
    *   _Stell dir hier einen Screenshot der Galerie vor, mit mehreren Bildern und Kommentaren._
*   **⚡ Stories (24h):** Teilt spontane Momente, die nach 24 Stunden automatisch verschwinden – perfekt für Live-Eindrücke vom Fest!
    *   _Stell dir hier einen Screenshot der Stories-Leiste und eines Story-Viewers vor._
*   **🎵 Musikwünsche via Spotify:** Gäste können Songs direkt aus Spotify suchen und zu eurer Hochzeits-Playlist hinzufügen. Mit **optimistischen Updates** für sofortiges Feedback!
    *   _Stell dir hier einen Screenshot der Musikwunsch-Seite mit Suchergebnissen und der Playlist vor._
*   **💕 Interaktive Timeline:** Eine chronologische Darstellung eurer Liebesgeschichte mit wichtigen Meilensteinen, Fotos und Videos.
    *   _Stell dir hier einen Screenshot der Timeline mit verschiedenen Events und Medien vor._
*   **🔒 Umfassendes Admin-Panel:** Volle Kontrolle über die Website – Medien verwalten, Benutzer überwachen, Website-Status ändern (Under Construction / Live), und Spotify-Integration konfigurieren.
    *   _Stell dir hier einen Screenshot des Admin-Panels mit den verschiedenen Optionen vor._
*   **🌙 Dark Mode:** Ein elegantes Design, das sich an die Vorlieben der Nutzer anpasst.
*   **👥 Live-Benutzeranzeige:** Seht, wie viele Gäste gerade online sind und aktiv teilnehmen.
*   **📱 Responsives Design:** Optimiert für alle Geräte – vom Smartphone bis zum Desktop.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **Backend/Database:** Google Firebase (Firestore für Daten, Cloud Storage für Medien)
*   **Spotify Integration:** Spotify Web API (mit PKCE für sichere Authentifizierung)
*   **Deployment:** Netlify

## ⚙️ Setup & Installation

Folge diesen Schritten, um WeddingPix lokal einzurichten:

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/dein-username/weddingpix.git
    cd weddingpix
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

3.  **Firebase konfigurieren:**
    *   Erstelle ein Firebase-Projekt in der [Firebase Console](https://console.firebase.google.com/).
    *   Aktiviere **Firestore Database** und **Cloud Storage**.
    *   Füge eine Web-App zu deinem Projekt hinzu und kopiere die Konfigurationsdaten.
    *   Erstelle eine `.env` Datei im Hauptverzeichnis deines Projekts und füge deine Firebase-Konfiguration hinzu:
        ```env
        VITE_FIREBASE_API_KEY=your_firebase_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
        VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
        VITE_FIREBASE_APP_ID=your_firebase_app_id
        VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
        ```
    *   **Wichtig:** Stelle sicher, dass deine Firebase Storage-Regeln das Hochladen von Dateien erlauben (z.B. `allow write: if request.auth != null;` für authentifizierte Benutzer oder `allow write;` für öffentliche Uploads, je nach Anforderung).

4.  **Spotify API konfigurieren:**
    *   Die detaillierte Anleitung zur Einrichtung der Spotify API findest du in der `README_SPOTIFY_SETUP.md` Datei.
    *   Kurz gesagt: Erstelle eine App im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications), kopiere `Client ID` und `Client Secret` und füge sie in deine `.env` Datei ein:
        ```env
        VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
        VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
        VITE_SPOTIFY_REDIRECT_URI=https://kristinundmauro.de/ # Oder deine lokale URL, z.B. http://localhost:5173/
        ```
    *   **Achtung:** Füge `https://kristinundmauro.de/` (oder deine lokale Entwicklungs-URL) als `Redirect URI` in den Einstellungen deiner Spotify-App hinzu.

5.  **Anwendung starten:**
    ```bash
    npm run dev
    ```
    Die Anwendung sollte nun unter `http://localhost:5173/` (oder einem anderen Port) verfügbar sein.

## 🚀 Deployment

Dieses Projekt ist für das Deployment auf **Netlify** optimiert.

1.  **Netlify-Konto erstellen:** Falls noch nicht geschehen, registriere dich bei [Netlify](https://www.netlify.com/).
2.  **Neues Projekt importieren:** Verbinde dein GitHub-Repository mit Netlify.
3.  **Build-Einstellungen:**
    *   **Build Command:** `npm run build`
    *   **Publish directory:** `dist`
4.  **Umgebungsvariablen:** Füge alle `VITE_` Variablen aus deiner `.env` Datei in den Netlify-Umgebungsvariablen (Site settings -> Build & deploy -> Environment) hinzu.
5.  **Deploy:** Netlify wird deine Anwendung automatisch bauen und deployen.

**Live Demo:**
Schaut euch die Live-Version an: [https://kristinundmauro.de](https://kristinundmauro.de)

## 🤝 Mitwirken

Wir freuen uns über Beiträge! Wenn du Ideen oder Verbesserungen hast, öffne gerne ein Issue oder sende einen Pull Request.

## 📄 Lizenz

**!! This repository is not open source. Cloning and usage is permitted for educational and study purposes only. Any commercial use, redistribution, or code theft is strictly prohibited. By accessing this repository, you agree to these terms and conditions.**

---

Made with ❤️ by Mauro
