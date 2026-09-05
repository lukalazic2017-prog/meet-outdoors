import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <>
      <PrivacyStyles />

      <main className="privacyPage">
        <div className="privacyShell">
          <Link to="/" className="privacyBack">← Nazad na MeetOutdoors</Link>

          <header className="privacyHero">
            <span>Pravna dokumentacija</span>
            <h1>Politika privatnosti</h1>
            <p>Poslednje ažuriranje: 5. septembar 2026.</p>
          </header>

          <div className="privacyNotice">
            <strong>Važno</strong>
            <p>
              MeetOutdoors trenutno nije registrovan kao posebno pravno lice ili
              preduzetnik. Pre komercijalnog lansiranja ovaj dokument mora biti
              dopunjen punim identitetom rukovaoca, adresom i zvaničnim kontaktom
              za pitanja privatnosti.
            </p>
          </div>

          <section>
            <h2>1. O ovoj Politici</h2>
            <p>
              Ova Politika privatnosti objašnjava koje podatke o ličnosti
              MeetOutdoors može da obrađuje, zašto ih obrađuje, kako ih koristi,
              koliko dugo ih čuva, kome ih može učiniti dostupnim i koja prava
              imaju lica na koja se podaci odnose.
            </p>
            <p>
              Politika se odnosi na korišćenje MeetOutdoors web aplikacije i
              funkcija kao što su korisnički i domaćinski nalozi, profili,
              događaji, paketi, rezervacije, interesovanja, zahtevi za avanture,
              ponude domaćina, obaveštenja, sadržaj i bezbednosne funkcije.
            </p>
          </section>

          <section>
            <h2>2. Ko je rukovalac podacima?</h2>
            <p>
              U trenutnoj razvojnoj fazi MeetOutdoors nije registrovan kao
              posebno pravno lice ili preduzetnik. Pre početka poslovanja koje
              zahteva registraciju, ovde će biti navedeni puni podaci rukovaoca:
              naziv ili ime, poslovna odnosno kontakt adresa i zvanični kontakt
              za privatnost.
            </p>
          </section>

          <section>
            <h2>3. Podaci koje možemo obrađivati</h2>
            <p>U zavisnosti od funkcija koje koristiš, to može uključivati:</p>
            <ul>
              <li>podatke naloga, kao što su email adresa i autentifikacioni podaci;</li>
              <li>profilne podatke, kao što su ime, korisničko ime, grad, država i biografija;</li>
              <li>kontakt podatke koje korisnik ili domaćin dobrovoljno unese, uključujući telefon;</li>
              <li>profilnu fotografiju, naslovnu fotografiju i drugi sadržaj koji korisnik postavi;</li>
              <li>podatke o ulozi naloga, na primer korisnik ili domaćin;</li>
              <li>podatke o događajima, paketima, rezervacijama i iskazanom interesovanju;</li>
              <li>podatke iz zahteva za avanturu i ponuda domaćina;</li>
              <li>obaveštenja i podatke potrebne za funkcionisanje komunikacionih tokova platforme;</li>
              <li>podatke o prijavama, moderaciji, statusu naloga i bezbednosnim incidentima kada su potrebni;</li>
              <li>tehničke podatke koje infrastruktura može obrađivati radi rada, bezbednosti i dijagnostike sistema.</li>
            </ul>
          </section>

          <section>
            <h2>4. Zašto obrađujemo podatke?</h2>
            <p>Podatke možemo obrađivati radi:</p>
            <ul>
              <li>kreiranja, autentifikacije i održavanja naloga;</li>
              <li>prikazivanja i uređivanja profila;</li>
              <li>kreiranja i prikazivanja događaja i paketa;</li>
              <li>obrade rezervacija, interesovanja i zahteva korisnika;</li>
              <li>povezivanja korisnika i domaćina;</li>
              <li>slanja funkcionalnih obaveštenja;</li>
              <li>sprečavanja zloupotreba, prevare i neovlašćenog pristupa;</li>
              <li>moderacije i sprovođenja Uslova korišćenja;</li>
              <li>ispunjavanja zakonskih obaveza;</li>
              <li>analitike ili marketinga samo kada postoji odgovarajući pravni osnov, uključujući saglasnost kada je potrebna.</li>
            </ul>
          </section>

          <section>
            <h2>5. Pravni osnov obrade</h2>
            <p>
              Pravni osnov zavisi od konkretne svrhe. Obrada može biti potrebna
              radi izvršenja ugovora ili preduzimanja radnji na zahtev korisnika,
              radi ispunjenja zakonske obaveze, radi legitimnog interesa kada su
              za to ispunjeni zakonski uslovi, ili na osnovu saglasnosti.
            </p>
            <p>
              Kada se obrada zasniva na saglasnosti, saglasnost može biti
              povučena u bilo kom trenutku, bez uticaja na zakonitost obrade
              izvršene pre povlačenja.
            </p>
          </section>

          <section>
            <h2>6. Javni podaci na profilu</h2>
            <p>
              Određeni podaci koje korisnik ili domaćin postavi na javni profil,
              događaj ili paket mogu biti vidljivi drugim korisnicima ili
              posetiocima platforme. Ne treba objavljivati podatke koje korisnik
              ne želi da učini javnim.
            </p>
          </section>

          <section>
            <h2>7. Podaci u zahtevima za avanture</h2>
            <p>
              MeetOutdoors može koristiti podatke iz zahteva za avanturu da bi
              pronašao relevantne domaćine i omogućio slanje ponuda. Identitet i
              direktni kontakt korisnika ne treba otkrivati domaćinu pre faze u
              kojoj je to potrebno za konkretan tok usluge ili kada korisnik na
              to pristane, u skladu sa načinom rada platforme.
            </p>
          </section>

          <section>
            <h2>8. Primaoci i pružaoci usluga</h2>
            <p>
              Podaci mogu biti obrađivani putem tehničkih pružalaca usluga koji
              omogućavaju rad MeetOutdoors-a, kao što su infrastruktura za bazu
              podataka, autentifikaciju, skladištenje datoteka, hosting i
              dostavljanje elektronske pošte.
            </p>
            <p>
              Pre produkcionog lansiranja ovaj odeljak treba uskladiti sa
              stvarno korišćenim dobavljačima i njihovim ulogama. MeetOutdoors
              trenutno koristi Supabase za delove backend infrastrukture i
              autentifikacije i Vercel za hosting/deployment web aplikacije.
            </p>
          </section>

          <section>
            <h2>9. Prenos podataka u druge države</h2>
            <p>
              Tehnički pružaoci usluga mogu obrađivati ili čuvati podatke van
              Republike Srbije. Kada je takav međunarodni prenos podataka
              primenljiv, MeetOutdoors će primenjivati odgovarajući mehanizam i
              mere zaštite koje zahtevaju važeći propisi.
            </p>
          </section>

          <section>
            <h2>10. Koliko dugo čuvamo podatke?</h2>
            <p>
              Podaci se čuvaju samo onoliko dugo koliko je potrebno za svrhu za
              koju su prikupljeni, funkcionisanje naloga, rešavanje sporova,
              bezbednost i ispunjavanje zakonskih obaveza. Različite kategorije
              podataka mogu imati različite rokove čuvanja.
            </p>
            <p>
              Pre produkcionog lansiranja MeetOutdoors treba da usvoji konkretan
              interni raspored čuvanja i brisanja podataka za glavne kategorije
              podataka.
            </p>
          </section>

          <section>
            <h2>11. Brisanje naloga i podataka</h2>
            <p>
              Korisnik može zahtevati brisanje naloga i podataka kada su
              ispunjeni zakonski uslovi. Određeni podaci mogu biti zadržani kada
              je to neophodno radi zakonske obaveze, ostvarivanja ili odbrane
              pravnih zahteva, sprečavanja zloupotrebe ili drugog dozvoljenog
              razloga.
            </p>
          </section>

          <section>
            <h2>12. Tvoja prava</h2>
            <p>
              U skladu sa primenljivim propisima, lice može imati pravo da
              zahteva pristup svojim podacima, ispravku ili dopunu netačnih
              podataka, brisanje, ograničenje obrade, prenosivost kada su
              ispunjeni uslovi, kao i pravo na prigovor u odgovarajućim
              slučajevima.
            </p>
            <p>
              Kada se obrada zasniva na saglasnosti, lice ima pravo da saglasnost
              povuče. Lice takođe može imati pravo da podnese pritužbu
              Povereniku za informacije od javnog značaja i zaštitu podataka o
              ličnosti.
            </p>
          </section>

          <section>
            <h2>13. Bezbednost podataka</h2>
            <p>
              MeetOutdoors primenjuje tehničke i organizacione mere namenjene
              zaštiti podataka od neovlašćenog pristupa, gubitka, izmene,
              otkrivanja ili zloupotrebe. Nijedan informacioni sistem ne može
              garantovati apsolutnu bezbednost, pa se mere zaštite periodično
              preispituju i unapređuju.
            </p>
          </section>

          <section>
            <h2>14. Kolačići i slične tehnologije</h2>
            <p>
              MeetOutdoors koristi neophodne tehnologije za funkcionisanje
              platforme i čuvanje korisničkih izbora. Neobavezne analitičke i
              marketinške tehnologije aktiviraju se samo kada postoji
              odgovarajući pravni osnov i kada je saglasnost potrebna — tek
              nakon izbora korisnika.
            </p>
            <div className="privacyLinks">
              <Link to="/cookies">Politika kolačića</Link>
            </div>
          </section>

          <section>
            <h2>15. Maloletnici</h2>
            <p>
              MeetOutdoors nije namenjen da svesno prikuplja podatke maloletnih
              lica suprotno primenljivim pravilima o saglasnosti i zaštiti dece.
              Pre javnog lansiranja potrebno je definisati minimalni uzrast i
              odgovarajući postupak za naloge maloletnih lica, ako će takvi
              nalozi biti dozvoljeni.
            </p>
          </section>

          <section>
            <h2>16. Automatizacija i preporuke</h2>
            <p>
              MeetOutdoors može koristiti podatke o potražnji i korišćenju
              platforme za generisanje agregiranih uvida i preporuka domaćinima.
              Takve funkcije treba projektovati tako da domaćinima ne otkrivaju
              identitet korisnika kada za to ne postoji potreba ili odgovarajući
              osnov.
            </p>
          </section>

          <section>
            <h2>17. Izmene Politike privatnosti</h2>
            <p>
              Politika može biti ažurirana kada se promene funkcije, pružaoci
              usluga, načini obrade ili pravne obaveze. Datum poslednjeg
              ažuriranja biće prikazan na vrhu dokumenta. Kada je potrebno,
              korisnici će biti dodatno obavešteni o značajnim promenama.
            </p>
          </section>

          <section>
            <h2>18. Kontakt za privatnost</h2>
            <p>
              Pre komercijalnog lansiranja ovde mora biti unet zvaničan kontakt
              za zahteve u vezi sa privatnošću i ostvarivanjem prava, zajedno sa
              punim identitetom rukovaoca.
            </p>
          </section>

          <div className="privacyFinal">
            <Link to="/terms">Uslovi korišćenja</Link>
            <Link to="/cookies">Politika kolačića</Link>
          </div>

          <footer className="privacyFooter">
            <strong>MeetOutdoors</strong>
            <span>Prave avanture. Pravi ljudi.</span>
          </footer>
        </div>
      </main>
    </>
  );
}

function PrivacyStyles() {
  return (
    <style>{`
      .privacyPage{min-height:100vh;padding:80px 20px 110px;background:#f5f6f1;color:#1b2c22;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .privacyShell{width:min(920px,100%);margin:0 auto}
      .privacyBack{color:#68776e;font-size:11px;font-weight:850;text-decoration:none}
      .privacyHero{padding:55px 0 36px;border-bottom:1px solid #dfe5dc}
      .privacyHero>span{display:block;margin-bottom:12px;color:#739454;font-size:10px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}
      .privacyHero h1{margin:0;font-size:clamp(48px,8vw,82px);line-height:.96;letter-spacing:-.07em}
      .privacyHero p{margin:16px 0 0;color:#859088;font-size:11px}
      .privacyNotice{margin-top:26px;padding:18px 20px;border:1px solid #d8e2d2;border-radius:17px;background:#eef4e9}
      .privacyNotice strong{font-size:11px}
      .privacyNotice p{margin:6px 0 0;color:#63715f;font-size:11px;line-height:1.6}
      .privacyShell section{padding:30px 0;border-bottom:1px solid #e1e6df}
      .privacyShell h2{margin:0;font-size:20px;letter-spacing:-.03em}
      .privacyShell section>p{max-width:850px;margin:12px 0 0;color:#66746b;font-size:13px;line-height:1.75}
      .privacyShell ul{margin:15px 0 0;padding-left:22px;color:#66746b;font-size:13px;line-height:1.8}
      .privacyLinks,.privacyFinal{display:flex;flex-wrap:wrap;gap:10px;margin-top:17px}
      .privacyLinks a,.privacyFinal a{padding:10px 13px;border:1px solid #d4ddd1;border-radius:11px;background:white;color:#355442;font-size:10px;font-weight:850;text-decoration:none}
      .privacyFinal{margin-top:30px}
      .privacyFooter{display:flex;justify-content:space-between;gap:20px;padding-top:32px;color:#7b887f;font-size:10px}
      .privacyFooter strong{color:#294132}
      @media(max-width:600px){.privacyPage{padding:55px 16px 85px}.privacyHero{padding-top:42px}.privacyFooter{flex-direction:column;gap:5px}}
    `}</style>
  );
}
