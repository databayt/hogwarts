import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"
import eslintConfigPrettier from "eslint-config-prettier"

// Native flat config from eslint-config-next (Next 16). Replaces the previous
// FlatCompat wrapper, which crashed under ESLint 9 (`Converting circular
// structure to JSON ... property 'react' closes the circle`) — the eslintrc
// validator can't serialize eslint-plugin-react's self-referential config.
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  eslintConfigPrettier, // Must be last to disable conflicting rules
]

export default eslintConfig
