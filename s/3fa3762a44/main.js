/* Breathing light and booking form. No dependencies. */
(function () {
  "use strict";

  /* ---------------- Breathing light ---------------- */
  var root = document.querySelector("[data-breath]");
  if (root) {
    var stage = root.querySelector("[data-breath-stage]");
    var cue = root.querySelector("[data-breath-cue]");
    var seconds = root.querySelector("[data-breath-seconds]");
    var toggle = root.querySelector("[data-breath-toggle]");
    var status = root.querySelector("[data-breath-status]");
    var live = root.querySelector("[data-breath-live]");
    var langInputs = root.querySelectorAll('input[name="cue-lang"]');

    var IN_MS = 4000;
    var OUT_MS = 6000;
    var BREATHS = 6;
    var SETTLE_MS = 1500;

    var WORDS = {
      en: { idle: "Breathe", "in": "Breathe in", out: "Breathe out" },
      hi: { idle: "साँस", "in": "साँस लीजिए", out: "साँस छोड़िए" },
      mr: { idle: "श्वास", "in": "श्वास घ्या", out: "श्वास सोडा" }
    };

    var lang = "en";
    var phase = "idle";
    var breath = 0;
    var phaseTimer = null;
    var tickTimer = null;

    function showWords(key) {
      cue.textContent = WORDS[lang][key];
      cue.setAttribute("lang", lang);
    }

    function announce(key) {
      live.setAttribute("lang", lang);
      live.textContent = WORDS[lang][key];
    }

    function countdown(total) {
      clearInterval(tickTimer);
      var left = total;
      seconds.textContent = String(left);
      tickTimer = setInterval(function () {
        left -= 1;
        if (left > 0) seconds.textContent = String(left);
      }, 1000);
    }

    function runPhase(next) {
      phase = next;
      var ms = next === "in" ? IN_MS : OUT_MS;
      stage.style.setProperty("--dur", ms + "ms");
      stage.classList.toggle("is-in", next === "in");
      showWords(next);
      announce(next);
      countdown(ms / 1000);

      if (next === "in") {
        breath += 1;
        status.textContent = "Breath " + breath + " of " + BREATHS;
      }

      phaseTimer = setTimeout(function () {
        if (next === "in") {
          runPhase("out");
        } else if (breath < BREATHS) {
          runPhase("in");
        } else {
          finish();
        }
      }, ms);
    }

    function reset() {
      clearTimeout(phaseTimer);
      clearInterval(tickTimer);
      phase = "idle";
      breath = 0;
      stage.style.setProperty("--dur", SETTLE_MS + "ms");
      stage.classList.remove("is-in", "is-running");
      seconds.textContent = "";
      showWords("idle");
      toggle.textContent = "Start breathing";
      toggle.setAttribute("aria-pressed", "false");
    }

    function start() {
      reset();
      stage.classList.add("is-running");
      toggle.textContent = "Stop";
      toggle.setAttribute("aria-pressed", "true");
      runPhase("in");
    }

    function stop() {
      reset();
      status.textContent = "Stopped. Start again whenever you like.";
    }

    function finish() {
      reset();
      status.textContent = "That was a minute. Read on whenever you’re ready.";
      live.textContent = status.textContent;
    }

    toggle.addEventListener("click", function () {
      if (phase === "idle") start();
      else stop();
    });

    Array.prototype.forEach.call(langInputs, function (input) {
      input.addEventListener("change", function () {
        if (!input.checked) return;
        lang = input.value;
        showWords(phase);
      });
    });

    // Pause if the visitor switches away, so the count never runs unseen.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && phase !== "idle") stop();
    });
  }

  /* ---------------- Booking form ---------------- */
  var form = document.querySelector("[data-booking]");
  if (form) {
    var sent = document.querySelector("[data-booking-sent]");
    var sentTitle = document.querySelector("[data-sent-title]");
    var sentText = document.querySelector("[data-sent-text]");
    var formStatus = form.querySelector("[data-form-status]");
    var submit = form.querySelector('button[type="submit"]');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var rules = [
      {
        input: form.elements.name,
        check: function (v) {
          return v ? "" : "Enter your name so I know what to call you.";
        }
      },
      {
        input: form.elements.email,
        check: function (v) {
          if (!v) return "Enter your email address so I can reply.";
          if (!EMAIL_RE.test(v)) return "Check your email address. It should look like name@example.com.";
          return "";
        }
      }
    ];

    function setError(input, message) {
      var el = document.getElementById(input.id + "-error");
      if (message) {
        input.setAttribute("aria-invalid", "true");
        el.textContent = message;
        el.hidden = false;
      } else {
        input.removeAttribute("aria-invalid");
        el.textContent = "";
        el.hidden = true;
      }
    }

    function validate() {
      var firstBad = null;
      rules.forEach(function (rule) {
        var message = rule.check(rule.input.value.trim());
        setError(rule.input, message);
        if (message && !firstBad) firstBad = rule.input;
      });
      return firstBad;
    }

    // Clear an error as soon as the field becomes valid.
    rules.forEach(function (rule) {
      rule.input.addEventListener("input", function () {
        if (rule.input.getAttribute("aria-invalid") === "true" && !rule.check(rule.input.value.trim())) {
          setError(rule.input, "");
        }
      });
    });

    function showSent() {
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      sentTitle.textContent = "Booking request sent";
      sentText.textContent =
        "Thank you, " + name + ". I’ll reply to " + email +
        " within 2 working days. If you don’t see my email, please check your spam folder.";
      form.hidden = true;
      sent.hidden = false;
      sentTitle.focus();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      formStatus.hidden = true;

      var firstBad = validate();
      if (firstBad) {
        firstBad.focus();
        return;
      }

      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        // No form service connected yet (see the comment in index.html).
        showSent();
        return;
      }

      submit.disabled = true;
      submit.textContent = "Sending…";
      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          showSent();
        })
        .catch(function () {
          formStatus.textContent =
            "Your request didn’t send. Check your internet connection and try again.";
          formStatus.hidden = false;
        })
        .then(function () {
          submit.disabled = false;
          submit.textContent = "Send booking request";
        });
    });
  }
})();
