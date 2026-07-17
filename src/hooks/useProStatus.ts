import * as React from "react";

export function useProStatus() {
  const [isPro, setIsPro] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem("pro_session");
    if (!token) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      // Base64 URL decode the payload
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = JSON.parse(window.atob(payloadBase64));

      if (decodedPayload && decodedPayload.isPro === true) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedPayload.exp && currentTime < decodedPayload.exp) {
          setIsPro(true);
        } else {
          // Token expired
          localStorage.removeItem("pro_session");
          setIsPro(false);
        }
      } else {
        setIsPro(false);
      }
    } catch (err) {
      console.error("Error decoding pro_session token:", err);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isPro, loading };
}
