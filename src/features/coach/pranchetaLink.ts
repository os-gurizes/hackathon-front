// Link que abre uma estratégia nova na prancheta já no mapa, no lado e com o título dados.
// A prancheta lê `mapa` (slug), `lado` e `titulo` e tira os parâmetros da URL depois de abrir.
export function pranchetaLink({ map, side, title }: { map: { name: string }; side?: "attack" | "defense" | null; title: string }) {
  const params = new URLSearchParams({ mapa: map.name.toLowerCase(), titulo: title });
  if (side) params.set("lado", side);
  return `/coach/prancheta?${params.toString()}`;
}
