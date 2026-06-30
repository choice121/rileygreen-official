const IK_URL = import.meta.env.VITE_IMAGEKIT_URL || 'https://ik.imagekit.io/Morganwallen'

export function ikUrl(path: string, transforms?: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = IK_URL.replace(/\/$/, '')
  const cleanPath = path.replace(/^\//, '')
  if (transforms) {
    return `${base}/tr:${transforms}/${cleanPath}`
  }
  return `${base}/${cleanPath}`
}

export function ikThumb(path: string, w = 400, h = 300): string {
  return ikUrl(path, `w-${w},h-${h},fo-auto,q-80`)
}

export function ikHero(path: string): string {
  return ikUrl(path, 'w-1920,h-1080,fo-auto,q-85')
}

export function ikSquare(path: string, size = 600): string {
  return ikUrl(path, `w-${size},h-${size},c-maintain_ratio,fo-auto,q-80`)
}

export function ikCard(path: string): string {
  return ikUrl(path, 'w-800,h-600,fo-auto,q-80')
}

export const PLACEHOLDER_IMAGES = {
  album: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&auto=format',
  hero: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1920&h=1080&fit=crop&auto=format',
  news: 'https://images.unsplash.com/photo-1501386761578-eaa54b620fe8?w=800&h=600&fit=crop&auto=format',
  merch: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=600&fit=crop&auto=format',
  gallery: 'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&h=600&fit=crop&auto=format',
  video: 'https://images.unsplash.com/photo-1598387993441-a364f854cfbf?w=800&h=450&fit=crop&auto=format',
  avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=200&h=200&fit=crop&auto=format',
}
