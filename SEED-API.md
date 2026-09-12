# Seeded collections

Artwork modules export `algorithmVersion`, `designSize`, `presets`, and
`render(container, { collection, seed, algorithmVersion, designSize })`.
Generation uses fixed design coordinates. Output ratio and zoom belong to
the application and must not affect the random sequence.

Use a fresh `createRandom()` from `seed.js` for each generation, with a key
containing collection, algorithm version, seed and optional layer name.
Increment the algorithm version when changing the seed-to-art mapping.
Butternut version 1 uses a 600 by 600 design and reserves `original` for
the original seed placement. Its texture is intentionally unchanged.

Pudding and PUDDING - RISO version 5 select a left-curving or right-curving
cherry stem. Stems retain a fixed curved profile with mirrored direction,
uniform scaling, and rotation. Straight stems are not used.
Fruit and sprinkle positions retain
their version 1 mapping. `original` keeps the reference stem; its attachment
point stays fixed to the fruit for every seed.

The menu accepts text seeds, Apply/Enter, Random and collection presets.
URLs store seed and version with the collection in the hash. SVG and PNG
filenames include seed and version. Pudding and PUDDING - RISO support half-second seeded
animation frames and GIF export through the optional `animation = true` export.
Frame zero uses the selected seed; subsequent frames use
`JSON.stringify(["animation", 1, seed, frameIndex])`. Duration is 2-20 frames (1-10 seconds).
GIF export uses the current output layout and loops forever. MP4 exports one
H.264 sequence using the same timing; player settings control looping.
