/**
 * Settings live in app.json. This file only adds the GitHub Pages base path
 * (/LinguaAdapt) when the website is exported: `npm run predeploy` sets
 * LINGUA_WEB_BASE_URL. Expo also applies experiments.baseUrl to native release
 * bundles, where it moves the embedded assets into LinguaAdapt.app/LinguaAdapt/
 * — the path of the app binary itself — and the iOS build fails.
 */
module.exports = ({ config }) => {
  const baseUrl = process.env.LINGUA_WEB_BASE_URL?.trim();
  return baseUrl ? { ...config, experiments: { ...config.experiments, baseUrl } } : config;
};
