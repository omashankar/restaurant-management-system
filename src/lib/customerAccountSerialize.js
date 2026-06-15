/** Shape returned to the customer app from auth/profile APIs. */
export function serializeCustomerUser(account) {
  if (!account) return null;
  return {
    id: String(account._id),
    name: account.name ?? "",
    phone: account.phone ?? "",
    email: account.email ?? "",
    address: account.address ?? "",
    avatarUrl: account.avatarUrl ?? "",
    hasPassword: Boolean(account.passwordHash),
    walletBalance: Number(account.walletBalance ?? 0),
    rewardPoints: Number(account.rewardPoints ?? 0),
    createdAt: account.createdAt ?? null,
  };
}
