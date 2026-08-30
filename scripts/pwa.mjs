import fs from 'node:fs';

/**
 * Expo's web export writes its own index.html, so the PWA tags have to be
 * injected afterwards. Runs as part of the web build, never by hand — a
 * deployed build missing these is a website, not an installable app.
 */
const file = 'dist/index.html';
let html = fs.readFileSync(file, 'utf8');

if (html.includes('manifest.json')) {
  console.log('PWA tags already present');
} else {
  html = html.replace(
    '</head>',
    `  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0E0E0E" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Fitted" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
    }
  </script>
</head>`
  );
  fs.writeFileSync(file, html);
  console.log('PWA tags injected');
}
