// Session credentials are stored in HTTP-only cookies, never localStorage.
// Remove credentials from older versions of Unity Call on migration.
export function clearLegacyToken() {
  localStorage.removeItem('unity_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, { ...options, headers, credentials: 'same-origin' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Try again.');
  }
  return data as T;
}

export function mediaUrl(path: string) {
  return path;
}

export async function fileToBase64(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadMedia(
  file: Blob,
  extras: { kind: string; filename?: string; altText?: string; transcript?: string; captions?: string }
) {
  const data = await fileToBase64(file);
  return api<{ media: { id: string; url: string; kind: string; mime: string; altText?: string; transcript?: string; captions?: string } }>(
    '/api/media',
    {
      method: 'POST',
      body: JSON.stringify({
        data,
        mime: file.type,
        filename: extras.filename || 'upload.bin',
        ...extras
      })
    }
  );
}

export async function fetchMediaBlob(path: string) {
  const response = await fetch(path, { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Could not load that file.');
  return response.blob();
}
