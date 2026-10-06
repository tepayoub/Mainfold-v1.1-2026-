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

  /* ---------- Hero matching console (.mf, index.html) ---------- */
  var mfWidget = document.getElementById("mf");
  if (mfWidget) {
    var mfScenarios = [
      { dom: "IT × OT", sec: "Industrie", f: ["OT Security Engineer", "Structureel · 12 maanden", "IEC 62443", "Antwerpen"], code: "MF-OT-042", lvl: "Match · senior" },
      { dom: "Cloud", sec: "Financiële instelling", f: ["Cloud Engineer", "Project · migratie Azure", "ISO 27001", "Brussel"], code: "MF-CL-017", lvl: "Match · senior" },
      { dom: "Security", sec: "Energie en nuts", f: ["SOC Analyst", "Structureel · 18 maanden", "24/7 monitoring", "Gent"], code: "MF-SC-008", lvl: "Match · medior" },
      { dom: "Security", sec: "Overheid", f: ["Penetration Tester", "Ad-hoc · 2 weken", "OWASP · red team", "Leuven"], code: "MF-PT-031", lvl: "Match · senior" },
      { dom: "Governance", sec: "Zorg", f: ["GRC Consultant", "Structureel · 9 maanden", "ISO 27001 · risicobeheer", "Hasselt"], code: "MF-GR-023", lvl: "Match · senior" },
      { dom: "IT × OT", sec: "Logistiek", f: ["Solution Architect", "Project · netwerksegmentatie", "IEC 62443 · zero trust", "Mechelen"], code: "MF-AR-011", lvl: "Match · senior" },
    ];
    (function () {
      var mf = mfWidget;
      var $ = function (id) { return document.getElementById(id); };
      var rows = mf.querySelectorAll(".row");
      var bars = $("mf-list").children;
      var i = 0;
      var timers = [];
      var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

      function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

      function fill(s) {
        $("mf-dom").textContent = s.dom;
        $("mf-sec").textContent = s.sec;
        $("mf-code").textContent = s.code;
        $("mf-lvl").textContent = s.lvl;
        s.f.forEach(function (v, k) { $("mf-f" + k).textContent = v; });
        $("mf-idx").textContent = ("0" + (i + 1)).slice(-2) + " / 0" + mfScenarios.length;
      }

      function run() {
        var s = mfScenarios[i];
        fill(s);
        if (reduceMotion) {
          mf.classList.add("joined", "matched");
          rows.forEach(function (r) { r.classList.add("on"); });
          return;
        }
        mf.classList.remove("matched", "scanning");
        rows.forEach(function (r) { r.classList.remove("on"); });
        for (var b = 0; b < bars.length; b++) bars[b].className = "";
        at(150, function () { mf.classList.add("joined"); });
        rows.forEach(function (r, k) { at(500 + k * 320, function () { r.classList.add("on"); }); });
        at(1900, function () { mf.classList.add("scanning"); });
        var hit = 3 + Math.floor(Math.random() * 8);
        for (var b2 = 0; b2 <= hit; b2++) {
          (function (n) { at(2000 + n * 90, function () { bars[n].className = n === hit ? "hit" : "seen"; }); })(b2);
        }
        at(2200 + hit * 90, function () { mf.classList.add("matched"); });
        at(6200, function () { mf.classList.remove("matched"); rows.forEach(function (r) { r.classList.remove("on"); }); });
        at(6900, function () { i = (i + 1) % mfScenarios.length; run(); });
      }

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          timers.forEach(clearTimeout);
          timers = [];
        } else {
          run();
        }
      });
      run();
    })();
  }

  /* ---------- NIS2-check quiz (nis2-check.html) ---------- */
  var nis2Wizard = document.getElementById("nis2-wizard");
  if (nis2Wizard) {
    var nis2Order = ["1", "2", "3", "4", "result"];
    var nis2Index = 0;
    var nis2Score = 0;
    var nis2Readiness = "";
    var nis2Steps = Array.prototype.slice.call(nis2Wizard.querySelectorAll(".wizard-step"));
    var nis2ProgressFill = document.getElementById("nis2-progress-fill");
    var nis2StepNum = document.getElementById("nis2-step-num");
    var nis2TitleEl = document.getElementById("nis2-result-title");
    var nis2BodyEl = document.getElementById("nis2-result-body");

    function nis2Show(stepKey) {
      nis2Steps.forEach(function (el) {
        el.classList.toggle("active", el.getAttribute("data-nis2-step") === stepKey);
      });
    }

    function nis2UpdateProgress() {
      var pct = Math.min(((nis2Index + 1) / 4) * 100, 100);
      if (nis2ProgressFill) nis2ProgressFill.style.width = pct + "%";
      if (nis2StepNum) nis2StepNum.textContent = Math.min(nis2Index + 1, 4);
    }

    function nis2ShowResult() {
      var title, body;
      if (nis2Score >= 6) {
        title = "Hoge kans dat uw organisatie onder NIS2 valt.";
        body = "Op basis van uw antwoorden lijkt uw organisatie te passen in het profiel van een essentiële of belangrijke entiteit onder NIS2. Een gerichte intake brengt de exacte scope en verplichtingen in kaart.";
      } else if (nis2Score >= 3) {
        title = "Mogelijk relevant, ook als het niet meteen duidelijk is.";
        body = "Uw organisatie valt mogelijk rechtstreeks onder NIS2, of krijgt de eisen doorgeschoven via klanten of leveranciersketens. Het loont om dit nu uit te klaren in plaats van af te wachten.";
      } else {
        title = "Op basis van deze antwoorden wellicht niet rechtstreeks.";
        body = "Uw organisatie lijkt op dit moment niet het meest voor de hand liggende profiel voor NIS2. Toch kunnen eisen van klanten of toekomstige groei dit doen veranderen, dus blijf dit opvolgen.";
      }
      if (nis2Readiness === "nog niet gestart") {
        body += " Omdat u nog niet gestart bent, is een gap-analyse een logische eerste stap.";
      } else if (nis2Readiness === "gap-analyse") {
        body += " U bent al bezig met een gap-analyse, wat het gesprek meteen concreter maakt.";
      } else if (nis2Readiness === "grotendeels klaar") {
        body += " U staat al ver; een externe toetsing kan de puzzel vervolledigen.";
      }
      if (nis2TitleEl) nis2TitleEl.textContent = title;
      if (nis2BodyEl) nis2BodyEl.textContent = body;
    }

    function nis2Restart() {
      nis2Index = 0;
      nis2Score = 0;
      nis2Readiness = "";
      nis2Show(nis2Order[0]);
      nis2UpdateProgress();
    }

    nis2Steps.forEach(function (stepEl) {
      var options = stepEl.querySelectorAll(".wizard-option");
      options.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = btn.getAttribute("data-value");
          var readiness = btn.getAttribute("data-readiness");
          if (val !== null) nis2Score += parseInt(val, 10);
          if (readiness !== null) nis2Readiness = readiness;
          nis2Index++;
          if (nis2Order[nis2Index] === "result") {
            nis2ShowResult();
          }
          nis2Show(nis2Order[nis2Index]);
          nis2UpdateProgress();
        });
      });
    });

    var nis2RestartBtn = document.getElementById("nis2-restart");
    if (nis2RestartBtn) nis2RestartBtn.addEventListener("click", nis2Restart);

    nis2Show(nis2Order[0]);
    nis2UpdateProgress();
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
