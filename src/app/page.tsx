"use client";

import { FormEvent, useState } from "react";

type Zemlja = "DE" | "RS";

type Oglas = {
  naziv: string;
  zemlja: Zemlja;
  godiste: number;
  km: number;
  cenaEur: number;
  url: string;
  ukupno: number;
};

function formatBroj(value: number) {
  return value.toLocaleString("sr-RS");
}

function zastavica(zemlja: Zemlja) {
  return zemlja === "DE" ? "🇩🇪" : "🇷🇸";
}

function jeOglas(value: unknown): value is Oglas {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const oglas = value as Record<string, unknown>;
  return (
    typeof oglas.naziv === "string" &&
    (oglas.zemlja === "DE" || oglas.zemlja === "RS") &&
    typeof oglas.godiste === "number" &&
    typeof oglas.km === "number" &&
    typeof oglas.cenaEur === "number" &&
    typeof oglas.url === "string" &&
    typeof oglas.ukupno === "number"
  );
}

const PORUKA_PRAZNO =
  "Nije pronađen nijedan oglas, probaj drugi model";
const PORUKA_UCITAVANJE =
  "Pretražujem oglase u Nemačkoj i Srbiji... Pretraga može da traje do 30 sekundi.";

export default function Home() {
  const [model, setModel] = useState("");
  const [maxCena, setMaxCena] = useState("");
  const [maxKilometraza, setMaxKilometraza] = useState("");
  const [godisteOd, setGodisteOd] = useState("");
  const [rezultati, setRezultati] = useState<Oglas[] | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [ucitava, setUcitava] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setUcitava(true);
    setRezultati(null);
    setPoruka(PORUKA_UCITAVANJE);

    try {
      const odgovor = await fetch("/api/pretraga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model.trim(),
          maxCena: Number(maxCena),
          maxKm: Number(maxKilometraza),
          godisteOd: Number(godisteOd),
        }),
      });

      const podaci: unknown = await odgovor.json();

      if (!odgovor.ok || !Array.isArray(podaci)) {
        setRezultati(null);
        setPoruka(PORUKA_PRAZNO);
        return;
      }

      const oglasi = podaci.filter(jeOglas).sort((a, b) => a.ukupno - b.ukupno);

      if (oglasi.length === 0) {
        setRezultati(null);
        setPoruka(PORUKA_PRAZNO);
        return;
      }

      setPoruka(null);
      setRezultati(oglasi);
    } catch {
      setRezultati(null);
      setPoruka(PORUKA_PRAZNO);
    } finally {
      setUcitava(false);
    }
  }

  const najjeftinijiUvoz = rezultati
    ?.filter((red) => red.zemlja === "DE")
    .sort((a, b) => a.ukupno - b.ukupno)[0];
  const najjeftinijiDomaci = rezultati
    ?.filter((red) => red.zemlja === "RS")
    .sort((a, b) => a.ukupno - b.ukupno)[0];

  function zakljucakTekst() {
    const delovi: string[] = [];

    if (najjeftinijiDomaci) {
      delovi.push(
        `Najjeftinija domaća opcija: ${najjeftinijiDomaci.naziv} za ${formatBroj(najjeftinijiDomaci.ukupno)} EUR.`,
      );
    } else {
      delovi.push("Nije pronađena nijedna domaća opcija.");
    }

    if (najjeftinijiUvoz) {
      delovi.push(
        `Najjeftinija uvozna opcija: ${najjeftinijiUvoz.naziv} za ${formatBroj(najjeftinijiUvoz.ukupno)} EUR.`,
      );
    } else {
      delovi.push("Nije pronađena nijedna uvozna opcija.");
    }

    if (najjeftinijiDomaci && najjeftinijiUvoz) {
      const razlika = Math.abs(
        najjeftinijiDomaci.ukupno - najjeftinijiUvoz.ukupno,
      );
      if (najjeftinijiUvoz.ukupno < najjeftinijiDomaci.ukupno) {
        delovi.push(
          `Uvoz se isplati — uvozna opcija je jeftinija za ${formatBroj(razlika)} EUR.`,
        );
      } else if (najjeftinijiUvoz.ukupno > najjeftinijiDomaci.ukupno) {
        delovi.push(
          `Uvoz se ne isplati — domaća opcija je jeftinija za ${formatBroj(razlika)} EUR.`,
        );
      } else {
        delovi.push("Uvoz i domaća opcija koštaju isto.");
      }
    }

    return delovi.join(" ");
  }

  return (
    <div className="flex min-h-full flex-1 items-start justify-center overflow-y-auto bg-zinc-950 px-4 py-16">
      <main className="w-full max-w-6xl">
        <p className="mb-3 text-center text-sm font-medium tracking-wide text-emerald-400 uppercase">
          Auto uvoz kalkulator
        </p>
        <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Da li ti se isplati uvoz auta?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-base leading-7 text-zinc-400">
          Uporedi cene oglasa iz Nemačke i Srbije, sa uračunatom carinom i
          PDV-om
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-[700px] space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl sm:p-8"
        >
          <div className="space-y-2">
            <label htmlFor="model" className="block text-sm font-medium text-zinc-200">
              Model auta
            </label>
            <input
              id="model"
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="npr. Volkswagen Golf"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="maxCena" className="block text-sm font-medium text-zinc-200">
                Maksimalna cena (EUR)
              </label>
              <input
                id="maxCena"
                type="number"
                min={0}
                required
                value={maxCena}
                onChange={(e) => setMaxCena(e.target.value)}
                placeholder="15000"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="maxKilometraza"
                className="block text-sm font-medium text-zinc-200"
              >
                Maksimalna kilometraža
              </label>
              <input
                id="maxKilometraza"
                type="number"
                min={0}
                required
                value={maxKilometraza}
                onChange={(e) => setMaxKilometraza(e.target.value)}
                placeholder="150000"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="godisteOd" className="block text-sm font-medium text-zinc-200">
              Godište od
            </label>
            <input
              id="godisteOd"
              type="number"
              min={1990}
              max={new Date().getFullYear()}
              required
              value={godisteOd}
              onChange={(e) => setGodisteOd(e.target.value)}
              placeholder="2018"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={ucitava}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-emerald-500/50 disabled:hover:bg-emerald-500/50"
          >
            Pronađi
          </button>
        </form>

        <section aria-label="Rezultati pretrage" className="mt-8">
          {rezultati && rezultati.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
              <p className="border-b border-zinc-800 px-6 py-5 text-base leading-7 text-zinc-200">
                {zakljucakTekst()}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-zinc-950/80 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase sm:text-xs">
                      <th className="whitespace-nowrap px-3 py-3">Zemlja</th>
                      <th className="whitespace-nowrap px-3 py-3">Naziv</th>
                      <th className="whitespace-nowrap px-3 py-3">Godište</th>
                      <th className="whitespace-nowrap px-3 py-3">Kilometraža</th>
                      <th className="whitespace-nowrap px-3 py-3">Cena oglasa</th>
                      <th className="whitespace-nowrap px-3 py-3">
                        Ukupno u Beogradu
                      </th>
                      <th className="whitespace-nowrap px-3 py-3">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rezultati.map((red, index) => {
                      const jeNajjeftiniji = index === 0;
                      const ukupnoBeograd =
                        red.zemlja === "RS" ? red.cenaEur : red.ukupno;
                      return (
                        <tr
                          key={`${red.zemlja}-${red.url}-${index}`}
                          className={`border-t border-zinc-800 ${
                            jeNajjeftiniji
                              ? "bg-emerald-500/10"
                              : "odd:bg-zinc-900/40 even:bg-zinc-950/30"
                          }`}
                        >
                          <td className="whitespace-nowrap px-3 py-3.5 text-zinc-200">
                            <span aria-label={red.zemlja === "DE" ? "Nemačka" : "Srbija"}>
                              {zastavica(red.zemlja)}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 font-medium text-zinc-50">
                            {red.naziv}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
                            {red.godiste}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
                            {formatBroj(red.km)} km
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
                            {formatBroj(red.cenaEur)} EUR
                          </td>
                          <td
                            className={`whitespace-nowrap px-3 py-3.5 tabular-nums font-semibold ${
                              jeNajjeftiniji
                                ? "text-emerald-400"
                                : "text-zinc-50"
                            }`}
                          >
                            {formatBroj(ukupnoBeograd)} EUR
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5">
                            <a
                              href={red.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
                            >
                              Oglas
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mx-auto min-h-48 max-w-[700px] rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-6">
              {poruka ? (
                <p className="text-center text-base leading-7 text-zinc-300">
                  {poruka}
                </p>
              ) : null}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
