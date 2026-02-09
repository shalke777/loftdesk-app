import { supabase } from '../lib/supabase';
import { makeBackupSnapshot, restoreBackupSnapshot } from './storage';

export async function saveBackupToCloud(name = 'Auto backup') {
  if (!supabase) throw new Error('Cloud backup not configured');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const snapshot = makeBackupSnapshot();

  const { data, error } = await supabase
    .from('backups')
    .insert({
      user_id: user.id,
      backup_name: name,
      backup_data: snapshot,
      is_auto: name.includes('Auto'),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listCloudBackups() {
  if (!supabase) throw new Error('Cloud backup not configured');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('backups')
    .select('id, backup_name, created_at, is_auto')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

export async function restoreBackupFromCloud(backupId) {
  if (!supabase) throw new Error('Cloud backup not configured');
  
  const { data, error } = await supabase
    .from('backups')
    .select('backup_data')
    .eq('id', backupId)
    .single();

  if (error) throw error;
  
  restoreBackupSnapshot(data.backup_data);
  return data.backup_data;
}

export async function deleteCloudBackup(backupId) {
  if (!supabase) throw new Error('Cloud backup not configured');
  
  const { error } = await supabase
    .from('backups')
    .delete()
    .eq('id', backupId);

  if (error) throw error;
}

export async function getLatestBackup() {
  if (!supabase) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('backups')
    .select('backup_data, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}