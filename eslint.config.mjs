import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Ignorar archivos y directorios
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "cdk.out/**",
      "coverage/**",
      "**/*.d.ts"
    ]
  },

  // Configuración para archivos JavaScript
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" }
  },

  // Configuración para archivos TypeScript y JavaScript
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: globals.node }
  },

  // Configuración recomendada de TypeScript ESLint
  ...tseslint.configs.recommended,

  // Reglas personalizadas para el proyecto
  {
    files: ["**/*.ts"],
    rules: {
      // TypeScript
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error"
    }
  }
];
