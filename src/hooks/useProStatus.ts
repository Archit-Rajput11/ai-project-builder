import * as React from "react";

export function useProStatus() {
  const [isPro, setIsPro] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      // 1. First check local token for instant client-side resolution (zero network delay)
      const token = localStorage.getItem("pro_session");
      let localValid = false;

      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const decodedPayload = JSON.parse(window.atob(payloadBase64));

            if (decodedPayload && decodedPayload.isPro === true) {
              const currentTime = Math.floor(Date.now() / 1000);
              if (decodedPayload.exp && currentTime < decodedPayload.exp) {
                if (active) {
                  setIsPro(true);
                  setLoading(false);
                }
                localValid = true;
              }
            }
          }
        } catch (err) {
          console.error("Local token check error:", err);
        }
      }

      // 2. Perform background sync check against database (heals cross-device logins)
      try {
        const response = await fetch("/api/subscriptions/status");
        if (response.ok) {
          const data = await response.json();
          if (data.isPro && data.token) {
            localStorage.setItem("pro_session", data.token);
            localStorage.setItem("isPremium", "true"); // keep backwards-compatible flag
            if (active) {
              setIsPro(true);
            }
          } else {
            // Subscription has expired or does not exist in DB
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
    };

    checkStatus();

    return () => {
      active = false;
    };
  }, []);

  return { isPro, loading };
}
