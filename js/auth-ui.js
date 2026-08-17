/* ============================================================
   EYESON — AUTH FORM UX
   Six-digit manual/paste/autofill OTP entry. Every code is verified by the
   server; browser autofill only fills the visual inputs.
   ============================================================ */

(function () {
  "use strict";

  var OTP_LENGTH = 6;

  function safeNext() {
    var next = new URLSearchParams(window.location.search).get("next");
    return next === "checkout.html" ? "checkout.html" : "account.html";
  }

  function redirectAfterAuth() {
    window.location.href = safeNext();
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    button.classList.toggle("btn-loading", busy);
    if (label) button.textContent = label;
  }

  function initOtpInputs(box, onComplete) {
    var inputs = Array.prototype.slice.call(box.querySelectorAll(".otp-input"));
    var handling = false;
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;

    function code() {
      return inputs.map(function (input) { return input.value; }).join("");
    }

    function updateFilled() {
      inputs.forEach(function (input) { input.classList.toggle("filled", Boolean(input.value)); });
    }

    function focus(index) {
      var input = inputs[Math.min(Math.max(index, 0), inputs.length - 1)];
      if (input) input.focus();
    }

    function fill(value) {
      var digits = String(value || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
      inputs.forEach(function (input, index) { input.value = digits[index] || ""; });
      updateFilled();
      focus(Math.min(digits.length, OTP_LENGTH - 1));
      if (digits.length === OTP_LENGTH) complete();
    }

    function complete() {
      if (handling || code().length !== OTP_LENGTH) return;
      handling = true;
      Promise.resolve(onComplete(code())).finally(function () { handling = false; });
    }

    inputs.forEach(function (input, index) {
      input.addEventListener("input", function () {
        var digits = input.value.replace(/\D/g, "");
        if (digits.length > 1) return fill(digits);
        input.value = digits;
        updateFilled();
        if (digits && index < OTP_LENGTH - 1) focus(index + 1);
        if (code().length === OTP_LENGTH) complete();
      });

      input.addEventListener("keydown", function (event) {
        if (event.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].value = "";
          updateFilled();
          focus(index - 1);
        }
        if (event.key === "Enter") {
          event.preventDefault();
          complete();
        }
      });

      input.addEventListener("paste", function (event) {
        event.preventDefault();
        fill((event.clipboardData || window.clipboardData).getData("text"));
      });
    });

    /* WebOTP is available mainly for SMS. Email clients that support OTP
       autofill use autocomplete="one-time-code" on the first input. */
    if (navigator.credentials && window.OTPCredential && controller) {
      navigator.credentials.get({ otp: { transport: ["sms"] }, signal: controller.signal })
        .then(function (credential) { if (credential && credential.code) fill(credential.code); })
        .catch(function () { /* Manual entry is always available. */ });
    }

    return {
      clear: function () { fill(""); },
      code: code,
      focus: function () { focus(0); },
      cancel: function () { if (controller) controller.abort(); },
    };
  }

  function startCooldown(button, onResend) {
    var seconds = 60;
    button.disabled = true;
    button.textContent = "Resend in " + seconds + "s";
    var timer = window.setInterval(function () {
      seconds -= 1;
      button.textContent = seconds > 0 ? "Resend in " + seconds + "s" : "Resend Code";
      if (seconds <= 0) {
        window.clearInterval(timer);
        button.disabled = false;
      }
    }, 1000);
    button.onclick = function () {
      if (button.disabled) return;
      button.disabled = true;
      onResend().then(function (result) {
        if (!result.ok) {
          button.disabled = false;
          toast(result.error);
          return;
        }
        startCooldown(button, onResend);
      });
    };
  }

  function initRegister() {
    var form = document.getElementById("regDetailsForm");
    if (!form) return;
    var details = document.getElementById("regStep1");
    var verify = document.getElementById("regStep2");
    var error = document.getElementById("regOtpError");
    var submit = document.getElementById("regSendBtn");
    var pending = null;
    var otp = initOtpInputs(document.getElementById("regOtpBox"), verifyCode);
    var loginLink = document.getElementById("loginLink");
    if (loginLink && safeNext() === "checkout.html") loginLink.href = "login.html?next=checkout.html";

    function showVerify() {
      details.style.display = "none";
      verify.style.display = "block";
      document.getElementById("regEmailDisplay").textContent = pending.email;
      startCooldown(document.getElementById("regResend"), function () { return EyesonAuth.resendSignup(pending.email); });
      otp.focus();
    }

    function verifyCode(code) {
      error.textContent = "";
      setBusy(document.getElementById("regVerifyBtn"), true, "Verifying…");
      return EyesonAuth.verifySignup(pending.email, code, document.getElementById("regRemember").checked).then(function (result) {
        setBusy(document.getElementById("regVerifyBtn"), false, "Verify & Create Account");
        if (!result.ok) {
          error.textContent = result.error;
          otp.clear();
          otp.focus();
          return result;
        }
        toast("Account verified — welcome to EYESON");
        redirectAfterAuth();
        return result;
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      pending = {
        username: document.getElementById("regUsername").value.trim(),
        displayName: document.getElementById("regName").value.trim(),
        email: document.getElementById("regEmail").value.trim(),
        password: document.getElementById("regPassword").value,
        confirmPassword: document.getElementById("regConfirmPassword").value,
      };
      setBusy(submit, true, "Creating account…");
      EyesonAuth.signup(pending).then(function (result) {
        setBusy(submit, false, "Create Account & Send Code");
        if (!result.ok) return toast(result.error);
        showVerify();
      });
    });

    document.getElementById("regVerifyBtn").addEventListener("click", function () { verifyCode(otp.code()); });
    document.getElementById("regBack").addEventListener("click", function () {
      verify.style.display = "none";
      details.style.display = "block";
      error.textContent = "";
      otp.clear();
      otp.cancel();
    });
  }

  function initLogin() {
    var loginForm = document.getElementById("loginForm");
    if (!loginForm) return;
    var loginStep = document.getElementById("loginStep");
    var resetRequest = document.getElementById("resetRequestStep");
    var resetVerify = document.getElementById("resetVerifyStep");
    var resetPassword = document.getElementById("resetPasswordStep");
    var pendingIdentifier = "";
    var resetError = document.getElementById("resetOtpError");
    var resetOtp = initOtpInputs(document.getElementById("resetOtpBox"), verifyReset);
    var registerLink = document.getElementById("registerLink");
    if (registerLink && safeNext() === "checkout.html") registerLink.href = "register.html?next=checkout.html";

    function show(step) {
      [loginStep, resetRequest, resetVerify, resetPassword].forEach(function (element) { element.style.display = "none"; });
      step.style.display = "block";
    }

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var button = document.getElementById("loginBtn");
      setBusy(button, true, "Signing in…");
      EyesonAuth.login(
        document.getElementById("loginIdentifier").value.trim(),
        document.getElementById("loginPassword").value,
        document.getElementById("loginRemember").checked
      ).then(function (result) {
        setBusy(button, false, "Sign In");
        if (!result.ok) return toast(result.error);
        redirectAfterAuth();
      });
    });

    document.getElementById("forgotPassword").addEventListener("click", function () { show(resetRequest); });
    document.getElementById("resetBack").addEventListener("click", function () { show(loginStep); });
    document.getElementById("resetRequestForm").addEventListener("submit", function (event) {
      event.preventDefault();
      pendingIdentifier = document.getElementById("resetIdentifier").value.trim();
      var button = document.getElementById("resetSendBtn");
      setBusy(button, true, "Sending code…");
      EyesonAuth.requestPasswordReset(pendingIdentifier).then(function (result) {
        setBusy(button, false, "Send Reset Code");
        if (!result.ok) return toast(result.error);
        document.getElementById("resetIdentifierDisplay").textContent = pendingIdentifier;
        show(resetVerify);
        startCooldown(document.getElementById("resetResend"), function () { return EyesonAuth.requestPasswordReset(pendingIdentifier); });
        resetOtp.focus();
      });
    });

    function verifyReset(code) {
      resetError.textContent = "";
      var button = document.getElementById("resetVerifyBtn");
      setBusy(button, true, "Verifying…");
      return EyesonAuth.verifyPasswordReset(pendingIdentifier, code).then(function (result) {
        setBusy(button, false, "Verify Code");
        if (!result.ok) {
          resetError.textContent = result.error;
          resetOtp.clear();
          resetOtp.focus();
          return result;
        }
        show(resetPassword);
        return result;
      });
    }

    document.getElementById("resetVerifyBtn").addEventListener("click", function () { verifyReset(resetOtp.code()); });
    document.getElementById("resetPasswordForm").addEventListener("submit", function (event) {
      event.preventDefault();
      var button = document.getElementById("resetPasswordBtn");
      setBusy(button, true, "Updating password…");
      EyesonAuth.completePasswordReset(
        document.getElementById("newPassword").value,
        document.getElementById("confirmNewPassword").value,
        document.getElementById("resetRemember").checked
      ).then(function (result) {
        setBusy(button, false, "Save New Password & Sign In");
        if (!result.ok) return toast(result.error);
        toast("Password updated. You are signed in.");
        redirectAfterAuth();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initRegister();
    initLogin();
    EyesonAuth.restoreSession().then(function (result) {
      if (result.ok && EyesonAuth.isLoggedIn()) redirectAfterAuth();
    });
  });
}());
