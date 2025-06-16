import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
    { ignores: [ "node_modules", "test_src", "src/lib" ] },
    {
        files: [ "**/*.{js,mjs,cjs,ts}" ],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2021
            },
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module"
            }
        },
        rules: {
            "@typescript-eslint/no-namespace": "off",
            "semi": [ 1, "always" ]
        }
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended
];
