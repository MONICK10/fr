// Public-folder assets (images, music) are referenced as plain "/images/..."
// strings in the data files, so they need the build's base path stitched on
// by hand — Vite only rewrites paths it sees through an actual import.
export function withBase(path) {
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}
