/* 第一性原理人生地图 · 公共核心
 * 纯原生 JS，可在 file:// 协议下直接运行。
 */
(function () {
  "use strict";

  window.FP = window.FP || {};
  var FP = window.FP;
  FP.domains = FP.domains || {};

  /* ---------- 小工具 ---------- */

  FP.qs = function (name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  };

  FP.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /* el("div", {class:"x", onclick:fn}, [child, "text"]) */
  FP.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.indexOf("on") === 0 && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (k.indexOf("data-") === 0 || k === "aria-label" || k === "role") node.setAttribute(k, v);
      else node[k] = v;
    });
    (Array.isArray(children) ? children : children != null ? [children] : []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  };

  FP.list = function (items, cls) {
    return FP.el(
      "ul",
      { class: cls || "" },
      (items || []).map(function (t) {
        return FP.el("li", {}, t);
      })
    );
  };

  /* ---------- 目录查询 ---------- */

  FP.allMeta = function () {
    var out = [];
    if (!FP.catalog) return out;
    FP.catalog.groups.forEach(function (g, gi) {
      g.categories.forEach(function (c, ci) {
        c.domains.forEach(function (d) {
          out.push({
            id: d.id,
            name: d.name,
            group: g.name,
            groupId: g.id,
            groupIndex: gi,
            category: c.name,
            categoryId: c.id,
            categoryIndex: ci
          });
        });
      });
    });
    return out;
  };

  FP.findMeta = function (id) {
    var all = FP.allMeta();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        return { meta: all[i], prev: all[i - 1] || null, next: all[i + 1] || null, index: i, total: all.length };
      }
    }
    return null;
  };

  /* ---------- 脚本加载（替代 fetch，兼容 file://） ---------- */

  FP.loadScript = function (src, onload, onerror) {
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = onload;
    s.onerror = onerror || function () {};
    document.head.appendChild(s);
  };

  FP.basePath = function () {
    /* 页面都在根目录，直接用相对路径 */
    return "";
  };

  FP.loadDomain = function (id, cb) {
    if (FP.domains[id]) return cb(FP.domains[id]);
    FP.loadScript(
      FP.basePath() + "data/domains/" + encodeURIComponent(id) + ".js",
      function () {
        cb(FP.domains[id] || null);
      },
      function () {
        cb(null);
      }
    );
  };

  FP.loadAllDomains = function (cb) {
    var ids = FP.allMeta().map(function (m) {
      return m.id;
    });
    var left = ids.length;
    if (!left) return cb();
    ids.forEach(function (id) {
      FP.loadDomain(id, function () {
        left -= 1;
        if (left === 0) cb();
      });
    });
  };

  /* ---------- 本地存储 ---------- */

  var STORE_KEY = "fp.progress.v1";
  var THEME_KEY = "fp.theme";

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function writeStore(data) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {
      /* 隐私模式等情况下静默失败 */
    }
  }

  FP.progress = {
    isRead: function (id) {
      var s = readStore();
      return !!(s.read && s.read[id]);
    },
    markRead: function (id) {
      var s = readStore();
      s.read = s.read || {};
      s.read[id] = Date.now();
      writeStore(s);
    },
    getSteps: function (id, n) {
      var s = readStore();
      var arr = (s.steps && s.steps[id]) || [];
      var out = [];
      for (var i = 0; i < n; i++) out.push(!!arr[i]);
      return out;
    },
    setStep: function (id, index, value, n) {
      var s = readStore();
      s.steps = s.steps || {};
      var arr = FP.progress.getSteps(id, n);
      arr[index] = !!value;
      s.steps[id] = arr;
      var allDone = arr.length > 0 && arr.every(Boolean);
      s.done = s.done || {};
      if (allDone) s.done[id] = Date.now();
      else delete s.done[id];
      writeStore(s);
      return allDone;
    },
    isDone: function (id) {
      var s = readStore();
      return !!(s.done && s.done[id]);
    },
    resetSteps: function (id) {
      var s = readStore();
      if (s.steps) delete s.steps[id];
      if (s.done) delete s.done[id];
      writeStore(s);
    },
    counts: function () {
      var s = readStore();
      return {
        read: Object.keys(s.read || {}).length,
        done: Object.keys(s.done || {}).length
      };
    },
    clearAll: function () {
      writeStore({});
    }
  };

  /* ---------- 主题 ---------- */

  FP.theme = {
    get: function () {
      var saved = null;
      try {
        saved = localStorage.getItem(THEME_KEY);
      } catch (e) {}
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    },
    apply: function (t) {
      document.documentElement.setAttribute("data-theme", t);
      var btn = document.getElementById("theme-toggle");
      if (btn) {
        btn.textContent = t === "dark" ? "☀ 浅色" : "☾ 深色";
        btn.setAttribute("aria-label", t === "dark" ? "切换到浅色模式" : "切换到深色模式");
      }
    },
    toggle: function () {
      var next = FP.theme.get() === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {}
      FP.theme.apply(next);
    },
    init: function () {
      FP.theme.apply(FP.theme.get());
    }
  };

  /* 尽早应用主题，避免闪烁 */
  FP.theme.init();

  /* ---------- 公共 UI ---------- */

  FP.renderSiteHeader = function (opts) {
    opts = opts || {};
    var header = document.getElementById("site-header");
    if (!header) return;
    header.innerHTML = "";
    header.appendChild(
      FP.el("div", { class: "wrap header-inner" }, [
        FP.el("a", { class: "brand", href: "index.html" }, [
          FP.el("span", { class: "brand-mark" }, "◎"),
          FP.el("span", { class: "brand-text" }, "第一性原理人生地图")
        ]),
        FP.el("div", { class: "header-actions" }, [
          opts.showMapLink ? FP.el("a", { class: "btn btn-ghost", href: "index.html" }, "← 返回地图") : null,
          FP.el("button", { id: "theme-toggle", class: "btn btn-ghost", type: "button", onclick: FP.theme.toggle }, "")
        ])
      ])
    );
    FP.theme.apply(FP.theme.get());
  };

  FP.renderBreadcrumb = function (meta, current) {
    return FP.el("nav", { class: "breadcrumb", "aria-label": "位置" }, [
      FP.el("a", { href: "index.html" }, "地图"),
      FP.el("span", { class: "sep" }, "›"),
      FP.el("a", { href: "index.html#group-" + meta.groupId }, meta.group),
      FP.el("span", { class: "sep" }, "›"),
      FP.el("a", { href: "index.html#cat-" + meta.categoryId }, meta.category),
      FP.el("span", { class: "sep" }, "›"),
      FP.el("span", { class: "current" }, current || meta.name)
    ]);
  };

  FP.renderPrevNext = function (found, page) {
    var prev = found.prev;
    var next = found.next;
    return FP.el("nav", { class: "prev-next", "aria-label": "领域导航" }, [
      prev
        ? FP.el("a", { class: "pn pn-prev", href: page + ".html?id=" + prev.id }, [
            FP.el("small", {}, "← 上一领域"),
            FP.el("strong", {}, prev.name)
          ])
        : FP.el("span", { class: "pn pn-empty" }),
      FP.el("span", { class: "pn-counter" }, found.index + 1 + " / " + found.total),
      next
        ? FP.el("a", { class: "pn pn-next", href: page + ".html?id=" + next.id }, [
            FP.el("small", {}, "下一领域 →"),
            FP.el("strong", {}, next.name)
          ])
        : FP.el("span", { class: "pn pn-empty" })
    ]);
  };

  FP.renderNotFound = function (container, id) {
    container.innerHTML = "";
    container.appendChild(
      FP.el("section", { class: "wrap narrow notfound" }, [
        FP.el("h1", {}, "没有找到这个领域"),
        FP.el("p", {}, id ? "领域标识「" + id + "」不存在，或对应的数据文件尚未创建。" : "链接缺少领域参数。"),
        FP.el("a", { class: "btn btn-primary", href: "index.html" }, "返回原理地图")
      ])
    );
  };

  FP.setTitle = function (parts) {
    document.title = parts.concat(["第一性原理人生地图"]).join(" · ");
  };
})();
