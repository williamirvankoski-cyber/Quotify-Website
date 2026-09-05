# Quotify — hemsidan

Marknadssajten för Quotify (Gmail/Outlook-tillägget som skriver offerter).
Vanlig HTML och CSS, inget byggsteg — filerna du ser är filerna som publiceras.

Live: https://williamirvankoski-cyber.github.io/Quotify-Website/

## Två språk

Svenska är standard och ligger i roten. Engelska ligger i `en/`.

| Svenska | Engelska | Sida |
|---|---|---|
| `index.html` | `en/index.html` | Startsida |
| `features.html` | `en/features.html` | Funktioner |
| `how-it-works.html` | `en/how-it-works.html` | Så fungerar det |
| `pricing.html` | `en/pricing.html` | Priser (med månads-/årsväxlare) |
| `integrations.html` | `en/integrations.html` | Integrationer |
| `help.html` | `en/help.html` | Hjälpcenter |
| `about.html` | `en/about.html` | Om oss |
| `contact.html` | `en/contact.html` | Kontakt |
| `signup.html` | `en/signup.html` | Prova gratis |
| `login.html` | `en/login.html` | Logga in |
| `dashboard.html` | `en/dashboard.html` | Inloggad vy, hämtar riktiga offerter |

Filnamnen är avsiktligt identiska i båda språken. Det gör språkväljaren enkel:
den byter bara mapp och behåller sidan man står på.

Språk byts på två ställen, båda kopplade:
- **jordglobsikonen uppe till höger i menyn** (visar EN på svenska sidor, SV på engelska)
- **pillren längst ned i sidfoten**, där aktivt språk är mörkt markerat

## Filer

- `assets/site.css` — all delad stil, typsnitt, hovereffekter och språkväljaren.
  Samma fil används av båda språken (engelska sidor länkar `../assets/site.css`).
- `assets/fonts/` — Archivo och Karla som lokala filer, så sidan inte hämtar något utifrån.

## Titta på den lokalt

Öppna `index.html` i webbläsaren. Det räcker.

## Ändra något

Texterna står som vanlig text i HTML-filerna — sök efter meningen du vill ändra.

**Viktigt: ändrar du en text måste du ändra den i båda språken.** Rubriken på
startsidan finns i `index.html` och i `en/index.html`. Det finns inget som
håller dem i synk automatiskt.

Priserna finns på tre ställen per språk som måste stämma överens:
1. texten som syns direkt i `pricing.html` (249 / 649 kr)
2. skriptet längst ned i samma fil (siffrorna för månad och år)
3. prisrutan på startsidan

## Inloggning

`login.html` och `signup.html` är kopplade till Supabase Auth via
`assets/auth.js`. Biblioteket ligger lokalt i `assets/supabase.js`, så sidan
hämtar ingenting utifrån.

- **Mejl och lösenord** fungerar redan. Vilken giltig adress som helst duger,
  oavsett domän — gmail, hotmail, outlook, egen företagsdomän, plus-taggar.
- **Google** är påslagen och fungerar. **Microsoft** är avstängd — den väntar
  tills en kund frågar efter den, eftersom Outlook- och Hotmail-adresser redan
  kan registrera sig med mejl och lösenord. Koden frågar först vilka
  leverantörer som är påslagna och säger till i klartext, i stället för att
  skicka användaren till en felsida. Slå på fler under Authentication →
  Providers.
- `dashboard.html` kräver inloggning och skickar tillbaka till `login.html`
  med `?next=` om man inte är inloggad.
- **Kom ihåg mig** vid inloggningen avgör var sessionen sparas: ikryssad ger
  localStorage (kvar när fliken stängs, gäller i alla flikar), urkryssad ger
  sessionStorage (försvinner när fliken stängs). Rutan är ikryssad som förval.
  Ingen automatisk utloggning efter inaktivitet.
- Nya konton måste bekräfta sin mejladress. Supabases inbyggda utskick är
  hårt begränsat och bara till för test — koppla en egen SMTP-leverantör
  under Authentication → Emails innan riktiga kunder registrerar sig.

Sidorna finns i båda språken. Ändrar du en text måste du ändra den på båda
ställena, precis som för resten av sajten.

## Var designen kommer ifrån

Designen gjordes i Claude Design. Originalet ligger i mappen
`Quotation plugin website design code` på skrivbordet — `.dc.html`-filerna är
källan om designen ska göras om från grunden, och `screens/` innehåller bilder
på alla sidor. Den här mappen innehåller den uppackade, publicerbara versionen.

## Att göra

- [ ] Priserna 249 / 649 / 1 490 kr är platshållare — byt till riktiga siffror
- [x] Registrering och inloggning fungerar (Supabase Auth) — se avsnittet Inloggning
- [ ] Kontaktformuläret skickar fortfarande ingenting
- [x] Google-inloggning fungerar; Microsoft väntar tills någon frågar efter den
- [x] `dashboard.html` hämtar riktiga offerter — exempeldatan är borttagen
- [ ] Två siffror på översikten visar streck, de saknar datakälla:
      "skickade denna månad" och katalogens storlek
- [ ] Byt `© 2026 Quotify AB · Stockholm` till rätt uppgifter innan lansering
- [ ] Exempeloffertet genom hela sajten är en badrumsrenovering. Det fungerar som
      exempel, men om målgruppen ska kännas bredare än bygg kan det bytas mot
      något mer neutralt.
