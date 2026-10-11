# Print9 OpenTools

Fast, free business tools by Print9 — live at **https://print9-studio.github.io/opentools/**

Plain HTML/CSS/JavaScript, no framework, works offline after the first visit and can be added to a phone's home screen.

## Tools
- **Money & GST:** GST calculator (add/remove, CGST+SGST or IGST, round-off), calculator with tape and +GST/−GST keys, bill totaliser (mixed rates, rate-wise summary), amount in words, price & margin, percentage, EMI.
- **Codes & checks:** HSN/SAC search (official GSTN list + Print9 codes with GST rates), GSTIN check, PAN check, IFSC finder, PIN code finder.
- **Print shop:** ups/imposition calculator, image DPI check, unit converter, paper sizes.
- **Payments & sharing:** UPI payment QR, QR code maker, WhatsApp link.
- **Everyday:** date calculator, quick notes.

## Data
- `data/hsn-sac.json` is built automatically from the official GSTN file
  `https://tutorial.gst.gov.in/downloads/HSN_SAC.xlsx` by `scripts/build_hsn.py`.
  The publish workflow refreshes it on the 1st and 15th of every month and refuses
  to replace good data with a broken download.
- Print9's quick-code GST rates live in `assets/lib/print9-codes.js`, each with its
  source (Notification 9/2025-CT(Rate), 15/2025-CT(Rate)) or a "confirm with CA" flag.

## Checks
`node --test tests/logic.test.mjs` — GST maths cross-checked against an independent
reference on 40,000 random cases, GSTIN check digits, amount in words, imposition
geometry, calculator, dates, data integrity, and offline file list.

## Publishing
Every push to `main` runs `.github/workflows/deploy.yml`, which refreshes the HSN data,
stamps the offline cache version and publishes to GitHub Pages.
