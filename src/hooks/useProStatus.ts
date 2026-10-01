'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useProStatus() {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkUserSessionAndStatus = useCallback(async () => {
    try {
      // 1. Get current logged in session from Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        setIsPro(false);
        setLoading(false);
        return;
      }

      const accessToken = session.access_token;
      const userId = session.user?.id;

      // 2. Query database directly via server endpoint using service role
      let verifiedPro = false;
      try {
        const response = await fetch('/api/subscriptions/status', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        });

        if (response.ok) {
          const statusData = await response.json();
          if (statusData.isPro === true) {
            verifiedPro = true;
          }
        }
      } catch (apiErr) {
        console.warn('Subscription status endpoint query error:', apiErr);
      }

      // 3. Fallback: Query public.users directly using user session (RLS)
      if (!verifiedPro && userId) {
        try {
          const { data: userRow } = await supabase
            .from('users')
            .select('is_pro')
            .eq('id', userId)
            .maybeSingle();

          if (userRow) {
            const isExplicitPro =
              userRow.is_pro === true ||
              String(userRow.is_pro).trim().toLowerCase() === 'true' ||
              userRow.is_pro === 1;

            if (isExplicitPro) {
              verifiedPro = true;
            }
          }
        } catch (dbErr) {
          console.warn('Direct Supabase user query error in useProStatus:', dbErr);
        }
      }

      setIsPro(verifiedPro);
    } catch (err) {
      console.error('Error verifying pro tier status from database:', err);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserSessionAndStatus();

    // Listen for auth state changes (e.g. login, session recovery, GitHub OAuth completion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserSessionAndStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUserSessionAndStatus]);

  return { isPro, loading, refreshProStatus: checkUserSessionAndStatus };
}
