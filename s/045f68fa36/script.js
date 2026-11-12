/* Text size control: three sizes, remembered on this device when storage allows. */
(function () {
  var KEY = "hartwell-text-size";
  var root = document.documentElement;
  var buttons = document.querySelectorAll(".textsize__btn");

  function current() {
    return root.getAttribute("data-text") || "1";
  }

  function apply(size) {
    if (size !== "2" && size !== "3") size = "1";
    if (size === "1") root.removeAttribute("data-text");
    else root.setAttribute("data-text", size);
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.setAttribute("aria-pressed", String(b.getAttribute("data-size") === size));
    }
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      var size = this.getAttribute("data-size");
      apply(size);
      try { window.localStorage.setItem(KEY, size); } catch (e) { /* not saved; still applied */ }
    });
  }

  apply(current());
})();
