export default function Card({ children, className = "" }) {
    // Classlarni aniqroq tekshirish (conflict bo'lmasligi uchun)
    const hasBg = className.includes("bg-");
    const hasBorder = className.includes("border");
    const hasRounded = className.includes("rounded-");
    const hasShadow = className.includes("shadow");
    // Padding bor-yo'qligini Regex yordamida aniqroq ushlash (p-4, px-6, py-2 va h.k)
    const hasPadding = className.match(/\bp-\d|\bpx-|\bpy-[a-z0-9]/);

    return (
        <div className={`
            /* Asosiy Glassmorphism va silliq animatsiya */
            backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]
            
            /* Standart Fon: Yorug' va Tungi rejim uchun moslangan shisha */
            ${!hasBg ? "bg-white/70 dark:bg-slate-900/50" : ""} 
            
            /* Standart Chegara: Shishani bo'rttirib turuvchi ingichka chiziq */
            ${!hasBorder ? "border border-white/60 dark:border-white/5" : ""} 
            
            /* Standart Burchaklar: Mobil ekranda biroz kichikroq, kompyuterda katta Bento uslubi */
            ${!hasRounded ? "rounded-3xl md:rounded-[40px]" : ""} 
            
            /* Standart Soya: Yorug' rejimda yumshoq, tungi rejimda soyaning keragi yo'q */
            ${!hasShadow ? "shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none" : ""} 
            
            /* Standart Bo'shliq (Padding): Mobile First yondashuvi */
            ${!hasPadding ? "p-5 sm:p-6 md:p-8" : ""} 
            
            /* Foydalanuvchi tomonidan berilgan qo'shimcha classlar */
            ${className}
        `}>
            {children}
        </div>
    );
}