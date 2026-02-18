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

  const { data: u, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  const userId = u?.user?.id;
  if (!userId) throw new Error("Brak zalogowanego usera.");

  const { error } = await supabase.from("user_backups").insert({
    user_id: userId,
    tenant_id: tenantId || null,
    payload
  });

  if (error) throw error;
}
