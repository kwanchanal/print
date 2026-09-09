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
  seed.js
  artworks/
    registry.js
    butternut/
      artwork.js
      seeds.js
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

## ASCII Generator

เลือก `ASCII Generator` ใน Select Collection แล้วเลือก Preset:

- `Upload`: เลือกรูปจากเครื่อง ช่อง Seed และ Apply/Random จะปิดใช้งาน
  เมื่ออ่านไฟล์สำเร็จ Seed จะเป็น SHA-256 ของไฟล์ รูปเดิมจึงได้ Seed เดิม
  ภาพอยู่ในหน่วยความจำของหน้าเว็บ ไม่ถูกอัปโหลดไปยังเซิร์ฟเวอร์
  เมื่อ reload หรือเปิด URL บนเครื่องอื่น ต้องเลือกไฟล์เดิมอีกครั้ง
- `Random`: สร้างภาพคลื่นกราฟิกจาก Seed แล้วแปลงเป็น ASCII
  พิมพ์ Seed แล้วกด Apply/Enter หรือกด Random เพื่อสร้าง Seed ใหม่
  Seed, algorithm version และค่าปรับภาพถูกเก็บใน URL

ตัวเลือกประกอบด้วยชุดอักขระ 11 แบบและ Custom, Width 40–160,
Character Size 6–16, Spacing -2–6, Brightness/Contrast -100–100,
Monochrome/Source Colors, Display Color และ Glow
ใช้ฟอนต์ Courier New/monospace และสีเข้มเริ่มต้นเพื่อให้เห็นบนพื้นขาว
รองรับไฟล์ภาพที่ browser อ่านได้ ขนาดไม่เกิน 20 MB และจำกัด 600 แถว
PNG/SVG ใช้ Frame และ Zoom เดียวกับ preview พื้นที่ว่างในไฟล์เป็นโปร่งใส

### Collection API

`artworks/registry.js` ลงทะเบียน module และ metadata ของแต่ละ collection
`app.js` จัดการเมนูหลักและ Seed แยกตาม collection ระหว่างการใช้งาน
แต่ละ renderer ใช้ `render(container, { seed, algorithmVersion, designSize })`
โดยสร้าง SVG บนพื้นที่ออกแบบคงที่ ส่วน `artworks/shared/output.js`
จัด Frame, Zoom และ export โดยไม่เปลี่ยนการสร้าง artwork

Collection ที่มีตัวเลือกเพิ่มเติมสามารถ export:

- `capabilities`: รายการ `presets` และชนิดไฟล์ `exports`
- `mountControls(container, { refresh, setSeed })`: สร้างเมนูเฉพาะ collection
- `getPreset()`, `choosePreset(value)`, `seedEnabled()`: จัดการ preset และสิทธิ์แก้ Seed
- `initialize(params)`, `writeURL(url)`: อ่าน/บันทึกค่าปรับภาพ
- `resolveSeed(seed)`: กำหนด Seed จาก input เช่น hash ของไฟล์ Upload

ใช้ `artworks/shared/controls.js` สำหรับ accordion และ custom dropdown
ของเมนูใหม่ ส่วน Butternut ยังใช้ Original/Custom และ renderer เดิมได้
การเก็บ version ใน URL ยังไม่ได้รองรับเลือก algorithm รุ่นเก่าย้อนหลัง
หากเพิ่ม algorithm รุ่นใหม่ ต้องเก็บ implementation รุ่นเดิมและเพิ่มตัว dispatch

ตรวจ core ASCII ด้วย `node --test tests/ascii.test.mjs`
แล้วตรวจ UI โดยลอง Upload, Random, Apply seed เดิม, เปลี่ยน collection,
Frame/Zoom และดาวน์โหลด PNG/SVG

## Menu Design System

เมนูด้านซ้ายเป็น Studio control surface กลางของเว็บ ทุก collection ควรเริ่มจาก
`Select Collection` ก่อน แล้วค่อยแสดงตัวเลือกตามความสามารถของ collection นั้น

โครงเมนูหลัก:

```text
PRINT STUDIO
SELECT COLLECTION
SEED / PRESET
+ CANVAS
  SIZE
  FRAME
EXPORT BUTTONS
```

กติกาเวลาเพิ่มเมนูหรือปุ่มใหม่:

- ใช้ฟอนต์ monospace, ตัวพิมพ์ใหญ่, เส้นขอบสีดำ 1px และมุมเหลี่ยมเหมือนเมนูเดิม
- กลุ่มตัวเลือกหลักใช้รูปแบบ accordion เหมือน `+ CANVAS`
- Dropdown ต้องใช้ custom menu แบบเดียวกับ `Select Collection` และ `Preset`
  ไม่ใช้ native select ถ้าต้องการให้หน้าตาเข้ากับระบบ
- ปุ่ม action ใช้ `.outline-button` สูง 40px ขอบดำ พื้นขาว
- ปุ่ม action สำคัญมากเท่านั้นถึงใช้พื้นดำ และต้องใช้เท่าที่จำเป็น
- อย่าเพิ่มเมนูที่ collection ปัจจุบันยังใช้ไม่ได้จริง ให้ collection ประกาศ
  capability ก่อน เช่น `seed`, `upload`, `animation`, `svgExport`, `pngExport`
- `Frame`, `Zoom`, `Preview`, `Save`, และ `Export` เป็นระบบกลางของ Studio
  ไม่ควรเขียนซ้ำในแต่ละ collection
- ตัวเลือกเฉพาะงาน เช่น จำนวนดอกไม้, character set, contour, animation speed
  ควรอยู่ใน collection controls และแสดงเฉพาะ collection ที่รองรับ

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

## เพิ่ม Randomness เฉพาะบางส่วน

โครงสร้างด้านบนใช้สำหรับ SVG ที่สร้างด้วยโค้ด หากต้องการให้ collection
รองรับ Seed, Random และ preset ให้เพิ่ม `seeds.js` ในโฟลเดอร์ของ collection
แล้ว export ข้อมูลเหล่านั้นผ่าน `artwork.js` ดังตัวอย่างด้านล่าง
ตัวอย่างนี้ใช้วงรีแทนรูปทรงหลัก และสุ่มเฉพาะจุดตกแต่งสามจุด

### 1. กำหนดกฎการสุ่มใน seeds.js

ไฟล์ `artworks/canele/seeds.js`:

```js
import { createRandom } from "../../seed.js";

export const algorithmVersion = "1";
export const designSize = { width: 600, height: 600 };
export const presets = [{ seed: "original", label: "Original" }];

const anchors = [[260, 260], [300, 290], [340, 260]];

export function makeDecoration(seed) {
  const random = createRandom(`canele:${algorithmVersion}:${seed}:decoration`);
  return anchors.map(([x, y]) => ({
    x: seed === "original" ? x : x + (random() - 0.5) * 20,
    y: seed === "original" ? y : y + (random() - 0.5) * 20,
    angle: seed === "original" ? 0 : (random() - 0.5) * 30
  }));
}
```

`createRandom()` คืนค่าระหว่าง 0 ถึงน้อยกว่า 1 ตามลำดับที่ทำซ้ำได้
ตัวอย่างนี้ขยับจุดจากตำแหน่งเดิมประมาณ -10 ถึง +10 หน่วย
และหมุนประมาณ -15 ถึง +15 องศา ส่วน `original` ใช้ตำแหน่งต้นฉบับ

### 2. นำค่าที่สุ่มไปวาดจริงใน artwork.js

แทนตัวอย่าง render แบบพื้นฐานด้านบนด้วย:

```js
import { makeDecoration, designSize } from "./seeds.js";
export { algorithmVersion, designSize, presets } from "./seeds.js";

const NS = "http://www.w3.org/2000/svg";
function element(tag, attributes) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

export function render(container, { seed = "original" } = {}) {
  const svg = element("svg", {
    viewBox: `0 0 ${designSize.width} ${designSize.height}`,
    role: "img",
    "aria-label": "Seeded decoration study"
  });
  svg.append(element("rect", {
    x: 0, y: 0, width: 600, height: 600, fill: "#ffffff"
  }));
  // รูปทรงหลักคงเดิมทุก seed
  svg.append(element("ellipse", {
    cx: 300, cy: 320, rx: 110, ry: 150, fill: "#dca448"
  }));
  for (const { x, y, angle } of makeDecoration(seed)) {
    svg.append(element("ellipse", {
      cx: x, cy: y, rx: 12, ry: 6, fill: "#fff4ca",
      transform: `rotate(${angle} ${x} ${y})`
    }));
  }
  container.replaceChildren(svg);
}
```

เพิ่ม `meta.js` และรายการใน `registry.js` ตามขั้นตอนก่อนหน้า
โดยเก็บรายการ collection เดิมไว้ด้วย ระบบเมนูจะอ่าน `presets` จากโมดูล
และส่ง seed ปัจจุบันเข้า `render()` ให้เอง

### หลักการออกแบบการสุ่ม

- เลือกก่อนว่าจะคงอะไรไว้และสุ่มอะไร เช่น Butternut คงรูปทรง สี และ texture
  แต่ขยับตำแหน่งและมุมเมล็ด ดูตัวอย่างใน [seeds.js](artworks/butternut/seeds.js)
  และ [artwork.js](artworks/butternut/artwork.js)
- สร้างตัวสุ่มใหม่ก่อนสร้างภาพแต่ละครั้ง หลีกเลี่ยง `Math.random()` และเวลา
  ภายใน algorithm ที่ต้องทำซ้ำจาก seed เดิม
- แยกลำดับสุ่มตามส่วน เช่น `:flowers`, `:leaves`, `:texture`
  เพื่อให้การเพิ่มรายละเอียดส่วนหนึ่งไม่เปลี่ยนผลสุ่มของอีกส่วน
- จำกัดช่วงตำแหน่ง ขนาด มุม และจำนวนชิ้น กำหนดระยะห่างขั้นต่ำถ้าต้องการ
  ลดการทับกัน และใช้ SVG `clipPath` ถ้าต้องจำกัดให้อยู่ในรูปทรงเฉพาะ
  ตัวอย่าง jitter ด้านบนเพียงอย่างเดียวไม่ได้ตรวจการชนหรือขอบรูปทรง
- สร้างภาพบนพิกัดออกแบบคงที่ เช่น 600 × 600 แล้วให้แอปจัด Frame/Zoom
  ไม่ใช้ขนาดหน้าจอหรือค่า Zoom เป็นส่วนหนึ่งของ seed
- เพิ่ม `algorithmVersion` เมื่อแก้กฎที่ทำให้ seed เดิมได้ภาพใหม่
  ปัจจุบันแอปบันทึกเวอร์ชันลง URL/ไฟล์ แต่ยังไม่มีระบบโหลด algorithm เก่า
  จึงต้องเก็บ implementation เก่าและเพิ่มตัวเลือกเวอร์ชันหากต้องรองรับย้อนหลัง

### วิธีลองใช้งานและตรวจสอบ

1. เปิด local server แล้วเลือก collection ใหม่ใน Select Collection
2. เลือก Original เพื่อตรวจภาพต้นฉบับ
3. เลือก Custom เพื่อสร้าง seed ใหม่ หรือกรอก `test-01` แล้วกด Apply/Enter
4. กด Random แล้วกรอก `test-01` อีกครั้ง ตำแหน่งต้องกลับมาเหมือนเดิม
5. Reload, เปลี่ยน Frame/Zoom และสลับ collection กลับมา โดย seed เดิม
   ต้องยังสร้างองค์ประกอบเดิม
6. ตรวจว่าจุดที่สุ่มไม่หลุดพื้นที่หรือทับกันเกินข้อกำหนด และชื่อไฟล์ SVG/PNG
   มี seed กับเวอร์ชัน ดูสัญญาการเรียกโมดูลเพิ่มเติมใน [SEED-API.md](SEED-API.md)

ระบบปัจจุบันรองรับการวาดและ export ที่อิง SVG หากเพิ่มรูป JPG/PNG
รูปนั้นเป็นภาพคงที่ เว้นแต่จะแยกชิ้นส่วนหรือวาดส่วนที่ต้องสุ่มเพิ่มด้วยโค้ด
สำหรับ collection แบบ Canvas/p5.js ต้องเพิ่ม adapter สำหรับ render/export ก่อน
Animated SVG และ WebM ยังไม่รองรับ จึงไม่แสดงปุ่มในเมนู

## Prompt Template For Codex

Use this when asking Codex to add a new piece:

```text
เพิ่ม artwork ใหม่ชื่อ [name] ใน print/artworks/[name]/
ใช้ reference ที่แนบมา ทำเป็น SVG ด้วยโค้ดใน artwork.js
ใส่ meta.js ให้ครบ แล้วเพิ่มเข้า artworks/registry.js
ให้หน้า dropdown เลือกได้
คง [รูปทรง/สี/พื้นหลัง] เดิม
ใช้ seed สุ่มเฉพาะ [ตำแหน่ง/มุม/ขนาด/จำนวน] ของ [ส่วนที่ต้องการ]
จำกัด [ขอบเขต/ระยะห่าง/ช่วงค่า] เพื่อรักษาองค์ประกอบ
เก็บต้นฉบับเป็น preset Original และใช้เมนู Seed/Random เดิม
```

### ตัวอย่างคำสั่ง: Vase Garden

แนบภาพอ้างอิงพร้อมคำสั่งนี้:

```text
เพิ่ม collection ชื่อ Vase Garden จากภาพอ้างอิงนี้
คงรูปทรงแจกัน สี และพื้นหลังเดิม
ใช้ seed สุ่มเฉพาะตำแหน่งดอกไม้ มุมใบไม้ และจำนวนดอก 5–8 ดอก
ดอกไม้ต้องอยู่เหนือปากแจกันและไม่ทับกันมากเกินไป
เก็บภาพต้นฉบับเป็น preset Original และใช้เมนู Seed/Random เดิม
```
