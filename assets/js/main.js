/* ============================================================
   MAINFOLD · site interactions & animations
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (toggle && mobileMenu) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("open");
      mobileMenu.classList.toggle("open");
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.classList.remove("open");
        mobileMenu.classList.remove("open");
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(".reveal, .reveal-stagger, .timeline-step");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -10px 0px" }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }
  /* Safety net: guarantee nothing stays invisible even if an observer
     callback is ever missed (e.g. very fast programmatic scrolling,
     unusual embedding contexts). Real scroll speeds always reveal well
     before this fires. */
  setTimeout(function () {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }, 3000);

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll("[data-count-to]");
  function animateCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    var target = parseFloat(el.getAttribute("data-count-to"));
    var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = value.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -10px 0px" }
    );
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-count-to");
    });
  }
  /* Safety net matching the reveal fallback above: never leave a stat at 0. */
  setTimeout(function () {
    counters.forEach(function (el) {
      if (!el.dataset.counted) {
        var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
        el.textContent = parseFloat(el.getAttribute("data-count-to")).toFixed(decimals);
        el.dataset.counted = "1";
      }
    });
  }, 3200);

  /* ---------- Hero terminal typing loop ---------- */
  var terminalBody = document.getElementById("hero-terminal");
  if (terminalBody) {
    var script = [
      { prompt: "$", html: 'intake <span class="tag">--client</span> "industrieel bedrijf, Antwerpen"' },
      { prompt: ">", html: 'scope gedetecteerd: <span class="tag">OT / ICS security</span>' },
      { prompt: ">", html: 'profiel gezocht: senior consultant, 5 jaar+' },
      { prompt: "$", html: "match --netwerk --screening" },
      { prompt: ">", html: '<span class="ok">✓</span> kandidaat gescreend: technisch, communicatie, fit' },
      { prompt: ">", html: '<span class="ok">✓</span> beschikbaar binnen 3 weken' },
      { prompt: "$", html: "plaatsing bevestigen" },
      { prompt: ">", html: '<span class="ok">✓</span> opdracht gestart, 12 maanden, NIS2 scope' },
    ];
    var lineIndex = 0;
    var linesOnScreen = [];
    var maxLines = 7;

    function renderLines() {
      terminalBody.innerHTML = linesOnScreen
        .map(function (l, i) {
          var isLast = i === linesOnScreen.length - 1;
          return (
            '<div class="terminal-line" style="animation-delay:0s">' +
            '<span class="prompt">' + l.prompt + "</span>" +
            '<span>' + l.html + (isLast ? '<span class="terminal-caret"></span>' : "") + "</span>" +
            "</div>"
          );
        })
        .join("");
    }

    function typeNext() {
      var entry = script[lineIndex % script.length];
      linesOnScreen.push(entry);
      if (linesOnScreen.length > maxLines) linesOnScreen.shift();
      renderLines();
      lineIndex++;
      setTimeout(typeNext, 1500);
    }
    typeNext();
  }

  /* ---------- Contact forms (client-side demo) ---------- */
  document.querySelectorAll(".intake-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = form.querySelector(".form-success");
      if (success) {
        success.classList.add("show");
        success.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      form.reset();
    });
  });

  /* ---------- Audience tabs (bedrijven / consultants) ----------
     Panel switching itself works via pure CSS :target (see style.css),
     so it keeps working even if this script fails to load. This only
     adds the active-button highlight as a visual enhancement. */
  var tabButtons = document.querySelectorAll("#contact-tabs .tab-btn");
  if (tabButtons.length) {
    function updateActiveTab() {
      var hash = window.location.hash.replace("#", "") || "bedrijven";
      tabButtons.forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === hash);
      });
    }
    updateActiveTab();
    window.addEventListener("hashchange", updateActiveTab);
  }

  /* ---------- Intake wizard (contact.html, bedrijven panel) ----------
     Multi-step qualifier: every answer gets an immediate "we cover
     this" confirmation, contact details are asked only at the end.
     The whole thing is JS-only progressive enhancement; .no-wizard-fallback
     in the markup carries a plain always-working form when JS is off. */
  var wizard = document.getElementById("intake-wizard");
  if (wizard) {
    var wizardSteps = Array.prototype.slice.call(wizard.querySelectorAll(".wizard-step"));
    var wizardOrder = ["1", "2", "3", "4", "5"];
    var wizardIndex = 0;
    var wizardAnswers = {};

    var wizardNext = document.getElementById("wizard-next");
    var wizardBack = document.getElementById("wizard-back");
    var wizardNav = document.getElementById("wizard-nav");
    var wizardProgressFill = document.getElementById("wizard-progress-fill");
    var wizardStepNum = document.getElementById("wizard-step-num");

    function wizardShow(stepKey) {
      wizardSteps.forEach(function (el) {
        el.classList.toggle("active", el.getAttribute("data-step") === stepKey);
      });
    }

    function wizardUpdateProgress() {
      wizardProgressFill.style.width = ((wizardIndex + 1) / wizardOrder.length) * 100 + "%";
      wizardStepNum.textContent = wizardIndex + 1;
      wizardBack.style.visibility = wizardIndex === 0 ? "hidden" : "visible";
    }

    function wizardCheckEnabled() {
      var stepKey = wizardOrder[wizardIndex];
      if (stepKey === "5") {
        var name = document.getElementById("w-name").value.trim();
        var company = document.getElementById("w-company").value.trim();
        var email = document.getElementById("w-email").value.trim();
        wizardNext.disabled = !(name && company && email);
        wizardNext.textContent = "Bekijk mijn intake-overzicht";
      } else {
        wizardNext.disabled = !wizardAnswers[stepKey];
        wizardNext.textContent = "Volgende";
      }
    }

    wizardSteps.forEach(function (stepEl) {
      var stepKey = stepEl.getAttribute("data-step");
      if (stepKey === "5" || stepKey === "success") return;
      var options = stepEl.querySelectorAll(".wizard-option");
      var confirmEl = stepEl.querySelector(".wizard-confirm");
      var confirmText = stepEl.querySelector(".wizard-confirm-text");
      options.forEach(function (btn) {
        btn.addEventListener("click", function () {
          options.forEach(function (b) { b.classList.remove("selected"); });
          btn.classList.add("selected");
          wizardAnswers[stepKey] = { label: btn.textContent.trim(), confirm: btn.getAttribute("data-confirm") };
          if (confirmText) confirmText.textContent = btn.getAttribute("data-confirm");
          if (confirmEl) confirmEl.classList.add("show");
          wizardCheckEnabled();
        });
      });
    });

    ["w-name", "w-company", "w-email", "w-phone"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", wizardCheckEnabled);
    });

    function wizardBuildSummary() {
      var nameEl = document.getElementById("wizard-thanks-name");
      var fullName = wizardAnswers.contact.name;
      nameEl.textContent = fullName.split(" ")[0] || fullName;
      var list = document.getElementById("wizard-summary");
      list.innerHTML = "";
      var rows = [
        ["Expertise", wizardAnswers["1"] ? wizardAnswers["1"].label : ""],
        ["Samenwerking", wizardAnswers["2"] ? wizardAnswers["2"].label : ""],
        ["Sector", wizardAnswers["3"] ? wizardAnswers["3"].label : ""],
        ["Timing", wizardAnswers["4"] ? wizardAnswers["4"].label : ""],
        ["E-mail", wizardAnswers.contact.email]
      ];
      rows.forEach(function (r) {
        if (!r[1]) return;
        var li = document.createElement("li");
        var labelSpan = document.createElement("span");
        labelSpan.className = "label";
        labelSpan.textContent = r[0];
        var valueSpan = document.createElement("span");
        valueSpan.className = "value";
        valueSpan.textContent = r[1];
        li.appendChild(labelSpan);
        li.appendChild(valueSpan);
        list.appendChild(li);
      });
    }

    wizardNext.addEventListener("click", function () {
      var stepKey = wizardOrder[wizardIndex];
      if (stepKey === "5") {
        wizardAnswers.contact = {
          name: document.getElementById("w-name").value.trim(),
          company: document.getElementById("w-company").value.trim(),
          email: document.getElementById("w-email").value.trim(),
          phone: document.getElementById("w-phone").value.trim()
        };
        wizardBuildSummary();
        wizardShow("success");
        wizardNav.style.display = "none";
        return;
      }
      wizardIndex++;
      wizardShow(wizardOrder[wizardIndex]);
      wizardUpdateProgress();
      wizardCheckEnabled();
    });

    wizardBack.addEventListener("click", function () {
      if (wizardIndex === 0) return;
      wizardIndex--;
      wizardShow(wizardOrder[wizardIndex]);
      wizardUpdateProgress();
      wizardCheckEnabled();
    });

    wizardUpdateProgress();
    wizardCheckEnabled();
  }

  /* ---------- Year in footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
