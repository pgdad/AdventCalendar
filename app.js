(() => {
  "use strict";

  const CONTENT_URL = "jokes.md";
  const LAST_DAY = 25;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  // ---------- Date handling & simulation ----------
  // Simulate a date with ?date=YYYY-MM-DD, or a December day with ?day=N.
  const params = new URLSearchParams(location.search);

  function parseSimulated() {
    const date = params.get("date");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split("-").map(Number);
      const sim = new Date(y, m - 1, d);
      if (sim.getMonth() === m - 1) return sim;
    }
    const day = Number(params.get("day"));
    if (Number.isInteger(day) && day >= 1 && day <= 31) {
      return new Date(calendarYear(new Date()), 11, day);
    }
    return null;
  }

  // The calendar for a given season belongs to December of that year;
  // in January we are still looking back on the previous Christmas.
  function calendarYear(d) {
    return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
  }

  const simulated = parseSimulated();
  const now = simulated || new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const year = calendarYear(today);

  function doorDate(day) { return new Date(year, 11, day); }

  function stateOf(day) {
    const t = doorDate(day).getTime();
    if (t > today.getTime()) return "future";
    if (t === today.getTime()) return "today";
    return "past";
  }

  function daysUntil(day) {
    return Math.round((doorDate(day) - today) / 86400000);
  }

  function fmt(d) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  // ---------- Content ----------
  // Each "### ... December N" heading is followed by a hint line and an answer line.
  function parseContent(md) {
    const days = {};
    md.split(/^###\s+/m).slice(1).forEach(section => {
      const lines = section.split("\n");
      const match = lines[0].match(/December\s+(\d+)/i);
      if (!match) return;
      const body = [];
      for (const line of lines.slice(1)) {
        if (!line.trim()) { if (body.length) break; else continue; }
        body.push(line.trim());
      }
      if (body.length >= 2) {
        days[Number(match[1])] = { hint: body[0], answer: body.slice(1).join(" ") };
      }
    });
    return days;
  }

  // ---------- Rendering ----------
  const calendarEl = document.getElementById("calendar");
  const statusEl = document.getElementById("status");
  const bannerEl = document.getElementById("sim-banner");
  const dialog = document.getElementById("door-dialog");
  const titleEl = document.getElementById("dialog-title");
  const hintEl = document.getElementById("dialog-hint");
  const answerEl = document.getElementById("dialog-answer");
  const revealBtn = document.getElementById("reveal-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  let content = {};
  let current = null;

  function renderStatus() {
    const first = daysUntil(1);
    const last = daysUntil(LAST_DAY);
    if (first > 0) {
      statusEl.textContent = `Advent begins in ${first} day${first === 1 ? "" : "s"}. Watch and wait with hope.`;
    } else if (last > 0) {
      statusEl.textContent = `Today’s door is open — ${last} day${last === 1 ? "" : "s"} until Christmas.`;
    } else if (last === 0) {
      statusEl.textContent = "Christ is born! A blessed and merry Christmas.";
    } else {
      statusEl.textContent = "Every door is open. May the peace of Christmas remain with you.";
    }
  }

  function renderBanner() {
    if (!simulated) return;
    const clean = location.pathname;
    bannerEl.innerHTML = "";
    bannerEl.append(
      `Simulating ${fmt(today)}. `,
      Object.assign(document.createElement("a"), { href: clean, textContent: "Return to the real date" })
    );
    bannerEl.hidden = false;
  }

  function renderCalendar() {
    calendarEl.innerHTML = "";
    for (let day = 1; day <= LAST_DAY; day++) {
      const state = stateOf(day);
      const li = document.createElement("li");
      if (day === LAST_DAY) li.className = "christmas-cell";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `door ${state}${day === LAST_DAY ? " christmas" : ""}`;
      btn.dataset.day = day;

      let label;
      if (state === "future") {
        const n = daysUntil(day);
        label = `in ${n} day${n === 1 ? "" : "s"}`;
        btn.setAttribute("aria-disabled", "true");
        btn.setAttribute("aria-label", `December ${day}, opens ${label}`);
      } else {
        label = state === "today" ? (day === LAST_DAY ? "Christmas Day" : "Open today") : "Opened";
        btn.setAttribute("aria-label", `December ${day}, ${label}`);
        btn.addEventListener("click", () => openDoor(day));
      }

      btn.innerHTML = `<span class="face"><span class="num">${day}</span><span class="label">${label}</span></span>`;
      li.append(btn);
      calendarEl.append(li);
    }
  }

  function unlocked(day) {
    return day >= 1 && day <= LAST_DAY && stateOf(day) !== "future";
  }

  function openDoor(day) {
    if (!unlocked(day)) return;
    current = day;
    const entry = content[day];
    titleEl.textContent = day === LAST_DAY ? "Christmas Day" : `December ${day}`;
    hintEl.textContent = entry ? entry.hint : "This door’s message has not yet been written.";
    answerEl.textContent = entry ? entry.answer : "";
    answerEl.hidden = true;
    revealBtn.hidden = !entry;
    prevBtn.disabled = !unlocked(day - 1);
    nextBtn.disabled = !unlocked(day + 1);
    if (!dialog.open) dialog.showModal();
  }

  revealBtn.addEventListener("click", () => {
    answerEl.hidden = false;
    revealBtn.hidden = true;
  });
  prevBtn.addEventListener("click", () => openDoor(current - 1));
  nextBtn.addEventListener("click", () => openDoor(current + 1));
  dialog.querySelector(".close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
  document.addEventListener("keydown", e => {
    if (!dialog.open) return;
    if (e.key === "ArrowLeft" && !prevBtn.disabled) openDoor(current - 1);
    if (e.key === "ArrowRight" && !nextBtn.disabled) openDoor(current + 1);
  });

  renderStatus();
  renderBanner();
  renderCalendar();

  fetch(CONTENT_URL, { cache: "no-cache" })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(md => { content = parseContent(md); })
    .catch(() => { statusEl.textContent = "The calendar’s messages could not be loaded."; });
})();
