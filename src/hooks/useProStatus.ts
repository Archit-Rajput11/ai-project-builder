'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useProStatus() {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkUserSessionAndStatus() {
      try {
        // 1. Ask Supabase who is logged into this device right now
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setIsPro(false);
          return;
        }

        // 2. Fetch that specific user's pro status records from the DB
        const { data, error } = await supabase
          .from('users')
          .select('is_pro, current_period_end')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          // Strict Date Logic: Checks if 'is_pro' is true AND current time hasn't passed current_period_end
          const currentTime = new Date();
          const expiryTime = new Date(data.current_period_end);
          
          const active = data.is_pro && expiryTime > currentTime;
          setIsPro(active);
        } else {
          setIsPro(false);
        }
      } catch (err) {
        console.error('Error verifying pro tier status:', err);
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    }

    checkUserSessionAndStatus();
  }, []);

  return { isPro, loading };
}
