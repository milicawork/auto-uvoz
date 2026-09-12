"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [model, setModel] = useState("");
  const [maxCena, setMaxCena] = useState("");
  const [maxKilometraza, setMaxKilometraza] = useState("");
  const [godisteOd, setGodisteOd] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log({
      model,
      maxCena,
      maxKilometraza,
      godisteOd,
    });
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-950 px-4 py-16">
      <main className="w-full max-w-[700px]">
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
          className="mt-10 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl sm:p-8"
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

        <section
          aria-label="Rezultati pretrage"
          className="mt-8 min-h-48 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-6"
        />
      </main>
    </div>
  );
}
