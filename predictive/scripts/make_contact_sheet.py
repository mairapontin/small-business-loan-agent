
'''
@module Yataí Finance
@file services/portal-api/src/yatai_api/predictive/scripts/make_contact_sheet.py
@custom file_visibility public
@custom id
@description Rebuilds the diagram contact sheet used as visual review evidence.
@custom status new
@version 01_01
@author Maira Pontin <maira.pontin@yataifinance.com>
@custom ai_author AI Qoder
@custom author_date 260905_022137
@custom reviewer
@custom ai_reviewer
@custom reviewer_date
@custom updated 260908_211306
@example
'''

from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

DOCS = Path(__file__).resolve().parents[1] / "docs"
DIAGRAMS = DOCS / "diagramas"
OUTPUT = DOCS / "revisoes" / "evidencias" / "04_contato_diagramas.png"

THUMB_W, THUMB_H = 1200, 800
LABEL_H = 70
COLS = 2


def main() -> None:
    files = sorted(DIAGRAMS.glob("v3_*_hd.png"))
    if not files:
        raise SystemExit(f"no diagrams found in {DIAGRAMS}")

    rows = (len(files) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * THUMB_W, rows * (THUMB_H + LABEL_H)), "white")
    draw = ImageDraw.Draw(sheet)

    for idx, path in enumerate(files):
        with Image.open(path) as opened:
            image = ImageOps.contain(opened.convert("RGB"), (THUMB_W - 40, THUMB_H - 40))
        column = idx % COLS
        x = column * THUMB_W + (THUMB_W - image.width) // 2
        y0 = (idx // COLS) * (THUMB_H + LABEL_H)
        sheet.paste(image, (x, y0 + 20))
        draw.text((20 + column * THUMB_W, y0 + THUMB_H + 10), path.name, fill="#102A43")

    sheet.save(OUTPUT, quality=95)
    print(OUTPUT)


if __name__ == "__main__":
    main()
