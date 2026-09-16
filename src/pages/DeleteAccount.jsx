import React from "react";
import { Link } from "react-router-dom";

export default function DeleteAccount() {
  return (
    <main className="deletePage">
      <section className="deleteCard">
        <Link to="/" className="back">← MeetOutdoors</Link>
        <span className="kicker">UPRAVLJANJE NALOGOM</span>
        <h1>Brisanje MeetOutdoors naloga</h1>
        <p className="lead">MeetOutdoors korisnik može trajno obrisati svoj nalog direktno iz aplikacije ili poslati zahtev emailom.</p>

        <div className="steps">
          <div><b>1</b><p><strong>Prijavi se</strong><span>Otvori svoj MeetOutdoors profil.</span></p></div>
          <div><b>2</b><p><strong>Otvori „Uredi profil”</strong><span>Na dnu stranice pronađi „Opasnu zonu”.</span></p></div>
          <div><b>3</b><p><strong>Izaberi „Obriši nalog”</strong><span>Unesi „OBRIŠI” kada aplikacija zatraži potvrdu.</span></p></div>
          <div><b>4</b><p><strong>Potvrdi</strong><span>Nalog se trajno briše i bićeš odjavljen.</span></p></div>
        </div>

        <div className="request">
          <span>NE MOŽEŠ DA PRISTUPIŠ APLIKACIJI?</span>
          <h2>Zatraži brisanje emailom</h2>
          <p>Pošalji zahtev sa email adrese povezane sa MeetOutdoors nalogom. Možemo zatražiti dodatnu potvrdu identiteta pre brisanja kako bismo zaštitili nalog od neovlašćenog zahteva.</p>
          <a href="mailto:infomeetoutdoors@gmail.com?subject=Zahtev%20za%20brisanje%20MeetOutdoors%20naloga">Pošalji zahtev za brisanje</a>
          <small>infomeetoutdoors@gmail.com</small>
        </div>

        <div className="warning"><strong>Šta se briše?</strong><p>Brisanjem se uklanjaju nalog, profil i povezani podaci koji više nisu potrebni za pružanje MeetOutdoors usluge. Određeni podaci mogu biti zadržani kada je to potrebno ili dozvoljeno zbog zakonskih obaveza, bezbednosti, sprečavanja zloupotrebe ili ostvarivanja i odbrane pravnih zahteva.</p></div>
        <p className="final">Brisanje naloga je trajno i ne može se poništiti.</p>
        <div className="links"><Link to="/privacy">Politika privatnosti</Link><Link to="/terms">Uslovi korišćenja</Link></div>
      </section>

      <style>{`
        .deletePage{min-height:100vh;padding:80px 18px;background:#f4f5ef;color:#1b3024;font-family:Inter,system-ui,sans-serif}
        .deleteCard{width:min(680px,100%);margin:auto;padding:42px;border:1px solid #dce2da;border-radius:30px;background:#fff;box-shadow:0 24px 70px rgba(27,52,36,.08)}
        .back{display:inline-block;margin-bottom:46px;color:#66756b;font-size:11px;font-weight:800;text-decoration:none}
        .kicker{display:block;color:#739454;font-size:10px;font-weight:950;letter-spacing:.13em}
        h1{margin:11px 0 0;font-size:clamp(40px,7vw,58px);line-height:.98;letter-spacing:-.06em}
        .lead{margin:18px 0 30px;color:#718078;font-size:14px;line-height:1.7}
        .steps{display:grid;gap:9px}
        .steps>div{display:grid;grid-template-columns:40px 1fr;gap:13px;padding:15px;border:1px solid #e2e7df;border-radius:16px;background:#fafbf8}
        .steps b{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:#eaf2df;color:#55743d;font-size:12px}
        .steps p{margin:0} .steps strong{display:block;font-size:12px} .steps span{display:block;margin-top:4px;color:#7b877f;font-size:11px;line-height:1.5}
        .request{margin-top:24px;padding:22px;border-radius:20px;background:#173d28;color:#fff}
        .request>span{color:#b9d892;font-size:9px;font-weight:900;letter-spacing:.12em}
        .request h2{margin:8px 0 0;font-size:22px;letter-spacing:-.03em}
        .request p{color:#d0ddd4;font-size:11px;line-height:1.65}
        .request a{display:flex;justify-content:center;align-items:center;min-height:48px;margin-top:16px;border-radius:13px;background:#d9f3ad;color:#173d28;font-size:11px;font-weight:900;text-decoration:none}
        .request small{display:block;margin-top:10px;color:#aebdb3;text-align:center;font-size:9px}
        .warning{margin-top:18px;padding:18px;border:1px solid #ead8d3;border-radius:17px;background:#fff9f7}
        .warning strong{font-size:11px;color:#713c35} .warning p{margin:7px 0 0;color:#826e69;font-size:10px;line-height:1.65}
        .final{margin:18px 0;color:#7a8580;font-size:10px;text-align:center}
        .links{display:flex;justify-content:center;gap:14px} .links a{color:#315e3f;font-size:10px;font-weight:800}
        @media(max-width:600px){.deletePage{padding:45px 14px}.deleteCard{padding:25px 20px;border-radius:23px}.back{margin-bottom:35px}h1{font-size:40px}}
      `}</style>
    </main>
  );
}
