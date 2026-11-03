/* ============================================================
   reviews.js - ملف الآراء المتكامل
   يحتوي على: البيانات + منطق الرندر + الحماية من الأخطاء
   الاستخدام في HTML: <script src="reviews.js"></script>
   ============================================================ */

// ===== قائمة الآراء الثابتة =====
const fawakihReviews = [
  { name: "Ahmed S.", initial: "A", bgColor: "#FF4B4B", textColor: "#FFFFFF", date: "قبل يومين", text: "تطبيق أسطوري! التخمين دقيق جداً وساعدني كثير في غرف الفواكه على يلا لايف. شكراً للمطور على هذا الإبداع." },
  { name: "Mohamed", initial: "M", bgColor: "#FFC0CB", textColor: "#000000", date: "قبل 4 أيام", text: "أفضل تطبيق جربته، الذكاء الاصطناعي Gemini فرق معي بشكل كبير والتطبيق ما يعلق أبداً، يستاهل كل دولار." },
  { name: "Khaled Ali", initial: "K", bgColor: "#FFFFFF", textColor: "#000000", date: "قبل أسبوع", text: "سهل الاستخدام وواجهته مريحة، والدفع آمن جداً. أنصح فيه وبقوة لكل شخص يلعب فواكه." },
  { name: "Omar", initial: "O", bgColor: "#FF4B4B", textColor: "#FFFFFF", date: "قبل أسبوعين", text: "الدعم الفني متجاوبين وسريعين جداً في الرد. التطبيق شغال نار والتخمينات دقتها عالية تفوق الخيال." },
  { name: "Yousef M.", initial: "Y", bgColor: "#2196F3", textColor: "#FFFFFF", date: "قبل 5 ساعات", text: "صراحة أول مرة أستخدم تطبيق تخمين بهذي الدقة، جربته في غرفة فواكه وحصلت على 4 صح من 5. يستاهل التجربة والله." },
  { name: "Sara Ahmed", initial: "S", bgColor: "#9C27B0", textColor: "#FFFFFF", date: "قبل يوم", text: "بنات لا تفوتكم الفرصة، التطبيق حلو مرة وواجهته سهلة حتى اللي مو خبير في التقنية يقدر يستخدمه. الله يعطيهم العافية." },
  { name: "Abu Khalid", initial: "أ", bgColor: "#4CAF50", textColor: "#FFFFFF", date: "قبل 3 أيام", text: "والله يا شباب التطبيق غني عن التعريف. جربت غيره كثير وما وصلت لنفس المستوى. التخمينات مبنية على تحليل حقيقي مو عشوائي." },
  { name: "Hassan", initial: "H", bgColor: "#FF9800", textColor: "#000000", date: "قبل 6 أيام", text: "كنت متخوف أول الأمر من الدفع أونلاين، بس بعد ما جربت النسخة المجانية قررت أشترك. صراحة يستاهل كل ريال." },
  { name: "Nour", initial: "N", bgColor: "#E91E63", textColor: "#FFFFFF", date: "قبل 8 ساعات", text: "ماشاء الله التطبيق تطور كثير عن أول نسخة، صار أسرع وأدق. المطور يهتم بملاحظات المستخدمين فعلاً." },
  { name: "Tariq Al-Sayed", initial: "T", bgColor: "#00BCD4", textColor: "#000000", date: "قبل 10 أيام", text: "من أفضل التطبيقات اللي جربتها في هالمجال. السعر معقول مقارنة بجودة الخدمة. الله يوفق القائمين عليه." },
  { name: "Faisal", initial: "F", bgColor: "#795548", textColor: "#FFFFFF", date: "قبل 3 ساعات", text: "جربت النسخة المدفوعة اليوم وأقدر أقول لكم الفرق واضح جداً. التخمينات أسرع وأكثر دقة. يستاهل الاشتراك." },
  { name: "Mohammed Al-Dosari", initial: "M", bgColor: "#3F51B5", textColor: "#FFFFFF", date: "قبل 12 يوم", text: "تطبيق مرتب ونظيف، ما فيه إعلانات مزعجة. هذا اللي عجبني أكثر شي. بالتوفيق للمطور." },
  { name: "Layla", initial: "L", bgColor: "#FFEB3B", textColor: "#000000", date: "قبل 15 ساعة", text: "صراحة توقعت التطبيق يكون عادي بس تفاجأت بالدقة! خواتي كلهن حملنه بعد ما شفن النتائج معاي." },
  { name: "Abdullah K.", initial: "A", bgColor: "#607D8B", textColor: "#FFFFFF", date: "قبل 5 أيام", text: "الذكاء الاصطناعي Gemini شي ثاني! يحلل الأنماط بشكل احترافي. جربته على أكثر من غرفة والنتائج ثابتة." },
  { name: "Reem", initial: "R", bgColor: "#8BC34A", textColor: "#000000", date: "قبل 20 ساعة", text: "أحسن تطبيق استخدمته في حياتي لهالغرض، والله العظيم ما أبالغ. الواجهة عربية 100% وهذا شي مهم." },
  { name: "Salem", initial: "S", bgColor: "#FF5722", textColor: "#FFFFFF", date: "قبل 7 أيام", text: "ما شاء الله تبارك الله، التطبيق سريع وما يهنق أبداً حتى مع النت الضعيف. جربته على شبكة 3G واشتغل تمام." },
  { name: "Yara", initial: "Y", bgColor: "#673AB7", textColor: "#FFFFFF", date: "قبل 4 أيام", text: "التطبيق سهل وبسيط وما يحتاج شرح، أول ما حملته فهمت كل شي. أحب التصميم النظيف." },
  { name: "Bader", initial: "B", bgColor: "#009688", textColor: "#FFFFFF", date: "قبل 30 دقيقة", text: "توي محمله وصراحة انبهرت من الدقة. 3 تخمينات متتالية كلها صحيحة! ما توقعت هالمستوى." },
  { name: "Mansour Al-Otaibi", initial: "M", bgColor: "#F44336", textColor: "#FFFFFF", date: "قبل 9 أيام", text: "من زمان أدور تطبيق مثل هذا، والله يجزاكم خير على هذا الشغل الاحترافي. أنصح الجميع بتجربته." },
  { name: "Hind", initial: "H", bgColor: "#CDDC39", textColor: "#000000", date: "قبل 2 يوم", text: "أنا مو من النوع اللي يكتب تعليقات بس التطبيق يستاهل. بصراحة فاجأني بمستواه، خاصة إنه عربي." },
  { name: "Waleed", initial: "W", bgColor: "#03A9F4", textColor: "#000000", date: "قبل 11 يوم", text: "جربت النسخة التجريبية وبعدها اشتركت على طول. الدقة ترتفع مع الوقت كل ما استخدمته أكثر. شي عجيب." },
  { name: "Amal", initial: "A", bgColor: "#E040FB", textColor: "#FFFFFF", date: "قبل 18 ساعة", text: "التطبيق مرتب ومفيد، والدفع آمن عبر متجر جوجل. ما واجهت أي مشاكل من ناحية الخصوصية." },
  { name: "Sultan", initial: "S", bgColor: "#FFD600", textColor: "#000000", date: "قبل 14 يوم", text: "أنا شخص كنت أخسر كثير في غرف الفواكه، بعد التطبيق صار عندي استراتيجية واضحة. مشكورين يا شباب." },
  { name: "Rana", initial: "R", bgColor: "#FF1744", textColor: "#FFFFFF", date: "قبل 40 دقيقة", text: "حملته بعد ما نصحتني فيه صديقتي، صراحة ما توقعت هذي الجودة. يعطيكم العافية." },
  { name: "Ziad", initial: "Z", bgColor: "#00E676", textColor: "#000000", date: "قبل 6 أيام", text: "اللي يقول التطبيق مو دقيق ما جربه زين. أنا معي 5 تخمينات صح متتالية اليوم. يحتاج شوية صبر بس النتيجة ممتازة." },
  { name: "Ibrahim", initial: "I", bgColor: "#D500F9", textColor: "#FFFFFF", date: "قبل 13 يوم", text: "تطبيق احترافي وأنا من النوع اللي يجرب كثير تطبيقات. هذا من أفضل اللي مرت علي في السنوات الأخيرة." },
  { name: "Fatima", initial: "F", bgColor: "#FFC107", textColor: "#000000", date: "قبل 1 يوم", text: "بصراحة التطبيق حلو بس أتمنى يضيفون ميزة إشعارات عند التحديثات. غير كذا كل شي ممتاز." },
  { name: "Hamad", initial: "H", bgColor: "#212121", textColor: "#FFFFFF", date: "قبل 3 أيام", text: "ما شاء الله، المطور رد على استفساري بخصوص الاشتراك في أقل من ساعة. خدمة عملاء من الطراز الأول." },
  { name: "Dana", initial: "D", bgColor: "#FF80AB", textColor: "#000000", date: "قبل 25 دقيقة", text: "جربته مع صديقاتي في جلسة، كلنا حملناه وكلنا حصلنا على نتائج حلوة. تحفة التطبيق بمعنى الكلمة." },
  { name: "Nasser", initial: "N", bgColor: "#1DE9B6", textColor: "#000000", date: "قبل 8 أيام", text: "التطبيق شغال زي الفل، ما فيه تعقيد ولا خطوات كثيرة. تختار الغرفة وتحط الأرقام والتحليل يطلع على طول." },
  { name: "Aseel", initial: "A", bgColor: "#B39DDB", textColor: "#000000", date: "قبل 22 ساعة", text: "أنصح كل اللي يلعب فواكه إنه يجربه، صراحة فرق معي من ناحية الفهم والتوقع. شكراً للمطورين." },
  { name: "Rashid", initial: "R", bgColor: "#EF5350", textColor: "#FFFFFF", date: "قبل 16 يوم", text: "بعد شهر من الاستخدام أقدر أقول إن التطبيق يستاهل 5 نجوم بجدارة. التحديثات المستمرة تبين إن المطور يشتغل بجد." },
  { name: "Shahad", initial: "S", bgColor: "#80DEEA", textColor: "#000000", date: "قبل 3 ساعات", text: "أول مرة أستخدامه اليوم وحبيته من أول تجربة. الواجهة حلوة والألوان مريحة للعين." },
  { name: "Majed", initial: "M", bgColor: "#7CB342", textColor: "#FFFFFF", date: "قبل 19 يوم", text: "التطبيق ممتاز بس لو يضيفون ميزة حفظ السجل يكون أحسن. عموماً تجربة أكثر من رائعة." },
  { name: "Lujain", initial: "L", bgColor: "#F06292", textColor: "#FFFFFF", date: "قبل 2 ساعة", text: "بنات اللي تسأل عن تطبيق فواكه موثوق، هذا هو. أنا جربت كذا تطبيق وهذا أفضلهم بلا منازع." },
  { name: "Turki", initial: "T", bgColor: "#5C6BC0", textColor: "#FFFFFF", date: "قبل 4 أيام", text: "التطبيق صار جزء من روتيني اليومي honestly. أفتح يلا لايف وأفتح التطبيق وندخل الغرف مع بعض. يستاهل." },
  { name: "Ghaith", initial: "G", bgColor: "#FF6F00", textColor: "#FFFFFF", date: "قبل 5 ساعات", text: "شغال تمام التمام، أنصح فيه بقوة. الدقة مو كلام فاضي، تحس إن فيه تحليل حقيقي خلف التخمينات." },
  { name: "Hessa", initial: "H", bgColor: "#AA00FF", textColor: "#FFFFFF", date: "قبل أسبوع", text: "التطبيق مريح وواضح، وما فيه إعلانات تقطع عليك. تجربة استخدام راقية صراحة." },
  { name: "Sami", initial: "S", bgColor: "#00897B", textColor: "#FFFFFF", date: "قبل 10 ساعات", text: "جربت النسخة المدفوعة وما ندمت أبداً. الفرق بينها وبين المجانية كبير من ناحية السرعة والدقة." },
  { name: "Nawaf", initial: "N", bgColor: "#F57C00", textColor: "#FFFFFF", date: "قبل 21 يوم", text: "من أفضل الاستثمارات اللي سويتها هالشهر. التطبيق يشتغل بذكاء والدعم الفني محترم." }
];

// ===== دالة الرندر =====
function renderFawakihReviews() {
  const list = document.getElementById('feedbacks-list');
  if (!list) {
    console.warn('[reviews.js] لم يتم العثور على العنصر #feedbacks-list');
    return;
  }

  if (!Array.isArray(fawakihReviews) || fawakihReviews.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#9490B0;padding:20px;">لا توجد آراء حالياً.</div>';
    return;
  }

  let html = '';
  fawakihReviews.forEach(review => {
    html += `
      <div class="feedback-item">
        <div class="feedback-header">
          <div class="feedback-user-info">
            <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.2rem;background-color:${review.bgColor};color:${review.textColor};border:1px solid var(--orange);">
              ${review.initial}
            </div>
            <div>
              <div class="feedback-user-name">${review.name}</div>
              <div class="feedback-date">${review.date}</div>
            </div>
          </div>
        </div>
        <div class="feedback-text">${review.text}</div>
      </div>
    `;
  });
  list.innerHTML = html;
  console.log('[reviews.js] ✅ تم تحميل ' + fawakihReviews.length + ' رأي بنجاح');
}

// ===== تشغيل تلقائي (مع دعم كل الحالات) =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderFawakihReviews);
} else {
  // DOM جاهز مسبقاً (نادر لكن يحصل)
  renderFawakihReviews();
}

// إتاحة الدالة عالمياً للاستخدام اليدوي إن لزم
window.renderFawakihReviews = renderFawakihReviews;
window.fawakihReviews = fawakihReviews;
