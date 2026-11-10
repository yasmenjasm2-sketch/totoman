/**
 * ============================================================================
 * fruitsystm.js
 * محرك التخمين الذكي المستقل — الإصدار v2.0 (احترافي معزّز)
 * ============================================================================
 *
 *  ▸ عشوائية متعددة المصادر: crypto + طابع زمني + عدّاد XORShift
 *  ▸ خلط Fisher–Yates متعدد المراحل (3 مراحل افتراضية)
 *  ▸ عيّنة مرجّحة بدون إحلال (Efraimidis–Spirakis) — توزيع احتمالي عادل
 *  ▸ أوزان مركّبة:
 *      • ضغط أقل = وزن أعلى (inverse-sqrt لتفادي التطرف)
 *      • عقوبة تنوّع أُسّية لتقليل تكرار نفس الفواكه
 *      • مكافأة تغطية لوغاريتمية للفواكه الغائبة (ترفع نسبة الإصابة على المدى الطويل)
 *      • موازنة السلاسل (streak) لمنع الجمود على فاكهة واحدة
 *  ▸ حالة داخلية تحفظ آخر 20 توقّعًا + مسافات هامينغ + عدّادات
 *  ▸ نمط توزيع مرن: 3+1 يهيمن، لكن 2+2 و 4+0 و 1+3 و 0+4 تُستخدم أحياناً
 *  ▸ الاستبعاد القطعي: الكرز (4) والبطيخ (6)
 *
 *  الواجهة العامة: generatePrediction(slots, previousSelection) → Array | null
 * ============================================================================
 */

'use strict';

// ============================================================================
// [0] الحالة الداخلية — تُحفظ عبر استدعاءات متعددة للدالة
// ============================================================================
const __FS_STATE = {
    roundCounter: 0,
    predictionHistory: [],     // Array<number[]> — آخر توقعاتنا (IDs)
    slotFrequency: {},         // {id: count} — كم مرة ظهرت كل فاكهة في توقعنا
    streakCounters: {},        // {id: n} — عدد الظهور المتتالي
    hammingHist: []            // Array<number> — سجل مسافات هامينغ
};

const MAX_HISTORY = 20;

// ============================================================================
// [1] مولّد عشوائية متعدد المصادر
// ============================================================================
function secureRandom() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            return arr[0] / 4294967296; // [0, 1)
        }
    } catch (_) { /* تجاهل */ }
    return Math.random();
}

// عشوائية مدعومة ببصمة زمنية + عدّاد داخلي — لكسر أي نمط متكرر
let __entropyCounter = 0;
function entropyRandom() {
    __entropyCounter = (__entropyCounter + 1) % 1000000;
    const t = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now();

    const seed = (secureRandom() * 1e9) + (t * 1e3) + __entropyCounter;

    // XORShift32 لتوزيع البذرة
    let x = Math.floor(seed) | 0;
    x ^= (x << 13);
    x ^= (x >>> 17);
    x ^= (x << 5);
    const norm = ((x >>> 0) % 1000000) / 1000000;

    // مزج مع crypto — النتيجة في [0, 1]
    return (norm + secureRandom()) / 2;
}

// ============================================================================
// [2] الخلط — Fisher–Yates
// ============================================================================
function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(secureRandom() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function multiShuffle(array, passes = 3) {
    let result = [...array];
    const safePasses = Math.max(1, Math.min(6, passes | 0));
    for (let p = 0; p < safePasses; p++) {
        result = shuffleArray(result);
    }
    return result;
}

// ============================================================================
// [3] عيّنة مرجّحة بدون إحلال (Efraimidis–Spirakis)
// ============================================================================
// تعطي فرصاً متناسبة مع الأوزان دون القضاء على العشوائية —
// أكثر عدلاً من "اختيار الحاصل على أعلى وزن دائماً"
// ============================================================================
function weightedSampleWithoutReplacement(items, count, weightFn) {
    if (!Array.isArray(items) || items.length === 0) return [];
    const target = Math.min(count, items.length);

    const keyed = items.map(item => {
        const w = Math.max(1e-9, Number(weightFn(item)) || 1e-9);
        const u = secureRandom();
        // مفتاح E–S: u^(1/w)
        return { item, key: Math.pow(u, 1 / w) };
    });

    keyed.sort((a, b) => b.key - a.key);
    return keyed.slice(0, target).map(k => k.item);
}

// ============================================================================
// [4] قراءة آمنة لضغط الفاكهة (slotAmounts قد تكون غير موجودة)
// ============================================================================
function getSlotAmount(slotId) {
    if (typeof slotAmounts === 'undefined' || !slotAmounts) return 0;
    const v = slotAmounts[slotId];
    return (v === undefined || v === null) ? 0 : (Number(v) || 0);
}

// ============================================================================
// [5] أوزان إحصائية رياضية
// ============================================================================

// 5.1 — وزن الضغط (minority): كلما قلّ الضغط زاد الوزن
//       جذر تربيعي معكوس لتفادي التطرف الحاد
function pressureWeight(slot) {
    const amount = getSlotAmount(slot.id);
    if (amount <= 0) return 3.0;                    // فاكهة "فارغة" = وزن مرتفع
    return 1 / Math.sqrt(1 + amount / 1000);        // نطاق تقريبي [~0.03 .. 1]
}

// 5.2 — عقوبة التنوّع: تخفيض وزن الفواكه التي ظهرت مؤخراً
//       تسوس أُسّي (0.78) للجولات القديمة يقلّل تأثيرها
function diversityPenalty(slotId) {
    const hist = __FS_STATE.predictionHistory;
    if (hist.length === 0) return 1.0;

    let penalty = 1.0;
    const decay = 0.78;
    for (let i = hist.length - 1; i >= 0; i--) {
        const age = hist.length - 1 - i;
        if (hist[i].includes(slotId)) {
            penalty *= (1 - decay * Math.pow(0.7, age));
            if (penalty < 0.15) penalty = 0.15;
        }
    }
    return Math.max(0.15, penalty);
}

// 5.3 — مكافأة التغطية: فواكه لم تظهر منذ فترة تحصل على دفعة
//       منحنى لوغاريتمي لتفادي القفزات العنيفة
function coverageBoost(slotId) {
    const hist = __FS_STATE.predictionHistory;
    if (hist.length === 0) return 1.0;

    let lastSeen = -1;
    for (let i = hist.length - 1; i >= 0; i--) {
        if (hist[i].includes(slotId)) { lastSeen = i; break; }
    }
    if (lastSeen === -1) return 1.5;                // لم تظهر أبداً
    const gap = hist.length - 1 - lastSeen;
    return 1.0 + Math.log(1 + gap) * 0.35;          // دفع متزايد ببطء
}

// 5.4 — موازنة السلاسل: كل ظهور متتالٍ يخفّض الوزن تدريجياً
function streakBalance(slotId) {
    const streak = __FS_STATE.streakCounters[slotId] || 0;
    if (streak <= 0) return 1.0;
    return Math.pow(0.65, streak);
}

// 5.5 — الوزن المركّب النهائي (حاصل ضرب كل المعايير)
function compositeWeight(slot) {
    const p = pressureWeight(slot);
    const d = diversityPenalty(slot.id);
    const c = coverageBoost(slot.id);
    const s = streakBalance(slot.id);
    return Math.max(1e-6, p * d * c * s);
}

// ============================================================================
// [6] منطق الأقلية المعزّز
// ============================================================================
function applyMinorityLogic(slots) {
    if (!Array.isArray(slots) || slots.length === 0) return [];

    // خلط مبدئي متعدد لكسر أي ترتيب موروث
    const shuffled = multiShuffle(slots, 3);

    // 30% عشوائي تام (يضمن قدراً عالياً من عدم القابلية للتنبؤ)
    if (entropyRandom() <= 0.30) {
        return multiShuffle(shuffled, 2);
    }

    // 70% ترتيب مرجّح ذكي + تشويش ±40% لكسر الجمود
    return [...shuffled].sort((a, b) => {
        const wa = compositeWeight(a) * (0.60 + entropyRandom() * 0.80);
        const wb = compositeWeight(b) * (0.60 + entropyRandom() * 0.80);
        return wb - wa; // الأثقل أولاً
    });
}

// ============================================================================
// [7] محرك الاختيار الذكي
// ============================================================================
function selectSmart(candidates, count) {
    if (!Array.isArray(candidates) || candidates.length === 0) return [];
    if (count <= 0) return [];
    if (candidates.length <= count) return [...candidates];

    // نمزج بين طريقتين (50/50):
    //  (A) عيّنة مرجّحة رياضية — أكثر عدلاً واحتراماً للاحتمالات
    //  (B) ترتيب مركّب متعدد + قصّ — أكثر حزماً على "الأقل ضغطاً"
    if (entropyRandom() < 0.5) {
        return weightedSampleWithoutReplacement(
            candidates, count, s => compositeWeight(s)
        );
    }
    return multiShuffle(
        [...candidates].sort((a, b) => compositeWeight(b) - compositeWeight(a)),
        2
    ).slice(0, count);
}

// ============================================================================
// [8] تحديث الحالة بعد كل توقع
// ============================================================================
function __updateState(selectedSlots, availableSlots) {
    const ids = selectedSlots.map(s => s.id);
    __FS_STATE.roundCounter += 1;

    // تكرار كل slot
    availableSlots.forEach(s => {
        if (__FS_STATE.slotFrequency[s.id] === undefined) {
            __FS_STATE.slotFrequency[s.id] = 0;
        }
    });
    ids.forEach(id => {
        __FS_STATE.slotFrequency[id] = (__FS_STATE.slotFrequency[id] || 0) + 1;
    });

    // السلاسل
    Object.keys(__FS_STATE.streakCounters).forEach(k => {
        if (!ids.includes(Number(k))) __FS_STATE.streakCounters[k] = 0;
    });
    ids.forEach(id => {
        __FS_STATE.streakCounters[id] = (__FS_STATE.streakCounters[id] || 0) + 1;
    });

    // مسافة هامينغ بين التوقع الحالي والسابق
    if (__FS_STATE.predictionHistory.length > 0) {
        const prev = __FS_STATE.predictionHistory[__FS_STATE.predictionHistory.length - 1];
        const setPrev = new Set(prev);
        const setCurr = new Set(ids);
        let hamming = 0;
        setPrev.forEach(x => { if (!setCurr.has(x)) hamming++; });
        setCurr.forEach(x => { if (!setPrev.has(x)) hamming++; });
        __FS_STATE.hammingHist.push(hamming);
        if (__FS_STATE.hammingHist.length > 15) __FS_STATE.hammingHist.shift();
    }

    // دفع سجل التوقعات
    __FS_STATE.predictionHistory.push(ids);
    if (__FS_STATE.predictionHistory.length > MAX_HISTORY) {
        __FS_STATE.predictionHistory.shift();
    }
}

// ============================================================================
// [9] الدالة الرئيسية — generatePrediction
// ============================================================================
function generatePrediction(slots, previousSelection) {
    try {
        // ------------------------------------------------------------------
        // فحص البيانات
        // ------------------------------------------------------------------
        if (!slots || slots.length === 0) {
            throw new Error("بيانات الفواكه مفقودة أو غير صالحة.");
        }

        // الاستبعاد القطعي: الكرز (4) والبطيخ (6)
        const availableSlots = slots.filter(s => s && s.id !== 4 && s.id !== 6);

        if (availableSlots.length < 4) {
            throw new Error("لا يوجد عدد كافٍ من الفواكه المتاحة بعد الاستبعاد.");
        }

        let selectedSlots = [];

        // ------------------------------------------------------------------
        // الحالة 1 — الجولة الأولى (لا يوجد اختيار سابق)
        // ------------------------------------------------------------------
        if (!previousSelection || previousSelection.length === 0) {
            // 55% عيّنة مرجّحة | 45% ترتيب أقلية — انطلاقة متوازنة
            if (entropyRandom() < 0.55) {
                selectedSlots = weightedSampleWithoutReplacement(
                    availableSlots, 4, s => compositeWeight(s)
                );
            } else {
                selectedSlots = applyMinorityLogic(availableSlots).slice(0, 4);
            }
        }

        // ------------------------------------------------------------------
        // الحالة 2 — الجولات اللاحقة: نمط مرن + ذكاء اختيار
        // ------------------------------------------------------------------
        else {
            const notPickedLastTime = availableSlots.filter(
                s => !previousSelection.includes(s.id)
            );
            const pickedLastTime = availableSlots.filter(
                s => previousSelection.includes(s.id)
            );

            // 11 نمطاً بأوزان مقصودة:
            //   3+1 يبقى الأساس (~36%)
            //   2+2 (~27%) — تنويع
            //   4+0 (~18%) — كسر كامل للتشابه
            //   1+3 (~9%)  — دفع التكرار
            //   0+4 (~9%)  — تثبيت (دفع لإصابة أعلى عندما تكون الثقة بالضغط عالية)
            const patterns = [
                [3, 1], [3, 1], [3, 1], [3, 1],  // 4
                [2, 2], [2, 2], [2, 2],          // 3
                [4, 0], [4, 0],                  // 2
                [1, 3],                          // 1
                [0, 4]                           // 1
            ];
            const chosen = patterns[Math.floor(entropyRandom() * patterns.length)];
            let [wantNotPicked, wantPicked] = chosen;

            // احترام الأحجام الفعلية للمجموعتين
            if (wantNotPicked > notPickedLastTime.length) {
                wantPicked += (wantNotPicked - notPickedLastTime.length);
                wantNotPicked = notPickedLastTime.length;
            }
            if (wantPicked > pickedLastTime.length) {
                wantNotPicked += (wantPicked - pickedLastTime.length);
                wantPicked = pickedLastTime.length;
            }
            wantNotPicked = Math.max(0, Math.min(4, wantNotPicked));
            wantPicked    = Math.max(0, Math.min(4, wantPicked));

            // اختيار ذكي من كل جانب
            const partA = selectSmart(notPickedLastTime, wantNotPicked);
            const partB = selectSmart(pickedLastTime,    wantPicked);
            selectedSlots = partA.concat(partB);

            // تعويض النقص من المتاح
            if (selectedSlots.length < 4) {
                const need = 4 - selectedSlots.length;
                const remaining = availableSlots.filter(s => !selectedSlots.includes(s));
                const extra = selectSmart(remaining, need);
                selectedSlots = selectedSlots.concat(extra);
            }

            // معالجة الفائض (احتياطي)
            if (selectedSlots.length > 4) {
                selectedSlots = selectSmart(selectedSlots, 4);
            }

            // خلط نهائي متعدد المراحل لضمان عدم ثبات المواضع
            selectedSlots = multiShuffle(selectedSlots, 3);
        }

        // ------------------------------------------------------------------
        // فحص أمان نهائي
        // ------------------------------------------------------------------
        if (selectedSlots.length !== 4) {
            throw new Error("فشل في تحديد المواقع (العدد غير مطابق).");
        }

        // تحديث الحالة الداخلية قبل الإرجاع
        __updateState(selectedSlots, availableSlots);

        return selectedSlots;

    } catch (error) {
        console.error("خطأ في خوارزمية التخمين:", error.message);
        return null;
    }
}
