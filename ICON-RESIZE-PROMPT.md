# TASK: Generate All TRANSFORMR Icon Sizes for the Repo

The source icon files are in `C:\dev\transformr\assets\icons\`. Copy the downloaded files there first, then run this task.

## Source Files (already created, download from Claude chat)
- `transformr-icon-source.svg` — 1024x1024 SVG, full icon with Deep Space background
- `transformr-icon-transparent.svg` — 1024x1024 SVG, transparent background (prism only)
- `transformr-favicon.svg` — 64x64 SVG, simplified favicon with rounded dark container
- `transformr-icon-1024x1024.png` — Source PNG, full icon
- `transformr-icon-1024x1024.jpg` — Source JPG, full icon
- `transformr-icon-transparent-1024x1024.png` — Source PNG, transparent background

## Directory Structure to Create
```
C:\dev\transformr\assets\
├── icons\
│   ├── source\
│   │   ├── transformr-icon-source.svg
│   │   ├── transformr-icon-transparent.svg
│   │   └── transformr-favicon.svg
│   ├── app-icon\
│   │   ├── icon-1024.png          (1024x1024 — App Store source, required by Apple)
│   │   ├── icon-512.png           (512x512 — Google Play)
│   │   ├── icon-192.png           (192x192 — Android adaptive icon)
│   │   ├── icon-144.png           (144x144 — Android)
│   │   ├── icon-120.png           (120x120 — iPhone Spotlight)
│   │   ├── icon-96.png            (96x96 — Android)
│   │   ├── icon-76.png            (76x76 — iPad)
│   │   ├── icon-72.png            (72x72 — Android)
│   │   ├── icon-60.png            (60x60 — iPhone)
│   │   ├── icon-48.png            (48x48 — Android)
│   │   ├── icon-40.png            (40x40 — iPhone Spotlight 2x)
│   │   └── icon-29.png            (29x29 — iPhone Settings)
│   ├── favicon\
│   │   ├── favicon.ico            (multi-size: 16x16, 32x32, 48x48)
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon-48x48.png
│   │   └── favicon-64x64.png
│   ├── apple-touch-icon.png       (180x180 — iOS home screen bookmark)
│   ├── android-chrome-192x192.png (192x192 — Android Chrome)
│   ├── android-chrome-512x512.png (512x512 — Android Chrome splash)
│   ├── mstile-150x150.png         (150x150 — Windows tile)
│   └── safari-pinned-tab.svg      (monochrome SVG for Safari pinned tab)
├── splash\
│   ├── splash-1284x2778.png       (iPhone 13 Pro Max)
│   ├── splash-1170x2532.png       (iPhone 13)
│   ├── splash-1125x2436.png       (iPhone X/XS)
│   ├── splash-1242x2688.png       (iPhone XS Max)
│   ├── splash-750x1334.png        (iPhone 8)
│   └── splash-1536x2048.png       (iPad)
```

## Resize Script (Python)

Use the source 1024x1024 PNG to generate all sizes. Use Pillow (PIL):

```python
from PIL import Image
import os

SOURCE = "assets/icons/source/transformr-icon-1024x1024.png"
FAVICON_SOURCE = "assets/icons/source/transformr-favicon-64x64.png"

img = Image.open(SOURCE)

# App icons (all from 1024 source)
app_sizes = [1024, 512, 192, 144, 120, 96, 76, 72, 60, 48, 40, 29]
os.makedirs("assets/icons/app-icon", exist_ok=True)
for s in app_sizes:
    resized = img.resize((s, s), Image.LANCZOS)
    resized.save(f"assets/icons/app-icon/icon-{s}.png", "PNG", optimize=True)

# Favicons (from favicon source for better quality at small sizes)
fav = Image.open(FAVICON_SOURCE)
fav_sizes = [64, 48, 32, 16]
os.makedirs("assets/icons/favicon", exist_ok=True)
for s in fav_sizes:
    resized = fav.resize((s, s), Image.LANCZOS)
    resized.save(f"assets/icons/favicon/favicon-{s}x{s}.png", "PNG", optimize=True)

# Generate favicon.ico (multi-size)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = [fav.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_images[0].save("assets/icons/favicon/favicon.ico", format="ICO", sizes=ico_sizes)

# Apple touch icon
apple = img.resize((180, 180), Image.LANCZOS)
apple.save("assets/icons/apple-touch-icon.png", "PNG", optimize=True)

# Android Chrome
for s in [192, 512]:
    resized = img.resize((s, s), Image.LANCZOS)
    resized.save(f"assets/icons/android-chrome-{s}x{s}.png", "PNG", optimize=True)

# Microsoft tile
tile = img.resize((150, 150), Image.LANCZOS)
tile.save("assets/icons/mstile-150x150.png", "PNG", optimize=True)
```

## Splash Screen Generation

Generate splash screens with the icon centered on a #0C0A15 background:

```python
from PIL import Image

ICON = Image.open("assets/icons/source/transformr-icon-transparent-1024x1024.png")

splash_sizes = [
    (1284, 2778, "13-pro-max"),
    (1170, 2532, "13"),
    (1125, 2436, "x"),
    (1242, 2688, "xs-max"),
    (750, 1334, "8"),
    (1536, 2048, "ipad"),
]

os.makedirs("assets/splash", exist_ok=True)

for w, h, name in splash_sizes:
    bg = Image.new("RGBA", (w, h), (12, 10, 21, 255))
    # Icon at 25% of screen width
    icon_size = int(w * 0.25)
    icon_resized = ICON.resize((icon_size, icon_size), Image.LANCZOS)
    # Center it
    x = (w - icon_size) // 2
    y = (h - icon_size) // 2 - int(h * 0.05)  # Slightly above center
    bg.paste(icon_resized, (x, y), icon_resized)
    bg.save(f"assets/splash/splash-{w}x{h}.png", "PNG")
```

## Update app.json

After generating all icons, update `apps/mobile/app.json`:

```json
{
  "expo": {
    "icon": "./assets/icons/app-icon/icon-1024.png",
    "splash": {
      "image": "./assets/splash/splash-1284x2778.png",
      "resizeMode": "cover",
      "backgroundColor": "#0C0A15"
    },
    "ios": {
      "icon": "./assets/icons/app-icon/icon-1024.png"
    },
    "android": {
      "icon": "./assets/icons/app-icon/icon-512.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/app-icon/icon-192.png",
        "backgroundColor": "#0C0A15"
      }
    },
    "web": {
      "favicon": "./assets/icons/favicon/favicon-32x32.png"
    }
  }
}
```

## Verification

After running, verify:
1. All files exist in the correct directories
2. Icon-1024.png is exactly 1024x1024 (App Store requirement)
3. favicon.ico contains all three sizes (16, 32, 48)
4. Splash screens have the prism centered on Deep Space background
5. All PNGs are optimized
6. No file exceeds 1MB (App Store limit for icons)

```bash
cd C:\dev\transformr
dir /s /b assets\icons\*.png | find /c ".png"
dir /s /b assets\splash\*.png | find /c ".png"
```

Expected: 20+ icon files, 6 splash files.
