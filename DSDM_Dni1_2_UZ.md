# DSDM: 1-2-kun topshiriqlarini bajarish (hujjat qismi)

## 0) Bosqich doirasi
- Format: faqat hujjat ishlari, kod yozilmaydi.
- Davr: 1-2-kunlar.
- Loyiha deadline'i: 8 ish kuni + 2 zaxira kun.

## 1) 1-kun — Kontekst va chegaralar

### 1.1 Kickoff va DSDM bo'yicha kelishuvlar
- Iterativ ishlaymiz, reliz ustuvorligi MoSCoW orqali belgilanadi.
- Talablar o'zgarishi istalgan kunda mumkin, lekin jurnalga qayd qilinadi.
- Qaror qabul qilish qoidasi: avval foydalanuvchi qiymati, keyin murakkablik.
- Nazorat uchrashuvlari: har 2-3 kunda qisqa review.
- 9-10-zaxira kunlari faqat sifatga beriladi (fix, stabilizatsiya, regressiya).

### 1.2 Biznes-keys qoralamasi (1 bet)
Universitetda talabalar va abituriyentlar uchun muhim ma'lumotlar tarqoq: jadval, e'lonlar, akademik natijalar va ma'muriy xizmatlar turli kanallarda joylashgan. Bu kommunikatsiya tezligini pasaytiradi va xodimlarning qo'lda bajaradigan ishlarini ko'paytiradi. Campus Student Website loyihasi yagona raqamli kirish nuqtasiga aylanishi, tushunarli UX berishi va funksiyalarni real qiymat bo'yicha ustuvorlashtirishi kerak.

Birinchi relizning biznes maqsadi: Ochiq eshiklar kuniga qadar barqaror prototip ko'rsatish. U bazaviy akademik va axborot ssenariylarini yopishi kerak (kirish, profil, jadval, baholar, yangiliklar, oddiy hujjat so'rovlari). Bu universitetning raqamli strategiyasiga ishonchni oshiradi va rutin so'rovlar bo'yicha operatsion xarajatlarni kamaytiradi.

### 1.3 Bosqich muvaffaqiyat mezonlari
- 35 ta funksiya uchun kelishilgan MoSCoW jadvali.
- 3-8-kunlar uchun aniq iteratsiya rejasi va nazorat nuqtalari.
- Xatarlar va scope o'zgarishi qoidalari yozma qayd etilgan.

### 1.4 Funksiyalarning qo'pol dekompozitsiyasi (qoralama)
- `Must`: bazaviy kirish, akademik yadro, shaxsiy profil.
- `Should`: demo qiymatini va ma'muriy qulaylikni kuchaytiradigan funksiyalar.
- `Could`: foydali, ammo deadline uchun kritik bo'lmagan funksiyalar.
- `Won't`: og'ir integratsiyalar va yuqori xavfli ijtimoiy/fintex ssenariylar.

## 2) 2-kun — MoSCoW va loyiha karkasi

### 2.1 35 ta funksiya bo'yicha yakuniy MoSCoW

| № | Funksiya | MoSCoW | Asos |
|---|---|---|---|
| 1 | Universitet elektron pochtasi orqali ro'yxatdan o'tish | M | Xavfsiz kirishsiz qolgan ssenariylar ishlamaydi. |
| 2 | Dars jadvali | M | Talabalar uchun kunlik eng muhim ssenariy. |
| 3 | Jadval o'zgarishlari haqida bildirishnomalar | M | Jadval dolzarbligi uchun muhim; soddalashtirilgan in-app formatda beriladi. |
| 4 | Elektron baholash daftarchasi | M | Talaba va ota-onalar uchun bazaviy akademik qiymat. |
| 5 | Baholar va akademik natijalar | M | 8-bandning bevosita davomi, o'quv yadrosi uchun must. |
| 6 | Talaba profili | M | Shaxsiylashtirish va ma'lumotlarga kirishning bazaviy bloki. |
| 7 | Universitet yangiliklari lentasi | S | Imij va xabardorlik uchun muhim, lekin bazaviy use-case'ni to'xtatmaydi. |
| 8 | O'qituvchilar katalogi va kontaktlar | S | Qulaylikni oshiradi, MVPda statik bo'lishi mumkin. |
| 9 | Oshxona — bugungi menyu | S | Foydali, lekin akademik yadro uchun kritik emas. |
| 10 | Talabalar tadbirlari taqvimi | S | Kampus hayoti va demo effekt uchun muhim. |
| 11 | Rasmiy hujjatlar so'rovi (o'qish, yotoqxona) | S | Ma'muriyatning qo'lda ish yukini kamaytiradi. |
| 12 | Hujjat so'rovi holatini kuzatish | S | Hujjat xizmati shaffofligini oshiradi. |
| 13 | Akademik qarzdorlik haqida push-bildirishnomalar | S | Qimmatli, ammo to'liq push-servissiz soddalashtirilgan format yetarli. |
| 14 | E'lonlar taxtasi (darslik sotish/sotib olish) | C | Foydali, ammo asosiy o'quv oqimiga ta'siri past. |
| 15 | Tadbirlarga ro'yxatdan o'tish | C | Vaqtincha havola/forma bilan yopish mumkin. |
| 16 | Portfolio / yutuqlar | C | Qimmatli, lekin yadroga zarar bermasdan kechiktiriladi. |
| 17 | Talabalar kengashi yangiliklari | C | Umumiy yangiliklar lentasiga qo'shish mumkin. |
| 18 | Yo'qolgan va topilgan narsalar | C | Keyinroq qo'shish oson, kechiktirish xavfi past. |
| 19 | Sport seksiyalari jadvali | C | Ikkinchi darajali funksional, keyinga surish mumkin. |
| 20 | Sport seksiyalariga yozilish | C | Birinchi reliz uchun kritik emas, tashkiliy jarayonlarga bog'liq. |
| 21 | Qorong'u mavzu (Dark mode) | C | UX yaxshilaydi, lekin funksional bloklovchi emas. |
| 22 | Navigatsiyali kampus xaritasi | W | Foydali, ammo alohida katta hajm va ma'lumot talab qiladi. |
| 23 | O'qituvchiga maslahatga yozilish | W | Kalendar, tasdiqlash va bildirishnoma murakkablikni oshiradi. |
| 24 | Oshxona — oldindan ovqat buyurtma qilish | W | To'lov va operatsion logika joriy muddatdan tashqarida. |
| 25 | Mustaqil tayyorgarlik uchun auditoriya bron qilish | W | Rejalashtirish va konfliktlar murakkabligi yuqori. |
| 26 | Kutubxona — kitob qidirish va bron qilish | W | Tashqi integratsiya va ma'lumot sinxronizatsiyasi talab qilinadi. |
| 27 | Guruh chatlari | W | Real-time, moderatsiya, xavfsizlik va yuklama talab etadi. |
| 28 | Umumiy kampus chati | W | Kontent va masshtablash risklari yanada yuqori. |
| 29 | Guruhdoshlarni topish | W | Ijtimoiy kontur deadline ustuvorligida emas. |
| 30 | Veb-sayt orqali yotoqxona to'lovini amalga oshirish | W | Fintex, xavfsizlik va huquqiy talablar juda hajmli. |
| 31 | Talabalar kengashi tashabbuslari uchun ovoz berish | W | Ishonchlilik va auditga talab juda yuqori. |
| 32 | Anonim psixologik yordam chati | W | Yuqori sezgirlik, xavfsizlik va eskalatsiya talablari bor. |
| 33 | Talabalarning akademik reytingi | W | Faqat so'rov bo'lsa qo'shiladi; bahsli va murakkab logika. |
| 34 | Telegram-bot integratsiyasi | W | Tashqi integratsiya MVP muddatiga sig'maydi. |
| 35 | Ko'p tilli qo'llab-quvvatlash (o'zbek / rus / ingliz) | W | Juda qat'iy muddatda MVP uchun keyinga qoldirilishi mumkin, agar ruscha bazaviy versiya bo'lsa. |

### 2.2 3-8-kunlar uchun iteratsiya rejasi va nazorat nuqtalari
- **3-5-kunlar (Must-iteratsiya):** jadvaldagi `1-6` funksiyalar (kirish yadrosi va akademik blok), bazaviy UX, skvoznoy o'tishlar.
- **6-kun (Should-iteratsiya):** jadvaldagi `7-13` funksiyalar + QA 1-to'lqin.
- **7-kun (talab o'zgarishi):** kutilmagan so'rovni qayta rejalashtirish, scope trade-offlarini qayd qilish.
- **8-kun (stabilizatsiya):** freeze, P1/P2 bugfix, regressiya, RC.

Nazorat nuqtalari:
- Checkpoint A (2-kun oxiri): MoSCoW va risklar kelishilgan.
- Checkpoint B (5-kun oxiri): Must-inkrement tayyor.
- Checkpoint C (6-kun oxiri): Should-yaxshilanishlar va bug-list tayyor.
- Checkpoint D (8-kun oxiri): zaxira oldidan barqaror RC tayyor.

### 2.3 O'qituvchi bilan qisqa review (fiksatsiya)
**O'qituvchi izohi:**  
"Nega elektron baholash daftarchasi Mustda? Hatto bazaviy API-integratsiya ham bir necha kun olishi mumkin. Qayta ko'rib chiqing."

**Jamoa qarori:**  
- Funksiyani `Must`da qoldiramiz, chunki u asosiy qiymat blokidir, lekin hajmini cheklaymiz.  
- MVP uchun soddalashtirilgan variantni ishlatamiz (murakkab integratsiyasiz agregat akademik ma'lumotlar).  
- Integratsiya riski alohida baho bilan post-MVP backlog'ga ko'chiriladi.
