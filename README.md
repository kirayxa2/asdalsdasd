# Lab Sim

Browser-based 3D laboratory simulator. First-person view over a lab table:
drag items into a glass jar, pour liquids, fire up the burner, watch chemistry
happen — sometimes with explosions.

Built with **React + Three.js (React Three Fiber)** + **Zustand** + **Vite**.

## Play

- **Left-click & hold** an item on the shelf to pick it up.
- **Drag** the item over the jar and **release** to drop it in.
  - Solids fall in.
  - Bottles tilt automatically over the jar — release to pour.
- **Burner ON/OFF** button (bottom-right) ignites the gas.
- **Reset jar** clears everything.
- Press **F** (or the camera button) to toggle between static view and free orbit.

## Reactions (tag system)

| Combo                          | Effect                                  |
| ------------------------------ | --------------------------------------- |
| `organic` + `acid`             | Bubbles, dissolves, liquid turns toxic green |
| `organic` + burner heat        | Smoke, color darkens, organic burns away |
| `metal` + `acid`               | Sparks, smoke, rusty tint               |
| `uranium` + anything           | Green glow, danger meter rises          |
| `uranium` + burner             | Danger rises *fast* — explosion incoming |
| Danger meter at max + heat     | **Boom.** Jar wipes itself clean.       |

Items: banana, apple, orange (organic) · acid, water, vinegar (liquids) ·
uranium (radioactive metal) · flask, test-tube (glass) · spoon (metal).

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints. For a production build: `npm run build`.

## Deploy

Pushes to `main` are auto-deployed to GitHub Pages by `.github/workflows/deploy.yml`.
The Vite `base` is set to `/asdalsdasd/` to match the repo path.

## Project layout

```
src/
  App.tsx             # Canvas + post-processing + HUD
  main.tsx            # entry
  types.ts            # Tag, ItemDef, JarState
  data/
    items.ts          # catalog of pickable items
    reactions.ts      # pure recomputeJar() — chemistry rules
  store/
    gameStore.ts      # Zustand store: held item, jar, burner, camera
  scene/
    Scene.tsx         # composes the world + sim tick
    Lab.tsx           # walls, lights, fog
    Table.tsx         # table top + legs + floor
    Shelf.tsx         # shelves + hover/pickup logic
    Burner.tsx        # bunsen burner + animated flame
    Jar.tsx           # glass jar + liquid + contents + bubbles
    HeldItem.tsx      # item attached to the cursor
    DragController.tsx# pointer -> world plane projection + release
    CameraRig.tsx     # static / orbit camera
    ItemMesh.tsx      # stylized primitive renderers per ItemShape
    effects/
      Bubbles.tsx
      Smoke.tsx
      Sparks.tsx
      Explosion.tsx
  ui/
    HUD.tsx           # overlay UI (controls, contents, danger bar)
```

## Extending

- **Add an item:** append to `ITEMS` in `src/data/items.ts`, give it tags
  and a shape, then list its id in any `Shelf` in `Scene.tsx`.
- **Add a reaction:** add a tag check in `recomputeJar` in
  `src/data/reactions.ts` and tweak `targetBubbles/Smoke/Sparks/Glow/dangerRate`.
- **Add a shape:** extend `ItemShape` in `types.ts` and add a renderer
  in `ItemMesh.tsx`.
