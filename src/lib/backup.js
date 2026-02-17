export function downloadJson(filename, dataObj) {
  const json = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export async function saveBackupToDb({ supabase, tenantId, payload }) {
  if (!supabase) throw new Error("Supabase nie jest skonfigurowany (ENV).");

  // zamiast getUser() -> bierzemy session (bez wyjątku)
  const { data, error: sErr } = await supabase.auth.getSession();
  if (sErr) throw sErr;

  const userId = data?.session?.user?.id;
  if (!userId) {
    throw new Error("Brak sesji. Zaloguj się w aplikacji i spróbuj ponownie.");
  }

  const { error } = await supabase.from("user_backups").insert({
    user_id: userId,
    tenant_id: tenantId || null,
    payload,
  });

  if (error) throw error;
}

