import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <>
      <LegalStyles />
      <main className="legalPage">
        <div className="legalShell">
          <Link to="/" className="legalBack">← Nazad na MeetOutdoors</Link>
          <header className="legalHero">
            <span>Pravna dokumentacija</span>
            <h1>Politika privatnosti</h1>
            <p>Ova Politika objašnjava koje podatke MeetOutdoors obrađuje i kako ih koristimo radi rada platforme.</p>
            <small>Poslednje ažuriranje: 16. septembar 2026.</small>
          </header>

          <div className="legalNotice">
            <strong>Kontakt za privatnost</strong>
            <p>Za pitanja o privatnosti i zahtev za ostvarivanje prava: <a href="mailto:infomeetoutdoors@gmail.com">infomeetoutdoors@gmail.com</a></p>
          </div>

          <article className="legalContent">
            <section><h2>1. O ovoj Politici</h2><p>Politika se odnosi na MeetOutdoors web i mobilnu aplikaciju, korisničke i domaćinske profile, avanture i događaje, smeštaj, usluge, iznajmljivanje, mapu, check-in, sačuvani sadržaj, recenzije, obaveštenja, Adventure Agent i druge funkcije platforme.</p></section>

            <section><h2>2. Rukovalac i kontakt</h2><p>MeetOutdoors je naziv platforme. Za pitanja o obradi podataka, privatnosti i ostvarivanju prava možeš nas kontaktirati na <a href="mailto:infomeetoutdoors@gmail.com">infomeetoutdoors@gmail.com</a>.</p></section>

            <section><h2>3. Podaci koje možemo obrađivati</h2>
              <ul>
                <li>email i podatke potrebne za autentifikaciju naloga;</li>
                <li>ime, korisničko ime, grad, državu, biografiju i ulogu naloga;</li>
                <li>telefon, Instagram, web adresu i druge podatke koje korisnik ili domaćin dobrovoljno objavi;</li>
                <li>profilne, naslovne i druge fotografije ili video sadržaj;</li>
                <li>podatke o avanturama, događajima, smeštaju, uslugama i iznajmljivanju;</li>
                <li>check-in podatke, sačuvani sadržaj i recenzije;</li>
                <li>zahteve i poruke upućene Adventure Agent-u i podatke potrebne za pronalaženje relevantnih domaćina;</li>
                <li>obaveštenja, moderacione i bezbednosne podatke;</li>
                <li>tehničke podatke potrebne za rad, zaštitu i dijagnostiku sistema.</li>
              </ul>
            </section>

            <section><h2>4. Zašto obrađujemo podatke?</h2><p>Podatke koristimo radi kreiranja i održavanja naloga, prikazivanja profila i ponuda, funkcionisanja mape i check-in funkcije, čuvanja sadržaja, recenzija, povezivanja korisnika sa domaćinima, rada Adventure Agent-a, funkcionalnih obaveštenja, bezbednosti, sprečavanja zloupotreba, moderacije i ispunjavanja zakonskih obaveza.</p></section>

            <section><h2>5. Pravni osnov</h2><p>Pravni osnov zavisi od svrhe obrade i može uključivati izvršenje ugovornog odnosa ili radnje na zahtev korisnika, zakonsku obavezu, legitimni interes kada su ispunjeni zakonski uslovi ili saglasnost. Kada se obrada zasniva na saglasnosti, ona se može povući u skladu sa primenljivim propisima.</p></section>

            <section><h2>6. Javni profil i javne ponude</h2><p>Podaci koje korisnik ili domaćin objavi na javnom profilu ili javnoj ponudi mogu biti dostupni drugim korisnicima i posetiocima. Domaćin može dobrovoljno objaviti kontakt i javnu lokaciju; preciznost prikaza lokacije zavisi od podataka koje domaćin unese.</p></section>

            <section><h2>7. Direktan kontakt sa domaćinom</h2><p>MeetOutdoors omogućava otkrivanje domaćina i njihovih ponuda. Kada domaćin objavi kontakt podatke, korisnik može izabrati da ga kontaktira direktno putem dostupnog kanala. MeetOutdoors trenutno ne obrađuje rezervacije niti plaćanja između korisnika i domaćina.</p></section>

            <section><h2>8. Adventure Agent</h2><p>Adventure Agent može obrađivati tekst zahteva korisnika radi pružanja outdoor informacija i pronalaženja relevantnih MeetOutdoors domaćina. Ako ne postoji odgovarajući domaćin, zahtev se ne prosleđuje domaćinima bez potvrde korisnika. Kada korisnik potvrdi aktiviranje relevantnih domaćina, podaci potrebni za taj tok mogu biti obrađeni i prosleđeni u meri potrebnoj za funkciju.</p></section>

            <section><h2>9. Pružaoci tehničkih usluga</h2><p>Za rad platforme koristimo pružaoce tehničke infrastrukture. Supabase se koristi za delove baze podataka, autentifikacije i skladištenja, Vercel za hosting/deployment web aplikacije, a OpenAI tehnologija se koristi za AI funkcionalnosti Adventure Agent-a. Ovi pružaoci mogu obrađivati podatke u meri potrebnoj za pružanje njihovih usluga.</p></section>

            <section><h2>10. Međunarodni prenos</h2><p>Pojedini tehnički pružaoci mogu obrađivati podatke van Republike Srbije. Kada je međunarodni prenos primenljiv, primenjuju se odgovarajući pravni mehanizmi i mere zaštite u skladu sa važećim propisima.</p></section>

            <section><h2>11. Čuvanje podataka</h2><p>Podatke čuvamo onoliko dugo koliko je potrebno za rad naloga i funkcija koje korisnik koristi, bezbednost, rešavanje sporova i zakonske obaveze. Rok može zavisiti od vrste podatka i razloga obrade.</p></section>

            <section><h2>12. Brisanje naloga</h2><p>Korisnik može trajno obrisati nalog direktno u MeetOutdoors aplikaciji preko opcije „Uredi profil” → „Obriši nalog”. Informacije o brisanju i alternativnom zahtevu dostupne su na <Link to="/delete-account">stranici za brisanje naloga</Link>. Za zahtev se može koristiti i <a href="mailto:infomeetoutdoors@gmail.com">infomeetoutdoors@gmail.com</a>.</p><p>Brisanjem naloga uklanjaju se nalog, profil i povezani podaci koji više nisu potrebni, osim podataka koje je potrebno ili dozvoljeno zadržati zbog zakonskih obaveza, bezbednosti, sprečavanja zloupotrebe ili ostvarivanja i odbrane pravnih zahteva.</p></section>

            <section><h2>13. Tvoja prava</h2><p>U skladu sa primenljivim propisima možeš imati pravo na pristup, ispravku, dopunu, brisanje, ograničenje obrade, prenosivost i prigovor. Za ostvarivanje prava piši na <a href="mailto:infomeetoutdoors@gmail.com">infomeetoutdoors@gmail.com</a>. Takođe može postojati pravo na pritužbu nadležnom organu za zaštitu podataka.</p></section>

            <section><h2>14. Bezbednost</h2><p>Primenjujemo tehničke i organizacione mere namenjene zaštiti podataka od neovlašćenog pristupa, gubitka, izmene, otkrivanja i zloupotrebe. Nijedan informacioni sistem ne može garantovati apsolutnu bezbednost.</p></section>

            <section><h2>15. Kolačići i slične tehnologije</h2><p>Možemo koristiti neophodne tehnologije za autentifikaciju, bezbednost i funkcionisanje platforme. Neobavezne tehnologije koristimo samo kada za njih postoji odgovarajući pravni osnov.</p><div className="legalLinks"><Link to="/cookies">Politika kolačića</Link></div></section>

            <section><h2>16. Maloletnici</h2><p>MeetOutdoors nije namenjen nezakonitom prikupljanju podataka dece. Maloletna lica mogu koristiti funkcije platforme samo kada je to dozvoljeno primenljivim pravom i uz potrebnu saglasnost roditelja ili staratelja kada je ona zakonski potrebna.</p></section>

            <section><h2>17. Izmene Politike</h2><p>Politika može biti ažurirana kada se promene funkcije, pružaoci usluga ili pravne obaveze. Datum poslednjeg ažuriranja prikazujemo na vrhu dokumenta.</p></section>

            <section><h2>18. Kontakt</h2><p>Za pitanja o ovoj Politici ili obradi podataka kontaktiraj nas na <a href="mailto:infomeetoutdoors@gmail.com">infomeetoutdoors@gmail.com</a>.</p></section>
          </article>

          <div className="legalLinks"><Link to="/terms">Uslovi korišćenja</Link><Link to="/delete-account">Brisanje naloga</Link><Link to="/cookies">Politika kolačića</Link></div>
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

