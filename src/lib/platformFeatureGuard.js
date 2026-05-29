import { getPlatformFeatures, getPlatformSettings } from "@/lib/platformSettings";
import {
  getPlatformFeatureForPath,
  isPlatformFeatureEnabled,
  platformFeatureDisabledResponse,
} from "@/lib/platformFeatures";

/** @param {import("mongodb").Db} [db] */
export async function assertPlatformFeatureForPath(pathname, db) {
  const settings = await getPlatformSettings(db);
  const features = getPlatformFeatures(settings);
  const key = getPlatformFeatureForPath(pathname);
  if (!isPlatformFeatureEnabled(features, key)) {
    return platformFeatureDisabledResponse(key);
  }
  return null;
}
