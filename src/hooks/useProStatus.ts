'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useProStatus() {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkUserSessionAndStatus() {
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

        // 2. Query database directly via server endpoint using service role
        const response = await fetch('/api/subscriptions/status', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        });

        if (response.ok) {
          const statusData = await response.json();
          setIsPro(statusData.isPro === true);
        } else {
          setIsPro(false);
        }
      } catch (err) {
        console.error('Error verifying pro tier status from database:', err);
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    }

    checkUserSessionAndStatus();
  }, []);

  return { isPro, loading };
}
