import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

   supabase.auth.getSession().then(({ data: { session } }) => {
  setUser(session?.user ?? null);
  // if (session?.user) {
  //   syncData(session.user.id); // WYŁĄCZONE - ładuj tylko ręcznie
  // }
  setLoading(false);
});
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  // if (session?.user && _event === 'SIGNED_IN') {
  //   syncData(session.user.id); // WYŁĄCZONE
  // }
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