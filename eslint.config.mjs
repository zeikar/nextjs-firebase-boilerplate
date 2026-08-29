import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default eslintConfig;
