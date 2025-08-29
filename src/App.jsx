import { useState } from "react";

export default function App() {
  const [teams, setTeams] = useState([
    { id: 1, name: "6th Grade", points: 0 },
    { id: 2, name: "7th Grade", points: 0 },
    { id: 3, name: "8th Grade", points: 0 },
  ]);

  const [locked, setLocked] = useState(false);

  const updatePoints = (id, delta) => {
    if (locked) return;
    setTeams(ts =>
      ts.map(t => t.id === id ? { ...t, points: Math.max(0, t.points + delta) } : t)
    );
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>BMS MAP Leaderboard (Simple)</h1>
      {teams.map(t => (
        <div key={t.id} style={{ marginBottom: 12 }}>
          <strong>{t.name}:</strong> {t.points} pts
          <button onClick={() => updatePoints(t.id, -1)} disabled={locked}> - </button>
          <button onClick={() => updatePoints(t.id, 1)} disabled={locked}> + </button>
        </div>
      ))}
      <button onClick={() => setLocked(l => !l)}>
        {locked ? "Unlock" : "Lock"}
      </button>
    </div>
  );
}

