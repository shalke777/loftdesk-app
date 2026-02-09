import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { saveBackupToCloud } from '../utils/cloudBackup';
import { makeBackupSnapshot } from '../utils/storage';

export function useAutoBackup(intervalMinutes = 5) {
  const { user } = useAuth();
  const lastBackupRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;

   const autoSave = async () => {
  if (!user) {
    console.log('⏭️ Użytkownik niezalogowany - pomijam auto-backup');
    return;
  }

  try {
    const currentData = JSON.stringify(makeBackupSnapshot());
    
    if (currentData === lastBackupRef.current) {
      console.log('⏭️ Brak zmian - pomijam backup');
      return;
    }

    await saveBackupToCloud('Auto backup');
    lastBackupRef.current = currentData;
    console.log('✅ Auto-backup zapisany');
  } catch (error) {
    console.error('❌ Auto-backup failed:', error);
  }
};

    // Auto-save co X minut
    intervalRef.current = setInterval(autoSave, intervalMinutes * 60 * 1000);

    // Save przy zamknięciu/odświeżeniu strony
    const handleBeforeUnload = () => {
      if (user) {
        saveBackupToCloud('Auto backup (exit)').catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, intervalMinutes]);
}