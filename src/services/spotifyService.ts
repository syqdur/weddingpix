import { SpotifyTrack, SpotifySearchResponse } from '../types';

// 🎵 MASSIVE MUSIC DATABASE
// Riesige Datenbank mit allen möglichen Liedern für Hochzeiten und Partys

const MASSIVE_MUSIC_DATABASE: SpotifyTrack[] = [
  // === HOCHZEITSKLASSIKER ===
  {
    id: 'perfect-ed-sheeran',
    name: 'Perfect',
    artists: [{ name: 'Ed Sheeran' }],
    album: {
      name: '÷ (Divide)',
      images: [{ url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v' },
    preview_url: null,
    duration_ms: 263000,
    popularity: 95
  },
  {
    id: 'thinking-out-loud',
    name: 'Thinking Out Loud',
    artists: [{ name: 'Ed Sheeran' }],
    album: {
      name: 'x (Multiply)',
      images: [{ url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/1KKAHNZhynbGhJJZaWRZZE' },
    preview_url: null,
    duration_ms: 281000,
    popularity: 89
  },
  {
    id: 'all-of-me',
    name: 'All of Me',
    artists: [{ name: 'John Legend' }],
    album: {
      name: 'Love in the Future',
      images: [{ url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/3U4isOIWM3VvDubwSI3y7a' },
    preview_url: null,
    duration_ms: 269000,
    popularity: 92
  },
  {
    id: 'marry-me',
    name: 'Marry Me',
    artists: [{ name: 'Train' }],
    album: {
      name: 'Save Me, San Francisco',
      images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/1z6WtY7X4HQJvzxC4UgkSf' },
    preview_url: null,
    duration_ms: 240000,
    popularity: 78
  },
  {
    id: 'a-thousand-years',
    name: 'A Thousand Years',
    artists: [{ name: 'Christina Perri' }],
    album: {
      name: 'The Twilight Saga: Breaking Dawn - Part 1',
      images: [{ url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/6lYBdPh8cQKJkHQfKkw2Qs' },
    preview_url: null,
    duration_ms: 285000,
    popularity: 85
  },
  {
    id: 'make-you-feel-my-love',
    name: 'Make You Feel My Love',
    artists: [{ name: 'Adele' }],
    album: {
      name: '19',
      images: [{ url: 'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4WXddlQqjzgATzNzAP8ASH' },
    preview_url: null,
    duration_ms: 213000,
    popularity: 82
  },

  // === METALLICA ===
  {
    id: 'enter-sandman',
    name: 'Enter Sandman',
    artists: [{ name: 'Metallica' }],
    album: {
      name: 'Metallica (The Black Album)',
      images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/5QTxFnGygVM4jFQpHITqxf' },
    preview_url: null,
    duration_ms: 331000,
    popularity: 88
  },
  {
    id: 'nothing-else-matters',
    name: 'Nothing Else Matters',
    artists: [{ name: 'Metallica' }],
    album: {
      name: 'Metallica (The Black Album)',
      images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4VqPOruhp5EdPBeR92t6lQ' },
    preview_url: null,
    duration_ms: 388000,
    popularity: 85
  },
  {
    id: 'master-of-puppets',
    name: 'Master of Puppets',
    artists: [{ name: 'Metallica' }],
    album: {
      name: 'Master of Puppets',
      images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/1ZDDt7xJRECzGSNZfaiydB' },
    preview_url: null,
    duration_ms: 515000,
    popularity: 82
  },
  {
    id: 'one-metallica',
    name: 'One',
    artists: [{ name: 'Metallica' }],
    album: {
      name: '...And Justice for All',
      images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7EZC6E7UjZe63f1jRmkWxt' },
    preview_url: null,
    duration_ms: 446000,
    popularity: 80
  },
  {
    id: 'fade-to-black',
    name: 'Fade to Black',
    artists: [{ name: 'Metallica' }],
    album: {
      name: 'Ride the Lightning',
      images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/5nekfiTN45vlKKNbUzRUzE' },
    preview_url: null,
    duration_ms: 417000,
    popularity: 78
  },
  {
    id: 'the-unforgiven',
    name: 'The Unforgiven',
    artists: [{ name: 'Metallica' }],
    album: {
      name: 'Metallica (The Black Album)',
      images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4n7jnSxVLd8QioibtTDBDq' },
    preview_url: null,
    duration_ms: 387000,
    popularity: 76
  },

  // === PARTY & TANZMUSIK ===
  {
    id: 'uptown-funk',
    name: 'Uptown Funk',
    artists: [{ name: 'Mark Ronson' }, { name: 'Bruno Mars' }],
    album: {
      name: 'Uptown Special',
      images: [{ url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS' },
    preview_url: null,
    duration_ms: 269000,
    popularity: 88
  },
  {
    id: 'cant-stop-feeling',
    name: "Can't Stop the Feeling!",
    artists: [{ name: 'Justin Timberlake' }],
    album: {
      name: 'Trolls (Original Motion Picture Soundtrack)',
      images: [{ url: 'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/6KuQTIu1KoTTkLXKrwlLPV' },
    preview_url: null,
    duration_ms: 236000,
    popularity: 92
  },
  {
    id: 'happy',
    name: 'Happy',
    artists: [{ name: 'Pharrell Williams' }],
    album: {
      name: 'G I R L',
      images: [{ url: 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/60nZcImufyMA1MKQY3dcCH' },
    preview_url: null,
    duration_ms: 232000,
    popularity: 85
  },
  {
    id: 'shake-it-off',
    name: 'Shake It Off',
    artists: [{ name: 'Taylor Swift' }],
    album: {
      name: '1989',
      images: [{ url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0cqRj7pUJDkTCEsJkx8snD' },
    preview_url: null,
    duration_ms: 219000,
    popularity: 90
  },
  {
    id: 'dancing-queen',
    name: 'Dancing Queen',
    artists: [{ name: 'ABBA' }],
    album: {
      name: 'Arrival',
      images: [{ url: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0GjEhVFGZW8afUYGChu3Rr' },
    preview_url: null,
    duration_ms: 230000,
    popularity: 87
  },

  // === DEUTSCHE MUSIK ===
  {
    id: 'auf-uns',
    name: 'Auf uns',
    artists: [{ name: 'Andreas Bourani' }],
    album: {
      name: 'Staub & Fantasie',
      images: [{ url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7iDa6hUg2VgEL1o1HjmfBn' },
    preview_url: null,
    duration_ms: 228000,
    popularity: 78
  },
  {
    id: 'lieblingsmensch',
    name: 'Lieblingsmensch',
    artists: [{ name: 'Namika' }],
    album: {
      name: 'Nador',
      images: [{ url: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/3F5CgOj3wFlRv51JsHbVOY' },
    preview_url: null,
    duration_ms: 201000,
    popularity: 75
  },
  {
    id: 'atemlos',
    name: 'Atemlos durch die Nacht',
    artists: [{ name: 'Helene Fischer' }],
    album: {
      name: 'Farbenspiel',
      images: [{ url: 'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/2tpWsVSb9UEmDRxAl1zhX1' },
    preview_url: null,
    duration_ms: 223000,
    popularity: 72
  },
  {
    id: 'hulapalu',
    name: 'Hulapalu',
    artists: [{ name: 'Andreas Gabalier' }],
    album: {
      name: 'Mountain Man',
      images: [{ url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' },
    preview_url: null,
    duration_ms: 195000,
    popularity: 68
  },

  // === ROCK KLASSIKER ===
  {
    id: 'bohemian-rhapsody',
    name: 'Bohemian Rhapsody',
    artists: [{ name: 'Queen' }],
    album: {
      name: 'A Night at the Opera',
      images: [{ url: 'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv' },
    preview_url: null,
    duration_ms: 355000,
    popularity: 90
  },
  {
    id: 'sweet-caroline',
    name: 'Sweet Caroline',
    artists: [{ name: 'Neil Diamond' }],
    album: {
      name: 'Brother Love\'s Travelling Salvation Show',
      images: [{ url: 'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/5cLHRbWURBIbdyXbQxiZKO' },
    preview_url: null,
    duration_ms: 201000,
    popularity: 80
  },
  {
    id: 'dont-stop-believin',
    name: "Don't Stop Believin'",
    artists: [{ name: 'Journey' }],
    album: {
      name: 'Escape',
      images: [{ url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4bHsxqR3GMrXTxEPLuK5ue' },
    preview_url: null,
    duration_ms: 251000,
    popularity: 87
  },
  {
    id: 'livin-on-a-prayer',
    name: "Livin' on a Prayer",
    artists: [{ name: 'Bon Jovi' }],
    album: {
      name: 'Slippery When Wet',
      images: [{ url: 'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/37ZJ0p5Jm13JPevGcx4SkF' },
    preview_url: null,
    duration_ms: 249000,
    popularity: 84
  },

  // === POP HITS ===
  {
    id: 'shape-of-you',
    name: 'Shape of You',
    artists: [{ name: 'Ed Sheeran' }],
    album: {
      name: '÷ (Divide)',
      images: [{ url: 'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3' },
    preview_url: null,
    duration_ms: 233000,
    popularity: 94
  },
  {
    id: 'blinding-lights',
    name: 'Blinding Lights',
    artists: [{ name: 'The Weeknd' }],
    album: {
      name: 'After Hours',
      images: [{ url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0VjIjW4GlULA4LGvWeqY6h' },
    preview_url: null,
    duration_ms: 200000,
    popularity: 93
  },
  {
    id: 'watermelon-sugar',
    name: 'Watermelon Sugar',
    artists: [{ name: 'Harry Styles' }],
    album: {
      name: 'Fine Line',
      images: [{ url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY' },
    preview_url: null,
    duration_ms: 174000,
    popularity: 89
  },

  // === WEITERE HOCHZEITSLIEDER ===
  {
    id: 'at-last',
    name: 'At Last',
    artists: [{ name: 'Etta James' }],
    album: {
      name: 'At Last!',
      images: [{ url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/5HNCy40Ni5BZJFw1TKzRsC' },
    preview_url: null,
    duration_ms: 180000,
    popularity: 79
  },
  {
    id: 'cant-help-myself',
    name: "Can't Help Myself",
    artists: [{ name: 'Four Tops' }],
    album: {
      name: 'Four Tops Second Album',
      images: [{ url: 'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7uEHsxax0kVdNRUKgBFGky' },
    preview_url: null,
    duration_ms: 164000,
    popularity: 73
  },
  {
    id: 'stand-by-me',
    name: 'Stand by Me',
    artists: [{ name: 'Ben E. King' }],
    album: {
      name: 'Don\'t Play That Song!',
      images: [{ url: 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/3SdTKo2uVsxFblQjpScoHy' },
    preview_url: null,
    duration_ms: 181000,
    popularity: 81
  },

  // === WEITERE DEUTSCHE HITS ===
  {
    id: 'schrei-nach-liebe',
    name: 'Schrei nach Liebe',
    artists: [{ name: 'Die Ärzte' }],
    album: {
      name: 'Die Bestie in Menschengestalt',
      images: [{ url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/1lCRw5FEZ1gCDFx3iHjR8W' },
    preview_url: null,
    duration_ms: 217000,
    popularity: 70
  },
  {
    id: 'hier-kommt-alex',
    name: 'Hier kommt Alex',
    artists: [{ name: 'Die Toten Hosen' }],
    album: {
      name: 'Ein kleines bisschen Horrorschau',
      images: [{ url: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/6JV2JOEocMgcZxYSZelKcc' },
    preview_url: null,
    duration_ms: 243000,
    popularity: 69
  },
  {
    id: 'major-tom',
    name: 'Major Tom (völlig losgelöst)',
    artists: [{ name: 'Peter Schilling' }],
    album: {
      name: 'Fehler im System',
      images: [{ url: 'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/1GAKZm8GLnPwBdHai6ybG4' },
    preview_url: null,
    duration_ms: 295000,
    popularity: 67
  },

  // === WEITERE ROCK HITS ===
  {
    id: 'hotel-california',
    name: 'Hotel California',
    artists: [{ name: 'Eagles' }],
    album: {
      name: 'Hotel California',
      images: [{ url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/40riOy7x9W7GXjyGp4pjAv' },
    preview_url: null,
    duration_ms: 391000,
    popularity: 86
  },
  {
    id: 'stairway-to-heaven',
    name: 'Stairway to Heaven',
    artists: [{ name: 'Led Zeppelin' }],
    album: {
      name: 'Led Zeppelin IV',
      images: [{ url: 'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/5CQ30WqJwcep0pYcV4AMNc' },
    preview_url: null,
    duration_ms: 482000,
    popularity: 88
  },
  {
    id: 'sweet-child-o-mine',
    name: "Sweet Child O' Mine",
    artists: [{ name: "Guns N' Roses" }],
    album: {
      name: 'Appetite for Destruction',
      images: [{ url: 'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7o2CTH4ctstm8TNelqjb51' },
    preview_url: null,
    duration_ms: 356000,
    popularity: 83
  },

  // === WEITERE POP HITS ===
  {
    id: 'someone-like-you',
    name: 'Someone Like You',
    artists: [{ name: 'Adele' }],
    album: {
      name: '21',
      images: [{ url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/1zwMYTA5nlNjZxYrvBB2pV' },
    preview_url: null,
    duration_ms: 285000,
    popularity: 87
  },
  {
    id: 'rolling-in-the-deep',
    name: 'Rolling in the Deep',
    artists: [{ name: 'Adele' }],
    album: {
      name: '21',
      images: [{ url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7n2Ycct7Beij7Dj7meI4X0' },
    preview_url: null,
    duration_ms: 228000,
    popularity: 89
  },
  {
    id: 'bad-guy',
    name: 'bad guy',
    artists: [{ name: 'Billie Eilish' }],
    album: {
      name: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
      images: [{ url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m' },
    preview_url: null,
    duration_ms: 194000,
    popularity: 91
  },

  // === WEITERE TANZMUSIK ===
  {
    id: 'september',
    name: 'September',
    artists: [{ name: 'Earth, Wind & Fire' }],
    album: {
      name: 'The Best of Earth, Wind & Fire Vol. 1',
      images: [{ url: 'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/2grjqo0Frpf2okIBiifQKs' },
    preview_url: null,
    duration_ms: 215000,
    popularity: 85
  },
  {
    id: 'i-wanna-dance',
    name: 'I Wanna Dance with Somebody',
    artists: [{ name: 'Whitney Houston' }],
    album: {
      name: 'Whitney',
      images: [{ url: 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/2tUBqZG2AbRi7Q0BIrVrEj' },
    preview_url: null,
    duration_ms: 290000,
    popularity: 82
  },
  {
    id: 'billie-jean',
    name: 'Billie Jean',
    artists: [{ name: 'Michael Jackson' }],
    album: {
      name: 'Thriller',
      images: [{ url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/5ChkMS8OtdzJeqyybCc9R5' },
    preview_url: null,
    duration_ms: 294000,
    popularity: 88
  },

  // === WEITERE KLASSIKER ===
  {
    id: 'imagine',
    name: 'Imagine',
    artists: [{ name: 'John Lennon' }],
    album: {
      name: 'Imagine',
      images: [{ url: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7pKfPomDEeI4TPT6EOYjn9' },
    preview_url: null,
    duration_ms: 183000,
    popularity: 84
  },
  {
    id: 'hey-jude',
    name: 'Hey Jude',
    artists: [{ name: 'The Beatles' }],
    album: {
      name: 'Past Masters',
      images: [{ url: 'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0aym2LBJBk9DAYuHHutrIl' },
    preview_url: null,
    duration_ms: 431000,
    popularity: 86
  },
  {
    id: 'let-it-be',
    name: 'Let It Be',
    artists: [{ name: 'The Beatles' }],
    album: {
      name: 'Let It Be',
      images: [{ url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7iN1s7xHE4ifF5povM6A48' },
    preview_url: null,
    duration_ms: 243000,
    popularity: 85
  },

  // === WEITERE MODERNE HITS ===
  {
    id: 'levitating',
    name: 'Levitating',
    artists: [{ name: 'Dua Lipa' }],
    album: {
      name: 'Future Nostalgia',
      images: [{ url: 'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9' },
    preview_url: null,
    duration_ms: 203000,
    popularity: 90
  },
  {
    id: 'good-4-u',
    name: 'good 4 u',
    artists: [{ name: 'Olivia Rodrigo' }],
    album: {
      name: 'SOUR',
      images: [{ url: 'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG' },
    preview_url: null,
    duration_ms: 178000,
    popularity: 88
  },
  {
    id: 'as-it-was',
    name: 'As It Was',
    artists: [{ name: 'Harry Styles' }],
    album: {
      name: "Harry's House",
      images: [{ url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e' },
    preview_url: null,
    duration_ms: 167000,
    popularity: 92
  },

  // === WEITERE DEUTSCHE HITS ===
  {
    id: 'cordula-gruen',
    name: 'Cordula Grün',
    artists: [{ name: 'Josh.' }],
    album: {
      name: 'Expresso & Tschianti',
      images: [{ url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/1BxkgaIw4wlDmzjx78bYpG' },
    preview_url: null,
    duration_ms: 189000,
    popularity: 71
  },
  {
    id: 'astronaut',
    name: 'Astronaut',
    artists: [{ name: 'Sido' }, { name: 'Andreas Bourani' }],
    album: {
      name: 'VI',
      images: [{ url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/6Im9k8u9iIVKcjNwfXNPNe' },
    preview_url: null,
    duration_ms: 234000,
    popularity: 74
  },
  {
    id: 'palmen-aus-plastik',
    name: 'Palmen aus Plastik',
    artists: [{ name: 'Bonez MC' }, { name: 'RAF Camora' }],
    album: {
      name: 'Palmen aus Plastik',
      images: [{ url: 'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/3JvKfv6T31zO0ini8iNItO' },
    preview_url: null,
    duration_ms: 201000,
    popularity: 73
  },

  // === WEITERE PARTY HITS ===
  {
    id: 'mr-brightside',
    name: 'Mr. Brightside',
    artists: [{ name: 'The Killers' }],
    album: {
      name: 'Hot Fuss',
      images: [{ url: 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/003vvx7Niy0yvhvHt4a68B' },
    preview_url: null,
    duration_ms: 222000,
    popularity: 86
  },
  {
    id: 'somebody-told-me',
    name: 'Somebody Told Me',
    artists: [{ name: 'The Killers' }],
    album: {
      name: 'Hot Fuss',
      images: [{ url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/51pQ7vY7WXzxskwloaeqyj' },
    preview_url: null,
    duration_ms: 197000,
    popularity: 79
  },
  {
    id: 'use-somebody',
    name: 'Use Somebody',
    artists: [{ name: 'Kings of Leon' }],
    album: {
      name: 'Only by the Night',
      images: [{ url: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0KKkJNfGyhkQ5aFogxQAPU' },
    preview_url: null,
    duration_ms: 231000,
    popularity: 81
  },

  // === WEITERE HOCHZEITSLIEDER ===
  {
    id: 'wonderful-tonight',
    name: 'Wonderful Tonight',
    artists: [{ name: 'Eric Clapton' }],
    album: {
      name: 'Slowhand',
      images: [{ url: 'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/7xGfFoTpQ2E7fRF5lN10tr' },
    preview_url: null,
    duration_ms: 217000,
    popularity: 77
  },
  {
    id: 'unchained-melody',
    name: 'Unchained Melody',
    artists: [{ name: 'The Righteous Brothers' }],
    album: {
      name: 'Just Once in My Life',
      images: [{ url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/5G2f63n7IPVPPjfNIGih7Q' },
    preview_url: null,
    duration_ms: 216000,
    popularity: 76
  },
  {
    id: 'can-you-feel-the-love-tonight',
    name: 'Can You Feel the Love Tonight',
    artists: [{ name: 'Elton John' }],
    album: {
      name: 'The Lion King',
      images: [{ url: 'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/3vkCueOmm7xQDoJ17W1Pm3' },
    preview_url: null,
    duration_ms: 238000,
    popularity: 78
  },

  // === WEITERE AKTUELLE HITS ===
  {
    id: 'flowers',
    name: 'Flowers',
    artists: [{ name: 'Miley Cyrus' }],
    album: {
      name: 'Endless Summer Vacation',
      images: [{ url: 'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0yLdNVWF3Srea0uzk55zFn' },
    preview_url: null,
    duration_ms: 200000,
    popularity: 94
  },
  {
    id: 'unholy',
    name: 'Unholy',
    artists: [{ name: 'Sam Smith' }, { name: 'Kim Petras' }],
    album: {
      name: 'Gloria',
      images: [{ url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/3nqQXoyQOWXiESFLlDF1hG' },
    preview_url: null,
    duration_ms: 156000,
    popularity: 91
  },
  {
    id: 'anti-hero',
    name: 'Anti-Hero',
    artists: [{ name: 'Taylor Swift' }],
    album: {
      name: 'Midnights',
      images: [{ url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu' },
    preview_url: null,
    duration_ms: 201000,
    popularity: 93
  }
];

// Create a map for quick URL lookups
const URL_TO_TRACK_MAP = new Map<string, SpotifyTrack>();
MASSIVE_MUSIC_DATABASE.forEach(track => {
  URL_TO_TRACK_MAP.set(track.external_urls.spotify, track);
});

// Enhanced search function with intelligent matching
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  if (!query.trim()) return [];
  
  console.log(`🔍 === MASSIVE DATABASE SEARCH ===`);
  console.log(`🔍 Query: "${query}"`);
  console.log(`📊 Database size: ${MASSIVE_MUSIC_DATABASE.length} tracks`);
  
  // Simulate API delay for realism
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  console.log(`🔍 Search terms: [${searchTerms.join(', ')}]`);
  
  const results = MASSIVE_MUSIC_DATABASE.filter(track => {
    const trackName = track.name.toLowerCase();
    const artistName = track.artists.map(a => a.name.toLowerCase()).join(' ');
    const albumName = track.album.name.toLowerCase();
    const searchText = `${trackName} ${artistName} ${albumName}`;
    
    // Exact matches get highest priority
    if (trackName.includes(query.toLowerCase()) || artistName.includes(query.toLowerCase())) {
      return true;
    }
    
    // Partial matches
    const hasMatch = searchTerms.some(term => {
      return searchText.includes(term) || 
             trackName.includes(term) || 
             artistName.includes(term) ||
             // Fuzzy matching for common typos and variations
             (term === 'metalica' && artistName.includes('metallica')) ||
             (term === 'metallic' && artistName.includes('metallica')) ||
             (term === 'ed' && artistName.includes('ed sheeran')) ||
             (term === 'sheeran' && artistName.includes('ed sheeran')) ||
             (term === 'adel' && artistName.includes('adele')) ||
             (term === 'queen' && artistName.includes('queen')) ||
             (term === 'beatles' && artistName.includes('beatles')) ||
             (term === 'michael' && artistName.includes('michael jackson')) ||
             (term === 'jackson' && artistName.includes('michael jackson'));
    });
    
    return hasMatch;
  });

  // Advanced sorting by relevance and popularity
  results.sort((a, b) => {
    const aRelevance = searchTerms.reduce((score, term) => {
      const aTrackName = a.name.toLowerCase();
      const aArtistName = a.artists[0].name.toLowerCase();
      
      // Exact matches
      if (aTrackName === term) score += 50;
      if (aArtistName === term) score += 40;
      
      // Starts with
      if (aTrackName.startsWith(term)) score += 30;
      if (aArtistName.startsWith(term)) score += 25;
      
      // Contains
      if (aTrackName.includes(term)) score += 20;
      if (aArtistName.includes(term)) score += 15;
      
      return score;
    }, 0);
    
    const bRelevance = searchTerms.reduce((score, term) => {
      const bTrackName = b.name.toLowerCase();
      const bArtistName = b.artists[0].name.toLowerCase();
      
      // Exact matches
      if (bTrackName === term) score += 50;
      if (bArtistName === term) score += 40;
      
      // Starts with
      if (bTrackName.startsWith(term)) score += 30;
      if (bArtistName.startsWith(term)) score += 25;
      
      // Contains
      if (bTrackName.includes(term)) score += 20;
      if (bArtistName.includes(term)) score += 15;
      
      return score;
    }, 0);
    
    // Sort by relevance first, then popularity
    if (aRelevance !== bRelevance) return bRelevance - aRelevance;
    return b.popularity - a.popularity;
  });
  
  const limitedResults = results.slice(0, 15); // Show more results
  
  console.log(`✅ Search results: ${limitedResults.length} tracks found`);
  limitedResults.forEach((track, index) => {
    console.log(`  ${index + 1}. "${track.name}" by ${track.artists[0].name} (${track.popularity}% popularity)`);
  });
  
  return limitedResults;
};

// Get track details by Spotify ID
export const getTrackById = async (trackId: string): Promise<SpotifyTrack | null> => {
  console.log(`🔍 Getting track by ID: ${trackId}`);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const track = MASSIVE_MUSIC_DATABASE.find(t => t.id === trackId);
  
  if (track) {
    console.log(`✅ Found track: ${track.name} by ${track.artists[0].name}`);
    return track;
  }
  
  console.log(`❌ Track not found: ${trackId}`);
  return null;
};

// Get track by URL
export const getTrackByUrl = async (url: string): Promise<SpotifyTrack | null> => {
  console.log(`🔍 Getting track by URL: ${url}`);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const track = URL_TO_TRACK_MAP.get(url);
  
  if (track) {
    console.log(`✅ Found track from URL: ${track.name} by ${track.artists[0].name}`);
    return track;
  }
  
  console.log(`❌ Track not found for URL: ${url}`);
  return null;
};

// Validate Spotify URL
export const validateSpotifyUrl = (url: string): boolean => {
  const spotifyUrlPattern = /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+(\?.*)?$/;
  const isValid = spotifyUrlPattern.test(url);
  
  console.log(`🔍 URL validation: ${url} -> ${isValid ? 'VALID' : 'INVALID'}`);
  return isValid;
};

// Extract track ID from Spotify URL
export const extractTrackIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  const trackId = match ? match[1] : null;
  
  console.log(`🔍 Extracting track ID from URL: ${url} -> ${trackId || 'NOT_FOUND'}`);
  return trackId;
};

// Check if we have this track in our database
export const hasTrackInDatabase = (url: string): boolean => {
  return URL_TO_TRACK_MAP.has(url);
};

// Get all available tracks (for debugging)
export const getAllMockTracks = (): SpotifyTrack[] => {
  return [...MASSIVE_MUSIC_DATABASE];
};

// Get tracks by category
export const getTracksByCategory = (category: string): SpotifyTrack[] => {
  const categoryMap: Record<string, string[]> = {
    'hochzeit': ['perfect', 'thinking-out-loud', 'all-of-me', 'marry-me', 'a-thousand-years'],
    'party': ['uptown-funk', 'cant-stop-feeling', 'happy', 'dancing-queen', 'september'],
    'rock': ['bohemian-rhapsody', 'sweet-caroline', 'dont-stop-believin', 'hotel-california'],
    'deutsch': ['auf-uns', 'lieblingsmensch', 'atemlos', 'cordula-gruen'],
    'metallica': ['enter-sandman', 'nothing-else-matters', 'master-of-puppets', 'one-metallica'],
    'pop': ['shape-of-you', 'blinding-lights', 'watermelon-sugar', 'flowers']
  };
  
  const trackIds = categoryMap[category.toLowerCase()] || [];
  return MASSIVE_MUSIC_DATABASE.filter(track => trackIds.includes(track.id));
};

// Get popular tracks
export const getPopularTracks = (limit: number = 10): SpotifyTrack[] => {
  return [...MASSIVE_MUSIC_DATABASE]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

// Mock function - always returns false since we're not using real API
export const isSpotifyAvailable = async (): Promise<boolean> => {
  return false; // Always false for mock mode
};

console.log(`🎵 === MASSIVE MUSIC DATABASE INITIALIZED ===`);
console.log(`📊 Total tracks: ${MASSIVE_MUSIC_DATABASE.length}`);
console.log(`🎵 Categories available:`);
console.log(`   💒 Hochzeitslieder: ${MASSIVE_MUSIC_DATABASE.filter(t => ['perfect', 'thinking-out-loud', 'all-of-me'].includes(t.id)).length}+`);
console.log(`   🎸 Rock Klassiker: ${MASSIVE_MUSIC_DATABASE.filter(t => t.artists[0].name.includes('Queen') || t.artists[0].name.includes('Beatles')).length}+`);
console.log(`   🤘 Metallica: ${MASSIVE_MUSIC_DATABASE.filter(t => t.artists[0].name.includes('Metallica')).length}`);
console.log(`   🇩🇪 Deutsche Hits: ${MASSIVE_MUSIC_DATABASE.filter(t => ['auf-uns', 'lieblingsmensch', 'atemlos'].includes(t.id)).length}+`);
console.log(`   🎉 Party Hits: ${MASSIVE_MUSIC_DATABASE.filter(t => ['uptown-funk', 'happy', 'dancing-queen'].includes(t.id)).length}+`);
console.log(`   🎤 Pop Hits: ${MASSIVE_MUSIC_DATABASE.filter(t => ['shape-of-you', 'blinding-lights'].includes(t.id)).length}+`);
console.log(`✅ Ready for music requests!`);