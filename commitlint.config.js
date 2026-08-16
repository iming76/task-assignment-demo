module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w*)\[(.*)\]: (.*)$/,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "docs",
        "refactor",
        "test",
        "style",
        "perf",
        "build",
        "ci",
        "revert",
      ],
    ],
    "type-empty": [2, "never"],
    "type-case": [2, "always", "lower-case"],
    "scope-enum": [
      2,
      "always",
      [
        "spec",
        "backend",
        "frontend",
        "shared-types",
        "ui",
        "infra",
        "others",
        "docs",
        "setup",
      ],
    ],
    "scope-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 100],
  },
};
