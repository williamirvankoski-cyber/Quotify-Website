/**
 * Quotify — Historik.
 *
 * Alla offerter någonsin, grupperade månad för månad. Här sätts också
 * offertens tillstånd: utkast, skickad, vunnen eller förlorad. Det är samma
 * kolumn som flikarna på startsidan filtrerar på, så en ändring här syns
 * direkt där.
 */

(function () {
  "use strict";

  var SV = QV.SV;

  var T = SV ? {
    rubrik: "Historik",
    sok: "Kund eller ärende",
    alla: "Alla",
    utkast: "Utkast",
    skickad: "Skickade",
    vunnen: "Vunna",
    forlorad: "Förlorade",
    tomTitel: "Inget att visa än",
    tomText: "Här samlas alla offerter Quotify tagit fram, månad för månad.",
    ingaTraffar: "Ingen offert matchar filtret.",
    hamtar: "Hämtar…",
    fel: "Kunde inte hämta historiken: ",
    felSpara: "Kunde inte spara: ",
    laddaNer: "Ladda ner",
    radera: "Ta bort",
    bekrafta: "Ta bort offerten?",
    ja: "Ja, ta bort",
    nej: "Avbryt",
    antal: "offerter",
    varde: "Sammanlagt värde",
    ingenPdf: "PDF saknas"
  } : {
    rubrik: "History",
    sok: "Customer or subject",
    alla: "All",
    utkast: "Drafts",
    skickad: "Sent",
    vunnen: "Won",
    forlorad: "Lost",
    tomTitel: "Nothing here yet",
    tomText: "Every quote Quotify builds collects here, month by month.",
    ingaTraffar: "No quote matches the filter.",
    hamtar: "Loading…",
    fel: "Couldn't load the history: ",
    felSpara: "Couldn't save: ",
    laddaNer: "Download",
    radera: "Remove",
    bekrafta: "Remove this quote?",
    ja: "Yes, remove",
    nej: "Cancel",
    antal: "quotes",
    varde: "Total value",
    ingenPdf: "No PDF"
  };

  var TILLSTAND = [
    { id: "utkast", text: T.utkast },
    { id: "skickad", text: T.skickad },
    { id: "vunnen", text: T.vunnen },
    { id: "forlorad", text: T.forlorad }
  ];

  var KORT = "border: 1px solid #F2EBE8; border-radius: 24px; background: #fff";
  var RUBRIK = "font-family: Archivo, sans-serif; font-weight: 800; letter-spacing: -0.02em";

  var offerter = [];
  var valtTillstand = "alla";
  var sokord = "";

  function el(tagg, stil, text) {
    var e = document.createElement(tagg);
    if (stil) e.style.cssText = stil;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function knapp(text, sort) {
    var b = el("button", null, text);
    b.type = "button";
    var bas = "font-family: Archivo, sans-serif; font-weight: 600; font-size: 13.5px; " +
      "padding: 9px 16px; border-radius: 999px; cursor: pointer; border: 1.5px solid transparent";
    if (sort === "fylld") b.style.cssText = bas + "; background: #1C1A19; color: #fff";
    else if (sort === "fara") b.style.cssText = bas + "; background: #fff; color: #8E2F1B; border-color: #F0D2CA";
    else b.style.cssText = bas + "; background: #fff; color: #1C1A19; border-color: #E6DDD9";
    return b;
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
    sok.value = sokord;
    sok.style.cssText = "border: 0; outline: none; font-size: 14px; background: transparent; width: 180px; color: #1C1A19";
    sok.addEventListener("input", function () { sokord = sok.value; ritaLista(); });
    sokruta.appendChild(sok);
    topp.appendChild(sokruta);
  }

  function ritaFlikar() {
    var rad = document.getElementById("flikar");
    rad.textContent = "";
    rad.style.cssText = "display: flex; flex-wrap: wrap; gap: 8px";

    [{ id: "alla", text: T.alla }].concat(TILLSTAND).forEach(function (f) {
      var antal = f.id === "alla" ? offerter.length
        : offerter.filter(function (o) { return (o.tillstand || "utkast") === f.id; }).length;
      var b = el("button", null, f.text + (antal ? " · " + antal : ""));
      b.type = "button";
      var vald = valtTillstand === f.id;
      b.style.cssText = "font-size: 13px; font-weight: 600; padding: 8px 15px; border-radius: 999px; " +
        "cursor: pointer; border: 1px solid " + (vald ? "#1C1A19" : "#F2EBE8") + "; " +
        "background: " + (vald ? "#1C1A19" : "#fff") + "; color: " + (vald ? "#fff" : "#6E6560");
      b.addEventListener("click", function () { valtTillstand = f.id; ritaFlikar(); ritaLista(); });
      rad.appendChild(b);
    });
  }

  function tillstandsval(o) {
    var s = document.createElement("select");
    s.style.cssText = "font-family: Karla, system-ui, sans-serif; font-size: 12.5px; padding: 7px 10px; " +
      "border: 1px solid #E6DDD9; border-radius: 999px; background: #fff; color: #1C1A19; cursor: pointer";
    TILLSTAND.forEach(function (t) {
      var o2 = document.createElement("option");
      o2.value = t.id;
      // Flikarna heter "Skickade" i plural; i rullgardinen passar entalsformen
      o2.textContent = t.text;
      s.appendChild(o2);
    });
    s.value = o.tillstand || "utkast";
    s.addEventListener("change", async function () {
      var tidigare = o.tillstand;
      o.tillstand = s.value;
      s.disabled = true;
      var r = await db.from("offerter").update({ tillstand: s.value }).eq("id", o.id);
      s.disabled = false;
      if (r.error) {
        o.tillstand = tidigare;
        s.value = tidigare || "utkast";
        QV.besked(document.getElementById("besked"), T.felSpara + r.error.message, "fel");
        return;
      }
      ritaFlikar();
      if (valtTillstand !== "alla") ritaLista();
    });
    return s;
  }

  function rad(o) {
    var r = el("div", "display: flex; flex-wrap: wrap; align-items: center; gap: 12px; " +
      "padding: 15px 18px; border-top: 1px solid #F5F0EE");

    var v = el("div", "min-width: 0; margin-right: auto; flex: 1 1 190px");
    v.appendChild(el("div", "font-weight: 600; font-size: 14.5px; overflow-wrap: anywhere", o.foretag || "—"));
    v.appendChild(el("div", "font-size: 12.5px; color: #6E6560; margin-top: 2px; overflow-wrap: anywhere",
      String(o.status || "").replace(/^Offert\s*-\s*/i, "") + " · " + QV.tid(o.created_at)));
    r.appendChild(v);

    r.appendChild(el("div", "font-family: Archivo, sans-serif; font-weight: 800; font-size: 15px; " +
      "white-space: nowrap; font-variant-numeric: tabular-nums",
      typeof o.belopp === "number" ? QV.kr(o.belopp) : ""));

    r.appendChild(tillstandsval(o));

    var ner = knapp(T.laddaNer);
    if (!o.pdf_path) {
      ner.disabled = true;
      ner.textContent = T.ingenPdf;
      ner.style.opacity = "0.55";
      ner.style.cursor = "default";
    } else {
      ner.addEventListener("click", async function () {
        ner.disabled = true;
        var s = await db.storage.from("pdf-offerter").createSignedUrl(o.pdf_path, 120);
        ner.disabled = false;
        if (s.data && s.data.signedUrl) window.open(s.data.signedUrl, "_blank", "noopener");
      });
    }
    r.appendChild(ner);

    var bort = knapp(T.radera, "fara");
    bort.addEventListener("click", function () { fragaRadera(o, r); });
    r.appendChild(bort);

    return r;
  }

  function fragaRadera(o, radEl) {
    var ruta = el("div", "display: flex; flex-wrap: wrap; align-items: center; gap: 10px; " +
      "padding: 13px 18px; border-top: 1px solid #F5F0EE; background: #FDF6F4; " +
      "color: #8E2F1B; font-size: 13.5px");
    ruta.appendChild(el("span", "margin-right: auto", T.bekrafta));

    var ja = knapp(T.ja, "fara");
    ja.addEventListener("click", async function () {
      ja.disabled = true;
      if (o.pdf_path) await db.storage.from("pdf-offerter").remove([o.pdf_path]);
      var r = await db.from("offerter").delete().eq("id", o.id);
      if (r.error) { QV.besked(document.getElementById("besked"), T.felSpara + r.error.message, "fel"); ja.disabled = false; return; }
      offerter = offerter.filter(function (x) { return x.id !== o.id; });
      ritaFlikar();
      ritaLista();
    });
    var nej = knapp(T.nej);
    nej.addEventListener("click", function () { ruta.replaceWith(radEl); });
    ruta.appendChild(ja);
    ruta.appendChild(nej);

    radEl.replaceWith(ruta);
  }

  function ritaLista() {
    var kort = document.getElementById("lista");
    kort.textContent = "";
    kort.style.cssText = KORT + "; overflow: hidden";

    if (!offerter.length) {
      kort.appendChild(QV.tomruta(T.tomTitel, T.tomText));
      return;
    }

    var q = sokord.trim().toLowerCase();
    var visade = offerter.filter(function (o) {
      if (valtTillstand !== "alla" && (o.tillstand || "utkast") !== valtTillstand) return false;
      if (!q) return true;
      return ((o.foretag || "") + " " + (o.status || "")).toLowerCase().indexOf(q) >= 0;
    });

    if (!visade.length) {
      kort.appendChild(el("div", "padding: 40px 18px; text-align: center; font-size: 13.5px; color: #6E6560", T.ingaTraffar));
      return;
    }

    // gruppera på månad, nyast först
    var manad = null;
    visade.forEach(function (o) {
      var m = QV.manadsrubrik(o.created_at);
      if (m !== manad) {
        manad = m;
        var summa = visade
          .filter(function (x) { return QV.manadsrubrik(x.created_at) === m; })
          .reduce(function (a, x) { return a + (Number(x.belopp) || 0); }, 0);
        var antal = visade.filter(function (x) { return QV.manadsrubrik(x.created_at) === m; }).length;

        var huvud = el("div", "display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; " +
          "padding: 14px 18px; background: #FAF7F5; border-top: 1px solid #F2EBE8");
        huvud.appendChild(el("span", RUBRIK + "; font-size: 14px; text-transform: capitalize", m));
        huvud.appendChild(el("span", "font-size: 12.5px; color: #6E6560; margin-right: auto",
          antal + " " + T.antal));
        huvud.appendChild(el("span", "font-size: 12.5px; color: #6E6560",
          T.varde + ": " + QV.kr(summa)));
        kort.appendChild(huvud);
      }
      kort.appendChild(rad(o));
    });
  }

  /* ---------- start ---------- */

  (async function () {
    var start = await QV.startaSida("historik");
    if (!start) return;

    ritaTopp();
    document.getElementById("lista").appendChild(QV.tomruta(T.hamtar, ""));

    var r = await db.from("offerter").select("*").order("created_at", { ascending: false });
    if (r.error) {
      document.getElementById("lista").textContent = "";
      QV.besked(document.getElementById("besked"), T.fel + r.error.message, "fel");
      return;
    }

    offerter = r.data || [];
    ritaFlikar();
    ritaLista();
  })();
})();
