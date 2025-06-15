# 🎵 Spotify API Setup für WeddingPix

## 📋 Schritt-für-Schritt Anleitung

### 1. Spotify Developer Account erstellen

1. Gehe zu [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Logge dich mit deinem Spotify-Account ein
3. Klicke auf "Create an App"

### 2. App konfigurieren

**App Details:**
- **App Name:** `WeddingPix Musikwünsche`
- **App Description:** `Musikwunsch-System für Hochzeitswebsite`
- **Website:** `https://deine-domain.com` (oder localhost für Tests)
- **Redirect URIs:** `https://deine-domain.com/callback`

**Wichtige Einstellungen:**
- ✅ Web API aktivieren
- ✅ Web Playback SDK (optional)
- ❌ Keine anderen APIs nötig

### 3. API-Schlüssel kopieren

Nach der App-Erstellung findest du:
- **Client ID:** `abc123...` (öffentlich sichtbar)
- **Client Secret:** `xyz789...` (GEHEIM halten!)

### 4. Umgebungsvariablen setzen

Erstelle eine `.env` Datei im Projektordner:

```env
# Spotify API
VITE_SPOTIFY_CLIENT_ID=deine_client_id_hier
VITE_SPOTIFY_CLIENT_SECRET=dein_client_secret_hier

# Firebase (bereits konfiguriert)
VITE_FIREBASE_API_KEY=...
```

### 5. Server neu starten

```bash
npm run dev
```

## 🎵 Was passiert dann?

### ✅ Mit Spotify API (empfohlen):

1. **🌍 ALLE Spotify Songs:** Zugriff auf Millionen von Tracks
2. **🔍 Echte Suche:** Live-Suche in der kompletten Spotify-Datenbank
3. **📊 Vollständige Metadaten:** Album-Cover, Künstler, Popularität, Dauer
4. **🔗 Spotify-Links:** Direkte Links zu Songs
5. **⚡ Schnelle Suche:** Auto-Complete mit 300ms Delay
6. **🎯 URL-Import:** Songs per Spotify-Link hinzufügen

### 🔄 Ohne Spotify API (Fallback):

1. **📚 Demo-Datenbank:** 60+ beliebte Songs für Tests
2. **🔍 Lokale Suche:** Suche in der Demo-Datenbank
3. **📊 Mock-Metadaten:** Realistische Test-Daten
4. **🎯 Begrenzte Auswahl:** Nur vordefinierte Songs

## 🎵 Funktionen der Spotify-Integration

### 🔍 Suchfunktionen:

- **Titel + Künstler:** "Perfect Ed Sheeran"
- **Nur Titel:** "Thinking Out Loud"
- **Nur Künstler:** "Bruno Mars"
- **Album:** "÷ Divide"
- **Genre:** "Rock", "Pop", "Hochzeit"
- **Gemischt:** "Hochzeit Liebe"

### 📱 URL-Import:

Unterstützte Formate:
- `https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v`
- `https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v?si=...`

## 🚀 Deployment

### Netlify/Vercel:
```bash
# Umgebungsvariablen in der Plattform setzen:
VITE_SPOTIFY_CLIENT_ID=abc123...
VITE_SPOTIFY_CLIENT_SECRET=xyz789...
```

### Lokale Entwicklung:
```bash
npm install
npm run dev
```

## 🔒 Sicherheit

**✅ Sicher:**
- Client Credentials Flow (nur öffentliche Daten)
- Keine Benutzeranmeldung erforderlich
- Token automatisch erneuert
- Client Secret nur serverseitig verwendet

**⚠️ Wichtig:**
- Client Secret NIEMALS in Git committen
- `.env` in `.gitignore` hinzufügen
- Nur HTTPS in Produktion verwenden

## 🐛 Troubleshooting

### Problem: "Spotify auth failed: 400"
**Lösung:** Client ID/Secret prüfen

### Problem: "CORS error"
**Lösung:** Redirect URI in Spotify App konfigurieren

### Problem: "No results found"
**Lösung:** Fallback auf Mock-Daten funktioniert automatisch

### Problem: Token expired
**Lösung:** Automatische Erneuerung implementiert

### Problem: "Spotify API credentials not configured"
**Lösung:** 
1. `.env` Datei erstellen
2. Spotify Client ID und Secret hinzufügen
3. Server neu starten (`npm run dev`)

## 📊 API-Limits

**Spotify Web API:**
- ✅ Kostenlos für Suche
- ✅ Bis zu 100 Anfragen/Minute
- ✅ Keine Benutzer-Authentifizierung nötig
- ✅ Kommerzielle Nutzung erlaubt
- ✅ Millionen von Songs verfügbar

## 🎯 Nächste Schritte

1. **Spotify App erstellen** (5 Minuten)
2. **API-Schlüssel kopieren** (1 Minute)
3. **`.env` Datei erstellen** (1 Minute)
4. **Server neu starten** (1 Minute)
5. **Testen** (2 Minuten)

**Gesamt: ~10 Minuten für vollständige Spotify-Integration! 🎉**

## 🎵 Beispiel-Suchen zum Testen

Mit echter Spotify API kannst du nach ALLEM suchen:

- `Metallica Enter Sandman`
- `Ed Sheeran Perfect`
- `Hochzeitslieder`
- `Deutsche Musik`
- `Rock Klassiker`
- `Party Hits`
- `Taylor Swift`
- `Adele`
- `Queen Bohemian Rhapsody`
- `Beatles Hey Jude`

**Ohne API:** Nur die Songs aus der Demo-Datenbank verfügbar.