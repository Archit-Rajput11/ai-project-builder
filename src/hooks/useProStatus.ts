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
          .select('is_pro, is_premium, current_period_end, expires_at, premium_expires_at')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          const isProUser = Boolean(data.is_pro || data.is_premium);
          const expiryString = data.current_period_end || data.expires_at || data.premium_expires_at;
          const currentTime = new Date();
          const expiryTime = expiryString ? new Date(expiryString) : null;
          
          // Active if is_pro is true AND (either no expiry set or current time hasn't passed expiry)
          const active = isProUser && (expiryTime ? expiryTime > currentTime : true);
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
