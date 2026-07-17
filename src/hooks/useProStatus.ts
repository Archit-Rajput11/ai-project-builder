'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useProStatus(userId?: string) {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      // 1. If userId is provided, query Supabase directly on the client
      if (userId) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('is_pro, current_period_end, expires_at, premium_expires_at')
            .eq('id', userId)
            .single();

          if (!error && data) {
            const dbUser = data as any;
            const expiryString = dbUser.current_period_end || dbUser.expires_at || dbUser.premium_expires_at;
            const isProUser = dbUser.is_pro || dbUser.is_premium;
            const isActive = isProUser && expiryString && new Date(expiryString).getTime() > Date.now();
            if (active) {
              setIsPro(!!isActive);
            }
          }
        } catch (err) {
          console.error('Error verifying pro tier status directly:', err);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
        return;
      }

      // 2. If no userId is passed, fall back to our server status check (keeps existing pages working)
      try {
        const response = await fetch("/api/subscriptions/status");
        if (response.ok) {
          const data = await response.json();
          if (data.isPro && data.token) {
            localStorage.setItem("pro_session", data.token);
            localStorage.setItem("isPremium", "true");
            if (active) {
              setIsPro(true);
            }
          } else {
            localStorage.removeItem("pro_session");
            localStorage.removeItem("isPremium");
            if (active) {
              setIsPro(false);
            }
          }
        }
      } catch (err) {
        console.error("Background subscription sync error:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkStatus();

    return () => {
      active = false;
    };
  }, [userId]);

  return { isPro, loading };
}
