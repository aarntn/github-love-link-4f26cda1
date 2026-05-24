from typing import Optional

_PATTERNS: dict[str, list[str]] = {
    "CHEST_PAIN": [
        "chest pain", "sakit dada", "chest tight", "sesak dada",
        "heart attack", "serangan jantung", "pressing chest",
    ],
    "STROKE": [
        "can't speak", "cant speak", "slurred speech",
        "face drooping", "face is drooping", "drooping face",
        "muka senget", "senget",
        "arm weak", "arm is weak", "tangan lemah", "sudden confusion",
    ],
    "BREATHING": [
        "can't breathe", "cant breathe", "tak boleh bernafas",
        "difficulty breathing", "sesak nafas", "turning blue", "bibir biru",
    ],
    "SEVERE_BLEEDING": [
        "heavy bleeding", "bleeding won't stop", "bleeding wont stop",
        "darah banyak", "pendarahan teruk",
    ],
    "UNCONSCIOUS": [
        "unconscious", "pengsan", "not responding", "tidak sedar",
    ],
    "SUICIDAL": [
        "want to die", "nak mati", "kill myself", "bunuh diri",
        "no reason to live",
    ],
    "CHILD_DANGER": [
        "child not breathing", "baby not moving", "baby fits",
        "baby kejang", "child collapsed",
    ],
}

_REPLIES_EN: dict[str, str] = {
    "CHEST_PAIN": (
        "EMERGENCY: You may be having a heart attack. "
        "Call 999 NOW. Do not drive yourself. Sit down and stay calm."
    ),
    "STROKE": (
        "EMERGENCY: These are stroke warning signs (FAST test). "
        "Call 999 NOW. Every minute matters."
    ),
    "BREATHING": (
        "EMERGENCY: You are having severe difficulty breathing. "
        "Call 999 NOW."
    ),
    "SEVERE_BLEEDING": (
        "EMERGENCY: Apply firm pressure to the wound and call 999 NOW. "
        "Do not remove the cloth."
    ),
    "UNCONSCIOUS": (
        "EMERGENCY: This person is unconscious. "
        "Call 999 NOW and place them in the recovery position."
    ),
    "SUICIDAL": (
        "You are not alone and I am glad you reached out. "
        "Please call Befrienders KL right now: 03-7627 2929 "
        "(24 hours, free, confidential). They will listen."
    ),
    "CHILD_DANGER": (
        "EMERGENCY: A child is in danger. "
        "Call 999 NOW. Stay with the child and keep calm."
    ),
}

_REPLIES_MS: dict[str, str] = {
    "CHEST_PAIN": (
        "KECEMASAN: Anda mungkin mengalami serangan jantung. "
        "Hubungi 999 SEKARANG. Jangan pandu sendiri. Duduk dan tenang."
    ),
    "STROKE": (
        "KECEMASAN: Ini adalah tanda-tanda strok (ujian FAST). "
        "Hubungi 999 SEKARANG. Setiap minit penting."
    ),
    "BREATHING": (
        "KECEMASAN: Anda mengalami kesukaran bernafas yang teruk. "
        "Hubungi 999 SEKARANG."
    ),
    "SEVERE_BLEEDING": (
        "KECEMASAN: Tekan luka dengan kuat dan hubungi 999 SEKARANG. "
        "Jangan tanggalkan kain."
    ),
    "UNCONSCIOUS": (
        "KECEMASAN: Orang ini pengsan. "
        "Hubungi 999 SEKARANG dan letakkan mereka dalam posisi pemulihan."
    ),
    "SUICIDAL": (
        "Anda tidak keseorangan dan saya gembira anda menghubungi. "
        "Sila hubungi Befrienders KL sekarang: 03-7627 2929 "
        "(24 jam, percuma, sulit). Mereka akan mendengar anda."
    ),
    "CHILD_DANGER": (
        "KECEMASAN: Seorang kanak-kanak dalam bahaya. "
        "Hubungi 999 SEKARANG. Kekal bersama kanak-kanak dan tenang."
    ),
}

_REPLIES_TA: dict[str, str] = {
    "CHEST_PAIN": (
        "அவசரநிலை: உங்களுக்கு மாரடைப்பு வரலாம். "
        "இப்போதே 999 அழையுங்கள். உட்கார்ந்து அமைதியாக இருங்கள்."
    ),
    "STROKE": (
        "அவசரநிலை: இவை பக்கவாதம் அறிகுறிகள். "
        "இப்போதே 999 அழையுங்கள். ஒவ்வொரு நிமிடமும் முக்கியம்."
    ),
    "BREATHING": (
        "அவசரநிலை: உங்களுக்கு சுவாசிக்க கடினமாக உள்ளது. "
        "இப்போதே 999 அழையுங்கள்."
    ),
    "SEVERE_BLEEDING": (
        "அவசரநிலை: காயத்தை இறுக்கமாக அழுத்தி 999 அழையுங்கள். "
        "துணியை எடுக்காதீர்கள்."
    ),
    "UNCONSCIOUS": (
        "அவசரநிலை: இந்த நபர் உணர்வற்று உள்ளார். "
        "இப்போதே 999 அழையுங்கள்."
    ),
    "SUICIDAL": (
        "நீங்கள் தனியில்லை, நீங்கள் தொடர்பு கொண்டதில் மகிழ்ச்சி. "
        "Befrienders KL: 03-7627 2929 (24 மணி நேரமும், இலவசம், இரகசியம்)."
    ),
    "CHILD_DANGER": (
        "அவசரநிலை: குழந்தை ஆபத்தில் உள்ளது. "
        "இப்போதே 999 அழையுங்கள். குழந்தையுடன் இருங்கள்."
    ),
}

_REPLIES_ZH: dict[str, str] = {
    "CHEST_PAIN": (
        "紧急：您可能正在心脏病发作。"
        "立即拨打999。不要自己开车。坐下保持冷静。"
    ),
    "STROKE": (
        "紧急：这是中风警告信号（FAST测试）。"
        "立即拨打999。每一分钟都至关重要。"
    ),
    "BREATHING": (
        "紧急：您呼吸严重困难。"
        "立即拨打999。"
    ),
    "SEVERE_BLEEDING": (
        "紧急：用力按压伤口，立即拨打999。"
        "不要移开布料。"
    ),
    "UNCONSCIOUS": (
        "紧急：此人已失去意识。"
        "立即拨打999，并将其置于复原体位。"
    ),
    "SUICIDAL": (
        "您并不孤单，我很高兴您联系我们。"
        "请立即致电 Befrienders KL：03-7627 2929（24小时，免费，保密）。"
    ),
    "CHILD_DANGER": (
        "紧急：儿童处于危险中。"
        "立即拨打999。陪伴孩子并保持冷静。"
    ),
}

_REPLIES_BN: dict[str, str] = {
    "CHEST_PAIN": (
        "জরুরি অবস্থা: আপনার হার্ট অ্যাটাক হতে পারে। "
        "এখনই 999 কল করুন। নিজে গাড়ি চালাবেন না। বসুন এবং শান্ত থাকুন।"
    ),
    "STROKE": (
        "জরুরি অবস্থা: এগুলো স্ট্রোকের লক্ষণ (FAST পরীক্ষা)। "
        "এখনই 999 কল করুন। প্রতিটি মিনিট গুরুত্বপূর্ণ।"
    ),
    "BREATHING": (
        "জরুরি অবস্থা: আপনার শ্বাস নিতে গুরুতর সমস্যা হচ্ছে। "
        "এখনই 999 কল করুন।"
    ),
    "SEVERE_BLEEDING": (
        "জরুরি অবস্থা: ক্ষতে শক্ত করে চাপ দিন এবং এখনই 999 কল করুন। "
        "কাপড় সরাবেন না।"
    ),
    "UNCONSCIOUS": (
        "জরুরি অবস্থা: এই ব্যক্তি অজ্ঞান হয়ে গেছেন। "
        "এখনই 999 কল করুন এবং তাকে রিকভারি পজিশনে রাখুন।"
    ),
    "SUICIDAL": (
        "আপনি একা নন, আপনি যোগাযোগ করেছেন বলে আমি খুশি। "
        "এখনই Befrienders KL-এ কল করুন: 03-7627 2929 (২৪ ঘণ্টা, বিনামূল্যে, গোপনীয়)।"
    ),
    "CHILD_DANGER": (
        "জরুরি অবস্থা: একটি শিশু বিপদে আছে। "
        "এখনই 999 কল করুন। শিশুর সাথে থাকুন এবং শান্ত থাকুন।"
    ),
}

_LANG_REPLIES = {
    "en": _REPLIES_EN,
    "ms": _REPLIES_MS,
    "ta": _REPLIES_TA,
    "zh": _REPLIES_ZH,
    "bn": _REPLIES_BN,
}


def check_redflag(text: str, language: str = "en") -> Optional[dict]:
    lower = text.lower()
    lang = language if language in _LANG_REPLIES else "en"
    for category, keywords in _PATTERNS.items():
        for kw in keywords:
            if kw in lower:
                return {
                    "triggered": True,
                    "category": category,
                    "reply": _LANG_REPLIES[lang][category],
                    # keep legacy keys for backward compat
                    "reply_en": _REPLIES_EN[category],
                    "reply_ms": _REPLIES_MS[category],
                }
    return None
