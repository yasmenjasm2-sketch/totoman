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
 *  ▸ استبعاد قطعي للكرز (4) والبطيخ (6)
 *  ▸ نمط 3+1 مرن: يبقى أساسياً لكن يتغيّر عشوائياً أحياناً (2+2 / 4+0 / 1+3)
 *  ▸ تشويش موسّع ±30% بدل ±15% لكسر الجمود التام
 *  ▸ معالجة ذكية للنقص والبيانات المفقودة
 *
 * ============================================================================
 */

// ============================================================================
// [0] مولّد عشوائية تشفيري — Crypto-Secure RNG
// ============================================================================
// يستخدم crypto.getRandomValues عند توفره (متصفح / Node حديث)
// ثم يعود إلى Math.random كخطة بديلة لضمان العمل في كل بيئة
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
// المميزات:
//   • عشوائية موحّدة تامة (Uniform Distribution)
//   • لا يوجد تحيز لأي موضع من المصفوفة
//   • مصدر عشوائية تشفيري بدل Math.random
//   • مطابقة لبصمة AI1 لكن بقوة عشوائية أعلى
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
// كل مرحلة تعيد توزيع العناصر فوق نتيجة المرحلة السابقة
// النتيجة: توزيع عشوائي فائق بدل توزيع عشوائي مفرد
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
// الخطوات:
//   1) خلط متعدد المراحل (3 مراحل) — كسر أي ترتيب موروث
//   2) 35% من المرات: عشوائي كامل (كان 20% — الآن أقوى)
//   3) 65% من المرات: ترتيب تصاعدي مع تشويش ±30% (كان ±15%)
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
// [4] الدالة الرئيسية — توليد 4 توقعات (قوة تخمين عشرية معزّزة)
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
        // الاستبعاد القطعي: الكرز (4) والبطيخ (6) لن يظهرا أبداً
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
            // فصل الفواكه إلى مجموعتين: لم تظهر سابقاً / ظهرت سابقاً
            const notPickedLastTime = availableSlots.filter(
                s => !previousSelection.includes(s.id)
            );
            const pickedLastTime = availableSlots.filter(
                s => previousSelection.includes(s.id)
            );

            // -----------------------------------------------------------------
            // توزيع عشوائي مرجّح لنمط التقسيم:
            //   3+1 هو الأساس (5 أوزان من 9) → يبقى المهيمن
            //   لكن يسمح أحياناً بـ 2+2 و 4+0 و 1+3 لكسر التنبؤ
            // -----------------------------------------------------------------
            const splitPatterns = [
                [3, 1], [3, 1], [3, 1], [3, 1], [3, 1], // 55% تقريباً
                [2, 2], [2, 2],                          // 22% تقريباً
                [4, 0],                                  // 11% تقريباً
                [1, 3]                                   // 11% تقريباً
            ];
            const chosenSplit = splitPatterns[Math.floor(secureRandom() * splitPatterns.length)];
            const [wantNotPicked, wantPicked] = chosenSplit;

            // اختيار من كل مجموعة بعد تطبيق منطق الأقلية
            const partA = applyMinorityLogic(notPickedLastTime).slice(0, wantNotPicked);
            const partB = applyMinorityLogic(pickedLastTime).slice(0, wantPicked);

            selectedSlots = partA.concat(partB);

            // استكمال النقص إن وُجد (بسبب الاستبعاد أو نقص البيانات)
            if (selectedSlots.length < 4) {
                const needed = 4 - selectedSlots.length;
                const remaining = shuffleArray(
                    availableSlots.filter(s => !selectedSlots.includes(s))
                );
                selectedSlots = selectedSlots.concat(remaining.slice(0, needed));
            }

            // خلط نهائي متعدد المراحل لضمان عدم ثبات المواضع
            selectedSlots = multiShuffle(selectedSlots, 3);
        }

        // ---------------------------------------------------------------
        // فحص أمان نهائي: يجب أن نُرجع 4 عناصر بالضبط
        // ---------------------------------------------------------------
        if (selectedSlots.length !== 4) {
            throw new Error("فشل في تحديد المواقع (العدد غير مطابق).");
        }

        return selectedSlots;

    } catch (error) {
        console.error("خطأ في خوارزمية التخمين:", error.message);
        return null;
    }
}
