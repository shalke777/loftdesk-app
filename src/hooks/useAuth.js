import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncData = async (userId) => {
    if (!supabase) return;
    
    try {
      // Pobierz ostatni backup
      const { data, error } = await supabase
        .from('backups')
        .select('backup_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        // Przywróć dane z backupu
        const { restoreBackupSnapshot } = await import('../utils/storage');
        restoreBackupSnapshot(data.backup_data);
        console.log('✅ Dane użytkownika załadowane');
      }
    } catch (e) {
      console.log('Brak backupu - nowy użytkownik');
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncData(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && _event === 'SIGNED_IN') {
        syncData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { 
    user, 
    loading, 
    signUp, 
    signIn, 
    signOut,
    isEnabled: !!supabase 
  };
}