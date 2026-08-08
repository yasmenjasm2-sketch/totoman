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

        // ----------------- التعديل الجديد (نظام الأقلية) -----------------
        // دالة مساعدة لدعم الفواكه التي يضغط عليها "أقل عدد من الأشخاص" (الأقلية)
        const applyMinorityLogic = (array) => {
            let shuffled = shuffleArray(array); // نبدأ بخلط عشوائي
            
            // بنسبة 80% نطبق خوارزمية "الأقلية" لدعم الفواكه ذات العدد الأقل
            // والـ 20% الباقية تبقى عشوائية بالكامل لضمان التنوع وعدم كشف النمط
            if (Math.random() > 0.20) {
                shuffled.sort((a, b) => {
                    // جلب عدد الأشخاص من المتغير العالمي في ملف HTML إذا كان متوفراً
                    let amountA = (typeof slotAmounts !== 'undefined' && slotAmounts[a.id]) ? slotAmounts[a.id] : 0;
                    let amountB = (typeof slotAmounts !== 'undefined' && slotAmounts[b.id]) ? slotAmounts[b.id] : 0;
                    
                    // (إجراء احتياطي): إذا لم يتم العثور على المتغير، نقلل الكرز(4) والبطيخ(6) كوزن عالي افتراضي
                    if (typeof slotAmounts === 'undefined') {
                        amountA = (a.id === 4 || a.id === 6) ? 999999 : 0;
                        amountB = (b.id === 4 || b.id === 6) ? 999999 : 0;
                    }

                    // إضافة عامل عشوائي بسيط جداً (±15%) للقيم حتى تظل هناك حيوية إذا تساوت الأرقام
                    let randomizedA = amountA * (0.85 + Math.random() * 0.3);
                    let randomizedB = amountB * (0.85 + Math.random() * 0.3);

                    // الترتيب تصاعدي: الفاكهة ذات العدد "الأقل" ستصعد لأول القائمة (لتفوز بالتخمين)
                    return randomizedA - randomizedB;
                });
            }
            return shuffled;
        };
        // --------------------------------------------------

        let selectedSlots = [];

        // خوارزمية اختيار الفواكه العشوائية
        if (!previousSelection || previousSelection.length === 0) {
            // التخمين الأول (استخدام دالة الأقلية)
            selectedSlots = applyMinorityLogic(slots).slice(0, 4);
        } else {
            // التخمينات المعتمدة على الجولات السابقة
            let notPickedLastTime = slots.filter(s => !previousSelection.includes(s.id));
            let pickedLastTime = slots.filter(s => previousSelection.includes(s.id));
            
            // تطبيق خوارزمية تقليل الظهور (الأقلية) على المجموعتين
            notPickedLastTime = applyMinorityLogic(notPickedLastTime);
            pickedLastTime = applyMinorityLogic(pickedLastTime);
            
            // اختيار 3 من الفواكه التي لم تظهر المرة السابقة، وواحدة ظهرت
            selectedSlots = notPickedLastTime.slice(0, 3).concat(pickedLastTime.slice(0, 1));
            
            // خلط النتيجة النهائية حتى لا تكون الفاكهة المكررة دائماً في نفس الترتيب
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
