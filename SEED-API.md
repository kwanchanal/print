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

The menu accepts text seeds, Apply/Enter, Random and collection presets.
URLs store seed and version with the collection in the hash. SVG and PNG
filenames include seed and version. Pudding supports one-second seeded
animation frames and GIF export through the optional `animation = true` export.
Frame zero uses the selected seed; subsequent frames use
`JSON.stringify(["animation", 1, seed, frameIndex])`. Duration is 2-20 seconds.
GIF export uses the current output layout and loops forever. Video export
remains unsupported.
