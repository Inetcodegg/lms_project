# LOYIHA TOPSHIRIG'I
## DSDM metodologiyasini amaliyotda qo'llash
Bakalavr talabalari (kichik kurslar) — semestr loyihasi

## 1. Vaziyat va kontekst
Universitet kampus veb-sayti uchun qat'iy byudjet ajratilgan. Ma'muriyat uni 8 ish kuni va 2 kunlik zaxira bilan — Ochiq eshiklar kunida taqdim etmoqchi. Bu sana ko'chirilmaydi: tadbirda abituriyentlar, ota-onalar va matbuot vakillari qatnashadi.

Siz — ishlab chiqish jamoasisiz. Buyurtmachi (o'qituvchi) raqamlashtirish bo'yicha prorektor rolini bajaradi. U juda band: faqat har 2-3 kunda qisqa reviewlarda qatnashadi va istalgan paytda talablarni o'zgartirishi mumkin.

## 2. Loyiha maqsadi
DSDM metodologiyasidan foydalanib, **Campus Student Website** prototipini yarating. Asosiy o'quv maqsadlari:
- Real cheklovlar sharoitida MoSCoW ustuvorlashtirish
- Qat'iy muddatlar bilan iterativ yetkazib berish
- O'zgaruvchan talablarga moslashish
- Jarayon davomida manfaatdor tomonlarni jalb qilish

## 3. Jamoa rollari (5-6 talaba)
| Rol | Jamoa a'zosi | Vazifalar | Ishtirokchilar |
|---|---|---|---|
| Jamoa lideri | Talaba A | Iteratsiyalarni boshqaradi, muddatlarni kuzatadi, stand-up o'tkazadi | Begzad |
| Mahsulot vizioneri | Talaba B | Umumiy yo'nalishni ushlab turadi, loyiha doirasini nazorat qiladi | Muslima, Fariza |
| Foydalanuvchi vakili | Talaba C | Reviewlarda foydalanuvchilar nomidan gapiradi | Sanjar, Nodirbek |
| Texnik koordinator | Talaba D | Arxitektura va texnik qarorlar uchun javob beradi | Fariza, Begzad |
| Dasturchilar | Talabalar E, F | Funksiyalarni amalga oshiradi, prototip yaratadi | Muhammad, Bahodir, Begzad, Fariza |

O'qituvchi quyidagi rollarni bajaradi: **Homiy + Maslahatchi** (byudjetni tasdiqlaydi, reviewlarda qatnashadi, talablarni o'zgartiradi).

## 4. Funksiyalar ro'yxati (35 ta funksiya — ustuvorliksiz)
Jamoaning birinchi vazifasi — barcha 35 funksiyaga MoSCoW qo'llash va har bir qarorni asoslash. Quyida ro'yxat ustuvorlik belgilarsiz keltirilgan:

- Universitet elektron pochtasi orqali ro'yxatdan o'tish
- Universitet yangiliklari lentasi
- Dars jadvali
- Jadval o'zgarishlari haqida bildirishnomalar
- Navigatsiyali kampus xaritasi
- O'qituvchilar katalogi va kontaktlar
- O'qituvchiga maslahatga yozilish
- Elektron baholash daftarchasi
- Baholar va akademik natijalar
- Oshxona — bugungi menyu
- Oshxona — oldindan ovqat buyurtma qilish
- Mustaqil tayyorgarlik uchun auditoriya bron qilish
- Kutubxona — kitob qidirish va bron qilish
- E'lonlar taxtasi (darslik sotish/sotib olish)
- Talabalar tadbirlari taqvimi
- Tadbirlarga ro'yxatdan o'tish
- Guruh chatlari
- Umumiy kampus chati
- Guruhdoshlarni topish
- Talaba profili
- Portfolio / yutuqlar
- Rasmiy hujjatlar so'rovi (o'qish, yotoqxona)
- Hujjat so'rovi holatini kuzatish
- Veb-sayt orqali yotoqxona to'lovini amalga oshirish
- Talabalar kengashi yangiliklari
- Talabalar kengashi tashabbuslari uchun ovoz berish
- Yo'qolgan va topilgan narsalar
- Anonim psixologik yordam chati
- Sport seksiyalari jadvali
- Sport seksiyalariga yozilish
- Qorong'u mavzu (Dark mode)
- Ko'p tilli qo'llab-quvvatlash (o'zbek / rus / ingliz)
- Akademik qarzdorlik haqida push-bildirishnomalar
- Talabalarning akademik reytingi
- Telegram-bot integratsiyasi

## 5. Kalendar reja (8 ish kuni + 2 zaxira kun)
Quyidagi reja notekis yuklama asosida tuzilgan: murakkab bloklarga ko'proq vaqt ajratilgan, yengil vazifalar esa ixcham guruhlangan.

### 1-kun (o'rtacha yuklama) — Kontekst va chegaralar
- Kickoff, rollar, DSDM bo'yicha kelishuvlar
- Biznes-keysning qoralamasi va muvaffaqiyat mezonlari
- Funksiyalarni Must/Should/Could/Won't bo'yicha qo'pol dekompozitsiya

### 2-kun (yuqori yuklama) — MoSCoW va loyiha karkasi
- 35 ta funksiya uchun MoSCoWni yozma asoslari bilan yakunlang
- 3-8-kunlar uchun iteratsiya rejasini tuzing va nazorat nuqtalarini belgilang
- O'qituvchi bilan qisqa review o'tkazing

O'qituvchining kutilayotgan reaktsiyasi:  
"Nega elektron baholash daftarchasi Mustda? Hatto bazaviy API-integratsiya ham bir necha kun olishi mumkin. Qayta ko'rib chiqing." — Talabalar qarorni yo asoslaydi, yo qayta ko'rib chiqadi.

### 3-5-kunlar (juda yuqori yuklama) — Must funksiyalarni asosiy amalga oshirish
- Asosiy foydalanuvchi oqimini yarating: kirish, profil, jadval, baholar
- Must funksiyalar bo'yicha kliklanadigan prototip/ishlaydigan MVP yig'ing
- Ko'p tillilikning bazaviy darajasi va ekranlar bog'liqligini ishga tushiring
- 5-kun oxirida Must-inkrement reviewini o'tkazing

Kutilayotgan fikr-mulohaza:  
"Jadval ko'rsatilmoqda, lekin kunlar bo'yicha filtr yo'q — bu noqulay. Keyingi iteratsiyada qo'shing."

### 6-kun (yuqori yuklama) — Should + QA 1-to'lqin
- Foydalanuvchi qiymati yuqori bo'lgan Should funksiyalarni qo'shing
- Ichki QA o'tkazing va defektlarni ustuvorlik bo'yicha qayd qiling (P1/P2/P3)
- Backlog va fix rejasini yangilang

### 7-kun (juda yuqori yuklama) — Talab o'zgarishi + qayta rejalashtirish
Kun o'rtasida o'qituvchi quyidagi xabarni yuboradi:  
"Rektor prototipni ko'rdi va talabalar akademik reytingini qo'shishni xohlaydi — bu Ochiq eshiklar kuni uchun muhim. Kiriting."

- Scope'ni qayta ustuvorlashtiring: muddatga sig'ish uchun Could/Shoulddan nimani chiqarasiz
- Qarorni talablar o'zgarishi jurnalida yozma qayd qiling
- Yangi talabning minimal yetarli variantini amalga oshiring

### 8-kun (yuqori yuklama) — Zaxira oldidan stabilizatsiya
- Feature freeze: kritik holatlardan tashqari yangi funksiyalar qo'shilmaydi
- Ustuvor defektlarni tuzating (P1/P2)
- Integratsion va regressiya tekshiruvini bajaring
- Zaxira kunlariga kirish uchun barqaror reliz-kandidat (RC) tayyorlang

### 9-10-zaxira kunlar (yakuniy deadline oldidan, mahsulotni yaxshilash uchun)
- Faqat mahsulot sifatini yaxshilash uchun ishlatiladi, taqdimotga tayyorgarlik uchun emas
- Qolgan xatolarni yoping, qayta regressiya o'tkazing, UX dagi noqulayliklarni bartaraf eting
- Zarurat bo'lsa, unumdorlik va ishonchlilikni optimallashtiring

## 6. Artefaktlar va muddatlar
| Artefakt | Muddat | Format |
|---|---|---|
| MoSCoW jadvali va asoslar | 2-kun | Hujjat / jadval |
| Biznes-keys (1 bet) | 2-kun | Hujjat |
| Talablar o'zgarishi jurnali | Doimiy | Hujjat |
| Prototip / ishlaydigan mahsulot | 10-kun (zaxira oxiri) | Figma yoki kod |
| Retrospektiva: DSDMdan nimani o'rgandik | 9 yoki 10-zaxira kuni | Hujjat (1-2 bet) |

## 7. Baholash mezonlari
| Mezon | Ball | Ulush |
|---|---|---|
| MoSCoW jadvali va asoslar sifati | 25 | 25% |
| Talab o'zgarishiga reaksiya (7-kun inqirozi) | 20 | 20% |
| Muddatga rioya qilish (uzaytirish so'ramaslik) | 20 | 20% |
| Yakuniy prototip sifati | 20 | 20% |
| Retrospektiva — DSDM bo'yicha refleksiya | 15 | 15% |
| **JAMI** | **100** | **100%** |

## 8. O'qituvchi uchun eslatmalar
Simulyatsiya real bo'lishi uchun loyiha davomida uchta qoidaga amal qiling:

- Deadline'ni hech qachon ko'chirmang — talabalar so'rasa ham. Bu bosim DSDM o'rganishining kalitidir.
- Talablarni kamida bir marta o'zgartiring (7-kun inqirozi). Busiz talabalar oddiy loyihadan farqni his qilmaydi.
- Har bir reviewda noqulay savollar bering: "Nega aynan shu?", "Vaqt yetmasa nimani qisqartirasiz?" — bu real ustuvorlashtirish ko'nikmasini rivojlantiradi.

Maqsad ideal mahsulot yaratish emas. Maqsad — real cheklovlar ostida qiymatni o'z vaqtida yetkazishni o'rganish.
