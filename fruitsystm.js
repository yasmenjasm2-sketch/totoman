/**
 * ============================================================================
 * fruitsystm.js
 * ملف العقل الرئيسي المستقل لخوارزمية التخمين — النسخة الاحترافية
 * ============================================================================
 *  ▸ إصلاح: ضمان إرجاع 3 مؤشرات علوية دائماً حتى لو كانت البيانات السابقة غير مكتملة
 *  ▸ إصلاح: التحقق من وجود المؤشرات السفلية قبل الإرجاع
 * ============================================================================
 */

function secureRandom() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            return arr[0] / 4294967296;
        }
    } catch (_) { }
    return Math.random();
}

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
    const safePasses = Math.max(1, Math.min(5, passes | 0));
    for (let p = 0; p < safePasses; p++) {
        result = shuffleArray(result);
    }
    return result;
}

function getSlotAmount(slotId) {
    if (typeof slotAmounts === 'undefined' || !slotAmounts) return 0;
    const value = slotAmounts[slotId];
    return (value === undefined || value === null) ? 0 : Number(value) || 0;
}

function applyMinorityLogic(slots) {
    if (!Array.isArray(slots) || slots.length === 0) return [];
    const shuffled = multiShuffle(slots, 3);
    if (secureRandom() <= 0.35) {
        return multiShuffle(shuffled, 2);
    }
    return shuffled.sort((a, b) => {
        const jitteredA = getSlotAmount(a.id) * (0.70 + secureRandom() * 0.60);
        const jitteredB = getSlotAmount(b.id) * (0.70 + secureRandom() * 0.60);
        return jitteredA - jitteredB;
    });
}

function generatePrediction(slots, previousSelection) {
    try {
        if (!Array.isArray(slots) || slots.length === 0) {
            console.error("خطأ: بيانات الفواكه مفقودة.");
            return null;
        }

        const topGroupIds = [1, 2, 3, 5]; // ليمون، توت، كيوي، برقوق
        const bottom1Ids = [4, 6];        // كرز، بطيخ
        const bottom2Ids = [7, 8];        // موز، فراولة

        const topSlotsAvailable = slots.filter(s => s && topGroupIds.includes(s.id));
        const bottom1Available = slots.filter(s => s && bottom1Ids.includes(s.id));
        const bottom2Available = slots.filter(s => s && bottom2Ids.includes(s.id));

        if (topSlotsAvailable.length < 3 || bottom1Available.length === 0 || bottom2Available.length === 0) {
            console.error("خطأ: بيانات الفواكه غير مكتملة.");
            return null;
        }

        let selectedTopSlots = [];

        if (!previousSelection || previousSelection.length === 0) {
            selectedTopSlots = applyMinorityLogic(topSlotsAvailable).slice(0, 3);
        } else {
            const notPickedLastTime = topSlotsAvailable.filter(s => !previousSelection.includes(s.id));
            const pickedLastTime = topSlotsAvailable.filter(s => previousSelection.includes(s.id));

            let partA = applyMinorityLogic(notPickedLastTime);
            let partB = applyMinorityLogic(pickedLastTime);

            selectedTopSlots = partA.concat(partB);

            // إزالة التكرارات إن وجدت (لضمان عدم تكرار نفس المؤشر)
            const uniqueSelected = [];
            const seenIds = new Set();
            for (const slot of selectedTopSlots) {
                if (!seenIds.has(slot.id)) {
                    seenIds.add(slot.id);
                    uniqueSelected.push(slot);
                }
            }
            selectedTopSlots = uniqueSelected.slice(0, 3);
        }

        // إذا كان العدد أقل من 3 لأي سبب، نكمل من المتبقي
        if (selectedTopSlots.length < 3) {
            const remaining = shuffleArray(
                topSlotsAvailable.filter(s => !selectedTopSlots.some(sel => sel.id === s.id))
            );
            const needed = 3 - selectedTopSlots.length;
            selectedTopSlots = selectedTopSlots.concat(remaining.slice(0, needed));
        }

        if (selectedTopSlots.length !== 3) {
            console.error("خطأ: فشل في تحديد 3 مواقع علوية.");
            return null;
        }

        const selectedBottom1 = bottom1Available[Math.floor(secureRandom() * bottom1Available.length)];
        const selectedBottom2 = bottom2Available[Math.floor(secureRandom() * bottom2Available.length)];

        return {
            topSlots: selectedTopSlots,
            bottomSlot1: selectedBottom1,
            bottomSlot2: selectedBottom2
        };

    } catch (error) {
        console.error("خطأ في خوارزمية التخمين:", error);
        return null;
    }
}
