/**
 * Quotify — Offerter (startsidan i kontovyn).
 *
 * Visar offerterna roboten tagit fram ur inkorgen, med nyckeltal överst.
 * Flikarna och sökrutan filtrerar på riktigt; tillståndet i varje rad är
 * samma kolumn som Historik-sidan ändrar.
 */

(function () {
  "use strict";

  var SV = QV.SV;

  var T = SV ? {
    rubrik: "Offerter",
    sok: "Kund eller ärende",
    utkastVantar: "Utkast som väntar",
    skickadeManad: "Skickade denna månad",
    offereratVarde: "Offererat värde",
    katalog: "Katalog",
    artiklar: "artiklar",
    fyllKatalog: "Fyll på katalogen",
    seKatalog: "Se katalogen",
    alla: "Alla",
    utkast: "Utkast",
    skickad: "Skickade",
    tomTitel: "Inga offerter än",
    tomText: "Här hamnar offerterna Quotify tar fram ur dina mail.",
    ingaTraffar: "Ingen offert matchar filtret.",
    hamtar: "Hämtar…",
    fel: "Kunde inte hämta: ",
    laddaNer: "Ladda ner",
    ingenPdf: "PDF saknas",
    heltHistorik: "Se hela historiken",
    saknasTitel: "Fyll i företagsuppgifterna",
    saknasText: "Det här saknas fortfarande på offerterna: ",
    saknasKnapp: "Fyll i nu"
  } : {
    rubrik: "Quotes",
    sok: "Customer or subject",
    utkastVantar: "Drafts waiting",
    skickadeManad: "Sent this month",
    offereratVarde: "Quoted value",
    katalog: "Catalogue",
    artiklar: "articles",
    fyllKatalog: "Fill the catalogue",
    seKatalog: "Open catalogue",
    alla: "All",
    utkast: "Drafts",
    skickad: "Sent",
    tomTitel: "No quotes yet",
    tomText: "This is where the quotes Quotify builds from your mail appear.",
    ingaTraffar: "No quote matches the filter.",
    hamtar: "Loading…",
    fel: "Couldn't load: ",
    laddaNer: "Download",
    ingenPdf: "No PDF",
    heltHistorik: "See the full history",
    saknasTitel: "Complete your company details",
    saknasText: "These are still missing from your quotes: ",
    saknasKnapp: "Fill them in"
  };

  var KORT = "border: 1px solid #F2EBE8; border-radius: 24px; background: #fff";
  var RUBRIK = "font-family: Archivo, sans-serif; font-weight: 800; letter-spacing: -0.02em";

  var offerter = [];
  var antalArtiklar = 0;
  var vald = "alla";
  var sokord = "";

  function el(tagg, stil, text) {
    var e = document.createElement(tagg);
    if (stil) e.style.cssText = stil;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Samma lista som Företag-sidan använder. En offert utan organisationsnummer
  // och adress ser inte ut att komma från ett företag.
  function saknade(f) {
    var krav = SV
      ? [["orgnr", "organisationsnummer"], ["telefon", "telefon"], ["adress", "adress"],
         ["postnummer", "postnummer"], ["ort", "ort"]]
      : [["orgnr", "registration number"], ["telefon", "phone"], ["adress", "address"],
         ["postnummer", "postcode"], ["ort", "city"]];
    return krav.filter(function (p) { return !(f && f[p[0]]); }).map(function (p) { return p[1]; });
  }

  function ritaPaminnelse(foretag) {
    var kvar = saknade(foretag);
    var ruta = document.getElementById("besked");
    if (!kvar.length) { ruta.hidden = true; return; }

    ruta.hidden = false;
    ruta.textContent = "";
    ruta.style.cssText = "display: flex; flex-wrap: wrap; align-items: center; gap: 12px; " +
      "padding: 15px 18px; border-radius: 20px; background: #FFF6E9; color: #7A5313";

    var text = el("div", "min-width: 0; margin-right: auto");
    text.appendChild(el("div", "font-weight: 700; font-size: 14px", T.saknasTitel));
    text.appendChild(el("div", "font-size: 13px; margin-top: 2px", T.saknasText + kvar.join(", ")));
    ruta.appendChild(text);

    var lank = el("a", "font-family: Archivo, sans-serif; font-weight: 600; font-size: 13.5px; " +
      "padding: 9px 17px; border-radius: 999px; background: #1C1A19; color: #fff; white-space: nowrap",
      T.saknasKnapp);
    lank.href = "foretag.html";
    ruta.appendChild(lank);
  }

  function ritaTopp() {
    var topp = document.getElementById("topp");
    topp.textContent = "";
    topp.style.cssText = "display: flex; flex-wrap: wrap; align-items: center; gap: 14px";
    topp.appendChild(el("h1", RUBRIK + "; font-size: 30px; letter-spacing: -0.035em; margin: 0; margin-right: auto", T.rubrik));

    var sokruta = el("div", "display: flex; align-items: center; gap: 9px; background: #fff; " +
      "border: 1px solid #F2EBE8; border-radius: 999px; padding: 9px 16px");
    var lupp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    lupp.setAttribute("width", "17"); lupp.setAttribute("height", "17");
    lupp.setAttribute("viewBox", "0 0 24 24"); lupp.setAttribute("fill", "none");
    lupp.setAttribute("stroke", "#756B66"); lupp.setAttribute("stroke-width", "2");
    lupp.innerHTML = '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>';
    sokruta.appendChild(lupp);
    var sok = document.createElement("input");
    sok.placeholder = T.sok;
    sok.style.cssText = "border: 0; outline: none; font-size: 14px; background: transparent; width: 170px; color: #1C1A19";
    sok.addEventListener("input", function () { sokord = sok.value; ritaLista(); });
    sokruta.appendChild(sok);
    topp.appendChild(sokruta);
  }

  function nyckeltalskort(etikett, varde, extra) {
    var k = el("div", "border: 1px solid #F2EBE8; border-radius: 20px; background: #fff; padding: 18px 20px");
    k.appendChild(el("div", "font-size: 12.5px; color: #6E6560; margin-bottom: 6px", etikett));
    k.appendChild(el("div", RUBRIK + "; font-size: 30px; letter-spacing: -0.03em; font-variant-numeric: tabular-nums", varde));
    if (extra) k.appendChild(extra);
    return k;
  }

  function ritaNyckeltal() {
    var rad = document.getElementById("nyckeltal");
    rad.textContent = "";
    rad.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(176px, 1fr)); gap: 14px";

    var utkast = offerter.filter(function (o) { return (o.tillstand || "utkast") === "utkast"; }).length;

    var nu = new Date();
    var skickade = offerter.filter(function (o) {
      if ((o.tillstand || "utkast") === "utkast") return false;
      var d = new Date(o.created_at);
      return !isNaN(d) && d.getMonth() === nu.getMonth() && d.getFullYear() === nu.getFullYear();
    }).length;

    var varde = offerter.reduce(function (a, o) { return a + (Number(o.belopp) || 0); }, 0);

    rad.appendChild(nyckeltalskort(T.utkastVantar, String(utkast)));
    rad.appendChild(nyckeltalskort(T.skickadeManad, String(skickade)));
    rad.appendChild(nyckeltalskort(T.offereratVarde, QV.kr(varde)));

    var lank = el("a", "font-size: 12.5px; font-weight: 600; color: #E2553C; display: inline-block; margin-top: 6px",
      antalArtiklar ? T.seKatalog : T.fyllKatalog);
    lank.href = "katalog.html";
    rad.appendChild(nyckeltalskort(T.katalog, antalArtiklar ? String(antalArtiklar) : "—", lank));
  }

  function ritaLista() {
    var kort = document.getElementById("lista");
    kort.textContent = "";
    kort.style.cssText = KORT + "; overflow: hidden";

    // flikraden
    var flikar = el("div", "display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 16px; " +
      "border-bottom: 1px solid #F2EBE8");
    [{ id: "alla", text: T.alla }, { id: "utkast", text: T.utkast },
     { id: "skickad", text: T.skickad }].forEach(function (f) {
      var b = el("button", null, f.text);
      b.type = "button";
      var pa = vald === f.id;
      b.style.cssText = "font-size: 12.5px; font-weight: 600; padding: 6px 13px; border-radius: 999px; " +
        "cursor: pointer; border: 0; background: " + (pa ? "#1C1A19" : "transparent") + "; " +
        "color: " + (pa ? "#fff" : "#6E6560");
      b.addEventListener("click", function () { vald = f.id; ritaLista(); });
      flikar.appendChild(b);
    });
    kort.appendChild(flikar);

    if (!offerter.length) {
      kort.appendChild(QV.tomruta(T.tomTitel, T.tomText));
      return;
    }

    var q = sokord.trim().toLowerCase();
    var visade = offerter.filter(function (o) {
      if (vald !== "alla" && (o.tillstand || "utkast") !== vald) return false;
      if (!q) return true;
      return ((o.foretag || "") + " " + (o.status || "")).toLowerCase().indexOf(q) >= 0;
    });

    if (!visade.length) {
      kort.appendChild(el("div", "padding: 40px 18px; text-align: center; font-size: 13.5px; color: #6E6560", T.ingaTraffar));
      return;
    }

    visade.forEach(function (o) {
      var r = el("div", "display: flex; flex-wrap: wrap; align-items: center; gap: 12px; " +
        "padding: 16px; border-bottom: 1px solid #F5F0EE");
      var v = el("div", "min-width: 0; margin-right: auto; flex: 1 1 180px");
      v.appendChild(el("div", "font-weight: 600; font-size: 14.5px; overflow-wrap: anywhere", o.foretag || "—"));
      v.appendChild(el("div", "font-size: 12.5px; color: #6E6560; margin-top: 2px; overflow-wrap: anywhere",
        String(o.status || "").replace(/^Offert\s*-\s*/i, "") + " · " + QV.tid(o.created_at)));
      r.appendChild(v);

      r.appendChild(el("div", RUBRIK + "; font-size: 15px; white-space: nowrap; font-variant-numeric: tabular-nums",
        typeof o.belopp === "number" ? QV.kr(o.belopp) : ""));

      var ner = el("button", null, o.pdf_path ? T.laddaNer : T.ingenPdf);
      ner.type = "button";
      ner.style.cssText = "font-family: Archivo, sans-serif; font-weight: 600; font-size: 13.5px; " +
        "padding: 9px 16px; border-radius: 999px; border: 1.5px solid #E6DDD9; background: #fff; " +
        "color: #1C1A19; cursor: " + (o.pdf_path ? "pointer" : "default") + "; opacity: " + (o.pdf_path ? "1" : "0.55");
      if (o.pdf_path) {
        ner.addEventListener("click", async function () {
          ner.disabled = true;
          var s = await db.storage.from("pdf-offerter").createSignedUrl(o.pdf_path, 120);
          ner.disabled = false;
          if (s.data && s.data.signedUrl) window.open(s.data.signedUrl, "_blank", "noopener");
        });
      } else {
        ner.disabled = true;
      }
      r.appendChild(ner);
      kort.appendChild(r);
    });

    var fot = el("div", "padding: 14px 16px; text-align: center");
    var lank = el("a", "font-size: 13px; font-weight: 600; color: #E2553C", T.heltHistorik);
    lank.href = "historik.html";
    fot.appendChild(lank);
    kort.appendChild(fot);
  }

  /* ---------- start ---------- */

  (async function () {
    var start = await QV.startaSida("offerter");
    if (!start) return;

    ritaTopp();
    ritaPaminnelse(start.foretag);
    ritaNyckeltal();
    document.getElementById("lista").appendChild(QV.tomruta(T.hamtar, ""));

    var r = await db.from("offerter").select("*").order("created_at", { ascending: false });
    if (r.error) {
      document.getElementById("lista").textContent = "";
      QV.besked(document.getElementById("besked"), T.fel + r.error.message, "fel");
      return;
    }
    offerter = r.data || [];

    // Antalet artiklar visas som nyckeltal, och säger om roboten kan
    // prissätta något över huvud taget.
    var a = await db.from("katalog_artiklar").select("id", { count: "exact", head: true });
    antalArtiklar = a.error ? 0 : (a.count || 0);

    ritaNyckeltal();
    ritaLista();
  })();
})();
