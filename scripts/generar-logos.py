#!/usr/bin/env python3
"""
Genera propuestas de logo para DondePelotear con google/gemini-2.5-flash-image.

Uso:
  export OPENROUTER_API_KEY="..."      # https://openrouter.ai/keys  (≈ $0.039 por imagen)
  # o bien:  export GEMINI_API_KEY="..."   # https://aistudio.google.com/apikey
  python3 scripts/generar-logos.py

Las imágenes se guardan en assets/logo-propuestas/. Solo usa la librería estándar (sin pip).
"""
import base64, json, os, sys, urllib.request, pathlib, re

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "logo-propuestas"
OUT.mkdir(parents=True, exist_ok=True)

MARCA = (
    "Brand name: 'DondePelotear' (Peruvian football pitch booking app; 'pelotear' is slang for 'to kick a ball around / play football', "
    "so the name means 'where to play football'). "
    "Brand colors: grass green #16a34a and dark green #0f5a2c, energetic orange #f97316, yellow #f5b301. "
    "Flat vector style, clean shapes, no gradients, no photo, no mockup, no watermark. "
    "Plain white background. The wordmark must read exactly 'DondePelotear' with correct spelling, "
    "with 'Donde' in dark green and 'Pelotear' in orange. "
    "Professional logo suitable for an app icon and a website header. Square composition, centered."
)

PROPUESTAS = {
    "1-arco-y-balon": (
        "Logo concept: a rounded-square app badge with a football goal (white posts and net) on green grass "
        "and a classic black-and-white football in front, wordmark below the badge. Bold friendly sans-serif type."
    ),
    "2-pin-cancha": (
        "Logo concept: a map location pin whose head is a top-down football pitch (center circle and halfway line), "
        "meaning 'find a pitch near you'. Wordmark to the right of the pin in a bold rounded typeface."
    ),
    "3-balon-dinamico": (
        "Logo concept: a football with motion lines kicked into the letters, the ball replacing the letter 'o' of "
        "'Donde' or of 'Pelotear'. Sporty, dynamic, slightly italic heavy display lettering with "
        "a subtle worn / stamped ink texture. Very high energy, street-football feel."
    ),
}


def openrouter(prompt, key):
    body = {
        "model": "google/gemini-2.5-flash-image",
        "messages": [{"role": "user", "content": prompt}],
        "modalities": ["image", "text"],
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "HTTP-Referer": "https://dondepelotear.pe", "X-Title": "DondePelotear logos"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.load(r)
    msg = data["choices"][0]["message"]
    for img in msg.get("images", []):
        url = img.get("image_url", {}).get("url", "")
        m = re.match(r"data:(image/\w+);base64,(.+)", url, re.S)
        if m:
            return m.group(1), base64.b64decode(m.group(2))
    raise RuntimeError("La respuesta no trajo imagen: " + json.dumps(data)[:500])


def gemini(prompt, key):
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}}
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.load(r)
    for part in data["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            return part["inlineData"]["mimeType"], base64.b64decode(part["inlineData"]["data"])
    raise RuntimeError("La respuesta no trajo imagen: " + json.dumps(data)[:500])


def main():
    if os.environ.get("OPENROUTER_API_KEY"):
        gen, key, via = openrouter, os.environ["OPENROUTER_API_KEY"], "OpenRouter"
    elif os.environ.get("GEMINI_API_KEY"):
        gen, key, via = gemini, os.environ["GEMINI_API_KEY"], "Google AI Studio"
    else:
        sys.exit("Falta la clave: exporta OPENROUTER_API_KEY o GEMINI_API_KEY antes de ejecutar.")
    print(f"Generando {len(PROPUESTAS)} propuestas vía {via}…")
    for nombre, concepto in PROPUESTAS.items():
        try:
            mime, data = gen(concepto + " " + MARCA, key)
        except Exception as e:  # seguir con las demás propuestas
            print(f"  ✗ {nombre}: {e}")
            continue
        ext = "png" if "png" in mime else ("jpg" if "jpe" in mime else mime.split("/")[-1])
        path = OUT / f"{nombre}.{ext}"
        path.write_bytes(data)
        print(f"  ✓ {path.relative_to(OUT.parent.parent)} ({len(data)//1024} KB)")


if __name__ == "__main__":
    main()
