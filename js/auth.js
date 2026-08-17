/* ============================================================
   EYESON — SERVER-BACKED AUTH CLIENT

   No passwords, OTPs, refresh tokens, or access tokens are saved in
   localStorage. The server issues secure HTTP-only cookies instead.
   ============================================================ */

(function () {
  "use strict";

  var currentUser = null;
  var sessionRequest = null;
  var apiBase = (window.EYESON_AUTH_API_BASE || "").replace(/\/$/, "");

  function api(path, options) {
    var request = options || {};
    return fetch(apiBase + "/api/auth" + path, {
      method: request.method || "GET",
      credentials: "include",
      headers: request.body ? { "Content-Type": "application/json" } : undefined,
      body: request.body ? JSON.stringify(request.body) : undefined,
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) throw new Error(body.error || "Something went wrong. Please try again.");
        return body;
      });
    });
  }

  function setUser(user) {
    currentUser = user || null;
    window.dispatchEvent(new CustomEvent("eyesonauthchange", { detail: currentUser }));
    return currentUser;
  }

  function run(action) {
    return action().then(function (data) {
      if (data && Object.prototype.hasOwnProperty.call(data, "user")) setUser(data.user);
      return Object.assign({ ok: true }, data || {});
    }).catch(function (error) {
      return { ok: false, error: error.message || "Something went wrong. Please try again." };
    });
  }

  function restoreSession() {
    if (!sessionRequest) sessionRequest = run(function () { return api("/session"); });
    return sessionRequest;
  }

  window.EyesonAuth = {
    restoreSession: restoreSession,

    isLoggedIn: function () {
      return Boolean(currentUser && currentUser.loggedIn);
    },

    getUser: function () {
      return currentUser;
    },

    signup: function (details) {
      return run(function () { return api("/signup", { method: "POST", body: details }); });
    },

    resendSignup: function (email) {
      return run(function () { return api("/signup/resend", { method: "POST", body: { email: email } }); });
    },

    verifySignup: function (email, token, remember) {
      return run(function () {
        return api("/signup/verify", { method: "POST", body: { email: email, token: token, remember: remember } });
      });
    },

    login: function (identifier, password, remember) {
      return run(function () {
        return api("/login", { method: "POST", body: { identifier: identifier, password: password, remember: remember } });
      });
    },

    requestPasswordReset: function (identifier) {
      return run(function () {
        return api("/reset/request", { method: "POST", body: { identifier: identifier } });
      });
    },

    verifyPasswordReset: function (identifier, token) {
      return run(function () {
        return api("/reset/verify", { method: "POST", body: { identifier: identifier, token: token } });
      });
    },

    completePasswordReset: function (password, confirmPassword, remember) {
      return run(function () {
        return api("/reset/complete", {
          method: "POST",
          body: { password: password, confirmPassword: confirmPassword, remember: remember },
        });
      });
    },

    signOut: function () {
      return run(function () { return api("/logout", { method: "POST" }); }).then(function (result) {
        setUser(null);
        return result;
      });
    },
  };
}());
