import React from "react";
import { Link } from "react-router-dom";

export default function DeleteAccount() {
  return (
    <main className="deletePage">
      <section className="deleteCard">
        <div className="brand">
          <span className="brandIcon">⌁</span>
          <span>MeetOutdoors</span>
        </div>

        <div className="deleteIcon">×</div>

        <span className="eyebrow">UPRAVLJANJE NALOGOM</span>

        <h1>Brisanje MeetOutdoors naloga</h1>

        <p className="lead">
          Korisnici MeetOutdoors aplikacije mogu trajno da obrišu svoj
          nalog direktno iz podešavanja profila.
        </p>

        <div className="steps">
          <div className="step">
            <span>1</span>
            <div>
              <strong>Prijavi se na MeetOutdoors</strong>
              <p>Otvori svoj nalog i idi na svoj profil.</p>
            </div>
          </div>

          <div className="step">
            <span>2</span>
            <div>
              <strong>Otvori „Uredi profil”</strong>
              <p>
                Na dnu stranice nalazi se sekcija „Opasna zona”.
              </p>
            </div>
          </div>

          <div className="step">
            <span>3</span>
            <div>
              <strong>Izaberi „Obriši nalog”</strong>
              <p>
                Za potvrdu trajnog brisanja potrebno je upisati
                „OBRIŠI”.
              </p>
            </div>
          </div>

          <div className="step">
            <span>4</span>
            <div>
              <strong>Potvrdi brisanje</strong>
              <p>
                Nakon potvrde nalog se trajno briše i bićeš odjavljen
                sa MeetOutdoors platforme.
              </p>
            </div>
          </div>
        </div>

        <div className="warning">
          <strong>Šta se dešava sa podacima?</strong>

          <p>
            Brisanjem naloga brišu se profil i podaci direktno povezani
            sa nalogom u skladu sa pravilima čuvanja podataka
            MeetOutdoors platforme. Određeni zapisi mogu biti zadržani
            kada je to potrebno radi bezbednosti, sprečavanja zloupotrebe
            ili ispunjavanja zakonskih obaveza.
          </p>
        </div>

        <p className="irreversible">
          Brisanje naloga je trajno i nije ga moguće poništiti.
        </p>

        <Link to="/login" className="primaryButton">
          Prijavi se na MeetOutdoors
        </Link>

        <Link to="/" className="backLink">
          ← Nazad na MeetOutdoors
        </Link>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .deletePage {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 100px 20px 70px;
          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(151, 190, 113, 0.16),
              transparent 30%
            ),
            #f2f4ed;
          color: #1b3024;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .deleteCard {
          width: min(680px, 100%);
          padding: 44px;
          border: 1px solid rgba(36, 66, 48, 0.1);
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 24px 70px rgba(27, 52, 36, 0.1);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 45px;
          color: #183b27;
          font-size: 15px;
          font-weight: 850;
        }

        .brandIcon {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #173d28;
          color: #d7f4a8;
          font-size: 22px;
        }

        .deleteIcon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin-bottom: 22px;
          border-radius: 17px;
          background: #fff1ef;
          color: #a33c32;
          font-size: 30px;
          font-weight: 400;
        }

        .eyebrow {
          display: block;
          margin-bottom: 10px;
          color: #77965b;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        h1 {
          margin: 0;
          max-width: 560px;
          color: #193225;
          font-size: clamp(36px, 7vw, 54px);
          line-height: 0.98;
          letter-spacing: -0.055em;
        }

        .lead {
          margin: 20px 0 32px;
          color: #738078;
          font-size: 14px;
          line-height: 1.7;
        }

        .steps {
          display: grid;
          gap: 10px;
        }

        .step {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 14px;
          align-items: flex-start;
          padding: 16px;
          border: 1px solid #e1e7de;
          border-radius: 17px;
          background: #fafbf8;
        }

        .step > span {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eaf2df;
          color: #54723d;
          font-size: 12px;
          font-weight: 900;
        }

        .step strong {
          display: block;
          margin-top: 1px;
          font-size: 13px;
        }

        .step p {
          margin: 5px 0 0;
          color: #7b877f;
          font-size: 11px;
          line-height: 1.55;
        }

        .warning {
          margin-top: 24px;
          padding: 18px;
          border: 1px solid #ead8d3;
          border-radius: 18px;
          background: #fff9f7;
        }

        .warning strong {
          display: block;
          color: #713c35;
          font-size: 12px;
        }

        .warning p {
          margin: 8px 0 0;
          color: #826e69;
          font-size: 11px;
          line-height: 1.65;
        }

        .irreversible {
          margin: 20px 0;
          color: #7a8580;
          font-size: 11px;
          line-height: 1.6;
          text-align: center;
        }

        .primaryButton {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          border-radius: 15px;
          background: #173d28;
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 850;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .primaryButton:hover {
          background: #214d35;
          transform: translateY(-1px);
        }

        .backLink {
          display: block;
          width: fit-content;
          margin: 20px auto 0;
          color: #65746a;
          font-size: 11px;
          font-weight: 750;
          text-decoration: none;
        }

        @media (max-width: 600px) {
          .deletePage {
            padding: 78px 14px 40px;
          }

          .deleteCard {
            padding: 27px 20px;
            border-radius: 24px;
          }

          .brand {
            margin-bottom: 34px;
          }

          h1 {
            font-size: 38px;
          }

          .lead {
            font-size: 13px;
          }
        }
      `}</style>
    </main>
  );
}