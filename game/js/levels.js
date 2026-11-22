// levels.js — the three rooms of the Meridian Gallery of Curiosities.
// Coordinates live in canvas space, 1280 x 664. Every room offers at least
// two routes to the loot: a direct lane past the patrols and a quiet lane
// behind the furniture. Nothing here is copied from any existing game:
// the gallery, its guards and its treasures are invented for this entry.

export const ROOM = { x: 24, y: 24, w: 1232, h: 616 };

// A solid is a rectangle the thief cannot walk through and no eye can see
// through: pillars, display cases, crates and partition walls.
function solid(x, y, w, h, kind) {
  return { x, y, w, h, kind };
}

export const LEVELS = [
  {
    name: "I — The Marble Hall",
    brief: "Cross the hall, lift the Crimson Star Sapphire, and slip out the east door.",
    spawn: { x: 90, y: 560 },
    exit: { x: 1196, y: 70, w: 56, h: 96, label: "EAST DOOR" },
    solids: [
      solid(320, 170, 48, 48, "pillar"),
      solid(320, 450, 48, 48, "pillar"),
      solid(900, 170, 48, 48, "pillar"),
      solid(900, 450, 48, 48, "pillar"),
      solid(520, 110, 130, 44, "case"),
      solid(640, 520, 130, 44, "case"),
      solid(170, 320, 64, 64, "crate"),
      solid(1040, 320, 64, 64, "crate"),
      solid(600, 280, 80, 80, "pedestal"),
    ],
    loot: [
      { x: 640, y: 320, kind: "sapphire", value: 5000, label: "Crimson Star Sapphire", main: true },
      { x: 210, y: 130, kind: "gold", value: 800, label: "Gold ingot" },
      { x: 1090, y: 540, kind: "painting", value: 1200, label: "Portrait of a Stranger" },
    ],
    guards: [
      {
        route: [[280, 240], [980, 240], [980, 430], [280, 430]],
        speed: 62, pause: 1.1, range: 200, halfAngle: 0.58,
      },
      {
        route: [[480, 120], [480, 560]],
        speed: 55, pause: 1.6, range: 185, halfAngle: 0.58,
      },
    ],
    cameras: [
      { x: 640, y: 34, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55, range: 230, halfAngle: 0.42 },
    ],
  },
  {
    name: "II — The Glass Gallery",
    brief: "Two wings, three guards, two cameras. The sapphire waits in the west wing.",
    spawn: { x: 90, y: 90 },
    exit: { x: 1196, y: 500, w: 56, h: 96, label: "SERVICE DOOR" },
    solids: [
      solid(420, 24, 26, 380, "wall"),
      solid(840, 260, 26, 380, "wall"),
      solid(560, 300, 170, 26, "wall"),
      solid(250, 300, 48, 48, "pillar"),
      solid(1020, 300, 48, 48, "pillar"),
      solid(640, 130, 130, 44, "case"),
      solid(640, 500, 130, 44, "case"),
      solid(150, 470, 64, 64, "crate"),
      solid(1120, 130, 64, 64, "crate"),
      solid(190, 150, 80, 80, "pedestal"),
    ],
    loot: [
      { x: 230, y: 190, kind: "sapphire", value: 5000, label: "Crimson Star Sapphire", main: true },
      { x: 640, y: 152, kind: "gold", value: 800, label: "Gold ingot" },
      { x: 1150, y: 340, kind: "painting", value: 1200, label: "The Blue Hour" },
      { x: 960, y: 560, kind: "gold", value: 800, label: "Gold ingot" },
    ],
    guards: [
      {
        route: [[520, 120], [1060, 120], [1060, 220], [520, 220]],
        speed: 68, pause: 0.9, range: 205, halfAngle: 0.58,
      },
      {
        route: [[120, 380], [360, 380], [360, 560], [120, 560]],
        speed: 58, pause: 1.3, range: 190, halfAngle: 0.58,
      },
      {
        route: [[950, 240], [950, 480], [1150, 480], [1150, 240]],
        speed: 74, pause: 0.7, range: 195, halfAngle: 0.6,
      },
    ],
    cameras: [
      { x: 446, y: 34, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.6, range: 230, halfAngle: 0.42 },
      { x: 800, y: 630, baseAngle: -Math.PI / 2, sweep: 0.7, speed: 0.5, range: 230, halfAngle: 0.42 },
    ],
  },
  {
    name: "III — The Vault Antechamber",
    brief: "The last room. The vault door opens only once the sapphire is yours.",
    spawn: { x: 640, y: 590 },
    exit: { x: 600, y: 24, w: 80, h: 56, label: "VAULT DOOR" },
    solids: [
      solid(300, 24, 26, 260, "wall"),
      solid(954, 24, 26, 260, "wall"),
      solid(300, 380, 26, 260, "wall"),
      solid(954, 380, 26, 260, "wall"),
      solid(430, 380, 130, 44, "case"),
      solid(720, 380, 130, 44, "case"),
      solid(430, 180, 130, 44, "case"),
      solid(720, 180, 130, 44, "case"),
      solid(150, 300, 64, 64, "crate"),
      solid(1066, 300, 64, 64, "crate"),
      solid(600, 280, 80, 80, "pedestal"),
    ],
    loot: [
      { x: 640, y: 320, kind: "sapphire", value: 5000, label: "Crimson Star Sapphire", main: true },
      { x: 150, y: 130, kind: "painting", value: 1200, label: "Midnight Over Meridian" },
      { x: 1130, y: 130, kind: "painting", value: 1200, label: "The Gilded Fox" },
      { x: 150, y: 540, kind: "gold", value: 800, label: "Gold ingot" },
      { x: 1130, y: 540, kind: "gold", value: 800, label: "Gold ingot" },
    ],
    guards: [
      {
        route: [[360, 250], [920, 250]],
        speed: 70, pause: 0.8, range: 210, halfAngle: 0.58,
      },
      {
        route: [[120, 120], [120, 560], [280, 560], [280, 120]],
        speed: 66, pause: 1.0, range: 195, halfAngle: 0.58,
      },
      {
        route: [[1160, 120], [1160, 560], [1000, 560], [1000, 120]],
        speed: 66, pause: 1.0, range: 195, halfAngle: 0.58,
      },
    ],
    cameras: [
      { x: 326, y: 34, baseAngle: Math.PI / 2, sweep: 0.6, speed: 0.65, range: 230, halfAngle: 0.42 },
      { x: 954, y: 34, baseAngle: Math.PI / 2, sweep: 0.6, speed: 0.65, range: 230, halfAngle: 0.42 },
    ],
  },
];
