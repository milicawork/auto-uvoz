# Crossings

What a used car from Europe actually costs once it lands in Serbia, Bosnia or Montenegro.

## The problem

A cheap German listing looks like a bargain until customs, VAT, transport and registration cost more than buying locally. No marketplace shows that full price.

## What it does

- Pick a source country (DE / AT / IT) and an import country (RS / BA / ME)
- Search listings on both markets at once
- Calculate landed cost: transport, customs, excise, VAT, registration
- AI writes a verdict on whether import is worth it, including mileage and year
- Click a row for a breakdown of every cost

## How it works

- **Exa** — neural search across classifieds in multiple countries
- **Grok (x.ai)** — extracts structured data from messy page text and writes the verdict
- **Next.js + TypeScript**
- **Render** — hosting

AI is used to make sense of unstructured listings. The customs calculation is deterministic in code, because the numbers have to be checkable.

## Live demo

https://auto-uvoz.onrender.com

## Disclaimer

Rates are estimates based on publicly available information, not an official customs calculation.

## Built at

Grok Bot Serbia Hackathon, Belgrade, September 2026
