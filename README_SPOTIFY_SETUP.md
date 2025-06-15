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

### 5. Code anpassen

In `src/services/spotifyService.ts`:

```typescript
// Ersetze diese Zeilen:
const SPOTIFY_CLIENT_ID = 'dein_spotify_client_id';
const SPOTIFY_CLIENT_SECRET = 'dein_spotify_client_secret';

// Mit:
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
```

## 🔧 Funktionen der Spotify-Integration

### ✅ Was funktioniert:

1. **🔍 Echte Suche:** Zugriff auf Millionen von Songs
2. **📊 Vollständige Metadaten:** Album-Cover, Künstler, Popularität
3. **🔗 Spotify-Links:** Direkte Links zu Songs
4. **⚡ Schnelle Suche:** Auto-Complete mit 300ms Delay
5. **🎯 URL-Import:** Songs per Spotify-Link hinzufügen

### 🎵 Suchfunktionen:

- **Titel + Künstler:** "Perfect Ed Sheeran"
- **Nur Titel:** "Thinking Out Loud"
- **Nur Künstler:** "Bruno Mars"
- **Album:** "÷ Divide"
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

## 📊 API-Limits

**Spotify Web API:**
- ✅ Kostenlos für Suche
- ✅ Bis zu 100 Anfragen/Minute
- ✅ Keine Benutzer-Authentifizierung nötig
- ✅ Kommerzielle Nutzung erlaubt

## 🎯 Nächste Schritte

1. **Spotify App erstellen** (5 Minuten)
2. **API-Schlüssel kopieren** (1 Minute)
3. **Code anpassen** (2 Minuten)
4. **Testen** (2 Minuten)

**Gesamt: ~10 Minuten für vollständige Spotify-Integration! 🎉**