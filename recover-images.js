/*
 * recover-images.js — find broken Firebase Storage images and match them to
 * local repo files that could be re-uploaded to Cloudinary.
 *
 * DRY RUN by default: reads Firestore over the public REST API and lists the
 * local folder. It does NOT upload or write anything. Run with:  node recover-images.js
 *
 * Node 18+ (global fetch). Read-only.
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ID = "schoolcms-77713";
const API_KEY = "AIzaSyAxauEEtqkuJOWA9HRe1jpT_wCXH62nksM";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Collections that hold image URLs (from the site's display scripts).
const COLLECTIONS = [
  "lcschoolblog",
  "lcstories",
  "lc_models_management",
  "models_images",
  "models_header",
  "main_header_banner",
  "preview_week",
  "diversity_and_inclusivity",
  "enroll_header",
];

const FB = "firebasestorage.googleapis.com";

// Recursively pull every string value out of a Firestore REST document.
function collectStrings(node, out) {
  if (!node || typeof node !== "object") return;
  if ("stringValue" in node) out.push(node.stringValue);
  if ("mapValue" in node) {
    const f = node.mapValue.fields || {};
    for (const k in f) collectStrings(f[k], out);
  }
  if ("arrayValue" in node) {
    for (const v of node.arrayValue.values || []) collectStrings(v, out);
  }
}

// Firebase Storage URL -> original filename (strip the "images/<5char>_" prefix).
function originalName(url) {
  const m = url.match(/\/o\/([^?]+)/);
  if (!m) return null;
  let objectPath = decodeURIComponent(m[1]); // e.g. images/18f7h_IMG-...jpg
  let file = objectPath.split("/").pop(); // 18f7h_IMG-...jpg
  const us = file.indexOf("_");
  const stripped = us !== -1 ? file.slice(us + 1) : file; // IMG-...jpg
  return { full: file, name: stripped };
}

async function main() {
  // Index local files (root + models/) by lowercase name.
  const localByName = {};
  const addDir = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.isFile()) localByName[f.name.toLowerCase()] = path.join(dir, f.name);
    }
  };
  addDir(".");
  if (fs.existsSync("models")) addDir("models");

  let totalBroken = 0;
  const matched = [];
  const unmatched = [];

  for (const col of COLLECTIONS) {
    let url = `${BASE}/${col}?pageSize=300`;
    let docs = [];
    try {
      const res = await fetch(url);
      const data = await res.json();
      docs = data.documents || [];
    } catch (e) {
      console.log(`! could not read ${col}: ${e.message}`);
      continue;
    }
    for (const doc of docs) {
      const id = doc.name.split("/").pop();
      const strings = [];
      for (const k in doc.fields) collectStrings(doc.fields[k], strings);
      const broken = strings.filter((s) => s.includes(FB));
      for (const b of broken) {
        totalBroken++;
        const orig = originalName(b);
        const localMatch =
          orig &&
          (localByName[orig.name.toLowerCase()] ||
            localByName[orig.full.toLowerCase()]);
        const rec = { collection: col, docId: id, url: b, original: orig };
        if (localMatch) matched.push({ ...rec, localPath: localMatch });
        else unmatched.push(rec);
      }
    }
  }

  console.log("\n================ RECOVERY DISCOVERY (dry run) ================");
  console.log(`Broken Firebase Storage image references: ${totalBroken}`);
  console.log(`Recoverable from local repo:              ${matched.length}`);
  console.log(`No local copy (unrecoverable w/o Blaze):  ${unmatched.length}`);

  if (matched.length) {
    console.log("\n---- RECOVERABLE (local file found) ----");
    for (const m of matched) {
      console.log(
        `  [${m.collection}] doc ${m.docId}\n    original: ${m.original.name}\n    local:    ${m.localPath}`
      );
    }
  }

  console.log("\n---- UNRECOVERABLE (no local copy) ----");
  const byName = unmatched.map((u) => (u.original ? u.original.name : u.url));
  console.log("  " + (byName.length ? byName.join("\n  ") : "(none)"));
  console.log("\nNothing was uploaded or modified. This was a dry run.\n");
}

main();
