import { useGame } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";

const wrap: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "16px",
  zIndex: 10,
  fontFamily: "inherit",
};
const panel: React.CSSProperties = {
  pointerEvents: "auto",
  background: "rgba(15,16,20,0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "#e6e6e6",
  fontSize: 13,
  backdropFilter: "blur(8px)",
};
const button = (active = false, danger = false): React.CSSProperties => ({
  pointerEvents: "auto",
  background: danger ? "#7a2030" : active ? "#a85a18" : "#2a2c33",
  color: "#fff",
  border: `1px solid ${active ? "#ffb060" : "rgba(255,255,255,0.12)"}`,
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 0.3,
});

export function HUD() {
  const burnerOn = useGame((s) => s.burnerOn);
  const toggleBurner = useGame((s) => s.toggleBurner);
  const resetJar = useGame((s) => s.resetJar);
  const resetAll = useGame((s) => s.resetAll);
  const cameraMode = useGame((s) => s.cameraMode);
  const setCameraMode = useGame((s) => s.setCameraMode);
  const entries = useGame((s) => s.jar.entries);
  const danger = useGame((s) => s.jar.danger);
  const tableItemsCount = useGame((s) => s.tableItems.length);

  const counts: Record<string, number> = {};
  for (const e of entries) counts[e.itemId] = (counts[e.itemId] ?? 0) + 1;

  return (
    <div style={wrap}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={panel}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Lab Sim</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>
            Hold an item · drag over jar to drop in · drop on table to leave it · F = camera
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={button(cameraMode === "orbit")}
            onClick={() => setCameraMode(cameraMode === "static" ? "orbit" : "static")}
            title="Toggle camera (F)"
          >
            {cameraMode === "static" ? "Free camera" : "Static camera"} · F
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={panel}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>In the jar</div>
            {entries.length === 0 ? (
              <div style={{ opacity: 0.55 }}>empty</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(counts).map(([id, n]) => (
                  <span
                    key={id}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 12,
                    }}
                  >
                    {ITEMS_BY_ID[id]?.name ?? id}
                    {n > 1 ? ` ×${n}` : ""}
                  </span>
                ))}
              </div>
            )}
            {tableItemsCount > 0 && (
              <div style={{ opacity: 0.55, fontSize: 11, marginTop: 6 }}>
                {tableItemsCount} item{tableItemsCount === 1 ? "" : "s"} on the table
              </div>
            )}
          </div>
          <div style={panel}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ opacity: 0.7, fontSize: 12 }}>Danger</span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  width: 160,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, danger * 100)}%`,
                    height: "100%",
                    background:
                      danger > 0.7 ? "#ff4040" : danger > 0.4 ? "#ffb04a" : "#7afa6e",
                    transition: "width 120ms",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={button(false)} onClick={resetJar} title="Empty the jar">
            Reset jar
          </button>
          <button style={button(false)} onClick={resetAll} title="Clear everything">
            Clear all
          </button>
          <button
            style={button(burnerOn, burnerOn && danger > 0.7)}
            onClick={toggleBurner}
          >
            {burnerOn ? "Burner: ON" : "Burner: OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}
