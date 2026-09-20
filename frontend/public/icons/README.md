# Icons

`icon.svg` is the source. `icon-192.png` and `icon-512.png` are generated
from it (via `rsvg-convert -w <size> -h <size> icon.svg -o icon-<size>.png`)
and committed alongside it — Chrome's install prompt needs raster icons in
addition to the SVG. If `icon.svg` changes, regenerate both PNGs the same
way so they stay in sync.
