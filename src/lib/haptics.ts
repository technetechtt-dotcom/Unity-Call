export function vibrate(pattern: number | number[] = 200) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return false;
  return navigator.vibrate(pattern);
}

export function announce(message: string) {
  const live = document.getElementById('unity-live-region');
  if (!live) return;
  live.textContent = '';
  window.setTimeout(() => {
    live.textContent = message;
  }, 30);
}
