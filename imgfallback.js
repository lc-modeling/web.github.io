/*
 * imgfallback.js — global broken-image fallback.
 *
 * Older posts reference images in Firebase Storage, which now returns HTTP 402
 * (the project is on the free Spark plan and Google dropped free-tier Storage in
 * Sept 2024). Those images can no longer load. Rather than show broken boxes,
 * any image that fails to load is swapped for the branded L&C logo so posts keep
 * a clean header while their title and text stay intact.
 *
 * Plain (non-module) script so the listener is registered before images load.
 * Uses capture=true because <img> error events do not bubble.
 */
(function () {
  var PLACEHOLDER = "/logo.png"; // branded fallback served from the site root

  // Show the logo neatly (contained, not stretched) wherever it replaces a photo.
  var style = document.createElement("style");
  style.textContent =
    ".img-fallback{object-fit:contain !important;background:#f2f2f2;padding:8px;}";
  (document.head || document.documentElement).appendChild(style);

  document.addEventListener(
    "error",
    function (e) {
      var el = e.target;
      if (!el || el.tagName !== "IMG") return;
      if (el.dataset.fallbackApplied) return; // guard against loops
      if (el.src && el.src.indexOf(PLACEHOLDER) !== -1) return;
      el.dataset.fallbackApplied = "1";
      el.src = PLACEHOLDER;
      el.classList.add("img-fallback");
    },
    true
  );
})();
