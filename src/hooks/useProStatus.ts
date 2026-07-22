'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useProStatus() {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkUserSessionAndStatus() {
      try {
        // 1. Get the Supabase session and access token
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!session) {
          // No active session — user is not logged in
          setIsPro(false);
          setLoading(false);
          return;
        }

        const accessToken = session.access_token;
        const user = session.user;

        // 2. Call the server-side status API, passing the Supabase Bearer token
        //    This uses supabaseAdmin on the backend which bypasses RLS entirely
        const response = await fetch('/api/subscriptions/status', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const statusData = await response.json();

          if (statusData.isPro === true) {
            setIsPro(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem('isPremium', 'true');
              // Store JWT token if provided for generate-plan API
              if (statusData.token) {
                localStorage.setItem('pro_session', statusData.token);
              }
            }
            setLoading(false);
            return;
          }
        }

        // 3. Fallback: check localStorage (in case of transient API failures)
        if (typeof window !== 'undefined') {
          const localIsPremium = localStorage.getItem('isPremium') === 'true';
          if (localIsPremium) {
            setIsPro(true);
            setLoading(false);
            return;
          }
        }

        // No pro status found
        setIsPro(false);
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
