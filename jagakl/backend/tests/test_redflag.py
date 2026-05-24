import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.redflag import check_redflag


# --- CHEST_PAIN ---

def test_chest_pain_english():
    r = check_redflag("I have chest pain and I'm sweating")
    assert r is not None and r["triggered"] and r["category"] == "CHEST_PAIN"


def test_chest_pain_malay():
    r = check_redflag("Saya ada sakit dada teruk")
    assert r is not None and r["category"] == "CHEST_PAIN"


def test_heart_attack_english():
    r = check_redflag("I think I'm having a heart attack right now")
    assert r is not None and r["category"] == "CHEST_PAIN"


def test_sesak_dada():
    r = check_redflag("sesak dada tak boleh tahan")
    assert r is not None and r["category"] == "CHEST_PAIN"


# --- STROKE ---

def test_stroke_slurred_speech():
    r = check_redflag("My father has slurred speech suddenly")
    assert r is not None and r["category"] == "STROKE"


def test_stroke_face_drooping():
    r = check_redflag("Her face is drooping and arm is weak")
    assert r is not None and r["category"] == "STROKE"


def test_stroke_malay():
    r = check_redflag("Muka dia senget tak boleh cakap")
    assert r is not None and r["category"] == "STROKE"


# --- BREATHING ---

def test_breathing_cant_breathe():
    r = check_redflag("I can't breathe, please help")
    assert r is not None and r["category"] == "BREATHING"


def test_breathing_malay():
    r = check_redflag("Saya tak boleh bernafas")
    assert r is not None and r["category"] == "BREATHING"


def test_sesak_nafas():
    r = check_redflag("Sesak nafas teruk sangat")
    assert r is not None and r["category"] == "BREATHING"


# --- SEVERE_BLEEDING ---

def test_heavy_bleeding():
    r = check_redflag("There is heavy bleeding from the wound")
    assert r is not None and r["category"] == "SEVERE_BLEEDING"


def test_bleeding_malay():
    r = check_redflag("darah banyak keluar tak berhenti")
    assert r is not None and r["category"] == "SEVERE_BLEEDING"


# --- UNCONSCIOUS ---

def test_unconscious_english():
    r = check_redflag("He is unconscious on the floor")
    assert r is not None and r["category"] == "UNCONSCIOUS"


def test_unconscious_malay():
    r = check_redflag("Dia pengsan tak sedarkan diri")
    assert r is not None and r["category"] == "UNCONSCIOUS"


# --- SUICIDAL ---

def test_suicidal_want_to_die():
    r = check_redflag("I want to die, there's no reason to live")
    assert r is not None and r["category"] == "SUICIDAL"
    assert "Befrienders" in r["reply_en"]
    assert "03-7627 2929" in r["reply_en"]


def test_suicidal_malay():
    r = check_redflag("Saya nak mati tak nak hidup lagi")
    assert r is not None and r["category"] == "SUICIDAL"
    assert "Befrienders" in r["reply_ms"]


def test_bunuh_diri():
    r = check_redflag("saya nak bunuh diri malam ni")
    assert r is not None and r["category"] == "SUICIDAL"


# --- CHILD_DANGER ---

def test_child_not_breathing():
    r = check_redflag("child not breathing please help me")
    assert r is not None and r["category"] == "CHILD_DANGER"


def test_baby_fits():
    r = check_redflag("My baby is having baby fits please")
    assert r is not None and r["category"] == "CHILD_DANGER"


def test_baby_kejang():
    r = check_redflag("baby kejang tak berhenti")
    assert r is not None and r["category"] == "CHILD_DANGER"


# --- NEGATIVE CASES ---

def test_no_flag_normal_fever():
    r = check_redflag("I have fever for 2 days and headache")
    assert r is None


def test_no_flag_cough():
    r = check_redflag("I have a cough for 3 weeks")
    assert r is None


def test_no_flag_medication_question():
    r = check_redflag("What time should I take my Metformin?")
    assert r is None


# --- REPLY STRUCTURE ---

def test_reply_has_all_fields():
    r = check_redflag("chest pain")
    assert r is not None
    assert all(k in r for k in ["triggered", "category", "reply_en", "reply_ms"])
    assert r["triggered"] is True


def test_suicidal_reply_has_befrienders_number():
    r = check_redflag("kill myself")
    assert r is not None
    assert "03-7627 2929" in r["reply_en"]
    assert "03-7627 2929" in r["reply_ms"]
