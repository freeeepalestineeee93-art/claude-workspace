"""بناء بيانات الخرائط من Natural Earth (ملكية عامة): دول + محافظات (بأسماء عربية) + مدن + أنهار.
python tools/geo-build.py   (بينزّل الخام إذا مش موجود)"""
import json, pathlib, subprocess
import shapefile

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/geo/raw"
OUT = ROOT / "assets/geo"
SETS = ["50m/cultural/ne_50m_admin_0_countries", "10m/cultural/ne_10m_admin_0_countries", "10m/cultural/ne_10m_admin_1_states_provinces",
        "10m/cultural/ne_10m_populated_places_simple", "10m/physical/ne_10m_rivers_lake_centerlines", "50m/physical/ne_50m_lakes"]


def fetch():
    RAW.mkdir(parents=True, exist_ok=True)
    for s in SETS:
        name = s.split("/")[-1]
        if (RAW / f"{name}.shp").exists():
            continue
        z = RAW / "x.zip"
        subprocess.run(["curl", "-s", "-m", "300", "-o", str(z), f"https://naciscdn.org/naturalearth/{s}.zip"], check=True)
        subprocess.run(["unzip", "-o", "-q", str(z), "*.shp", "*.dbf", "*.shx", "-d", str(RAW)], check=True)
        z.unlink()


def rnd(coords, p):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], p), round(coords[1], p)]
    return [rnd(c, p) for c in coords]


def features(name, props, p=3, filt=None):
    r = shapefile.Reader(str(RAW / name), encoding="utf-8", encodingErrors="replace")
    out = []
    for sr in r.iterShapeRecords():
        rec = sr.record.as_dict()
        if filt and not filt(rec):
            continue
        g = sr.shape.__geo_interface__
        out.append({"type": "Feature", "properties": {k: rec.get(v) for k, v in props.items()}, "geometry": {"type": g["type"], "coordinates": rnd(g["coordinates"], p)}})
    return out


def write(path, feats):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")))
    print(f"{path.relative_to(ROOT)}  {len(feats)}  {path.stat().st_size // 1024}KB")


def main():
    fetch()
    cp = {"id": "ADM0_A3", "iso": "ISO_A3", "name": "NAME", "ar": "NAME_AR", "continent": "CONTINENT", "pop": "POP_EST"}
    write(OUT / "countries-110.json", features("ne_50m_admin_0_countries", cp, 2))
    write(OUT / "countries.json", features("ne_10m_admin_0_countries", cp, 3))
    a1 = features("ne_10m_admin_1_states_provinces", {"id": "iso_3166_2", "country": "adm0_a3", "name": "name_en", "ar": "name_ar", "type": "type_en"}, 3)
    by = {}
    for f in a1:
        by.setdefault(f["properties"]["country"], []).append(f)
    for c, fs in by.items():
        write(OUT / "admin1" / f"{c}.json", fs)
    write(OUT / "places.json", features("ne_10m_populated_places_simple", {"name": "name", "country": "adm0_a3", "pop": "pop_max", "rank": "scalerank", "capital": "adm0cap"}, 3))
    write(OUT / "rivers.json", features("ne_10m_rivers_lake_centerlines", {"name": "name", "rank": "scalerank"}, 3))
    write(OUT / "lakes.json", features("ne_50m_lakes", {"name": "name"}, 3))


if __name__ == "__main__":
    main()
