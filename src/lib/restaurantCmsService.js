/**
 * Restaurant CMS Service (server-only — uses MongoDB)
 * Collection: restaurant_cms — one document per restaurant
 */

import clientPromise from "./mongodb";
import { mergeCmsSection } from "./customerCmsMerge";
import { DEFAULTS, VALID_SECTIONS } from "./restaurantCmsDefaults";

export { DEFAULTS, VALID_SECTIONS } from "./restaurantCmsDefaults";

const COLLECTION = "restaurant_cms";
const VERSION = 1;

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

/** Get CMS doc for a restaurant */
export async function getRestaurantCmsDoc(restaurantId) {
  const db = await getDb();
  return db.collection(COLLECTION).findOne({ restaurantId });
}

function mergeSectionFromDoc(def, stored, section) {
  if (section === "banners") {
    return Array.isArray(stored) && stored.length > 0 ? stored : def;
  }
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    return mergeCmsSection(def, stored);
  }
  if (Array.isArray(def)) {
    return Array.isArray(stored) ? stored : def;
  }
  return stored ?? def;
}

/** Published content merged with defaults (customer-facing). */
export async function getRestaurantCmsContent(restaurantId) {
  const doc = await getRestaurantCmsDoc(restaurantId);
  const content = {};
  for (const section of VALID_SECTIONS) {
    const def = DEFAULTS[section];
    const stored = doc?.[section] ?? null;
    content[section] = mergeSectionFromDoc(def, stored, section);
  }
  return { content, updatedAt: doc?.updatedAt ?? null };
}

/** Admin editor: draft overrides merged on top of published. */
export async function getRestaurantCmsAdminContent(restaurantId) {
  const { content: published, updatedAt } = await getRestaurantCmsContent(restaurantId);
  const doc = await getRestaurantCmsDoc(restaurantId);
  const draft = doc?.draft && typeof doc.draft === "object" ? doc.draft : {};
  const editing = { ...published };
  const draftSections = [];

  for (const section of VALID_SECTIONS) {
    if (draft[section] == null) continue;
    draftSections.push(section);
    const def = DEFAULTS[section];
    if (section === "banners") {
      editing.banners = Array.isArray(draft.banners) ? draft.banners : published.banners;
    } else {
      editing[section] = mergeCmsSection(published[section], draft[section]);
    }
  }

  return { content: editing, published, draftSections, updatedAt };
}

/** Save a section (live) or to draft */
export async function saveSection(restaurantId, section, data, { asDraft = false } = {}) {
  if (!VALID_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`Invalid section: ${section}`), { status: 400 });
  }
  const db = await getDb();
  const now = new Date();
  if (asDraft) {
    await db.collection(COLLECTION).updateOne(
      { restaurantId },
      { $set: { [`draft.${section}`]: data, updatedAt: now, version: VERSION } },
      { upsert: true }
    );
    return { section, asDraft: true, updatedAt: now };
  }
  await db.collection(COLLECTION).updateOne(
    { restaurantId },
    {
      $set: { [section]: data, updatedAt: now, version: VERSION },
      $unset: { [`draft.${section}`]: "" },
    },
    { upsert: true }
  );
  return { section, asDraft: false, updatedAt: now };
}

/** Publish one draft section to live */
export async function publishSection(restaurantId, section) {
  if (!VALID_SECTIONS.includes(section)) {
    throw Object.assign(new Error(`Invalid section: ${section}`), { status: 400 });
  }
  const doc = await getRestaurantCmsDoc(restaurantId);
  const data = doc?.draft?.[section];
  if (data == null) {
    throw Object.assign(new Error(`No draft for section: ${section}`), { status: 400 });
  }
  const db = await getDb();
  const now = new Date();
  await db.collection(COLLECTION).updateOne(
    { restaurantId },
    {
      $set: { [section]: data, updatedAt: now },
      $unset: { [`draft.${section}`]: "" },
    },
    { upsert: true }
  );
  return { section, updatedAt: now };
}

/** Publish all draft sections */
export async function publishAllDrafts(restaurantId) {
  const doc = await getRestaurantCmsDoc(restaurantId);
  const draft = doc?.draft && typeof doc.draft === "object" ? doc.draft : {};
  const sections = Object.keys(draft).filter((s) => VALID_SECTIONS.includes(s));
  if (sections.length === 0) {
    throw Object.assign(new Error("No drafts to publish."), { status: 400 });
  }
  const db = await getDb();
  const now = new Date();
  const $set = { updatedAt: now };
  const $unset = {};
  for (const section of sections) {
    $set[section] = draft[section];
    $unset[`draft.${section}`] = "";
  }
  await db.collection(COLLECTION).updateOne({ restaurantId }, { $set, $unset }, { upsert: true });
  return { sections, updatedAt: now };
}
