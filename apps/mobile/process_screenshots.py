"""
TRANSFORMR App Store Screenshot Processor

Takes Android emulator screenshots (1080x2400) and produces:
1. Apple App Store versions (Android status bar cropped, resized)
2. Google Play Store versions (resized, status bar kept)
"""

import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: py -m pip install Pillow")
    sys.exit(1)

# ── Configuration ──────────────────────────────────────────────

SCREENSHOT_DIR = Path(r"C:\dev\transformr\apps\mobile\screenshots")
ARCHIVE_DIR = SCREENSHOT_DIR / "Archive"
OUTPUT_DIR = Path(r"C:\dev\transformr\apps\mobile\app-store-assets")

# Curated list of 10 screenshots: (display_name, source_path_relative_to_SCREENSHOT_DIR)
CURATED_SCREENSHOTS = [
    ("01_splash.png", "Screenshot_1777100639.png"),
    ("02_login.png", "Screenshot_1777100662.png"),
    ("03_dashboard.png", "Archive/s_goals.png"),
    ("04_fitness.png", "Archive/s_fitness3.png"),
    ("05_nutrition.png", "Archive/s_nutrition_main.png"),
    ("06_goals.png", "Archive/s_goals2.png"),
    ("07_profile.png", "Archive/s_profile_top.png"),
    ("08_achievements.png", "Archive/s_achievements_top.png"),
    ("09_settings.png", "Archive/s_achievements_final.png"),
    ("10_loading.png", "Screenshot_1777090157.png"),
]

# Android UI crop ratios (for 1080x2400 Pixel 7 screenshots)
# Status bar: ~66-80px at 1080x2400 = ~3% of height
# Nav bar (gesture pill): ~48px = ~2% of height
ANDROID_STATUS_BAR_RATIO = 0.042   # crop top 4.2% (~100px at 2400) — fully removes clock, signal, battery
ANDROID_NAV_BAR_RATIO = 0.016      # crop bottom 1.6% (~38px at 2400) — removes gesture pill, keeps tab bar

# Apple App Store required sizes
APPLE_SIZES = {
    "6.7-inch-iPhone-15-Pro-Max": (1290, 2796),
    "6.5-inch-iPhone-11-Pro-Max": (1242, 2688),
    "5.5-inch-iPhone-8-Plus": (1242, 2208),
}

# Google Play Store sizes
GOOGLE_SIZES = {
    "phone": (1080, 1920),
    "7-inch-tablet": (1080, 1920),
    "10-inch-tablet": (1200, 1920),
}

# TRANSFORMR dark background color (matches app theme)
DARK_BG = (12, 10, 21)


def get_screenshots():
    """Return curated list of (display_name, Path) tuples."""
    results = []
    print(f"Curated screenshot list ({len(CURATED_SCREENSHOTS)} screenshots):")
    for display_name, rel_path in CURATED_SCREENSHOTS:
        full_path = SCREENSHOT_DIR / rel_path
        if not full_path.exists():
            print(f"  ERROR: {rel_path} not found!")
            sys.exit(1)
        img = Image.open(full_path)
        print(f"  {display_name} <- {rel_path}: {img.size[0]}x{img.size[1]}")
        img.close()
        results.append((display_name, full_path))
    return results


def crop_android_ui(img):
    """Remove Android status bar (top) and gesture nav bar (bottom)."""
    width, height = img.size
    top = int(height * ANDROID_STATUS_BAR_RATIO)
    bottom = int(height * ANDROID_NAV_BAR_RATIO)
    return img.crop((0, top, width, height - bottom))


def resize_for_apple(img, target_size, output_name, size_label):
    """Crop Android UI, add clean dark top strip, resize to Apple dimensions."""
    target_w, target_h = target_size

    # Crop Android status bar and nav bar
    cropped = crop_android_ui(img)

    # Add a clean dark strip at top to replace status bar area (~3.5% of target)
    cw, ch = cropped.size
    strip_h = int(target_h * 0.035)
    # Scale strip height relative to cropped image (before final resize)
    strip_h_scaled = int(ch * 0.035)

    new_img = Image.new("RGB", (cw, ch + strip_h_scaled), color=DARK_BG)
    new_img.paste(cropped, (0, strip_h_scaled))

    # Resize to exact Apple dimensions
    resized = new_img.resize((target_w, target_h), Image.LANCZOS)

    output_path = OUTPUT_DIR / "apple" / size_label / output_name
    resized.save(output_path, "PNG", optimize=True)
    print(f"  Apple {size_label}: {output_name} ({target_w}x{target_h})")

    for i in [resized, new_img, cropped]:
        i.close()


def resize_for_google(img, target_size, output_name, size_label):
    """Resize to Google Play dimensions (keep Android UI)."""
    target_w, target_h = target_size
    resized = img.resize((target_w, target_h), Image.LANCZOS)

    output_path = OUTPUT_DIR / "google" / size_label / output_name
    resized.save(output_path, "PNG", optimize=True)
    print(f"  Google {size_label}: {output_name} ({target_w}x{target_h})")

    resized.close()


def process_all():
    """Main pipeline."""
    screenshots = get_screenshots()

    # Create output directories
    for label in APPLE_SIZES:
        (OUTPUT_DIR / "apple" / label).mkdir(parents=True, exist_ok=True)
    for label in GOOGLE_SIZES:
        (OUTPUT_DIR / "google" / label).mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "originals").mkdir(parents=True, exist_ok=True)

    for i, (clean_name, path) in enumerate(screenshots, 1):
        print(f"\n[{i}/{len(screenshots)}] {path.name} -> {clean_name}")

        img = Image.open(path).convert("RGB")

        # Save original to originals folder
        shutil.copy2(path, OUTPUT_DIR / "originals" / clean_name)

        for label, size in APPLE_SIZES.items():
            try:
                resize_for_apple(img, size, clean_name, label)
            except Exception as e:
                print(f"  FAIL Apple {label}: {e}")

        for label, size in GOOGLE_SIZES.items():
            try:
                resize_for_google(img, size, clean_name, label)
            except Exception as e:
                print(f"  FAIL Google {label}: {e}")

        img.close()

    # Summary
    print("\n" + "=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)
    for store in ["apple", "google"]:
        store_dir = OUTPUT_DIR / store
        for size_dir in sorted(store_dir.iterdir()):
            if size_dir.is_dir():
                count = len(list(size_dir.glob("*.png")))
                print(f"  {store}/{size_dir.name}: {count} screenshots")

    print(f"\nOutput: {OUTPUT_DIR}")


if __name__ == "__main__":
    process_all()
