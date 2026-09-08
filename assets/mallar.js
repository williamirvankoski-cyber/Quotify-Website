/**
 * Quotify — Mallar.
 *
 * Det finns en mall i nuläget: den offert roboten trycker upp åt er idag.
 * Sidan visar den, och låter er ändra det som faktiskt går att ändra —
 * logotyp, färg, referens och villkor. Roboten läser samma uppgifter ur
 * databasen vid varje genomgång, så en ändring här syns i nästa offert.
 *
 * Fler mallar tillkommer senare; då blir listan nedan flera kort.
 */

(function () {
  "use strict";

  var SV = QV.SV;

  var T = SV ? {
    rubrik: "Mallar",
    anvands: "Används",
    mallnamn: "Standardoffert",
    mallText: "Den mall roboten använder för varje offert den skapar ur inkorgen.",
    installningar: "Mallens uppgifter",
    logotyp: "Logotyp",
    logoHjalp: "PNG eller JPG. Visas uppe till vänster i offerten.",
    standardLogo: "Ingen egen logotyp vald — Quotifys logotyp används. PNG eller JPG.",
    valjLogo: "Välj bild",
    taBortLogo: "Ta bort logotyp",
    farg: "Färg",
    fargHjalp: "Färgen på listen högst upp och nederst.",
    referens: "Vår referens",
    referensHjalp: "Namnet som står som avsändare på offerten.",
    leverans: "Leveransvillkor",
    betalning: "Betalningsvillkor",
    spara: "Spara ändringar",
    sparar: "Sparar…",
    sparat: "Sparat. Nästa offert roboten skapar använder de nya uppgifterna.",
    fel: "Kunde inte spara: ",
    felBild: "Kunde inte ladda upp bilden: ",
    forhands: "Förhandsgranskning",
    forhandsText: "Så här ser offerten ut med uppgifterna ovan.",
    kund: "Kundens Företag AB",
    exempelArtikel: "Exempel ur er katalog",
    exempelTom: "Er katalog är tom — fyll på den under Katalog.",
    offert: "OFFERT",
    ordernr: "Offertnummer",
    datum: "Datum",
    giltig: "Giltig till",
    artikel: "Artikel",
    antal: "Antal",
    apris: "À-pris",
    summa: "Summa",
    netto: "Summa exkl. moms",
    moms: "Moms 25%",
    totalt: "Att betala",
    varReferens: "Vår referens",
    ejAngiven: "ej angiven"
  } : {
    rubrik: "Templates",
    anvands: "In use",
    mallnamn: "Standard quote",
    mallText: "The template the robot uses for every quote it builds from your inbox.",
    installningar: "Template details",
    logotyp: "Logo",
    logoHjalp: "PNG or JPG. Shown top left on the quote.",
    standardLogo: "No logo of your own — Quotify's logo is used. PNG or JPG.",
    valjLogo: "Choose image",
    taBortLogo: "Remove logo",
    farg: "Colour",
    fargHjalp: "The colour of the bars at the top and bottom.",
    referens: "Our reference",
    referensHjalp: "The name shown as the sender on the quote.",
    leverans: "Delivery terms",
    betalning: "Payment terms",
    spara: "Save changes",
    sparar: "Saving…",
    sparat: "Saved. The robot's next quote uses the new details.",
    fel: "Couldn't save: ",
    felBild: "Couldn't upload the image: ",
    forhands: "Preview",
    forhandsText: "This is how the quote looks with the details above.",
    kund: "Customer Company Ltd",
    exempelArtikel: "Example from your catalogue",
    exempelTom: "Your catalogue is empty — fill it under Catalogue.",
    offert: "QUOTE",
    ordernr: "Quote number",
    datum: "Date",
    giltig: "Valid until",
    artikel: "Article",
    antal: "Qty",
    apris: "Unit price",
    summa: "Total",
    netto: "Subtotal",
    moms: "VAT 25%",
    totalt: "Amount due",
    varReferens: "Our reference",
    ejAngiven: "not set"
  };

  var KORT = "border: 1px solid #F2EBE8; border-radius: 24px; background: #fff";
  var RUBRIK = "font-family: Archivo, sans-serif; font-weight: 800; letter-spacing: -0.02em";
  var RESERVFARG = "#1C1A19";

  var foretag = null;
  var exempelrader = [];
  var logotypBild = "";   // det som visas i förhandsgranskningen (data- eller signerad url)

  // Relativ ljushet enligt WCAG — samma beräkning som roboten gör när den
  // väljer textfärg ovanpå företagets färg i PDF:en.
  function ljusFarg(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return false;
    var tal = parseInt(m[1], 16);
    var kanal = [(tal >> 16) & 255, (tal >> 8) & 255, tal & 255].map(function (v) {
      var d = v / 255;
      return d <= 0.03928 ? d / 12.92 : Math.pow((d + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * kanal[0] + 0.7152 * kanal[1] + 0.0722 * kanal[2] > 0.45;
  }

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

  function faltruta(etikett, hjalp, kontroll) {
    var box = el("label", "display: grid; gap: 5px");
    box.appendChild(el("span", "font-size: 12.5px; font-weight: 600", etikett));
    box.appendChild(kontroll);
    if (hjalp) box.appendChild(el("span", "font-size: 12px; color: #6E6560", hjalp));
    return box;
  }

  function textfalt(varde) {
    var i = document.createElement("input");
    i.type = "text";
    i.value = varde || "";
    i.style.cssText = "font-family: Karla, system-ui, sans-serif; font-size: 14px; padding: 11px 14px; " +
      "border: 1px solid #E6DDD9; border-radius: 14px; background: #fff; color: #1C1A19; width: 100%; box-sizing: border-box";
    i.addEventListener("input", ritaForhands);
    return i;
  }

  /* ---------- formuläret ---------- */

  var falt = {};

  function ritaInstallningar() {
    var kort = document.getElementById("installningar");
    kort.textContent = "";
    kort.style.cssText = KORT + "; padding: 20px 22px; display: grid; gap: 16px";

    kort.appendChild(el("div", RUBRIK + "; font-size: 16px", T.installningar));

    // logotyp
    var logorad = el("div", "display: flex; flex-wrap: wrap; align-items: center; gap: 14px");
    var ruta = el("div", "width: 92px; height: 60px; border: 1px solid #F2EBE8; border-radius: 14px; " +
      "background: #FAF7F5; display: grid; place-items: center; overflow: hidden; flex: none");
    if (logotypBild) {
      var bild = document.createElement("img");
      bild.src = logotypBild;
      bild.alt = "";
      bild.style.cssText = "max-width: 100%; max-height: 100%; object-fit: contain";
      ruta.appendChild(bild);
    } else {
      // Ingen egen logotyp: rutan visar den som faktiskt används i stället.
      var std = el("span", "font-size: 15px");
      std.className = "qf-mark";
      std.appendChild(document.createTextNode("Qu"));
      var stdOrb = el("span");
      stdOrb.className = "qf-mark__orb";
      std.appendChild(stdOrb);
      std.appendChild(document.createTextNode("tify"));
      ruta.appendChild(std);
    }
    logorad.appendChild(ruta);

    var logotext = el("div", "min-width: 0");
    logotext.appendChild(el("div", "font-size: 12.5px; font-weight: 600", T.logotyp));
    logotext.appendChild(el("div", "font-size: 12px; color: #6E6560; margin-top: 2px",
      (foretag && foretag.logo_url) ? T.logoHjalp : T.standardLogo));
    logorad.appendChild(logotext);

    var valj = knapp(T.valjLogo);
    valj.style.marginLeft = "auto";
    valj.addEventListener("click", function () { document.getElementById("logovaljare").click(); });
    logorad.appendChild(valj);

    if (foretag && foretag.logo_url) {
      var bort = knapp(T.taBortLogo, "fara");
      bort.addEventListener("click", async function () {
        bort.disabled = true;
        var r = await db.from("companies").update({ logo_url: null }).eq("id", foretag.id);
        if (r.error) { QV.besked(document.getElementById("besked"), T.fel + r.error.message, "fel"); bort.disabled = false; return; }
        foretag.logo_url = null;
        logotypBild = "";
        ritaInstallningar();
        ritaForhands();
      });
      logorad.appendChild(bort);
    }
    kort.appendChild(logorad);

    // färg
    var fargrad = el("div", "display: flex; align-items: center; gap: 12px");
    var farg = document.createElement("input");
    farg.type = "color";
    farg.value = (foretag && foretag.brandfarg) || RESERVFARG;
    farg.style.cssText = "width: 54px; height: 42px; border: 1px solid #E6DDD9; border-radius: 12px; " +
      "background: #fff; padding: 4px; cursor: pointer";
    farg.addEventListener("input", ritaForhands);
    falt.farg = farg;
    fargrad.appendChild(farg);
    var fargtext = el("div");
    fargtext.appendChild(el("div", "font-size: 12.5px; font-weight: 600", T.farg));
    fargtext.appendChild(el("div", "font-size: 12px; color: #6E6560; margin-top: 2px", T.fargHjalp));
    fargrad.appendChild(fargtext);
    kort.appendChild(fargrad);

    // textfälten
    var rutnat = el("div", "display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px");
    falt.referens = textfalt(foretag && foretag.referens);
    falt.leverans = textfalt(foretag && foretag.leveransvillkor);
    falt.betalning = textfalt(foretag && foretag.betalningsvillkor);
    rutnat.appendChild(faltruta(T.referens, T.referensHjalp, falt.referens));
    rutnat.appendChild(faltruta(T.leverans, "", falt.leverans));
    rutnat.appendChild(faltruta(T.betalning, "", falt.betalning));
    kort.appendChild(rutnat);

    var spara = knapp(T.spara, "fylld");
    spara.style.justifySelf = "start";
    spara.addEventListener("click", function () { sparaUppgifter(spara); });
    kort.appendChild(spara);
  }

  async function sparaUppgifter(knappen) {
    var besked = document.getElementById("besked");
    knappen.disabled = true;
    QV.besked(besked, T.sparar, "neutral");

    var r = await db.from("companies").update({
      brandfarg: falt.farg.value,
      referens: falt.referens.value.trim() || null,
      leveransvillkor: falt.leverans.value.trim() || null,
      betalningsvillkor: falt.betalning.value.trim() || null
    }).eq("id", foretag.id);

    knappen.disabled = false;
    if (r.error) { QV.besked(besked, T.fel + r.error.message, "fel"); return; }

    foretag.brandfarg = falt.farg.value;
    foretag.referens = falt.referens.value.trim() || null;
    foretag.leveransvillkor = falt.leverans.value.trim() || null;
    foretag.betalningsvillkor = falt.betalning.value.trim() || null;
    QV.besked(besked, T.sparat, "bra");
  }

  async function laddaUppLogotyp(fil) {
    var besked = document.getElementById("besked");
    QV.besked(besked, T.sparar, "neutral");
    try {
      var ext = (fil.name.split(".").pop() || "png").toLowerCase();
      var vag = foretag.id + "/logotyp." + ext;
      var upp = await db.storage.from("kataloger").upload(vag, fil, { upsert: true, contentType: fil.type });
      if (upp.error) throw new Error(upp.error.message);

      // Sparas med prefixet storage: så att roboten vet att den ska hämta
      // filen med sin egen nyckel i stället för att öppna en länk.
      var r = await db.from("companies").update({ logo_url: "storage:" + vag }).eq("id", foretag.id);
      if (r.error) throw new Error(r.error.message);

      foretag.logo_url = "storage:" + vag;
      await laddaLogotypBild();
      ritaInstallningar();
      ritaForhands();
      QV.besked(besked, T.sparat, "bra");
    } catch (e) {
      QV.besked(besked, T.felBild + e.message, "fel");
    }
  }

  async function laddaLogotypBild() {
    logotypBild = "";
    if (!foretag || !foretag.logo_url) return;
    if (foretag.logo_url.indexOf("storage:") !== 0) { logotypBild = foretag.logo_url; return; }
    var vag = foretag.logo_url.slice("storage:".length);
    var r = await db.storage.from("kataloger").createSignedUrl(vag, 600);
    if (r.data && r.data.signedUrl) logotypBild = r.data.signedUrl;
  }

  /* ---------- mallkortet ---------- */

  function ritaMallkort() {
    var kort = document.getElementById("mallkort");
    kort.textContent = "";
    kort.style.cssText = KORT + "; padding: 18px 20px; display: flex; flex-wrap: wrap; align-items: center; gap: 14px";

    var v = el("div", "min-width: 0; margin-right: auto");
    var rad = el("div", "display: flex; align-items: center; gap: 10px; flex-wrap: wrap");
    rad.appendChild(el("span", RUBRIK + "; font-size: 16px", T.mallnamn));
    rad.appendChild(el("span", "font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em; " +
      "text-transform: uppercase; background: #1C1A19; color: #fff; padding: 5px 11px; border-radius: 999px", T.anvands));
    v.appendChild(rad);
    v.appendChild(el("div", "font-size: 13px; color: #6E6560; margin-top: 4px; line-height: 1.5", T.mallText));
    kort.appendChild(v);
  }

  /* ---------- förhandsgranskning av offerten ---------- */

  function ritaForhands() {
    var kort = document.getElementById("forhands");
    kort.textContent = "";
    kort.style.cssText = KORT + "; overflow: hidden";

    var topp = el("div", "padding: 16px 18px; border-bottom: 1px solid #F2EBE8");
    topp.appendChild(el("div", RUBRIK + "; font-size: 15px", T.forhands));
    topp.appendChild(el("div", "font-size: 12.5px; color: #6E6560; margin-top: 2px", T.forhandsText));
    kort.appendChild(topp);

    var farg = falt.farg ? falt.farg.value : ((foretag && foretag.brandfarg) || RESERVFARG);
    var referens = falt.referens ? falt.referens.value : ((foretag && foretag.referens) || "");
    var leverans = falt.leverans ? falt.leverans.value : ((foretag && foretag.leveransvillkor) || "");
    var betalning = falt.betalning ? falt.betalning.value : ((foretag && foretag.betalningsvillkor) || "");

    var papper = el("div", "margin: 18px; border: 1px solid #F2EBE8; border-radius: 12px; overflow: hidden; background: #fff");

    // listen högst upp, med logotyp eller företagsnamn
    var list = el("div", "background: " + farg + "; min-height: 54px; display: flex; align-items: center; " +
      "justify-content: space-between; padding: 12px 20px; gap: 12px");
    // Vit text på en ljus list går inte att läsa, så färgen följer listen.
    var pafarg = ljusFarg(farg) ? "#1C1A19" : "#fff";

    if (logotypBild) {
      var b = document.createElement("img");
      b.src = logotypBild;
      b.alt = "";
      b.style.cssText = "max-height: 32px; max-width: 150px; object-fit: contain";
      list.appendChild(b);
    } else {
      // Ingen egen logotyp: Quotifys ordmärke används, precis som i PDF:en.
      var mark = el("span", "font-size: 20px; color: " + pafarg);
      mark.className = "qf-mark";
      mark.setAttribute("aria-label", "Quotify");
      mark.appendChild(document.createTextNode("Qu"));
      var orb = el("span");
      orb.className = "qf-mark__orb";
      mark.appendChild(orb);
      mark.appendChild(document.createTextNode("tify"));
      list.appendChild(mark);
    }
    list.appendChild(el("div", "color: " + pafarg + "; font-family: Archivo, sans-serif; font-weight: 800; " +
      "font-size: 15px; letter-spacing: 0.12em", T.offert));
    papper.appendChild(list);

    var kropp = el("div", "padding: 18px 20px; font-size: 12.5px; color: #1C1A19");

    var uppgifter = el("div", "display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 16px");
    var vanster = el("div");
    vanster.appendChild(el("div", "font-weight: 700; margin-bottom: 3px", T.kund));
    vanster.appendChild(el("div", "color: #6E6560", "kontakt@kundforetag.se"));
    uppgifter.appendChild(vanster);

    var hoger = el("div", "display: grid; gap: 2px; color: #4B4442");
    var idag = new Date();
    var om30 = new Date(Date.now() + 30 * 864e5);
    [[T.ordernr, "OFF-1042"],
     [T.datum, idag.toISOString().slice(0, 10)],
     [T.giltig, om30.toISOString().slice(0, 10)],
     [T.varReferens, referens || T.ejAngiven]].forEach(function (p) {
      var r = el("div");
      r.appendChild(el("strong", null, p[0] + ": "));
      r.appendChild(document.createTextNode(p[1]));
      hoger.appendChild(r);
    });
    uppgifter.appendChild(hoger);
    kropp.appendChild(uppgifter);

    // tabellen, med riktiga artiklar ur katalogen om det finns några
    var rull = el("div", "overflow-x: auto");
    var tab = el("table", "width: 100%; border-collapse: collapse; font-size: 12px");
    var trh = el("tr");
    [T.artikel, T.antal, T.apris, T.summa].forEach(function (h, i) {
      trh.appendChild(el("th", "text-align: " + (i === 0 ? "left" : "right") + "; padding: 7px 8px; " +
        "border-bottom: 2px solid " + farg + "; color: " + farg + "; font-weight: 700; white-space: nowrap", h));
    });
    tab.appendChild(trh);

    var visade = exempelrader.length
      ? exempelrader.slice(0, 3).map(function (a, i) { return { namn: a.benamning, antal: i + 1, pris: Number(a.pris) || 0 }; })
      : [{ namn: T.exempelTom, antal: 1, pris: 0 }];

    var netto = 0;
    visade.forEach(function (r) {
      netto += r.antal * r.pris;
      var tr = el("tr");
      var c = "padding: 7px 8px; border-bottom: 1px solid #F2EBE8";
      tr.appendChild(el("td", c, r.namn));
      tr.appendChild(el("td", c + "; text-align: right", String(r.antal)));
      tr.appendChild(el("td", c + "; text-align: right; white-space: nowrap", QV.kr(r.pris)));
      tr.appendChild(el("td", c + "; text-align: right; white-space: nowrap", QV.kr(r.antal * r.pris)));
      tab.appendChild(tr);
    });
    rull.appendChild(tab);
    kropp.appendChild(rull);

    var summor = el("div", "display: grid; gap: 3px; justify-items: end; margin-top: 12px; color: #4B4442");
    [[T.netto, netto], [T.moms, netto * 0.25]].forEach(function (p) {
      summor.appendChild(el("div", null, p[0] + ": " + QV.kr(p[1])));
    });
    summor.appendChild(el("div", "font-family: Archivo, sans-serif; font-weight: 800; font-size: 14px; color: #1C1A19; margin-top: 3px",
      T.totalt + ": " + QV.kr(netto * 1.25)));
    kropp.appendChild(summor);

    var villkor = el("div", "margin-top: 14px; color: #6E6560; display: grid; gap: 2px");
    if (leverans) villkor.appendChild(el("div", null, T.leverans + ": " + leverans));
    if (betalning) villkor.appendChild(el("div", null, T.betalning + ": " + betalning));
    kropp.appendChild(villkor);

    papper.appendChild(kropp);
    papper.appendChild(el("div", "background: " + farg + "; height: 26px"));
    kort.appendChild(papper);
  }

  /* ---------- start ---------- */

  (async function () {
    var start = await QV.startaSida("mallar");
    if (!start) return;
    foretag = start.foretag;

    var topp = document.getElementById("topp");
    topp.style.cssText = "display: flex; flex-wrap: wrap; align-items: center; gap: 14px";
    topp.appendChild(el("h1", RUBRIK + "; font-size: 30px; letter-spacing: -0.035em; margin: 0", T.rubrik));

    document.getElementById("logovaljare").addEventListener("change", function (e) {
      var fil = e.target.files && e.target.files[0];
      if (fil) laddaUppLogotyp(fil);
      e.target.value = "";
    });

    if (!foretag) return;

    var a = await db.from("katalog_artiklar").select("benamning, pris").order("pris", { ascending: false }).limit(3);
    exempelrader = a.error ? [] : (a.data || []);

    await laddaLogotypBild();
    ritaMallkort();
    ritaInstallningar();
    ritaForhands();
  })();
})();
