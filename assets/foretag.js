/**
 * Quotify — Företag.
 *
 * Uppgifterna som gör en offert till en offert från ett företag: namn,
 * organisationsnummer, adress och kontaktväg. De hamnar i offertens sidfot,
 * och roboten läser dem ur databasen vid varje genomgång.
 *
 * Här finns också personens eget namn, som blir avsändare på offerterna.
 */

(function () {
  "use strict";

  var SV = QV.SV;

  var T = SV ? {
    rubrik: "Företag",
    ingress: "Uppgifterna nedan står i sidfoten på varje offert Quotify skickar. Fyll i dem innan den första offerten går ut.",
    foretaget: "Företaget",
    namn: "Företagsnamn",
    namnHjalp: "Så som det ska stå på offerten.",
    orgnr: "Organisationsnummer",
    telefon: "Telefon",
    webbplats: "Webbplats",
    adressRubrik: "Adress",
    adress: "Gatuadress",
    postnummer: "Postnummer",
    ort: "Ort",
    land: "Land",
    duRubrik: "Du",
    dittNamn: "Ditt namn",
    dittNamnHjalp: "Står som avsändare på de offerter du skickar.",
    epost: "Mejladress",
    epostHjalp: "Den du loggar in med. Går inte att ändra här.",
    spara: "Spara ändringar",
    sparar: "Sparar…",
    sparat: "Sparat.",
    fel: "Kunde inte spara: ",
    namnKravs: "Företagsnamnet kan inte vara tomt.",
    saknas: "Det här saknas fortfarande: ",
    felHamta: "Kunde inte hämta uppgifterna: ",
    ingenProfil: "din profil hittades inte.",
    ingetForetag: "företaget hittades inte.",
    klart: "Alla uppgifter är ifyllda."
  } : {
    rubrik: "Company",
    ingress: "These details appear in the footer of every quote Quotify sends. Fill them in before the first quote goes out.",
    foretaget: "The company",
    namn: "Company name",
    namnHjalp: "As it should read on the quote.",
    orgnr: "Company registration number",
    telefon: "Phone",
    webbplats: "Website",
    adressRubrik: "Address",
    adress: "Street address",
    postnummer: "Postcode",
    ort: "City",
    land: "Country",
    duRubrik: "You",
    dittNamn: "Your name",
    dittNamnHjalp: "Shown as the sender on the quotes you send.",
    epost: "Email address",
    epostHjalp: "The one you sign in with. Can't be changed here.",
    spara: "Save changes",
    sparar: "Saving…",
    sparat: "Saved.",
    fel: "Couldn't save: ",
    namnKravs: "The company name can't be empty.",
    saknas: "Still missing: ",
    felHamta: "Couldn't load your details: ",
    ingenProfil: "your profile was not found.",
    ingetForetag: "the company was not found.",
    klart: "Everything is filled in."
  };

  var KORT = "border: 1px solid #F2EBE8; border-radius: 24px; background: #fff";
  var RUBRIK = "font-family: Archivo, sans-serif; font-weight: 800; letter-spacing: -0.02em";

  var foretag = null;
  var anvandare = null;
  var falt = {};

  function el(tagg, stil, text) {
    var e = document.createElement(tagg);
    if (stil) e.style.cssText = stil;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function textfalt(varde, lag) {
    var i = document.createElement("input");
    i.type = "text";
    i.value = varde || "";
    i.disabled = !!lag;
    i.style.cssText = "font-family: Karla, system-ui, sans-serif; font-size: 14px; padding: 11px 14px; " +
      "border: 1px solid #E6DDD9; border-radius: 14px; width: 100%; box-sizing: border-box; " +
      (lag ? "background: #FAF7F5; color: #6E6560" : "background: #fff; color: #1C1A19");
    return i;
  }

  function faltruta(etikett, hjalp, kontroll) {
    var box = el("label", "display: grid; gap: 5px; min-width: 0");
    box.appendChild(el("span", "font-size: 12.5px; font-weight: 600", etikett));
    box.appendChild(kontroll);
    if (hjalp) box.appendChild(el("span", "font-size: 12px; color: #6E6560", hjalp));
    return box;
  }

  function kort(rubrik) {
    var k = el("div", KORT + "; padding: 20px 22px; display: grid; gap: 16px");
    k.appendChild(el("div", RUBRIK + "; font-size: 16px", rubrik));
    return k;
  }

  function rutnat() {
    return el("div", "display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px");
  }

  // Vilka fält som fortfarande är tomma. Samma lista används av rutan på
  // startsidan, så definitionen ligger på ett ställe.
  function saknade(f) {
    var krav = [["orgnr", T.orgnr], ["telefon", T.telefon], ["adress", T.adress],
                ["postnummer", T.postnummer], ["ort", T.ort]];
    return krav.filter(function (p) { return !(f && f[p[0]]); }).map(function (p) { return p[1]; });
  }

  function rita() {
    var vard = document.getElementById("formular");
    vard.textContent = "";
    vard.style.cssText = "display: grid; gap: 18px";

    // företaget
    var k1 = kort(T.foretaget);
    falt.namn = textfalt(foretag.namn);
    k1.appendChild(faltruta(T.namn, T.namnHjalp, falt.namn));

    var r1 = rutnat();
    falt.orgnr = textfalt(foretag.orgnr);
    falt.telefon = textfalt(foretag.telefon);
    falt.webbplats = textfalt(foretag.webbplats);
    r1.appendChild(faltruta(T.orgnr, "", falt.orgnr));
    r1.appendChild(faltruta(T.telefon, "", falt.telefon));
    r1.appendChild(faltruta(T.webbplats, "", falt.webbplats));
    k1.appendChild(r1);
    vard.appendChild(k1);

    // adressen
    var k2 = kort(T.adressRubrik);
    falt.adress = textfalt(foretag.adress);
    k2.appendChild(faltruta(T.adress, "", falt.adress));
    var r2 = rutnat();
    falt.postnummer = textfalt(foretag.postnummer);
    falt.ort = textfalt(foretag.ort);
    falt.land = textfalt(foretag.land || (SV ? "Sverige" : ""));
    r2.appendChild(faltruta(T.postnummer, "", falt.postnummer));
    r2.appendChild(faltruta(T.ort, "", falt.ort));
    r2.appendChild(faltruta(T.land, "", falt.land));
    k2.appendChild(r2);
    vard.appendChild(k2);

    // personen
    var k3 = kort(T.duRubrik);
    var r3 = rutnat();
    falt.dittNamn = textfalt(falt._profilnamn);
    r3.appendChild(faltruta(T.dittNamn, T.dittNamnHjalp, falt.dittNamn));
    r3.appendChild(faltruta(T.epost, T.epostHjalp, textfalt(anvandare.email, true)));
    k3.appendChild(r3);
    vard.appendChild(k3);

    var spara = el("button", null, T.spara);
    spara.type = "button";
    spara.style.cssText = "font-family: Archivo, sans-serif; font-weight: 600; font-size: 14px; " +
      "padding: 11px 20px; border-radius: 999px; background: #1C1A19; color: #fff; " +
      "border: 0; cursor: pointer; justify-self: start";
    spara.addEventListener("click", function () { sparaAllt(spara); });
    vard.appendChild(spara);
  }

  function ritaStatus() {
    var ruta = document.getElementById("status");
    var kvar = saknade(foretag);
    ruta.hidden = false;
    ruta.style.cssText = "font-size: 13.5px; line-height: 1.55; padding: 12px 16px; border-radius: 16px; " +
      (kvar.length ? "background: #FFF6E9; color: #7A5313" : "background: #EAF6EE; color: #1E5B33");
    ruta.textContent = kvar.length ? T.saknas + kvar.join(", ") : T.klart;
  }

  async function sparaAllt(knappen) {
    var besked = document.getElementById("besked");
    var namn = falt.namn.value.trim();
    if (!namn) { QV.besked(besked, T.namnKravs, "fel"); return; }

    knappen.disabled = true;
    QV.besked(besked, T.sparar, "neutral");

    function eller(v) { return String(v || "").trim() || null; }

    var f = await db.from("companies").update({
      namn: namn,
      orgnr: eller(falt.orgnr.value),
      telefon: eller(falt.telefon.value),
      webbplats: eller(falt.webbplats.value),
      adress: eller(falt.adress.value),
      postnummer: eller(falt.postnummer.value),
      ort: eller(falt.ort.value),
      land: eller(falt.land.value)
    }).eq("id", foretag.id);

    if (f.error) { QV.besked(besked, T.fel + f.error.message, "fel"); knappen.disabled = false; return; }

    var p = await db.from("profiles").update({ namn: eller(falt.dittNamn.value) }).eq("id", anvandare.id);
    knappen.disabled = false;
    if (p.error) { QV.besked(besked, T.fel + p.error.message, "fel"); return; }

    foretag.namn = namn;
    foretag.orgnr = eller(falt.orgnr.value);
    foretag.telefon = eller(falt.telefon.value);
    foretag.webbplats = eller(falt.webbplats.value);
    foretag.adress = eller(falt.adress.value);
    foretag.postnummer = eller(falt.postnummer.value);
    foretag.ort = eller(falt.ort.value);
    foretag.land = eller(falt.land.value);

    var iSidan = document.getElementById("inloggad-som");
    if (iSidan) iSidan.textContent = namn;

    ritaStatus();
    QV.besked(besked, T.sparat, "bra");
  }

  /* ---------- start ---------- */

  (async function () {
    var start = await QV.startaSida("foretag");
    if (!start) return;
    anvandare = start.anvandare;

    var topp = document.getElementById("topp");
    topp.style.cssText = "display: grid; gap: 6px";
    topp.appendChild(el("h1", RUBRIK + "; font-size: 30px; letter-spacing: -0.035em; margin: 0", T.rubrik));
    topp.appendChild(el("p", "font-size: 13.5px; color: #6E6560; margin: 0; max-width: 62ch; line-height: 1.6", T.ingress));

    // Företaget hämtas med alla kolumner här, inte bara de kontovyn delar.
    // Går något fel ska sidan säga det — en tom sida utan förklaring är
    // värre än ett felmeddelande.
    var profil = await db.from("profiles").select("company_id, namn").maybeSingle();
    if (profil.error || !profil.data) {
      QV.besked(document.getElementById("besked"),
        T.felHamta + (profil.error ? profil.error.message : T.ingenProfil), "fel");
      return;
    }
    falt._profilnamn = profil.data.namn;

    var f = await db.from("companies").select("*").eq("id", profil.data.company_id).maybeSingle();
    if (f.error || !f.data) {
      QV.besked(document.getElementById("besked"),
        T.felHamta + (f.error ? f.error.message : T.ingetForetag), "fel");
      return;
    }
    foretag = f.data;

    ritaStatus();
    rita();
  })();
})();
