/**
 * Quotify — det som är gemensamt för de inloggade sidorna.
 *
 * Offerter, Katalog, Mallar och Historik delar sidokolumn, formatering och
 * sättet att ta reda på vilket företag man tillhör. Allt sådant ligger här,
 * så att en ändring slår igenom på alla fyra sidorna i båda språken.
 *
 * Kräver supabase.js och auth.js före sig.
 */

(function () {
  "use strict";

  var SV = (document.documentElement.lang || "sv").toLowerCase().indexOf("en") !== 0;

  /* ---------- sidokolumnen ---------- */

  // Ikonerna är samma streckteckningar som i designen. Varje post pekar på en
  // riktig sida; ingen av dem är en attrapp.
  var IKONER = {
    offerter: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path><path d="M14 2v5h6"></path>',
    katalog: '<path d="M3 3h18v18H3z"></path><path d="M3 9h18M3 15h18M9 3v18M15 3v18"></path>',
    mallar: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path>',
    historik: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2.5"></path>',
    foretag: '<path d="M3 21h18"></path><path d="M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16"></path><path d="M13 9h5a1 1 0 0 1 1 1v11"></path><path d="M8 8h1M8 12h1M8 16h1"></path>',
    hjalp: '<circle cx="12" cy="12" r="9"></circle><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7"></path><path d="M12 17h.01"></path>',
    utloggning: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path>'
  };

  var POSTER = [
    { id: "offerter", fil: "dashboard.html", sv: "Offerter", en: "Quotes" },
    { id: "katalog", fil: "katalog.html", sv: "Katalog", en: "Catalogue" },
    { id: "mallar", fil: "mallar.html", sv: "Mallar", en: "Templates" },
    { id: "historik", fil: "historik.html", sv: "Historik", en: "History" },
    { id: "foretag", fil: "foretag.html", sv: "Företag", en: "Company" }
  ];

  function ikon(namn) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" style="flex: none">' + IKONER[namn] + "</svg>";
  }

  function ritaSidokolumn(aktiv) {
    var vard = document.getElementById("sidokolumn");
    if (!vard) return;

    var bas = "display: flex; align-items: center; gap: 10px; padding: 11px 12px; " +
      "border-radius: 14px; font-size: 14.5px; line-height: 1.3";
    var vald = bas + "; background: #1C1A19; color: #fff; font-weight: 600";
    var ovald = bas + "; font-weight: 500; color: #4B4442";

    var html = '<div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; ' +
      'text-transform: uppercase; color: #756B66; padding: 6px 12px 12px; line-height: 1.5; ' +
      'overflow-wrap: anywhere; word-break: break-word; min-height: 1em" id="inloggad-som"></div>';

    POSTER.forEach(function (p) {
      var text = SV ? p.sv : p.en;
      html += '<a href="' + p.fil + '" style="' + (p.id === aktiv ? vald : ovald) + '"' +
        (p.id === aktiv ? "" : ' class="hv-paper"') + ">" + ikon(p.id) + text + "</a>";
    });

    html += '<div style="height: 1px; background: #F2EBE8; margin: 10px 12px"></div>';
    html += '<a href="help.html" style="' + ovald + '" class="hv-paper">' + ikon("hjalp") +
      (SV ? "Hjälp" : "Help") + "</a>";
    html += '<button type="button" id="knapp-logga-ut" style="width: 100%; border: 0; ' +
      'background: transparent; font-family: Karla, system-ui, sans-serif; text-align: left; ' +
      'cursor: pointer; ' + ovald + '" class="hv-paper">' + ikon("utloggning") +
      (SV ? "Logga ut" : "Log out") + "</button>";

    vard.innerHTML = html;
    vard.style.cssText = "border: 1px solid #F2EBE8; border-radius: 24px; background: #fff; " +
      "padding: 18px 16px; display: grid; gap: 4px; align-content: start";

    var ut = document.getElementById("knapp-logga-ut");
    if (ut) ut.addEventListener("click", function (e) { e.preventDefault(); loggaUt(); });
  }

  /* ---------- formatering ---------- */

  // Ören visas bara när de finns. En katalogpost på 129,50 ska inte se ut som
  // 130 kr, men en offert på 51 460 ska inte få ett onödigt ",00".
  function kr(n) {
    var v = Number(n) || 0;
    var heltal = Math.abs(v % 1) < 0.005;
    return new Intl.NumberFormat("sv-SE", {
      minimumFractionDigits: heltal ? 0 : 2,
      maximumFractionDigits: heltal ? 0 : 2
    }).format(v) + " kr";
  }

  var MANADER = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function tid(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var k = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    if (d.toDateString() === new Date().toDateString()) return (SV ? "idag " : "today ") + k;
    return SV
      ? d.getDate() + " " + MANADER[d.getMonth()] + " " + k
      : MONTHS[d.getMonth()] + " " + d.getDate() + ", " + k;
  }

  function manadsrubrik(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return SV ? "Utan datum" : "No date";
    return (SV ? MANADER[d.getMonth()] : MONTHS[d.getMonth()]) + " " + d.getFullYear();
  }

  function storlek(bytes) {
    var b = Number(bytes) || 0;
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return Math.round(b / 1024) + " kB";
    return (b / (1024 * 1024)).toFixed(1).replace(".", SV ? "," : ".") + " MB";
  }

  /* ---------- små byggstenar ---------- */

  function tomruta(titel, text) {
    var d = document.createElement("div");
    d.style.cssText = "padding: 54px 24px; text-align: center";
    var h = document.createElement("div");
    h.style.cssText = "font-family: Archivo, sans-serif; font-weight: 800; font-size: 17px; " +
      "letter-spacing: -0.02em; margin-bottom: 7px";
    h.textContent = titel;
    var p = document.createElement("p");
    p.style.cssText = "font-size: 13.5px; line-height: 1.6; color: #6E6560; margin: 0 auto; max-width: 40ch";
    p.textContent = text || "";
    d.appendChild(h);
    d.appendChild(p);
    return d;
  }

  // Ett litet meddelande högst upp i en sektion: sparat, misslyckades, pågår.
  function besked(el, text, typ) {
    if (!el) return;
    var farger = {
      bra: ["#EAF6EE", "#1E5B33"],
      fel: ["#FDECE8", "#8E2F1B"],
      neutral: ["#F5F0EE", "#4B4442"]
    }[typ || "neutral"];
    el.hidden = false;
    el.style.cssText = "font-size: 13.5px; line-height: 1.5; padding: 11px 15px; " +
      "border-radius: 14px; background: " + farger[0] + "; color: " + farger[1];
    el.textContent = text;
  }

  function doljBesked(el) {
    if (el) el.hidden = true;
  }

  /* ---------- företaget man tillhör ---------- */

  // Att slå upp företaget kostar två anrop i följd: först profilen, sedan
  // företaget. Görs det om på varje sida står användaren och väntar i onödan
  // varje gång hen klickar i sidokolumnen. Svaret sparas därför i fliken och
  // återanvänds tills något ändrar det.
  var _foretag = null;
  var NYCKEL = "quotify-foretag";

  function franFliken() {
    try {
      var rå = sessionStorage.getItem(NYCKEL);
      if (!rå) return null;
      var sparad = JSON.parse(rå);
      // Bara den inloggades eget företag, och inget som hunnit bli gammalt.
      if (!sparad || Date.now() - sparad.tid > 5 * 60 * 1000) return null;
      return sparad;
    } catch (e) {
      return null;
    }
  }

  function tillFliken(anvandarId, foretag) {
    try {
      sessionStorage.setItem(NYCKEL, JSON.stringify({
        tid: Date.now(), anvandare: anvandarId, foretag: foretag
      }));
    } catch (e) {}
  }

  // Anropas när något sparats som gör den sparade kopian felaktig.
  function glomForetag() {
    _foretag = null;
    try { sessionStorage.removeItem(NYCKEL); } catch (e) {}
  }

  async function mittForetag(anvandarId) {
    if (_foretag) return _foretag;

    var sparad = franFliken();
    if (sparad && (!anvandarId || sparad.anvandare === anvandarId)) {
      _foretag = sparad.foretag;
      return _foretag;
    }

    var profil = await db.from("profiles").select("company_id").maybeSingle();
    if (profil.error || !profil.data) return null;

    // Alla kolumner: startsidan kontrollerar om företagsuppgifterna är
    // ifyllda, och Mallar behöver logotyp och färg.
    var f = await db
      .from("companies")
      .select("*")
      .eq("id", profil.data.company_id)
      .maybeSingle();

    if (f.error || !f.data) return null;
    _foretag = f.data;
    if (anvandarId) tillFliken(anvandarId, _foretag);
    return _foretag;
  }

  // Namnet högst upp i sidokolumnen: företagets namn om det finns, annars
  // mejladressen.
  function visaInloggad(anvandare, foretag) {
    var el = document.getElementById("inloggad-som");
    if (!el) return;
    var namn = (foretag && foretag.namn) ||
      (anvandare.user_metadata && anvandare.user_metadata.company_name) ||
      anvandare.email;
    el.textContent = namn;
  }

  // Varje sida börjar likadant. Ordningen spelar roll för hur det känns:
  // sidokolumnen ritas direkt, innan något väntas in, så att sidan står
  // färdig medan inloggningen kontrolleras. Görs det efteråt hoppar menyn
  // fram en stund efter att resten av sidan redan syns.
  async function startaSida(aktiv) {
    ritaSidokolumn(aktiv);

    // Företagsnamnet finns oftast redan i fliken sedan förra sidan.
    var sparad = franFliken();
    if (sparad) {
      _foretag = sparad.foretag;
      var namnEl = document.getElementById("inloggad-som");
      if (namnEl && sparad.foretag && sparad.foretag.namn) namnEl.textContent = sparad.foretag.namn;
    }

    var anv = await kravInloggning();
    if (!anv) return null;

    var foretag = await mittForetag(anv.id);
    visaInloggad(anv, foretag);
    return { anvandare: anv, foretag: foretag };
  }

  window.QV = {
    SV: SV,
    startaSida: startaSida,
    mittForetag: mittForetag,
    glomForetag: glomForetag,
    ritaSidokolumn: ritaSidokolumn,
    kr: kr,
    tid: tid,
    manadsrubrik: manadsrubrik,
    storlek: storlek,
    tomruta: tomruta,
    besked: besked,
    doljBesked: doljBesked
  };
})();
