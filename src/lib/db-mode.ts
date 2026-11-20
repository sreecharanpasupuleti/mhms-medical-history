export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  if (url === 'postgresql://placeholder' || url.includes('://placeholder')) {
    return false;
  }
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

export function isBlobConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return false;
  if (token === 'placeholder_blob_token' || token.includes('placeholder')) {
    return false;
  }
  return token.startsWith('vercel_blob_rw_');
}
