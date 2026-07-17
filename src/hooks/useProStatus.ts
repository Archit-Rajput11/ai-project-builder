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
        
        if (!authError && user) {
          // 2. Fetch that specific user's pro status using their unique device-synced ID
          const { data, error } = await supabase
            .from('users')
            .select('is_pro, current_period_end, expires_at, premium_expires_at')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            const dbUser = data as any;
            const expiryString = dbUser.current_period_end || dbUser.expires_at || dbUser.premium_expires_at;
            const isProUser = dbUser.is_pro || dbUser.is_premium;
            const active = isProUser && expiryString && new Date(expiryString).getTime() > Date.now();
            setIsPro(!!active);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error verifying pro tier status directly via Supabase Auth:', err);
      }

      // 3. Fallback: Ask our NextAuth session endpoint (resilient sync when using NextAuth cookie login)
      try {
        const response = await fetch("/api/subscriptions/status");
        if (response.ok) {
          const data = await response.json();
          if (data.isPro && data.token) {
            localStorage.setItem("pro_session", data.token);
            localStorage.setItem("isPremium", "true");
            setIsPro(true);
          } else {
            localStorage.removeItem("pro_session");
            localStorage.removeItem("isPremium");
            setIsPro(false);
          }
        }
      } catch (err) {
        console.error("Background subscription sync fallback error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUserSessionAndStatus();
  }, []);

  return { isPro, loading };
}
