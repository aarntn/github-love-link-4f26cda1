import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from services.drug_lookup import lookup_drug


# --- Generic name match ---

def test_generic_exact():
    card = lookup_drug("Metformin", "en")
    assert card.startswith("*Metformin*")

def test_generic_case_insensitive():
    card = lookup_drug("WARFARIN", "en")
    assert "*Warfarin*" in card

def test_generic_lowercase():
    card = lookup_drug("prednisolone", "en")
    assert "*Prednisolone*" in card

def test_generic_aspirin():
    card = lookup_drug("aspirin", "en")
    assert "*Aspirin*" in card


# --- Brand name match ---

def test_brand_glucophage():
    card = lookup_drug("Glucophage", "en")
    assert "*Metformin*" in card

def test_brand_norvasc_case_insensitive():
    card = lookup_drug("norvasc", "en")
    assert "*Amlodipine*" in card

def test_brand_ventolin():
    card = lookup_drug("Ventolin", "en")
    assert "*Salbutamol*" in card

def test_brand_lasix():
    card = lookup_drug("Lasix", "en")
    assert "*Furosemide*" in card

def test_brand_pulmicort():
    card = lookup_drug("Pulmicort", "en")
    assert "*Budesonide*" in card


# --- Multi-word input ---

def test_multiword_finds_drug():
    card = lookup_drug("take metformin daily", "en")
    assert "*Metformin*" in card

def test_multiword_with_punctuation():
    card = lookup_drug("Metformin.", "en")
    assert "*Metformin*" in card


# --- Language ---

def test_language_ms():
    card = lookup_drug("Metformin", "ms")
    # Malay translation line from drugs.json must appear
    assert "JANGAN" in card or "Makan" in card

def test_language_ta():
    card = lookup_drug("Amlodipine", "ta")
    # Tamil translation line
    assert "தினமும்" in card or "சாப்பிட" in card

def test_language_fallback_unknown():
    # Unknown language code must not crash, falls back to English
    card = lookup_drug("Metformin", "xx")
    assert "*Metformin*" in card
    assert "Take with food" in card


# --- Card structure ---

def test_card_has_dose():
    card = lookup_drug("Warfarin", "en")
    assert "Dose:" in card

def test_card_has_food_instruction():
    card = lookup_drug("Warfarin", "en")
    assert "🍽" in card

def test_card_has_side_effects():
    card = lookup_drug("Warfarin", "en")
    assert "⚠️" in card

def test_card_has_red_flag():
    card = lookup_drug("Warfarin", "en")
    assert "🚨" in card


# --- Not found ---

def test_not_found_english():
    reply = lookup_drug("Panadol", "en")
    assert "don't have info" in reply
    assert "Metformin" in reply  # covered drug list present

def test_not_found_malay():
    reply = lookup_drug("Panadol", "ms")
    assert "Maaf" in reply or "tiada" in reply
    assert "Metformin" in reply

def test_not_found_zh():
    reply = lookup_drug("Panadol", "zh")
    assert "抱歉" in reply
    assert "Metformin" in reply
