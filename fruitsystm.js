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

        let selectedSlots = [];

        // خوارزمية اختيار الفواكه العشوائية
        if (!previousSelection || previousSelection.length === 0) {
            // التخمين الأول
            selectedSlots = shuffleArray(slots).slice(0, 4);
        } else {
            // التخمينات المعتمدة على الجولات السابقة
            let notPickedLastTime = slots.filter(s => !previousSelection.includes(s.id));
            let pickedLastTime = slots.filter(s => previousSelection.includes(s.id));
            
            notPickedLastTime = shuffleArray(notPickedLastTime);
            pickedLastTime = shuffleArray(pickedLastTime);
            
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
