#!/usr/bin/env node
/* 结构校验：确保 40 个领域文件与目录一致、字段齐全、结构同构。
 * 用法：node tools/validate.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const domainsDir = path.join(root, "data", "domains");

function loadIntoSandbox(file, sandbox) {
  const code = fs.readFileSync(file, "utf8");
  vm.runInContext(code, sandbox, { filename: file });
}

const sandbox = vm.createContext({ window: {} });
loadIntoSandbox(path.join(root, "data", "catalog.js"), sandbox);
const FP = sandbox.window.FP;

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`[${id}] ${msg}`);
const warn = (id, msg) => warnings.push(`[${id}] ${msg}`);

const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const isStrArr = (v, min, max) =>
  Array.isArray(v) && v.length >= min && (max == null || v.length <= max) && v.every((s) => isStr(s));

/* 目录 */
const metas = [];
FP.catalog.groups.forEach((g) =>
  g.categories.forEach((c) =>
    c.domains.forEach((d) => metas.push({ id: d.id, name: d.name, group: g.name, category: c.name }))
  )
);
const ids = metas.map((m) => m.id);
if (ids.length !== 40) err("catalog", `目录应有 40 个领域，实际 ${ids.length}`);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) err("catalog", `重复 id: ${dup.join(", ")}`);
const groups = FP.catalog.groups.map((g) => g.name);
const cats = FP.catalog.groups.reduce((n, g) => n + g.categories.length, 0);
if (groups.length !== 5) err("catalog", `应有 5 个大区，实际 ${groups.length}`);
if (cats !== 8) err("catalog", `应有 8 个类别，实际 ${cats}`);

/* 文件存在性 */
const files = fs.existsSync(domainsDir) ? fs.readdirSync(domainsDir).filter((f) => f.endsWith(".js")) : [];
const fileIds = files.map((f) => f.replace(/\.js$/, ""));
fileIds.forEach((fid) => {
  if (!ids.includes(fid)) warn(fid, "文件存在但目录中没有此 id");
});

let present = 0;
let totalChars = 0;

metas.forEach((m) => {
  const file = path.join(domainsDir, `${m.id}.js`);
  if (!fs.existsSync(file)) {
    err(m.id, "缺少数据文件 data/domains/" + m.id + ".js");
    return;
  }
  present++;
  const sb = vm.createContext({ window: {} });
  try {
    loadIntoSandbox(file, sb);
  } catch (e) {
    err(m.id, "文件语法错误: " + e.message);
    return;
  }
  const d = sb.window.FP && sb.window.FP.domains && sb.window.FP.domains[m.id];
  if (!d) {
    err(m.id, `文件未定义 window.FP.domains["${m.id}"]`);
    return;
  }

  totalChars += JSON.stringify(d).replace(/[\s"{}\[\],:]/g, "").length;

  /* 基本字段 */
  if (d.id !== m.id) err(m.id, `id 字段不一致: ${d.id}`);
  if (d.name !== m.name) err(m.id, `name 与目录不一致: ${d.name} ≠ ${m.name}`);
  if (d.group !== m.group) err(m.id, `group 与目录不一致: ${d.group} ≠ ${m.group}`);
  if (d.category !== m.category) err(m.id, `category 与目录不一致: ${d.category} ≠ ${m.category}`);
  if (!isStr(d.principle, 10)) err(m.id, "principle 缺失或过短");
  if (isStr(d.principle) && d.principle.length > 80) warn(m.id, `principle 偏长（${d.principle.length} 字），建议 ≤ 60 字`);

  /* 拆解 */
  const b = d.breakdown || {};
  if (!isStr(b.surface, 40)) err(m.id, "breakdown.surface 缺失或过短");
  if (!isStrArr(b.assumptions, 2, 6)) err(m.id, "breakdown.assumptions 应为 2–6 条");
  if (!isStr(b.essence, 40)) err(m.id, "breakdown.essence 缺失或过短");
  if (!isStrArr(b.rebuild, 3, 3)) err(m.id, "breakdown.rebuild 必须恰好 3 条");
  if (!isStrArr(b.pitfalls, 2, 3)) err(m.id, "breakdown.pitfalls 应为 2–3 条");

  /* 案例 */
  const cases = d.cases || [];
  if (cases.length !== 2) err(m.id, `cases 必须恰好 2 个，实际 ${cases.length}`);
  const types = cases.map((c) => c.type);
  if (!(types.includes("daily") && types.includes("complex"))) err(m.id, "cases 必须包含 type=daily 与 type=complex 各一个");
  cases.forEach((c, i) => {
    ["title", "situation", "conventional", "fpView", "outcome"].forEach((k) => {
      if (!isStr(c[k], k === "title" ? 4 : 30)) err(m.id, `cases[${i}].${k} 缺失或过短`);
    });
    if (c.type === "complex" && isStr(c.situation) && c.situation.length < 120) warn(m.id, "复杂案例的 situation 偏短，建议更充分的背景");
  });

  /* 实操 */
  const p = d.practice || {};
  if (!isStr(p.goal, 20)) err(m.id, "practice.goal 缺失或过短");
  const steps = p.steps || [];
  if (steps.length < 4 || steps.length > 8) err(m.id, `practice.steps 应为 4–8 步，实际 ${steps.length}`);
  steps.forEach((s, i) => {
    if (!isStr(s.title, 4)) err(m.id, `steps[${i}].title 缺失`);
    if (!isStrArr(s.how, 2, 5)) err(m.id, `steps[${i}].how 应为 2–5 条`);
    if (!isStr(s.check, 6)) err(m.id, `steps[${i}].check 缺失`);
    if (!isStr(s.output, 4)) err(m.id, `steps[${i}].output 缺失`);
  });
  if (!Array.isArray(p.blockers) || p.blockers.length < 2 || p.blockers.length > 3) err(m.id, "practice.blockers 应为 2–3 条");
  (p.blockers || []).forEach((bk, i) => {
    if (!isStr(bk.problem, 6) || !isStr(bk.solution, 15)) err(m.id, `blockers[${i}] 字段缺失或过短`);
  });
});

/* 输出 */
console.log(`目录：${groups.length} 大区 / ${cats} 类 / ${ids.length} 领域`);
console.log(`数据文件：${present} / ${ids.length} 已存在，正文约 ${totalChars.toLocaleString()} 字`);
if (warnings.length) {
  console.log(`\n提示 (${warnings.length}):`);
  warnings.forEach((w) => console.log("  - " + w));
}
if (errors.length) {
  console.log(`\n错误 (${errors.length}):`);
  errors.forEach((e) => console.log("  ✗ " + e));
  process.exitCode = 1;
} else {
  console.log("\n✓ 结构校验通过");
}
