/* CSM survey: conditional Citizen's Charter logic, validation, submit/confirm flow.
   No backend exists yet -- responses are kept in localStorage as a placeholder
   so the flow is demonstrable end to end. Swap submitSurvey() for a real
   API call when the backend is ready. */
(function () {
  "use strict";

  var form = document.getElementById("csm-form");
  if (!form) return;

  function t(key) {
    return window.DMW_I18N ? window.DMW_I18N.t(key) : key;
  }

  var alertBox = document.getElementById("form-alert");
  var alertRestText = document.getElementById("alert-rest-text");
  var cc2Block = document.getElementById("cc2-block");
  var cc3Block = document.getElementById("cc3-block");
  var cc3ReasonBlock = document.getElementById("cc3-reason-block");
  var formShell = document.getElementById("form-shell");
  var confirmPanel = document.getElementById("confirm-panel");

  function radioValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function toggle(el, show) {
    if (!el) return;
    el.hidden = !show;
    el.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.disabled = !show;
    });
  }

  function updateConditionals() {
    var cc1 = radioValue("cc1");
    var showCc2 = cc1 === "1" || cc1 === "2";
    toggle(cc2Block, showCc2);
    if (!showCc2) {
      form.querySelectorAll('input[name="cc2"]').forEach(function (i) { i.checked = false; });
    }

    var cc2 = showCc2 ? radioValue("cc2") : null;
    var showCc3 = showCc2 && (cc2 === "1" || cc2 === "2");
    toggle(cc3Block, showCc3);
    if (!showCc3) {
      form.querySelectorAll('input[name="cc3"]').forEach(function (i) { i.checked = false; });
    }

    var cc3 = showCc3 ? radioValue("cc3") : null;
    var showReason = showCc3 && cc3 === "2";
    toggle(cc3ReasonBlock, showReason);
    if (!showReason) {
      var reasonInput = document.getElementById("cc3Reason");
      if (reasonInput) reasonInput.value = "";
    }
  }

  form.addEventListener("change", function (evt) {
    if (["cc1", "cc2", "cc3"].indexOf(evt.target.name) !== -1) {
      updateConditionals();
    }
  });

  function setFieldError(containerId, message, invalid) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var errorEl = container.querySelector(".field-error");
    if (invalid) {
      container.classList.add("has-error");
      if (errorEl) errorEl.textContent = message;
      container.querySelectorAll("input, select, textarea").forEach(function (i) {
        i.setAttribute("aria-invalid", "true");
      });
    } else {
      container.classList.remove("has-error");
      container.querySelectorAll("input, select, textarea").forEach(function (i) {
        i.removeAttribute("aria-invalid");
      });
    }
  }

  function isVisible(el) {
    return !!el && !el.hidden && el.offsetParent !== null;
  }

  function jumpToField(containerEl, focusTarget) {
    var focusable = focusTarget && focusTarget.matches && focusTarget.matches("input, select, textarea")
      ? focusTarget
      : containerEl.querySelector("input, select, textarea");
    containerEl.scrollIntoView({ block: "center", behavior: "auto" });
    if (focusable) focusable.focus();
  }

  var alertList = document.getElementById("alert-list");

  function validate() {
    var firstInvalid = null;
    var invalidItems = [];

    function check(containerId, ok, message, label, focusTarget) {
      setFieldError(containerId, message, !ok);
      if (!ok) {
        var containerEl = document.getElementById(containerId);
        if (!firstInvalid) firstInvalid = { el: containerEl, focusTarget: focusTarget };
        invalidItems.push({ id: containerId, label: label, el: containerEl, focusTarget: focusTarget });
      }
    }

    var age = document.getElementById("age");
    var ageValue = Number(age.value);
    check("field-age", age.value.trim() !== "" && ageValue > 0 && ageValue < 120,
      t("msg_age"), t("lbl_age"), age);

    var sex = document.getElementById("sex");
    check("field-sex", sex.value !== "", t("msg_select_option"), t("lbl_sex"), sex);

    var region = document.getElementById("region");
    check("field-region", region.value !== "", t("msg_region"), t("lbl_region"), region);

    var service = document.getElementById("service");
    check("field-service", service.value !== "", t("msg_service"), t("lbl_service"), service);

    check("field-customer-type", !!radioValue("customerType"), t("msg_customer_type"), t("lbl_customer_type"));

    check("field-cc1", !!radioValue("cc1"), t("msg_cc1"), t("lbl_cc1"));

    if (isVisible(cc2Block)) {
      check("field-cc2", !!radioValue("cc2"), t("msg_cc2"), t("lbl_cc2"));
    }
    if (isVisible(cc3Block)) {
      check("field-cc3", !!radioValue("cc3"), t("msg_cc3"), t("lbl_cc3"));
    }
    if (isVisible(cc3ReasonBlock)) {
      var reason = document.getElementById("cc3Reason");
      check("field-cc3-reason", reason.value.trim() !== "", t("msg_cc3_reason"), t("lbl_cc3_reason"), reason);
    }

    for (var i = 1; i <= 8; i++) {
      check("field-sqd" + i, !!radioValue("sqd" + i), t("msg_sqd"), "SQD" + i);
    }

    if (invalidItems.length > 0) {
      alertBox.hidden = false;
      alertBox.querySelector("[data-alert-count]").textContent = invalidItems.length;
      if (alertRestText) alertRestText.textContent = t("alert_rest");

      alertList.innerHTML = "";
      invalidItems.forEach(function (item) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = item.label;
        btn.addEventListener("click", function () {
          jumpToField(item.el, item.focusTarget);
        });
        li.appendChild(btn);
        alertList.appendChild(li);
      });

      if (firstInvalid) jumpToField(firstInvalid.el, firstInvalid.focusTarget);
      return false;
    }

    alertBox.hidden = true;
    alertList.innerHTML = "";
    return true;
  }

  function buildPayload() {
    var data = new FormData(form);
    var payload = {};
    data.forEach(function (value, key) { payload[key] = value; });
    payload.submittedAt = new Date().toISOString();
    return payload;
  }

  function makeReference() {
    var stamp = Date.now().toString(36).toUpperCase();
    var rand = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
    return "CSM-" + stamp + rand;
  }

  function submitSurvey(payload) {
    // Placeholder persistence until a real backend endpoint exists.
    try {
      var key = "dmw-csm-submissions";
      var existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(payload);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      /* storage unavailable; submission still "succeeds" for this demo flow */
    }
    return Promise.resolve({ ok: true });
  }

  form.addEventListener("submit", function (evt) {
    evt.preventDefault();
    if (!validate()) return;

    var submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = t("btn_submitting");

    var payload = buildPayload();
    submitSurvey(payload).then(function () {
      var ref = makeReference();
      formShell.hidden = true;
      confirmPanel.hidden = false;
      document.getElementById("confirm-ref").textContent = t("confirm_ref_prefix") + ref;
      var heading = confirmPanel.querySelector("h2");
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    });
  });

  document.addEventListener("langchange", function () {
    if (alertBox && !alertBox.hidden) validate();
  });

  document.addEventListener("DOMContentLoaded", updateConditionals);
  updateConditionals();
})();
