import { BOOTSTRAP_PRIMARY_FG_FN } from "@/lib/primaryForeground";

const ADMIN_COLOR_MODE_STORAGE_KEY = "rms-admin-color-mode";
const RESTAURANT_ADMIN_THEME_STORAGE_KEY = "rms-restaurant-admin-theme";
const SUPER_ADMIN_THEME_STORAGE_KEY = "rms-super-admin-theme";

/**
 * Single blocking bootstrap — portal theme storage is canonical for light/dark;
 * sets brand CSS vars + data-admin-mode before first paint.
 */
export function adminThemeBootstrapScript() {
  const modeKey = ADMIN_COLOR_MODE_STORAGE_KEY;
  const saKey = SUPER_ADMIN_THEME_STORAGE_KEY;
  const raKey = RESTAURANT_ADMIN_THEME_STORAGE_KEY;
  return `(function(){try{
    ${BOOTSTRAP_PRIMARY_FG_FN}
    var d=document.documentElement;
    var p=location.pathname||"";
    var sa=p.indexOf("/super-admin")===0;
    var themeKey=sa?${JSON.stringify(saKey)}:${JSON.stringify(raKey)};
    var modeKey=${JSON.stringify(modeKey)};
    var mode=null;
    var r=localStorage.getItem(themeKey);
    if(r){try{
      var t=JSON.parse(r);
      if(t.primaryColor){
        if(sa){
          d.style.setProperty("--sa-primary",t.primaryColor);
          d.style.setProperty("--platform-primary",t.primaryColor);
          d.style.setProperty("--sa-primary-fg",rmsPrimaryFg(t.primaryColor));
        }else{
          d.style.setProperty("--ra-primary",t.primaryColor);
          d.style.setProperty("--ra-primary-fg",rmsPrimaryFg(t.primaryColor));
        }
      }
      if(t.accentColor){
        if(sa){
          d.style.setProperty("--sa-accent",t.accentColor);
          d.style.setProperty("--platform-accent",t.accentColor);
        }else{
          d.style.setProperty("--ra-accent",t.accentColor);
        }
      }
      if(t.darkMode===false)mode="light";
      else mode="dark";
      if(sa)d.dataset.superAdminTheme="true";
      else d.dataset.restaurantAdminTheme="true";
    }catch(e){}}
    if(mode!=="light"&&mode!=="dark"){
      var legacy=localStorage.getItem(modeKey);
      if(legacy==="light"||legacy==="dark")mode=legacy;
    }
    if(mode!=="light"&&mode!=="dark")mode="dark";
    d.dataset.adminMode=mode;
    try{localStorage.setItem(modeKey,mode);}catch(e){}
  }catch(e){}})();`;
}
