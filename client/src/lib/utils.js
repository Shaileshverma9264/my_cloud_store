export function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 180);
}

export function getExtension(name = '') {
  const p = name.split('.');
  return p.length > 1 ? p.pop().toUpperCase() : 'FILE';
}