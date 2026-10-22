// Set próprio de ícones Sala Tática: grid de 24 px, traço de 1.5 px,
// terminações retas e cantos cortados em 45 graus.
// Cada ícone é uma lista de [tipo, d]: "s" = traço, "f" = preenchido.
export type IconPart = ["s" | "f", string];

export const ICONS = {
  // Conceitos de jogo
  crosshair: [["s", "M12 3v6M12 15v6M3 12h6M15 12h6"], ["f", "M11 11h2v2h-2z"]],
  skull: [["s", "M7 3h10l3 3v7l-3 3v5H7v-5l-3-3V6z"], ["f", "M8 9h3v3H8zM13 9h3v3h-3z"], ["s", "M10.5 17v4M13.5 17v4"]],
  target: [["s", "M8 3h8l5 5v8l-5 5H8l-5-5V8z"], ["s", "M12 8l4 4-4 4-4-4z"]],
  spike: [["s", "M12 2.5l7 5v9l-7 5-7-5v-9z"], ["s", "M12 8v8M9 10v4M15 10v4"]],
  defuse: [["s", "M12 3.5l6 4.5v8l-6 4.5-6-4.5V8z"], ["s", "M3.5 20.5l17-17"]],
  shield: [["s", "M12 3l8 3v6l-3 6-5 3-5-3-3-6V6z"]],
  coin: [["s", "M9 3.5h6l5.5 5.5v6L15 20.5H9L3.5 15V9z"], ["s", "M12 7.5v9M9 10h6M9 14h6"]],
  clock: [["s", "M9 3.5h6l5.5 5.5v6L15 20.5H9L3.5 15V9z"], ["s", "M12 7.5V12h4"]],
  route: [["s", "M5 21v-7l4-4h7V4.5"], ["s", "M13 7.5l3-3 3 3"], ["f", "M3.5 19.5h3v3h-3z"]],
  zone: [["s", "M4 4h12l4 4v12H4z"], ["f", "M8 8h3v3H8zM13 13h3v3h-3z"]],
  heatmap: [["s", "M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM4 16h4v4H4zM10 16h4v4h-4z"], ["f", "M10 10h4v4h-4zM16 10h4v4h-4zM16 16h4v4h-4z"]],
  attack: [["s", "M5 5.5l6.5 6.5L5 18.5M12 5.5l6.5 6.5-6.5 6.5"]],
  defense: [["s", "M5 3.5v17"], ["s", "M17 5.5L10.5 12l6.5 6.5"], ["s", "M21 12H10.5"]],
  clutch: [["f", "M3 9l3-3 3 3-3 3z"], ["s", "M14 4h3.5v3.5H14zM14 10.25h3.5v3.5H14zM14 16.5h3.5V20H14z"], ["s", "M3 18h7"]],
  // Interface
  alert: [["s", "M12 3.5l9 16.5H3z"], ["s", "M12 10v4.5"], ["f", "M11.25 16.5h1.5V18h-1.5z"]],
  "trend-up": [["s", "M3 17.5l6-6 4 4 7.5-7.5"], ["s", "M15 8h5.5v5.5"]],
  "trend-down": [["s", "M3 6.5l6 6 4-4 7.5 7.5"], ["s", "M15 16h5.5v-5.5"]],
  filter: [["s", "M3.5 4.5h17l-6.5 8v6l-4 2v-8z"]],
  map: [["s", "M3.5 6l5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2z"], ["s", "M9 4v14M15 6v14"]],
  player: [["s", "M10 3h4l2 2v4l-2 2h-4L8 9V5z"], ["s", "M4 21v-3.5L7 14.5h10l3 3V21"]],
  team: [["s", "M7.5 5h3l1.5 1.5v3L10.5 11h-3L6 9.5v-3z"], ["s", "M2.5 20.5v-2.5l2.5-2.5h8l2.5 2.5v2.5"], ["s", "M15 4.5h2.5L19 6v3l-1.5 1.5H16"], ["s", "M18 14.5h1.5l2 2v4"]],
  trophy: [["s", "M7 3.5h10v6l-3 4h-4l-3-4z"], ["s", "M7 5.5H3.5V8L7 10.5M17 5.5h3.5V8L17 10.5"], ["s", "M12 13.5v4M8 20.5h8M9.5 17.5h5"]],
  playbook: [["s", "M15 4.5h4v16H5v-16h4"], ["s", "M9 3h6v3H9z"], ["s", "M8 10l3 3M11 10l-3 3M13 17l4-4M14.5 13H17v2.5"]],
  pencil: [["s", "M4 20l1-5L15 5l4 4L9 19z"], ["s", "M13 7l4 4"]],
  eraser: [["s", "M3.5 14.5l9-9 7 7-6.5 6.5H7.5z"], ["s", "M8 10l7 7M13 19h7.5"]],
  arrow: [["s", "M4 12h15M14 7l5 5-5 5"]],
  layers: [["s", "M12 3.5l9 4.5-9 4.5L3 8z"], ["s", "M3 12l9 4.5 9-4.5M3 16l9 4.5 9-4.5"]],
  save: [["s", "M4 4h13l3 3v13H4z"], ["s", "M8 4v5h7V4M7.5 14h9v6h-9z"]],
  share: [["s", "M16 3h5v5h-5zM3 9.5h5v5H3zM16 16h5v5h-5z"], ["s", "M8 11l8-4.5M8 13l8 4.5"]],
  play: [["s", "M7 4l12 8-12 8z"]],
  pause: [["s", "M6.5 4h3.5v16H6.5zM14 4h3.5v16H14z"]],
  close: [["s", "M5 5l14 14M19 5L5 19"]],
  chevron: [["s", "M6 9l6 6 6-6"]],
  // Prancheta (adicionados no app, mesmo grid e traço)
  select: [["s", "M5 3.5l14 7-6.5 2-2 6.5z"], ["s", "M12.5 12.5l6 6"]],
  text: [["s", "M5 6V4h14v2M12 4v16M9 20h6"]],
  undo: [["s", "M9 5L4 10l5 5"], ["s", "M4 10h11l4 4v5"]],
  redo: [["s", "M15 5l5 5-5 5"], ["s", "M20 10H9l-4 4v5"]],
  rotate: [["s", "M20 13v6l-1.5 1.5h-13L4 19V7.5L5.5 6H15"], ["s", "M12 3l3 3-3 3"]],
  eye: [["s", "M2.5 12l4.5-5.5h10l4.5 5.5-4.5 5.5H7z"], ["f", "M10.5 10.5h3v3h-3z"]],
  "eye-off": [["s", "M2.5 12l4.5-5.5h10l4.5 5.5-4.5 5.5H7z"], ["s", "M4 20L20 4"]]
} satisfies Record<string, IconPart[]>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
