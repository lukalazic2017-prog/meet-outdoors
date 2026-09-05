import React from "react";
import { Link } from "react-router-dom";
import {
  openCookieSettings,
  getCookieConsent,
} from "../components/CookieConsent";

export default function CookiePolicy() {
  const consent = getCookieConsent();

  return (
    <>
      <CookiePolicyStyles />

      <main className="cookiePolicyPage">
        <div className="cookiePolicyShell">
          <Link to="/" className="cookiePolicyBack">
            ← Nazad na MeetOutdoors
          </Link>

          <header className="cookiePolicyHero">
            <span>Pravna dokumentacija</span>
            <h1>Cookie Policy</h1>
            <p>
              Poslednje ažuriranje: 5. septembar 2026.
            </p>
          </header>

          <section>
            <h2>1. Šta su kolačići i slične tehnologije?</h2>
            <p>
              Kolačići su male datoteke koje web sajt može da sačuva na
              uređaju korisnika. MeetOutdoors može koristiti i slične
              tehnologije, kao što su localStorage i sessionStorage, za
              bezbedan rad platforme, pamćenje korisničkih izbora i, uz
              saglasnost, analitiku ili marketing.
            </p>
          </section>

          <section>
            <h2>2. Koje kategorije koristimo?</h2>

            <div className="policyTable">
              <div className="policyRow policyHead">
                <span>Kategorija</span>
                <span>Svrha</span>
                <span>Saglasnost</span>
              </div>

              <div className="policyRow">
                <strong>Neophodni</strong>
                <span>
                  Prijava, autentifikacija, bezbednost, funkcionalnost
                  platforme i čuvanje cookie izbora.
                </span>
                <span>Nije potrebna za strogo neophodne funkcije.</span>
              </div>

              <div className="policyRow">
                <strong>Analitika</strong>
                <span>
                  Merenje korišćenja platforme i unapređenje korisničkog
                  iskustva.
                </span>
                <span>Koriste se samo nakon saglasnosti.</span>
              </div>

              <div className="policyRow">
                <strong>Marketing</strong>
                <span>
                  Merenje kampanja, oglašavanje i eventualna personalizacija
                  marketing sadržaja.
                </span>
                <span>Koriste se samo nakon saglasnosti.</span>
              </div>
            </div>
          </section>

          <section>
            <h2>3. Trenutno stanje MeetOutdoors platforme</h2>
            <p>
              MeetOutdoors trenutno čuva izbor korisnika o cookie
              podešavanjima u browser storage-u. Ako analitički ili
              marketinški servisi nisu aktivirani na platformi, odobravanje
              tih kategorija samo čuva tvoju preferenciju i ne pokreće servis
              koji nije instaliran.
            </p>
          </section>

          <section>
            <h2>4. Neophodne tehnologije</h2>
            <p>
              Određene tehnologije mogu biti potrebne za autentifikaciju,
              održavanje sesije, zaštitu naloga i druge funkcije koje je
              korisnik izričito zatražio. One se ne koriste za marketinško
              praćenje.
            </p>
          </section>

          <section>
            <h2>5. Analitičke tehnologije</h2>
            <p>
              Ako uvedemo analitički servis, on neće biti aktiviran pre nego
              što korisnik odobri kategoriju „Analitika“, osim ako se radi o
              tehnologiji za koju saglasnost po primenljivom pravu nije
              potrebna. Ova politika će biti ažurirana konkretnim nazivom
              provajdera, svrhom i periodom čuvanja.
            </p>
          </section>

          <section>
            <h2>6. Marketinške tehnologije</h2>
            <p>
              Marketinški alati, uključujući eventualne advertising pixele,
              neće biti aktivirani bez prethodne saglasnosti korisnika. Ako
              uvedemo takve servise, ovde ćemo navesti njihov naziv, svrhu i
              način obrade podataka.
            </p>
          </section>

          <section>
            <h2>7. Kako da promeniš odluku?</h2>
            <p>
              Saglasnost možeš promeniti ili povući u bilo kom trenutku.
              Povlačenje saglasnosti ne utiče na zakonitost obrade koja je
              izvršena pre povlačenja.
            </p>

            <button
              type="button"
              className="policySettingsButton"
              onClick={openCookieSettings}
            >
              Otvori Cookie podešavanja
            </button>

            {consent?.updatedAt && (
              <small className="policyConsentInfo">
                Poslednja odluka sačuvana:{" "}
                {new Date(consent.updatedAt).toLocaleString("sr-Latn-RS")}
              </small>
            )}
          </section>

          <section>
            <h2>8. Browser podešavanja</h2>
            <p>
              Kolačiće i lokalno sačuvane podatke možeš ukloniti i kroz
              podešavanja svog browsera. Brisanje neophodnih podataka može
              dovesti do odjavljivanja ili ponovnog prikazivanja cookie
              bannera.
            </p>
          </section>

          <section>
            <h2>9. Izmene ove politike</h2>
            <p>
              Ovu politiku možemo ažurirati kada uvedemo nove tehnologije,
              servise ili kada to zahtevaju propisi. Kod značajnih promena
              možemo ponovo zatražiti izbor korisnika.
            </p>
          </section>

          <section>
            <h2>10. Kontakt</h2>
            <p>
              Pitanja u vezi sa privatnošću i korišćenjem kolačića mogu se
              poslati preko zvaničnog MeetOutdoors kontakt kanala. Precizni
              podaci rukovaoca biće navedeni u Privacy Policy dokumentu.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

function CookiePolicyStyles() {
  return (
    <style>{`
      .cookiePolicyPage{
        min-height:100vh;
        padding:80px 20px 110px;
        background:#f5f6f1;
        color:#1b2c22;
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }
      .cookiePolicyShell{
        width:min(920px,100%);
        margin:0 auto;
      }
      .cookiePolicyBack{
        color:#68776e;
        font-size:11px;
        font-weight:850;
        text-decoration:none;
      }
      .cookiePolicyHero{
        padding:55px 0 36px;
        border-bottom:1px solid #dfe5dc;
      }
      .cookiePolicyHero>span{
        display:block;
        margin-bottom:12px;
        color:#739454;
        font-size:10px;
        font-weight:950;
        letter-spacing:.13em;
        text-transform:uppercase;
      }
      .cookiePolicyHero h1{
        margin:0;
        font-size:clamp(48px,8vw,82px);
        line-height:.96;
        letter-spacing:-.07em;
      }
      .cookiePolicyHero p{
        margin:16px 0 0;
        color:#859088;
        font-size:11px;
      }
      .cookiePolicyShell section{
        padding:30px 0;
        border-bottom:1px solid #e1e6df;
      }
      .cookiePolicyShell h2{
        margin:0;
        font-size:20px;
        letter-spacing:-.03em;
      }
      .cookiePolicyShell section>p{
        max-width:820px;
        margin:12px 0 0;
        color:#66746b;
        font-size:13px;
        line-height:1.75;
      }
      .policyTable{
        margin-top:18px;
        overflow:hidden;
        border:1px solid #dbe2d9;
        border-radius:17px;
        background:white;
      }
      .policyRow{
        display:grid;
        grid-template-columns:.7fr 1.8fr 1fr;
        gap:18px;
        padding:15px 17px;
        border-top:1px solid #e6eae4;
        color:#68766d;
        font-size:10px;
        line-height:1.55;
      }
      .policyRow:first-child{border-top:0}
      .policyHead{
        background:#edf2e9;
        color:#536458;
        font-weight:900;
      }
      .policyRow strong{color:#263a2e}
      .policySettingsButton{
        min-height:48px;
        margin-top:18px;
        padding:0 18px;
        border:0;
        border-radius:13px;
        background:#193b27;
        color:white;
        cursor:pointer;
        font-size:10px;
        font-weight:900;
      }
      .policyConsentInfo{
        display:block;
        margin-top:10px;
        color:#8a948d;
        font-size:9px;
      }
      @media(max-width:650px){
        .cookiePolicyPage{padding-top:55px}
        .policyRow{
          grid-template-columns:1fr;
          gap:7px;
        }
        .policyHead{display:none}
      }
    `}</style>
  );
}
