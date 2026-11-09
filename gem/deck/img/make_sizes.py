# Writes sizes.js (width, height of every slide photo) so the show can lay photos out whole before they load.
# Run from gem/:  python3 deck/img/make_sizes.py
import os, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
sizes = {}
for root, _, files in os.walk(here):
    for f in sorted(files):
        if f.lower().endswith(('.jpg', '.jpeg', '.png')):
            full = os.path.join(root, f)
            with Image.open(full) as im:
                sizes[os.path.relpath(full, here).replace(os.sep, '/')] = list(im.size)
with open(os.path.join(here, 'sizes.js'), 'w') as out:
    out.write('/* Photo sizes for the slides (width, height), so photos are laid out whole before they load.\n   Regenerate after adding photos: python3 deck/img/make_sizes.py */\n')
    out.write('window.BTY_IMG_SIZES = ' + json.dumps(sizes, separators=(',', ':')) + ';\n')
print(len(sizes), 'sizes written')
