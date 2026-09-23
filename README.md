# For Mahi

A small 3D scroll poem, built as a gift.

## 1. How to run it

You need [Node.js](https://nodejs.org) installed (any recent version).

```
npm install
npm run dev
```

This starts a local server. It prints two links, something like:

```
Local:   http://localhost:5173/
Network: http://192.168.1.23:5173/
```

Open the **Local** link on your own laptop to check things.

## 2. How to open it on your phone

Your phone and your laptop must be on the **same Wi-Fi network**.

1. Look at the terminal for the **Network** link (it looks like `http://192.168.x.x:5173/`).
2. Type that link into your phone's browser (Safari on iPhone, Chrome on Android).
3. If it doesn't load, your laptop's firewall may be blocking it — allow Node.js / Vite through the firewall, or turn off the firewall's "public network" block temporarily.

## 3. How to replace the photos

Put 9 photos in `public/images/`, named exactly:

```
01.jpg
02.jpg
03.jpg
04.jpg
05.jpg
06.jpg
07.jpg
08.jpg
09.jpg
```

- Convert HEIC (iPhone) photos to JPG first — Android can't always open HEIC.
- Resize so the longer side is about 1200px. Smaller files load faster on phone data/Wi-Fi.
- Until you add a photo, that stanza shows a colored placeholder with its number on it, so the layout still works.

## 4. How to edit the poem text

Open [src/poem.js](src/poem.js). Each stanza is an object with a `lines` array — one poem line per string. Edit the text there. Do not remove or reorder the `image` field; it must keep pointing at `/images/0X.jpg`.

The very last line ("- from your friend") lives in the `ENDING_TEXT` constant at the top of the same file.

## 5. Turning on music (optional)

Open [src/main.js](src/main.js) and change:

```js
const ENABLE_MUSIC = false;
```

to `true`, then put a file named `music.mp3` in the `public/` folder. Music only starts after the visitor taps "Tap to begin" — iPhones block sound from playing automatically, so this is required, not optional.

## 6. Deploying for free (so you can send Mahi a link)

### Option A: Netlify (drag and drop, easiest)

1. Run `npm run build`. This creates a `dist/` folder with the finished site.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag the `dist` folder onto the page.
4. Netlify gives you a link (like `https://random-name-123.netlify.app`). Send that to Mahi.

### Option B: Vercel (via their CLI)

1. Run `npx vercel` in this folder and follow the prompts (first time it asks you to sign up, which is free).
2. It builds and deploys automatically, then gives you a link.
3. Run `npx vercel --prod` to get the final, permanent link.

## 7. What's inside

```
mahi-poem/
  index.html        the page shell
  src/
    main.js          wires everything together, controls scroll
    scene.js          Three.js camera, renderer, lights, particles
    photos.js          the 9 floating photo frames
    sky.js              night -> golden sunset color over scroll progress
    poem.js              <- edit the poem text here
    layout.js         positions of the camera path and photos
    ui.js               intro screen, stanza text, progress dots, ending
    style.css          all the styling and mobile-safety rules
  public/
    images/            <- put your 9 photos here (01.jpg ... 09.jpg)
    fonts/             (present for completeness; see note below)
```

**A note on fonts:** the two fonts (Playfair Display for the title, Poppins for
the poem text) are bundled through the `@fontsource` npm packages instead of
being manually copied into `public/fonts`. This is the standard way to
self-host Google Fonts in a Vite project — the font files still end up baked
into your final build (see `dist/assets/*.woff2` after `npm run build`), no
Google/CDN request happens at runtime, and `font-display: swap` is already
set by the package. It's the same guarantee the original instructions asked
for, done in a way that can't go stale or reference a broken file path.

## 8. If a phone doesn't support 3D graphics

Very old phones or browsers without WebGL will automatically get a simpler
version: the same 9 photos and stanzas, in a plain scrolling page with soft
fade-in, still alternating left and right, still going from night-blue to
golden. Nobody sees a broken page.

## 9. Testing notes

- `npm run build` completes with no errors.
- The dev server was started and checked to confirm the page, the JS module graph (Three.js, GSAP/ScrollTrigger, the poem data), and the CSS all load successfully.
- The CSS was written specifically for small screens: `100dvh` (not `100vh`) for full-height sections, `env(safe-area-inset-*)` padding around the notch/home-bar area, `clamp()` for every font size so text reflows instead of overflowing, a fixed `max-width: 82vw` on the poem text, and `overflow-x: hidden` to block any sideways scroll.
- I do not have a real iPhone/Android or a browser screenshot tool in this environment, so I could not visually confirm pixel-perfect rendering at 390×844, 375×667, 360×800, and 412×915. Please do the walk-through in step 5 of the original plan (test on your Android, then a friend's iPhone) before sending the link to Mahi — if anything looks cut off, tell me the phone and what's wrong and I'll fix it.
