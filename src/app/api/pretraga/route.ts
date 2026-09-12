import { izracunajUvoz } from "@/lib/uvoz";

export const maxDuration = 120;

type Gorivo = "dizel" | "benzin";
type Zemlja = "DE" | "RS";

type PretragaBody = {
  model: string;
  maxCena: number;
  maxKm: number;
  godisteOd: number;
};

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

type OglasSaUkupno = Oglas & { ukupno: number };

type ExaResult = {
  title?: string;
  url?: string;
  text?: string;
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

function normalizujZemlju(value: unknown): Zemlja | null {
  const zemlja = String(value ?? "").toLowerCase();
  if (zemlja.includes("nema") || zemlja === "de") {
    return "DE";
  }
  if (zemlja.includes("srb") || zemlja === "rs") {
    return "RS";
  }
  return null;
}

function normalizujGorivo(value: unknown): Gorivo {
  const gorivo = String(value ?? "").toLowerCase();
  return gorivo.includes("diz") ? "dizel" : "benzin";
}

function normalizujOglas(value: unknown): Oglas | null {
  if (value == null || typeof value !== "object") {
    return null;
  }

  const sirovo = value as Record<string, unknown>;
  const naziv = typeof sirovo.naziv === "string" ? sirovo.naziv.trim() : "";
  const url = typeof sirovo.url === "string" ? sirovo.url.trim() : "";
  const zemlja = normalizujZemlju(sirovo.zemlja);
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
    throw new Error(`Exa API greška (${odgovor.status}): ${tekst.slice(0, 400)}`);
  }

  const podaci = JSON.parse(tekst) as { results?: ExaResult[] };
  return podaci.results ?? [];
}

function formatirajRezultate(rezultati: ExaResult[], izvor: string) {
  return rezultati
    .map((rezultat, index) => {
      const naslov = rezultat.title ?? "(bez naslova)";
      const url = rezultat.url ?? "";
      const tekst = rezultat.text ?? "";
      return `[${izvor} #${index + 1}]\nNaslov: ${naslov}\nURL: ${url}\nTekst:\n${tekst}`;
    })
    .join("\n\n---\n\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PretragaBody;
    const { model, maxCena, maxKm, godisteOd } = body;

    if (
      typeof model !== "string" ||
      !model.trim() ||
      !jeBroj(maxCena) ||
      !jeBroj(maxKm) ||
      !jeBroj(godisteOd)
    ) {
      return greska("Neispravan zahtev: očekujem model, maxCena, maxKm i godisteOd.", 400);
    }

    const exaApiKey = process.env.EXA_API_KEY?.trim();
    const xaiApiKey = process.env.XAI_API_KEY?.trim();
    if (!exaApiKey || !xaiApiKey) {
      return greska("Nedostaju API ključevi (EXA_API_KEY ili XAI_API_KEY).");
    }

    const queryDe = `${model} polovan automobil oglas prodaja`;
    const queryRs = `${model} polovan automobil na prodaju`;

    const [deRezultati, rsRezultati] = await Promise.all([
      exaPretraga(queryDe, ["mobile.de", "autoscout24.de", "autoscout24.com"], exaApiKey),
      exaPretraga(queryRs, ["polovniautomobili.com"], exaApiKey),
    ]);

    console.log("Exa DE rezultata:", deRezultati.length);
    console.log("Exa RS rezultata:", rsRezultati.length);
    console.log("Prvi DE rezultat:", JSON.stringify(deRezultati[0])?.slice(0, 800));

    const sistemPrompt = `Ti izvlačiš podatke o polovnim automobilima iz teksta stranica sa oglasima.
Vrati SAMO validan JSON niz, bez markdown blokova i bez objašnjenja.
Format: [{"naziv","zemlja","godiste","km","cenaEur","zapreminaCcm","gorivo","url"}]
Pravila:
- Uključi oglas ako možeš da pročitaš BAR naziv modela i cenu. Ostalo pogodi razumno.
- Ako zapremina nije navedena, koristi 1600.
- Ako godiste nije navedeno, koristi 2016.
- Ako kilometraža nije navedena, koristi 150000.
- Ako gorivo nije navedeno, koristi "dizel".
- Cene sa nemačkih sajtova su u evrima. Cene sa polovniautomobili.com su u evrima.
- NE filtriraj po ceni, kilometraži ni godištu. Vrati sve što nađeš.
- Ako stvarno ne možeš da nađeš nijedan oglas sa cenom, vrati [].
Vrati najviše 10 oglasa.`;

    const korisnickiPrompt = `=== NEMAČKA ===
${formatirajRezultate(deRezultati, "DE")}

=== SRBIJA ===
${formatirajRezultate(rsRezultati, "RS")}`;

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
      console.error("xAI sirov odgovor:", xaiTekst);
      return greska(`xAI API greška (${xaiOdgovor.status}).`);
    }

    const xaiJson = JSON.parse(xaiTekst) as {
      choices?: { message?: { content?: string } }[];
    };
    const sirovModel = xaiJson.choices?.[0]?.message?.content ?? "";
    console.log("Sirov odgovor modela:", sirovModel);

    let parsiran: unknown;
    try {
      parsiran = JSON.parse(ocistiJsonOdgovor(sirovModel));
    } catch (parseError) {
      console.error("JSON.parse nije uspeo:", parseError);
      return greska("Model nije vratio validan JSON.");
    }

    if (!Array.isArray(parsiran)) {
      return greska("Model nije vratio JSON niz.");
    }

    const oglasi: OglasSaUkupno[] = parsiran
      .map(normalizujOglas)
      .filter((oglas): oglas is Oglas => oglas !== null)
      .slice(0, 8)
      .map((oglas) => {
        if (oglas.zemlja === "DE") {
          const uvoz = izracunajUvoz(
            oglas.cenaEur,
            oglas.zapreminaCcm,
            oglas.godiste,
            oglas.gorivo,
          );
          return { ...oglas, ukupno: uvoz.ukupno };
        }

        return { ...oglas, ukupno: oglas.cenaEur };
      })
      .sort((a, b) => a.ukupno - b.ukupno);

    console.log("Posle normalizacije:", oglasi.length);

    return Response.json(oglasi);
  } catch (error) {
    console.error("Greška u /api/pretraga:", error);
    const poruka = error instanceof Error ? error.message : "Nepoznata greška";
    return greska(poruka);
  }
}
