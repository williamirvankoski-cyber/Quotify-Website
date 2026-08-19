# Quotify — hemsidan

Marknadssajten för Quotify (Gmail/Outlook-tillägget som skriver offerter).
Vanlig HTML och CSS, inget byggsteg — filerna du ser är filerna som publiceras.

## Sidor

| Fil | Sida |
|---|---|
| `index.html` | Startsida |
| `features.html` | Features |
| `how-it-works.html` | How it works |
| `pricing.html` | Pricing (med månads-/årsväxlare) |
| `integrations.html` | Integrations |
| `help.html` | Help centre |
| `about.html` | About |
| `contact.html` | Contact |
| `signup.html` | Start free trial |
| `dashboard.html` | Inloggad vy (design, inte kopplad än) |

`assets/site.css` — all delad stil, inklusive typsnitten.
`assets/fonts/` — Archivo och Karla som lokala filer, så sidan inte behöver hämta något utifrån.

## Titta på den lokalt

Öppna `index.html` i webbläsaren. Det räcker för att se sajten.

## Ändra något

Rubriker och texter står som vanlig text i HTML-filerna — sök efter meningen du vill
ändra. Färger och typsnitt ligger dels i `assets/site.css`, dels som `style="..."`
direkt på elementen.

Priserna finns på två ställen som måste hållas i synk:
1. `pricing.html` — texten som syns direkt (249 / 649 kr)
2. skriptet längst ned i `pricing.html` — siffrorna för månad och år

## Var designen kommer ifrån

Designen gjordes i Claude Design. Originalet ligger i mappen
`Quotation plugin website design code` på skrivbordet — `.dc.html`-filerna är
källan om designen ska ändras om från grunden, och `screens/` innehåller bilder
på alla sidor. Den här mappen innehåller den uppackade, publicerbara versionen.

## Att göra

- [ ] Priserna 249 / 649 / 1 490 kr är platshållare — byt till riktiga siffror
- [ ] Kontaktformuläret och sign up-formuläret ser ut att fungera men skickar ingenting än
- [ ] `dashboard.html` är en designskiss, inte kopplad till Supabase
- [ ] Språkväljaren English/Svenska i sidfoten är inte kopplad — svensk version saknas
- [ ] Byt `© 2026 Quotify AB · Stockholm` till rätt uppgifter innan lansering
