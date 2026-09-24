// ZAW'IA — le jeu · LKELMA D'LYOUM : le mot du jour (pur : ni DOM, ni horloge).
//
// v4.7 — « les jeux les plus addictifs de la zawia » (Youssef, 18/09/2026).
// Au msid, le Talib écrit son lawh chaque matin et l'efface le soir. Le lawh
// du jour, au mur nord de la Madrasa, porte un mot : le même pour tous, six
// essais, et la grille se partage en carreaux de zellige. Deux minutes, une
// partie — on revient demain.
//
// Six règles, tenues par les tests :
//  1. le mot est le même pour tous : il se lit dans la liste au NUMÉRO du jour
//     (heure de Casablanca, jamais celle du joueur), jamais au hasard. La
//     liste est écrite dans l'ordre des jours : ajouter un mot se fait à la
//     FIN, et ne change aucun jour déjà joué ;
//  2. deux listes, une par langue — le français joue en lettres latines (et les
//     chiffres de la darija : 3, 7, 9), l'arabe en lettres arabes, de droite à
//     gauche. Chaque mot porte son sens : on apprend en jouant ;
//  3. aucun dictionnaire : un essai est juste s'il a la bonne longueur et les
//     lettres du clavier. Les mots de la maison mêlent trois langues ; refuser
//     « TWIZA » parce qu'un dictionnaire ne le connaît pas serait absurde ;
//  4. AUCUN POINT : ni M39ol, ni Sna3a, ni Dhakira. La kelma compte des jours ;
//  5. jouer compte, perdre ne casse rien : la série est faite de jours JOUÉS.
//     La veille se rattrape (RATTRAPAGE) ; un jour manqué reste manqué ;
//  6. aucun lien, aucun nom : le voile. Le partage porte l'adresse que la page
//     lui donne (celle où l'on joue), jamais une adresse écrite ici.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.kelma = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var DEBUT = "2026-09-18";    // le lawh numéro 1
  var ESSAIS = 6;
  var RATTRAPAGE = 1;          // la veille, et elle seule
  var FUSEAU = "Africa/Casablanca";
  var GESTE = "kelma";         // la goutte qu'elle verse à la fontaine (khessa.js)

  // ---- Les claviers -----------------------------------------------------------------
  // Le français : AZERTY, le clavier du Maroc, et une rangée pour les chiffres
  // de la darija (M39OL, SNA3A, TA7ADDI). L'arabe : la disposition des claviers
  // arabes, sans les formes que la normalisation replie (أ إ آ → ا, ى → ي).
  var ENTREE = "⏎", EFFACER = "⌫";
  var CLAVIERS = {
    fr: [
      ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
      [ENTREE, "W", "X", "C", "V", "B", "N", EFFACER],
      ["3", "7", "9"]
    ],
    ar: [
      ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج"],
      ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
      [ENTREE, "ذ", "ء", "ر", "ة", "و", "ز", "ظ", "د", EFFACER]
    ]
  };
  var LETTRES = {};
  Object.keys(CLAVIERS).forEach(function (l) {
    LETTRES[l] = CLAVIERS[l].reduce(function (a, r) { return a.concat(r); }, []).filter(function (k) { return k !== ENTREE && k !== EFFACER; }).join("");
  });

  // ---- Les mots, dans l'ordre des jours --------------------------------------------
  // Trois familles mêlées : la langue de l'IA, la langue de la maison, le pays.
  // ⚠️ Un mot ajouté va à la FIN. Un sens tient en une phrase ou deux, et ce
  //    qu'il affirme de l'histoire doit pouvoir se vérifier (le rôle du Fqih de
  //    l'histoire, comme pour les pages perdues).
  var MOTS = {
    fr: [
      { mot: "PROMPT", sens: "Ce qu'on dit à une IA pour qu'elle travaille. Dire juste, c'est déjà la moitié de la réponse." },
      { mot: "FIHRI", sens: "Fatima al-Fihri, qui a fondé la Qarawiyine à Fès, en 859. La maison où tu marches commence par elle." },
      { mot: "M39OL", sens: "Le rang de la maison. Il se reçoit des autres — le témoin, la salle, le bureau — et jamais de soi." },
      { mot: "ZELLIJ", sens: "La mosaïque de terre cuite émaillée, taillée pièce par pièce à la main. Le sol du Sahn en est fait." },
      { mot: "TOKEN", sens: "Le morceau de mot que lit un modèle de langage. Un modèle compte en tokens, pas en mots." },
      { mot: "TWIZA", sens: "Le travail de tous pour un seul : on moissonne le champ du voisin, puis il vient moissonner le tien. Une valeur de la maison." },
      { mot: "RIHLA", sens: "Le voyage d'Ibn Battuta : près de trente ans sur les routes, dicté à son retour à Fès." },
      { mot: "AGENT", sens: "Une IA qui ne se contente pas de répondre : elle agit, pas à pas, avec des outils." },
      { mot: "ARGAN", sens: "L'arganier, l'arbre du Souss, qui pousse à l'état sauvage dans le sud-ouest du Maroc. Son huile se presse de ses noix." },
      { mot: "SNA3A", sens: "Le savoir-faire : l'axe technique du jeu, celui qui se gagne à l'établi de la Madrasa." },
      { mot: "HALQA", sens: "Le cercle : on s'y assied tous à la même hauteur, et on apprend ensemble." },
      { mot: "BIAIS", sens: "Le penchant qu'une IA hérite de ses données. Le repérer, c'est « vérifier juste »." },
      { mot: "TANGER", sens: "La ville d'Ibn Battuta, face au détroit : l'Afrique et l'Europe s'y regardent." },
      { mot: "NSYAN", sens: "L'oubli. Ce qui efface ce qu'on ne répète pas — l'adversaire de la Rihla." },
      { mot: "SOURCE", sens: "D'où vient une information. Une réponse sans source se vérifie avant de se croire." },
      { mot: "ATLAS", sens: "La grande chaîne du pays, en trois : le Haut Atlas, le Moyen Atlas et l'Anti-Atlas." },
      { mot: "TALIB", sens: "Celui qui cherche le savoir. Tout le monde entre dans la maison Talib, même le Morchid." },
      { mot: "MODELE", sens: "Le cerveau entraîné d'une IA : des milliards de nombres appris en lisant." },
      { mot: "GNAOUA", sens: "La musique des maâlems, du guembri et des qraqeb, qu'Essaouira fête chaque année." },
      { mot: "SILSILA", sens: "La chaîne de transmission : de celui qui sait à celui qui arrive, maillon après maillon. Une valeur de la maison." },
      { mot: "PIXEL", sens: "Le point d'une image. Une IA d'image en invente des millions : confronte-les au réel." },
      { mot: "TAJINE", sens: "Le plat et le pot de terre qui le cuit, couvercle en cône : la vapeur retombe dans la sauce." },
      { mot: "KHATT", sens: "La calligraphie. Sept khatt au mur du Sahn récitent les sept valeurs de la maison." },
      { mot: "OUTIL", sens: "Ce qu'un agent appelle pour agir : une recherche, un tableur, une calculette." },
      { mot: "IDRIS", sens: "Idriss II, qui fit de Fès une capitale au début du IXᵉ siècle." },
      { mot: "RIWAQ", sens: "La galerie où la maison annonce ses rencontres. On y entre ; elle ne crie jamais." },
      { mot: "DONNEE", sens: "Ce qu'une IA a lu pour apprendre. Des données sales donnent des réponses sales." },
      { mot: "DARIJA", sens: "La langue qu'on parle au Maroc — et qui s'écrit aussi en lettres et en chiffres : 3, 7, 9." },
      { mot: "ARB3INE", sens: "Les quarante premiers jours d'un Talib. On ne lui demande rien : on le nourrit d'abord." },
      { mot: "SCRIPT", sens: "Un petit programme qui fait à ta place le travail qui se répète." },
      { mot: "SAFRAN", sens: "L'or rouge de Taliouine : trois stigmates par fleur, cueillis un par un, à l'aube." },
      { mot: "KHIZANA", sens: "La bibliothèque de la Qarawiyine, l'une des plus vieilles du monde encore ouvertes." },
      { mot: "RESEAU", sens: "Des couches de neurones artificiels reliées entre elles. Le « profond » du deep learning, c'est leur nombre." },
      { mot: "MEDINA", sens: "La vieille ville, ses derbs et ses métiers. Celle de Fès est inscrite au patrimoine mondial." },
      { mot: "IJAZA", sens: "L'autorisation que le maître donne à l'élève de transmettre à son tour. Elle se reçoit devant tout le monde." },
      { mot: "ERREUR", sens: "Ce qu'une IA dit parfois avec une parfaite assurance. Nsyan adore les erreurs dites avec aplomb." },
      { mot: "MALHOUN", sens: "La poésie chantée des artisans des villes impériales, en darija." },
      { mot: "WIRD", sens: "La portion du jour : un défi, vingt minutes, pas plus. Ni plus, ni moins." },
      { mot: "CODER", sens: "Écrire les instructions qu'une machine exécute. Avec une IA, on code aussi en parlant." },
      { mot: "HARIRA", sens: "La soupe de tomates, de pois chiches et de lentilles, qui rompt le jeûne du Ramadan." },
      { mot: "SANDOUQ", sens: "Le coffre de la Khizana, où dorment les pages que Nsyan a arrachées à la Rihla." },
      { mot: "EXEMPLE", sens: "Un exemple vaut dix consignes : montre à l'IA ce que tu veux, elle suivra." },
      { mot: "TARIQ", sens: "Tariq ibn Ziyad, qui traversa le détroit en 711. Gibraltar porte son nom : Jabal Tariq." },
      { mot: "MORCHID", sens: "Le guide. Le plus haut rang de la maison — et il est élu, jamais pris." },
      { mot: "RESUME", sens: "Ce qu'on demande le plus souvent à une IA — et qu'il faut toujours relire." },
      { mot: "KASBAH", sens: "La citadelle de terre, aux tours carrées, qui garde les vallées du Sud." },
      { mot: "DHAKIRA", sens: "La mémoire : l'axe du jeu qui se gagne au sandouq, contraire exact de Nsyan." },
      { mot: "NEURONE", sens: "La plus petite pièce d'un réseau : elle additionne, pèse, et transmet." },
      { mot: "RGHWA", sens: "La mousse de l'atay. Elle vient de la hauteur du versé — demande aux orangers du riad." },
      { mot: "MAWSEM", sens: "La saison où la maison se remplit : ferracha, halqa, twiza, puis le thé." },
      { mot: "CALCUL", sens: "Ce qu'un modèle fait sans cesse, sans jamais comprendre comme toi. D'où l'intérêt de vérifier." },
      { mot: "OUJDA", sens: "La ville de l'Oriental, au bout de la route de l'est. On y joue le gharnati." },
      { mot: "FQIH", sens: "Le savant, celui qu'on consulte. Un rang de la maison." },
      { mot: "SERVEUR", sens: "La machine, quelque part, où tourne le modèle quand tu lui parles." },
      { mot: "CAFTAN", sens: "La robe d'apparat, brodée à la main, que le monde entier connaît du Maroc." },
      { mot: "ATAY", sens: "Le thé vert à la menthe. Trois verres, versés de haut — c'est l'hospitalité." },
      { mot: "TA7ADDI", sens: "Un défi de savoir-faire, posé à l'établi. On y mesure ce qu'on sait faire, pas ce qu'on sait dire." },
      { mot: "ROBOT", sens: "Une machine qui agit dans le monde. Une IA n'a pas besoin d'un corps pour agir — un agent suffit." },
      { mot: "AGADIR", sens: "La ville du Souss, rebâtie après le séisme de 1960, face à l'Atlantique." },
      { mot: "ZAWIA", sens: "La maison où l'on apprend, où l'on mange et où l'on dort. On y nourrit le voyageur avant de lui demander qui il est." },
      { mot: "LOGIQUE", sens: "Ce qu'on attend d'une machine, et qu'une IA imite très bien — jusqu'au jour où elle se trompe." },
      { mot: "JELLABA", sens: "La robe à capuche qu'on porte au Maroc, en laine l'hiver, en coton l'été." },
      { mot: "MADRASA", sens: "L'école où les Tolba apprennent — et se comptent. Celle-ci a un lawh et un établi." },
      { mot: "IMAGE", sens: "Ce qu'une IA sait générer en quelques secondes. « Voir juste », c'est la comparer au réel." },
      { mot: "MEKNES", sens: "La ville de Moulay Ismaïl, aux portes monumentales : Bab Mansour en est la plus célèbre." },
      { mot: "SAHN", sens: "La cour, avec sa fontaine au milieu. Tout le monde y passe, c'est là qu'on se croise." },
      { mot: "SAVOIR", sens: "Ce qui se transmet ici gratuitement, de celui qui sait à celui qui arrive." },
      { mot: "QRAQEB", sens: "Les castagnettes de fer des Gnaoua, qui tiennent le rythme toute la nuit." },
      { mot: "LAWH", sens: "La planchette où le Talib écrit sa leçon chaque matin, et l'efface le soir. Tu es devant." },
      { mot: "CHATBOT", sens: "Une IA qui converse. Elle répond vite ; c'est à toi de répondre juste." }
    ],
    ar: [
      { mot: "نموذج", sens: "العقل المدرَّب للذكاء الاصطناعي: ملايير الأرقام تعلّمها وهو يقرأ." },
      { mot: "فاطمة", sens: "فاطمة الفهرية، التي أسّست القرويين بفاس سنة 859. الدار التي تمشي فيها تبدأ بها." },
      { mot: "معقول", sens: "رتبة الدار. تُعطى من الآخرين — الشاهد، القاعة، المكتب — ولا يأخذها المرء لنفسه." },
      { mot: "زليج", sens: "فسيفساء من الطين المزجّج، تُقطع قطعةً قطعة باليد. أرض الصحن منها." },
      { mot: "بيانات", sens: "ما قرأه الذكاء الاصطناعي ليتعلّم. بيانات وسخة تعطي أجوبة وسخة." },
      { mot: "تويزة", sens: "عمل الجميع من أجل واحد: نحصد حقل الجار، ثم يأتي ليحصد حقلك. قيمة من قيم الدار." },
      { mot: "رحلة", sens: "رحلة ابن بطوطة: قرابة ثلاثين سنة على الطرقات، أملاها بعد عودته إلى فاس." },
      { mot: "وكيل", sens: "ذكاء اصطناعي لا يكتفي بالجواب: يتصرّف خطوة بخطوة، بأدوات." },
      { mot: "اركان", ecrit: "أركان", sens: "شجرة سوس، تنبت برّيةً في جنوب غرب المغرب، ويُعصر زيتها من ثمارها." },
      { mot: "صنعة", sens: "الحِرفة: المحور التقني في اللعبة، يُكسب على منضدة المدرسة." },
      { mot: "حلقة", sens: "الدائرة: نجلس فيها كلّنا على نفس العلوّ، ونتعلّم معًا." },
      { mot: "مصدر", sens: "من أين تأتي المعلومة. جواب بلا مصدر يُتحقَّق منه قبل أن يُصدَّق." },
      { mot: "طنجة", sens: "مدينة ابن بطوطة، على المضيق: هناك تتقابل إفريقيا وأوروبا." },
      { mot: "نسيان", sens: "ما يمحو ما لا نكرّره — خصم الرحلة." },
      { mot: "تحيز", ecrit: "تحيّز", sens: "الميل الذي يرثه الذكاء الاصطناعي من بياناته. اكتشافه هو «التحقّق الصحيح»." },
      { mot: "اطلس", ecrit: "أطلس", sens: "سلسلة جبال البلاد، ثلاثٌ: الأطلس الكبير، والأطلس المتوسط، والأطلس الصغير." },
      { mot: "طالب", sens: "من يطلب العلم. الجميع يدخل الدار طالبًا، حتى المرشد." },
      { mot: "برمجة", sens: "كتابة التعليمات التي تنفّذها الآلة. مع الذكاء الاصطناعي، نبرمج أيضًا بالكلام." },
      { mot: "كناوة", sens: "موسيقى المعلّمين، بالكمبري والقراقب، تحتفل بها الصويرة كل سنة." },
      { mot: "سلسلة", sens: "سلسلة النقل: من الذي يعرف إلى الذي يصل، حلقةً بعد حلقة. قيمة من قيم الدار." },
      { mot: "صورة", sens: "ما يولّده الذكاء الاصطناعي في ثوانٍ. «الرؤية الصحيحة» أن تقارنها بالواقع." },
      { mot: "طاجين", sens: "الطبق وإناء الطين الذي يطهوه، بغطائه المخروطي: يعود البخار إلى المرق." },
      { mot: "رواق", sens: "الرواق الذي تعلن فيه الدار لقاءاتها. ندخله؛ ولا يصيح أبدًا." },
      { mot: "ادريس", ecrit: "إدريس", sens: "إدريس الثاني، الذي جعل فاس عاصمةً في مطلع القرن التاسع." },
      { mot: "شبكة", sens: "طبقات من الخلايا العصبية الاصطناعية المترابطة. «العميق» في التعلّم العميق هو عددها." },
      { mot: "دارجة", sens: "اللغة التي نتكلّمها في المغرب — وتُكتب أيضًا بالحروف والأرقام: 3، 7، 9." },
      { mot: "مدرسة", sens: "حيث يتعلّم الطلبة — ويُحصَون. هذه فيها لوح ومنضدة." },
      { mot: "زعفران", sens: "ذهب تالوين الأحمر: ثلاث مياسم في كل زهرة، تُقطف واحدةً واحدة عند الفجر." },
      { mot: "خزانة", sens: "مكتبة القرويين، من أقدم مكتبات العالم التي ما زالت مفتوحة." },
      { mot: "روبوت", sens: "آلة تتصرّف في العالم. الذكاء الاصطناعي لا يحتاج جسدًا ليتصرّف — يكفيه وكيل." },
      { mot: "مدينة", sens: "المدينة العتيقة، بدروبها وحِرفها. مدينة فاس مسجّلة في التراث العالمي." },
      { mot: "اجازة", ecrit: "إجازة", sens: "الإذن الذي يعطيه الشيخ لتلميذه لينقل بدوره. تُستلم أمام الجميع." },
      { mot: "ملحون", sens: "الشعر المغنّى لحِرفيي المدن العتيقة، بالدارجة." },
      { mot: "حاسوب", sens: "الآلة التي تكتب عليها. النموذج نفسه يشتغل على حواسيب بعيدة." },
      { mot: "حريرة", sens: "حساء الطماطم والحمّص والعدس، الذي يُفطر عليه في رمضان." },
      { mot: "صندوق", sens: "صندوق الخزانة، حيث تنام الصفحات التي انتزعها نسيان من الرحلة." },
      { mot: "مثال", sens: "مثال واحد خير من عشر تعليمات: أرِ الذكاء الاصطناعي ما تريد، وسيتبعك." },
      { mot: "طارق", sens: "طارق بن زياد، الذي عبر المضيق سنة 711. جبل طارق يحمل اسمه." },
      { mot: "مرشد", sens: "الدليل. أعلى رتبة في الدار — وهو مُنتخب، لا يُؤخذ." },
      { mot: "ملخص", ecrit: "ملخّص", sens: "أكثر ما نطلبه من الذكاء الاصطناعي — ويجب دائمًا أن يُعاد قراءته." },
      { mot: "قصبة", sens: "القلعة الطينية ذات الأبراج المربّعة، التي تحرس أودية الجنوب." },
      { mot: "ذاكرة", sens: "الذاكرة: محور اللعبة الذي يُكسب في الصندوق، عكس نسيان تمامًا." },
      { mot: "خادم", sens: "الآلة، في مكان ما، حيث يشتغل النموذج حين تكلّمه." },
      { mot: "رغوة", sens: "رغوة الأتاي. تأتي من علوّ السكب — اسأل برتقال الرياض." },
      { mot: "موسم", sens: "الموسم الذي تمتلئ فيه الدار: فرّاشة، حلقة، تويزة، ثم الأتاي." },
      { mot: "منطق", sens: "ما ننتظره من الآلة، ويقلّده الذكاء الاصطناعي جيدًا — إلى اليوم الذي يخطئ فيه." },
      { mot: "وجدة", sens: "مدينة الشرق، في آخر طريق الشرق. هناك يُعزف الغرناطي." },
      { mot: "فقيه", sens: "العالِم، من نستشيره. رتبة من رتب الدار." },
      { mot: "قفطان", sens: "لباس المناسبات، المطرّز باليد، الذي يعرفه العالم كله من المغرب." },
      { mot: "اتاي", ecrit: "أتاي", sens: "الشاي الأخضر بالنعناع. ثلاث كؤوس، تُسكب من علوّ — إنها الضيافة." },
      { mot: "تحدي", ecrit: "تحدّي", sens: "تحدٍّ في الصنعة، على المنضدة. نقيس فيه ما نعرف فعله، لا ما نعرف قوله." },
      { mot: "ذكاء", sens: "ما نسمّيه ذكاءً في الآلة: قدرة على التنبّؤ بالكلمة الموالية، لا على الفهم كما تفهم." },
      { mot: "زاوية", sens: "الدار التي نتعلّم فيها ونأكل وننام. نُطعم فيها المسافر قبل أن نسأله من يكون." },
      { mot: "جلابة", sens: "اللباس ذو القلنسوة الذي نلبسه في المغرب، صوفًا في الشتاء وقطنًا في الصيف." },
      { mot: "مكناس", sens: "مدينة مولاي إسماعيل، ذات الأبواب الضخمة: باب منصور أشهرها." },
      { mot: "معرفة", sens: "ما يُنقل هنا بالمجان، من الذي يعرف إلى الذي يصل." },
      { mot: "قراقب", sens: "صنوج الحديد عند كناوة، تحفظ الإيقاع الليل كلّه." },
      { mot: "مخطوط", sens: "كتاب مكتوب باليد. في الخزانة، بعضها أقدم من المدن التي نعرفها." },
      { mot: "شاشة", sens: "حيث يظهر الجواب. ما يظهر على الشاشة ليس دائمًا ما هو صحيح." },
      { mot: "حكمة", sens: "ما يبقى حين ننسى التفاصيل. الذكاء الاصطناعي يعطي المعلومة؛ الحكمة عليك." }
    ]
  };

  // ---- La normalisation ------------------------------------------------------------
  // Le français : majuscules, accents retirés, rien que le clavier. L'arabe :
  // les voyelles et la chadda tombent, les alifs se replient, ى devient ي.
  function normaliser(texte, langue) {
    var s = String(texte == null ? "" : texte);
    if (langue === "ar") {
      s = s.replace(/[ً-ٰٟـ]/g, "")      // harakat, chadda, alif suscrit, tatwil
        .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي");
      return s.replace(/\s+/g, "");
    }
    s = s.normalize ? s.normalize("NFD").replace(/[̀-ͯ]/g, "") : s;
    return s.toUpperCase().replace(/\s+/g, "");
  }
  // Les lettres d'un mot : un tableau de caractères (l'arabe n'a pas de paires
  // de substitution, Array.from suffit partout).
  function lettres(mot) { return Array.from(String(mot || "")); }

  // ---- Le jour --------------------------------------------------------------------------
  // Le jour de la maison : AAAA-MM-JJ à Casablanca. Sans Intl (très vieux
  // navigateur), on retombe sur UTC+1 — l'heure de Casablanca hors Ramadan.
  function jourCasa(maintenant) {
    var d = maintenant == null ? new Date() : new Date(maintenant);
    try {
      var parts = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      if (o.year && o.month && o.day) return o.year + "-" + o.month + "-" + o.day;
    } catch (e) { /* repli ci-dessous */ }
    return new Date(d.getTime() + 3600 * 1000).toISOString().slice(0, 10);
  }
  function jourUTC(iso) { var p = String(iso).split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  // Le numéro du lawh : 1 le jour de DEBUT, +1 chaque jour. Jamais moins de 1.
  function numero(maintenant) {
    var n = Math.round((jourUTC(jourCasa(maintenant)) - jourUTC(DEBUT)) / 86400000) + 1;
    return Math.max(1, n);
  }
  function dateDe(n) { return new Date(jourUTC(DEBUT) + (Math.max(1, n) - 1) * 86400000).toISOString().slice(0, 10); }

  function langueValide(l) { return l === "ar" ? "ar" : "fr"; }
  // Le mot du lawh n, dans une langue : { n, mot, ecrit, sens, longueur }.
  function motDu(n, langue) {
    var l = langueValide(langue), liste = MOTS[l];
    var e = liste[(Math.max(1, Math.floor(n)) - 1) % liste.length];
    var mot = normaliser(e.mot, l);
    return { n: Math.max(1, Math.floor(n)), langue: l, mot: mot, ecrit: e.ecrit || e.mot, sens: e.sens, longueur: lettres(mot).length };
  }

  // ---- Un essai --------------------------------------------------------------------------
  function valider(essai, cible, langue) {
    var l = langueValide(langue), e = lettres(normaliser(essai, l)), c = lettres(cible);
    if (e.length < c.length) return { ok: false, erreur: "Il manque des lettres : le mot en fait " + c.length + "." };
    if (e.length > c.length) return { ok: false, erreur: "Trop de lettres : le mot en fait " + c.length + "." };
    for (var i = 0; i < e.length; i++) if (LETTRES[l].indexOf(e[i]) < 0) return { ok: false, erreur: "Seulement les lettres du clavier." };
    return { ok: true, essai: e.join("") };
  }
  // La couleur de chaque lettre, en deux passes — une lettre en double n'est
  // « ailleurs » qu'autant de fois qu'elle est dans le mot.
  function evaluer(essai, cible) {
    var e = lettres(essai), c = lettres(cible), out = [], reste = {};
    for (var i = 0; i < c.length; i++) {
      if (e[i] === c[i]) out[i] = "bien";
      else { out[i] = null; reste[c[i]] = (reste[c[i]] || 0) + 1; }
    }
    for (var j = 0; j < e.length; j++) {
      if (out[j]) continue;
      if (reste[e[j]] > 0) { out[j] = "ailleurs"; reste[e[j]] -= 1; }
      else out[j] = "absente";
    }
    return out;
  }
  // Ce que le clavier sait de chaque lettre : la meilleure couleur vue.
  var RANG = { absente: 1, ailleurs: 2, bien: 3 };
  function etatClavier(essais, cible) {
    var o = {};
    (essais || []).forEach(function (es) {
      var ev = evaluer(es, cible), ls = lettres(es);
      ls.forEach(function (ch, i) { if (!o[ch] || RANG[ev[i]] > RANG[o[ch]]) o[ch] = ev[i]; });
    });
    return o;
  }

  // ---- L'état du joueur (recit.kelma) ----------------------------------------------
  //   g : { "fr-12": ["TWIZA", …], "ar-11": […] } — les grilles d'aujourd'hui et d'hier ;
  //   j : [10, 11, 12] — les jours JOUÉS jusqu'au bout (gagnés ou non), toutes langues ;
  //   d : [0, 1, 2, 1, 0, 0] — les grilles trouvées, par nombre d'essais ;
  //   p : les grilles perdues.
  var MAX_JOURS = 400;
  function normaliserEtat(x) {
    var e = { g: {}, j: [], d: [0, 0, 0, 0, 0, 0], p: 0 };
    if (!x || typeof x !== "object") return e;
    if (x.g && typeof x.g === "object") {
      Object.keys(x.g).forEach(function (k) {
        if (!/^(fr|ar)-\d{1,5}$/.test(k) || !Array.isArray(x.g[k])) return;
        var l = k.slice(0, 2);
        var es = x.g[k].filter(function (s) { return typeof s === "string" && s.length > 0 && s.length <= 12; }).slice(0, ESSAIS).map(function (s) { return normaliser(s, l); });
        if (es.length) e.g[k] = es;
      });
    }
    if (Array.isArray(x.j)) {
      var vus = {};
      e.j = x.j.filter(function (n) { return Number.isInteger(n) && n >= 1 && n < 100000 && !vus[n] && (vus[n] = true); }).sort(function (a, b) { return a - b; }).slice(-MAX_JOURS);
    }
    if (Array.isArray(x.d) && x.d.length === ESSAIS) e.d = x.d.map(function (v) { return Math.max(0, Math.floor(Number(v) || 0)); });
    e.p = Math.max(0, Math.floor(Number(x.p) || 0));
    return e;
  }
  function cleGrille(n, langue) { return langueValide(langue) + "-" + n; }

  // La grille du lawh n : les essais, et où l'on en est.
  function grille(etat, n, langue) {
    var e = normaliserEtat(etat), m = motDu(n, langue);
    var essais = e.g[cleGrille(n, langue)] || [];
    var gagne = essais.length > 0 && essais[essais.length - 1] === m.mot;
    var perdu = !gagne && essais.length >= ESSAIS;
    return {
      n: n, langue: m.langue, mot: m, essais: essais,
      evaluations: essais.map(function (s) { return evaluer(s, m.mot); }),
      clavier: etatClavier(essais, m.mot),
      gagne: gagne, perdu: perdu, fini: gagne || perdu, reste: ESSAIS - essais.length
    };
  }

  // Jouer un essai sur le lawh n (aujourd'hui, ou la veille à rattraper).
  // Rend { etat, resultat } ; l'état n'est jamais modifié en place.
  function jouer(etat, n, langue, essai, aujourdhui) {
    var e = normaliserEtat(etat), l = langueValide(langue);
    var auj = aujourdhui == null ? n : aujourdhui;
    if (n !== auj && n !== auj - RATTRAPAGE) return { etat: e, resultat: { ok: false, erreur: "Ce lawh-là est effacé." } };
    if (n < 1) return { etat: e, resultat: { ok: false, erreur: "Ce lawh-là est effacé." } };
    var avant = grille(e, n, l);
    if (avant.fini) return { etat: e, resultat: { ok: false, erreur: "Ce lawh est déjà écrit. Reviens demain." } };
    var v = valider(essai, avant.mot.mot, l);
    if (!v.ok) return { etat: e, resultat: v };
    // on ne garde que les grilles d'aujourd'hui et d'hier
    var g = {};
    Object.keys(e.g).forEach(function (k) { var kn = Number(k.slice(3)); if (kn >= auj - RATTRAPAGE && kn <= auj) g[k] = e.g[k]; });
    g[cleGrille(n, l)] = avant.essais.concat([v.essai]);
    var nouveau = { g: g, j: e.j.slice(), d: e.d.slice(), p: e.p };
    var apres = grille(nouveau, n, l);
    if (apres.fini) {
      if (nouveau.j.indexOf(n) < 0) { nouveau.j.push(n); nouveau.j.sort(function (a, b) { return a - b; }); nouveau.j = nouveau.j.slice(-MAX_JOURS); }
      if (apres.gagne) nouveau.d[apres.essais.length - 1] += 1; else nouveau.p += 1;
    }
    return { etat: nouveau, resultat: { ok: true, evaluation: evaluer(v.essai, avant.mot.mot), fini: apres.fini, gagne: apres.gagne, essais: apres.essais.length, grille: apres } };
  }

  // ---- La série, et le reste ----------------------------------------------------------
  // La série : les jours JOUÉS d'affilée, jusqu'à aujourd'hui — ou jusqu'à
  // hier, si aujourd'hui n'est pas encore joué (la journée n'est pas finie).
  function serie(etat, n) {
    var e = normaliserEtat(etat), set = {};
    e.j.forEach(function (k) { set[k] = true; });
    var k = set[n] ? n : n - 1, s = 0;
    while (set[k]) { s += 1; k -= 1; }
    return s;
  }
  function record(etat) {
    var e = normaliserEtat(etat), best = 0, cur = 0, prev = null;
    e.j.forEach(function (k) { cur = prev !== null && k === prev + 1 ? cur + 1 : 1; prev = k; if (cur > best) best = cur; });
    return best;
  }
  function stats(etat, n) {
    var e = normaliserEtat(etat);
    var trouvees = e.d.reduce(function (a, b) { return a + b; }, 0);
    return { jours: e.j.length, trouvees: trouvees, perdues: e.p, serie: serie(e, n), record: record(e), distribution: e.d.slice() };
  }
  // La veille se rattrape : elle n'est pas jouée, et ce n'est pas le premier lawh.
  function rattrapable(etat, n, langue) {
    var e = normaliserEtat(etat);
    if (n - RATTRAPAGE < 1) return false;
    if (e.j.indexOf(n - RATTRAPAGE) >= 0) return false;
    return !grille(e, n - RATTRAPAGE, langue).fini;
  }
  // A-t-on joué le lawh d'aujourd'hui (dans une langue ou l'autre) ?
  function joueAujourdhui(etat, n) { return normaliserEtat(etat).j.indexOf(n) >= 0; }

  // ---- Le partage : la grille en carreaux de zellige ----------------------------------
  var CARREAUX = { bien: "🟩", ailleurs: "🟨", absente: "⬛" };
  function partage(etat, n, langue, origine) {
    var gr = grille(etat, n, langue);
    if (!gr.fini) return "";
    var ar = gr.langue === "ar";
    // ⚠️ une ligne de carreaux n'a aucune lettre « forte » : sans la marque RLM,
    //    WhatsApp l'affiche de gauche à droite, à l'envers de la grille arabe.
    var marque = ar ? "‏" : "";
    var lignes = gr.evaluations.map(function (ev) { return marque + ev.map(function (c) { return CARREAUX[c]; }).join(""); });
    var tete = (ar ? "الكلمة ديال اليوم #" : "Lkelma d'lyoum #") + n + " — " + (gr.gagne ? gr.essais.length : "X") + "/" + ESSAIS;
    var s = serie(etat, n);
    var pied = s > 1 ? (ar ? "🔥 " + s + " أيام متتالية" : "🔥 " + s + " jours d'affilée") : "";
    return [tete, lignes.join("\n"), pied, origine ? String(origine) : ""].filter(Boolean).join("\n");
  }

  return {
    DEBUT: DEBUT, ESSAIS: ESSAIS, RATTRAPAGE: RATTRAPAGE, FUSEAU: FUSEAU, GESTE: GESTE,
    ENTREE: ENTREE, EFFACER: EFFACER, CLAVIERS: CLAVIERS, LETTRES: LETTRES, MOTS: MOTS, CARREAUX: CARREAUX,
    normaliser: normaliser, lettres: lettres, jourCasa: jourCasa, numero: numero, dateDe: dateDe, motDu: motDu,
    valider: valider, evaluer: evaluer, etatClavier: etatClavier,
    normaliserEtat: normaliserEtat, grille: grille, jouer: jouer,
    serie: serie, record: record, stats: stats, rattrapable: rattrapable, joueAujourdhui: joueAujourdhui,
    partage: partage
  };
});
