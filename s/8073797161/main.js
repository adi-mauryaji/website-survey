/* Abgleich – small progressive enhancements. The page works without this file. */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        nav.setAttribute("data-open", "");
      } else {
        nav.removeAttribute("data-open");
      }
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    var desktop = window.matchMedia("(min-width: 64rem)");
    var onChange = function (mq) {
      if (mq.matches) setOpen(false);
    };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  /* ---------- Price calculator ---------- */
  var PRICE = { base: 290, included: 5, perExtra: 40, min: 1, max: 999 };
  var eur = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  var usersInput = document.getElementById("users");
  if (usersInput) {
    var extraLabel = document.querySelector("[data-extra-label]");
    var extraSum = document.querySelector("[data-extra-sum]");
    var total = document.querySelector("[data-total]");
    var year = document.querySelector("[data-year]");

    var clamp = function (n) {
      return Math.min(PRICE.max, Math.max(PRICE.min, n));
    };

    var render = function (users) {
      var extra = Math.max(0, users - PRICE.included);
      var monthly = PRICE.base + extra * PRICE.perExtra;
      var perExtra = eur.format(PRICE.perExtra);

      if (extra === 0) {
        extraLabel.textContent = "Keine weiteren Nutzer";
      } else if (extra === 1) {
        extraLabel.textContent = "1 weiterer Nutzer × " + perExtra;
      } else {
        extraLabel.textContent = extra + " weitere Nutzer × " + perExtra;
      }
      extraSum.textContent = eur.format(extra * PRICE.perExtra);
      total.textContent = eur.format(monthly);
      year.textContent = eur.format(monthly * 12);
    };

    var readInput = function () {
      var n = parseInt(usersInput.value, 10);
      return isNaN(n) ? null : n;
    };

    usersInput.addEventListener("input", function () {
      var n = readInput();
      if (n !== null) render(clamp(n));
    });

    usersInput.addEventListener("change", function () {
      var n = readInput();
      n = clamp(n === null ? PRICE.included : n);
      usersInput.value = n;
      render(n);
    });

    document.querySelectorAll(".stepper-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var n = readInput();
        n = clamp((n === null ? PRICE.included : n) + Number(btn.getAttribute("data-step")));
        usersInput.value = n;
        render(n);
      });
    });

    render(clamp(readInput() || 8));
  }

  /* ---------- Forms ----------
     Set data-endpoint on a form to POST to a real backend (FormData).
     While it is empty, the form opens a pre-filled e-mail to data-mailto. */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var showError = function (field, show) {
    var errId = field.getAttribute("aria-describedby");
    var err = errId ? document.getElementById(errId) : null;
    if (show) {
      field.setAttribute("aria-invalid", "true");
      if (err) err.textContent = err.getAttribute("data-msg") || "Bitte prüfen Sie diese Angabe.";
    } else {
      field.removeAttribute("aria-invalid");
      if (err) err.textContent = "";
    }
  };

  var isValid = function (field) {
    var value = field.value.trim();
    if (field.required && !value) return false;
    if (field.type === "email" && value && !EMAIL_RE.test(value)) return false;
    return true;
  };

  var setStatus = function (form, text, kind) {
    var status = form.querySelector(".form-status");
    if (!status) return;
    status.className = "form-status" + (kind ? " is-" + kind : "");
    status.textContent = text;
  };

  var buildMailto = function (form) {
    var lines = [];
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === "submit") return;
      var v = el.value.trim();
      if (v) lines.push(el.name + ": " + v);
    });
    return (
      "mailto:" + form.getAttribute("data-mailto") +
      "?subject=" + encodeURIComponent(form.getAttribute("data-subject") || "Anfrage") +
      "&body=" + encodeURIComponent(lines.join("\r\n"))
    );
  };

  document.querySelectorAll(".js-form").forEach(function (form) {
    form.setAttribute("novalidate", "");
    var fields = form.querySelectorAll("input[required], textarea[required]");

    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        if (field.value.trim()) showError(field, !isValid(field));
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true" && isValid(field)) showError(field, false);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setStatus(form, "", null);

      var firstInvalid = null;
      fields.forEach(function (field) {
        var ok = isValid(field);
        showError(field, !ok);
        if (!ok && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        setStatus(form, "Bitte prüfen Sie die markierten Felder.", "error");
        firstInvalid.focus();
        return;
      }

      var endpoint = form.getAttribute("data-endpoint");
      var button = form.querySelector("[type=submit]");

      if (endpoint && window.fetch) {
        button.disabled = true;
        fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
          .then(function (res) {
            if (!res.ok) throw new Error(String(res.status));
            form.reset();
            setStatus(form, "Vielen Dank. Wir haben Ihre Anfrage erhalten und melden uns per E-Mail.", "success");
          })
          .catch(function () {
            setStatus(form, "Das Senden hat leider nicht geklappt. Bitte schreiben Sie uns an " + form.getAttribute("data-mailto") + ".", "error");
          })
          .then(function () {
            button.disabled = false;
          });
        return;
      }

      window.location.href = buildMailto(form);
      setStatus(form, form.getAttribute("data-success"), "success");
    });
  });
})();
