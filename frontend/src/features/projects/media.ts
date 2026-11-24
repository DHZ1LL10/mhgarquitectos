/** Public delivery URLs only; uploading/signing remains on the API. */
export function isCloudinaryImage(src: string): boolean {
  try { const url = new URL(src); return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && /^\/[^/]+\/image\/upload\//.test(url.pathname); }
  catch { return false; }
}

export function cloudinaryLoader({ src, width }: { src: string; width: number }): string {
  if (!isCloudinaryImage(src)) return src;
  const bounded = Math.max(64, Math.min(2560, Math.round(width)));
  return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${bounded}/`);
}

export function previewImage(src: string, width = 480): string {
  return isCloudinaryImage(src) ? cloudinaryLoader({ src, width }) : src;
}
