import { cookies } from "next/headers";

export function getOfficialSession() {
  const cookieStore = cookies();
  const session = cookieStore.get("official_session");
  if (!session || !session.value) return null;
  try {
    return JSON.parse(session.value);
  } catch (e) {
    return null;
  }
}

export function getAdminSession() {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");
  if (!session || !session.value) return null;
  try {
    return JSON.parse(session.value);
  } catch (e) {
    return null;
  }
}

