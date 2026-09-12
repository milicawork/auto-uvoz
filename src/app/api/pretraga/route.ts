import {
  izracunajUvoz,
  type Destinacija,
  type Izvor,
} from "@/lib/uvoz";

export const maxDuration = 120;

type Gorivo = "dizel" | "benzin";
type Zemlja = Izvor | Destinacija;

type PretragaBody = {
  model: string;
  maxCena: number;
  maxKm: number;
  godisteOd: number;
  izvor: Izvor;
  destinacija: Destinacija;
};

type Razlaganje = ReturnType<typeof izracunajUvoz>;

type Oglas = {
  naziv: string;
  zemlja: Zemlja;
  godiste: number;
  km: number;
  cenaEur: number;
  zapreminaCcm: number;
  gorivo: Gorivo;
  url: string;
};

type OglasSaUkupno = Oglas & { ukupno: number; razlaganje: Razlaganje };

type ExaResult = {
  title?: string;
  url?: string;
  text?: string;
};

const IZVORI: Izvor[] = ["DE", "AT", "IT"];
const DESTINACIJE: Destinacija[] = ["RS", "BA", "ME"];

const SAJTOVI_IZVOR: Record<Izvor, string[]> = {
  DE: ["mobile.de", "autoscout24.de"],
  AT: ["autoscout24.at", "willhaben.at"],
  IT: ["autoscout24.it", "subito.it"],
};

const SAJTOVI_DESTINACIJA: Record<Destinacija, string[]> = {
  RS: ["polovniautomobili.com"],
  BA: ["olx.ba"],
  ME: ["autodiler.me"],
};

const NAZIV_IZVORA: Record<Izvor, string> = {
  DE: "GERMANY",
  AT: "AUSTRIA",
  IT: "ITALY",
};

const NAZIV_DESTINACIJE: Record<Destinacija, string> = {
  RS: "SERBIA",
  BA: "BOSNIA AND HERZEGOVINA",
  ME: "MONTENEGRO",
};

function greska(poruka: string, status = 500) {
  return Response.json({ greska: poruka }, { status });
}

function ocistiJsonOdgovor(sirovo: string) {
  return sirovo
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
}

function jeBroj(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function brojIliPodrazumevano(value: unknown, podrazumevano: number) {
  const broj = Number(value);
  return Number.isNaN(broj) ? podrazumevano : broj;
}

function jeIzvor(value: unknown): value is Izvor {
  return IZVORI.includes(value as Izvor);
}

function jeDestinacija(value: unknown): value is Destinacija {
  return DESTINACIJE.includes(value as Destinacija);
}

function zemljaIzUrl(url: string): Zemlja | null {
  const adresa = url.toLowerCase();
  if (adresa.includes("mobile.de") || adresa.includes("autoscout24.de")) {
    return "DE";
  }
  if (adresa.includes("autoscout24.at") || adresa.includes("willhaben.at")) {
    return "AT";
  }
  if (adresa.includes("autoscout24.it") || adresa.includes("subito.it")) {
    return "IT";
  }
  if (adresa.includes("polovniautomobili.com")) {
    return "RS";
  }
  if (adresa.includes("olx.ba")) {
    return "BA";
  }
  if (adresa.includes("autodiler.me")) {
    return "ME";
  }
  return null;
}

function normalizujZemlju(value: unknown, url: string): Zemlja | null {
  const izUrl = zemljaIzUrl(url);
  if (izUrl) {
    return izUrl;
  }

  const zemlja = String(value ?? "").toLowerCase();
  if (zemlja.includes("nema") || zemlja.includes("german") || zemlja === "de") {
    return "DE";
  }
  if (zemlja.includes("austri") || zemlja === "at") {
    return "AT";
  }
  if (zemlja.includes("ital") || zemlja === "it") {
    return "IT";
  }
  if (zemlja.includes("srb") || zemlja.includes("serb") || zemlja === "rs") {
    return "RS";
  }
  if (
    zemlja.includes("bosn") ||
    zemlja.includes("herzeg") ||
    zemlja === "ba"
  ) {
    return "BA";
  }
  if (
    zemlja.includes("montenegr") ||
    zemlja.includes("crna") ||
    zemlja === "me"
  ) {
    return "ME";
  }
  return null;
}

function normalizujGorivo(value: unknown): Gorivo {
  const gorivo = String(value ?? "").toLowerCase();
  return gorivo.includes("diz") || gorivo.includes("dies")
    ? "dizel"
    : "benzin";
}

function lokalnoRazlaganje(cenaEur: number): Razlaganje {
  const cenaOglas = Math.round(cenaEur);
  return {
    cenaOglas,
    transport: 0,
    carinskaOsnovica: cenaOglas,
    carina: 0,
    akciza: 0,
    pdvOsnovica: cenaOglas,
    pdv: 0,
    registracija: 0,
    ukupno: cenaOglas,
  };
}

function normalizujOglas(value: unknown): Oglas | null {
  if (value == null || typeof value !== "object") {
    return null;
  }

  const sirovo = value as Record<string, unknown>;
  const naziv = typeof sirovo.naziv === "string" ? sirovo.naziv.trim() : "";
  const url = typeof sirovo.url === "string" ? sirovo.url.trim() : "";
  const zemlja = normalizujZemlju(sirovo.zemlja, url);
  const cenaEur = Number(sirovo.cenaEur);

  if (!naziv || !url || !zemlja || Number.isNaN(cenaEur) || cenaEur === 0) {
    return null;
  }

  return {
    naziv,
    zemlja,
    godiste: brojIliPodrazumevano(sirovo.godiste, 2016),
    km: brojIliPodrazumevano(sirovo.km, 150000),
    cenaEur,
    zapreminaCcm: brojIliPodrazumevano(sirovo.zapreminaCcm, 1600),
    gorivo: normalizujGorivo(sirovo.gorivo),
    url,
  };
}

async function exaPretraga(
  query: string,
  includeDomains: string[],
  apiKey: string,
): Promise<ExaResult[]> {
  const odgovor = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      includeDomains,
      numResults: 10,
      type: "auto",
      contents: { text: { maxCharacters: 2000 } },
    }),
  });

  const tekst = await odgovor.text();
  if (!odgovor.ok) {
    throw new Error(`Exa API error (${odgovor.status}): ${tekst.slice(0, 400)}`);
  }

  const podaci = JSON.parse(tekst) as { results?: ExaResult[] };
  return podaci.results ?? [];
}

function formatirajRezultate(rezultati: ExaResult[], izvor: string) {
  return rezultati
    .map((rezultat, index) => {
      const naslov = rezultat.title ?? "(no title)";
      const url = rezultat.url ?? "";
      const tekst = rezultat.text ?? "";
      return `[${izvor} #${index + 1}]\nTitle: ${naslov}\nURL: ${url}\nText:\n${tekst}`;
    })
    .join("\n\n---\n\n");
}

function upitIzvor(model: string, izvor: Izvor) {
  if (izvor === "IT") {
    return `${model} auto usata in vendita`;
  }
  return `${model} gebrauchtwagen kaufen`;
}

function upitDestinacija(model: string) {
  return `${model} polovan automobil na prodaju`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PretragaBody;
    const { model, maxCena, maxKm, godisteOd, izvor, destinacija } = body;

    if (
      typeof model !== "string" ||
      !model.trim() ||
      !jeBroj(maxCena) ||
      !jeBroj(maxKm) ||
      !jeBroj(godisteOd) ||
      !jeIzvor(izvor) ||
      !jeDestinacija(destinacija)
    ) {
      return greska(
        "Invalid request: expected model, maxCena, maxKm, godisteOd, izvor and destinacija.",
        400,
      );
    }

    const exaApiKey = process.env.EXA_API_KEY?.trim();
    const xaiApiKey = process.env.XAI_API_KEY?.trim();
    if (!exaApiKey || !xaiApiKey) {
      return greska("Missing API keys (EXA_API_KEY or XAI_API_KEY).");
    }

    const [izvorRezultati, prvaDestinacija] = await Promise.all([
      exaPretraga(upitIzvor(model, izvor), SAJTOVI_IZVOR[izvor], exaApiKey),
      exaPretraga(
        upitDestinacija(model),
        SAJTOVI_DESTINACIJA[destinacija],
        exaApiKey,
      ),
    ]);

    let destinacijaRezultati = prvaDestinacija;
    if (destinacijaRezultati.length < 2) {
      destinacijaRezultati = await exaPretraga(
        model.trim(),
        SAJTOVI_DESTINACIJA[destinacija],
        exaApiKey,
      );
    }

    console.log(`Exa ${izvor} results:`, izvorRezultati.length);
    console.log(
      `Oglasi iz destinacije (${destinacija}):`,
      destinacijaRezultati.length,
    );
    console.log(
      `First ${izvor} result:`,
      JSON.stringify(izvorRezultati[0])?.slice(0, 800),
    );

    const sistemPrompt = `You extract used-car listing data from page text.
Return ONLY a valid JSON array, with no markdown fences and no explanation.
Format: [{"naziv","zemlja","godiste","km","cenaEur","zapreminaCcm","gorivo","url"}]
Rules:
- Include a listing if you can read at least the model name and price. Guess the rest reasonably.
- zemlja must be one of: DE, AT, IT, RS, BA, ME.
- If engine size is missing, use 1600.
- If year is missing, use 2016.
- If mileage is missing, use 150000.
- If fuel is missing, use "dizel". Fuel must be "dizel" or "benzin".
- Prices are in EUR.
- Ako naziv već sadrži marku, ne ponavljaj je.
Vrati čist naziv bez duplikata marke.
- Do not filter by price, mileage, or year. Return everything you find.
- If you truly cannot find any listing with a price, return [].
Return at most 10 listings.`;

    const korisnickiPrompt = `=== ${NAZIV_IZVORA[izvor]} (${izvor}) ===
${formatirajRezultate(izvorRezultati, izvor)}

=== ${NAZIV_DESTINACIJE[destinacija]} (${destinacija}) ===
${formatirajRezultate(destinacijaRezultati, destinacija)}`;

    const xaiOdgovor = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4",
        messages: [
          { role: "system", content: sistemPrompt },
          { role: "user", content: korisnickiPrompt },
        ],
      }),
    });

    const xaiTekst = await xaiOdgovor.text();
    if (!xaiOdgovor.ok) {
      console.error("xAI raw response:", xaiTekst);
      return greska(`xAI API error (${xaiOdgovor.status}).`);
    }

    const xaiJson = JSON.parse(xaiTekst) as {
      choices?: { message?: { content?: string } }[];
    };
    const sirovModel = xaiJson.choices?.[0]?.message?.content ?? "";
    console.log("Raw model response:", sirovModel);

    let parsiran: unknown;
    try {
      parsiran = JSON.parse(ocistiJsonOdgovor(sirovModel));
    } catch (parseError) {
      console.error("JSON.parse failed:", parseError);
      return greska("The model did not return valid JSON.");
    }

    if (!Array.isArray(parsiran)) {
      return greska("The model did not return a JSON array.");
    }

    const oglasi: OglasSaUkupno[] = parsiran
      .map(normalizujOglas)
      .filter((oglas): oglas is Oglas => oglas !== null)
      .slice(0, 8)
      .map((oglas) => {
        if (jeIzvor(oglas.zemlja)) {
          const razlaganje = izracunajUvoz(
            oglas.cenaEur,
            oglas.zapreminaCcm,
            oglas.godiste,
            oglas.gorivo,
            oglas.zemlja,
            destinacija,
          );
          return { ...oglas, ukupno: razlaganje.ukupno, razlaganje };
        }

        const razlaganje = lokalnoRazlaganje(oglas.cenaEur);
        return { ...oglas, ukupno: razlaganje.ukupno, razlaganje };
      })
      .sort((a, b) => a.ukupno - b.ukupno);

    console.log("After normalization:", oglasi.length);

    let zakljucak = "";
    if (oglasi.length > 0) {
      try {
        const sistemZakljucak = `Ti si savetnik za uvoz polovnih automobila. Na osnovu liste oglasa napiši
2-3 rečenice zaključka na engleskom. Reci da li se uvoz isplati i zašto,
navedi konkretne brojeve i imena modela. Ako uvoz nema smisla, reci to jasno.
Pomeni i kompromise (kilometraža, godište), ne samo cenu.
Piši direktno i kratko, bez uvoda i bez fraza tipa 'Based on the data'.
Vrati samo tekst, bez markdown formatiranja.`;

        const listaZaModel = oglasi.map((oglas) => ({
          naziv: oglas.naziv,
          zemlja: oglas.zemlja,
          godiste: oglas.godiste,
          km: oglas.km,
          cena: oglas.cenaEur,
          landedCost: oglas.ukupno,
        }));

        const zakljucakOdgovor = await fetch(
          "https://api.x.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${xaiApiKey}`,
            },
            body: JSON.stringify({
              model: "grok-4",
              messages: [
                { role: "system", content: sistemZakljucak },
                {
                  role: "user",
                  content: JSON.stringify(listaZaModel),
                },
              ],
            }),
          },
        );

        const zakljucakTekst = await zakljucakOdgovor.text();
        if (!zakljucakOdgovor.ok) {
          console.error("xAI conclusion error:", zakljucakTekst);
        } else {
          const zakljucakJson = JSON.parse(zakljucakTekst) as {
            choices?: { message?: { content?: string } }[];
          };
          zakljucak = (zakljucakJson.choices?.[0]?.message?.content ?? "").trim();
        }
      } catch (zakljucakError) {
        console.error("xAI conclusion failed:", zakljucakError);
      }
    }

    return Response.json({ oglasi, zakljucak });
  } catch (error) {
    console.error("Error in /api/pretraga:", error);
    const poruka = error instanceof Error ? error.message : "Unknown error";
    return greska(poruka);
  }
}
