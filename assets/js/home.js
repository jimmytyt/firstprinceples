/* 首页：原理地图（星图 / 卡片可切换） */
(function () {
  "use strict";
  var FP = window.FP;
  var VIEW_KEY = "fp.mapView";
  var EN = { life: "LIFE", relationship: "RELATION", growth: "GROWTH", career: "CAREER", wealth: "WEALTH" };

  FP.renderSiteHeader({ showMapLink: false });

  var mapEl = document.getElementById("map");
  var starEl = document.getElementById("starmap");
  var navEl = document.getElementById("group-nav");
  var searchEl = document.getElementById("search");
  var clearEl = document.getElementById("search-clear");
  var emptyEl = document.getElementById("empty-result");
  var summaryEl = document.getElementById("progress-summary");
  var starBtn = document.getElementById("view-star");
  var cardsBtn = document.getElementById("view-cards");
  var randomBtn = document.getElementById("random-domain");

  var entries = []; /* {card, node, groupId, catId, text, id} */
  var groupFilter = null;

  function initialView() {
    var saved = null;
    try { saved = localStorage.getItem(VIEW_KEY); } catch (e) {}
    if (saved === "cards" || saved === "star") return saved;
    return window.matchMedia("(max-width: 768px)").matches ? "cards" : "star";
  }
  var view = initialView();

  function renderSummary() {
    var total = FP.allMeta().length;
    var c = FP.progress.counts();
    summaryEl.innerHTML = "";
    summaryEl.appendChild(
      FP.el("span", {}, [
        "已读 ",
        FP.el("strong", {}, String(c.read)),
        " / " + total + " · 已实操 ",
        FP.el("strong", {}, String(c.done)),
        " / " + total
      ])
    );
    var bar = FP.el("span", { class: "progress-bar", title: "已读进度" }, FP.el("span", { style: "width:" + Math.round((c.read / total) * 100) + "%" }));
    summaryEl.appendChild(bar);
    if (c.read || c.done) {
      summaryEl.appendChild(
        FP.el("button", {
          class: "reset",
          type: "button",
          onclick: function () {
            if (confirm("确定清空本浏览器中保存的全部学习进度吗？")) {
              FP.progress.clearAll();
              location.reload();
            }
          }
        }, "清空进度")
      );
    }
  }

  function progressClass(id) {
    if (FP.progress.isDone(id)) return " is-done";
    if (FP.progress.isRead(id)) return " is-read";
    return "";
  }

  function badgeFor(id) {
    if (FP.progress.isDone(id)) return FP.el("span", { class: "badge done" }, "已实操");
    if (FP.progress.isRead(id)) return FP.el("span", { class: "badge read" }, "已读");
    return FP.el("span", { class: "badge" }, "未读");
  }

  function brief(id) {
    var m = (FP.manifest && FP.manifest[id]) || FP.domains[id] || {};
    var principle = m.principle || "（内容整理中）";
    var extra = m.search;
    if (!extra && m.breakdown) {
      extra = [m.breakdown.essence || ""].concat(m.breakdown.rebuild || []).join(" ");
    }
    return { principle: principle, extra: extra || "" };
  }

  function groupCount(g) {
    return g.categories.reduce(function (n, c) {
      return n + c.domains.length;
    }, 0);
  }

  function renderChips() {
    navEl.innerHTML = "";
    navEl.appendChild(
      FP.el("button", {
        type: "button",
        class: "chip" + (groupFilter ? "" : " is-on"),
        onclick: function () { setGroup(null); }
      }, "全部")
    );
    FP.catalog.groups.forEach(function (g) {
      navEl.appendChild(
        FP.el("button", {
          type: "button",
          class: "chip g-" + g.id + (groupFilter === g.id ? " is-on" : ""),
          onclick: function () { setGroup(g.id); }
        }, g.name)
      );
    });
  }

  function renderMap() {
    mapEl.innerHTML = "";
    starEl.innerHTML = "";
    entries = [];

    var cols = FP.el("div", { class: "star-cols" });

    FP.catalog.groups.forEach(function (g) {
      var count = groupCount(g);
      var groupEl = FP.el("section", { class: "group g-" + g.id, id: "group-" + g.id }, [
        FP.el("div", { class: "group-head" }, [
          FP.el("h2", {}, g.name),
          FP.el("span", { class: "intro" }, g.intro || ""),
          FP.el("span", { class: "count" }, count + " 个领域")
        ])
      ]);

      var list = FP.el("ul", { class: "star-list" });
      var col = FP.el("div", { class: "star-col g-" + g.id, "data-group": g.id }, [
        FP.el("div", { class: "star-hub" }, [
          FP.el("span", { class: "hub-dot" }),
          FP.el("h2", {}, g.name),
          FP.el("span", { class: "en" }, (EN[g.id] || g.id.toUpperCase()) + " · " + count)
        ]),
        list
      ]);

      g.categories.forEach(function (c) {
        var grid = FP.el("div", { class: "cards" });
        var catEl = FP.el("div", { class: "category", id: "cat-" + c.id }, [FP.el("h3", {}, c.name), grid]);

        c.domains.forEach(function (d) {
          var info = brief(d.id);
          var principle = info.principle;
          var card = FP.el("a", { class: "card", href: "detail.html?id=" + d.id, "data-id": d.id }, [
            FP.el("div", { class: "card-title" }, [FP.el("h4", {}, d.name), badgeFor(d.id)]),
            FP.el("p", { class: "principle" }, principle),
            FP.el("div", { class: "card-foot" }, [FP.el("span", {}, c.name), FP.el("span", { class: "go" }, "查看原理 →")])
          ]);
          grid.appendChild(card);

          var node = FP.el("a", {
            class: "star-node" + progressClass(d.id),
            href: "detail.html?id=" + d.id,
            "data-id": d.id
          }, [
            FP.el("span", { class: "dot" }),
            FP.el("span", { class: "star-name" }, d.name),
            FP.el("span", { class: "star-tip" }, principle)
          ]);
          list.appendChild(FP.el("li", {}, node));

          entries.push({
            card: card,
            node: node,
            groupEl: groupEl,
            catEl: catEl,
            col: col,
            groupId: g.id,
            text: (d.name + " " + c.name + " " + g.name + " " + principle + " " + info.extra).toLowerCase(),
            id: d.id
          });
        });

        groupEl.appendChild(catEl);
      });

      mapEl.appendChild(groupEl);
      cols.appendChild(col);
    });

    starEl.appendChild(cols);
    starEl.appendChild(
      FP.el("div", { class: "star-legend" }, [
        FP.el("span", { class: "lg-unread" }, [FP.el("i", {}), "未读"]),
        FP.el("span", { class: "lg-read" }, [FP.el("i", {}), "已读"]),
        FP.el("span", { class: "lg-done" }, [FP.el("i", {}), "已实操"])
      ])
    );
    renderChips();
    applyFilter();
  }

  function setGroup(id) {
    groupFilter = id;
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    renderChips();
    applyFilter();
    if (!id) return;
    var narrow = window.matchMedia("(max-width: 768px)").matches;
    if (view === "star" && narrow) {
      var col = starEl.querySelector('.star-col[data-group="' + id + '"]');
      if (col) col.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (view === "cards") {
      var target = document.getElementById("group-" + id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setView(next) {
    view = next === "cards" ? "cards" : "star";
    try { localStorage.setItem(VIEW_KEY, view); } catch (e) {}
    applyView();
  }

  function applyView() {
    document.documentElement.classList.toggle("view-star", view === "star");
    document.documentElement.classList.toggle("view-cards", view === "cards");
    document.body.classList.toggle("view-star", view === "star");
    document.body.classList.toggle("view-cards", view === "cards");
    starBtn.classList.toggle("is-on", view === "star");
    cardsBtn.classList.toggle("is-on", view === "cards");
    starBtn.setAttribute("aria-pressed", view === "star" ? "true" : "false");
    cardsBtn.setAttribute("aria-pressed", view === "cards" ? "true" : "false");
  }

  function applyFilter() {
    var q = (searchEl.value || "").trim().toLowerCase();
    clearEl.classList.toggle("hidden", !q);
    var shown = 0;
    var groupShown = {};
    var catShown = {};

    entries.forEach(function (e) {
      var hit = (!q || e.text.indexOf(q) !== -1) && (!groupFilter || e.groupId === groupFilter);
      e.card.classList.toggle("is-hidden", !hit);
      e.node.classList.toggle("is-hidden", !hit);
      if (hit) {
        shown++;
        groupShown[e.groupId] = true;
        catShown[e.catEl.id] = true;
      }
    });

    Array.prototype.forEach.call(mapEl.querySelectorAll(".group"), function (g) {
      var gid = g.id.slice(6);
      var hide = groupFilter ? gid !== groupFilter || (!!q && !groupShown[gid]) : !!q && !groupShown[gid];
      g.classList.toggle("hidden", hide);
    });
    Array.prototype.forEach.call(mapEl.querySelectorAll(".category"), function (c) {
      c.classList.toggle("hidden", q ? !catShown[c.id] : false);
    });
    Array.prototype.forEach.call(starEl.querySelectorAll(".star-col"), function (col) {
      var gid = col.getAttribute("data-group");
      var hide = groupFilter ? gid !== groupFilter || (!!q && !groupShown[gid]) : !!q && !groupShown[gid];
      col.classList.toggle("is-hidden", hide);
    });
    emptyEl.classList.toggle("hidden", shown > 0);
  }

  starBtn.addEventListener("click", function () { setView("star"); });
  cardsBtn.addEventListener("click", function () { setView("cards"); });
  searchEl.addEventListener("input", applyFilter);
  clearEl.addEventListener("click", function () {
    searchEl.value = "";
    applyFilter();
    searchEl.focus();
  });
  randomBtn.addEventListener("click", function () {
    var pool = entries.filter(function (e) { return !e.node.classList.contains("is-hidden"); });
    if (!pool.length) pool = entries;
    var pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) location.href = "detail.html?id=" + pick.id;
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "/" || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var tag = (ev.target && ev.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    ev.preventDefault();
    searchEl.focus();
  });

  function applyHash() {
    var hash = (location.hash || "").replace("#", "");
    if (!hash) return;
    if (hash.indexOf("group-") === 0) {
      groupFilter = hash.slice(6);
      renderChips();
      applyFilter();
    } else if (hash.indexOf("cat-") === 0) {
      FP.catalog.groups.forEach(function (g) {
        g.categories.forEach(function (c) {
          if ("cat-" + c.id === hash) groupFilter = g.id;
        });
      });
      setView("cards");
      renderChips();
      applyFilter();
      var target = document.getElementById(hash);
      if (target) target.scrollIntoView();
    }
  }

  renderMap();
  renderSummary();
  applyView();
  applyHash();
})();
