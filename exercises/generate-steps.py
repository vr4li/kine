#!/usr/bin/env python3
"""Generate PT-style step demonstration SVGs with person figure + Arabic label."""
from pathlib import Path

OUT = Path(__file__).parent / "steps"
OUT.mkdir(exist_ok=True)

def svg(label_ar, label_en, draw_body):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" fill="none">
  <rect width="400" height="320" rx="16" fill="#0D1B2E"/>
  <rect x="12" y="12" width="376" height="256" rx="12" fill="#111F35"/>
  {draw_body}
  <rect x="0" y="272" width="400" height="48" fill="#0A1628"/>
  <text x="200" y="294" text-anchor="middle" fill="#00E5A0" font-size="15" font-weight="700" font-family="Arial,sans-serif">{label_ar}</text>
  <text x="200" y="312" text-anchor="middle" fill="#8FA3BF" font-size="11" font-family="Arial,sans-serif">{label_en}</text>
</svg>'''

def stick(strokes, joints):
    lines = "".join(
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#00E5A0" stroke-width="5" stroke-linecap="round"/>'
        for x1, y1, x2, y2 in strokes
    )
    dots = "".join(
        f'<circle cx="{x}" cy="{y}" r="7" fill="#00E5A0"/>'
        for x, y in joints
    )
    return lines + dots

steps = {
    "cat-cow-1": ("① وضعية البداية — على اليدين والركبتين", "Start — hands and knees",
        stick([(200,95,200,140),(200,140,170,175),(200,140,230,175),(170,175,160,210),(230,175,240,210)],
              [(200,95),(200,140),(170,175),(230,175),(160,210),(240,210)])),
    "cat-cow-2": ("② وضعية القط — قوس الظهر للأعلى", "Cat — round spine up",
        stick([(200,110,200,150),(200,150,175,165),(200,150,225,165)], [(200,110),(200,150),(175,165),(225,165)]) +
        '<path d="M175 165 Q200 130 225 165" stroke="#00E5A0" stroke-width="5" fill="none"/>'),
    "cat-cow-3": ("③ وضعية البقرة — انحناء الظهر للأسفل", "Cow — arch spine down",
        stick([(200,90,200,145),(200,145,170,180),(200,145,230,180)], [(200,90),(200,145),(170,180),(230,180)]) +
        '<path d="M170 180 Q200 215 230 180" stroke="#00E5A0" stroke-width="5" fill="none"/>'),
    "pelvic-tilt-1": ("① استلقي على ظهرك — ثني الركبتين", "Lie on back — bend knees",
        stick([(120,200,280,200),(120,200,120,170),(280,200,280,170)], [(120,200),(280,200),(120,170),(280,170)]) +
        '<ellipse cx="200" cy="200" rx="90" ry="18" stroke="#00E5A0" stroke-width="3" fill="none"/>'),
    "pelvic-tilt-2": ("② اضغطي أسفل الظهر للأرض", "Press lower back to floor",
        stick([(120,205,280,205),(120,205,120,175),(280,205,280,175)], [(120,205),(280,205)]) +
        '<path d="M130 195 L270 195" stroke="#FF4D6A" stroke-width="3" stroke-dasharray="6 4"/><text x="200" y="188" text-anchor="middle" fill="#FF4D6A" font-size="12" font-family="Arial">↓ اضغطي هنا</text>'),
    "pelvic-tilt-3": ("③ ثبّتي 5 ثوانٍ ثم ارتاحي", "Hold 5 seconds — release",
        stick([(120,200,280,200),(120,200,120,170),(280,200,280,170)], [(120,200),(280,200)]) +
        '<text x="200" y="150" text-anchor="middle" fill="#00E5A0" font-size="28" font-weight="700" font-family="Arial">5 ث</text>'),
    "bird-dog-1": ("① على اليدين والركبتين — ظهر مستقيم", "All fours — flat back",
        stick([(200,95,200,145),(200,145,165,175),(200,145,235,175)], [(200,95),(200,145),(165,175),(235,175)]) +
        '<line x1="165" y1="175" x2="235" y2="175" stroke="#00E5A0" stroke-width="4"/>'),
    "bird-dog-2": ("② مدّي يد يمين + رجل يسار", "Extend opposite arm and leg",
        stick([(200,95,200,145),(200,145,235,175)], [(200,95),(200,145),(235,175)]) +
        '<line x1="200" y1="145" x2="130" y2="100" stroke="#00E5A0" stroke-width="5"/><circle cx="130" cy="100" r="7" fill="#00E5A0"/>' +
        '<line x1="235" y1="175" x2="250" y2="220" stroke="#00E5A0" stroke-width="5"/><circle cx="250" cy="220" r="7" fill="#00E5A0"/>'),
    "bird-dog-3": ("③ ثبّتي 5 ثوانٍ — بدّلي الجانب", "Hold 5s — switch sides",
        stick([(200,95,200,145),(200,145,165,175),(200,145,235,175)], [(200,95),(200,145)]) +
        '<line x1="200" y1="145" x2="270" y2="100" stroke="#00E5A0" stroke-width="5"/><line x1="165" y1="175" x2="150" y2="220" stroke="#00E5A0" stroke-width="5"/>'),
    "knee-raise-1": ("① استلقي — رجل واحدة ممدودة", "Lie down — one leg straight",
        stick([(110,200,290,200),(290,200,290,160)], [(110,200),(290,200),(290,160)]) +
        '<line x1="110" y1="200" x2="80" y2="200" stroke="#00E5A0" stroke-width="5"/>'),
    "knee-raise-2": ("② ارفعي الرجل 15–20 سم", "Raise leg 6 inches",
        stick([(110,200,290,200)], [(110,200),(290,200)]) +
        '<line x1="290" y1="200" x2="290" y2="155" stroke="#00E5A0" stroke-width="5"/><circle cx="290" cy="155" r="7" fill="#00E5A0"/>' +
        '<path d="M305 200 L305 155" stroke="#FFB020" stroke-width="2" marker-end="url(#a)"/><text x="318" y="178" fill="#FFB020" font-size="11" font-family="Arial">↑</text>'),
    "knee-raise-3": ("③ ركبة مستقيمة — لا تثني", "Keep knee straight",
        stick([(290,200,290,155)], [(290,200),(290,155)]) +
        '<text x="200" y="130" text-anchor="middle" fill="#00E5A0" font-size="13" font-family="Arial">الركبة مستقيمة ✓</text>'),
    "heel-slide-1": ("① استلقي — ركبتك مثنية", "Lie down — knee bent",
        stick([(120,200,220,200),(220,200,220,160)], [(120,200),(220,200),(220,160)])),
    "heel-slide-2": ("② اسحبي الكعب نحو الأرداف", "Slide heel toward glutes",
        stick([(120,200,200,200),(200,200,200,165)], [(120,200),(200,200),(200,165)]) +
        '<path d="M120 210 Q160 230 200 210" stroke="#FFB020" stroke-width="3" fill="none" stroke-dasharray="5 3"/><text x="160" y="245" fill="#FFB020" font-size="12" font-family="Arial">← اسحبي</text>'),
    "heel-slide-3": ("③ أبقي القدم على الأرض", "Keep foot on floor",
        stick([(120,200,220,200)], [(120,200),(220,200)]) +
        '<ellipse cx="120" cy="208" rx="14" ry="8" stroke="#00E5A0" stroke-width="3" fill="none"/>'),
    "quad-set-1": ("① مدّي رجلتك — ركبة مستقيمة", "Straighten leg",
        stick([(100,200,300,200)], [(100,200),(300,200),(250,200)])),
    "quad-set-2": ("② اضغطي الركبة للأسفل", "Press knee down",
        stick([(100,200,300,200)], [(250,200)]) +
        '<path d="M250 185 L250 215" stroke="#FF4D6A" stroke-width="3"/><text x="265" y="205" fill="#FF4D6A" font-size="12" font-family="Arial">↓</text>'),
    "quad-set-3": ("③ شدّي الفخذ — ثبّتي 5 ثوانٍ", "Tighten thigh — hold 5s",
        stick([(100,200,300,200)], [(100,200),(300,200)]) +
        '<text x="200" y="160" text-anchor="middle" fill="#00E5A0" font-size="26" font-weight="700" font-family="Arial">5 ث</text>'),
}

for name, (ar, en, body) in steps.items():
    (OUT / f"{name}.svg").write_text(svg(ar, en, body))
    print("wrote", name)

python3 /Users/roaa/Desktop/bro.ajlan/exercises/generate-steps.py
