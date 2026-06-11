"use client";



import { CUSTOMER_SITE_NAV_GROUPS, CUSTOMER_SITE_TABS_BY_ID } from "@/config/customerSiteTabs";
import { tabHasUnpublishedDraft } from "@/config/customerSiteDraft";
import { raSideNavActiveCls } from "@/config/restaurantAdminTheme";



export default function CustomerSiteSidebar({

  activeTab,

  onTabChange,

  draftSections = [],

}) {

  const renderButton = (tab) => {

    const Icon = tab.icon;

    const active = tab.id === activeTab;

    const hasDraft = tabHasUnpublishedDraft(tab.id, draftSections);

    return (

      <button

        key={tab.id}

        type="button"

        onClick={() => onTabChange(tab.id)}

        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${

          active ? raSideNavActiveCls : "admin-surface-body hover:bg-[var(--admin-hover)]"

        }`}

        aria-current={active ? "page" : undefined}

      >

        <Icon
          className={`size-4 shrink-0 ${active ? "text-ra-primary" : "admin-surface-faint"}`}
        />

        <span className="min-w-0 flex-1 leading-tight truncate">{tab.label}</span>

        {hasDraft && (

          <span

            className="size-2 shrink-0 rounded-full bg-amber-400"

            title="Unpublished draft"

          />

        )}

      </button>

    );

  };



  const flatTabs = CUSTOMER_SITE_NAV_GROUPS.flatMap((g) =>

    g.tabIds.map((id) => CUSTOMER_SITE_TABS_BY_ID[id]).filter(Boolean)

  );



  return (

    <>

      <nav

        className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden [scrollbar-width:none]"

        aria-label="Customer site sections"

      >

        {flatTabs.map((tab) => {

          const Icon = tab.icon;

          const active = tab.id === activeTab;

          return (

            <button

              key={tab.id}

              type="button"

              onClick={() => onTabChange(tab.id)}

              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${

                active
                  ? raSideNavActiveCls
                  : "border border-[var(--admin-border-subtle)] admin-surface-body hover:bg-[var(--admin-hover)]"

              }`}

            >

              <Icon
                className={`size-4 shrink-0 ${active ? "text-ra-primary" : "admin-surface-faint"}`}
              />

              {tab.label}

            </button>

          );

        })}

      </nav>



      <aside className="hidden min-w-0 lg:block lg:w-56 lg:shrink-0">

        <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl admin-surface-card p-3 [scrollbar-width:thin]">

          <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wide admin-surface-faint">

            Customer website

          </p>

          {CUSTOMER_SITE_NAV_GROUPS.map((group, gi) => (

            <div key={group.id} className={gi > 0 ? "mt-4 admin-surface-divider-t pt-3" : ""}>

              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider admin-surface-faint">

                {group.label}

              </p>

              <nav className="space-y-0.5" aria-label={group.label}>

                {group.tabIds.map((id) => {

                  const tab = CUSTOMER_SITE_TABS_BY_ID[id];

                  return tab ? renderButton(tab) : null;

                })}

              </nav>

            </div>

          ))}

        </div>

      </aside>

    </>

  );

}


