/* 详情页：原理 + 拆解 + 两个案例（40 个领域固定同构） */
(function () {
  "use strict";
  var FP = window.FP;
  var app = document.getElementById("app");
  var id = FP.qs("id");

  FP.renderSiteHeader({ showMapLink: true });

  var found = id ? FP.findMeta(id) : null;
  if (!found) {
    FP.renderNotFound(app, id);
    return;
  }

  FP.loadDomain(id, function (d) {
    if (!d) {
      FP.renderNotFound(app, id);
      return;
    }
    render(found, d);
    FP.progress.markRead(id);
  });

  function sectionHead(num, title) {
    return FP.el("div", { class: "section-head" }, [FP.el("span", { class: "num" }, String(num)), FP.el("h2", {}, title)]);
  }

  function block(title, body) {
    return FP.el("div", { class: "block" }, [FP.el("h3", {}, title), body]);
  }

  function caseCard(c, kindLabel) {
    return FP.el("article", { class: "case" }, [
      FP.el("div", { class: "case-head" }, [FP.el("span", { class: "kind" }, kindLabel), FP.el("h3", {}, c.title || "")]),
      FP.el("div", { class: "case-body" }, [
        caseRow("情境", c.situation),
        caseRow("常规做法", c.conventional),
        caseRow("第一性原理视角", c.fpView, "fp"),
        caseRow("结果与启发", c.outcome)
      ])
    ]);
  }

  function caseRow(k, v, extra) {
    return FP.el("div", { class: "case-row " + (extra || "") }, [FP.el("div", { class: "k" }, k), FP.el("p", { class: "v" }, v || "")]);
  }

  function render(found, d) {
    var meta = found.meta;
    var b = d.breakdown || {};
    var cases = d.cases || [];
    var daily = cases.filter(function (c) { return c.type === "daily"; })[0] || cases[0] || {};
    var complex = cases.filter(function (c) { return c.type === "complex"; })[0] || cases[1] || {};

    FP.setTitle([meta.name, "原理与案例"]);
    app.innerHTML = "";
    app.className = "page g-" + meta.groupId;

    var wrap = FP.el("div", { class: "wrap narrow" });

    wrap.appendChild(FP.renderBreadcrumb(meta));
    wrap.appendChild(
      FP.el("div", { class: "page-title" }, [FP.el("h1", {}, meta.name), FP.el("span", { class: "tag" }, meta.group + " · " + meta.category)])
    );

    /* 1 第一性原理 */
    wrap.appendChild(
      FP.el("section", { class: "principle-box" }, [
        FP.el("div", { class: "label" }, "第一性原理"),
        FP.el("p", { class: "text" }, d.principle || "")
      ])
    );

    /* 2 原理拆解 */
    wrap.appendChild(
      FP.el("section", { class: "section" }, [
        sectionHead(1, "原理拆解"),
        FP.el("div", { class: "blocks" }, [
          block("表象 · 大家通常怎么想", FP.el("p", {}, b.surface || "")),
          block("剥离假设 · 哪些前提未必成立", FP.list(b.assumptions)),
          block("回到本质 · 不可再拆的基本事实", FP.el("p", {}, b.essence || "")),
          block("从本质重建 · 三条推论", FP.el("ol", {}, (b.rebuild || []).map(function (t) { return FP.el("li", {}, t); }))),
          block("常见误区", FP.list(b.pitfalls))
        ])
      ])
    );

    /* 3 案例 */
    wrap.appendChild(
      FP.el("section", { class: "section" }, [
        sectionHead(2, "案例一 · 日常案例"),
        caseCard(daily, "日常")
      ])
    );
    wrap.appendChild(
      FP.el("section", { class: "section" }, [
        sectionHead(3, "案例二 · 复杂真实情境"),
        caseCard(complex, "复杂情境"),
        complex.note ? FP.el("p", { class: "muted", style: "font-size:.85rem" }, complex.note) : null
      ])
    );

    /* 底部操作 */
    wrap.appendChild(
      FP.el("div", { class: "actions" }, [
        FP.el("a", { class: "btn btn-primary btn-lg", href: "practice.html?id=" + d.id }, "进入实操 →"),
        FP.el("a", { class: "btn", href: "index.html" }, "返回地图")
      ])
    );
    wrap.appendChild(FP.renderPrevNext(found, "detail"));

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }
})();
