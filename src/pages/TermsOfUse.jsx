import React from "react";
import { Link } from "react-router-dom";

export default function TermsOfUse() {
  return (
    <>
      <LegalStyles />
      <main className="legalPage">
        <div className="legalShell">
          <Link to="/" className="legalBack">← Nazad na MeetOutdoors</Link>
          <header className="legalHero">
            <span>Pravna dokumentacija</span>
            <h1>Uslovi korišćenja</h1>
            <p>Pravila korišćenja MeetOutdoors platforme za korisnike i domaćine.</p>
            <small>Poslednje ažuriranje: 16. septembar 2026.</small>
          </header>
          <article className="legalContent">
            <section><h2>1. O ovim Uslovima</h2><p>Ovi Uslovi uređuju pristup MeetOutdoors web i mobilnoj aplikaciji, profilima, avanturama i događajima, smeštaju, uslugama, iznajmljivanju, mapi, check-in funkciji, recenzijama, sačuvanom sadržaju, Adventure Agent-u i drugim dostupnim funkcijama.</p></section>
            <section><h2>2. Uloga MeetOutdoors-a</h2><p>MeetOutdoors je digitalna platforma za otkrivanje outdoor iskustava i povezivanje korisnika sa nezavisnim domaćinima. Osim kada je izričito drugačije navedeno, MeetOutdoors nije organizator konkretne aktivnosti, pružalac smeštaja, usluge ili iznajmljivanja koje objavljuje nezavisni domaćin.</p></section>
            <section><h2>3. Nalozi</h2><p>Korisnik je odgovoran za tačnost podataka koje unosi i bezbednost svog naloga. Zabranjeni su lažno predstavljanje, prevara, uznemiravanje i neovlašćeno korišćenje tuđih naloga ili podataka.</p></section>
            <section><h2>4. Domaćini i ponude</h2><p>Domaćin je odgovoran da svoju avanturu, događaj, smeštaj, uslugu ili iznajmljivanje predstavi jasno i istinito, uključujući relevantnu cenu, lokaciju, kapacitet, uslove, dostupnost i druge bitne informacije.</p><p>Domaćin je odgovoran za licence, dozvole, osiguranje, kvalifikacije, registracije i druge obaveze kada su potrebne za konkretnu aktivnost ili uslugu.</p></section>
            <section><h2>5. Direktan kontakt</h2><p>MeetOutdoors trenutno omogućava korisniku da pronađe ponudu i kontaktira domaćina direktno preko kontakt podataka koje je domaćin učinio dostupnim. MeetOutdoors trenutno ne vodi sistem rezervacija niti obrađuje plaćanje između korisnika i domaćina. Dogovor o realizaciji, terminu i eventualnom plaćanju odvija se direktno između korisnika i domaćina.</p></section>
            <section><h2>6. Cene i plaćanja</h2><p>Cene prikazane u ponudi određuje domaćin. Ako MeetOutdoors u budućnosti uvede naplatu, pretplatu, proviziju ili obradu plaćanja, relevantni uslovi i cena biće jasno prikazani pre nastanka obaveze.</p></section>
            <section><h2>7. Izmene i otkazivanje aktivnosti</h2><p>Za realizaciju, izmene i otkazivanje konkretne ponude odgovoran je domaćin u skladu sa svojim dogovorom sa korisnikom i primenljivim propisima. Obavezna prava potrošača ne mogu biti isključena ovim Uslovima.</p></section>
            <section><h2>8. Outdoor rizici</h2><p>Outdoor aktivnosti mogu uključivati rizike povezane sa vremenom, terenom, vodom, visinom, fizičkim naporom, opremom, saobraćajem, životinjama i udaljenošću od pomoći. Korisnik treba da proceni svoju spremnost i poštuje bezbednosna uputstva domaćina i nadležnih službi. Domaćin ostaje odgovoran za bezbednosne obaveze koje mu pripadaju po zakonu.</p></section>
            <section><h2>9. Mapa i check-in</h2><p>Mapa i informacije o mestima služe otkrivanju lokacija i ne predstavljaju garanciju bezbednosti, prohodnosti, dozvoljenog pristupa ili trenutnih uslova. Check-in je korisnička funkcija vezana za mesta na platformi i ne predstavlja potvrdu MeetOutdoors-a da je lokacija bezbedna.</p></section>
            <section><h2>10. Adventure Agent</h2><p>Adventure Agent pruža pomoć pri istraživanju outdoor opcija i pronalaženju relevantnih domaćina. AI odgovori mogu sadržati greške ili zastarele informacije i ne treba ih smatrati zamenom za zvanične bezbednosne, vremenske, medicinske ili druge stručne informacije. Kada su uslovi važni za bezbednost, korisnik treba da proveri relevantne zvanične izvore i proceni stvarne uslove.</p></section>
            <section><h2>11. Recenzije i sadržaj</h2><p>Korisnik je odgovoran za fotografije, tekstove, recenzije i drugi sadržaj koji objavljuje i potvrđuje da ima pravo da ga objavi. Zabranjene su lažne, protivpravne ili obmanjujuće objave i sadržaj kojim se krše prava drugih.</p></section>
            <section><h2>12. Zabranjeno ponašanje</h2><ul><li>prevara i lažno predstavljanje;</li><li>nezakonite ili obmanjujuće ponude;</li><li>pretnje, uznemiravanje i govor mržnje;</li><li>zloupotreba tuđih podataka;</li><li>neovlašćen pristup ili ometanje sistema;</li><li>objavljivanje sadržaja kojim se krše prava drugih;</li><li>nuđenje aktivnosti ili usluga protivnih zakonu.</li></ul></section>
            <section><h2>13. Moderacija</h2><p>MeetOutdoors može ukloniti sadržaj ili ograničiti, suspendovati ili ukinuti nalog kada postoje razumni razlozi da je došlo do kršenja Uslova, ugrožavanja korisnika, prevare, bezbednosnog incidenta ili kršenja zakona.</p></section>
            <section><h2>14. Dostupnost platforme</h2><p>Ne garantujemo neprekidan rad bez grešaka, održavanja ili prekida. Funkcije se mogu menjati ili unapređivati.</p></section>
            <section><h2>15. Odgovornost</h2><p>Svaka strana odgovara u skladu sa svojom stvarnom ulogom i primenljivim pravom. MeetOutdoors ne garantuje ponašanje svakog korisnika ili domaćina niti tačnost svake činjenice koju nezavisni korisnik objavi. Ništa u ovim Uslovima ne ograničava odgovornost koju nije dozvoljeno ograničiti zakonom.</p></section>
            <section><h2>16. Brisanje naloga</h2><p>Korisnik može trajno obrisati nalog preko opcije „Uredi profil” → „Obriši nalog”. Dodatna uputstva i alternativni način podnošenja zahteva dostupni su na <Link to="/delete-account">stranici za brisanje naloga</Link>.</p></section>
            <section><h2>17. Privatnost</h2><p>Obrada podataka uređena je <Link to="/privacy">Politikom privatnosti</Link>.</p></section>
            <section><h2>18. Izmene Uslova</h2><p>Uslovi se mogu menjati kada se promene funkcije, način rada ili pravne obaveze. Datum ažuriranja biće prikazan na ovoj stranici.</p></section>
            <section><h2>19. Merodavno pravo</h2><p>Na ove Uslove primenjuje se pravo Republike Srbije, osim kada obavezujući propisi nalažu drugačije. Sporovi će se najpre pokušati rešiti mirnim putem, a nadležnost se određuje prema primenljivim propisima.</p></section>
            <section><h2>20. Kontakt</h2><p>Za pitanja u vezi sa platformom i ovim Uslovima: <a href="mailto:infomeetoutdoors@gmail.com">infomeetoutdoors@gmail.com</a>.</p></section>
          </article>
          <div className="legalLinks"><Link to="/privacy">Politika privatnosti</Link><Link to="/host-terms">Uslovi za domaćine</Link><Link to="/delete-account">Brisanje naloga</Link></div>
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

