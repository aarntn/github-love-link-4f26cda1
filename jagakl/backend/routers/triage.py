import json
import re
from pathlib import Path

from session import get_session, update_session, delete_session
from services.idengue import fetch_hotspot_status, is_dengue_warning_signs
from routers.referral import route_referral
from services.drug_lookup import lookup_drug
from services.llm import chat
from services.lang_detect import detect_language

_TB_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "tb_questions.json"
_PHQ_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "phq_questions.json"
_tb_data: dict | None = None
_phq_data: dict | None = None

_FORGET_KEYWORDS = [
    "forget me", "padam data", "delete my data", "hapus data",
    "lupa saya", "delete me", "remove my data",
]
_POSTCODE_RE = re.compile(r"\b([0-9]{5})\b")
_DAY_RE = re.compile(r"\b(\d{1,2})\b")
_GLUCOSE_RE = re.compile(
    r"(?:glucose|gula darah|blood sugar|sugar level|paras gula)\D{0,10}?(\d{1,2}\.?\d*)",
    re.IGNORECASE,
)
_BP_RE = re.compile(r"\b(\d{2,3})\s*/\s*(\d{2,3})\b")

_DENGUE_KW = ["demam", "fever", "panas badan", "suhu tinggi", "temperature"]
_TB_KW = [
    "batuk lama", "chronic cough", "cough 2 weeks", "cough 3 weeks",
    "night sweats", "peluh malam", "weight loss", "turun berat", "kahak darah",
]
_NCD_KW = [
    "ubat", "medication", "prescription", "ubat kencing manis",
    "diabetes", "darah tinggi", "blood pressure", "pil", "tablet",
    "insulin", "metformin", "gliclazide", "amlodipine",
]

_MYMINDA_KW = [
    "sad", "depressed", "depression", "anxiety", "anxious",
    "mental health", "stress", "hopeless", "lonely", "mood",
    "sedih", "tertekan", "kemurungan", "resah", "tekanan", "kesihatan mental",
]

_PHARMACY_KW = [
    "refill", "ubat habis", "ubat nak habis", "pharmacy", "farmasi",
    "kad pintar", "smart card", "ambil ubat", "collect medication",
    "ump", "ubat melalui pos", "medication running out",
]

_LOG_KW = [
    "glucose", "gula darah", "blood sugar", "sugar level", "paras gula",
    "my reading", "bacaan saya", "catat bacaan", "log reading",
    "daily log", "rekod", "summary", "ringkasan",
]

_LANG_MAP = {
    "1": "en", "english": "en",
    "2": "ms", "bahasa": "ms", "melayu": "ms", "bm": "ms",
    "3": "ta", "tamil": "ta",
    "4": "bn", "bangla": "bn",
    "5": "zh", "chinese": "zh", "mandarin": "zh",
}

_ONBOARDING_MSG = (
    "Welcome to *JagaKL* — your free health guide in KL.\n\n"
    "Choose your language / Pilih bahasa:\n"
    "1 - English\n"
    "2 - Bahasa Melayu\n"
    "3 - தமிழ் (Tamil)\n"
    "4 - বাংলা (Bangla)\n"
    "5 - 中文 (Chinese)\n\n"
    "_Type 'Forget me' anytime to delete all your data._"
)

_MODE_MSG: dict[str, str] = {
    "en": (
        "Are you:\n"
        "1 - Malaysian citizen (with MyKad / IC)\n"
        "2 - Without IC / migrant / refugee (anonymous — safe)\n\n"
        "_In anonymous mode, we NEVER share your data with MOH or Immigration._"
    ),
    "ms": (
        "Adakah anda:\n"
        "1 - Warganegara Malaysia (dengan MyKad / IC)\n"
        "2 - Tanpa IC / pekerja asing / pelarian (tanpa nama — selamat)\n\n"
        "_Dalam mod tanpa nama, kami TIDAK PERNAH berkongsi data anda dengan KKM atau Imigresen._"
    ),
    "ta": (
        "நீங்கள்:\n"
        "1 - மலேசிய குடிமகன் (MyKad / IC உடன்)\n"
        "2 - IC இல்லாமல் / குடியேறியவர் / அகதி (அநாமதேய — பாதுகாப்பானது)"
    ),
    "bn": (
        "আপনি কি:\n"
        "1 - মালয়েশিয়ার নাগরিক (MyKad / IC সহ)\n"
        "2 - IC ছাড়া / অভিবাসী / শরণার্থী (বেনামী — নিরাপদ)"
    ),
    "zh": (
        "您是：\n"
        "1 - 马来西亚公民（持有MyKad / IC）\n"
        "2 - 无IC / 外来务工者 / 难民（匿名 — 安全）\n\n"
        "_匿名模式下，我们绝不会与卫生部或移民局分享您的数据。_"
    ),
}

_TRIAGE_PROMPT: dict[str, str] = {
    "en": (
        "How can I help you today?\n\n"
        "Common topics:\n"
        "- *Fever / demam* — dengue risk check\n"
        "- *Cough 2+ weeks* — TB screen\n"
        "- *Medication help* — prescription guidance\n"
        "- *Feeling sad / stressed / anxious* — mental health check (MyMinda+)\n\n"
        "Just describe your symptoms or type a question."
    ),
    "ms": (
        "Apa yang boleh saya bantu hari ini?\n\n"
        "Topik biasa:\n"
        "- *Demam* — semakan risiko denggi\n"
        "- *Batuk 2+ minggu* — saringan TB\n"
        "- *Bantuan ubat* — panduan preskripsi\n"
        "- *Rasa sedih / tertekan / resah* — semakan kesihatan mental (MyMinda+)\n\n"
        "Ceritakan simptom anda atau taip soalan."
    ),
    "ta": (
        "இன்று நான் எப்படி உதவலாம்?\n\n"
        "- காய்ச்சல் — டெங்கு ஆபத்து சோதனை\n"
        "- 2+ வாரம் இருமல் — TB திரையிடல்\n"
        "- மருந்து உதவி — பரிந்துரை வழிகாட்டுதல்\n"
        "- மன அழுத்தம் / சோகம் — மனநல சோதனை (MyMinda+)"
    ),
    "bn": (
        "আজ আমি কীভাবে সাহায্য করতে পারি?\n\n"
        "- জ্বর — ডেঙ্গু ঝুঁকি পরীক্ষা\n"
        "- ২+ সপ্তাহ কাশি — TB স্ক্রিনিং\n"
        "- ওষুধের সাহায্য — প্রেসক্রিপশন গাইড\n"
        "- মন খারাপ / উদ্বিগ্ন — মানসিক স্বাস্থ্য পরীক্ষা (MyMinda+)"
    ),
    "zh": (
        "今天我能帮您什么？\n\n"
        "常见话题：\n"
        "- *发烧 / demam* — 骨痛热症风险检查\n"
        "- *咳嗽2周以上* — 肺结核筛查\n"
        "- *药物帮助* — 处方指导\n"
        "- *心情低落 / 焦虑 / 压力大* — 心理健康检查（MyMinda+）\n\n"
        "请描述您的症状或提问。"
    ),
}


def _load_tb_data() -> dict:
    global _tb_data
    if _tb_data is None:
        with open(_TB_DATA_PATH, encoding="utf-8") as f:
            _tb_data = json.load(f)
    return _tb_data


def _load_phq_data() -> dict:
    global _phq_data
    if _phq_data is None:
        with open(_PHQ_DATA_PATH, encoding="utf-8") as f:
            _phq_data = json.load(f)
    return _phq_data


def _parse_phq_answer(text: str) -> int | None:
    t = text.strip().lower()
    if t in ("0", "not at all", "never"):
        return 0
    if t in ("1", "several days", "sometimes"):
        return 1
    if t in ("2", "more than half", "more than half the days", "often"):
        return 2
    if t in ("3", "nearly every day", "always", "everyday", "every day"):
        return 3
    return None


def _parse_log_entry(text: str) -> list[tuple]:
    results: list[tuple] = []

    bp_match = _BP_RE.search(text)
    if bp_match:
        s, d = int(bp_match.group(1)), int(bp_match.group(2))
        if 60 <= s <= 250 and 40 <= d <= 150 and s > d:
            results.append(("bp", s, d))

    g_match = _GLUCOSE_RE.search(text)
    if g_match:
        raw = float(g_match.group(1))
        if raw > 30:
            raw = round(raw / 18.0, 1)
        if 1.0 <= raw <= 33.3:
            results.append(("glucose", raw))

    return results


def _detect_flow(text: str) -> str:
    lower = text.lower()
    if any(kw in lower for kw in _TB_KW):
        return "TB_FLOW"
    if any(kw in lower for kw in _MYMINDA_KW):
        return "MYMINDA_FLOW"
    if any(kw in lower for kw in _PHARMACY_KW):
        return "PHARMACY_FLOW"
    if any(kw in lower for kw in _LOG_KW) or _BP_RE.search(text):
        return "LOG_FLOW"
    if any(kw in lower for kw in _DENGUE_KW):
        return "DENGUE_FLOW"
    if any(kw in lower for kw in _NCD_KW):
        return "NCD_FLOW"
    return "UNKNOWN"


_LLM_SYSTEM = (
    "You are JagaKL, a multilingual WhatsApp health triage assistant for migrants, "
    "refugees, and low-income communities in Kuala Lumpur, Malaysia. "
    "Respond in the same language the user is writing in. "
    "Your role: help users describe symptoms clearly and guide them to appropriate care. "
    "Never diagnose or prescribe. Keep replies under 160 words. "
    "If the user mentions chest pain, stroke symptoms, or difficulty breathing, "
    "always say: call 999 immediately. "
    "If they mention fever, ask about dengue warning signs. "
    "If they mention cough for 2+ weeks, ask about TB exposure. "
    "If they mention sadness or anxiety, gently ask how long they have felt this way. "
    "If they ask about a medication, ask them to type the drug name."
)


async def process_with_llm(session: dict, message: str) -> str:
    lang = session.get("language", "en")
    history = session.get("conversation_history", [])
    messages = [{"role": m["role"], "content": m["content"]} for m in history[-10:]]
    system = _LLM_SYSTEM + f"\n\nUser's preferred language: {lang}."
    return await chat(messages, system_prompt=system)


async def handle_message(phone: str, text: str) -> str:
    session = get_session(phone)
    lower = text.lower().strip()
    lang = session.get("language", "en")

    # Forget me command
    if any(kw in lower for kw in _FORGET_KEYWORDS):
        delete_session(phone)
        return (
            "Your data has been deleted. We have no record of this conversation.\n"
            "/ Data anda telah dipadam. Selamat tinggal."
        )

    # Capture postcode from anywhere in the message
    postcode_match = _POSTCODE_RE.search(text)
    if postcode_match and not session.get("postcode"):
        update_session(phone, postcode=postcode_match.group(1))
        session = get_session(phone)

    stage = session.get("stage", "onboarding")

    if stage == "onboarding":
        update_session(phone, stage="awaiting_language")
        return _ONBOARDING_MSG

    if stage == "awaiting_language":
        detected_lang = _LANG_MAP.get(lower.strip())
        if not detected_lang:
            for key in _LANG_MAP:
                if key in lower:
                    detected_lang = _LANG_MAP[key]
                    break
        if not detected_lang:
            detected_lang = await detect_language(text)
        update_session(phone, language=detected_lang, stage="awaiting_mode")
        return _MODE_MSG.get(detected_lang, _MODE_MSG["en"])

    if stage == "awaiting_mode":
        if lower.strip() in ("1", "citizen", "mykad", "ic", "warganegara"):
            update_session(phone, mode="citizen", stage="triage_start")
        else:
            update_session(phone, mode="anonymous", stage="triage_start")
        lang = session.get("language", "en")
        return _TRIAGE_PROMPT.get(lang, _TRIAGE_PROMPT["en"])

    if stage == "ncd_log_flow":
        return await _handle_ncd_log(phone, session, text)

    if stage == "pharmacy_flow":
        return await _handle_pharmacy_refill(phone, session, text)

    if stage in ("triage_start", "dengue_flow"):
        if stage == "triage_start":
            flow = _detect_flow(text)
            if flow == "TB_FLOW":
                return await _handle_tb(phone, session, text)
            if flow == "NCD_FLOW":
                return await _handle_ncd(phone, session, text)
            if flow == "MYMINDA_FLOW":
                return await _handle_myminda(phone, session, text)
            if flow == "PHARMACY_FLOW":
                return await _handle_pharmacy_refill(phone, session, text)
            if flow == "LOG_FLOW":
                return await _handle_ncd_log(phone, session, text)
            if flow == "UNKNOWN":
                return await process_with_llm(session, text)
        return await _handle_dengue(phone, session, text)

    if stage == "tb_flow":
        return await _handle_tb(phone, session, text)

    if stage == "ncd_flow":
        return await _handle_ncd(phone, session, text)

    if stage == "myminda_flow":
        return await _handle_myminda(phone, session, text)

    return await process_with_llm(session, text)


async def _handle_dengue(phone: str, session: dict, text: str) -> str:
    lang = session.get("language", "en")
    postcode = session.get("postcode")
    update_session(phone, stage="dengue_flow")

    if not postcode:
        if lang == "ms":
            return "Untuk semakan risiko denggi yang tepat, sila berikan poskod anda (5 digit, contoh: 50480)."
        return "To check dengue risk accurately, please share your postcode (5 digits, e.g. 50480)."

    hotspot = await fetch_hotspot_status(postcode)
    dengue_day = session.get("dengue_day")

    day_match = _DAY_RE.search(text)
    if day_match:
        day = int(day_match.group(1))
        update_session(phone, dengue_day=day, stage="triage_start")

        hist = " ".join(m.get("content", "") for m in session.get("conversation_history", []))
        warning = is_dengue_warning_signs(hist.lower().split())

        if day >= 3 and (hotspot.get("is_hotspot") or warning):
            triage = {
                "condition": "dengue",
                "severity": "urgent",
                "mode": session.get("mode", "anonymous"),
                "language": lang,
                "postcode": postcode,
            }
            ref = route_referral(triage)
            cases = hotspot.get("active_cases")
            if lang == "ms":
                msg = (
                    f"⚠️ *Amaran Denggi*: Kawasan poskod {postcode} ada"
                    f"{f' {cases} kes aktif' if cases else ' aktiviti denggi yang direkodkan'}.\n\n"
                    f"Dengan demam hari ke-{day}, anda perlu ujian *NS1/FBC SEKARANG*.\n\n"
                )
            else:
                msg = (
                    f"⚠️ *Dengue Alert*: Postcode {postcode} has"
                    f"{f' {cases} active cases' if cases else ' recorded dengue activity'}.\n\n"
                    f"On day {day} of fever, you need an *NS1/FBC test NOW*.\n\n"
                )
            return msg + ref["message"]
        else:
            cases_str = str(hotspot.get("active_cases")) if hotspot.get("active_cases") is not None else "no data"
            if lang == "ms":
                return (
                    f"Demam hari ke-{day}. Kawasan poskod {postcode}: {cases_str} kes aktif.\n\n"
                    "Berehat dan minum air yang banyak. Jika demam berterusan melebihi 3 hari, "
                    "atau anda mengalami muntah, sakit perut, atau pendarahan — pergi ke klinik SEGERA."
                )
            return (
                f"Day {day} fever. Postcode {postcode}: {cases_str} active dengue cases.\n\n"
                "Rest and stay hydrated. If fever continues past day 3, "
                "or you experience vomiting, abdominal pain, or bleeding — go to a clinic IMMEDIATELY."
            )

    if dengue_day is None:
        if lang == "ms":
            return "Ini adalah hari keberapa demam anda? Sila balas dengan nombor (contoh: 1, 3, atau 5)."
        return "Which day of fever is this? Please reply with a number (e.g. 1, 3, or 5)."

    if lang == "ms":
        return "Sila balas dengan nombor hari demam anda (contoh: taip '3' untuk hari ke-3)."
    return "Please reply with the day number of your fever (e.g. type '3' for day 3)."


async def _handle_tb(phone: str, session: dict, text: str) -> str:
    lang = session.get("language", "en")
    tb_data = _load_tb_data()
    questions = tb_data.get("questions", [])
    threshold = tb_data.get("scoring_threshold", 3)
    update_session(phone, stage="tb_flow")

    q_index = session.get("tb_question_index", 0)
    tb_answers: list = list(session.get("tb_answers", []))

    # Record answer to the previous question
    if q_index > 0 and len(tb_answers) < q_index:
        is_yes = any(w in text.lower() for w in ["yes", "ya", "iya", "ஆம்", "হ্যাঁ", "1"])
        tb_answers.append(is_yes)
        update_session(phone, tb_answers=tb_answers)

    # All questions answered
    if q_index >= len(questions) and len(tb_answers) >= len(questions):
        score = sum(
            questions[i]["weight"]
            for i, ans in enumerate(tb_answers[: len(questions)])
            if ans
        )
        update_session(phone, stage="triage_start", tb_question_index=0, tb_answers=[])
        if score >= threshold:
            triage = {
                "condition": "tb",
                "severity": "urgent",
                "mode": session.get("mode", "anonymous"),
                "language": lang,
                "postcode": session.get("postcode"),
            }
            ref = route_referral(triage)
            if lang == "ms":
                prefix = (
                    "⚠️ Berdasarkan jawapan anda, anda mungkin perlu ujian TB.\n"
                    "Jangan risau — rawatan PERCUMA dan SULIT tersedia.\n\n"
                )
            else:
                prefix = (
                    "⚠️ Based on your answers, you may need a TB test.\n"
                    "Don’t worry — FREE and CONFIDENTIAL testing is available.\n\n"
                )
            return prefix + ref["message"]
        else:
            if lang == "ms":
                return "Berdasarkan jawapan anda, risiko TB adalah rendah. Jika batuk berterusan, sila jumpa doktor."
            return "Based on your answers, TB risk appears low. If the cough persists, please see a doctor."

    # Ask next question
    q = questions[q_index]
    update_session(phone, tb_question_index=q_index + 1)
    lang_key = f"question_{lang}" if lang in ("ms", "ta", "bn", "zh") else "question_en"
    question_text = q.get(lang_key) or q.get("question_en")
    progress = f"({q_index + 1}/{len(questions)})"

    if lang == "ms":
        return f"{progress} {question_text}\n\nBalas: Ya / Tidak"
    return f"{progress} {question_text}\n\nReply: Yes / No"


async def _handle_myminda(phone: str, session: dict, text: str) -> str:
    lang = session.get("language", "en")
    phq_data = _load_phq_data()
    questions = phq_data["questions"]
    phq2_threshold = phq_data["phq2_threshold"]
    bands = phq_data["phq9_bands"]

    update_session(phone, stage="myminda_flow")

    q_index = session.get("phq_question_index", 0)
    phq_answers: list[int] = list(session.get("phq_answers", []))
    phase = session.get("phq_phase", "phq2")
    total_in_phase = 2 if phase == "phq2" else 9

    def _reply_hint() -> str:
        if lang == "ms":
            return (
                "Balas: 0 / 1 / 2 / 3\n"
                "(0=Tidak langsung, 1=Beberapa hari, "
                "2=Lebih separuh masa, 3=Hampir setiap hari)"
            )
        elif lang == "zh":
            return (
                "回复: 0 / 1 / 2 / 3\n"
                "(0=完全没有, 1=几天, 2=超过一半的时间, 3=几乎每天)"
            )
        return (
            "Reply: 0 / 1 / 2 / 3\n"
            "(0=Not at all, 1=Several days, "
            "2=More than half the days, 3=Nearly every day)"
        )

    # Record answer to previous question
    if q_index > 0 and len(phq_answers) < q_index:
        score = _parse_phq_answer(text)
        if score is None:
            prev_q = questions[q_index - 1]
            lang_key = f"question_{lang}" if lang in ("ms", "ta", "bn", "zh") else "question_en"
            q_text = prev_q.get(lang_key) or prev_q["question_en"]
            return f"({q_index}/{total_in_phase}) {q_text}\n\n{_reply_hint()}"
        phq_answers.append(score)
        update_session(phone, phq_answers=phq_answers)

    # Check if current phase is complete
    if len(phq_answers) >= total_in_phase:

        if phase == "phq2":
            phq2_total = sum(phq_answers[:2])

            if phq2_total < phq2_threshold:
                update_session(
                    phone,
                    stage="triage_start",
                    phq_question_index=0,
                    phq_answers=[],
                    phq_phase="phq2",
                )
                if lang == "ms":
                    return (
                        "Terima kasih kerana berkongsi. Berdasarkan jawapan anda, "
                        "tahap tekanan anda kelihatan rendah buat masa ini.\n\n"
                        "Tips self-care:\n"
                        "• Tidur yang cukup (7–8 jam)\n"
                        "• Bersenam ringan setiap hari\n"
                        "• Bercakap dengan seseorang yang anda percayai\n\n"
                        "Jika perasaan ini bertambah buruk atau berterusan lebih 2 minggu, "
                        "sila berjumpa doktor."
                    )
                return (
                    "Thank you for sharing. Based on your answers, your mood appears "
                    "low-risk for now.\n\n"
                    "Self-care tips:\n"
                    "• Get 7–8 hours of sleep\n"
                    "• Light exercise daily\n"
                    "• Talk to someone you trust\n\n"
                    "If these feelings worsen or persist beyond 2 weeks, "
                    "please see a doctor."
                )

            # Escalate to PHQ-9
            update_session(
                phone,
                phq_question_index=0,
                phq_answers=[],
                phq_phase="phq9",
            )
            session = get_session(phone)
            q_index = 0
            phq_answers = []
            phase = "phq9"
            total_in_phase = 9

        if phase == "phq9" and len(phq_answers) >= 9:
            phq9_total = sum(phq_answers[:9])
            q9_score = phq_answers[8]

            _clinics_path = Path(__file__).parent.parent.parent / "data" / "ngo_clinics.json"
            with open(_clinics_path, encoding="utf-8") as _f:
                _clinics_raw = json.load(_f)
            emergency = _clinics_raw.get("emergency", {})
            befrienders = emergency.get("befrienders_kl", "03-7627 2929")
            talian = emergency.get("talian_kasih", "15999")

            update_session(
                phone,
                stage="triage_start",
                phq_question_index=0,
                phq_answers=[],
                phq_phase="phq2",
            )

            # Q9 crisis override — any non-zero answer triggers crisis
            if q9_score > 0:
                if lang == "ms":
                    return (
                        "Saya sangat prihatin dengan apa yang anda kongsikan. "
                        "Anda tidak perlu bersendirian.\n\n"
                        "*Talian Krisis*:\n"
                        f"• Befrienders KL: *{befrienders}* (24 jam)\n"
                        f"• Talian Kasih: *{talian}* (24 jam)\n\n"
                        "Sila hubungi sekarang — anda layak mendapat sokongan."
                    )
                return (
                    "I'm very concerned about what you've shared. "
                    "You don't have to face this alone.\n\n"
                    "*Crisis Lines*:\n"
                    f"• Befrienders KL: *{befrienders}* (24/7)\n"
                    f"• Talian Kasih: *{talian}* (24/7)\n\n"
                    "Please reach out now — you deserve support."
                )

            # Score-band routing
            band_label = "minimal"
            for b in bands:
                if b["min"] <= phq9_total <= b["max"]:
                    band_label = b["label"]
                    break

            if band_label in ("moderate", "moderately_severe", "severe"):
                triage = {
                    "condition": "mental_health",
                    "severity": "urgent" if band_label == "severe" else "moderate",
                    "mode": session.get("mode", "anonymous"),
                    "language": lang,
                    "postcode": session.get("postcode"),
                }
                ref = route_referral(triage)

                if band_label == "severe":
                    if lang == "ms":
                        prefix = (
                            f"Skor anda menunjukkan gejala teruk ({phq9_total}/27). "
                            "Sila dapatkan bantuan segera.\n\n"
                            f"• Befrienders KL: *{befrienders}* (24 jam)\n"
                            f"• Talian Kasih: *{talian}* (24 jam)\n\n"
                        )
                    else:
                        prefix = (
                            f"Your score indicates severe symptoms ({phq9_total}/27). "
                            "Please seek help immediately.\n\n"
                            f"• Befrienders KL: *{befrienders}* (24/7)\n"
                            f"• Talian Kasih: *{talian}* (24/7)\n\n"
                        )
                    return prefix + ref["message"]

                if lang == "ms":
                    prefix = (
                        f"Skor anda ({phq9_total}/27) menunjukkan anda mungkin mendapat manfaat "
                        "daripada sokongan profesional.\n\n"
                    )
                else:
                    prefix = (
                        f"Your score ({phq9_total}/27) suggests you may benefit from "
                        "professional support.\n\n"
                    )
                return prefix + ref["message"]

            # Minimal / mild
            if lang == "ms":
                return (
                    f"Skor anda: {phq9_total}/27 — gejala ringan.\n\n"
                    "Tips self-care:\n"
                    "• Tidur yang cukup dan bersenam ringan\n"
                    "• Bercakap dengan seseorang yang anda percayai\n"
                    "• Kurangkan kafein dan alkohol\n\n"
                    "Jika perasaan ini bertambah buruk, sila jumpa doktor."
                )
            return (
                f"Your score: {phq9_total}/27 — mild symptoms.\n\n"
                "Self-care tips:\n"
                "• Maintain sleep and light exercise\n"
                "• Talk to someone you trust\n"
                "• Reduce caffeine and alcohol\n\n"
                "If these feelings worsen, please see a doctor."
            )

    # Ask next question
    q = questions[q_index]
    update_session(phone, phq_question_index=q_index + 1)
    lang_key = f"question_{lang}" if lang in ("ms", "ta", "bn", "zh") else "question_en"
    q_text = q.get(lang_key) or q["question_en"]
    progress = f"({q_index + 1}/{total_in_phase})"
    return f"{progress} {q_text}\n\n{_reply_hint()}"


async def _handle_ncd(phone: str, session: dict, text: str) -> str:
    lang = session.get("language", "en")
    is_return_visit = session.get("stage") == "ncd_flow"
    update_session(phone, stage="ncd_flow")

    if session.get("media_url"):
        # TODO: wire OpenClaw API here (OCR for prescription photo)
        if lang == "ms":
            return (
                "Gambar preskripsi diterima.\n"
                "Fungsi OCR akan disambungkan tidak lama lagi. "
                "Sementara itu, taip nama ubat anda (contoh: Metformin) untuk maklumat."
            )
        return (
            "Prescription photo received.\n"
            "OCR analysis coming soon. "
            "In the meantime, type your medication name (e.g. Metformin) for information."
        )

    if is_return_visit:
        return lookup_drug(text, lang)

    if lang == "ms":
        return (
            "Untuk bantuan ubat-ubatan:\n\n"
            "1. Hantar *gambar slip preskripsi* anda, ATAU\n"
            "2. Taip nama ubat anda (contoh: *Metformin*, *Amlodipine*, *Warfarin*)\n\n"
            "Saya akan menerangkan dos, masa makan, dan kesan sampingan dalam bahasa anda."
        )
    return (
        "For medication help:\n\n"
        "1. Send a *photo of your prescription slip*, OR\n"
        "2. Type your medication name (e.g. *Metformin*, *Amlodipine*, *Warfarin*)\n\n"
        "I’ll explain dosing, timing, and side effects in your language."
    )


async def _handle_pharmacy_refill(phone: str, session: dict, text: str) -> str:
    lang = session.get("language", "en")
    stage = session.get("stage")

    # Turn 1 — show UMP info, prompt for refill note
    if stage != "pharmacy_flow":
        update_session(phone, stage="pharmacy_flow")
        if lang == "ms":
            return (
                "*Program UMP — Ubat Melalui Pos*\n\n"
                "Sesuai untuk pesakit kronik yang stabil "
                "(kencing manis, darah tinggi, kolesterol, asma).\n\n"
                "*Cara menggunakan UMP:*\n"
                "• Hubungi Klinik Kesihatan anda 2 minggu sebelum ubat habis\n"
                "• Berikan nombor IC / nombor pesakit dan alamat rumah\n"
                "• Ubat akan dihantar dalam 3–5 hari bekerja\n\n"
                "*Apa yang perlu dibawa ke KK:*\n"
                "• Kad pesakit / IC\n"
                "• Botol / pembungkus ubat semasa\n"
                "• Bacaan tekanan darah atau glukosa\n\n"
                "Taip *nama ubat + tarikh isi semula* untuk simpan peringatan "
                "(contoh: Metformin, 15 Mac)."
            )
        return (
            "*UMP — Ubat Melalui Pos (Postal Medication Programme)*\n\n"
            "Available for stable chronic disease patients "
            "(diabetes, hypertension, cholesterol, asthma).\n\n"
            "*How to use UMP:*\n"
            "• Call your Klinik Kesihatan 2 weeks before you run out\n"
            "• Provide your IC/patient number and home address\n"
            "• Medications posted within 3–5 working days\n\n"
            "*What to bring to KK:*\n"
            "• Patient card / IC\n"
            "• Current medication bottles or wrappers\n"
            "• BP or glucose readings\n\n"
            "Type your *medication name + refill date* to save a reminder "
            "(e.g. Metformin, 15 March)."
        )

    # Turn 2 — store refill note, confirm, route
    refill_notes: list = list(session.get("refill_notes", []))
    refill_notes.append(text)
    update_session(phone, refill_notes=refill_notes, stage="triage_start")

    mode = session.get("mode", "anonymous")
    if mode == "citizen":
        if lang == "ms":
            return (
                f"✅ Peringatan disimpan: *{text}*\n\n"
                "Untuk tempah janji di Klinik Kesihatan, gunakan MySejahtera:\n"
                "https://mysejahtera.malaysia.gov.my/intro"
            )
        return (
            f"✅ Reminder saved: *{text}*\n\n"
            "To book a Klinik Kesihatan appointment, use MySejahtera:\n"
            "https://mysejahtera.malaysia.gov.my/intro"
        )

    triage = {
        "condition": "ncd",
        "severity": "routine",
        "mode": "anonymous",
        "language": lang,
        "postcode": session.get("postcode"),
    }
    ref = route_referral(triage)
    header = f"✅ Peringatan disimpan: *{text}*\n\n" if lang == "ms" else f"✅ Reminder saved: *{text}*\n\n"
    return header + ref["message"]


def _glucose_reply(v: float, lang: str) -> str:
    if v < 3.9:
        status_en = "⚠️ Hypoglycaemia! Eat something sweet immediately (glucose tablet, fruit juice)."
        status_ms = "⚠️ Hipoglisemia! Makan sesuatu yang manis segera (tablet glukosa, jus buah)."
    elif v <= 7.0:
        status_en = "✓ In target range."
        status_ms = "✓ Dalam julat sasaran."
    elif v <= 10.0:
        status_en = "↑ Slightly above target — take medication as prescribed and recheck tomorrow."
        status_ms = "↑ Sedikit melebihi sasaran — ambil ubat seperti yang ditetapkan dan semak semula esok."
    else:
        status_en = "↑↑ Significantly above target — contact your doctor if this persists."
        status_ms = "↑↑ Jauh melebihi sasaran — hubungi doktor jika ini berterusan."

    if lang == "ms":
        return f"✅ Glukosa direkod: *{v} mmol/L*\nSasaran: 4.0–7.0 mmol/L\n{status_ms}"
    return f"✅ Glucose logged: *{v} mmol/L*\nTarget: 4.0–7.0 mmol/L\n{status_en}"


def _bp_reply(sys_val: int, dia_val: int, lang: str) -> str:
    if sys_val < 130 and dia_val < 80:
        status_en = "✓ In target range."
        status_ms = "✓ Dalam julat sasaran."
    elif sys_val < 140 and dia_val < 90:
        status_en = "↑ Slightly above target — monitor closely."
        status_ms = "↑ Sedikit melebihi sasaran — pantau dengan teliti."
    else:
        status_en = "↑ Above target — avoid salt, rest, and recheck in 1 hour."
        status_ms = "↑ Melebihi sasaran — elak garam, berehat, dan semak semula dalam 1 jam."

    if lang == "ms":
        return f"✅ Tekanan darah direkod: *{sys_val}/{dia_val} mmHg*\nSasaran: < 130/80 mmHg\n{status_ms}"
    return f"✅ BP logged: *{sys_val}/{dia_val} mmHg*\nTarget: < 130/80 mmHg\n{status_en}"


def _weekly_summary(glucose_log: list, bp_log: list, lang: str) -> str:
    if lang == "ms":
        lines = ["📊 *Ringkasan Mingguan (7 bacaan terakhir)*"]
    else:
        lines = ["📊 *Weekly Summary (last 7 readings)*"]

    recent_g = glucose_log[-7:]
    if recent_g:
        vals = [e["v"] for e in recent_g]
        avg = round(sum(vals) / len(vals), 1)
        status = "✓" if 4.0 <= avg <= 7.0 else "↑"
        readings_str = " · ".join(str(v) for v in vals)
        if lang == "ms":
            lines.append(f"\nGlukosa: {readings_str} mmol/L\nPurata: {avg} mmol/L {status}")
        else:
            lines.append(f"\nGlucose: {readings_str} mmol/L\nAvg: {avg} mmol/L {status}")

    recent_bp = bp_log[-7:]
    if recent_bp:
        avg_sys = round(sum(e["sys"] for e in recent_bp) / len(recent_bp))
        avg_dia = round(sum(e["dia"] for e in recent_bp) / len(recent_bp))
        status = "✓" if avg_sys < 130 and avg_dia < 80 else "↑"
        readings_str = " · ".join(f"{e['sys']}/{e['dia']}" for e in recent_bp)
        if lang == "ms":
            lines.append(f"\nTekanan darah: {readings_str} mmHg\nPurata: {avg_sys}/{avg_dia} mmHg {status}")
        else:
            lines.append(f"\nBP: {readings_str} mmHg\nAvg: {avg_sys}/{avg_dia} mmHg {status}")

    if lang == "ms":
        lines.append("\nBawa ini ke lawatan Klinik Kesihatan anda.\n📋 Balas *ringkasan* bila-bila masa untuk lihat ini semula.")
    else:
        lines.append("\nBring this to your Klinik Kesihatan visit.\n📋 Reply *summary* anytime to see this again.")

    return "\n".join(lines)


async def _handle_ncd_log(phone: str, session: dict, text: str) -> str:
    lang = session.get("language", "en")
    stage = session.get("stage")

    # On-demand summary request
    if text.strip().lower() in ("summary", "ringkasan"):
        return _weekly_summary(
            session.get("glucose_log", []),
            session.get("bp_log", []),
            lang,
        )

    entries = _parse_log_entry(text)

    # No reading found — prompt or re-prompt
    if not entries:
        update_session(phone, stage="ncd_log_flow")
        if lang == "ms":
            return "Taip bacaan anda. Contoh: *glucose 7.2* atau *BP 130/85*"
        return "Type your reading. Example: *glucose 7.2* or *BP 130/85*"

    # Log all entries from this message
    from datetime import datetime as _dt, timezone as _tz
    ts = _dt.now(_tz.utc).isoformat()
    glucose_log: list = list(session.get("glucose_log", []))
    bp_log: list = list(session.get("bp_log", []))

    reply_parts = []
    for entry in entries:
        if entry[0] == "glucose":
            glucose_log.append({"v": entry[1], "unit": "mmol/L", "ts": ts})
            reply_parts.append(_glucose_reply(entry[1], lang))
        elif entry[0] == "bp":
            bp_log.append({"sys": entry[1], "dia": entry[2], "ts": ts})
            reply_parts.append(_bp_reply(entry[1], entry[2], lang))

    update_session(phone, glucose_log=glucose_log, bp_log=bp_log, stage="triage_start")

    reply = "\n\n".join(reply_parts)

    total = len(glucose_log) + len(bp_log)
    if total > 0 and total % 7 == 0:
        reply += "\n\n" + _weekly_summary(glucose_log, bp_log, lang)

    return reply
