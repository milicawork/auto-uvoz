"use client";

import { FormEvent, useState } from "react";
import { izracunajUvoz } from "@/lib/uvoz";

type Gorivo = "dizel" | "benzin";
type Zemlja = "Nemačka" | "Srbija";

type MockOglas = {
  zemlja: Zemlja;
  model: string;
  godiste: number;
  zapreminaCcm: number;
  gorivo: Gorivo;
  cenaEur: number;
  kilometraza: number;
};

type RedTabele = {
  zemlja: Zemlja;
  model: string;
  naziv: string;
  godiste: number;
  kilometraza: number;
  cenaOglasa: number;
  transport: number | null;
  carinaPdv: number | null;
  ukupno: number;
};

const MOCK_OGLASI: MockOglas[] = [
  {
    zemlja: "Nemačka",
    model: "VW Golf 7",
    godiste: 2016,
    zapreminaCcm: 1600,
    gorivo: "dizel",
    cenaEur: 8400,
    kilometraza: 145000,
  },
  {
    zemlja: "Nemačka",
    model: "VW Golf 7",
    godiste: 2017,
    zapreminaCcm: 1600,
    gorivo: "dizel",
    cenaEur: 9900,
    kilometraza: 110000,
  },
  {
    zemlja: "Srbija",
    model: "VW Golf 7",
    godiste: 2016,
    zapreminaCcm: 1600,
    gorivo: "dizel",
    cenaEur: 11900,
    kilometraza: 160000,
  },
];

function formatBroj(value: number) {
  return value.toLocaleString("sr-RS");
}

function mapirajOglas(oglas: MockOglas): RedTabele {
  const naziv = `${oglas.model} ${oglas.godiste} (${oglas.zemlja})`;

  if (oglas.zemlja === "Srbija") {
    return {
      zemlja: oglas.zemlja,
      model: oglas.model,
      naziv,
      godiste: oglas.godiste,
      kilometraza: oglas.kilometraza,
      cenaOglasa: oglas.cenaEur,
      transport: null,
      carinaPdv: null,
      ukupno: oglas.cenaEur,
    };
  }

  const uvoz = izracunajUvoz(
    oglas.cenaEur,
    oglas.zapreminaCcm,
    oglas.godiste,
    oglas.gorivo,
  );

  return {
    zemlja: oglas.zemlja,
    model: oglas.model,
    naziv,
    godiste: oglas.godiste,
    kilometraza: oglas.kilometraza,
    cenaOglasa: uvoz.cenaOglas,
    transport: uvoz.transport,
    carinaPdv: uvoz.carina + uvoz.akciza + uvoz.pdv,
    ukupno: uvoz.ukupno,
  };
}

export default function Home() {
  const [model, setModel] = useState("");
  const [maxCena, setMaxCena] = useState("");
  const [maxKilometraza, setMaxKilometraza] = useState("");
  const [godisteOd, setGodisteOd] = useState("");
  const [rezultati, setRezultati] = useState<RedTabele[] | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const redovi = MOCK_OGLASI.map(mapirajOglas).sort(
      (a, b) => a.ukupno - b.ukupno,
    );
    setRezultati(redovi);
  }

  const najjeftiniji = rezultati?.[0];
  const najjeftinijiUvoz = rezultati
    ?.filter((red) => red.zemlja === "Nemačka")
    .sort((a, b) => a.ukupno - b.ukupno)[0];
  const najjeftinijiDomaci = rezultati
    ?.filter((red) => red.zemlja === "Srbija")
    .sort((a, b) => a.ukupno - b.ukupno)[0];
  const uvozSeIsplati =
    najjeftinijiUvoz != null &&
    najjeftinijiDomaci != null &&
    najjeftinijiUvoz.ukupno < najjeftinijiDomaci.ukupno;

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
              value={godisteOd}
              onChange={(e) => setGodisteOd(e.target.value)}
              placeholder="2018"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Pronađi
          </button>
        </form>

        <section aria-label="Rezultati pretrage" className="mt-8">
          {rezultati && najjeftiniji ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
              <p className="border-b border-zinc-800 px-6 py-5 text-base leading-7 text-zinc-200">
                Najjeftinija opcija:{" "}
                <span className="font-semibold text-zinc-50">
                  {najjeftiniji.naziv}
                </span>{" "}
                za{" "}
                <span className="font-semibold text-emerald-400">
                  {formatBroj(najjeftiniji.ukupno)} EUR
                </span>
                .{" "}
                {uvozSeIsplati
                  ? "Uvoz se isplati u odnosu na domaću ponudu."
                  : "Uvoz se ne isplati u odnosu na domaću ponudu."}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-zinc-950/80 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase sm:text-xs">
                      <th className="whitespace-nowrap px-3 py-3">Zemlja</th>
                      <th className="whitespace-nowrap px-3 py-3">Model</th>
                      <th className="whitespace-nowrap px-3 py-3">Godište</th>
                      <th className="whitespace-nowrap px-3 py-3">Kilometraža</th>
                      <th className="whitespace-nowrap px-3 py-3">Cena oglasa</th>
                      <th className="whitespace-nowrap px-3 py-3">Transport</th>
                      <th className="whitespace-nowrap px-3 py-3">Carina+PDV</th>
                      <th className="sticky right-0 whitespace-nowrap bg-zinc-950 px-3 py-3 shadow-[-8px_0_12px_rgba(0,0,0,0.35)]">
                        Ukupno u Beogradu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rezultati.map((red, index) => {
                      const jeNajjeftiniji = index === 0;
                      return (
                        <tr
                          key={`${red.zemlja}-${red.model}-${red.godiste}-${red.kilometraza}`}
                          className={`border-t border-zinc-800 ${
                            jeNajjeftiniji
                              ? "bg-emerald-500/10"
                              : "odd:bg-zinc-900/40 even:bg-zinc-950/30"
                          }`}
                        >
                          <td className="whitespace-nowrap px-3 py-3.5 text-zinc-200">
                            {red.zemlja}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 font-medium text-zinc-50">
                            {red.model}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
                            {red.godiste}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
                            {formatBroj(red.kilometraza)} km
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
                            {formatBroj(red.cenaOglasa)} EUR
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
                            {red.transport == null
                              ? "—"
                              : `${formatBroj(red.transport)} EUR`}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
                            {red.carinaPdv == null
                              ? "—"
                              : `${formatBroj(red.carinaPdv)} EUR`}
                          </td>
                          <td
                            className={`sticky right-0 whitespace-nowrap px-3 py-3.5 tabular-nums font-semibold shadow-[-8px_0_12px_rgba(0,0,0,0.35)] ${
                              jeNajjeftiniji
                                ? "bg-emerald-950 text-emerald-400"
                                : "bg-zinc-900 text-zinc-50"
                            }`}
                          >
                            {formatBroj(red.ukupno)} EUR
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mx-auto min-h-48 max-w-[700px] rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-6" />
          )}
        </section>
      </main>
    </div>
  );
}
