// Список произведений библиотеки. Чтобы добавить книгу:
// положите PDF в папку pdf/ и допишите объект в этот массив.
window.BOOKS = [
  { slug: "belye-nochi", krc: "Акъ кечеле", ru: "Белые ночи", author: "Фёдор Достоевский", pages: 40, kb: 196, color: "#2f3d63", motif: "moon" },
  { slug: "baryshnya-krestyanka", krc: "Бийче — эл къыз", ru: "Барышня-крестьянка", author: "Александр Пушкин", pages: 28, kb: 80, color: "#6c7d3f", motif: "birch" },
  { slug: "shinel", krc: "Чепкен", ru: "Шинель", author: "Николай Гоголь", pages: 46, kb: 104, color: "#4b4f5c", motif: "coat" },
  { slug: "posle-bala", krc: "Тойдан сора", ru: "После бала", author: "Лев Толстой", pages: 16, kb: 52, color: "#7a3b3f", motif: "chandelier" },
  { slug: "dama-s-sobachkoy", krc: "Тиширыу бла кючюк", ru: "Дама с собачкой", author: "Антон Чехов", pages: 26, kb: 68, color: "#3e6a73", motif: "dog" },
  { slug: "hameleon", krc: "Хамелеон", ru: "Хамелеон", author: "Антон Чехов", pages: 6, kb: 32, color: "#5d7a3a", motif: "lizard" },
  { slug: "gospodin-iz-san-francisko", krc: "Сан-Францискодан келген бий", ru: "Господин из Сан-Франциско", author: "Иван Бунин", pages: 34, kb: 92, color: "#22344a", motif: "ship" },
  { slug: "padenie-doma-asherov", krc: "Ашерлени юйлерини оюлгъаны", ru: "Падение дома Ашеров", author: "Эдгар По", pages: 29, kb: 84, color: "#3b2f45", motif: "house" },
  { slug: "vozhd-krasnokozhih", krc: "Къызыл терилилени башчылары", ru: "Вождь краснокожих", author: "О. Генри", pages: 18, kb: 52, color: "#8a4b26", motif: "feather" }
];

// Простые бумажные силуэты для обложек (viewBox 0 0 100 100).
window.MOTIFS = {
  moon: '<circle cx="58" cy="40" r="22" fill="#ece6d3"/><circle cx="68" cy="34" r="20" fill="currentColor"/><path d="M8 82 Q30 70 50 78 T92 74 L92 100 L8 100Z" fill="#ece6d3" opacity=".35"/><circle cx="24" cy="24" r="1.8" fill="#ece6d3"/><circle cx="34" cy="58" r="1.2" fill="#ece6d3"/><circle cx="84" cy="62" r="1.5" fill="#ece6d3"/>',
  birch: '<rect x="30" y="10" width="7" height="80" fill="#ece6d3"/><rect x="30" y="26" width="4" height="2" fill="currentColor"/><rect x="33" y="48" width="4" height="2" fill="currentColor"/><rect x="30" y="66" width="5" height="2" fill="currentColor"/><path d="M33 12 Q12 22 18 40 Q32 34 34 18Z M36 20 Q60 18 62 36 Q44 38 36 24Z" fill="#f0a35e"/><path d="M5 90 Q50 80 95 90 L95 100 L5 100Z" fill="#ece6d3" opacity=".4"/>',
  coat: '<path d="M38 14 L50 22 L62 14 L80 24 L86 70 L72 72 L70 90 L30 90 L28 72 L14 70 L20 24Z" fill="#ece6d3"/><path d="M50 22 L46 90 M50 22 L54 90" stroke="currentColor" stroke-width="2"/><circle cx="56" cy="40" r="2" fill="currentColor"/><circle cx="56" cy="54" r="2" fill="currentColor"/><circle cx="56" cy="68" r="2" fill="currentColor"/>',
  chandelier: '<path d="M50 4 V26" stroke="#ece6d3" stroke-width="2"/><path d="M20 40 Q50 60 80 40" stroke="#ece6d3" stroke-width="3" fill="none"/><path d="M50 26 L20 40 M50 26 L80 40 M50 26 L50 50" stroke="#ece6d3" stroke-width="2"/><g fill="#f0a35e"><path d="M20 40 q-4 -10 0 -16 q4 6 0 16Z"/><path d="M80 40 q-4 -10 0 -16 q4 6 0 16Z"/><path d="M50 50 q-4 -10 0 -16 q4 6 0 16Z"/><path d="M35 47 q-4 -10 0 -16 q4 6 0 16Z"/><path d="M65 47 q-4 -10 0 -16 q4 6 0 16Z"/></g><circle cx="50" cy="80" r="9" fill="#ece6d3" opacity=".5"/>',
  dog: '<path d="M22 70 Q20 52 34 48 L60 48 Q66 36 72 34 L74 26 L80 34 Q88 36 86 44 L76 50 L74 70 L66 70 L64 58 L40 60 L38 70 L30 70 L30 62 Q24 66 22 70Z" fill="#ece6d3"/><path d="M22 58 Q12 52 14 42" stroke="#ece6d3" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60 50 L64 66" stroke="#f0a35e" stroke-width="3"/><circle cx="79" cy="40" r="1.6" fill="currentColor"/>',
  lizard: '<path d="M14 60 Q30 40 52 46 Q70 50 78 40 Q88 32 90 44 Q86 56 70 60 Q56 66 40 64 Q24 74 30 86 Q16 82 14 60Z" fill="#ece6d3"/><circle cx="84" cy="41" r="2" fill="currentColor"/><path d="M40 60 L36 72 M58 60 L62 72 M48 48 L44 38 M66 50 L70 40" stroke="#ece6d3" stroke-width="4" stroke-linecap="round"/><path d="M30 54 Q50 52 70 56" stroke="#f0a35e" stroke-width="2" fill="none" stroke-dasharray="3 4"/>',
  ship: '<path d="M10 64 L90 64 L80 78 L18 78Z" fill="#ece6d3"/><rect x="26" y="50" width="48" height="14" fill="#ece6d3"/><rect x="36" y="30" width="8" height="20" fill="#f0a35e"/><rect x="52" y="34" width="8" height="16" fill="#f0a35e"/><g fill="currentColor"><circle cx="34" cy="57" r="2"/><circle cx="44" cy="57" r="2"/><circle cx="54" cy="57" r="2"/><circle cx="64" cy="57" r="2"/></g><path d="M4 86 Q20 80 36 86 T68 86 T100 86" stroke="#ece6d3" stroke-width="2" fill="none" opacity=".5"/>',
  house: '<path d="M18 46 L50 20 L82 46 L82 86 L18 86Z" fill="#ece6d3"/><path d="M52 20 L46 40 L56 52 L44 70 L52 86" stroke="currentColor" stroke-width="3" fill="none"/><rect x="28" y="52" width="10" height="12" fill="currentColor"/><rect x="62" y="52" width="10" height="12" fill="#f0a35e"/><path d="M4 92 L96 92" stroke="#ece6d3" stroke-width="2" opacity=".5"/>',
  feather: '<path d="M50 90 Q46 60 52 36 Q60 14 74 8 Q78 30 70 52 Q62 72 50 90Z" fill="#ece6d3"/><path d="M50 90 Q58 50 74 8" stroke="currentColor" stroke-width="2" fill="none"/><path d="M28 90 Q24 66 32 46 Q38 32 48 28 Q50 46 44 62 Q38 78 28 90Z" fill="#f0a35e"/>'
};
