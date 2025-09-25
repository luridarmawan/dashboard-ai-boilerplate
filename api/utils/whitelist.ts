
export function safeSort(sortKey?: string | string[]) {
  const allowed: Record<string, string> = {
    created_at: "created_at",
    name: "first_name",
    email: "email",
    updated_at: "updated_at",
  };
  if (!sortKey) return { orderBy: { created_at: "desc" } };
  if (Array.isArray(sortKey)) sortKey = sortKey[0];
  const key = allowed[String(sortKey)];
  if (!key) return { orderBy: { created_at: "desc" } };
  return { orderBy: { [key]: "desc" as const } };
}

