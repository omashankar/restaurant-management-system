import { getPublicPlatformConfig } from "@/lib/platformSettings";

export default async function PlatformThemeStyles() {
  const config = await getPublicPlatformConfig();
  const primary = config.theme?.primaryColor ?? "#10b981";
  const accent = config.theme?.accentColor ?? "#f43f5e";

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {
          --platform-primary: ${primary};
          --platform-accent: ${accent};
        }`,
      }}
    />
  );
}
