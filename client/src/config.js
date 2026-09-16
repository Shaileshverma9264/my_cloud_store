export const STORAGE_BUCKET = 'user-files';
export const DEFAULT_QUOTA_BYTES =  50*1024*1024*1024; // 5 GB
export const SHARE_EXPIRY_OPTIONS = [
  { label: '1 hour', seconds: 3600 },
  { label: '1 day', seconds: 86400 },
  { label: '7 days', seconds: 604800 },
  { label: '30 days', seconds: 2592000 }
];