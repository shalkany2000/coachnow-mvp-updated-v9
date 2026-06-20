// Generates a consistent initials-avatar URL to fall back to when a coach's
// real photo fails to load (broken link, blocked domain, slow network).
export function avatarFallbackUrl(name: string, size = 100): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Coach')}&background=dbeafe&color=1d4ed8&size=${size}`;
}

// Drop-in onError handler: swaps a broken <img src> for the initials
// fallback instead of leaving a blank/broken image hole. Safe to call
// repeatedly — guards against an infinite loop if the fallback itself fails.
export function handleAvatarError(name: string, size = 100) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const fallback = avatarFallbackUrl(name, size);
    if (img.src !== fallback) {
      img.src = fallback;
    }
  };
}
