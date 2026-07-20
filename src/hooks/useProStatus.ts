'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useProStatus() {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkUserSessionAndStatus() {
      try {
        // 1. Get current logged in user session from Supabase
        let user = null;
        const { data: userData, error: authError } = await supabase.auth.getUser();
        
        if (!authError && userData?.user) {
          user = userData.user;
        } else {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            user = sessionData.session.user;
          }
        }

        if (user) {
          // 2. Fetch user profile from Supabase users table (try by ID first, fallback to Email)
          let profile: any = null;

          const { data: profileById } = await supabase
            .from('users')
            .select('is_pro, is_premium, current_period_end, expires_at, premium_expires_at')
            .eq('id', user.id)
            .maybeSingle();

          if (profileById) {
            profile = profileById;
          } else if (user.email) {
            const { data: profileByEmail } = await supabase
              .from('users')
              .select('is_pro, is_premium, current_period_end, expires_at, premium_expires_at')
              .eq('email', user.email)
              .maybeSingle();
            if (profileByEmail) profile = profileByEmail;
          }

          if (profile) {
            // Check if is_pro or is_premium flag is explicitly true
            const isProFlag = profile.is_pro === true || profile.is_premium === true || String(profile.is_pro) === 'true';
            const expiryString = profile.current_period_end || profile.expires_at || profile.premium_expires_at;
            
            const currentTime = new Date();
            const expiryTime = expiryString ? new Date(expiryString) : null;
            const isNotExpired = expiryTime && !isNaN(expiryTime.getTime()) ? expiryTime > currentTime : true;

            const active = isProFlag && isNotExpired;

            if (active) {
              setIsPro(true);
              if (typeof window !== 'undefined') {
                localStorage.setItem('isPremium', 'true');
              }
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error verifying pro tier status directly via Supabase Auth:', err);
      }

      // 3. Fallback check from API / localStorage
      try {
        if (typeof window !== 'undefined') {
          const localIsPremium = localStorage.getItem('isPremium') === 'true';
          const localProSession = !!localStorage.getItem('pro_session');
          if (localIsPremium || localProSession) {
            setIsPro(true);
            setLoading(false);
            return;
          }
        }

        const response = await fetch('/api/subscriptions/status');
        if (response.ok) {
          const statusData = await response.json();
          if (statusData.isPro) {
            setIsPro(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem('isPremium', 'true');
            }
          } else {
            setIsPro(false);
          }
        } else {
          setIsPro(false);
        }
      } catch (fallbackErr) {
        console.error('Pro status fallback check error:', fallbackErr);
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    }

    checkUserSessionAndStatus();
  }, []);

  return { isPro, loading };
}
