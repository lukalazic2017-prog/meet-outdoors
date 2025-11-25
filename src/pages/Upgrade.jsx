export default function Upgrade() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #091a14, #0c3328, #0f5c46)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Poppins, sans-serif",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "45px 32px",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow:
            "0 25px 50px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.25)",
          textAlign: "center",
          animation: "fadeSlideIn 1s ease",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "12px",
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Subscription Required
        </h1>

        <p
          style={{
            fontSize: "15px",
            opacity: 0.85,
            lineHeight: 1.6,
            marginBottom: "30px",
          }}
        >
          Please subscribe to continue using the Meet Outdoors application.
        </p>

        <a
          href="/subscribe"
          style={{
            display: "block",
            padding: "15px 20px",
            borderRadius: "14px",
            fontSize: "18px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #22c55e, #4ade80, #16a34a)",
            color: "#062a1e",
            textDecoration: "none",
            boxShadow:
              "0 12px 25px rgba(0,0,0,0.45), 0 0 14px rgba(34,197,94,0.4)",
            transition: "0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.boxShadow =
              "0 16px 30px rgba(0,0,0,0.55), 0 0 20px rgba(34,197,94,0.55)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow =
              "0 12px 25px rgba(0,0,0,0.45), 0 0 14px rgba(34,197,94,0.4)";
          }}
        >
          🟢 Subscribe — €3 / month
        </a>

        <p
          style={{
            marginTop: "25px",
            opacity: 0.75,
            fontSize: "14px",
            lineHeight: 1.4,
          }}
        >
          Access all tours, group chat,  
          and upcoming outdoor features.
        </p>
      </div>

      {/* ANIMATION KEYFRAMES */}
      <style>
        {`
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
      </style>
    </div>
  );
}