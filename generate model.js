// generate-model-pages.js
const fs      = require('fs');
const path    = require('path');
const admin   = require('firebase-admin');

// Initialize Firebase Admin SDK (use your service account)
const serviceAccount = require('./serviceAccountKey.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<YOUR_PROJECT_ID>.firebaseio.com"
});
const db = admin.firestore();

async function slugify(str) {
  return str
    .toString()
    .normalize('NFD')            // split an accented letter in the base letter and the accent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // spaces to dashes
    .replace(/[^\w\-]+/g, '')    // remove non-word chars
    .replace(/\-\-+/g, '-');     // collapse multiple dashes
}

async function build() {
  const outDir = path.join(__dirname, 'public', 'models');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const snapshot = await db
    .collection('lc_models_management')
    .orderBy('publish_date', 'desc')
    .get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const slug = await slugify(data.name);

    // choose the best description
    const desc = data.text_description
      ? data.text_description.slice(0, 150)
      : (data.full_description || '').slice(0, 150);

    const metaHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${data.name} | L&C Models Management</title>
  <meta name="description" content="${desc}">
  <meta property="og:title"       content="${data.name}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image"       content="${data.header_image}" />
  <meta property="og:url"         content="https://your-domain.com/models/${slug}.html" />
  <meta name="twitter:card"       content="summary_large_image" />
</head>
<body>
  <script>
    // after bots scrape the head, real browsers get forwarded into your SPA
    window.location.replace(
      '/index.html?header_image='+encodeURIComponent('${data.header_image}')
    );
  </script>
</body>
</html>`;

    fs.writeFileSync(path.join(outDir, `${slug}.html`), metaHtml, 'utf8');
    console.log(`→ wrote: models/${slug}.html`);
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
