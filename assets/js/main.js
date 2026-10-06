/* ============================================================
   MAINFOLD · site interactions & animations
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Shared lead submission helper ----------
     Every form/quiz on the site (contact forms, the intake wizard,
     the NIS2-check, the looptijd-slider) posts through this single
     helper to /send-lead.php, which relays the lead to Resend
     server-side. Returns a Promise<boolean> (true = sent). */
  function mfSendLead(payload) {
    return fetch("send-lead.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) { return res.json().catch(function () { return { success: false }; }); })
      .then(function (data) { return !!data.success; })
      .catch(function () { return false; });
  }

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
            var el = entry.target;
            var delay = +el.getAttribute("data-reveal-delay") || 0;
            setTimeout(function () { el.classList.add("in"); }, delay);
            io.unobserve(el);
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
    var nis2Answers = [];
    var nis2ResultLabel = "";
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
      nis2ResultLabel = title;
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
      nis2Answers = [];
      var leadForm = document.getElementById("nis2-lead-form");
      var leadSuccess = document.getElementById("nis2-lead-success");
      var leadError = document.getElementById("nis2-lead-error");
      if (leadForm) leadForm.style.display = "";
      if (leadSuccess) leadSuccess.classList.remove("show");
      if (leadError) leadError.classList.remove("show");
      nis2Show(nis2Order[0]);
      nis2UpdateProgress();
    }

    nis2Steps.forEach(function (stepEl) {
      var questionEl = stepEl.querySelector(".wizard-question");
      var options = stepEl.querySelectorAll(".wizard-option");
      options.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = btn.getAttribute("data-value");
          var readiness = btn.getAttribute("data-readiness");
          if (val !== null) nis2Score += parseInt(val, 10);
          if (readiness !== null) nis2Readiness = readiness;
          nis2Answers.push([questionEl ? questionEl.textContent.trim() : "Vraag", btn.textContent.trim()]);
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

    var nis2SendBtn = document.getElementById("nis2-send");
    if (nis2SendBtn) {
      nis2SendBtn.addEventListener("click", function () {
        var nameEl = document.getElementById("nis2-name");
        var emailEl = document.getElementById("nis2-email");
        var websiteEl = document.getElementById("nis2-website");
        var leadError = document.getElementById("nis2-lead-error");
        var leadSuccess = document.getElementById("nis2-lead-success");
        var name = nameEl ? nameEl.value.trim() : "";
        var email = emailEl ? emailEl.value.trim() : "";
        if (leadError) leadError.classList.remove("show");
        if (!name || !email) {
          if (leadError) leadError.classList.add("show");
          return;
        }
        var details = nis2Answers.slice();
        details.push(["Resultaat", nis2ResultLabel]);
        nis2SendBtn.disabled = true;
        mfSendLead({
          source: "nis2-check",
          name: name,
          email: email,
          website: websiteEl ? websiteEl.value : "",
          details: details,
        }).then(function (ok) {
          nis2SendBtn.disabled = false;
          if (ok) {
            var leadFormEl = document.getElementById("nis2-lead-form");
            if (nameEl) nameEl.closest(".form-row").style.display = "none";
            if (leadFormEl) {
              var heading = leadFormEl.querySelector("h3");
              var sub = leadFormEl.querySelector("p");
              if (heading) heading.style.display = "none";
              if (sub) sub.style.display = "none";
            }
            nis2SendBtn.style.display = "none";
            if (leadSuccess) leadSuccess.classList.add("show");
          } else if (leadError) {
            leadError.classList.add("show");
          }
        });
      });
    }

    nis2Show(nis2Order[0]);
    nis2UpdateProgress();
  }

  /* ---------- Gratis expertise-scan (gratis-scan.html) ----------
     Breder dan de NIS2-check: 6 vragen die samen een resultaattekst
     opbouwen uit losse bouwstenen (pijnpunt + aanpak + urgentie +
     sector/OT), in plaats van een vast aantal uitkomsten, zodat het
     resultaat per combinatie van antwoorden anders aanvoelt. */
  var scanWizard = document.getElementById("scan-wizard");
  if (scanWizard) {
    var scanOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "result"];
    var scanIndex = 0;
    var scanAnswers = [];
    var scanData = {
      sector: "", grootte: "", ot: "", rol: "", team: "", pijnpunt: "",
      compliance: "", extern: "", budget: "", samenwerking: "", urgentie: "", bron: "",
    };
    var scanResultLabel = "";
    var scanSteps = Array.prototype.slice.call(scanWizard.querySelectorAll(".wizard-step"));
    var scanProgressFill = document.getElementById("scan-progress-fill");
    var scanStepNum = document.getElementById("scan-step-num");
    var scanTitleEl = document.getElementById("scan-result-title");
    var scanBodyEl = document.getElementById("scan-result-body");

    var scanSectorLabels = {
      energie: "Energie & nutsvoorzieningen", financieel: "de financiële sector", ict: "digitale infrastructuur & ICT",
      industrie: "industrie & productie", overheid: "de overheid", andere: "uw sector",
    };
    var scanPainpoints = {
      capaciteit: {
        title: "Het grootste gat zit in capaciteit, niet in kennis.",
        body: "Uw team weet wat er moet gebeuren, maar mist de uren om het structureel op te volgen naast de dagelijkse werking.",
      },
      compliance: {
        title: "Compliance-druk bepaalt nu de agenda.",
        body: "Regelgeving zoals NIS2, DORA of ISO 27001 vraagt een aantoonbare aanpak, niet enkel goede intenties.",
      },
      project: {
        title: "Een concreet project zet de klok.",
        body: "Een geplande migratie of uitrol brengt tijdelijk extra expertise in beeld die niet standaard in het team zit.",
      },
      cloud: {
        title: "Cloud- en infrastructuurrisico is de grootste onzekerheid.",
        body: "De omgeving is de voorbije jaren complexer geworden, en het overzicht over wie waarvoor verantwoordelijk is, ontbreekt soms.",
      },
      onduidelijk: {
        title: "Een brede doorlichting is het logische startpunt.",
        body: "Zonder een helder beeld van de huidige situatie is elke volgende stap gokwerk.",
      },
    };
    var scanSamenwerkingInfo = {
      adhoc: {
        sentence: " Dat wijst naar ad-hoc inzet: senior expertise die snel inzetbaar is voor een acute nood.",
        linkText: "Meer over ad-hoc inzet →",
        href: "diensten.html#ad-hoc-inzet",
      },
      project: {
        sentence: " Dat wijst naar een project: een volledig team met kwaliteits- en timingopvolging vanuit Mainfold.",
        linkText: "Meer over projecten →",
        href: "diensten.html#projecten",
      },
      structureel: {
        sentence: " Dat wijst naar een structurele plaatsing: iemand die zes tot vierentwintig maanden naadloos meedraait.",
        linkText: "Meer over structurele plaatsing →",
        href: "diensten.html#structurele-plaatsing",
      },
      onduidelijk: {
        sentence: " Welk type samenwerking het best past, is op dit moment nog niet duidelijk, en dat is prima: een intake brengt dat vanzelf in kaart.",
        linkText: "Bekijk alle diensten →",
        href: "diensten.html",
      },
    };
    var scanUrgentieModifiers = {
      dringend: " Omdat dit nu dringend is, loont een gesprek deze week meer dan een maand wachten.",
      binnenkort: " Met enkele maanden speelruimte is er nog tijd om dit gestructureerd aan te pakken in plaats van te improviseren.",
      orienterend: " Zonder directe druk is dit het moment om rustig te verkennen wat wel en niet nodig is, zonder verkoopdruk.",
    };
    var scanComplianceModifiers = {
      "nog-niet-gestart": " Omdat u nog niet gestart bent met uw compliance-traject, is een gap-analyse een logische eerste stap.",
      "gap-analyse": " U bent al bezig met een gap-analyse, wat het gesprek meteen concreter maakt.",
      "grotendeels-klaar": " U staat al ver met compliance; een externe toetsing kan de puzzel vervolledigen.",
      "niet-van-toepassing": "",
    };
    var scanBudgetModifiers = {
      goedgekeurd: " Met budget al goedgekeurd, kan een intake meteen concreet worden.",
      "in-behandeling": " Met budget in behandeling is dit het juiste moment om de scope alvast scherp te zetten.",
      "nog-geen": " Zonder budget nog vastgelegd, beginnen we liever met een verkennend, vrijblijvend gesprek.",
      onbekend: "",
    };

    function scanShow(stepKey) {
      scanSteps.forEach(function (el) {
        el.classList.toggle("active", el.getAttribute("data-scan-step") === stepKey);
      });
    }

    function scanUpdateProgress() {
      var total = scanOrder.length - 1;
      var pct = Math.min(((scanIndex + 1) / total) * 100, 100);
      if (scanProgressFill) scanProgressFill.style.width = pct + "%";
      if (scanStepNum) scanStepNum.textContent = Math.min(scanIndex + 1, total);
    }

    function scanShowResult() {
      var p = scanPainpoints[scanData.pijnpunt] || scanPainpoints.onduidelijk;
      var title = p.title;
      var body = p.body;
      body += scanComplianceModifiers[scanData.compliance] || "";
      body += scanBudgetModifiers[scanData.budget] || "";
      body += scanUrgentieModifiers[scanData.urgentie] || "";
      var sectorLabel = scanSectorLabels[scanData.sector] || "uw sector";
      if (scanData.ot === "ot" || scanData.ot === "it-ot") {
        body += " Binnen " + sectorLabel + ", met operationele technologie in de mix, is die combinatie van IT- en OT-kennis precies waar Mainfold het verschil maakt.";
      } else {
        body += " Binnen " + sectorLabel + " is senior IT- en cloudsecurityexpertise dan het meest relevante vertrekpunt.";
      }
      var sw = scanSamenwerkingInfo[scanData.samenwerking] || scanSamenwerkingInfo.onduidelijk;
      body += sw.sentence;
      scanResultLabel = title;
      if (scanTitleEl) scanTitleEl.textContent = title;
      if (scanBodyEl) scanBodyEl.textContent = body;
      var linkEl = document.getElementById("scan-result-link");
      if (linkEl) {
        linkEl.textContent = sw.linkText;
        linkEl.setAttribute("href", sw.href);
      }
    }

    function scanRestart() {
      scanIndex = 0;
      scanAnswers = [];
      scanData = {
        sector: "", grootte: "", ot: "", rol: "", team: "", pijnpunt: "",
        compliance: "", extern: "", budget: "", samenwerking: "", urgentie: "", bron: "",
      };
      var leadForm = document.getElementById("scan-lead-form");
      var leadSuccess = document.getElementById("scan-lead-success");
      var leadError = document.getElementById("scan-lead-error");
      if (leadForm) leadForm.style.display = "";
      if (leadSuccess) leadSuccess.classList.remove("show");
      if (leadError) leadError.classList.remove("show");
      scanShow(scanOrder[0]);
      scanUpdateProgress();
    }

    var scanDataKeys = [
      "sector", "grootte", "ot", "rol", "team", "pijnpunt",
      "compliance", "extern", "budget", "samenwerking", "urgentie", "bron",
    ];
    scanSteps.forEach(function (stepEl, i) {
      var questionEl = stepEl.querySelector(".wizard-question");
      var options = stepEl.querySelectorAll(".wizard-option");
      options.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = scanDataKeys[i];
          if (key) {
            var val = btn.getAttribute("data-" + key);
            if (val !== null) scanData[key] = val;
          }
          scanAnswers.push([questionEl ? questionEl.textContent.trim() : "Vraag", btn.textContent.trim()]);
          scanIndex++;
          if (scanOrder[scanIndex] === "result") {
            scanShowResult();
          }
          scanShow(scanOrder[scanIndex]);
          scanUpdateProgress();
        });
      });
    });

    var scanRestartBtn = document.getElementById("scan-restart");
    if (scanRestartBtn) scanRestartBtn.addEventListener("click", scanRestart);

    var scanSendBtn = document.getElementById("scan-send");
    if (scanSendBtn) {
      scanSendBtn.addEventListener("click", function () {
        var nameEl = document.getElementById("scan-name");
        var emailEl = document.getElementById("scan-email");
        var websiteEl = document.getElementById("scan-website");
        var leadError = document.getElementById("scan-lead-error");
        var leadSuccess = document.getElementById("scan-lead-success");
        var name = nameEl ? nameEl.value.trim() : "";
        var email = emailEl ? emailEl.value.trim() : "";
        if (leadError) leadError.classList.remove("show");
        if (!name || !email) {
          if (leadError) leadError.classList.add("show");
          return;
        }
        var details = scanAnswers.slice();
        details.push(["Resultaat", scanResultLabel]);
        scanSendBtn.disabled = true;
        mfSendLead({
          source: "gratis-scan",
          name: name,
          email: email,
          website: websiteEl ? websiteEl.value : "",
          details: details,
        }).then(function (ok) {
          scanSendBtn.disabled = false;
          if (ok) {
            var leadFormEl = document.getElementById("scan-lead-form");
            if (nameEl) nameEl.closest(".form-row").style.display = "none";
            if (leadFormEl) {
              var heading = leadFormEl.querySelector("h3");
              var sub = leadFormEl.querySelector("p");
              if (heading) heading.style.display = "none";
              if (sub) sub.style.display = "none";
            }
            scanSendBtn.style.display = "none";
            if (leadSuccess) leadSuccess.classList.add("show");
          } else if (leadError) {
            leadError.classList.add("show");
          }
        });
      });
    }

    scanShow(scanOrder[0]);
    scanUpdateProgress();
  }

  /* ---------- Looptijd slider (.ls, diensten.html) ---------- */
  var lsRange = document.getElementById("ls-r");
  if (lsRange) {
    var lsScale = [
      ["1 dag", "adhoc"], ["1 week", "adhoc"], ["2 weken", "adhoc"],
      ["1 maand", "project"], ["2 maanden", "project"], ["3 maanden", "project"],
      ["6 maanden", "struct"], ["9 maanden", "struct"], ["12 maanden", "struct"],
      ["18 maanden", "struct"], ["24 maanden", "struct"],
    ];
    var lsValue = document.getElementById("ls-v");
    var lsTiles = document.querySelectorAll(".ls .t");
    var lsCurrentLabel = lsScale[6][0];

    function lsUpdate() {
      var entry = lsScale[+lsRange.value];
      lsCurrentLabel = entry[0];
      if (lsValue) lsValue.textContent = entry[0];
      lsRange.style.setProperty("--p", (lsRange.value / 10) * 100 + "%");
      lsTiles.forEach(function (t) {
        t.classList.toggle("on", t.getAttribute("data-k") === entry[1]);
      });
    }
    lsRange.addEventListener("input", lsUpdate);
    lsUpdate();

    var lsSendBtn = document.getElementById("ls-send");
    if (lsSendBtn) {
      lsSendBtn.addEventListener("click", function () {
        var nameEl = document.getElementById("ls-name");
        var emailEl = document.getElementById("ls-email");
        var websiteEl = document.getElementById("ls-website");
        var leadError = document.getElementById("ls-lead-error");
        var leadSuccess = document.getElementById("ls-lead-success");
        var name = nameEl ? nameEl.value.trim() : "";
        var email = emailEl ? emailEl.value.trim() : "";
        if (leadError) leadError.classList.remove("show");
        if (!name || !email) {
          if (leadError) leadError.classList.add("show");
          return;
        }
        lsSendBtn.disabled = true;
        mfSendLead({
          source: "looptijd-slider",
          name: name,
          email: email,
          website: websiteEl ? websiteEl.value : "",
          details: [["Gewenste looptijd", lsCurrentLabel]],
        }).then(function (ok) {
          lsSendBtn.disabled = false;
          if (ok) {
            var leadFormEl = document.getElementById("ls-lead-form");
            if (leadFormEl) {
              var heading = leadFormEl.querySelector("h3");
              var sub = leadFormEl.querySelector("p");
              var row = leadFormEl.querySelector(".form-row");
              if (heading) heading.style.display = "none";
              if (sub) sub.style.display = "none";
              if (row) row.style.display = "none";
            }
            lsSendBtn.style.display = "none";
            if (leadSuccess) leadSuccess.classList.add("show");
          } else if (leadError) {
            leadError.classList.add("show");
          }
        });
      });
    }
  }

  /* ---------- Contact forms ---------- */
  document.querySelectorAll(".intake-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = form.querySelector(".form-success");
      var error = form.querySelector(".form-error");
      var submitBtn = form.querySelector('button[type="submit"]');
      if (error) error.classList.remove("show");

      var data = new FormData(form);
      var payload = {
        source: form.getAttribute("data-source") || "contact",
        name: data.get("name") || "",
        email: data.get("email") || "",
        company: data.get("company") || "",
        phone: data.get("phone") || "",
        message: data.get("message") || "",
        website: data.get("website") || "",
        details: [],
      };
      ["ervaring", "specialisatie", "beschikbaarheid", "type"].forEach(function (key) {
        var val = data.get(key);
        if (val) payload.details.push([key, val]);
      });

      if (submitBtn) submitBtn.disabled = true;
      mfSendLead(payload).then(function (ok) {
        if (submitBtn) submitBtn.disabled = false;
        if (ok) {
          if (success) {
            success.classList.add("show");
            success.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          form.reset();
        } else if (error) {
          error.classList.add("show");
          error.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
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
        var wizardWebsite = document.getElementById("w-website");
        var wizardError = document.getElementById("wizard-error");
        if (wizardError) wizardError.classList.remove("show");

        var details = [];
        ["1", "2", "3", "4"].forEach(function (k) {
          if (wizardAnswers[k]) details.push([k, wizardAnswers[k].label]);
        });

        wizardNext.disabled = true;
        mfSendLead({
          source: "contact-bedrijven",
          name: wizardAnswers.contact.name,
          company: wizardAnswers.contact.company,
          email: wizardAnswers.contact.email,
          phone: wizardAnswers.contact.phone,
          website: wizardWebsite ? wizardWebsite.value : "",
          details: details,
        }).then(function (ok) {
          wizardNext.disabled = false;
          if (ok) {
            wizardBuildSummary();
            wizardShow("success");
            wizardNav.style.display = "none";
          } else if (wizardError) {
            wizardError.classList.add("show");
          }
        });
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

  /* ---------- Consultant-aanmeldformulier (multi-step, met cv-upload) ----------
     Gebruikt op contact.html (consultants-paneel) en aanmelden-consultants.html.
     Verstuurt als multipart/form-data (nodig voor de optionele cv-bijlage),
     rechtstreeks naar send-lead.php. */
  var afForm = document.querySelector(".af-wizard");
  if (afForm) {
    var afSteps = Array.prototype.slice.call(afForm.querySelectorAll(".wizard-step"));
    var afOrder = ["1", "2", "3"];
    var afIndex = 0;
    var afStepNames = { "1": "Over jou", "2": "Je expertise", "3": "Beschikbaarheid" };
    var afPrev = document.getElementById("af-prev");
    var afNext = document.getElementById("af-next");
    var afNav = document.getElementById("af-nav");
    var afProgressFill = document.getElementById("af-progress-fill");
    var afStepNum = document.getElementById("af-step-num");
    var afStepName = document.getElementById("af-step-name");

    function afShow(stepKey) {
      afSteps.forEach(function (el) {
        el.classList.toggle("active", el.getAttribute("data-step") === stepKey);
      });
    }

    function afUpdateProgress() {
      afProgressFill.style.width = ((afIndex + 1) / afOrder.length) * 100 + "%";
      afStepNum.textContent = afIndex + 1;
      afStepName.textContent = afStepNames[afOrder[afIndex]];
      afPrev.style.visibility = afIndex === 0 ? "hidden" : "visible";
      afNext.textContent = afIndex === afOrder.length - 1 ? "Verstuur aanmelding" : "Volgende";
    }

    function afValidateStep(stepKey) {
      var stepEl = afForm.querySelector('.wizard-step[data-step="' + stepKey + '"]');
      var ok = true;
      stepEl.querySelectorAll("[required]").forEach(function (el) {
        var good = el.type === "checkbox" ? el.checked : el.checkValidity() && el.value.trim() !== "";
        var wrap = el.closest(".field") || el.closest(".af-check");
        if (wrap) wrap.classList.toggle("af-field-bad", !good);
        if (!good) ok = false;
      });
      var msg = "";
      if (stepKey === "2" && !stepEl.querySelector('[name="profiel[]"]:checked')) {
        ok = false;
        msg = "Kies minstens één profiel.";
      }
      if (!ok && !msg) {
        var consent = stepEl.querySelector('[name="toestemming"]');
        msg = stepKey === "3" && consent && !consent.checked
          ? "Vink de toestemming aan om te versturen."
          : "Vul de gemarkeerde velden correct in.";
      }
      var msgEl = document.getElementById("af-msg-" + stepKey);
      if (msgEl) msgEl.textContent = msg;
      return ok;
    }

    function afSendLead(form) {
      return fetch(form.getAttribute("action") || "send-lead.php", {
        method: "POST",
        body: new FormData(form),
      })
        .then(function (res) { return res.json().catch(function () { return { success: false }; }); })
        .then(function (data) { return !!data.success; })
        .catch(function () { return false; });
    }

    afNext.addEventListener("click", function () {
      var stepKey = afOrder[afIndex];
      if (!afValidateStep(stepKey)) return;
      if (afIndex < afOrder.length - 1) {
        afIndex++;
        afShow(afOrder[afIndex]);
        afUpdateProgress();
        return;
      }
      afNext.disabled = true;
      afNext.textContent = "Versturen…";
      afSendLead(afForm).then(function (ok) {
        if (ok) {
          afShow("success");
          if (afNav) afNav.style.display = "none";
        } else {
          afNext.disabled = false;
          afNext.textContent = "Verstuur aanmelding";
          var msgEl = document.getElementById("af-msg-3");
          if (msgEl) msgEl.textContent = "Versturen lukte niet. Probeer opnieuw of mail naar info@mainfold.be.";
        }
      });
    });

    afPrev.addEventListener("click", function () {
      if (afIndex === 0) return;
      afIndex--;
      afShow(afOrder[afIndex]);
      afUpdateProgress();
    });

    var afCv = document.getElementById("af-cv");
    if (afCv) {
      afCv.addEventListener("change", function (e) {
        var file = e.target.files[0];
        var nameEl = document.getElementById("af-cv-name");
        if (!file || !nameEl) return;
        if (file.size > 10 * 1024 * 1024) {
          e.target.value = "";
          nameEl.textContent = "Bestand te groot (max. 10 MB)";
          return;
        }
        nameEl.textContent = file.name;
      });
    }

    // Met JS verloopt versturen via de "Volgende"/"Verstuur aanmelding"-knop
    // hierboven; dit vangt enkel de no-JS fallback-submitknop af zodat die
    // niet dubbel verstuurt wanneer JS toch actief is.
    afForm.addEventListener("submit", function (e) {
      if (document.documentElement.classList.contains("js")) e.preventDefault();
    });

    afUpdateProgress();
  }

  /* ---------- Year in footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
