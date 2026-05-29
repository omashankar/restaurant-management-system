/**
 * Platform backup — exports key collections metadata into `backups` collection.
 */
export async function runPlatformBackup(db, type = "manual") {
  const now = new Date();
  const collections = [
    "restaurants",
    "users",
    "plans",
    "subscriptions",
    "settings",
    "payments",
    "support_tickets",
  ];

  const snapshot = { exportedAt: now.toISOString(), collections: {} };
  let totalDocs = 0;

  for (const name of collections) {
    const col = db.collection(name);
    const count = await col.countDocuments();
    totalDocs += count;
    if (name === "users") {
      const rows = await col
        .find({}, { projection: { email: 1, role: 1, status: 1, createdAt: 1 } })
        .limit(5000)
        .toArray();
      snapshot.collections[name] = { count, sample: rows };
    } else if (name === "settings") {
      const doc = await col.findOne({ _id: "platform" });
      snapshot.collections[name] = {
        count: doc ? 1 : 0,
        sections: doc ? Object.keys(doc).filter((k) => k !== "_id") : [],
      };
    } else {
      const sample = await col.find({}).sort({ createdAt: -1 }).limit(100).toArray();
      snapshot.collections[name] = { count, sampleSize: sample.length };
    }
  }

  const sizeLabel = `${totalDocs} docs`;
  const result = await db.collection("backups").insertOne({
    createdAt: now,
    type,
    status: "completed",
    size: sizeLabel,
    snapshot,
  });

  await db.collection("settings").updateOne(
    { _id: "platform" },
    { $set: { "backup.lastBackupAt": now, updatedAt: now } },
    { upsert: true },
  );

  const settings = await db.collection("settings").findOne({ _id: "platform" });
  const retentionDays = Number(settings?.backup?.retentionDays ?? 30) || 30;
  const cutoff = new Date(now.getTime() - retentionDays * 86_400_000);
  await db.collection("backups").deleteMany({ createdAt: { $lt: cutoff } });

  return {
    id: result.insertedId.toString(),
    createdAt: now,
    type,
    status: "completed",
    size: sizeLabel,
    totalDocs,
  };
}

export function isBackupDue(backupSettings) {
  if (!backupSettings?.autoBackup) return false;
  const last = backupSettings.lastBackupAt
    ? new Date(backupSettings.lastBackupAt)
    : null;
  const schedule = backupSettings.backupSchedule === "weekly" ? 7 : 1;
  const intervalMs = schedule * 24 * 60 * 60 * 1000;
  if (!last || Number.isNaN(last.getTime())) return true;
  return Date.now() - last.getTime() >= intervalMs;
}
