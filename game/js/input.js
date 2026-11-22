// input.js — keyboard and mouse, kept in one place so the game loop only
// ever asks "what is the player doing right now?" Keys are tracked by code
// (layout independent); clicks are converted to canvas coordinates.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, inside: false };
  let clickQueue = [];

  function toCanvas(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });
  window.addEventListener("blur", () => {
    keys.clear();
  });

  canvas.addEventListener("mousemove", (event) => {
    mouse = { ...toCanvas(event.clientX, event.clientY), inside: true };
  });
  canvas.addEventListener("mouseleave", () => {
    mouse.inside = false;
  });
  canvas.addEventListener("mousedown", (event) => {
    const point = toCanvas(event.clientX, event.clientY);
    clickQueue.push({ x: point.x, y: point.y, button: event.button });
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  return {
    // Held-down state, for movement.
    isDown(code) {
      return keys.has(code);
    },
    // Fired once per physical press; the game loop clears these each frame.
    wasPressed(code) {
      return pressed.has(code);
    },
    clearPressed() {
      pressed.clear();
    },
    // Movement vector from WASD or arrows, normalized.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
      if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    mousePosition() {
      return mouse;
    },
    // Clicks since the last frame, oldest first.
    takeClicks() {
      const clicks = clickQueue;
      clickQueue = [];
      return clicks;
    },
  };
}
