/**
 * Quotify — Katalog.
 *
 * Här laddar företaget upp sin prislista. Filen sparas i original, tolkas till
 * artiklar, och artiklarna är det roboten skickar med till AI:n när den läser
 * ett mejl. Utan den här listan kan AI:n inte sätta några priser.
 *
 * CSV och tabbseparerad text läses direkt. Excel läses med SheetJS, som hämtas
 * först när någon faktiskt väljer en Excel-fil.
 */

(function () {
  "use strict";

  var SV = QV.SV;

  var T = SV ? {
    rubrik: "Katalog",
    laddaUpp: "Ladda upp prislista",
    filtyper: "CSV, Excel eller tabbseparerad text",
    tolkar: "Läser filen…",
    laser: "Kunde inte läsa filen: ",
    tomFil: "Filen innehåller inga rader.",
    kolumner: "Vilken kolumn är vad?",
    kolumnHjalp: "Vi har gissat utifrån rubrikerna. Ändra om något hamnat fel.",
    artikelnummer: "Artikelnummer",
    benamning: "Benämning",
    pris: "Pris",
    enhet: "Enhet",
    ingen: "— ingen —",
    forhands: "Så här tolkas filen",
    rader: "rader",
    ersatt: "Ersätt hela katalogen",
    ersattHjalp: "Tar bort de artiklar som finns och lägger in filens i stället.",
    lagg: "Lägg till i katalogen",
    laggHjalp: "Behåller det som redan finns.",
    spara: "Spara katalogen",
    avbryt: "Avbryt",
    sparar: "Sparar…",
    sparat: "Katalogen är uppdaterad. Roboten använder den vid nästa genomgång.",
    behovBenamning: "Välj vilken kolumn som är benämningen — utan den blir artiklarna namnlösa.",
    filerRubrik: "Uppladdade filer",
    ingaFiler: "Inga filer uppladdade än.",
    artiklarRubrik: "Artiklar",
    ingaArtiklar: "Katalogen är tom",
    ingaArtiklarText: "Ladda upp företagets prislista, så kan AI:n börja prissätta offerterna.",
    sok: "Sök artikel",
    ingaTraffar: "Ingen artikel matchar sökningen.",
    tom: "Töm katalogen",
    tomFraga: "Ta bort alla artiklar ur katalogen?",
    radera: "Ta bort",
    laddaNer: "Ladda ner",
    ja: "Ja, ta bort",
    nej: "Avbryt",
    felHamta: "Kunde inte hämta katalogen: ",
    felSpara: "Kunde inte spara: ",
    hamtar: "Hämtar…",
    st: "st"
  } : {
    rubrik: "Catalogue",
    laddaUpp: "Upload price list",
    filtyper: "CSV, Excel or tab-separated text",
    tolkar: "Reading the file…",
    laser: "Couldn't read the file: ",
    tomFil: "The file has no rows.",
    kolumner: "Which column is which?",
    kolumnHjalp: "We guessed from the headers. Change anything that landed wrong.",
    artikelnummer: "Article number",
    benamning: "Name",
    pris: "Price",
    enhet: "Unit",
    ingen: "— none —",
    forhands: "How the file is read",
    rader: "rows",
    ersatt: "Replace the whole catalogue",
    ersattHjalp: "Removes the current articles and puts the file's in their place.",
    lagg: "Add to the catalogue",
    laggHjalp: "Keeps what is already there.",
    spara: "Save catalogue",
    avbryt: "Cancel",
    sparar: "Saving…",
    sparat: "The catalogue is updated. The robot uses it on its next pass.",
    behovBenamning: "Pick the column holding the name — without it the articles are nameless.",
    filerRubrik: "Uploaded files",
    ingaFiler: "No files uploaded yet.",
    artiklarRubrik: "Articles",
    ingaArtiklar: "The catalogue is empty",
    ingaArtiklarText: "Upload your price list so the AI can start pricing quotes.",
    sok: "Search article",
    ingaTraffar: "No article matches the search.",
    tom: "Empty catalogue",
    tomFraga: "Remove every article from the catalogue?",
    radera: "Remove",
    laddaNer: "Download",
    ja: "Yes, remove",
    nej: "Cancel",
    felHamta: "Couldn't load the catalogue: ",
    felSpara: "Couldn't save: ",
    hamtar: "Loading…",
    st: "pcs"
  };

  var KORT = "border: 1px solid #F2EBE8; border-radius: 24px; background: #fff";
  var RUBRIK = "font-family: Archivo, sans-serif; font-weight: 800; letter-spacing: -0.02em";

  var foretag = null;
  var artiklar = [];
  var filer = [];
  var tolkad = null; // { rubriker, rader, koppling }

  /* ---------- tolkning av filer ---------- */

  // Delar en CSV-rad med hänsyn till citattecken, så att "Skruv, 4x40" inte
  // blir två kolumner.
  function delaRad(rad, tecken) {
    var ut = [], varde = "", inne = false;
    for (var i = 0; i < rad.length; i++) {
      var c = rad[i];
      if (inne) {
        if (c === '"' && rad[i + 1] === '"') { varde += '"'; i++; }
        else if (c === '"') inne = false;
        else varde += c;
      } else if (c === '"') inne = true;
      else if (c === tecken) { ut.push(varde); varde = ""; }
      else varde += c;
    }
    ut.push(varde);
    return ut.map(function (v) { return v.trim(); });
  }

  function gissaTecken(text) {
    var forsta = text.split(/\r?\n/)[0] || "";
    var kandidater = [";", ",", "\t", "|"];
    var bast = ";", flest = 0;
    kandidater.forEach(function (t) {
      var n = delaRad(forsta, t).length;
      if (n > flest) { flest = n; bast = t; }
    });
    return bast;
  }

  function lasText(text) {
    var tecken = gissaTecken(text);
    var rader = text.split(/\r?\n/).filter(function (r) { return r.trim() !== ""; });
    if (!rader.length) return null;
    var rubriker = delaRad(rader[0], tecken);
    var data = rader.slice(1).map(function (r) { return delaRad(r, tecken); });
    return { rubriker: rubriker, rader: data };
  }

  function laddaSheetJS() {
    if (window.XLSX) return Promise.resolve();
    return new Promise(function (klar, fel) {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = klar;
      s.onerror = function () { fel(new Error("kunde inte hämta Excel-läsaren")); };
      document.head.appendChild(s);
    });
  }

  async function lasExcel(fil) {
    await laddaSheetJS();
    var buff = await fil.arrayBuffer();
    var bok = window.XLSX.read(buff, { type: "array" });
    var blad = bok.Sheets[bok.SheetNames[0]];
    var rutnat = window.XLSX.utils.sheet_to_json(blad, { header: 1, blankrows: false, defval: "" });
    if (!rutnat.length) return null;
    return {
      rubriker: rutnat[0].map(function (v) { return String(v).trim(); }),
      rader: rutnat.slice(1).map(function (r) { return r.map(function (v) { return String(v).trim(); }); })
    };
  }

  // "1 234,50 kr" och "1,234.50" ska båda bli 1234.5.
  function tolkaPris(v) {
    if (typeof v === "number") return v;
    var s = String(v || "").replace(/[^\d,.\-]/g, "");
    if (!s) return 0;
    var sistaKomma = s.lastIndexOf(","), sistaPunkt = s.lastIndexOf(".");
    if (sistaKomma > sistaPunkt) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  var GISSNINGAR = {
    artikelnummer: /(artikel|art\.?\s*nr|artnr|nummer|sku|kod|code|item)/i,
    benamning: /(ben[äa]mning|namn|produkt|beskrivning|description|name|title|vara)/i,
    pris: /(pris|price|belopp|kr|cost|amount|st?yck)/i,
    enhet: /(enhet|unit|m[åa]tt|uom)/i
  };

  function gissaKoppling(rubriker) {
    var k = { artikelnummer: -1, benamning: -1, pris: -1, enhet: -1 };
    Object.keys(GISSNINGAR).forEach(function (falt) {
      for (var i = 0; i < rubriker.length; i++) {
        if (k[falt] === -1 && GISSNINGAR[falt].test(rubriker[i])) { k[falt] = i; break; }
      }
    });
    // Hittades ingen benämning tar vi första kolumnen som inte redan används.
    if (k.benamning === -1) {
      for (var i = 0; i < rubriker.length; i++) {
        if (i !== k.artikelnummer && i !== k.pris && i !== k.enhet) { k.benamning = i; break; }
      }
    }
    return k;
  }

  function tillArtiklar(t) {
    var k = t.koppling;
    return t.rader.map(function (r) {
      return {
        artikelnummer: k.artikelnummer >= 0 ? String(r[k.artikelnummer] || "").trim() : "",
        benamning: k.benamning >= 0 ? String(r[k.benamning] || "").trim() : "",
        pris: k.pris >= 0 ? tolkaPris(r[k.pris]) : 0,
        enhet: k.enhet >= 0 ? (String(r[k.enhet] || "").trim() || T.st) : T.st
      };
    }).filter(function (a) { return a.benamning !== ""; });
  }

  /* ---------- utritning ---------- */

  function el(tagg, stil, text) {
    var e = document.createElement(tagg);
    if (stil) e.style.cssText = stil;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function knapp(text, sort) {
    var b = el("button", null, text);
    b.type = "button";
    var bas = "font-family: Archivo, sans-serif; font-weight: 600; font-size: 14px; " +
      "padding: 10px 18px; border-radius: 999px; cursor: pointer; border: 1.5px solid transparent";
    if (sort === "fylld") b.style.cssText = bas + "; background: #1C1A19; color: #fff";
    else if (sort === "fara") b.style.cssText = bas + "; background: #fff; color: #8E2F1B; border-color: #F0D2CA";
    else b.style.cssText = bas + "; background: #fff; color: #1C1A19; border-color: #E6DDD9";
    return b;
  }

  function ritaTopp() {
    var topp = document.getElementById("topp");
    topp.textContent = "";
    topp.style.cssText = "display: flex; flex-wrap: wrap; align-items: center; gap: 14px";

    var h = el("h1", RUBRIK + "; font-size: 30px; letter-spacing: -0.035em; margin: 0; margin-right: auto", T.rubrik);
    var b = knapp(T.laddaUpp, "fylld");
    b.addEventListener("click", function () { document.getElementById("filvaljare").click(); });

    topp.appendChild(h);
    topp.appendChild(b);
  }

  function ritaFiler() {
    var kort = document.getElementById("filkort");
    kort.textContent = "";
    kort.style.cssText = KORT + "; overflow: hidden";

    var rubrik = el("div", "padding: 16px 18px; border-bottom: 1px solid #F2EBE8; " + RUBRIK + "; font-size: 15px", T.filerRubrik);
    kort.appendChild(rubrik);

    if (!filer.length) {
      kort.appendChild(el("div", "padding: 18px; font-size: 13.5px; color: #6E6560", T.ingaFiler));
      return;
    }

    filer.forEach(function (f) {
      var rad = el("div", "display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-top: 1px solid #F5F0EE");
      var v = el("div", "min-width: 0; margin-right: auto");
      v.appendChild(el("div", "font-weight: 600; font-size: 14px; overflow-wrap: anywhere", f.filnamn));
      v.appendChild(el("div", "font-size: 12.5px; color: #6E6560; margin-top: 2px",
        f.antal_artiklar + " " + T.rader + " · " + QV.storlek(f.storlek) + " · " + QV.tid(f.created_at)));
      rad.appendChild(v);

      var ner = knapp(T.laddaNer);
      ner.addEventListener("click", async function () {
        ner.disabled = true;
        var r = await db.storage.from("kataloger").createSignedUrl(f.path, 120);
        ner.disabled = false;
        if (r.data && r.data.signedUrl) window.open(r.data.signedUrl, "_blank", "noopener");
      });
      rad.appendChild(ner);

      var bort = knapp(T.radera, "fara");
      bort.addEventListener("click", async function () {
        bort.disabled = true;
        await db.storage.from("kataloger").remove([f.path]);
        var r = await db.from("katalog_filer").delete().eq("id", f.id);
        if (r.error) { QV.besked(document.getElementById("besked"), T.felSpara + r.error.message, "fel"); bort.disabled = false; return; }
        filer = filer.filter(function (x) { return x.id !== f.id; });
        ritaFiler();
      });
      rad.appendChild(bort);

      kort.appendChild(rad);
    });
  }

  function ritaArtiklar(filter) {
    var kort = document.getElementById("artikelkort");
    kort.textContent = "";
    kort.style.cssText = KORT + "; overflow: hidden";

    var topp = el("div", "display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #F2EBE8");
    topp.appendChild(el("div", RUBRIK + "; font-size: 15px; margin-right: auto",
      T.artiklarRubrik + (artiklar.length ? " · " + artiklar.length : "")));

    if (artiklar.length) {
      var sokruta = el("div", "display: flex; align-items: center; gap: 8px; border: 1px solid #F2EBE8; border-radius: 999px; padding: 8px 14px");
      var sok = document.createElement("input");
      sok.placeholder = T.sok;
      sok.value = filter || "";
      sok.style.cssText = "border: 0; outline: none; font-size: 13.5px; background: transparent; width: 150px; color: #1C1A19";
      sok.addEventListener("input", function () { ritaArtiklar(sok.value); });
      sokruta.appendChild(sok);
      topp.appendChild(sokruta);

      var tomKnapp = knapp(T.tom, "fara");
      tomKnapp.addEventListener("click", function () { fragaTomma(tomKnapp); });
      topp.appendChild(tomKnapp);
    }
    kort.appendChild(topp);

    if (!artiklar.length) {
      kort.appendChild(QV.tomruta(T.ingaArtiklar, T.ingaArtiklarText));
      return;
    }

    var q = String(filter || "").toLowerCase();
    var visade = q
      ? artiklar.filter(function (a) {
          return (a.benamning + " " + (a.artikelnummer || "")).toLowerCase().indexOf(q) >= 0;
        })
      : artiklar;

    if (!visade.length) {
      kort.appendChild(el("div", "padding: 30px 18px; font-size: 13.5px; color: #6E6560; text-align: center", T.ingaTraffar));
      return;
    }

    var rull = el("div", "overflow-x: auto");
    var tabell = el("table", "width: 100%; border-collapse: collapse; font-size: 13.5px");
    var thead = el("thead");
    var trh = el("tr");
    [T.artikelnummer, T.benamning, T.pris, T.enhet, ""].forEach(function (h, i) {
      var th = el("th", "text-align: " + (i === 2 ? "right" : "left") + "; font-size: 11.5px; " +
        "font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #756B66; " +
        "padding: 10px 18px; border-bottom: 1px solid #F2EBE8; white-space: nowrap", h);
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    tabell.appendChild(thead);

    var tbody = el("tbody");
    visade.forEach(function (a) {
      var tr = el("tr");
      var cell = "padding: 11px 18px; border-bottom: 1px solid #F7F3F1; vertical-align: top";
      tr.appendChild(el("td", cell + "; color: #6E6560; white-space: nowrap", a.artikelnummer || "—"));
      tr.appendChild(el("td", cell + "; font-weight: 600", a.benamning));
      tr.appendChild(el("td", cell + "; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums", QV.kr(a.pris)));
      tr.appendChild(el("td", cell + "; color: #6E6560", a.enhet || ""));

      var tdBort = el("td", cell + "; text-align: right");
      var x = el("button", "border: 0; background: transparent; cursor: pointer; color: #A3968F; font-size: 17px; line-height: 1; padding: 0 4px", "×");
      x.type = "button";
      x.title = T.radera;
      x.addEventListener("click", async function () {
        x.disabled = true;
        var r = await db.from("katalog_artiklar").delete().eq("id", a.id);
        if (r.error) { QV.besked(document.getElementById("besked"), T.felSpara + r.error.message, "fel"); x.disabled = false; return; }
        artiklar = artiklar.filter(function (y) { return y.id !== a.id; });
        ritaArtiklar(filter);
      });
      tdBort.appendChild(x);
      tr.appendChild(tdBort);
      tbody.appendChild(tr);
    });
    tabell.appendChild(tbody);
    rull.appendChild(tabell);
    kort.appendChild(rull);
  }

  function fragaTomma(kallaKnapp) {
    var besked = document.getElementById("besked");
    besked.hidden = false;
    besked.textContent = "";
    besked.style.cssText = "display: flex; flex-wrap: wrap; align-items: center; gap: 12px; " +
      "padding: 13px 16px; border-radius: 16px; background: #FDECE8; color: #8E2F1B; font-size: 13.5px";
    besked.appendChild(el("span", "margin-right: auto", T.tomFraga));

    var ja = knapp(T.ja, "fara");
    ja.addEventListener("click", async function () {
      ja.disabled = true;
      var r = await db.from("katalog_artiklar").delete().eq("company_id", foretag.id);
      if (r.error) { QV.besked(besked, T.felSpara + r.error.message, "fel"); return; }
      artiklar = [];
      QV.doljBesked(besked);
      ritaArtiklar("");
    });
    var nej = knapp(T.nej);
    nej.addEventListener("click", function () { QV.doljBesked(besked); if (kallaKnapp) kallaKnapp.disabled = false; });
    besked.appendChild(ja);
    besked.appendChild(nej);
  }

  /* ---------- förhandsgranskning innan sparande ---------- */

  function ritaForhands(fil) {
    var ruta = document.getElementById("forhandsgranskning");
    ruta.hidden = false;
    ruta.textContent = "";
    ruta.style.cssText = KORT + "; padding: 18px 20px; display: grid; gap: 16px";

    ruta.appendChild(el("div", RUBRIK + "; font-size: 16px", T.kolumner));
    ruta.appendChild(el("p", "font-size: 13.5px; color: #6E6560; margin: -10px 0 0", T.kolumnHjalp));

    // fyra rullgardiner, en per fält
    var val = el("div", "display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px");
    [["artikelnummer", T.artikelnummer], ["benamning", T.benamning], ["pris", T.pris], ["enhet", T.enhet]]
      .forEach(function (par) {
        var falt = par[0];
        var box = el("label", "display: grid; gap: 5px; font-size: 12.5px; color: #6E6560");
        box.appendChild(el("span", null, par[1]));
        var s = document.createElement("select");
        s.style.cssText = "font-family: Karla, system-ui, sans-serif; font-size: 13.5px; padding: 9px 11px; " +
          "border: 1px solid #E6DDD9; border-radius: 12px; background: #fff; color: #1C1A19";
        var ingen = document.createElement("option");
        ingen.value = "-1";
        ingen.textContent = T.ingen;
        s.appendChild(ingen);
        tolkad.rubriker.forEach(function (r, i) {
          var o = document.createElement("option");
          o.value = String(i);
          o.textContent = r || ("#" + (i + 1));
          s.appendChild(o);
        });
        s.value = String(tolkad.koppling[falt]);
        s.addEventListener("change", function () {
          tolkad.koppling[falt] = parseInt(s.value, 10);
          ritaForhands(fil);
        });
        box.appendChild(s);
        val.appendChild(box);
      });
    ruta.appendChild(val);

    var rader = tillArtiklar(tolkad);

    ruta.appendChild(el("div", RUBRIK + "; font-size: 15px; margin-top: 4px",
      T.forhands + " · " + rader.length + " " + T.rader));

    var rull = el("div", "overflow-x: auto; border: 1px solid #F2EBE8; border-radius: 16px");
    var tab = el("table", "width: 100%; border-collapse: collapse; font-size: 13px");
    var trh = el("tr");
    [T.artikelnummer, T.benamning, T.pris, T.enhet].forEach(function (h, i) {
      trh.appendChild(el("th", "text-align: " + (i === 2 ? "right" : "left") + "; font-size: 11px; font-weight: 700; " +
        "letter-spacing: 0.06em; text-transform: uppercase; color: #756B66; padding: 9px 14px; " +
        "border-bottom: 1px solid #F2EBE8; white-space: nowrap", h));
    });
    tab.appendChild(trh);
    rader.slice(0, 8).forEach(function (a) {
      var tr = el("tr");
      var c = "padding: 9px 14px; border-bottom: 1px solid #F7F3F1";
      tr.appendChild(el("td", c + "; color: #6E6560; white-space: nowrap", a.artikelnummer || "—"));
      tr.appendChild(el("td", c + "; font-weight: 600", a.benamning));
      tr.appendChild(el("td", c + "; text-align: right; white-space: nowrap", QV.kr(a.pris)));
      tr.appendChild(el("td", c + "; color: #6E6560", a.enhet));
      tab.appendChild(tr);
    });
    rull.appendChild(tab);
    ruta.appendChild(rull);

    // ersätt eller lägg till
    var lage = el("div", "display: grid; gap: 8px");
    [["ersatt", T.ersatt, T.ersattHjalp], ["lagg", T.lagg, T.laggHjalp]].forEach(function (p, i) {
      var l = el("label", "display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; cursor: pointer");
      var r = document.createElement("input");
      r.type = "radio";
      r.name = "katalog-lage";
      r.value = p[0];
      r.checked = i === 0;
      r.style.cssText = "margin-top: 3px; accent-color: #1C1A19";
      l.appendChild(r);
      var txt = el("span");
      txt.appendChild(el("span", "font-weight: 600", p[1]));
      txt.appendChild(el("div", "color: #6E6560; font-size: 12.5px; margin-top: 1px", p[2]));
      l.appendChild(txt);
      lage.appendChild(l);
    });
    ruta.appendChild(lage);

    var knappar = el("div", "display: flex; flex-wrap: wrap; gap: 10px");
    var spara = knapp(T.spara, "fylld");
    spara.addEventListener("click", function () { sparaKatalogen(fil, rader, spara); });
    var avbryt = knapp(T.avbryt);
    avbryt.addEventListener("click", function () {
      tolkad = null;
      ruta.hidden = true;
      document.getElementById("filvaljare").value = "";
    });
    knappar.appendChild(spara);
    knappar.appendChild(avbryt);
    ruta.appendChild(knappar);
  }

  /* ---------- sparande ---------- */

  async function sparaKatalogen(fil, rader, knappen) {
    var besked = document.getElementById("besked");
    if (!rader.length) { QV.besked(besked, T.behovBenamning, "fel"); return; }

    knappen.disabled = true;
    QV.besked(besked, T.sparar, "neutral");

    try {
      var ersatt = document.querySelector('input[name="katalog-lage"]:checked').value === "ersatt";

      if (ersatt) {
        var bort = await db.from("katalog_artiklar").delete().eq("company_id", foretag.id);
        if (bort.error) throw new Error(bort.error.message);
      }

      // Originalfilen sparas under företagets egen mapp — lagringsregeln
      // matchar på första mappnivån.
      var vag = foretag.id + "/" + Date.now() + "_" + fil.name.replace(/[^\w.\- ]+/g, "_");
      var upp = await db.storage.from("kataloger").upload(vag, fil, { upsert: false });
      if (upp.error) throw new Error(upp.error.message);

      // Radera i klumpar: PostgREST tar emot stora listor, men inte hur stora
      // som helst på en gång.
      for (var i = 0; i < rader.length; i += 500) {
        var klump = rader.slice(i, i + 500).map(function (a) {
          return {
            company_id: foretag.id,
            artikelnummer: a.artikelnummer || null,
            benamning: a.benamning,
            pris: a.pris,
            enhet: a.enhet || T.st
          };
        });
        var ins = await db.from("katalog_artiklar").insert(klump);
        if (ins.error) throw new Error(ins.error.message);
      }

      var filrad = await db.from("katalog_filer").insert({
        company_id: foretag.id,
        filnamn: fil.name,
        path: vag,
        storlek: fil.size,
        antal_artiklar: rader.length
      }).select().single();
      if (filrad.error) throw new Error(filrad.error.message);

      tolkad = null;
      document.getElementById("forhandsgranskning").hidden = true;
      document.getElementById("filvaljare").value = "";
      QV.besked(besked, T.sparat, "bra");
      await hamta();
    } catch (e) {
      QV.besked(besked, T.felSpara + e.message, "fel");
    } finally {
      knappen.disabled = false;
    }
  }

  /* ---------- hämtning ---------- */

  async function hamta() {
    var a = await db.from("katalog_artiklar").select("*").order("benamning");
    var f = await db.from("katalog_filer").select("*").order("created_at", { ascending: false });

    if (a.error) { QV.besked(document.getElementById("besked"), T.felHamta + a.error.message, "fel"); return; }
    artiklar = a.data || [];
    filer = f.error ? [] : (f.data || []);
    ritaArtiklar("");
    ritaFiler();
  }

  /* ---------- start ---------- */

  (async function () {
    var start = await QV.startaSida("katalog");
    if (!start) return;
    foretag = start.foretag;

    ritaTopp();

    var valjare = document.getElementById("filvaljare");
    valjare.addEventListener("change", async function () {
      var fil = valjare.files && valjare.files[0];
      if (!fil) return;
      var besked = document.getElementById("besked");
      QV.besked(besked, T.tolkar, "neutral");
      try {
        var resultat = /\.xlsx?$/i.test(fil.name)
          ? await lasExcel(fil)
          : lasText(await fil.text());
        if (!resultat || !resultat.rader.length) throw new Error(T.tomFil);
        resultat.koppling = gissaKoppling(resultat.rubriker);
        tolkad = resultat;
        QV.doljBesked(besked);
        ritaForhands(fil);
      } catch (e) {
        QV.besked(besked, T.laser + e.message, "fel");
        valjare.value = "";
      }
    });

    if (!foretag) return;
    await hamta();
  })();
})();
