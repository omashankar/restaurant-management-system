/**
 * /r/[slug]  →  /r/[slug]/home pe redirect
 *
 * Middleware /r/[slug]/* ko rewrite karta hai, lekin
 * agar koi sirf /r/pizza-palace pe jaaye to yahan redirect hoga.
 */

import { redirect } from "next/navigation";

export default async function RestaurantSlugRootPage({ params }) {
  const { slug } = await params;
  redirect(`/r/${slug}/home`);
}
