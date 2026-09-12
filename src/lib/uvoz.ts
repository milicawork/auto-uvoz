/**
 * Računa orijentacionu procenu troškova uvoza polovnog automobila iz EU u Srbiju.
 *
 * Ovo nije zvanični carinski niti poreski obračun. Iznosi su procene
 * (uključujući konzervativnih 10% carine umesto 0% uz EUR.1) i mogu da
 * odstupaju od stvarnih obaveza pred carinom, poreskom upravom i MUP-om.
 */
export function izracunajUvoz(
  cenaEur: number,
  zapreminaCcm: number,
  godiste: number,
  gorivo: "dizel" | "benzin",
): {
  cenaOglas: number;
  transport: number;
  carina: number;
  akciza: number;
  pdv: number;
  troskoviRegistracije: number;
  ukupno: number;
} {
  void gorivo;

  const cenaOglas = Math.round(cenaEur);
  const transport = 700;
  const osnovica = cenaOglas + transport;
  const carina = Math.round(osnovica * 0.1);

  const starost = new Date().getFullYear() - godiste;
  const akciza =
    starost > 8 || zapreminaCcm < 1500
      ? 0
      : Math.round((osnovica + carina) * 0.05);

  const pdv = Math.round((osnovica + carina + akciza) * 0.2);
  const troskoviRegistracije = 250;
  const ukupno =
    cenaOglas + transport + carina + akciza + pdv + troskoviRegistracije;

  return {
    cenaOglas,
    transport,
    carina,
    akciza,
    pdv,
    troskoviRegistracije,
    ukupno,
  };
}
