import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, type UploadTask } from 'firebase/storage';

export interface UploadOptions {
  /** Storage path prefix, e.g. 'products' */
  folder: string;
  /** Optional subpath, e.g. productId */
  sub?: string;
  /** Max file size in bytes (default 5MB) */
  maxSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Number of automatic retries on transient failure (default 2) */
  retries?: number;
  /** Whether to compress/resize client-side before upload */
  compress?: boolean;
  /** Max dimension for client-side resize (default 1920) */
  maxDimension?: number;
  /** Callback with progress 0-100 */
  onProgress?: (percent: number) => void;
}

export interface UploadResult {
  url: string;
  path: string;
  bytesTransferred: number;
  totalBytes: number;
}

/** default allowed MIME types (SVG is intentionally excluded: unsanitized SVG is a stored-XSS vector) */
export const DEFAULT_ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif', 'image/gif'];

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\s+/g, '_')
    .slice(-80);
}

function validateFile(file: File, opts: { maxSize?: number; allowedTypes?: string[] }): string | null {
  const maxSize = opts.maxSize ?? 5 * 1024 * 1024;
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
    return 'SVG uploads are not allowed for security reasons. Please use PNG, JPG, WebP, AVIF or GIF.';
  }
  if (!file.type.startsWith('image/')) return 'Please select a valid image file.';
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return `Unsupported file type. Allowed: ${opts.allowedTypes.join(', ')}.`;
  }
  if (file.size > maxSize) {
    return `Image must be under ${Math.round(maxSize / 1024 / 1024)} MB.`;
  }
  return null;
}

export function validateImageFile(file: File, maxSize = 5 * 1024 * 1024, allowedTypes?: string[]): string | null {
  return validateFile(file, { maxSize, allowedTypes });
}

/** Client-side image compression + resize to reduce upload size and generate a WebP where supported. */
async function compressImage(file: File, maxDimension = 1920): Promise<File> {
  // Skip SVG/AVIF (already optimized) and GIF (would lose animation)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.type === 'image/avif') {
    return file;
  }
  if (file.size < 200 * 1024) return file; // small files skip compression

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    if (scale >= 1) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const canWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    const outType = canWebp ? 'image/webp' : file.type;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outType, 0.82));
    if (!blob) return file;
    const ext = canWebp ? 'webp' : (file.name.split('.').pop() || 'jpg');
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}_${canvas.width}x${canvas.height}.${ext}`, {
      type: outType,
    });
  } catch {
    return file; // if compression fails, upload original
  }
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Upload an image to Firebase Storage with validation, retry, progress, and optional compression.
 * Throws an Error with a user-friendly message on failure.
 */
export async function uploadImage(file: File, opts: UploadOptions): Promise<UploadResult> {
  if (!storage) throw new Error('Storage is not initialized. Please check your environment configuration.');

  const validationError = validateFile(file, opts);
  if (validationError) throw new Error(validationError);

  const retries = opts.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const uploadFile = opts.compress === false ? file : await compressImage(file, opts.maxDimension);
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${sanitizeFilename(uploadFile.name)}`;
      const path = opts.sub ? `${opts.folder}/${opts.sub}/${filename}` : `${opts.folder}/${filename}`;
      const storageRef = ref(storage, path);

      const url = await new Promise<string>((resolve, reject) => {
        const task: UploadTask = uploadBytesResumable(storageRef, uploadFile, {
          contentType: uploadFile.type || 'image/jpeg',
        });
        task.on(
          'state_changed',
          (snapshot) => {
            const percent = snapshot.totalBytes > 0
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              : 0;
            opts.onProgress?.(percent);
          },
          (err) => reject(err),
          async () => {
            try {
              resolve(await getDownloadURL(task.snapshot.ref));
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      opts.onProgress?.(100);
      return {
        url,
        path,
        bytesTransferred: uploadFile.size,
        totalBytes: uploadFile.size,
      };
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await delay(500 * (attempt + 1));
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (lastError as any)?.code || '';
  if (code === 'storage/unauthorized') {
    throw new Error('Upload failed: your account does not have permission to upload to this folder.');
  }
  if (code === 'storage/quota-exceeded') {
    throw new Error('Upload failed: storage quota exceeded.');
  }
  if (code === 'storage/canceled') {
    throw new Error('Upload cancelled.');
  }
  if (code === 'storage/retry-limit-exceeded' || code === 'storage/network-invalid-response') {
    throw new Error('Upload failed: network error. Please check your connection and try again.');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((lastError as any)?.code && String((lastError as any)?.code).startsWith('storage/')) {
    throw new Error(`Upload failed: ${String((lastError as any)?.code).replace('storage/', '')}. Please try again.`);
  }
  throw new Error('Upload failed. Please check your connection and try again.');
}

