export type Destinacija = "RS" | "BA" | "ME";
export type Izvor = "DE" | "AT" | "IT";

export const TRANSPORT: Record<Izvor, number> = {
  DE: 700,
  AT: 550,
  IT: 800,
};

export const PDV: Record<Destinacija, number> = {
  RS: 0.2,
  BA: 0.17,
  ME: 0.21,
};

export const REGISTRACIJA: Record<Destinacija, number> = {
  RS: 250,
  BA: 200,
  ME: 220,
};

export const CARINA = 0.1;

/**
 * Računa orijentacionu procenu troškova uvoza polovnog automobila iz EU
 * na destinaciju (RS, BA ili ME).
 *
 * Ovo nije zvanični carinski niti poreski obračun. Iznosi su procene
 * zasnovane na javno dostupnim stopama i mogu da odstupaju od stvarnih
 * obaveza pred carinom, poreskom upravom i nadležnim organima.
 */
export function izracunajUvoz(
  cenaEur: number,
  zapreminaCcm: number,
  godiste: number,
  gorivo: "dizel" | "benzin",
  izvor: Izvor,
  destinacija: Destinacija,
): {
  cenaOglas: number;
  transport: number;
  carinskaOsnovica: number;
  carina: number;
  akciza: number;
  pdvOsnovica: number;
  pdv: number;
  registracija: number;
  ukupno: number;
} {
  void gorivo;

  const cenaOglas = Math.round(cenaEur);
  const transport = TRANSPORT[izvor];
  const carinskaOsnovica = Math.round(cenaOglas + transport);
  const carina = Math.round(carinskaOsnovica * CARINA);

  const starost = new Date().getFullYear() - godiste;
  const akciza =
    starost > 8 || zapreminaCcm < 1500
      ? 0
      : Math.round((carinskaOsnovica + carina) * 0.05);

  const pdvOsnovica = Math.round(carinskaOsnovica + carina + akciza);
  const pdv = Math.round(PDV[destinacija] * pdvOsnovica);
  const registracija = REGISTRACIJA[destinacija];
  const ukupno = Math.round(
    cenaOglas + transport + carina + akciza + pdv + registracija,
  );

  return {
    cenaOglas,
    transport,
    carinskaOsnovica,
    carina,
    akciza,
    pdvOsnovica,
    pdv,
    registracija,
    ukupno,
  };
}
