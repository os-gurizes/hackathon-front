import { useEffect, useReducer } from "react";

const cache = new Map<string, HTMLImageElement>();

function getImage(src: string) {
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    cache.set(src, img);
  }
  return img;
}

const isReady = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;

/** Carrega uma imagem para o Konva, com cache entre componentes. */
export function useImage(src: string | undefined): HTMLImageElement | undefined {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const img = src ? getImage(src) : undefined;

  useEffect(() => {
    if (!img || isReady(img)) return;
    img.addEventListener("load", rerender);
    return () => img.removeEventListener("load", rerender);
  }, [img]);

  return img && isReady(img) ? img : undefined;
}
