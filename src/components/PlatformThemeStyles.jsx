import { getPublicPlatformConfig } from "@/lib/platformSettings";

export default async function PlatformThemeStyles() {
  const config = await getPublicPlatformConfig();
  const primary = config.theme?.primaryColor ?? "#a3e635";
  const accent = config.theme?.accentColor ?? "#10b981";

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
