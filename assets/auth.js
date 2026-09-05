/**
 * Quotify — inloggning.
 *
 * Delas av login.html, signup.html och dashboard.html i båda språken.
 * Kräver att assets/supabase.js laddats först.
 *
 * Supabase sköter allt känsligt: lösenorden lagras aldrig här, och sessionen
 * ligger i webbläsarens localStorage under en nyckel biblioteket äger.
 */

const SUPABASE_URL = "https://nhxnafohgcedrjykahhh.supabase.co";
// Publik nyckel. Den är gjord för att ligga synlig i webbläsaren — skyddet
// sitter i databasens RLS-regler, inte i att nyckeln är hemlig.
const SUPABASE_ANON_KEY = "sb_publishable_lr9e7kMeYIWx47R6-834DQ_LyQQGoCg";

// Fånga adressen INNAN klienten skapas. supabase-js plockar bort nyckeln ur
// fragmentet så fort den startar, så läser vi window.location senare är den
// redan borta — och då ser en lyckad Google-inloggning ut som ingen alls.
const _adressVidStart = (window.location.hash || "") + (window.location.search || "");

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- språk ---------- */

const SV = document.documentElement.lang !== "en";

const TXT = {
  sv: {
    epostSaknas: "Fyll i din mejladress.",
    epostOgiltig: "Det där ser inte ut som en mejladress.",
    losenSaknas: "Fyll i ett lösenord.",
    losenKort: "Lösenordet måste vara minst 10 tecken.",
    foretagSaknas: "Fyll i företagsnamnet.",
    fel: "Något gick fel. Försök igen.",
    felInlogg: "Fel mejladress eller lösenord.",
    epostFinns: "Det finns redan ett konto med den mejladressen.",
    bekraftaMejl:
      "Nästan klart! Vi har skickat en bekräftelselänk till {e}. Klicka på den så är kontot igång.",
    leverantorAv:
      "{p}-inloggning är inte påslagen än. Använd mejl och lösenord så länge.",
    loggarIn: "Loggar in…",
    skapar: "Skapar kontot…",
  },
  en: {
    epostSaknas: "Enter your email address.",
    epostOgiltig: "That doesn't look like an email address.",
    losenSaknas: "Enter a password.",
    losenKort: "The password must be at least 10 characters.",
    foretagSaknas: "Enter your company name.",
    fel: "Something went wrong. Try again.",
    felInlogg: "Wrong email or password.",
    epostFinns: "An account with that email already exists.",
    bekraftaMejl:
      "Almost there. We sent a confirmation link to {e}. Click it and your account is live.",
    leverantorAv: "{p} sign-in isn't switched on yet. Use email and password for now.",
    loggarIn: "Signing in…",
    skapar: "Creating your account…",
  },
};

const T = SV ? TXT.sv : TXT.en;

/* ---------- adresser ---------- */

// Sidorna heter likadant i båda språken, så relativa länkar räcker.
// redirectTo måste vara absolut, och ska peka tillbaka till samma språk.
function absolutUrl(fil) {
  return new URL(fil, window.location.href).href;
}

/* ---------- validering ---------- */

// Avsiktligt tillåtande: vilken giltig mejladress som helst duger, oavsett
// domän. Vi hindrar inte gmail, hotmail, outlook, egen företagsdomän eller
// något annat — bara uppenbara slarvfel.
function giltigEpost(v) {
  const e = String(v || "").trim();
  if (!e || e.length > 254) return false;
  if (/\s/.test(e)) return false;
  const delar = e.split("@");
  if (delar.length !== 2) return false;
  const [lokal, domän] = delar;
  if (!lokal || lokal.length > 64) return false;
  if (!domän || domän.length > 253) return false;
  if (domän.startsWith("-") || domän.endsWith("-")) return false;
  if (!domän.includes(".")) return false;
  if (domän.startsWith(".") || domän.endsWith(".") || domän.includes("..")) return false;
  // Toppdomänen ska vara bokstäver, minst två.
  const toppdoman = domän.split(".").pop();
  return /^[a-z]{2,}$/i.test(toppdoman);
}

/* ---------- meddelanderuta ---------- */

function visaBesked(el, text, typ) {
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
  el.style.borderRadius = "14px";
  el.style.padding = "12px 14px";
  el.style.fontSize = "13.5px";
  el.style.lineHeight = "1.5";
  if (typ === "fel") {
    el.style.background = "#FFF3F0";
    el.style.border = "1px solid #FADFD7";
    el.style.color = "#8E3A22";
  } else if (typ === "ok") {
    el.style.background = "#E4F6EB";
    el.style.border = "1px solid #C7E8D5";
    el.style.color = "#2A7A50";
  } else {
    el.style.background = "#FDFBFA";
    el.style.border = "1px solid #F2EBE8";
    el.style.color = "#4B4442";
  }
}

function doljBesked(el) {
  if (el) el.hidden = true;
}

/* ---------- inloggning ---------- */

async function loggaInMedLosenord(epost, losenord) {
  const { data, error } = await db.auth.signInWithPassword({
    email: epost.trim(),
    password: losenord,
  });
  if (error) {
    const m = String(error.message || "");
    if (/invalid login credentials/i.test(m)) throw new Error(T.felInlogg);
    if (/email not confirmed/i.test(m)) {
      throw new Error(T.bekraftaMejl.replace("{e}", epost.trim()));
    }
    throw new Error(m || T.fel);
  }
  return data;
}

async function registrera(epost, losenord, foretag) {
  const { data, error } = await db.auth.signUp({
    email: epost.trim(),
    password: losenord,
    options: {
      // Triggern hantera_ny_anvandare i databasen läser company_name härifrån
      // och skapar företaget plus profilen automatiskt.
      data: { company_name: (foretag || "").trim() },
      emailRedirectTo: absolutUrl("dashboard.html"),
    },
  });
  if (error) {
    const m = String(error.message || "");
    if (/already registered|already exists/i.test(m)) throw new Error(T.epostFinns);
    throw new Error(m || T.fel);
  }
  // Kräver projektet mejlbekräftelse finns ingen session än — bara en användare.
  return { data, behoverBekraftas: !data.session };
}

// Vilka externa leverantörer som är påslagna i projektet. Hämtas en gång.
let _leverantorer = null;
async function leverantorerPa() {
  if (_leverantorer) return _leverantorer;
  try {
    const r = await fetch(SUPABASE_URL + "/auth/v1/settings", {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    const j = await r.json();
    _leverantorer = j.external || {};
  } catch (e) {
    _leverantorer = {};
  }
  return _leverantorer;
}

const LEVERANTORSNAMN = { google: "Google", azure: "Microsoft" };

async function loggaInMedLeverantor(leverantor) {
  // signInWithOAuth kastar inget fel när leverantören är avstängd — den
  // skickar iväg webbläsaren till Supabase, som svarar med rå JSON. Därför
  // frågar vi först, så användaren får ett begripligt besked i stället.
  const pa = await leverantorerPa();
  if (!pa[leverantor]) {
    throw new Error(T.leverantorAv.replace("{p}", LEVERANTORSNAMN[leverantor] || leverantor));
  }

  const { error } = await db.auth.signInWithOAuth({
    provider: leverantor, // 'google' | 'azure'
    options: {
      redirectTo: absolutUrl("dashboard.html"),
      // Azure behöver be om mejladressen explicit.
      scopes: leverantor === "azure" ? "email openid profile" : undefined,
    },
  });
  if (error) throw new Error(String(error.message || T.fel));
}

// Kommer användaren tillbaka från en avbruten inloggning ligger felet i
// adressen, antingen som ?error=... eller #error=...
function oauthFelFranUrl() {
  // Samma sak här: felet kan ligga i fragmentet, som biblioteket redan städat.
  for (const del of _adressVidStart.split(/(?=[?#])/)) {
    if (!del) continue;
    const p = new URLSearchParams(del.replace(/^[?#]/, ""));
    const fel = p.get("error_description") || p.get("error");
    if (fel) return decodeURIComponent(fel).replace(/\+/g, " ");
  }
  return null;
}

// Visar ett sådant fel utan att sidan behöver göra något själv, och städar
// bort det ur adressfältet så en omladdning inte visar det igen.
document.addEventListener("DOMContentLoaded", () => {
  const fel = oauthFelFranUrl();
  if (!fel) return;
  const ruta = document.getElementById("besked") || document.getElementById("besked-signup");
  if (ruta) visaBesked(ruta, fel, "fel");
  history.replaceState({}, "", window.location.pathname);
});

async function loggaUt() {
  await db.auth.signOut();
  window.location.href = absolutUrl("login.html");
}

async function nuvarandeAnvandare() {
  const { data } = await db.auth.getSession();
  return data.session ? data.session.user : null;
}

// Kommer man direkt tillbaka från Google eller Microsoft ligger nyckeln i
// adressens fragment, och biblioteket behöver ett kort ögonblick på sig att
// byta den mot en session. Frågar vi för tidigt ser det ut som att
// inloggningen misslyckades.
function komFranInloggning() {
  return /access_token|refresh_token|[?&#]code=/.test(_adressVidStart);
}

function vantaPaSession(maxMs = 5000) {
  return new Promise((klar) => {
    const start = Date.now();
    const { data: prenumeration } = db.auth.onAuthStateChange((_, session) => {
      if (session) {
        prenumeration.subscription.unsubscribe();
        klar(session.user);
      }
    });
    // Bältet och hängslena: händelsen kan ha hunnit passera innan vi lyssnade.
    (async function polla() {
      const anv = await nuvarandeAnvandare();
      if (anv) {
        prenumeration.subscription.unsubscribe();
        return klar(anv);
      }
      if (Date.now() - start > maxMs) {
        prenumeration.subscription.unsubscribe();
        return klar(null);
      }
      setTimeout(polla, 150);
    })();
  });
}

// Läggs överst på sidor som kräver inloggning.
async function kravInloggning() {
  let anv = await nuvarandeAnvandare();

  if (!anv && komFranInloggning()) anv = await vantaPaSession();

  if (!anv) {
    const nu = window.location.pathname.split("/").pop() || "dashboard.html";
    window.location.replace(absolutUrl("login.html") + "?next=" + encodeURIComponent(nu));
    return null;
  }

  // Städa bort nycklarna ur adressfältet när de väl är sparade.
  if (window.location.hash && /access_token|refresh_token/.test(window.location.hash)) {
    history.replaceState({}, "", window.location.pathname);
  }
  return anv;
}

// Skickar vidare till sidan användaren ville åt, eller till översikten.
function gaVidareEfterInloggning() {
  const next = new URLSearchParams(window.location.search).get("next");
  const mal = next && /^[a-z0-9-]+\.html$/i.test(next) ? next : "dashboard.html";
  window.location.href = absolutUrl(mal);
}
