"""
把海报用到的艺术字裁成 latin 子集，输出到 public/fonts/subset/。

用法：python scripts/subset-fonts.py

说明：
- 艺术字只用于英文装饰词（A–Z / 数字 / 基本标点），裁到 ASCII + Latin-1 足够；
- 保留原文件不动，只新增子集文件；styles.css 与 POSTER_ART_FONTS 指向子集；
- 没有 brotli 时输出同格式（ttf/otf），不强行生成 woff2。
"""
from pathlib import Path
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "public" / "fonts"
OUT_DIR = SRC_DIR / "subset"

FONTS = [
    "fpl-bauhaus.otf",
    "fpl-nasa.otf",
    "fpl-stencil.ttf",
    "fpl-swiss.ttf",
    "fpl-cassette.ttf",
    "fpl-constructivism.ttf",
]

UNICODES = "U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2026"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for name in FONTS:
        src = SRC_DIR / name
        dst = OUT_DIR / name
        if not src.exists():
            print(f"skip missing {name}")
            continue
        subset.main(
            [
                str(src),
                f"--output-file={dst}",
                f"--unicodes={UNICODES}",
                "--layout-features=kern,liga",
                "--no-hinting",
                "--desubroutinize",
                "--drop-tables+=DSIG",
            ]
        )
        before = src.stat().st_size
        after = dst.stat().st_size
        total += after
        print(f"{name}: {before / 1024:.1f}KB -> {after / 1024:.1f}KB")
    print(f"total subset: {total / 1024:.1f}KB")


if __name__ == "__main__":
    main()
