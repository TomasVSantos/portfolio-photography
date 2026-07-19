import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  prettier,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
