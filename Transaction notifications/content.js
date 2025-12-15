(() => {
  let shown = false;

  /* ---------------- EXCLUDED DOMAINS ---------------- */
  const EXCLUDED_DOMAINS = [
    "google.com",
    "bing.com",
    "duckduckgo.com",
    "yahoo.com"
  ];

  function isExcludedSite() {
    return EXCLUDED_DOMAINS.some(d => location.hostname.includes(d));
  }

  function isShoppingSite() {
    if (isExcludedSite()) return false;
    return /₹\s?\d{1,3}(,\d{3})*/.test(document.body.innerText);
  }

  /* ---------------- RANDOM COLORS ---------------- */
  const COLORS = [
    "#2563eb", "#16a34a", "#7c3aed",
    "#db2777", "#ea580c", "#0f766e"
  ];

  function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  /* ---------------- PRICE EXTRACTION ---------------- */
  function extractPrice() {
    const match = document.body.innerText.match(/₹\s?\d{1,3}(,\d{3})*/);
    if (!match) return null;
    return parseInt(match[0].replace(/[₹,\s]/g, ""), 10);
  }

  function savePrice(price) {
    const today = new Date().toISOString().split("T")[0];
    const site = location.hostname;

    chrome.storage.local.get([today], res => {
      const data = res[today] || {};
      if (!data[site]) data[site] = [];
      data[site].push(price);
      chrome.storage.local.set({ [today]: data });
    });
  }

  /* ---------------- SHOW iOS BOTTOM SHEET ---------------- */
  function showPrompt(message) {
    if (shown) return;
    shown = true;

    const accent = randomColor();

    const overlay = document.createElement("div");
    overlay.id = "ios-overlay";
    overlay.style.setProperty("--accent", accent);

    overlay.innerHTML = `
      <div class="ios-sheet">
        <div class="ios-handle"></div>
        <div class="ios-icon">💸</div>
        <h2>MONEY IS IMPORTANT</h2>
        <p>${message}</p>
        <button id="continueBtn" disabled>Continue (5)</button>
      </div>
    `;

    document.body.appendChild(overlay);

    let seconds = 5;
    const btn = document.getElementById("continueBtn");

    const timer = setInterval(() => {
      seconds--;
      if (seconds > 0) {
        btn.textContent = `Continue (${seconds})`;
      } else {
        clearInterval(timer);
        btn.textContent = "Continue";
        btn.disabled = false;
      }
    }, 1000);

    btn.onclick = () => {
      if (btn.disabled) return;

      const price = extractPrice();
      if (price) savePrice(price);

      overlay.classList.add("hide");
      setTimeout(() => overlay.remove(), 300);
    };
  }

  function trigger() {
    if (!isShoppingSite()) return;

    chrome.storage.sync.get(["userMessage"], res => {
      showPrompt(res.userMessage || "Think before buying");
    });
  }

  setTimeout(trigger, 2500);

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      shown = false;
      setTimeout(trigger, 2000);
    }
  }).observe(document, { childList: true, subtree: true });

})();
