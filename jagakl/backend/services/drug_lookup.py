import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "drugs.json"
_index: dict[str, dict] = {}

_COVERED = (
    "Metformin · Glibenclamide · Gliclazide · Insulin NPH · Amlodipine · "
    "Atenolol · Losartan · Enalapril · Hydrochlorothiazide · Simvastatin · "
    "Atorvastatin · Aspirin · Warfarin · Salbutamol · Budesonide · "
    "Omeprazole · Metoprolol · Furosemide · Spironolactone · Prednisolone"
)


def _build_index() -> None:
    with open(_DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    for drug in data["drugs"]:
        _index[drug["generic_name"].lower()] = drug
        for brand in drug.get("brand_names", []):
            key = brand.lower()
            if key not in _index:
                _index[key] = drug


_build_index()


def lookup_drug(text: str, language: str = "en") -> str:
    drug = _find_drug(text)
    if drug:
        return _format_card(drug, language)
    return _not_found_reply(text, language)


def _find_drug(text: str) -> dict | None:
    _PUNCT = ".,;:!?()"
    if (token := text.strip(_PUNCT).lower()) in _index:
        return _index[token]
    for word in text.split():
        if (token := word.strip(_PUNCT).lower()) in _index:
            return _index[token]
    return None


def _format_card(drug: dict, language: str) -> str:
    brands = ", ".join(drug.get("brand_names", [])[:3])
    header = f"*{drug['generic_name']}*" + (f" ({brands})" if brands else "")

    side_effects = drug.get("side_effects", [])
    se = ", ".join(side_effects[:2]) if side_effects else "see package insert"

    red_flags = drug.get("red_flag_symptoms", [])
    rf = red_flags[0] if red_flags else "any unusual symptoms"

    translations = drug.get("translations", {})
    lang = language if language in translations else "en"
    translation_line = translations.get(lang, "")

    card = (
        f"{header}\n"
        f"Class: {drug['drug_class']}\n"
        f"Dose: {drug['common_dose']} | {drug['frequency']}\n"
        f"\n"
        f"🍽 {drug['food_instructions']}\n"
        f"\n"
        f"⚠️ Common side-effects: {se}\n"
        f"\n"
        f"🚨 See a doctor immediately if: {rf}"
    )
    if translation_line:
        card += f"\n\n{translation_line}"
    return card


def _not_found_reply(name: str, language: str) -> str:
    if language == "ms":
        return (
            f"Maaf, saya tiada maklumat tentang \"{name}\" buat masa ini.\n\n"
            f"Saya merangkumi:\n{_COVERED}\n\n"
            "Sila taip nama generik yang tepat, atau tanya ahli farmasi anda."
        )
    elif language == "zh":
        return (
            f"抱歉，我目前没有关于\"{name}\"的资料。\n\n"
            f"我目前涵盖的药物：\n{_COVERED}\n\n"
            "请输入准确的通用药物名称，或向您的药剂师咨询。"
        )
    return (
        f"I don't have info on \"{name}\" yet.\n\n"
        f"I currently cover:\n{_COVERED}\n\n"
        "Please type the exact generic name, or ask your pharmacist."
    )
