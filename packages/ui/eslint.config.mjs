import { config as reactInternalConfig } from "@repo/eslint-config/react-internal";
import storybook from "eslint-plugin-storybook";

/** @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ["storybook-static/**"] },
  ...reactInternalConfig,
  ...storybook.configs["flat/recommended"],
];
