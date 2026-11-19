/* Стена коллажей: лайтбокс с полным постером, подписью и стрелками.
   Без библиотек. Анимации уважают prefers-reduced-motion.
   Разметка - collages.html, стили - collages.css. */
(() => {
  "use strict";

  const pieces = Array.from(document.querySelectorAll(".piece-btn"));
  const box = document.getElementById("lightbox");
  if (!pieces.length || !box) return;

  const img = document.getElementById("lb-img");
  const video = document.getElementById("lb-video");
  const elNo = document.getElementById("lb-no");
  const elTitle = document.getElementById("lb-title");
  const elNote = document.getElementById("lb-note");
  const elCaption = document.getElementById("lb-caption");
  const closeBtn = box.querySelector(".lightbox-close");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pad = (n) => String(n).padStart(2, "0");
  let current = 0;
  let lastFocus = null;

  function render(index) {
    current = (index + pieces.length) % pieces.length;
    const btn = pieces[current];
    const data = btn.dataset;
    const source = btn.querySelector("img");

    elNo.textContent = pad(current + 1) + " / " + pad(pieces.length);
    elTitle.textContent = data.title || "";
    elNote.textContent = data.note || "";
    elCaption.textContent = data.caption || "";

    if (data.video) {
      img.hidden = true;
      img.removeAttribute("src");
      video.hidden = false;
      if (!video.getAttribute("src")) {
        video.src = data.video;
        video.poster = data.full || "";
      }
      // ролик грузится лениво: как только хватит данных, запускаем сами
      video.onloadeddata = () => {
        if (video.hidden || reduced) return;
        const played = video.play();
        if (played && typeof played.catch === "function") played.catch(() => {});
      };
      if (!reduced) {
        const played = video.play();
        if (played && typeof played.catch === "function") played.catch(() => {});
      }
    } else {
      video.pause();
      video.hidden = true;
      img.hidden = false;
      img.src = data.full;
      img.alt = source ? source.alt : "";
    }
  }

  function focusables() {
    return Array.from(
      box.querySelectorAll("button, [href], video[controls]")
    ).filter((el) => !el.hidden && el.offsetParent !== null);
  }

  function onKey(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      render(current - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      render(current + 1);
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function open(index, trigger) {
    lastFocus = trigger || null;
    render(index);
    box.hidden = false;
    document.documentElement.classList.add("lightbox-open");
    document.addEventListener("keydown", onKey);
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    document.documentElement.classList.remove("lightbox-open");
    document.removeEventListener("keydown", onKey);
    video.pause();
    img.removeAttribute("src");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  pieces.forEach((btn, index) => {
    btn.addEventListener("click", () => open(index, btn));
  });

  box.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  const prev = box.querySelector("[data-prev]");
  const next = box.querySelector("[data-next]");
  if (prev) prev.addEventListener("click", () => render(current - 1));
  if (next) next.addEventListener("click", () => render(current + 1));
})();
