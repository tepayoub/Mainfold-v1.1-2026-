# Mainfold — website

Volledige, meerdere pagina's tellende marketingwebsite voor Mainfold (IT/OT
Cybersecurity & Technology Consulting), gebouwd als statische HTML/CSS/JS-site
zonder build-stap.

## Structuur

```
index.html         Homepage
diensten.html       Consulting, Capacity, Projects & teams, tarieven
expertise.html      IT/OT-security, cloud & infra, sectoren, ideale klant
compliance.html     NIS2, IEC 62443, ISO 27001, marktanalyse, governance
over-ons.html        Visie, aanpak, sales engine, go-to-market, team
contact.html         Intakeformulier en contactgegevens
assets/css/style.css Design system (kleuren, typografie, componenten)
assets/js/main.js    Scroll reveal, tellers, ticker, terminal-animatie, menu
```

## Lokaal bekijken

Geen build-tools nodig. Serveer de map met eender welke statische server, bijvoorbeeld:

```
python3 -m http.server 8000
```

en open `http://localhost:8000`.

## Deploy

De site is volledig statisch en kan zonder aanpassing gehost worden op elk
statisch platform (GitHub Pages, Netlify, Vercel, S3, …): kopieer de
repository-inhoud naar de hostingdienst van keuze.
