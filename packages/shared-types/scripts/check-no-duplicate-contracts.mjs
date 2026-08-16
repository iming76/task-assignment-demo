#!/usr/bin/env node
// Fails if application code redeclares an interface/type already exported
// from @repo/shared-types, since that is the only allowed source of public
// domain and transport contracts (see docs/constitution/architecture.md).

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const sharedTypesSrc = path.resolve(scriptDir, "../src");

const EXCLUDED_DIR_NAMES = new Set(["node_modules", "dist", "generated", ".turbo"]);
const EXCLUDED_PACKAGE_DIRS = new Set(["shared-types", "shared-types-consumer-fixture"]);
const DECLARATION_PATTERN = /^\s*export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)/gm;

function walk(dir, onFile) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIR_NAMES.has(entry)) continue;
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, onFile);
    } else if (/\.tsx?$/.test(entry)) {
      onFile(fullPath);
    }
  }
}

function collectDeclarations(dir) {
  const declarations = [];
  walk(dir, (filePath) => {
    const content = readFileSync(filePath, "utf8");
    for (const match of content.matchAll(DECLARATION_PATTERN)) {
      declarations.push({ name: match[1], filePath });
    }
  });
  return declarations;
}

function listSourceRoots(groupDir) {
  const roots = [];
  const groupPath = path.join(repoRoot, groupDir);
  for (const entry of readdirSync(groupPath)) {
    if (EXCLUDED_PACKAGE_DIRS.has(entry)) continue;
    const srcPath = path.join(groupPath, entry, "src");
    if (statSync(srcPath, { throwIfNoEntry: false })?.isDirectory()) {
      roots.push(srcPath);
    }
  }
  return roots;
}

const publicNames = new Set(collectDeclarations(sharedTypesSrc).map((d) => d.name));

const applicationSourceRoots = [...listSourceRoots("apps"), ...listSourceRoots("packages")];

const violations = [];
for (const root of applicationSourceRoots) {
  for (const { name, filePath } of collectDeclarations(root)) {
    if (publicNames.has(name)) {
      violations.push({ name, filePath });
    }
  }
}

if (violations.length > 0) {
  console.error("Found application code redeclaring public @repo/shared-types contracts:");
  for (const { name, filePath } of violations) {
    console.error(`  - ${name} in ${path.relative(repoRoot, filePath)}`);
  }
  console.error("\nImport these from @repo/shared-types instead of redeclaring them.");
  process.exit(1);
}

console.log(`No duplicate contract declarations found (checked ${publicNames.size} public names).`);
