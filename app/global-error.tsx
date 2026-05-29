"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Une erreur critique est survenue</h1>
        <p style={{ maxWidth: "28rem", color: "#666", fontSize: "0.875rem" }}>
          L&apos;application a rencontré un problème inattendu. Recharge la page pour réessayer.
        </p>
        {error.digest ? (
          <p style={{ fontSize: "0.75rem", color: "#999" }}>Référence : {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
