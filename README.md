# chai-e-lofi

Immersive late-night Indian chai tapri atmosphere. **Music powered by Spotify.**

Open the site → **Sit Down** → rain, the Spotify playlist embed, and your chai-e-lofi vibe appear. Rain ambience is synthesized in the browser and never touches Spotify’s audio.

## Quick start

1. Set your playlist in `public/config.js`:

```js
spotifyPlaylistUrl: 'https://open.spotify.com/playlist/YOUR_PLAYLIST_ID',
```

2. Serve the `public` folder over HTTPS (required for a solid Spotify embed experience):

```bash
npx serve public -l 3000
```

Or deploy `public` to Netlify / Vercel (headers are already configured).

3. Open the site, click **Sit Down**, then press **Play** on the Spotify player.

## What this project does / does not do

| Does | Does not |
|------|----------|
| Official Spotify playlist embed | Download, scrape, convert, or host Spotify audio |
| Original Web Audio ambience | Process or remix Spotify’s stream |
| Client-side presets & share card | Login, accounts, database, trackers |
| CSP + security headers | Arbitrary user-supplied embed URLs |

Visitors cannot paste their own playlist URL. Only the developer-configured URL in `config.js` is validated (`https://open.spotify.com/playlist/...`) and embedded.

## Features

- Tapri background scene with rain overlay
- Official Spotify embed in a cassette-style frame (Spotify branding preserved)
- Rain sound slider at the bottom
- Keyboard focus and reduced motion support

## Deploy

- **Netlify:** publish directory `public` (`netlify.toml`)
- **Vercel:** `vercel.json` headers; root or `public` as static output
- **Any static host:** upload `public/` and set the same CSP/`frame-src` for Spotify

## Privacy

No ads, fingerprinting, or analytics. `localStorage` only stores harmless UI prefs (city, volumes, mute). No Spotify credentials are collected.

## License note

Site code and synthesized ambience are original to this project. Playlist music remains with Spotify and rights holders — use only via Spotify’s official player.
