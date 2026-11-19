# Сборка веб-версий телеграм-коллажей: WebP 1080 и 540 по длинной стороне.
# Исходники лежат в brand/telegram, результат - в assets/collages.
# Запуск из корня сайта: python build-collages.py

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = ROOT.parent / "brand" / "telegram"
OUT = ROOT / "assets" / "collages"

WORKS = {
    "full-circus": "full-circus/full-circus.png",
    "last-act": "last-act/last-act.png",
    "neprikasaemy": "neprikasaemy/neprikasaemy.png",
    "tif-v-manezhe": "tif-v-manezhe/tif-v-manezhe.png",
    "antrakt": "antrakt/poster.png",
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, rel in WORKS.items():
        src = SRC / rel
        img = Image.open(src).convert("RGB")
        for width in (1080, 540):
            height = round(img.height * width / img.width)
            small = img.resize((width, height), Image.LANCZOS)
            dst = OUT / f"{slug}-{width}.webp"
            small.save(dst, "WEBP", quality=82, method=6)
            print(f"{dst.name}: {dst.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
