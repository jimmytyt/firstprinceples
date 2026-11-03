#!/usr/bin/env node
/* 从 data/domains/*.js 生成首页用的轻量索引 data/manifest.js
 * 用法：node tools/build-manifest.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const domainsDir = path.join(root, "data", "domains");
const outFile = path.join(root, "data", "manifest.js");

function load(file) {
  const sandbox = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
  return sandbox.window.FP;
}

const catalog = load(path.join(root, "data", "catalog.js"));
const manifest = {};

catalog.catalog.groups.forEach((g) => {
  g.categories.forEach((c) => {
    c.domains.forEach((meta) => {
      const file = path.join(domainsDir, meta.id + ".js");
      const fp = load(file);
      const d = fp.domains[meta.id];
      const b = d.breakdown || {};
      manifest[meta.id] = {
        principle: d.principle || "",
        search: [b.essence || ""].concat(b.rebuild || []).join(" ")
      };
    });
  });
});

const body =
  "/* 首页索引：仅含一句话原理与搜索用摘录。由 tools/build-manifest.js 生成，请勿手改。 */\n" +
  "window.FP = window.FP || {};\n" +
  "window.FP.manifest = " +
  JSON.stringify(manifest, null, 2) +
  ";\n";

fs.writeFileSync(outFile, body, "utf8");
console.log("wrote " + path.relative(root, outFile) + " (" + Object.keys(manifest).length + " domains)");
