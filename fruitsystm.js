 /**
 * ============================================================================
 * fruitsystm.js
 * ملف العقل الرئيسي المستقل لخوارزمية التخمين — النسخة الاحترافية
 * نسخة "القوة العشرية المعزّزة" — عشوائية فائقة الانتشار
 * ============================================================================
 *
 *  ▸ عشوائية تشفيرية (Crypto-based RNG) بنمط Fisher-Yates
 *  ▸ خلط متعدد المراحل (Multi-Pass Shuffle) — 3 مراحل افتراضياً
 *  ▸ منطق "الأقلية" (الضغط الأقل = أولوية أعلى) مع كسر نمط معزّز
 *  ▸ [تعديل] تقسيم المؤشرات:
 *       - 3 مؤشرات للفواكه الصغيرة (الليمون 1، التوت 2، الكيوي 3)
 *       - 1 مؤشر أخضر للفواكه الكبيرة السفلية (الموز 7، الفراولة 8)
 *       - 1 مؤشر أحمر للفواكه الكبيرة العلوية (الكرز 4، البطيخ 6)
 *
 * ============================================================================
 */

// ============================================================================
// [0] مولّد عشوائية تشفيري — Crypto-Secure RNG
// ============================================================================
function secureRandom() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            return arr[0] / 4294967296; // [0, 1)
        }
    } catch (_) { /* تجاهل والعودة للبديل */ }
    return Math.random();
}

// ============================================================================
// [1] الخلط العشوائي الاحترافي — Fisher-Yates Shuffle (Crypto-based)
// ============================================================================
function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(secureRandom() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ============================================================================
// [1.b] خلط متعدد المراحل — Multi-Pass Shuffle
// ============================================================================
function multiShuffle(array, passes = 3) {
    let result = [...array];
    const safePasses = Math.max(1, Math.min(5, passes | 0));
    for (let p = 0; p < safePasses; p++) {
        result = shuffleArray(result);
    }
    return result;
}

// ============================================================================
// [2] قراءة آمنة لعداد الضغطات (slotAmounts)
// ============================================================================
function getSlotAmount(slotId) {
    if (typeof slotAmounts === 'undefined' || !slotAmounts) return 0;
    const value = slotAmounts[slotId];
    return (value === undefined || value === null) ? 0 : Number(value) || 0;
}

// ============================================================================
// [3] منطق "الأقلية" — تفضيل الفواكه ذات الضغط الأقل (نسخة معزّزة)
// ============================================================================
function applyMinorityLogic(slots) {
    if (!Array.isArray(slots) || slots.length === 0) return [];

    // 1) خلط متعدد المراحل
    const shuffled = multiShuffle(slots, 3);

    // 2) كسر النمط المعزّز: 35% عشوائي كامل
    if (secureRandom() <= 0.35) {
        return multiShuffle(shuffled, 2);
    }

    // 3) ترتيب تصاعدي مع تشويش ±30% لتفادي الجمود
    return shuffled.sort((a, b) => {
        const jitteredA = getSlotAmount(a.id) * (0.70 + secureRandom() * 0.60);
        const jitteredB = getSlotAmount(b.id) * (0.70 + secureRandom() * 0.60);
        return jitteredA - jitteredB;
    });
}

// ============================================================================
// [4] الدالة الرئيسية — توليد التوقعات مقسمة حسب الطلب
// ============================================================================
// ترجع: { smallSlots: [3], bottomGreenSlot: element, redSlot: element }
// أو null عند فشل التحقق
// ============================================================================
function generatePrediction(slots, previousSelection) {
    try {
        // التحقق من صحة البيانات الأساسية
        if (!slots || slots.length === 0) {
            throw new Error("بيانات الفواكه مفقودة أو غير صالحة.");
        }

        // ---------------------------------------------------------------
        // 1) الفواكه الصغيرة (الليمون 1، التوت 2، الكيوي 3)
        // ---------------------------------------------------------------
        const smallCandidates = slots.filter(s => s && (s.id === 1 || s.id === 2 || s.id === 3));
        
        // نستخدم منطق الأقلية لترتيبهم
        let selectedSmall = applyMinorityLogic(smallCandidates);
        
        // التأكد من وجود 3 عناصر (بما أنهم 3 أصلاً سيتم اختيارهم جميعاً، لكن نأخذ أول 3 لضمان الأمان)
        if (selectedSmall.length > 3) {
            selectedSmall = selectedSmall.slice(0, 3);
        } else if (selectedSmall.length < 3) {
            // fallback في حال كانت البيانات ناقصة
            const remaining = smallCandidates.filter(s => !selectedSmall.includes(s));
            selectedSmall = selectedSmall.concat(remaining);
        }

        // ---------------------------------------------------------------
        // 2) المؤشر الأخضر السفلي (الموز 7، الفراولة 8)
        // ---------------------------------------------------------------
        const bottomGreenCandidates = slots.filter(s => s && (s.id === 7 || s.id === 8));
        let bottomGreenSlot;
        if (bottomGreenCandidates.length > 0) {
            bottomGreenSlot = applyMinorityLogic(bottomGreenCandidates)[0];
        } else {
            bottomGreenSlot = { id: 7, top: '83%', left: '50%' }; // fallback
        }

        // ---------------------------------------------------------------
        // 3) المؤشر الأحمر (الكرز 4، البطيخ 6)
        // ---------------------------------------------------------------
        const redCandidates = slots.filter(s => s && (s.id === 4 || s.id === 6));
        let redSlot;
        if (redCandidates.length > 0) {
            redSlot = applyMinorityLogic(redCandidates)[0];
        } else {
            redSlot = { id: 4, top: '50%', left: '17%' }; // fallback
        }

        // ---------------------------------------------------------------
        // الإرجاع النهائي
        // ---------------------------------------------------------------
        return {
            smallSlots: selectedSmall,
            bottomGreenSlot: bottomGreenSlot,
            redSlot: redSlot
        };

    } catch (error) {
        console.error("خطأ في خوارزمية التخمين:", error.message);
        return null;
    }
}
