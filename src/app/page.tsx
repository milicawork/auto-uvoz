"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MARKE, type Marka } from "@/lib/marke";

type Izvor = "DE" | "AT" | "IT";
type Destinacija = "RS" | "BA" | "ME";
type Zemlja = Izvor | Destinacija;

type Razlaganje = {
  cenaOglas: number;
  transport: number;
  carinskaOsnovica: number;
  carina: number;
  akciza: number;
  pdv: number;
  registracija: number;
  ukupno: number;
};

type Oglas = {
  naziv: string;
  zemlja: Zemlja;
  godiste: number;
  km: number;
  cenaEur: number;
  url: string;
  ukupno: number;
  razlaganje: Razlaganje;
  pouzdanost?: "visoka" | "niska";
};

const IZVORI: { value: Izvor; label: string }[] = [
  { value: "DE", label: "Germany (DE)" },
  { value: "AT", label: "Austria (AT)" },
  { value: "IT", label: "Italy (IT)" },
];

const DESTINACIJE: { value: Destinacija; label: string }[] = [
  { value: "RS", label: "Serbia (RS)" },
  { value: "BA", label: "Bosnia & Herzegovina (BA)" },
  { value: "ME", label: "Montenegro (ME)" },
];

const ZASTAVICE: Record<Zemlja, string> = {
  DE: "🇩🇪",
  AT: "🇦🇹",
  IT: "🇮🇹",
  RS: "🇷🇸",
  BA: "🇧🇦",
  ME: "🇲🇪",
};

const NAZIVI_ZEMALJA: Record<Zemlja, string> = {
  DE: "Germany",
  AT: "Austria",
  IT: "Italy",
  RS: "Serbia",
  BA: "Bosnia & Herzegovina",
  ME: "Montenegro",
};

function formatBroj(value: number) {
  return value.toLocaleString("en-US");
}

function nazivSaMarkom(naziv: string, marka: Marka | null) {
  if (!marka) {
    return naziv;
  }

  const markaNaziv = marka.naziv.trim();
  if (
    naziv.trim().toLowerCase().startsWith(markaNaziv.toLowerCase())
  ) {
    return naziv;
  }

  return `${markaNaziv} ${naziv}`;
}

function jeIzvor(zemlja: Zemlja): zemlja is Izvor {
  return zemlja === "DE" || zemlja === "AT" || zemlja === "IT";
}

function jeRazlaganje(value: unknown): value is Razlaganje {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const stavka = value as Record<string, unknown>;
  return (
    typeof stavka.cenaOglas === "number" &&
    typeof stavka.transport === "number" &&
    typeof stavka.carinskaOsnovica === "number" &&
    typeof stavka.carina === "number" &&
    typeof stavka.akciza === "number" &&
    typeof stavka.pdv === "number" &&
    typeof stavka.registracija === "number" &&
    typeof stavka.ukupno === "number"
  );
}

function jeOglas(value: unknown): value is Oglas {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const oglas = value as Record<string, unknown>;
  return (
    typeof oglas.naziv === "string" &&
    (oglas.zemlja === "DE" ||
      oglas.zemlja === "AT" ||
      oglas.zemlja === "IT" ||
      oglas.zemlja === "RS" ||
      oglas.zemlja === "BA" ||
      oglas.zemlja === "ME") &&
    typeof oglas.godiste === "number" &&
    typeof oglas.km === "number" &&
    typeof oglas.cenaEur === "number" &&
    typeof oglas.url === "string" &&
    typeof oglas.ukupno === "number" &&
    jeRazlaganje(oglas.razlaganje) &&
    (oglas.pouzdanost === undefined ||
      oglas.pouzdanost === "visoka" ||
      oglas.pouzdanost === "niska")
  );
}

const PORUKA_PRAZNO = "No listings found, try another model";
const PORUKA_UCITAVANJE =
  "Searching listings across Europe... This can take up to 30 seconds";
const PORUKA_NEMA_LOKALNIH =
  "No local listings matched your filters. Try increasing max mileage or price to compare against the local market.";

const selectClassName =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";
const inputClassName =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

export default function Home() {
  const [izvor, setIzvor] = useState<Izvor>("DE");
  const [destinacija, setDestinacija] = useState<Destinacija>("RS");
  const [upitMarke, setUpitMarke] = useState("");
  const [izabranaMarka, setIzabranaMarka] = useState<Marka | null>(null);
  const [listaMarkeOtvorena, setListaMarkeOtvorena] = useState(false);
  const [model, setModel] = useState("");
  const [maxCena, setMaxCena] = useState("");
  const [maxKilometraza, setMaxKilometraza] = useState("");
  const [godisteOd, setGodisteOd] = useState("");
  const [rezultati, setRezultati] = useState<Oglas[] | null>(null);
  const [zakljucak, setZakljucak] = useState("");
  const [poruka, setPoruka] = useState<string | null>(null);
  const [ucitava, setUcitava] = useState(false);
  const [otvoreniRed, setOtvoreniRed] = useState<string | null>(null);
  const markaRef = useRef<HTMLDivElement>(null);

  const filtriraneMarke = useMemo(() => {
    const upit = upitMarke.trim().toLowerCase();
    const lista = upit
      ? MARKE.filter((marka) => marka.naziv.toLowerCase().includes(upit))
      : MARKE;
    return lista.slice(0, 8);
  }, [upitMarke]);

  useEffect(() => {
    function zatvoriKlikomVan(event: MouseEvent) {
      if (
        markaRef.current &&
        !markaRef.current.contains(event.target as Node)
      ) {
        setListaMarkeOtvorena(false);
      }
    }

    function zatvoriEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setListaMarkeOtvorena(false);
      }
    }

    document.addEventListener("mousedown", zatvoriKlikomVan);
    document.addEventListener("keydown", zatvoriEscape);
    return () => {
      document.removeEventListener("mousedown", zatvoriKlikomVan);
      document.removeEventListener("keydown", zatvoriEscape);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!izabranaMarka) {
      setListaMarkeOtvorena(true);
      return;
    }

    setUcitava(true);
    setRezultati(null);
    setZakljucak("");
    setOtvoreniRed(null);
    setPoruka(PORUKA_UCITAVANJE);

    try {
      const odgovor = await fetch("/api/pretraga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `${izabranaMarka.naziv} ${model.trim()}`.trim(),
          maxCena: Number(maxCena),
          maxKm: Number(maxKilometraza),
          godisteOd: Number(godisteOd),
          izvor,
          destinacija,
        }),
      });

      const podaci: unknown = await odgovor.json();
      const telo =
        podaci != null && typeof podaci === "object"
          ? (podaci as { oglasi?: unknown; zakljucak?: unknown })
          : null;

      if (!odgovor.ok || !Array.isArray(telo?.oglasi)) {
        setRezultati(null);
        setZakljucak("");
        setPoruka(PORUKA_PRAZNO);
        return;
      }

      const oglasi = telo.oglasi.filter(jeOglas).sort((a, b) => a.ukupno - b.ukupno);
      const aiZakljucak =
        typeof telo.zakljucak === "string" ? telo.zakljucak.trim() : "";

      if (oglasi.length === 0) {
        setRezultati(null);
        setZakljucak("");
        setPoruka(PORUKA_PRAZNO);
        return;
      }

      setPoruka(null);
      setZakljucak(aiZakljucak);
      setRezultati(oglasi);
    } catch {
      setRezultati(null);
      setZakljucak("");
      setPoruka(PORUKA_PRAZNO);
    } finally {
      setUcitava(false);
    }
  }

  const najjeftinijiUvoz = rezultati
    ?.filter((red) => jeIzvor(red.zemlja))
    .sort((a, b) => a.ukupno - b.ukupno)[0];
  const najjeftinijiDomaci = rezultati
    ?.filter((red) => !jeIzvor(red.zemlja))
    .sort((a, b) => a.ukupno - b.ukupno)[0];
  const nemaOglasaIzDestinacije =
    !!rezultati &&
    rezultati.length > 0 &&
    rezultati.every((red) => red.zemlja !== destinacija);

  function zakljucakTekst() {
    const delovi: string[] = [];

    if (najjeftinijiDomaci) {
      delovi.push(
        `Cheapest local option: ${najjeftinijiDomaci.naziv} for ${formatBroj(najjeftinijiDomaci.ukupno)} EUR.`,
      );
    } else {
      delovi.push("No local option found.");
    }

    if (najjeftinijiUvoz) {
      delovi.push(
        `Cheapest import option: ${najjeftinijiUvoz.naziv} for ${formatBroj(najjeftinijiUvoz.ukupno)} EUR.`,
      );
    } else {
      delovi.push("No import option found.");
    }

    if (najjeftinijiDomaci && najjeftinijiUvoz) {
      const razlika = Math.abs(
        najjeftinijiDomaci.ukupno - najjeftinijiUvoz.ukupno,
      );
      if (najjeftinijiUvoz.ukupno < najjeftinijiDomaci.ukupno) {
        delovi.push(
          `Import wins — the import option is cheaper by ${formatBroj(razlika)} EUR.`,
        );
      } else if (najjeftinijiUvoz.ukupno > najjeftinijiDomaci.ukupno) {
        delovi.push(
          `Import does not pay off — the local option is cheaper by ${formatBroj(razlika)} EUR.`,
        );
      } else {
        delovi.push("Import and local options cost the same.");
      }
    }

    return delovi.join(" ");
  }

  function toggleRed(kljuc: string) {
    setOtvoreniRed((trenutni) => (trenutni === kljuc ? null : kljuc));
  }

  return (
    <div className="flex min-h-full flex-1 items-start justify-center overflow-y-auto bg-zinc-950 px-4 py-16">
      <main className="w-full max-w-6xl">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Crossings
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-base leading-7 text-zinc-400">
          What a car from Europe actually costs once it lands in your driveway
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-[700px] space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="izvor" className="block text-sm font-medium text-zinc-200">
                Import from
              </label>
              <select
                id="izvor"
                value={izvor}
                onChange={(e) => setIzvor(e.target.value as Izvor)}
                className={selectClassName}
              >
                {IZVORI.map((opcija) => (
                  <option key={opcija.value} value={opcija.value}>
                    {opcija.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="destinacija"
                className="block text-sm font-medium text-zinc-200"
              >
                Import to
              </label>
              <select
                id="destinacija"
                value={destinacija}
                onChange={(e) => setDestinacija(e.target.value as Destinacija)}
                className={selectClassName}
              >
                {DESTINACIJE.map((opcija) => (
                  <option key={opcija.value} value={opcija.value}>
                    {opcija.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="relative z-30 space-y-2" ref={markaRef}>
              <label htmlFor="marka" className="block text-sm font-medium text-zinc-200">
                Brand
              </label>
              <div className="relative">
                <div className="relative">
                  {izabranaMarka ? (
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <LogoMarke marka={izabranaMarka} />
                    </span>
                  ) : null}
                  <input
                    id="marka"
                    type="text"
                    autoComplete="off"
                    required
                    value={upitMarke}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUpitMarke(value);
                      setListaMarkeOtvorena(true);
                      if (izabranaMarka && value !== izabranaMarka.naziv) {
                        setIzabranaMarka(null);
                      }
                    }}
                    onFocus={() => setListaMarkeOtvorena(true)}
                    onMouseDown={() => setListaMarkeOtvorena(true)}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setListaMarkeOtvorena(false);
                      }
                    }}
                    placeholder="e.g. Volkswagen"
                    className={`${inputClassName} ${izabranaMarka ? "pl-12" : ""}`}
                  />
                </div>
                {listaMarkeOtvorena ? (
                  <ul className="absolute z-20 mt-2 max-h-[22.5rem] w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 py-1 shadow-xl">
                    {filtriraneMarke.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-zinc-500">
                        No matching brands
                      </li>
                    ) : (
                      filtriraneMarke.map((marka) => (
                        <li key={marka.naziv}>
                          <button
                            type="button"
                            onClick={() => {
                              setIzabranaMarka(marka);
                              setUpitMarke(marka.naziv);
                              setListaMarkeOtvorena(false);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-50 transition hover:bg-zinc-800"
                          >
                            <LogoMarke marka={marka} />
                            <span>{marka.naziv}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="model" className="block text-sm font-medium text-zinc-200">
                Model
              </label>
              <input
                id="model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Golf 7"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="maxCena" className="block text-sm font-medium text-zinc-200">
                Max price (EUR)
              </label>
              <input
                id="maxCena"
                type="number"
                min={0}
                required
                value={maxCena}
                onChange={(e) => setMaxCena(e.target.value)}
                placeholder="15000"
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="maxKilometraza"
                className="block text-sm font-medium text-zinc-200"
              >
                Max mileage (km)
              </label>
              <input
                id="maxKilometraza"
                type="number"
                min={0}
                required
                value={maxKilometraza}
                onChange={(e) => setMaxKilometraza(e.target.value)}
                placeholder="150000"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="godisteOd" className="block text-sm font-medium text-zinc-200">
              Year from
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
              className={inputClassName}
            />
          </div>

          <button
            type="submit"
            disabled={ucitava}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-emerald-500/50 disabled:hover:bg-emerald-500/50"
          >
            Search
          </button>
        </form>

        <section aria-label="Search results" className="mt-8">
          {rezultati && rezultati.length > 0 ? (
            <div className="space-y-3">
              {zakljucak ? (
                <div className="rounded-2xl border border-zinc-700 bg-zinc-800 px-6 py-5 shadow-xl">
                  <p className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                    AI analysis
                  </p>
                  <p className="mt-2 text-lg leading-8 text-zinc-50">
                    {zakljucak}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-zinc-400">
                    {zakljucakTekst()}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-5 shadow-xl">
                  <p className="text-base leading-7 text-zinc-200">
                    {zakljucakTekst()}
                  </p>
                </div>
              )}

              {nemaOglasaIzDestinacije ? (
                <div
                  role="status"
                  className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-4"
                >
                  <p className="text-sm leading-6 text-yellow-200">
                    {PORUKA_NEMA_LOKALNIH}
                  </p>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-zinc-950/80 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase sm:text-xs">
                      <th className="whitespace-nowrap px-3 py-3">Country</th>
                      <th className="whitespace-nowrap px-3 py-3">Car</th>
                      <th className="whitespace-nowrap px-3 py-3">Year</th>
                      <th className="whitespace-nowrap px-3 py-3">Mileage</th>
                      <th className="whitespace-nowrap px-3 py-3">Listing price</th>
                      <th className="whitespace-nowrap px-3 py-3">Landed cost</th>
                      <th className="whitespace-nowrap px-3 py-3">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rezultati.map((red, index) => {
                      const jeNajjeftiniji = index === 0;
                      const kljuc = `${red.zemlja}-${red.url}-${index}`;
                      const otvoren = otvoreniRed === kljuc;
                      const stavke = [
                        { label: "Listing price", value: red.razlaganje.cenaOglas },
                        { label: "Transport", value: red.razlaganje.transport },
                        {
                          label: "Customs value",
                          value: red.razlaganje.carinskaOsnovica,
                        },
                        { label: "Duty (10%)", value: red.razlaganje.carina },
                        { label: "Excise", value: red.razlaganje.akciza },
                        { label: "VAT", value: red.razlaganje.pdv },
                        {
                          label: "Registration",
                          value: red.razlaganje.registracija,
                        },
                      ];

                      return (
                        <FragmentRow
                          key={kljuc}
                          jeNajjeftiniji={jeNajjeftiniji}
                          kljuc={kljuc}
                          otvoren={otvoren}
                          onToggle={() => toggleRed(kljuc)}
                          red={red}
                          marka={izabranaMarka}
                          stavke={stavke}
                        />
                      );
                    })}
                  </tbody>
                </table>
                </div>

                <p className="border-t border-zinc-800 px-6 py-3 text-xs text-zinc-500">
                  Estimates based on publicly available rates. Not an official
                  customs calculation.
                </p>
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

        <p className="mt-8 text-center text-xs text-zinc-500">
          Search: Exa · Analysis: Grok (x.ai)
        </p>
      </main>
    </div>
  );
}

function LogoMarke({ marka }: { marka: Marka }) {
  const [ucitano, setUcitano] = useState(false);
  const slovo = marka.naziv.charAt(0).toUpperCase();

  return (
    <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
      {!ucitano ? (
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200"
        >
          {slovo}
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://logo.clearbit.com/${marka.domen}`}
        alt=""
        onLoad={() => setUcitano(true)}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
        className={`h-6 w-6 rounded-full bg-zinc-100 object-contain ${
          ucitano ? "block" : "hidden"
        }`}
      />
    </span>
  );
}

function FragmentRow({
  jeNajjeftiniji,
  kljuc,
  otvoren,
  onToggle,
  red,
  marka,
  stavke,
}: {
  jeNajjeftiniji: boolean;
  kljuc: string;
  otvoren: boolean;
  onToggle: () => void;
  red: Oglas;
  marka: Marka | null;
  stavke: { label: string; value: number }[];
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-t border-zinc-800 ${
          jeNajjeftiniji
            ? "bg-emerald-500/10"
            : "odd:bg-zinc-900/40 even:bg-zinc-950/30"
        }`}
      >
        <td className="whitespace-nowrap px-3 py-3.5 text-zinc-200">
          <span aria-label={NAZIVI_ZEMALJA[red.zemlja]}>
            {ZASTAVICE[red.zemlja]}
          </span>
        </td>
        <td className="px-3 py-3.5 font-medium text-zinc-50">
          {nazivSaMarkom(red.naziv, marka)}
        </td>
        <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
          {red.godiste}
        </td>
        <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
          {formatBroj(red.km)} km
          {red.pouzdanost === "niska" ? (
            <span className="ml-1 text-xs text-zinc-500" title="Estimated value">
              ~
            </span>
          ) : null}
        </td>
        <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-zinc-300">
          {formatBroj(red.cenaEur)} EUR
        </td>
        <td
          className={`whitespace-nowrap px-3 py-3.5 tabular-nums font-semibold ${
            jeNajjeftiniji ? "text-emerald-400" : "text-zinc-50"
          }`}
        >
          {formatBroj(red.ukupno)} EUR
        </td>
        <td className="whitespace-nowrap px-3 py-3.5">
          <a
            href={red.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="font-medium text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
          >
            Listing
          </a>
        </td>
      </tr>
      {otvoren ? (
        <tr className="border-t border-zinc-800 bg-zinc-950/60">
          <td colSpan={7} className="px-6 py-4">
            <dl className="mx-auto max-w-md space-y-1.5 text-sm">
              {stavke.map((stavka) => (
                <div key={`${kljuc}-${stavka.label}`} className="flex justify-between gap-4 text-zinc-300">
                  <dt>{stavka.label}</dt>
                  <dd className="tabular-nums">{formatBroj(stavka.value)} EUR</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-zinc-800 pt-2 font-bold text-zinc-50">
                <dt>Total landed cost</dt>
                <dd className="tabular-nums">
                  {formatBroj(red.razlaganje.ukupno)} EUR
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      ) : null}
    </>
  );
}
