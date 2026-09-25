/* Tidepool landing page behaviour. Plain JavaScript, no dependencies. */
(function () {
  "use strict";

  /* Header: add a hairline once the page has scrolled ---------------------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  /* Mobile navigation ------------------------------------------------------ */
  var menuButton = document.querySelector("[data-menu-button]");
  var nav = menuButton && menuButton.closest("nav");
  if (menuButton && nav) {
    var isMenuOpen = function () {
      return menuButton.getAttribute("aria-expanded") === "true";
    };
    var setMenuOpen = function (open) {
      menuButton.setAttribute("aria-expanded", String(open));
    };

    menuButton.addEventListener("click", function () {
      setMenuOpen(!isMenuOpen());
    });

    // Choosing a destination closes the menu so the section is not covered.
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenuOpen(false);
    });

    document.addEventListener("click", function (event) {
      if (isMenuOpen() && !nav.contains(event.target)) setMenuOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isMenuOpen()) {
        setMenuOpen(false);
        menuButton.focus();
      }
    });

    // The links are always shown on wide screens, so reset the toggle there.
    var wide = window.matchMedia("(min-width: 768px)");
    var resetMenu = function () {
      if (wide.matches) setMenuOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener("change", resetMenu);
    else wide.addListener(resetMenu);
  }

  /* Pricing: monthly / yearly billing -------------------------------------- */
  var billingToggle = document.querySelector("[data-billing-toggle]");
  if (billingToggle) {
    var prices = document.querySelectorAll("[data-price]");
    var notes = document.querySelectorAll("[data-note-monthly]");
    var billingStatus = document.querySelector("[data-billing-status]");
    var MONTHS_BILLED_PER_YEAR = 10; // Yearly billing: two months free.

    var renderPrices = function (yearly) {
      billingToggle.setAttribute("aria-checked", String(yearly));

      prices.forEach(function (price) {
        var monthly = Number(price.getAttribute("data-price"));
        var amount = yearly ? monthly * MONTHS_BILLED_PER_YEAR : monthly;
        price.querySelector("[data-price-amount]").textContent = "$" + amount;
        price.querySelector("[data-price-period]").textContent = yearly ? "/yr" : "/mo";
      });

      notes.forEach(function (note) {
        note.textContent = note.getAttribute(yearly ? "data-note-yearly" : "data-note-monthly");
      });

      if (billingStatus) {
        billingStatus.textContent = yearly ? "Showing yearly prices." : "Showing monthly prices.";
      }
    };

    billingToggle.addEventListener("click", function () {
      renderPrices(billingToggle.getAttribute("aria-checked") !== "true");
    });
  }

  /* FAQ disclosure buttons ---------------------------------------------------- */
  document.querySelectorAll("[data-faq-button]").forEach(function (button) {
    var answer = document.getElementById(button.getAttribute("aria-controls"));
    if (!answer) return;

    button.addEventListener("click", function () {
      var expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      answer.hidden = expanded;
    });
  });

  /* "Get the app" dialog ------------------------------------------------------ */
  var dialog = document.getElementById("get-app");
  if (dialog && typeof dialog.showModal === "function") {
    var opener = null;

    document.querySelectorAll("[data-get-app]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        opener = trigger;
        if (!dialog.open) dialog.showModal();
      });
    });

    // Close on the close button, on a download link, or on the backdrop.
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("[data-dialog-close], a")) {
        dialog.close();
      }
    });

    // Safari does not focus buttons on click, so return focus explicitly.
    dialog.addEventListener("close", function () {
      if (opener) opener.focus();
    });
  }
})();
