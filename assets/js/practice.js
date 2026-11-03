/* 实操页：目标 + 4–8 步骤（可勾选）+ 卡点应对（40 个领域固定同构） */
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
  });

  function sectionHead(num, title) {
    return FP.el("div", { class: "section-head" }, [FP.el("span", { class: "num" }, String(num)), FP.el("h2", {}, title)]);
  }

  function field(k, v, extra) {
    return FP.el("div", { class: "step-field " + (extra || "") }, [
      FP.el("div", { class: "k" }, k),
      typeof v === "string" ? FP.el("p", { class: "v" }, v) : v
    ]);
  }

  function render(found, d) {
    var meta = found.meta;
    var p = d.practice || {};
    var steps = p.steps || [];
    var n = steps.length;
    var state = FP.progress.getSteps(d.id, n);

    FP.setTitle([meta.name, "实操"]);
    app.innerHTML = "";
    app.className = "page g-" + meta.groupId;

    var wrap = FP.el("div", { class: "wrap narrow" });
    wrap.appendChild(FP.renderBreadcrumb(meta, meta.name + " · 实操"));
    wrap.appendChild(
      FP.el("div", { class: "page-title" }, [FP.el("h1", {}, meta.name + " · 实操"), FP.el("span", { class: "tag" }, meta.group + " · " + meta.category)])
    );

    /* 原理回顾 */
    wrap.appendChild(
      FP.el("section", { class: "principle-box compact" }, [
        FP.el("div", { class: "label" }, "原理回顾"),
        FP.el("p", { class: "text" }, d.principle || ""),
        FP.el("a", { href: "detail.html?id=" + d.id, class: "muted", style: "font-size:.88rem" }, "← 重看拆解与案例")
      ])
    );

    /* 实操目标 */
    wrap.appendChild(
      FP.el("section", { class: "goal" }, [FP.el("div", { class: "label" }, "实操目标"), FP.el("p", {}, p.goal || "")])
    );

    /* 步骤 */
    var barFill = FP.el("span", {});
    var barText = FP.el("span", {});
    var doneBanner = FP.el("div", { class: "done-banner" }, "✓ 这个领域的全部步骤已完成。回到地图，这张卡片会被标记为「已实操」。");

    function refreshProgress() {
      var doneCount = state.filter(Boolean).length;
      barFill.style.width = n ? Math.round((doneCount / n) * 100) + "%" : "0%";
      barFill.className = doneCount === n && n > 0 ? "done" : "";
      barText.textContent = "已完成 " + doneCount + " / " + n + " 步";
      doneBanner.classList.toggle("show", n > 0 && doneCount === n);
    }

    var stepsSection = FP.el("section", { class: "section" }, [
      sectionHead(1, "实操步骤（" + n + " 步）"),
      FP.el("div", { class: "steps-progress no-print" }, [
        barText,
        FP.el("span", { class: "progress-bar" }, barFill),
        FP.el("button", {
          class: "btn btn-ghost",
          type: "button",
          style: "font-size:.82rem;padding:4px 10px",
          onclick: function () {
            if (confirm("重置这个领域的步骤勾选？")) {
              FP.progress.resetSteps(d.id);
              render(found, d);
            }
          }
        }, "重置")
      ])
    ]);

    var ol = FP.el("ol", { class: "steps" });
    steps.forEach(function (s, i) {
      var li = FP.el("li", { class: "step" + (state[i] ? " is-done" : "") });
      var cb = FP.el("input", { type: "checkbox", checked: !!state[i] });
      cb.addEventListener("change", function () {
        state[i] = cb.checked;
        FP.progress.setStep(d.id, i, cb.checked, n);
        li.classList.toggle("is-done", cb.checked);
        refreshProgress();
      });
      li.appendChild(FP.el("div", { class: "step-num" }, String(i + 1)));
      li.appendChild(
        FP.el("div", {}, [
          FP.el("h3", { class: "step-title" }, [
            FP.el("span", {}, s.title || ""),
            FP.el("label", { class: "step-check no-print" }, [cb, "完成"])
          ]),
          FP.el("div", { class: "step-grid" }, [
            field("怎么做", FP.list(s.how)),
            field("自检问题", s.check || ""),
            field("产出物", s.output || "", "output")
          ])
        ])
      );
      ol.appendChild(li);
    });
    stepsSection.appendChild(ol);
    stepsSection.appendChild(doneBanner);
    wrap.appendChild(stepsSection);
    refreshProgress();

    /* 卡点 */
    wrap.appendChild(
      FP.el("section", { class: "section blockers" }, [
        sectionHead(2, "常见卡点与应对"),
        FP.el("div", { class: "blocks" }, (p.blockers || []).map(function (b) {
          return FP.el("div", { class: "block" }, [FP.el("h3", {}, b.problem || ""), FP.el("p", {}, b.solution || "")]);
        }))
      ])
    );

    /* 底部操作 */
    wrap.appendChild(
      FP.el("div", { class: "actions no-print" }, [
        FP.el("a", { class: "btn", href: "detail.html?id=" + d.id }, "← 回到详情"),
        found.next ? FP.el("a", { class: "btn btn-primary", href: "detail.html?id=" + found.next.id }, "下一领域：" + found.next.name + " →") : null,
        FP.el("button", { class: "btn", type: "button", onclick: function () { window.print(); } }, "打印 / 导出 PDF")
      ])
    );
    wrap.appendChild(FP.renderPrevNext(found, "practice"));

    app.appendChild(wrap);
    window.scrollTo(0, 0);
  }
})();
