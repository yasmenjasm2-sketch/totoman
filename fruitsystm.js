/**
 * fruitsystm.js
 * ملف العقل الرئيسي المستقل لخوارزمية التخمين
 */

// دالة لخلط المصفوفات لضمان العشوائية
function shuffleArray(array) {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// الخوارزمية الأساسية المستقلة
function generatePrediction(slots, previousSelection) {
    try {
        // التحقق من وجود بيانات الفواكه الأساسية
        if (!slots || slots.length === 0) {
            throw new Error("بيانات الفواكه مفقودة أو غير صالحة.");
        }

        // --- التعديل: تقليل ظهور الكرز والبطيخ ---
        // ⚠️ مهم: قم بتغيير 'cherry_id' و 'watermelon_id' إلى المعرفات (IDs) الحقيقية للكرز والبطيخ في نظامك
        const highWeightFruits = ['cherry_id', 'watermelon_id']; 
        
        // دالة مساعدة لترتيب الفواكه ودفع الكرز والبطيخ لنهاية القائمة لتقليل فرصة اختيارها
        const applyLowProbability = (array) => {
            let shuffled = shuffleArray(array);
            // بنسبة 75% سيتم إرجاع الكرز والبطيخ لآخر القائمة حتى لا يتم سحبهما
            if (Math.random() > 0.25) {
                shuffled.sort((a, b) => {
                    let aIsHeavy = highWeightFruits.includes(a.id) ? 1 : 0;
                    let bIsHeavy = highWeightFruits.includes(b.id) ? 1 : 0;
                    return aIsHeavy - bIsHeavy; // الفواكه ذات الوزن العالي تعود للخلف
                });
            }
            return shuffled;
        };
        // ----------------------------------------

        let selectedSlots = [];

        // خوارزمية اختيار الفواكه العشوائية
        if (!previousSelection || previousSelection.length === 0) {
            // التخمين الأول (استخدام الدالة المعدلة)
            selectedSlots = applyLowProbability(slots).slice(0, 4);
        } else {
            // التخمينات المعتمدة على الجولات السابقة
            let notPickedLastTime = slots.filter(s => !previousSelection.includes(s.id));
            let pickedLastTime = slots.filter(s => previousSelection.includes(s.id));
            
            // استخدام الدالة المعدلة بدلًا من الخلط العشوائي البسيط لتقليل ظهور الكرز والبطيخ
            notPickedLastTime = applyLowProbability(notPickedLastTime);
            pickedLastTime = applyLowProbability(pickedLastTime);
            
            // اختيار 3 من الفواكه التي لم تظهر المرة السابقة، وواحدة ظهرت
            selectedSlots = notPickedLastTime.slice(0, 3).concat(pickedLastTime.slice(0, 1));
            selectedSlots = shuffleArray(selectedSlots);
        }

        // اختبار الأمان: التأكد أن الخوارزمية قامت باختيار 4 فواكه بالضبط
        if (selectedSlots.length !== 4) {
            throw new Error("فشل في تحديد المواقع (العدد غير مطابق).");
        }

        return selectedSlots; // إرجاع التخمين الناجح للشاشة
        
    } catch (error) {
        console.error("خطأ في خوارزمية التخمين:", error.message);
        return null; // إرجاع القيمة فارغة حتى تظهر رسالة الخطأ للمستخدم
    }
}
