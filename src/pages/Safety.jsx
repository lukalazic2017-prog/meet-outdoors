import React from "react";
import { Link } from "react-router-dom";

const items = [
  ["Proceni svoje sposobnosti", "Biraj aktivnosti koje odgovaraju tvom zdravstvenom stanju, iskustvu, kondiciji i opremi. Ako nisi siguran, pitaj domaćina pre prijave."],
  ["Proveri detalje aktivnosti", "Pre polaska proveri lokaciju, trajanje, težinu, visinsku razliku, vremenske uslove, potrebnu opremu, prevoz i pravila domaćina."],
  ["Prati vremenske uslove", "Vreme u prirodi može da se promeni brzo. Ako su uslovi loši ili postoji ozbiljan rizik, aktivnost treba odložiti ili otkazati."],
  ["Koristi odgovarajuću opremu", "Za aktivnosti koje zahtevaju zaštitnu ili specijalizovanu opremu koristi opremu koja je ispravna i primerena aktivnosti."],
  ["Ne ignoriši uputstva domaćina", "Tokom organizovane aktivnosti poštuj bezbednosna pravila, granice grupe i razumne instrukcije osobe koja vodi aktivnost."],
  ["Prijavi zdravstvene okolnosti kada su relevantne", "Ako zdravstvena okolnost može uticati na tvoju bezbednost ili bezbednost grupe, obavesti domaćina u meri u kojoj je to potrebno za bezbedno učešće."],
  ["Ne učestvuj pod dejstvom alkohola ili droga", "Ne ulazi u aktivnosti koje zahtevaju koordinaciju, procenu rizika ili upravljanje vozilima i opremom ako si pod uticajem supstanci koje umanjuju sposobnosti."],
  ["Poštuj prirodu i lokalna pravila", "Ne ostavljaj otpad, ne ugrožavaj životinje, ne ulazi u zabranjene zone i poštuj lokalna pravila, dozvole i ograničenja."],
  ["Hitne situacije", "U hitnoj situaciji prvo kontaktiraj lokalne službe za pomoć. MeetOutdoors nije zamena za policiju, hitnu pomoć, gorsku službu spasavanja ili druge nadležne službe."],
];

export default function Safety() {
  return (
    <main className="safetyPage">
      <div className="safetyShell">
        <Link to="/" className="safetyBack">← Nazad na početnu</Link>

        <header className="safetyHero">
          <span>Bezbednost</span>
          <h1>Priroda je lepša kada joj pristupimo odgovorno.</h1>
          <p>
            Outdoor aktivnosti nose rizike. Ova pravila pomažu korisnicima i
            domaćinima da donose bolje odluke pre i tokom aktivnosti.
          </p>
        </header>

        <div className="safetyGrid">
          {items.map(([title, text], index) => (
            <section key={title} className="safetyCard">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
        </div>

        <section className="riskNotice">
          <h2>Outdoor rizici</h2>
          <p>
            Planinarenje, vožnja bicikla, rafting, skijanje, ronjenje,
            paraglajding, vožnja kvadovima i druge aktivnosti mogu uključivati
            padove, povrede, promenu vremena, teren, vodu, saobraćaj, opremu,
            životinje i druge rizike koji se ne mogu potpuno ukloniti.
          </p>
          <p>
            MeetOutdoors ne može garantovati da je svaka aktivnost bez rizika.
            Svaki korisnik treba razumno da proceni svoje učešće, a domaćin mora
            da preduzme mere koje se razumno očekuju za konkretnu aktivnost.
          </p>
        </section>

        <section className="safetyFooterCard">
          <h2>Za domaćine</h2>
          <p>
            Domaćini imaju dodatne obaveze u vezi sa informacijama, bezbednošću
            i organizacijom aktivnosti.
          </p>
          <Link to="/host-terms">Pogledaj Uslove za domaćine →</Link>
        </section>
      </div>

      <style>{`
        .safetyPage{min-height:100vh;padding:64px 24px 90px;background:#eef2ea;color:#1c2d22;font-family:Inter,system-ui,sans-serif}
        .safetyShell{width:min(1040px,100%);margin:0 auto}
        .safetyBack{display:inline-block;margin-bottom:34px;color:#607067;font-size:12px;font-weight:800;text-decoration:none}
        .safetyHero{padding:38px;border-radius:30px;background:#173925;color:white}
        .safetyHero>span{color:#c9f28c;font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
        .safetyHero h1{max-width:820px;margin:16px 0 0;font-size:clamp(42px,6vw,67px);line-height:1.02;letter-spacing:-.06em}
        .safetyHero p{max-width:690px;margin:21px 0 0;color:rgba(255,255,255,.68);font-size:14px;line-height:1.75}
        .safetyGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}
        .safetyCard{padding:24px;border:1px solid #d8e0d4;border-radius:22px;background:white}
        .safetyCard>span{color:#83a260;font-size:10px;font-weight:900}
        .safetyCard h2{margin:12px 0 0;font-size:16px;letter-spacing:-.025em}
        .safetyCard p{margin:10px 0 0;color:#707d74;font-size:12px;line-height:1.7}
        .riskNotice,.safetyFooterCard{margin-top:18px;padding:28px;border:1px solid #d8e0d4;border-radius:24px;background:white}
        .riskNotice h2,.safetyFooterCard h2{margin:0;font-size:21px}
        .riskNotice p,.safetyFooterCard p{margin:11px 0 0;color:#69766e;font-size:13px;line-height:1.8}
        .safetyFooterCard a{display:inline-block;margin-top:15px;color:#315e3f;font-size:12px;font-weight:900;text-decoration:none}
        @media(max-width:850px){.safetyGrid{grid-template-columns:1fr 1fr}}
        @media(max-width:580px){.safetyPage{padding:32px 15px 65px}.safetyHero{padding:26px;border-radius:24px}.safetyHero h1{font-size:40px}.safetyGrid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
