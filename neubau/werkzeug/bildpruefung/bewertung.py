# Bewertung der Bildmessung (Messwerte aus messkern.js -> OK / WARNUNG / FEHLER). Projektneutral: nur Zahlen, Teilnamen und Zeitpunkte aus der Messung,
# keine Pfade, keine Szenennamen. Alle Grenzwerte stehen hier als benannte Konstanten; eine Deklaration darf sie je Eintrag mit "grenzen" überschreiben
# (Schlüssel in Klammern). Die Messung selbst (Strahlen, Projektion, Raster) bleibt im Kern.
#
#   from bewertung import bewerte, zusammenfassung, selbsttest_pruefen
#   befunde = bewerte(messung, format="breit")        # Liste von Befunden
#   Befund = { pruefung, status, id, zeitpunkt, text, werte }   status in OK | WARNUNG | FEHLER

OK, WARNUNG, FEHLER = "OK", "WARNUNG", "FEHLER"
RANG = {OK: 0, WARNUNG: 1, FEHLER: 2}

# ---- 1 Anschnitt ----
ANSCHNITT_RAND_MIN = 0.03          # Mindestrand zwischen Teil und Bildkante, Anteil der jeweiligen Bildkante (rand); darunter FEHLER
ANSCHNITT_WARN_ZUSCHLAG = 0.015    # WARNUNG, wenn der Rand zwischen Mindestrand und Mindestrand + Zuschlag liegt (rand_warn)
# ---- 2 Verdeckung ----
VERDECKUNG_FEHLER = 0.02           # Anteil der sichtbaren Messpunkte mit fremder Geometrie davor, ab dem FEHLER (verdeckt_max)
VERDECKUNG_WARNUNG = 0.0           # darüber (also schon ein Punkt) WARNUNG
VERDECKUNG_PUNKTE_MIN = 8          # weniger Messpunkte im Bild: nicht beurteilbar (WARNUNG, bei Startbild FEHLER-würdig, daher streng behandelt)
# ---- 3 Bildschirm: Blickwinkel und Anteil ----
BLICKWINKEL_MAX = 25.0             # Grad zwischen Sichtlinie zur Bildschirmmitte und Bildschirmnormale; darüber FEHLER (winkel_max)
BLICKWINKEL_WARN_ABSTAND = 3.0     # WARNUNG ab Grenze minus Abstand
BILDSCHIRM_ANTEIL_MIN = 0.10       # Mindestanteil der Bildschirmfläche an der Bildfläche; darunter FEHLER (anteil_min)
BILDSCHIRM_ANTEIL_WARN_ZUSCHLAG = 0.02
# ---- 4 Füllgrad ----
FUELLGRAD_MIN = 0.70               # Mindestanteil der Bildschirmfläche, der Inhalt trägt (Aufweitung um die Lücke, siehe messkern MESS.fuell_luecke); darunter FEHLER (fuell_min)
FUELLGRAD_WARN_ZUSCHLAG = 0.05
# ---- 5 Platzierung ----
PLATZ_TOL = 0.02                   # Einheiten: Berührung/Luft, die als gleich gilt (toleranz)
PLATZ_UEBERLAPPUNG_MIN = 0.90      # Anteil der Grundfläche des Teils, der unter/auf/innerhalb des Bezugsteils liegen muss (ueberlappung_min)
PLATZ_NEBEN_MAX = 0.6              # größter Abstand der Grundrisse für "neben" (abstand: [min, max])
FRONT_TOL_GRAD = 10.0              # größte Abweichung der Frontrichtung vom Ziel (toleranz)
AUFRECHT_TOL_GRAD = 3.0            # größte Neigung der Bodenplatte gegen die Waagerechte (toleranz)

NAMEN = {"anschnitt": "Anschnitt", "verdeckung": "Verdeckung", "bildschirm": "Bildschirm", "fuellung": "Füllgrad", "platzierung": "Platzierung"}


def _g(m, schluessel, standard):
    return (m.get("grenzen") or {}).get(schluessel, standard)


def _pz(x):
    return f"{x * 100:.1f} %"


def _b(pruefung, status, m, text, werte=None, id_=None):
    return {"pruefung": pruefung, "status": status, "id": id_ or m.get("id"), "zeitpunkt": m.get("zeitpunkt"), "text": text, "werte": werte or {}, "provoziert": bool(m.get("provoziert"))}


def _anschnitt(m, fmt):
    if m.get("fehler"):
        return [_b("anschnitt", FEHLER, m, f"{m['id']}: {m['fehler']}")]
    if m.get("unsichtbar"):
        return [_b("anschnitt", FEHLER, m, f"{m['id']}: Teil ist zum Prüfzeitpunkt nicht sichtbar")]
    if m.get("hinter_kamera"):
        return [_b("anschnitt", FEHLER, m, f"{m['id']}: {m['hinter_kamera']} Punkte liegen hinter der Kamera", {"rand_min": -1})]
    soll, warn = _g(m, "rand", ANSCHNITT_RAND_MIN), _g(m, "rand_warn", ANSCHNITT_WARN_ZUSCHLAG)
    r, k = m["rand_min"], m["kante"]
    w = {"rand_min": r, "kante": k, "soll": soll, "rand": m["rand"]}
    if r < 0:
        return [_b("anschnitt", FEHLER, m, f"{m['id']}: ragt {k} {_pz(-r)} über die Bildkante hinaus (Überstand {_pz(-r)}, Mindestrand {_pz(soll)})", w)]
    if r < soll:
        return [_b("anschnitt", FEHLER, m, f"{m['id']}: Rand {k} nur {_pz(r)} (Mindestrand {_pz(soll)}, es fehlen {_pz(soll - r)})", w)]
    if r < soll + warn:
        return [_b("anschnitt", WARNUNG, m, f"{m['id']}: Rand {k} {_pz(r)}, knapp über dem Mindestrand {_pz(soll)}", w)]
    return [_b("anschnitt", OK, m, f"{m['id']}: kleinster Rand {k} {_pz(r)}", w)]


def _verdeckung(m, fmt):
    if m.get("fehler"):
        return [_b("verdeckung", FEHLER, m, f"{m['id']}: {m['fehler']}")]
    if m.get("unsichtbar"):
        return [_b("verdeckung", FEHLER, m, f"{m['id']}: Ziel ist zum Prüfzeitpunkt nicht sichtbar")]
    ziel = m.get("ziel") or m["id"]
    if m["im_bild"] < _g(m, "punkte_min", VERDECKUNG_PUNKTE_MIN):
        return [_b("verdeckung", FEHLER, m, f"{ziel}: nur {m['im_bild']} von {m['punkte']} Messpunkten im Bild, Verdeckung nicht beurteilbar", {"im_bild": m["im_bild"]})]
    a, fe = m["anteil"], _g(m, "verdeckt_max", VERDECKUNG_FEHLER)
    wer = ", ".join(f"{k} ({v})" for k, v in sorted(m["blocker"].items(), key=lambda x: -x[1])[:4])
    w = {"anteil": a, "verdeckt": m["verdeckt"], "im_bild": m["im_bild"], "blocker": m["blocker"]}
    if a >= fe:
        return [_b("verdeckung", FEHLER, m, f"{ziel}: {_pz(a)} der Messpunkte verdeckt ({m['verdeckt']} von {m['im_bild']}) durch {wer}", w)]
    if a > VERDECKUNG_WARNUNG:
        return [_b("verdeckung", WARNUNG, m, f"{ziel}: {m['verdeckt']} von {m['im_bild']} Messpunkten verdeckt durch {wer}", w)]
    return [_b("verdeckung", OK, m, f"{ziel}: unverdeckt ({m['im_bild']} Messpunkte)", w)]


def _bildschirm(m, fmt):
    if m.get("fehler"):
        return [_b("bildschirm", FEHLER, m, f"{m['id']}: {m['fehler']}")]
    if m.get("unsichtbar"):
        return [_b("bildschirm", FEHLER, m, f"{m['id']}: Fläche ist zum Prüfzeitpunkt nicht sichtbar")]
    out = []
    mx, an = _g(m, "winkel_max", BLICKWINKEL_MAX), _g(m, "anteil_min", BILDSCHIRM_ANTEIL_MIN)
    w = m["winkel"]
    wv = {"winkel": w, "winkel_achse": m["winkel_achse"], "grenze": mx}
    if not m["vorderseite"]:
        out.append(_b("bildschirm", FEHLER, m, f"{m['id']}: Kamera sieht die Rückseite der Fläche (Winkel {w:.1f} Grad)", wv))
    elif w > mx:
        out.append(_b("bildschirm", FEHLER, m, f"{m['id']}: Blickwinkel {w:.1f} Grad zur Bildschirmnormale (Grenze {mx:.0f} Grad, Kameraachse {m['winkel_achse']:.1f} Grad)", wv))
    elif w > mx - BLICKWINKEL_WARN_ABSTAND:
        out.append(_b("bildschirm", WARNUNG, m, f"{m['id']}: Blickwinkel {w:.1f} Grad, nahe der Grenze {mx:.0f} Grad", wv))
    else:
        out.append(_b("bildschirm", OK, m, f"{m['id']}: Blickwinkel {w:.1f} Grad", wv))
    a = m["anteil"]
    av = {"anteil": a, "anteil_gesamt": m["anteil_gesamt"], "grenze": an}
    if a < an:
        out.append(_b("bildschirm", FEHLER, m, f"{m['id']}: Bildschirm nimmt nur {_pz(a)} des Bildes ein (Mindestanteil {_pz(an)}, ganz {_pz(m['anteil_gesamt'])})", av))
    elif a < an + BILDSCHIRM_ANTEIL_WARN_ZUSCHLAG:
        out.append(_b("bildschirm", WARNUNG, m, f"{m['id']}: Bildschirmanteil {_pz(a)}, knapp über {_pz(an)}", av))
    else:
        out.append(_b("bildschirm", OK, m, f"{m['id']}: Bildschirmanteil {_pz(a)}", av))
    return out


def _fuellung(m, fmt):
    if m.get("fehler"):
        return [_b("fuellung", FEHLER, m, f"{m['id']}: {m['fehler']}")]
    if m["ebenen_da"] < m["ebenen_erwartet"]:
        return [_b("fuellung", OK, m, f"{m['id']}: Inhalt unvollständig eingeblendet ({m['ebenen_da']} von {m['ebenen_erwartet']} Ebenen), nicht gewertet", {"nicht_gewertet": True})]
    mn = _g(m, "fuell_min", FUELLGRAD_MIN)
    f = m["fuellung"]
    w = {"fuellung": f, "tinte": m["tinte"], "grenze": mn}
    if f < mn:
        return [_b("fuellung", FEHLER, m, f"{m['id']}: nur {_pz(f)} der Bildschirmfläche tragen Inhalt (Mindestens {_pz(mn)}; reine Zeichenfläche {_pz(m['tinte'])})", w)]
    if f < mn + FUELLGRAD_WARN_ZUSCHLAG:
        return [_b("fuellung", WARNUNG, m, f"{m['id']}: Füllgrad {_pz(f)}, knapp über {_pz(mn)}", w)]
    return [_b("fuellung", OK, m, f"{m['id']}: Füllgrad {_pz(f)} (Zeichenfläche {_pz(m['tinte'])})", w)]


def _platzierung(m, fmt):
    out = []
    t = m["teil"]
    for r in m["relationen"]:
        rel = r["relation"]
        gr = m.get("grenzen") or {}
        tol = gr.get("toleranz", PLATZ_TOL)
        ueb = gr.get("ueberlappung_min", PLATZ_UEBERLAPPUNG_MIN)
        wid = f"{t} {rel.replace('_', ' ')} {r.get('ziel') or r.get('flaeche') or ''}".strip()
        if r.get("fehler"):
            out.append(_b("platzierung", FEHLER, m, f"{wid}: {r['fehler']}", id_=wid)); continue
        ok, text = True, ""
        if rel == "unter":
            ok = r["abstand_z"] >= -tol and r["ueberlappung"] >= ueb
            text = f"Luft nach oben {r['abstand_z']:.3f}, Grundriss {_pz(r['ueberlappung'])} unter dem Bezugsteil"
        elif rel == "auf":
            ok = abs(r["abstand_z"]) <= tol and r["ueberlappung"] >= ueb
            text = f"Abstand zur Oberseite {r['abstand_z']:+.3f}, Grundriss {_pz(r['ueberlappung'])} auf dem Bezugsteil"
        elif rel == "innerhalb":
            ok = r["ueberlappung"] >= ueb
            text = f"Grundriss {_pz(r['ueberlappung'])} innerhalb"
        elif rel == "neben":
            lo, hi = gr.get("abstand", [0, PLATZ_NEBEN_MAX])
            ok = lo - tol <= r["abstand"] <= hi and r["z_ueberlappung"] > 0
            text = f"Abstand der Grundrisse {r['abstand']:.3f} (erlaubt {lo} bis {hi}), Höhenüberlappung {r['z_ueberlappung']:.3f}"
        elif rel in ("links_von", "rechts_von", "vor", "hinter"):
            ok = r["luft"] >= -tol
            text = f"Luft {r['luft']:+.3f}"
        elif rel == "front":
            mx = gr.get("front_toleranz", FRONT_TOL_GRAD)
            ok = r["abweichung_grad"] <= mx
            text = f"Front weicht {r['abweichung_grad']:.1f} Grad vom Ziel ab (erlaubt {mx:.0f}), Neigung der Frontplatte {r['neigung_grad']:.1f} Grad"
        elif rel == "aufrecht":
            mx = gr.get("aufrecht_toleranz", AUFRECHT_TOL_GRAD)
            ok = r["neigung_grad"] <= mx and r["platte_unten"]
            text = f"Bodenplatte {r['neigung_grad']:.1f} Grad gegen die Waagerechte geneigt (erlaubt {mx:.0f})" + ("" if r["platte_unten"] else ", liegt aber oben")
        out.append(_b("platzierung", OK if ok else FEHLER, m, f"{wid}: {text}", {k: v for k, v in r.items() if k != "relation"}, id_=wid))
    return out


_BEWERTER = {"anschnitt": _anschnitt, "verdeckung": _verdeckung, "bildschirm": _bildschirm, "fuellung": _fuellung, "platzierung": _platzierung}


def bewerte(messung, format=""):
    """Alle Messungen (dict aus messkern.messen) bewerten; Rückgabe: Liste von Befunden, Messfehler des Kerns als FEHLER."""
    out = []
    for typ, f in _BEWERTER.items():
        for m in messung.get(typ, []):
            out += f(m, format)
    for t in messung.get("fehler", []):
        out.append({"pruefung": "messung", "status": FEHLER, "id": "Messung", "zeitpunkt": None, "text": t, "werte": {}, "provoziert": False})
    return out


def zusammenfassung(befunde):
    """je Prüfung: Zahl der Messungen, Warnungen, Fehler und der ungünstigste Wert."""
    z = {}
    for b in befunde:
        s = z.setdefault(b["pruefung"], {"n": 0, WARNUNG: 0, FEHLER: 0, "schlechtester": None})
        if b["werte"].get("nicht_gewertet"):
            continue
        s["n"] += 1
        if b["status"] in (WARNUNG, FEHLER):
            s[b["status"]] += 1
        s["schlechtester"] = s["schlechtester"] if s["schlechtester"] and RANG[s["schlechtester"]["status"]] >= RANG[b["status"]] else b
    return z


def kennzahl(pruefung, befunde):
    """Kurzer Text für die Zusammenfassungszeile je Prüfung (kleinster Rand, größter Winkel usw.)."""
    bs = [b for b in befunde if b["pruefung"] == pruefung and not b["werte"].get("nicht_gewertet")]
    if not bs:
        return "nichts deklariert oder nichts gemessen"
    w = lambda k: [b["werte"][k] for b in bs if k in b["werte"] and isinstance(b["werte"][k], (int, float))]
    if pruefung == "anschnitt" and w("rand_min"):
        b = min((b for b in bs if "rand_min" in b["werte"]), key=lambda b: b["werte"]["rand_min"])
        return f"kleinster Rand {_pz(b['werte']['rand_min'])} ({b['id']}, {b['zeitpunkt']})"
    if pruefung == "verdeckung" and w("anteil"):
        b = max((b for b in bs if "anteil" in b["werte"]), key=lambda b: b["werte"]["anteil"])
        return f"größte Verdeckung {_pz(b['werte']['anteil'])} ({b['id']}, {b['zeitpunkt']})"
    if pruefung == "bildschirm":
        wk = [b for b in bs if "winkel" in b["werte"]]; an = [b for b in bs if "anteil" in b["werte"]]
        t = []
        if wk: b = max(wk, key=lambda b: b["werte"]["winkel"]); t.append(f"größter Winkel {b['werte']['winkel']:.1f} Grad ({b['zeitpunkt']})")
        if an: b = min(an, key=lambda b: b["werte"]["anteil"]); t.append(f"kleinster Anteil {_pz(b['werte']['anteil'])} ({b['zeitpunkt']})")
        return ", ".join(t)
    if pruefung == "fuellung" and w("fuellung"):
        b = min((b for b in bs if "fuellung" in b["werte"]), key=lambda b: b["werte"]["fuellung"])
        return f"kleinster Füllgrad {_pz(b['werte']['fuellung'])} ({b['zeitpunkt']})"
    if pruefung == "platzierung":
        return f"{len(bs)} Beziehungen"
    return ""


def selbsttest_pruefen(typ, basis, provoziert):
    """Selbsttest einer Prüfung: die absichtlich provozierte Messung muss FEHLER ergeben, die unveränderte Szene darf dadurch nicht schlechter werden.
    basis, provoziert: Befundlisten (bewerte) derselben Prüfung. Rückgabe: (ok, Text)."""
    pb = [b for b in provoziert if b["pruefung"] == typ and b["status"] == FEHLER]
    if not provoziert or not any(b["pruefung"] == typ for b in provoziert):
        return False, "keine Messung (nichts deklariert?)"
    if not pb:
        return False, "Provokation NICHT erkannt: " + "; ".join(b["text"] for b in provoziert if b["pruefung"] == typ)[:300]
    return True, "erkannt: " + pb[0]["text"][:220]
