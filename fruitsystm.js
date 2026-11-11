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
 *  ▸ استبعاد قطعي للكرز (4) والبطيخ (6) من المواقع الأربعة
 *  ▸ نمط 3+1 مرن: يبقى أساسياً لكن يتغيّر عشوائياً أحياناً (2+2 / 4+0 / 1+3)
 *  ▸ تشويش موسّع ±30% بدل ±15% لكسر الجمود التام
 *  ▸ معالجة ذكية للنقص والبيانات المفقودة
 *  ▸ [جديد] اختيار المؤشر الخامس (الأحمر) يتم هنا داخل الخوارزمية
 *           (بين الكرز 🍒 والبطيخ 🍉) ويُرجَع للواجهة
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
// [4] الدالة الرئيسية — توليد 4 توقعات + اختيار المؤشر الخامس
// ============================================================================
// ترجع: { mainSlots: [4 عناصر], fifthSlot: عنصر واحد }
// أو null عند فشل التحقق
// ============================================================================
function generatePrediction(slots, previousSelection) {
    try {
        // ---------------------------------------------------------------
        // التحقق من صحة البيانات الأساسية
        // ---------------------------------------------------------------
        if (!slots || slots.length === 0) {
            throw new Error("بيانات الفواكه مفقودة أو غير صالحة.");
        }

        // ---------------------------------------------------------------
        // الاستبعاد القطعي: الكرز (4) والبطيخ (6) لن يظهرا في الأربعة
        // ---------------------------------------------------------------
        const availableSlots = slots.filter(s => s && s.id !== 4 && s.id !== 6);

        let selectedSlots = [];

        // ---------------------------------------------------------------
        // حالة 1: الجولة الأولى (لا يوجد اختيار سابق)
        // ---------------------------------------------------------------
        if (!previousSelection || previousSelection.length === 0) {
            selectedSlots = applyMinorityLogic(availableSlots).slice(0, 4);
        }

        // ---------------------------------------------------------------
        // حالة 2: الجولات اللاحقة — نمط مرن يغلب عليه 3+1
        // ---------------------------------------------------------------
        else {
            const notPickedLastTime = availableSlots.filter(
                s => !previousSelection.includes(s.id)
            );
            const pickedLastTime = availableSlots.filter(
                s => previousSelection.includes(s.id)
            );

            // توزيع عشوائي مرجّح لنمط التقسيم
            const splitPatterns = [
                [3, 1], [3, 1], [3, 1], [3, 1], [3, 1], // 55% تقريباً
                [2, 2], [2, 2],                          // 22% تقريباً
                [4, 0],                                  // 11% تقريباً
                [1, 3]                                   // 11% تقريباً
            ];
            const chosenSplit = splitPatterns[Math.floor(secureRandom() * splitPatterns.length)];
            const [wantNotPicked, wantPicked] = chosenSplit;

            const partA = applyMinorityLogic(notPickedLastTime).slice(0, wantNotPicked);
            const partB = applyMinorityLogic(pickedLastTime).slice(0, wantPicked);

            selectedSlots = partA.concat(partB);

            // استكمال النقص إن وُجد
            if (selectedSlots.length < 4) {
                const needed = 4 - selectedSlots.length;
                const remaining = shuffleArray(
                    availableSlots.filter(s => !selectedSlots.includes(s))
                );
                selectedSlots = selectedSlots.concat(remaining.slice(0, needed));
            }

            // خلط نهائي متعدد المراحل
            selectedSlots = multiShuffle(selectedSlots, 3);
        }

        // ---------------------------------------------------------------
        // فحص أمان نهائي: يجب أن نُرجع 4 عناصر بالضبط
        // ---------------------------------------------------------------
        if (selectedSlots.length !== 4) {
            throw new Error("فشل في تحديد المواقع (العدد غير مطابق).");
        }

        // ===============================================================
        // [5] اختيار المؤشر الخامس (الأحمر) — يتم داخل الخوارزمية
        // ===============================================================
        // يُختار بين الكرز (id = 4) 🍒 والبطيخ (id = 6) 🍉
        // لا يتم اختياره في ملف الواجهة إطلاقاً
        // ===============================================================
        const fifthCandidates = slots.filter(s => s && (s.id === 4 || s.id === 6));

        let fifthSlot;
        if (fifthCandidates.length > 0) {
            fifthSlot = fifthCandidates[Math.floor(secureRandom() * fifthCandidates.length)];
        } else {
            // fallback احتياطي إن لم يوجد الكرز أو البطيخ في البيانات
            fifthSlot = secureRandom() < 0.5
                ? { id: 4, top: '50%', left: '17%' }
                : { id: 6, top: '83%', left: '17%' };
        }

        // ---------------------------------------------------------------
        // الإرجاع النهائي: كائن يحوي المواقع الأربعة + المؤشر الخامس
        // ---------------------------------------------------------------
        return {
            mainSlots: selectedSlots,
            fifthSlot: fifthSlot
        };

    } catch (error) {
        console.error("خطأ في خوارزمية التخمين:", error.message);
        return null;
    }
}
