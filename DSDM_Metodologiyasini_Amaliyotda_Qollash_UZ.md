# DSDM metodologiyasini amaliyotda qo'llash: Campus Student Mobile Application

**Ishlab chiqish guruhi:** Begzad’s group  
**Mijoz:** Sanjar Shukurov

**Loyiha nomi:** Campus Student App (Prototip)  
**Muddat:** 5 hafta (Ochiq eshiklar kuniga qat'iy bog'langan)  
**Metodologiya:** DSDM (Dynamic Systems Development Method)  
**Buyurtmachi:** raqamlashtirish bo'yicha prorektor

## Kirish

Hozirgi holatda talabalar, ota-onalar va abituriyentlar uchun ma'lumotlar tarqoq: dars jadvallari veb-saytda, e'lonlar doskalarda, hujjatlar so'rovlari ofisda, akademik natijalar esa alohida tizimda. Bunday tarqoqlik kommunikatsiyani sekinlashtiradi, ma'muriy yukni oshiradi va universitetning zamonaviy raqamli qiyofasini susaytiradi.  
Ochiq eshiklar kuni matbuot, ota-onalar va abituriyentlar ishtirokida o'tadi: universitet raqamlashtirish strategiyasini amalda ko'rsatishi shart. Ilova prototipi bu vazifani vizual, interaktiv va tezkor tarzda hal qiladi.

## Funksiyalar va MoSCoW ustuvorlashtirish

| №  | Funksiya                                                   | MoSCoW | Asos (5 hafta, Ochiq eshiklar, DSDM)                                                                                   |
|----|------------------------------------------------------------|--------|-------------------------------------------------------------------------------------------------------------------------|
| 1  | Universitet elektron pochta orqali ro'yxatdan o'tish      | M      | Xavfsiz kirishsiz ilova ishlamaydi. MVP uchun minimal autentifikatsiya yetarli.                                       |
| 2  | Dars jadvali                                               | M      | Talabalar uchun eng ko'p so'raladigan funksiya. Prototipda statik JSON/CSV bilan yechiladi.                           |
| 3  | Jadval o'zgarishlari haqida bildirishnomalar              | M      | Muhim, ammo 5 haftada real-time push integratsiyasi riskli. Vaqtincha in-app banner/email bilan yopiladi.             |
| 4  | Elektron baholash kitobi                                   | M      | Ota-onalar va abituriyentlar uchun asosiy ko'rsatkich. Mock ma'lumot bilan demo qilish mumkin.                        |
| 5  | Baholar va akademik natijalar                              | M      | 8-band bilan bog'liq. MVPda asosiy ko'rsatkichlar (GPA, fanlar ro'yxati) ko'rsatiladi.                                |
| 6  | Talaba profili                                             | M      | Shaxsiylashtirish, sozlamalar va kirish ma'lumotlari uchun asosiy blok.                                               |
| 7  | Universitet yangiliklari lentasi                           | S      | Ochiq eshiklar kuni universitet hayotini jonli ko'rsatish uchun markaziy kontent.                                     |
| 8  | O'qituvchilar katalogi va kontaktlar                       | S      | Talabalar uchun zarur, ammo MVPda dinamik yangilanish o'rniga statik ro'yxat yetarli.                                 |
| 9  | Oshxona - bugungi menyu                                    | S      | Foydali, ammo kundalik yangilanish tizimi MVP uchun ortiqcha. Keyingi iteratsiyaga o'tkaziladi.                       |
| 10 | Talabalar tadbirlari taqvimi                               | S      | Kampus hayotini ko'rsatish uchun muhim. MVPda statik taqvim formatida yopiladi.                                        |
| 11 | Rasmiy hujjatlar so'rovi (o'qish, yotoqxona)               | S      | Ma'muriy yukni kamaytiradi. MVPda oddiy forma + yuborish funksiyasi yetarli.                                           |
| 12 | Hujjat so'rovi holatini kuzatish                           | S      | 22-band bilan bog'liq. Shaffoflikni oshiradi. Holatlar: Kutilmoqda / Jarayonda / Tayyor.                              |
| 13 | Akademik qarzdorlik haqida push-bildirishnomalar           | S      | Muhim, lekin real push servis va backend logikasi 5 haftada riskli. In-app ogohlantirish bilan yopiladi.              |
| 14 | E'lonlar taxtasi (darsliklar sotish/sotib olish)           | C      | Ijtimoiy funksiya. MVP uchun past ustuvorlik. Keyinroq qo'shiladi.                                                     |
| 15 | Tadbirlarga ro'yxatdan o'tish                              | C      | Registratsiya logikasi va kvota boshqaruvi murakkab. Hozircha tashqi havola yetarli.                                  |
| 16 | Portfolio / yutuqlar                                       | C      | Rekrutment uchun foydali, ammo MVP uchun ixtiyoriy. Keyingi bosqichda.                                                 |
| 17 | Talabalar kengashi yangiliklari                            | C      | Asosiy yangiliklar lentasiga birlashtirilishi mumkin. Alohida modul hozircha kerak emas.                              |
| 18 | Yo'qolgan va topilgan narsalar                             | C      | Oddiy forma + ro'yxat bilan yopilishi mumkin. Ta'siri past.                                                             |
| 19 | Sport seksiyalari jadvali                                  | C      | Tadbirlar taqvimiga integratsiya qilinishi mumkin. Alohida modul kechiktiriladi.                                       |
| 20 | Sport seksiyalariga yozilish                               | C      | Ro'yxatga olish logikasi murakkab. Hozircha ma'lumot ko'rsatish yetarli.                                               |
| 21 | Qorong'u mavzu (Dark mode)                                 | C      | UX yaxshilanadi, ammo funksional ta'siri yo'q. 5 haftada ixtiyoriy.                                                    |
| 22 | Navigatsiyali kampus xaritasi                              | W      | Ochiq eshiklar uchun foydali, ammo GPS/3D navigatsiya ko'p vaqt talab qiladi. Statik xarita va yo'l ko'rsatkich yetarli. |
| 23 | O'qituvchi bilan maslahat olish uchun yozilish             | W      | Kalendar, tasdiqlash va eslatma tizimi talab qilinadi. 5 haftaga mos emas.                                             |
| 24 | Oshxona - taomni oldindan buyurtma qilish                  | W      | To'lov, inventarizatsiya va real-time holat talab qilinadi. Joriy doiradan tashqarida.                                |
| 25 | O'z-o'zini tayyorlash uchun auditoriya bron qilish         | W      | Murakkab kalendarlar, konflikt tekshiruvi va ruxsatlar tizimi talab etiladi. 5 haftaga mos emas.                      |
| 26 | Kutubxona - kitob qidirish va bron qilish                  | W      | Tashqi kutubxona API/ma'lumotlar bazasi integratsiyasi zarur.                                                           |
| 27 | Guruh bo'yicha chatlar                                     | W      | Real-time chat, moderatsiya, xavfsizlik va server yuklamasi talab qiladi. MVP doirasida emas.                         |
| 28 | Umumiy kampus chati                                        | W      | Yuqori risk, kontent nazorati va masshtablash muammolari bor.                                                           |
| 29 | Guruh do'stlarini topish                                   | W      | Ijtimoiy tarmoq funksiyasi. Joriy maqsadga mos emas va vaqt talab qiladi.                                               |
| 30 | Ilova orqali yotoqxona to'lovini amalga oshirish           | W      | Moliyaviy integratsiya, PCI-DSS va xavfsizlik sertifikatlari talab qilinadi.                                           |
| 31 | Talabalar kengashi tashabbuslari uchun ovoz berish         | W      | Ovoz berish tizimi, autentifikatsiya va natija shaffofligi murakkab.                                                    |
| 32 | Anonim psixologik yordam chati                             | W      | Talabalar farovonligi uchun muhim, ammo hozircha tashqi havola yoki oddiy forma bilan boshlanadi.                     |
| 33 | Ko'p tilli qo'llab-quvvatlash (O'zbek / Rus / Ingliz)      | W      | Ochiq eshiklar kuni xalqaro va mahalliy auditoriya ishtirok etadi. Demo uchun shart.                                   |
| 34 | Talabalarning akademik reytingi                            | W      | Siyosiy/huquqiy noziklik bor, hisoblash algoritmi murakkab. Keyingi bosqichga o'tkaziladi.                            |
| 35 | Telegram-bot integratsiyasi                                | W      | Tashqi API, webhook va sinxronizatsiya talab qilinadi. MVP doirasiga kirmaydi.                                         |

## Reja

## 1-HAFTA: Poydevor va dizayn arxitekturasi

| Kun        | Faoliyatlar                                                                                                                                                   | Chiqish (Output)                                                              |
|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Dushanba   | • Loyiha strukturasi va DSDM jamoa kelishuvi<br>• Auth (1) va Profil (20) wireframe'lari<br>• Navigatsiya xaritasi (flowchart)                              | UI tizimi (ranglar, tipografiya, spacing)<br>Bosh sahifa -> Profil/Auth oqimi |
| Seshanba   | • Dars jadvali (3) va Bildirishnomalar (4) ekran dizayni<br>• Mock ma'lumot tuzilmasi (JSON/CSV)<br>• In-app banner simulyatsiyasi konsepti                 | Jadval va bildirishnoma statik dizaynlari<br>Ma'lumot modeli tasdiqlandi       |
| Chorshanba | • Baholash kitobi (8) va Akademik natijalar (9) UI<br>• Ko'p tilli tizim (32) kalitlari va fallback logikasi<br>• Sahifalar orasidagi transitions            | Akademik bloklar tayyor<br>i18n strukturasi joylashtirildi                     |
| Payshanba  | • Figma/prototip dasturida ekranlarni birlashtirish<br>• Hover, tap, scroll, loading state holatlari<br>• Internal flow testi (jamoa a'zolari)               | Kliklanadigan prototip v1.0<br>5 ta asosiy oqim sinovdan o'tdi                 |
| Juma       | • Ichki review va UX polish<br>• Empty/error state dizaynlari<br>• 2-haftaga rejalashtirish va backlog yangilash                                             | Prototipning stabil versiyasi<br>2-hafta vazifalari taqsimlandi                |

## 2-HAFTA: Interaktiv prototip va stakeholder demo

| Kun        | Faoliyatlar                                                                                                                                                    | Chiqish (Output)                                                                   |
|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Dushanba   | • Prototip interaktivligini kuchaytirish (dynamic navigation)<br>• Til almashtirish (32) real-time sinovi<br>• Profil <-> Baholar <-> Jadval ma'lumot uzatilishi | Multi-language 100% ishlaydi<br>Sahifalar orasida context saqlanadi                |
| Seshanba   | • Bildirishnomalar (4) simulyatsiyasi: badge, banner, dismiss<br>• Demo rejimi sozlash (pre-filled test accounts)<br>• Cross-device preview (mobile/tablet)   | Push/banner mock tayyor<br>Demo account'lar ro'yxati tayyor                         |
| Chorshanba | • Internal QA va usability testing<br>• Link xatolari, qaytish tugmalari, navigatsiya bar tekshiruvi<br>• Hujjatlashtirish boshlanishi (demo script)           | 0 ta broken link<br>Demo ssenariysi drafti                                          |
| Payshanba  | • Final polish va performance optimizatsiya<br>• Talablar o'zgarishlari jurnali shablonini tayyorlash<br>• Dry-run demo (2 marta to'liq takrorlash)           | RC (Release Candidate) prototip<br>Jurnal va skript tayyor                          |
| Juma       | 14:00-14:30 Stakeholder Demo (o'qituvchi/mijoz)<br>Feedback yig'ish va jurnalga kiritish<br>3-hafta rejasi uchun asos yaratish                               | Increment topshirildi<br>Feedback loglandi<br>Keyingi iteratsiya uchun prioritetlar belgilandi |
