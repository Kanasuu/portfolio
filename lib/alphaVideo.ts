/**
 * Whether this browser can show transparent (VP9 alpha) WebM video. Safari and every iOS browser
 * (all WebKit) play WebM but drop the transparency, so they get the regular .mp4 clips instead.
 */
export function supportsAlphaVideo(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua);
  const safari = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\/|Firefox/.test(ua);
  if (ios || safari) return false;
  return document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
}
