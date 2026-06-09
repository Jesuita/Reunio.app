/**
 * Reunio Booking Widget
 * Drop-in script that injects a floating "Reservar turno" button
 * and opens the booking page in an iframe modal.
 *
 * Usage:
 *   <script
 *     src="https://reunio.app/widget.js"
 *     data-org="mi-negocio"
 *     data-color="#6366f1"
 *     data-text="Reservar turno"
 *     data-position="bottom-right"
 *   ></script>
 */
(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var org      = script.dataset.org      || "";
  var color    = script.dataset.color    || "#6366f1";
  var text     = script.dataset.text     || "Reservar turno";
  var position = script.dataset.position || "bottom-right";
  var baseUrl  = script.src.replace(/\/widget\.js.*$/, "");

  if (!org) {
    console.warn("[Reunio widget] data-org is required.");
    return;
  }

  // ── Inject styles ──────────────────────────────────────────────────────────
  var style = document.createElement("style");
  style.textContent = [
    ".reunio-btn{position:fixed;z-index:9998;display:flex;align-items:center;gap:8px;",
    "padding:12px 20px;border-radius:50px;border:none;cursor:pointer;",
    "font-size:14px;font-weight:600;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.18);",
    "transition:transform .15s,box-shadow .15s;font-family:system-ui,sans-serif;}",
    ".reunio-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.24);}",
    ".reunio-btn.bottom-right{bottom:24px;right:24px;}",
    ".reunio-btn.bottom-left{bottom:24px;left:24px;}",
    ".reunio-btn.inline{position:static;display:inline-flex;}",
    ".reunio-overlay{display:none;position:fixed;inset:0;z-index:9999;",
    "background:rgba(0,0,0,.5);justify-content:center;align-items:center;}",
    ".reunio-overlay.open{display:flex;}",
    ".reunio-modal{background:#fff;border-radius:16px;overflow:hidden;",
    "width:min(460px,96vw);height:min(680px,92vh);display:flex;flex-direction:column;",
    "box-shadow:0 24px 64px rgba(0,0,0,.3);}",
    ".reunio-modal-header{display:flex;align-items:center;justify-content:space-between;",
    "padding:12px 16px;border-bottom:1px solid #e5e7eb;}",
    ".reunio-close{background:none;border:none;cursor:pointer;font-size:20px;",
    "color:#6b7280;line-height:1;padding:4px;}",
    ".reunio-iframe{flex:1;width:100%;border:none;}",
  ].join("");
  document.head.appendChild(style);

  // ── Button ─────────────────────────────────────────────────────────────────
  var btn = document.createElement("button");
  btn.className = "reunio-btn " + position;
  btn.style.backgroundColor = color;
  btn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>' +
    '<line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
    "<span>" + text + "</span>";

  // ── Modal ──────────────────────────────────────────────────────────────────
  var overlay = document.createElement("div");
  overlay.className = "reunio-overlay";

  var modal = document.createElement("div");
  modal.className = "reunio-modal";

  var header = document.createElement("div");
  header.className = "reunio-modal-header";
  header.innerHTML =
    '<span style="font-weight:600;font-size:14px;font-family:system-ui,sans-serif;">Reservar turno</span>';

  var closeBtn = document.createElement("button");
  closeBtn.className = "reunio-close";
  closeBtn.innerHTML = "&#x2715;";
  closeBtn.setAttribute("aria-label", "Cerrar");

  var iframe = document.createElement("iframe");
  iframe.className = "reunio-iframe";
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("title", "Reservar turno — Reunio");

  header.appendChild(closeBtn);
  modal.appendChild(header);
  modal.appendChild(iframe);
  overlay.appendChild(modal);

  // ── Event handlers ─────────────────────────────────────────────────────────
  function open() {
    iframe.src = baseUrl + "/" + org + "?widget=1";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    // Delay clear so user doesn't see blank iframe
    setTimeout(function () { iframe.src = "about:blank"; }, 300);
  }

  btn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });

  // Listen for postMessage from the iframe to auto-close on booking confirmed
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "reunio:booking_confirmed") close();
  });

  // ── Mount ──────────────────────────────────────────────────────────────────
  function mount() {
    if (position === "inline") {
      // Replace the script tag's parent (or just append after script)
      script.parentNode.insertBefore(btn, script.nextSibling);
    } else {
      document.body.appendChild(btn);
    }
    document.body.appendChild(overlay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
