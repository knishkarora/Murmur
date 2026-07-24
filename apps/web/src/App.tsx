import { useEffect, useState } from "react";
import { Sparkles, Activity, CheckCircle2, ArrowRight } from "lucide-react";

export function App() {
  const [apiStatus, setApiStatus] = useState<string>("Checking API...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setApiStatus(`API Online (${data.service})`);
        } else {
          setApiStatus("API returned unknown status");
        }
      })
      .catch(() => {
        setApiStatus("API Offline (Will connect when server starts)");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "600px", width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "1rem", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", padding: "0.5rem", borderRadius: "0.75rem", display: "flex" }}>
            <Sparkles style={{ width: "24px", height: "24px", color: "white" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700", color: "#f8fafc" }}>Murmur</h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>AI Progress Companion</p>
          </div>
        </div>

        <p style={{ color: "#cbd5e1", lineHeight: "1.6", marginBottom: "1.5rem" }}>
          Inspired by a <em>murmuration</em> — turning tiny, daily micro-actions into massive life and career direction without decision fatigue.
        </p>

        <div style={{ background: "#1e293b", borderRadius: "0.75rem", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity style={{ width: "18px", height: "18px", color: loading ? "#eab308" : "#22c55e" }} />
            <span style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>Backend Gateway</span>
          </div>
          <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", background: loading ? "#854d0e" : "#14532d", color: loading ? "#fef08a" : "#86efac" }}>
            {apiStatus}
          </span>
        </div>

        <div style={{ borderTop: "1px solid #334155", paddingTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Slice 1 Foundation Ready</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#a855f7", fontSize: "0.875rem", fontWeight: "600" }}>
            <span>Next: Slice 2 (Auth & DB)</span>
            <ArrowRight style={{ width: "16px", height: "16px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
