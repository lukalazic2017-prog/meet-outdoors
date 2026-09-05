import React from "react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Uloga domaćina",
    body: [
      "Domaćin je korisnik MeetOutdoors platforme koji kreira, objavljuje ili organizuje događaje, ture, pakete ili druge outdoor aktivnosti.",
      "Domaćin samostalno odgovara za sadržaj svoje ponude, organizaciju aktivnosti, komunikaciju sa učesnicima i izvršenje usluge koju nudi.",
    ],
  },
  {
    title: "2. Tačnost podataka i ponude",
    body: [
      "Domaćin mora da objavljuje tačne, potpune i ažurne informacije o aktivnosti, uključujući lokaciju, datum, vreme, cenu, kapacitet, nivo težine, uslove učešća i sve druge bitne okolnosti.",
      "Nije dozvoljeno objavljivanje obmanjujućih informacija, lažnih referenci, netačnih cena ili sadržaja koji može dovesti korisnika u zabludu.",
    ],
  },
  {
    title: "3. Dozvole, osposobljenost i zakonske obaveze",
    body: [
      "Domaćin je odgovoran da proveri i ispuni sve zakonske, profesionalne, poreske, bezbednosne i administrativne obaveze koje se odnose na aktivnost koju organizuje.",
      "Ako su za određenu aktivnost potrebne licence, dozvole, stručna osposobljenost, registracija, osiguranje ili druga odobrenja, domaćin je dužan da ih poseduje i održava važećim.",
      "MeetOutdoors ne potvrđuje automatski da domaćin ispunjava sve posebne zakonske uslove za konkretnu aktivnost.",
    ],
  },
  {
    title: "4. Bezbednost učesnika",
    body: [
      "Domaćin je dužan da razumno proceni rizike aktivnosti i pre početka jasno obavesti učesnike o važnim rizicima, potrebnoj opremi, fizičkim zahtevima, vremenskim uslovima i pravilima ponašanja.",
      "Domaćin treba da preduzme razumne mere bezbednosti u skladu sa vrstom aktivnosti, lokacijom, vremenskim uslovima, iskustvom učesnika i drugim relevantnim okolnostima.",
      "Ako proceni da uslovi nisu bezbedni, domaćin treba da odloži, izmeni ili otkaže aktivnost.",
    ],
  },
  {
    title: "5. Učesnici i komunikacija",
    body: [
      "Domaćin treba da odgovara na zahteve i pitanja učesnika jasno i blagovremeno i da ne zloupotrebljava njihove kontakt podatke.",
      "Kontakt podaci do kojih domaćin dođe preko MeetOutdoors-a smeju se koristiti samo za komunikaciju povezanu sa konkretnom rezervacijom, događajem ili legitimnim odnosom sa korisnikom.",
    ],
  },
  {
    title: "6. Cena i naplata",
    body: [
      "Domaćin je odgovoran za tačnost prikazane cene i za jasno navođenje šta je u cenu uključeno, a šta nije.",
      "Ako MeetOutdoors u budućnosti uvede sopstveni sistem naplate, provizije ili druge naknade, posebna pravila plaćanja i naknada biće objavljena i primenjiva od trenutka njihovog stupanja na snagu.",
    ],
  },
  {
    title: "7. Otkazivanje i izmene",
    body: [
      "Ako domaćin mora da promeni ili otkaže aktivnost, treba što pre da obavesti prijavljene učesnike.",
      "Domaćin ne treba da zadržava ili obećava povraćaj sredstava suprotno važećim propisima ili pravilima koja su jasno navedena u konkretnoj ponudi.",
    ],
  },
  {
    title: "8. Zabranjeno ponašanje",
    body: [
      "Nije dozvoljeno organizovanje nezakonitih aktivnosti, ugrožavanje učesnika, diskriminacija, uznemiravanje, obmana, zloupotreba podataka, lažno predstavljanje ili korišćenje platforme za aktivnosti koje mogu ozbiljno ugroziti druge.",
      "MeetOutdoors može ograničiti, suspendovati ili ukloniti nalog ili sadržaj kada postoje razumni razlozi da su prekršena pravila platforme ili ugrožena bezbednost korisnika.",
    ],
  },
  {
    title: "9. Sadržaj domaćina",
    body: [
      "Domaćin ostaje odgovoran za fotografije, video zapise, opise, logotipe i druge materijale koje objavljuje.",
      "Objavljivanjem sadržaja domaćin potvrđuje da ima pravo da ga koristi i da sadržaj ne krši prava trećih lica.",
    ],
  },
  {
    title: "10. Odnos sa MeetOutdoors platformom",
    body: [
      "MeetOutdoors je platforma koja povezuje korisnike i domaćine i olakšava otkrivanje, komunikaciju, prijave i organizaciju aktivnosti.",
      "Osim kada je izričito drugačije navedeno, MeetOutdoors nije organizator konkretne aktivnosti koju kreira nezavisni domaćin.",
      "Ništa u ovim Uslovima ne isključuje prava ili odgovornosti koje se po važećem pravu ne mogu isključiti ili ograničiti.",
    ],
  },
  {
    title: "11. Izmene uslova",
    body: [
      "Ovi Uslovi mogu biti izmenjeni kada se promene funkcije platforme, način poslovanja ili pravni zahtevi.",
      "Za značajne izmene korisnici mogu biti obavešteni putem platforme ili drugog odgovarajućeg kanala.",
    ],
  },
];

export default function HostTerms() {
  return (
    <main className="legalPage">
      <div className="legalShell">
        <Link to="/" className="legalBack">← Nazad na početnu</Link>

        <header className="legalHero">
          <span className="legalKicker">MeetOutdoors</span>
          <h1>Uslovi za domaćine</h1>
          <p>
            Pravila za domaćine koji kreiraju i organizuju aktivnosti preko
            MeetOutdoors platforme.
          </p>
          <small>Poslednje ažuriranje: 5. septembar 2026.</small>
        </header>

        <div className="legalNotice">
          <strong>Važno</strong>
          <p>
            Ovi uslovi dopunjuju Uslove korišćenja. Domaćin je odgovoran da
            proveri konkretne pravne i bezbednosne obaveze za aktivnost koju
            organizuje.
          </p>
        </div>

        <article className="legalContent">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section>
            <h2>12. Povezana pravila</h2>
            <p>
              Korišćenjem naloga domaćina prihvataš i{" "}
              <Link to="/terms">Uslove korišćenja</Link>,{" "}
              <Link to="/privacy">Politiku privatnosti</Link> i{" "}
              <Link to="/safety">Bezbednosna pravila</Link>.
            </p>
          </section>
        </article>
      </div>

      <style>{`
        .legalPage{min-height:100vh;padding:64px 24px 90px;background:#f4f5ef;color:#1b2a21;font-family:Inter,system-ui,sans-serif}
        .legalShell{width:min(900px,100%);margin:0 auto}
        .legalBack{display:inline-block;margin-bottom:34px;color:#607067;font-size:12px;font-weight:800;text-decoration:none}
        .legalHero{padding:34px;border:1px solid #dce2da;border-radius:28px;background:white;box-shadow:0 18px 45px rgba(31,50,39,.06)}
        .legalKicker{color:#6d8d50;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
        .legalHero h1{margin:12px 0 0;font-size:clamp(42px,7vw,68px);line-height:1;letter-spacing:-.06em}
        .legalHero p{max-width:650px;margin:18px 0 0;color:#718078;font-size:15px;line-height:1.7}
        .legalHero small{display:block;margin-top:18px;color:#98a098;font-size:10px}
        .legalNotice{margin-top:18px;padding:20px 22px;border:1px solid #d6e4c9;border-radius:20px;background:#f5faef}
        .legalNotice strong{font-size:12px}
        .legalNotice p{margin:6px 0 0;color:#667469;font-size:12px;line-height:1.65}
        .legalContent{margin-top:18px;padding:34px;border:1px solid #dce2da;border-radius:28px;background:white}
        .legalContent section+section{margin-top:34px;padding-top:34px;border-top:1px solid #edf0eb}
        .legalContent h2{margin:0;color:#213127;font-size:19px;letter-spacing:-.025em}
        .legalContent p{margin:12px 0 0;color:#66736b;font-size:13px;line-height:1.8}
        .legalContent a{color:#315e3f;font-weight:800}
        @media(max-width:640px){.legalPage{padding:32px 15px 65px}.legalHero,.legalContent{padding:23px;border-radius:22px}.legalHero h1{font-size:42px}}
      `}</style>
    </main>
  );
}
