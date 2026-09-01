# Print

A static website for collecting code-generated illustration studies.

The site has a home page with a dropdown menu. Each artwork lives in its own
folder so every piece can keep its own style, helper functions, textures, and
structure.

## Folder Structure

```text
print/
  index.html
  style.css
  app.js
  artworks/
    registry.js
    butternut/
      artwork.js
      meta.js
```

## Open In VSCode

Open the `print` folder in VSCode.

## Local Preview

Because this site uses JavaScript modules, preview it with a small local server:

```bash
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/
```

## Deploy

This is a static site. You can deploy the `print` folder to:

- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages

No build command is needed.

## Add A New Artwork

Create a new folder inside `artworks/`:

```text
artworks/canele/
  artwork.js
  meta.js
```

In `meta.js`, export metadata:

```js
export const meta = {
  id: "canele",
  title: "Canele",
  description: "A short note about the artwork style.",
  tags: ["geometric", "bakery", "svg"]
};
```

In `artwork.js`, export a render function:

```js
export function render(container) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 600 600");

  // Build the artwork here.

  container.replaceChildren(svg);
}
```

Then add it to `artworks/registry.js`:

```js
export const artworks = [
  {
    id: "butternut",
    label: "Butternut",
    artworkPath: "./artworks/butternut/artwork.js",
    metaPath: "./artworks/butternut/meta.js"
  },
  {
    id: "canele",
    label: "Canele",
    artworkPath: "./artworks/canele/artwork.js",
    metaPath: "./artworks/canele/meta.js"
  }
];
```

## Prompt Template For Codex

Use this when asking Codex to add a new piece:

```text
เพิ่ม artwork ใหม่ชื่อ [name] ใน print/artworks/[name]/
ใช้ reference ที่แนบมา ทำเป็น SVG ด้วยโค้ดใน artwork.js
ใส่ meta.js ให้ครบ แล้วเพิ่มเข้า artworks/registry.js
ให้หน้า dropdown เลือกได้
```
