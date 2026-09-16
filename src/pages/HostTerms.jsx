import React from "react";
import { Link } from "react-router-dom";

export default function HostTerms() {
  return (
    <>
      <LegalStyles />
      <main className="legalPage">
        <div className="legalShell">
          <Link to="/" className="legalBack">← Nazad na početnu</Link>
          <header className="legalHero"><span>MeetOutdoors</span><h1>Uslovi za domaćine</h1><p>Pravila za domaćine koji preko MeetOutdoors-a objavljuju avanture, smeštaj, usluge ili iznajmljivanje.</p><small>Poslednje ažuriranje: 16. septembar 2026.</small></header>
          <div className="legalNotice"><strong>Važno</strong><p>Ovi Uslovi dopunjuju opšte Uslove korišćenja. Domaćin samostalno odgovara za svoju ponudu i zakonske i bezbednosne obaveze povezane sa njom.</p></div>
          <article className="legalContent">
            <section><h2>1. Uloga domaćina</h2><p>Domaćin je korisnik koji objavljuje avanture ili događaje, smeštaj, usluge ili iznajmljivanje. Domaćin odgovara za sadržaj ponude, komunikaciju sa zainteresovanim korisnicima i izvršenje usluge koju nudi.</p></section>
            <section><h2>2. Tačnost ponude</h2><p>Domaćin mora objavljivati tačne, potpune i ažurne informacije koje su bitne za konkretnu ponudu, kao što su lokacija, termin kada je primenljiv, cena, kapacitet, nivo zahtevnosti, uslovi korišćenja i šta je uključeno u ponudu.</p></section>
            <section><h2>3. Dozvole i zakonske obaveze</h2><p>Domaćin je odgovoran za sve licence, dozvole, registracije, osiguranje, poreske, profesionalne i druge obaveze koje se primenjuju na njegovu aktivnost. MeetOutdoors ne potvrđuje automatski da svaki domaćin ispunjava posebne zakonske uslove.</p></section>
            <section><h2>4. Bezbednost</h2><p>Domaćin treba razumno da proceni rizike i korisniku pruži relevantne informacije o opremi, fizičkim zahtevima, vremenskim uslovima, terenu i drugim značajnim okolnostima. Ako uslovi nisu bezbedni, domaćin treba da odloži, izmeni ili otkaže aktivnost kada je to potrebno.</p></section>
            <section><h2>5. Direktna komunikacija</h2><p>Domaćin može na profilu učiniti dostupnim telefon, Instagram, web stranicu i druge podržane kontakt podatke. Kontakt podatke korisnika do kojih zakonito dođe ne sme koristiti za spam, neovlašćeni marketing ili druge svrhe koje nisu opravdane odnosom sa korisnikom.</p></section>
            <section><h2>6. Cena i naplata</h2><p>Domaćin odgovara za tačnost prikazane cene i jasno navođenje šta je uključeno. MeetOutdoors trenutno ne obrađuje plaćanja između korisnika i domaćina. Eventualni dogovor i naplata odvijaju se direktno između njih, u skladu sa primenljivim propisima.</p></section>
            <section><h2>7. Izmene i otkazivanje</h2><p>Ako domaćin promeni ili otkaže dogovorenu aktivnost ili uslugu, treba blagovremeno da obavesti osobe sa kojima je već uspostavio dogovor. Domaćin je odgovoran za poštovanje primenljivih pravila u vezi sa naplatom i eventualnim povraćajem sredstava.</p></section>
            <section><h2>8. Smeštaj, usluge i iznajmljivanje</h2><p>Domaćin koji nudi smeštaj, uslugu ili iznajmljivanje mora jasno opisati šta korisnik dobija, relevantna ograničenja, cenu i bitne uslove. Za bezbednost, zakonitost i ispravnost konkretne usluge ili predmeta odgovara domaćin u meri propisanoj zakonom.</p></section>
            <section><h2>9. Adventure Agent i zahtevi korisnika</h2><p>MeetOutdoors može koristiti Adventure Agent da pronađe domaćine čije deklarisane mogućnosti odgovaraju zahtevu korisnika. Relevantan zahtev može biti prosleđen domaćinu tek kroz predviđeni tok platforme. Domaćin sam odlučuje da li može da odgovori na zahtev i može kreirati odgovarajući događaj ili drugu postojeću vrstu ponude na platformi.</p></section>
            <section><h2>10. Sadržaj domaćina</h2><p>Domaćin odgovara za fotografije, video, tekstove, logotipe i druge materijale koje objavljuje i potvrđuje da ima pravo da ih koristi.</p></section>
            <section><h2>11. Zabranjeno ponašanje</h2><p>Zabranjene su nezakonite ili obmanjujuće ponude, ugrožavanje korisnika, diskriminacija, uznemiravanje, prevara, zloupotreba podataka, lažno predstavljanje i pokušaji zaobilaženja bezbednosnih pravila platforme.</p></section>
            <section><h2>12. Moderacija</h2><p>MeetOutdoors može ukloniti ponudu ili ograničiti, suspendovati ili ukinuti nalog kada postoje razumni razlozi da su prekršena pravila platforme, ugrožena bezbednost korisnika ili prekršen zakon.</p></section>
            <section><h2>13. Odnos sa MeetOutdoors-om</h2><p>MeetOutdoors povezuje korisnike i domaćine i omogućava otkrivanje ponuda i direktan kontakt. Osim kada je izričito drugačije navedeno, MeetOutdoors nije organizator ili pružalac konkretne usluge nezavisnog domaćina.</p></section>
            <section><h2>14. Povezana pravila</h2><p>Korišćenjem naloga domaćina prihvataš <Link to="/terms">Uslove korišćenja</Link>, <Link to="/privacy">Politiku privatnosti</Link> i <Link to="/safety">Bezbednosna pravila</Link>.</p></section>
            <section><h2>15. Kontakt</h2><p>Za pitanja: <a href="mailto:infomeetoutdoors@gmail.com">infomeetoutdoors@gmail.com</a>.</p></section>
          </article>
          <footer className="legalFooter"><strong>MeetOutdoors</strong><span>Prave avanture. Pravi ljudi.</span></footer>
        </div>
      </main>
    </>
  );
}

function LegalStyles() {
  return (
    <style>{`
      .legalPage{min-height:100vh;padding:80px 20px 110px;background:#f5f6f1;color:#1b2c22;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .legalShell{width:min(920px,100%);margin:0 auto}
      .legalBack{color:#68776e;font-size:11px;font-weight:850;text-decoration:none}
      .legalHero{padding:55px 0 36px;border-bottom:1px solid #dfe5dc}
      .legalHero>span{display:block;margin-bottom:12px;color:#739454;font-size:10px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}
      .legalHero h1{margin:0;font-size:clamp(48px,8vw,82px);line-height:.96;letter-spacing:-.07em}
      .legalHero p{max-width:720px;margin:16px 0 0;color:#66746b;font-size:13px;line-height:1.75}
      .legalHero small{display:block;margin-top:14px;color:#859088;font-size:10px}
      .legalNotice{margin-top:26px;padding:18px 20px;border:1px solid #d8e2d2;border-radius:17px;background:#eef4e9}
      .legalNotice strong{font-size:11px}
      .legalNotice p{margin:6px 0 0;color:#63715f;font-size:11px;line-height:1.6}
      .legalContent section{padding:30px 0;border-bottom:1px solid #e1e6df}
      .legalContent h2{margin:0;font-size:20px;letter-spacing:-.03em}
      .legalContent p{max-width:850px;margin:12px 0 0;color:#66746b;font-size:13px;line-height:1.75}
      .legalContent ul{margin:15px 0 0;padding-left:22px;color:#66746b;font-size:13px;line-height:1.8}
      .legalContent a,.legalLinks a{color:#315e3f;font-weight:800}
      .legalLinks{display:flex;flex-wrap:wrap;gap:10px;margin-top:17px}
      .legalLinks a{padding:10px 13px;border:1px solid #d4ddd1;border-radius:11px;background:white;font-size:10px;text-decoration:none}
      .legalFooter{display:flex;justify-content:space-between;gap:20px;padding-top:32px;color:#7b887f;font-size:10px}
      .legalFooter strong{color:#294132}
      @media(max-width:600px){.legalPage{padding:55px 16px 85px}.legalHero{padding-top:42px}.legalHero h1{font-size:42px}.legalFooter{flex-direction:column;gap:5px}}
    `}</style>
  );
}

