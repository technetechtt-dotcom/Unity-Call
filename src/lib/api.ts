const TOKEN_KEY = 'unity_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Try again.');
  }
  return data as T;
}

export function mediaUrl(path: string) {
  const token = getToken();
  if (!token) return path;
  return `${path}${path.includes('?') ? '&' : '?'}access=1`;
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
  const token = getToken();
  const response = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
  if (!response.ok) throw new Error('Could not load that file.');
  return response.blob();
}
