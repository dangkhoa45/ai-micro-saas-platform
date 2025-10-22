// Fallback type declaration for CSS files to satisfy TypeScript in editors
// This is safe and only affects type checking. Next.js handles CSS at build/runtime.
declare module "*.css" {
  const css: string;
  export default css;
}
