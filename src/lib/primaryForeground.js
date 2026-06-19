import { contrastText } from "@/theme/palette";
import { RESTAURANT_ADMIN_PRIMARY } from "@/config/restaurantAdminTheme";

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/** Readable text/icon color for a solid primary brand background. */
export function primaryForegroundForHex(hex, fallbackHex = RESTAURANT_ADMIN_PRIMARY) {
  const h = String(hex ?? "").trim();
  if (!HEX6.test(h)) return contrastText(fallbackHex);
  return contrastText(h);
}

/**
 * Minified contrast helper for blocking bootstrap scripts.
 * Keep in sync with `contrastText` in `@/theme/palette`.
 */
export const BOOTSTRAP_PRIMARY_FG_FN = `function rmsPrimaryFg(hex){try{var h=String(hex||'').trim();if(!/^#[0-9A-Fa-f]{6}$/.test(h))return '#111827';var r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255;var f=function(c){return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};var lum=0.2126*f(r)+0.7152*f(g)+0.0722*f(b);return lum>0.55?'#111827':'#ffffff'}catch(e){return '#111827'}}`;
