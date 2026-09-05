import React from "react";
import { Link } from "react-router-dom";

export default function TermsOfUse() {
  return (
    <>
      <TermsStyles />

      <main className="termsPage">
        <div className="termsShell">
          <Link to="/" className="termsBack">← Nazad na MeetOutdoors</Link>

          <header className="termsHero">
            <span>Pravna dokumentacija</span>
            <h1>Uslovi korišćenja</h1>
            <p>Poslednje ažuriranje: 5. septembar 2026.</p>
          </header>

          <div className="termsNotice">
            <strong>Važno</strong>
            <p>
              MeetOutdoors je platforma u razvoju i trenutno nije registrovan kao
              posebno pravno lice ili preduzetnik. Podaci o operatoru i kontaktu
              biće ažurirani pre početka poslovanja koje zahteva registraciju.
            </p>
          </div>

          <section>
            <h2>1. O ovim Uslovima</h2>
            <p>
              Ovi Uslovi korišćenja uređuju pristup i korišćenje MeetOutdoors
              platforme, uključujući web aplikaciju, korisničke i domaćinske
              profile, događaje, pakete, rezervacije, zahteve za avanture,
              obaveštenja i druge funkcije dostupne putem platforme.
            </p>
            <p>
              Kreiranjem naloga ili korišćenjem platforme potvrđuješ da si
              pročitao/la i da prihvataš ove Uslove. Ako ih ne prihvataš, nemoj
              koristiti funkcije za koje je prihvatanje Uslova potrebno.
            </p>
          </section>

          <section>
            <h2>2. Uloga MeetOutdoors-a</h2>
            <p>
              MeetOutdoors je digitalna platforma namenjena povezivanju ljudi
              zainteresovanih za aktivnosti na otvorenom sa domaćinima koji
              objavljuju događaje, ture, pakete ili druga outdoor iskustva.
            </p>
            <p>
              Kada određenu uslugu pruža nezavisni domaćin, domaćin je odgovoran
              za tačnost svoje ponude i izvršenje usluge koju nudi, osim u delu
              za koji je po primenljivom pravu odgovoran MeetOutdoors. Samo
              korišćenje platforme ne znači da MeetOutdoors organizuje ili
              neposredno pruža svaku objavljenu outdoor aktivnost.
            </p>
          </section>

          <section>
            <h2>3. Nalozi korisnika i domaćina</h2>
            <p>
              Korisnik je odgovoran za tačnost podataka koje unosi i za čuvanje
              pristupnih podataka svog naloga. Nije dozvoljeno lažno
              predstavljanje, kreiranje naloga u ime drugog lica bez ovlašćenja
              ili korišćenje platforme radi prevare, uznemiravanja ili drugih
              protivpravnih aktivnosti.
            </p>
            <p>
              MeetOutdoors može zahtevati dodatnu proveru podataka ili ograničiti
              funkcionalnosti naloga kada je to razumno potrebno radi
              bezbednosti, sprečavanja zloupotrebe ili poštovanja zakona.
            </p>
          </section>

          <section>
            <h2>4. Obaveze domaćina</h2>
            <p>
              Domaćin je dužan da informacije o događaju, paketu ili drugoj
              ponudi predstavi jasno, istinito i dovoljno precizno. To naročito
              uključuje cenu, lokaciju, termin, trajanje, kapacitet, nivo
              zahtevnosti i bitne uslove učešća kada su primenljivi.
            </p>
            <p>
              Domaćin je odgovoran da poseduje dozvole, licence, osiguranje,
              stručne kvalifikacije ili druga odobrenja kada su ona obavezna za
              konkretnu aktivnost. Domaćin ne sme nuditi uslugu koju po zakonu
              nema pravo da pruža.
            </p>
          </section>

          <section>
            <h2>5. Događaji, paketi i rezervacije</h2>
            <p>
              Objavljena ponuda mora jasno prikazati bitne informacije dostupne
              domaćinu. Rezervacija, zahtev ili iskazivanje interesovanja može
              imati različit status u zavisnosti od konkretne funkcije
              platforme. Korisnik treba da proveri konačne detalje pre nego što
              se obaveže na učešće ili plaćanje.
            </p>
            <p>
              Kada ugovor o konkretnoj outdoor usluzi nastaje između korisnika i
              nezavisnog domaćina, prava i obaveze iz te usluge prvenstveno
              postoje između tih strana, bez isključivanja odgovornosti koju
              MeetOutdoors eventualno ima po obavezujućim propisima.
            </p>
          </section>

          <section>
            <h2>6. Cene, naknade i plaćanja</h2>
            <p>
              Ako platforma uvede naplatu, provizije, pretplate ili obradu
              plaćanja, relevantna cena, naknada i uslovi biće prikazani pre
              nego što korisnik ili domaćin preuzme obavezu plaćanja.
            </p>
            <p>
              MeetOutdoors neće smatrati korisnika obaveznim na plaćanje samo
              zato što je pregledao ponudu ili koristio funkciju koja nije jasno
              označena kao naplatna.
            </p>
          </section>

          <section>
            <h2>7. Otkazivanje, povraćaj i izmene</h2>
            <p>
              Pravila otkazivanja i povraćaja zavise od konkretne usluge,
              statusa domaćina i primenljivih propisa. Kada takva pravila postoje,
              moraju biti dostupna korisniku pre obavezivanja.
            </p>
            <p>
              Nijedna odredba ovih Uslova ne isključuje zakonska prava
              potrošača koja se po primenljivom pravu ne mogu ugovorom
              ograničiti ili isključiti.
            </p>
          </section>

          <section>
            <h2>8. Outdoor rizici i bezbednost</h2>
            <p>
              Aktivnosti na otvorenom mogu uključivati rizike povezane sa
              vremenskim uslovima, terenom, fizičkim naporom, opremom,
              saobraćajem, vodom, visinom, životinjama, udaljenošću od pomoći i
              drugim okolnostima. Korisnik treba da proceni sopstvenu
              zdravstvenu i fizičku spremnost i da poštuje bezbednosna uputstva
              domaćina i nadležnih službi.
            </p>
            <p>
              Domaćin je odgovoran za bezbednosne obaveze koje mu pripadaju kao
              pružaocu konkretne aktivnosti. Ova odredba nije odricanje od
              odgovornosti i ne ograničava odgovornost koju nije dozvoljeno
              isključiti zakonom.
            </p>
          </section>

          <section>
            <h2>9. Zabranjeno ponašanje</h2>
            <p>Nije dozvoljeno koristiti MeetOutdoors za:</p>
            <ul>
              <li>prevaru, lažno predstavljanje ili obmanjujuće ponude;</li>
              <li>pretnje, uznemiravanje, govor mržnje ili nasilje;</li>
              <li>objavljivanje protivpravnog ili tuđeg zaštićenog sadržaja;</li>
              <li>neovlašćeno prikupljanje ili zloupotrebu tuđih podataka;</li>
              <li>ometanje bezbednosti, sistema ili drugih korisnika;</li>
              <li>zaobilaženje tehničkih zaštita ili pokušaje neovlašćenog pristupa;</li>
              <li>nuđenje aktivnosti ili usluga koje su protivne zakonu.</li>
            </ul>
          </section>

          <section>
            <h2>10. Sadržaj korisnika</h2>
            <p>
              Korisnik zadržava prava koja ima na fotografijama, tekstovima,
              video-snimcima i drugom sadržaju koji postavlja. Postavljanjem
              sadržaja korisnik daje MeetOutdoors-u neisključivu dozvolu da taj
              sadržaj tehnički čuva, obrađuje i prikazuje u meri potrebnoj za
              funkcionisanje platforme i funkcije za koju je sadržaj postavljen.
            </p>
            <p>
              Korisnik potvrđuje da ima pravo da objavi sadržaj koji postavlja i
              da njime ne povređuje prava drugih lica.
            </p>
          </section>

          <section>
            <h2>11. Intelektualna svojina MeetOutdoors-a</h2>
            <p>
              Naziv, dizajn, originalni tekstovi, softver, struktura i drugi
              elementi MeetOutdoors platforme mogu biti zaštićeni pravima
              intelektualne svojine. Nije dozvoljeno njihovo neovlašćeno
              kopiranje, prodavanje, preuzimanje ili predstavljanje kao
              sopstvenog proizvoda.
            </p>
          </section>

          <section>
            <h2>12. Moderacija, suspenzija i ukidanje naloga</h2>
            <p>
              MeetOutdoors može ukloniti sadržaj, privremeno ograničiti nalog
              ili ga suspendovati kada postoje razumni razlozi da je došlo do
              kršenja ovih Uslova, ugrožavanja drugih korisnika, prevare,
              bezbednosnog incidenta ili kršenja zakona.
            </p>
            <p>
              Kada okolnosti dozvoljavaju, korisniku će biti omogućeno da dobije
              informaciju o razlogu ograničenja i da se obrati MeetOutdoors-u.
            </p>
          </section>

          <section>
            <h2>13. Dostupnost platforme</h2>
            <p>
              Nastojimo da MeetOutdoors bude pouzdan i bezbedan, ali ne
              garantujemo neprekidan rad bez grešaka, prekida, održavanja ili
              problema koji su van razumne kontrole platforme. Funkcije se mogu
              menjati, unapređivati ili povremeno privremeno obustaviti.
            </p>
          </section>

          <section>
            <h2>14. Odgovornost</h2>
            <p>
              Svaka strana odgovara u skladu sa svojom stvarnom ulogom i
              primenljivim pravom. MeetOutdoors ne garantuje ponašanje svakog
              korisnika ili domaćina niti može unapred proveriti svaku činjenicu
              iz svake objavljene ponude.
            </p>
            <p>
              Ništa u ovim Uslovima ne isključuje ili ograničava odgovornost
              kada takvo isključenje ili ograničenje nije dozvoljeno zakonom,
              uključujući obavezna prava potrošača.
            </p>
          </section>

          <section>
            <h2>15. Privatnost i kolačići</h2>
            <p>
              Obrada podataka o ličnosti uređuje se Politikom privatnosti, a
              korišćenje kolačića i sličnih tehnologija Politikom kolačića.
            </p>
            <div className="termsLinks">
              <Link to="/privacy">Politika privatnosti</Link>
              <Link to="/cookies">Politika kolačića</Link>
            </div>
          </section>

          <section>
            <h2>16. Izmene Uslova</h2>
            <p>
              Ovi Uslovi mogu biti izmenjeni kada se promene funkcije
              platforme, poslovni model ili pravne obaveze. Datum poslednjeg
              ažuriranja biće prikazan na vrhu dokumenta. Za značajne izmene
              možemo zahtevati novo prihvatanje Uslova.
            </p>
          </section>

          <section>
            <h2>17. Merodavno pravo i sporovi</h2>
            <p>
              Na ove Uslove primenjuje se pravo Republike Srbije, osim kada
              obavezujući propisi nalažu primenu drugih pravila. Ova odredba ne
              uskraćuje potrošaču zaštitu koja mu pripada po obavezujućim
              propisima.
            </p>
            <p>
              Strane će najpre pokušati da spor reše mirnim putem. Ako to nije
              moguće, nadležnost se određuje prema primenljivim propisima.
            </p>
          </section>

          <section>
            <h2>18. Kontakt i identitet operatora</h2>
            <p>
              MeetOutdoors trenutno nije registrovan kao posebno pravno lice ili
              preduzetnik. Pre početka registrovane komercijalne delatnosti ovaj
              odeljak mora biti ažuriran tačnim nazivom operatora, adresom,
              kontakt podacima i drugim podacima koje zahtevaju primenljivi
              propisi.
            </p>
          </section>

          <footer className="termsFooter">
            <strong>MeetOutdoors</strong>
            <span>Prave avanture. Pravi ljudi.</span>
          </footer>
        </div>
      </main>
    </>
  );
}

function TermsStyles() {
  return (
    <style>{`
      .termsPage{min-height:100vh;padding:80px 20px 110px;background:#f5f6f1;color:#1b2c22;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .termsShell{width:min(920px,100%);margin:0 auto}
      .termsBack{color:#68776e;font-size:11px;font-weight:850;text-decoration:none}
      .termsHero{padding:55px 0 36px;border-bottom:1px solid #dfe5dc}
      .termsHero>span{display:block;margin-bottom:12px;color:#739454;font-size:10px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}
      .termsHero h1{margin:0;font-size:clamp(48px,8vw,82px);line-height:.96;letter-spacing:-.07em}
      .termsHero p{margin:16px 0 0;color:#859088;font-size:11px}
      .termsNotice{margin-top:26px;padding:18px 20px;border:1px solid #d8e2d2;border-radius:17px;background:#eef4e9}
      .termsNotice strong{font-size:11px}
      .termsNotice p{margin:6px 0 0;color:#63715f;font-size:11px;line-height:1.6}
      .termsShell section{padding:30px 0;border-bottom:1px solid #e1e6df}
      .termsShell h2{margin:0;font-size:20px;letter-spacing:-.03em}
      .termsShell section>p{max-width:850px;margin:12px 0 0;color:#66746b;font-size:13px;line-height:1.75}
      .termsShell ul{margin:15px 0 0;padding-left:22px;color:#66746b;font-size:13px;line-height:1.8}
      .termsLinks{display:flex;flex-wrap:wrap;gap:10px;margin-top:17px}
      .termsLinks a{padding:10px 13px;border:1px solid #d4ddd1;border-radius:11px;background:white;color:#355442;font-size:10px;font-weight:850;text-decoration:none}
      .termsFooter{display:flex;justify-content:space-between;gap:20px;padding-top:32px;color:#7b887f;font-size:10px}
      .termsFooter strong{color:#294132}
      @media(max-width:600px){.termsPage{padding:55px 16px 85px}.termsHero{padding-top:42px}.termsFooter{flex-direction:column;gap:5px}}
    `}</style>
  );
}
