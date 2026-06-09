import { CUSTOMER_THEME_STORAGE_KEY } from "@/theme/constants";

/** Inline script — restores dark mode before React paints (per restaurant slug). */
export function customerThemeBootstrapScript() {
  const key = JSON.stringify(CUSTOMER_THEME_STORAGE_KEY);
  return `(function(){
    try{
      var p=location.pathname||"";
      if(p.indexOf("/super-admin")===0)return;
      var isCustomer=/^\\/r\\/[^/]+\\//.test(p)||/^\\/(home|order|account)(\\/|$)/.test(p);
      if(!isCustomer)return;
      var slug=(p.match(/^\\/r\\/([^/]+)/)||[])[1]||"default";
      var raw=localStorage.getItem(${key});
      if(!raw)return;
      var all=JSON.parse(raw);
      var e=all[slug];
      if(!e)return;
      if(e.hasUserColorModeChoice&&e.userColorMode==="dark"){
        document.documentElement.style.colorScheme="dark";
        document.documentElement.dataset.customerDark="true";
        document.documentElement.style.setProperty("--customer-bootstrap-bg","#09090b");
      }
      if(e.primaryColor){
        document.documentElement.style.setProperty("--customer-bootstrap-primary",e.primaryColor);
      }
    }catch(err){}
  })();`;
}
