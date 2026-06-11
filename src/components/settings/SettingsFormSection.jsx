"use client";

import AdminSectionHeader from "@/components/ui/AdminSectionHeader";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { resolveSettingsPanelSection } from "@/config/settingsConfig";

/**
 * Settings panel card with icon header (matches Super Admin section pattern).
 * Pass `sectionId` from settingsConfig — title/description/icon resolve automatically.
 */
export default function SettingsFormSection({
  sectionId,
  title,
  description,
  icon,
  children,
}) {
  const meta = sectionId
    ? resolveSettingsPanelSection(sectionId, { title, description, icon, Icon: icon })
    : { title, description, Icon: icon };

  const panelTitle = meta.title;
  const panelDescription = meta.description;
  const PanelIcon = meta.Icon;

  return (
    <section className={`${adminSurface.cardSolid} w-full p-4 sm:p-6`}>
      {PanelIcon && panelTitle ? (
        <AdminSectionHeader
          brand="ra"
          icon={PanelIcon}
          title={panelTitle}
          description={panelDescription}
          className="mb-5"
        />
      ) : (
        <div className="mb-5">
          <h2 className={`text-lg font-semibold ${adminSurface.title}`}>{panelTitle}</h2>
          {panelDescription ? (
            <p className={`mt-1 text-sm ${adminSurface.muted}`}>{panelDescription}</p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}
