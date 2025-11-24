export default function Upgrade() {
  return (
    <div style={{
      padding: 30,
      color: "white",
      textAlign: "center"
    }}>
      <h1>⛔ Trial je istekao</h1>
      <p>Da biste nastavili sa korišćenjem, aktivirajte premium.</p>

      <a
        href="/subscribe"
        style={{
          background: "#22c55e",
          padding: "14px 20px",
          borderRadius: 10,
          color: "black",
          textDecoration: "none",
          display: "inline-block",
          marginTop: 20,
          fontWeight: 700,
        }}
      >
        Aktiviraj Premium – 3€ / mesec
      </a>
    </div>
  );
}