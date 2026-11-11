/**
 * ============================================================================
 * fruitsystm.js
 * ملف العقل الرئيسي المستقل لخوارزمية التخمين — النسخة الاحترافية
 * ============================================================================
 *
 *  ▸ التعديل الجديد: تقسيم المؤشرات إلى 5 (3 علوية للصغيرة، 2 سفلية للكبيرة)
 *  ▸ المؤشرات العلوية (3): تختار 3 من 4 (ليمون 1، توت 2، كيوي 3، برقوق 5)
 *  ▸ المؤشر السفلي الأول (أحمر): يختار 1 من 2 (كرز 4، بطيخ 6)
 *  ▸ المؤشر السفلي الثاني (أحمر): يختار 1 من 2 (موز 7، فراولة 8)
 *  ▸ عشوائية تشفيرية (Crypto-based RNG) بنمط Fisher-Yates
 *  ▸ منطق "الأقلية" (الضغط الأقل = أولوية أعلى) مع كسر نمط معزّز
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
// [4] الدالة الرئيسية — توليد 5 توقعات مقسمة حسب طلبك
// ============================================================================
// ترجع: { topSlots: [3 عناصر], bottomSlot1: عنصر, bottomSlot2: عنصر }
// ============================================================================
function generatePrediction(slots, previousSelection) {
    try {
        if (!slots || slots.length === 0) {
            throw new Error("بيانات الفواكه مفقودة أو غير صالحة.");
        }

        // ---------------------------------------------------------------
        // تحديد مجموعات الفواكه حسب المناطق
        // ---------------------------------------------------------------
        const topGroupIds = [1, 2, 3, 5]; // ليمون، توت، كيوي، برقوق بنفسجي
        const bottom1Ids = [4, 6];        // كرز، بطيخ
        const bottom2Ids = [7, 8];        // موز، فراولة

        const topSlotsAvailable = slots.filter(s => s && topGroupIds.includes(s.id));
        const bottom1Available = slots.filter(s => s && bottom1Ids.includes(s.id));
        const bottom2Available = slots.filter(s => s && bottom2Ids.includes(s.id));

        // ---------------------------------------------------------------
        // 1. اختيار 3 مؤشرات علوية (من أصل 4 فواكه صغيرة)
        // ---------------------------------------------------------------
        let selectedTopSlots = [];

        if (!previousSelection || previousSelection.length === 0) {
            selectedTopSlots = applyMinorityLogic(topSlotsAvailable).slice(0, 3);
        } else {
            const notPickedLastTime = topSlotsAvailable.filter(s => !previousSelection.includes(s.id));
            const pickedLastTime = topSlotsAvailable.filter(s => previousSelection.includes(s.id));

            let partA = applyMinorityLogic(notPickedLastTime);
            let partB = applyMinorityLogic(pickedLastTime);

            selectedTopSlots = partA.concat(partB).slice(0, 3);

            // استكمال النقص إن وُجد
            if (selectedTopSlots.length < 3) {
                const needed = 3 - selectedTopSlots.length;
                const remaining = shuffleArray(
                    topSlotsAvailable.filter(s => !selectedTopSlots.includes(s))
                );
                selectedTopSlots = selectedTopSlots.concat(remaining.slice(0, needed));
            }
        }

        if (selectedTopSlots.length !== 3) {
            throw new Error("فشل في تحديد المواقع العلوية (العدد غير مطابق).");
        }

        // ---------------------------------------------------------------
        // 2. اختيار المؤشر السفلي الأول (أحمر) - كرز أو بطيخ
        // ---------------------------------------------------------------
        const selectedBottom1 = bottom1Available[Math.floor(secureRandom() * bottom1Available.length)];

        // ---------------------------------------------------------------
        // 3. اختيار المؤشر السفلي الثاني (أحمر) - موز أو فراولة
        // ---------------------------------------------------------------
        const selectedBottom2 = bottom2Available[Math.floor(secureRandom() * bottom2Available.length)];

        // ---------------------------------------------------------------
        // الإرجاع النهائي
        // ---------------------------------------------------------------
        return {
            topSlots: selectedTopSlots,
            bottomSlot1: selectedBottom1,
            bottomSlot2: selectedBottom2
        };

    } catch (error) {
        console.error("خطأ في خوارزمية التخمين:", error.message);
        return null;
    }
}
