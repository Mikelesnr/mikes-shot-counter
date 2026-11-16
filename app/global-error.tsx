"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", padding: "20px", textAlign: "center" }}>
          <h2>Something went wrong!</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>{error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => reset()}
            style={{ padding: "10px 20px", background: "#8E3F1B", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}