"""BACKUP DECK, step 2 of 2: put the recorded slides into a PowerPoint file.

    python3 tools/backup-deck/build_pptx.py                 the animated deck (one video per slide, plays by itself)
    python3 tools/backup-deck/build_pptx.py --stills        the same slides as pictures only (no video, no motion)

Reads tests/out/backup-deck/ (made by capture.mjs) and writes the .pptx beside it. Each slide of the animated deck is
one full screen video of that slide building itself; it starts when the slide appears and rests on its last frame.
One press of the clicker moves to the next slide. Speaker notes carry the show's notes.
"""
import argparse, copy, json, os, sys
from lxml import etree
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('--dir', default=os.path.join(HERE, '../../tests/out/backup-deck'))
ap.add_argument('--out', default='')
ap.add_argument('--stills', action='store_true')
a = ap.parse_args()
D = os.path.abspath(a.dir)
OUT = a.out or os.path.join(D, 'Beatty Open House backup (%s).pptx' % ('stills' if a.stills else 'animated'))
items = json.load(open(os.path.join(D, 'manifest.json'), encoding='utf-8'))['items']

W, H = Emu(12192000), Emu(6858000)          # 16:9, 13.333 by 7.5 inches
NAVY, GOLD, WHITE = RGBColor(0x00, 0x0C, 0x53), RGBColor(0xFF, 0xE2, 0x00), RGBColor(0xFF, 0xFF, 0xFF)
P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
prs = Presentation(); prs.slide_width, prs.slide_height = W, H
BLANK = prs.slide_layouts[6]

def navy(slide):
    bg = slide.background.fill; bg.solid(); bg.fore_color.rgb = NAVY

def text(slide, s, top, size, color=WHITE, bold=False, font='Georgia', link=None):
    tb = slide.shapes.add_textbox(Emu(914400), Emu(top), W - Emu(1828800), Emu(900000)); tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT; r = p.add_run(); r.text = s
    r.font.size = Pt(size); r.font.bold = bold; r.font.name = font; r.font.color.rgb = color
    if link: r.hyperlink.address = link
    return tb

def notes(slide, s):
    if s: slide.notes_slide.notes_text_frame.text = s

def tail(slide, *els):
    """Add elements to the slide in the order PowerPoint expects: after the shapes, before any extension list."""
    root = slide._element; ext = root.find('{%s}extLst' % P)
    for el in els:
        if ext is not None: ext.addprevious(el)
        else: root.append(el)

FADE = '<p:transition xmlns:p="%s" spd="fast"><p:fade/></p:transition>' % P
# "Start: Automatically", exactly as PowerPoint writes it: the video plays from its start as soon as the slide is shown.
AUTOPLAY = '''<p:timing xmlns:p="%s"><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>
<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>
<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>
<p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>
<p:par><p:cTn id="5" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="afterEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>
<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="6" dur="%%d" fill="hold"/><p:tgtEl><p:spTgt spid="%%d"/></p:tgtEl></p:cBhvr></p:cmd>
</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>
</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>
<p:video><p:cMediaNode vol="80000"><p:cTn id="7" fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="%%d"/></p:tgtEl></p:cMediaNode></p:video>
</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>''' % P

# A hidden first slide: how to use the file. It is skipped in the slide show.
s = prs.slides.add_slide(BLANK); navy(s); s._element.set('show', '0')
text(s, 'How to use this backup deck', 500000, 36, GOLD, True)
tips = (['Each slide is one video of that slide building itself. It plays by itself when the slide appears, then rests.',
         'One press of the clicker (or the right arrow) moves to the next slide.',
         'If a slide ever stays empty, click on it once: its video will play.',
         'Slide Show tab: untick "Show Media Controls", so no play bar appears when the mouse moves.',
         'Use PowerPoint on a laptop (2016 or later). Keynote, Google Slides and phones will not play it properly.',
         'This slide is hidden: the audience never sees it.'] if not a.stills else
        ['These are the same slides as pictures only: no video and no motion. Use it if the animated deck will not play.',
         'This slide is hidden: the audience never sees it.'])
for i, t in enumerate(tips): text(s, '%d.  %s' % (i + 1, t), 1500000 + i * 720000, 20, WHITE, False, 'Calibri')

made = 0; missing = []
for it in items:
    base = os.path.join(D, it['key']); still = base + '.png'
    if not it.get('placeholder') and not os.path.exists(still): missing.append(it['key']); continue
    slide = prs.slides.add_slide(BLANK); navy(slide)
    if it.get('placeholder'):
        text(slide, 'Video', 2300000, 24, GOLD, True, 'Calibri')
        text(slide, 'What makes Beatty Secondary School truly special?', 2800000, 40, WHITE, True)
        text(slide, it.get('url', ''), 3900000, 22, GOLD, False, 'Calibri', link=it.get('url') or None)
        notes(slide, 'The opening video. It is on YouTube, so it needs the internet: click the link. To play it with no internet, insert the video file on this slide (Insert, Video).')
        made += 1; continue
    if a.stills:
        jpg = base + '.still.jpg'
        if not os.path.exists(jpg) or os.path.getmtime(jpg) < os.path.getmtime(still): Image.open(still).convert('RGB').save(jpg, 'JPEG', quality=92, optimize=True)
        slide.shapes.add_picture(jpg, 0, 0, W, H)
        tail(slide, etree.fromstring(FADE))
    else:
        mov = slide.shapes.add_movie(base + '.mp4', 0, 0, W, H, poster_frame_image=base + '.jpg', mime_type='video/mp4')
        mov.name = it['title'][:60]
        old = slide._element.find('{%s}timing' % P)
        if old is not None: slide._element.remove(old)
        ms = int(round(float(it.get('seconds') or 5) * 1000))
        tail(slide, etree.fromstring(FADE), etree.fromstring(AUTOPLAY % (ms, mov.shape_id, mov.shape_id)))
    notes(slide, it.get('notes', ''))
    made += 1

prs.core_properties.title = 'Beatty Secondary School Open House (backup deck)'
prs.core_properties.author = 'Beatty Secondary School'
prs.save(OUT)
print('%d slides -> %s (%.1f MB)' % (made, OUT, os.path.getsize(OUT) / 1e6))
if missing: print('NOT RECORDED YET, left out:', ', '.join(missing)); sys.exit(1)
