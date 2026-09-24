// ZAW'IA — LA KHARITA (zawia.tech/kharita) · la carte des mots de la maison.
//
// Une carte à l'ancienne — parchemin, encre sépia, rose des vents — du Maroc
// tel que le jeu (l3b.zawia.tech) le parle : les cinq rangs, les lieux, les
// métiers, les liens, et les figures que les pages perdues ont retrouvées.
// Chaque enseigne porte une illustration (dessinée ici, en traits) et une
// définition qui s'ouvre au survol ; la même donnée nourrit le lexique et le
// casting sous la carte, et la vignette LinkedIn (scripts/og/zawia-og-kharita.html).
//
// UNE SEULE SOURCE : les textes des mots viennent d'Al-Moujam (le lexique de
// la Khizana, assets/js/zawia-jeu/bibliotheque.js) et de la charte (/valeurs) ;
// les figures viennent des pages perdues (assets/js/zawia-jeu/pages.js), qui
// portent chacune une source vérifiable. On n'écrit pas d'histoire de mémoire.
//
// ⚠️ Deux règles de la maison, tenues par tests/zawia-kharita.test.js :
//   1. Le voile : la maison ne se nomme pas (ni ici, ni dans la vignette).
//   2. Le récit vise l'OUBLI, jamais un coupable : aucune figure n'est
//      racontée contre quelqu'un — on dit ce qu'elle a fait, pas contre qui.
// ⚠️ Jamais Math.random : le tremblé des montagnes et des dunes est haché,
//    pour que deux visiteurs (et la vignette) voient la même carte.
//
// Pur en tête (données, projection, disposition — testables sous Vitest),
// DOM en pied (rendre(), survol). Exporté sur window.ZWK et en module.exports.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWK = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // =====================================================================
  // LES FAMILLES — la couleur d'une enseigne dit ce qu'elle est.
  // =====================================================================
  var FAMILLES = [
    { cle: "rangs",   nom: "Les cinq rangs",      ar: "الرتب",    couleur: "#a3660f", forme: "rond" },
    { cle: "lieux",   nom: "Les lieux",           ar: "الأماكن",  couleur: "#14684f", forme: "rond" },
    { cle: "gens",    nom: "Les gens et les métiers", ar: "الناس", couleur: "#b5532f", forme: "rond" },
    { cle: "liens",   nom: "Les liens et les règles", ar: "الروابط", couleur: "#3b4d9c", forme: "rond" },
    { cle: "figures", nom: "Les figures retrouvées", ar: "الوجوه", couleur: "#8a2b3c", forme: "etoile" }
  ];
  function famille(cle) {
    for (var i = 0; i < FAMILLES.length; i++) if (FAMILLES[i].cle === cle) return FAMILLES[i];
    return null;
  }

  // =====================================================================
  // LES NEUF VILLES — chacune tient un Mourchid (portrait du jeu).
  // Coordonnées réelles, à un souffle près : les quatre villes du nord (Fès,
  // Meknès, Rabat, Casablanca) sont écartées pour que leurs médaillons et
  // leurs enseignes respirent — c'est une carte de mots, pas une carte routière.
  // =====================================================================
  var VILLES = [
    { cle: "fes",        nom: "Fès",        ar: "فاس",           lat: 34.1,  lon: -4.7, mourchid: "Le mou'allim",    role: "la transmission",         terre: "la maison, la Qarawiyine, 859" },
    { cle: "meknes",     nom: "Meknès",     ar: "مكناس",         lat: 33.72, lon: -5.9, mourchid: "L'architecte",    role: "la galerie",              terre: "Bab Mansour, 1732" },
    { cle: "rabat",      nom: "Rabat",      ar: "الرباط",        lat: 34.12, lon: -6.95, mourchid: "Le gardien",      role: "la confiance",            terre: "la tour Hassan, 1199" },
    { cle: "casablanca", nom: "Casablanca", ar: "الدار البيضاء", lat: 33.42, lon: -7.9, mourchid: "La bâtisseuse",   role: "les ponts",               terre: "Anfa, Casa Branca, Dar el-Beida" },
    { cle: "marrakech",  nom: "Marrakech",  ar: "مراكش",         lat: 31.63, lon: -8.0,  mourchid: "L'artisane",      role: "la fabrique",             terre: "Jemaa el-Fna, les foundouks" },
    { cle: "agadir",     nom: "Agadir",     ar: "أكادير",        lat: 30.42, lon: -9.6,  mourchid: "La rebâtisseuse", role: "recommencer",             terre: "rasée en 1960, rebâtie" },
    { cle: "dakhla",     nom: "Dakhla",     ar: "الداخلة",       lat: 23.72, lon: -15.93, mourchid: "Le vent",        role: "les mawasim",             terre: "la baie, le tropique au sud" },
    { cle: "tanger",     nom: "Tanger",     ar: "طنجة",          lat: 35.78, lon: -5.8,  mourchid: "Le passeur",      role: "faire sortir",            terre: "Ibn Battuta, 1304" },
    { cle: "oujda",      nom: "Oujda",      ar: "وجدة",          lat: 34.68, lon: -1.91, mourchid: "La voix",         role: "personne n'est trop loin", terre: "fondée en 994 ; le gharnati" }
  ];
  function ville(cle) {
    for (var i = 0; i < VILLES.length; i++) if (VILLES[i].cle === cle) return VILLES[i];
    return null;
  }

  // =====================================================================
  // LES MOTS — ce que l'ancien Maroc appelait ainsi, et ce que la maison en
  // fait. `ancien` : le sens d'avant. `maison` : le sens dans le jeu.
  // `ville` : où l'enseigne se plante sur la carte.
  // =====================================================================
  var MOTS = [
    // ---- les cinq rangs (la silsila de la maison) ----
    { cle: "talib", nom: "Taleb", ar: "طالب", famille: "rangs", ville: "fes", ico: "talib",
      sous: "Celui qui cherche",
      ancien: "Au msid comme à la Qarawiyine, le taleb est l'étudiant : celui qui demande le savoir. Le mot vient de « chercher ». On l'était des années, assis sur la natte, la lou7a sur les genoux.",
      maison: "Le premier des cinq rangs, et le seul qu'on reçoit en entrant. Les autres se gagnent avec le M39ol — jamais avec un achat, jamais avec un clic." },
    { cle: "mt3ellem", nom: "Mt3ellem", ar: "متعلّم", famille: "rangs", ville: "marrakech", ico: "mt3ellem",
      sous: "L'apprenti",
      ancien: "Dans la warcha, le mt3ellem apprend le métier des mains du m3ellem : il balaie, il regarde, il rate, il recommence. On ne lui confie la pièce entière qu'après des années.",
      maison: "Deuxième rang : 100 M39ol. Il a tenu son Arb3ine et la maison l'a vu revenir." },
    { cle: "m3ellem", nom: "M3ellem", ar: "معلّم", famille: "rangs", ville: "marrakech", ico: "m3ellem",
      sous: "Le maître-artisan",
      ancien: "Le m3ellem tient l'atelier. Il sait le geste juste et il le montre — c'est par lui que le métier passe d'une génération à l'autre. Un m3ellem qui ne forme personne n'en est pas un.",
      maison: "Troisième rang : 400 M39ol. Il prend un Taleb, il anime une halqa. Parler de haut à un Taleb lui est interdit — sixième valeur." },
    { cle: "fqih", nom: "Fqih", ar: "فقيه", famille: "rangs", ville: "fes", ico: "fqih",
      sous: "La référence",
      ancien: "Le fqih est celui qui sait : le lettré du village, celui qu'on consulte pour un contrat, une dispute, une date. Il a appris au msid, puis à la médersa, et il tient l'école à son tour.",
      maison: "Quatrième rang : 1 200 M39ol. Et un rôle à pourvoir : le Fqih de l'histoire, qui relit chaque page perdue avant qu'elle entre au sandouq." },
    { cle: "morchid", nom: "Morchid", ar: "مرشد", famille: "rangs", ville: "fes", ico: "morchid",
      sous: "Le guide de la Zawia",
      ancien: "Le morchid guide : il connaît le chemin parce qu'il l'a fait. Dans une zaouïa, c'est lui qui accueille, oriente, tranche — sans jamais s'asseoir plus haut que les autres.",
      maison: "Le cinquième rang n'a pas de seuil : il est élu, pas gagné. Le jeu en compte neuf, nés de neuf villes." },

    // ---- les lieux ----
    { cle: "zawia", nom: "Zawia", ar: "الزاوية", famille: "lieux", ville: "fes", ico: "zawia",
      sous: "Le coin — la maison",
      ancien: "Une zaouïa, c'est d'abord un coin : l'angle d'une mosquée où un maître enseigne. Puis une maison à part, avec sa cour, sa cuisine, ses hôtes : on y apprend, on y dort, on y mange, gratuitement.",
      maison: "La maison du jeu, à Fès : le Bab, le Sahn, la Khizana, la Madrasa, la Qa3a. Gratuite, pour toujours — c'est écrit sur le manifeste." },
    { cle: "msid", nom: "Msid", ar: "المسيد", famille: "lieux", ville: "agadir", ico: "msid",
      sous: "L'école du quartier, et sa lou7a",
      ancien: "Le msid est la première école : une pièce, un fqih, des enfants assis en rond, chacun avec sa lou7a — la planche de bois où l'on écrit à l'encre de laine brûlée, qu'on efface à l'argile, et qu'on réécrit. Les écoles du Souss en gardent la tradition la plus vivante.",
      maison: "Le cours d'initiation que la maison offre à chaque Taleb. C'est l'un des quatre défis de l'Arb3ine : le finir, en entier." },
    { cle: "madrasa", nom: "Madrasa", ar: "المدرسة", famille: "lieux", ville: "marrakech", ico: "madrasa",
      sous: "La médersa — où l'on est noté",
      ancien: "La médersa loge et forme les tolba venus de loin : des cellules autour d'une cour, une salle de prière, un maître. Ben Youssef à Marrakech, Bou Inania et Attarine à Fès — les plus belles du pays.",
      maison: "La salle de l'établi : les Ta7addi, dix points de Sna3a, quinze du premier coup. L'établi est aux gens de la maison." },
    { cle: "khizana", nom: "Khizana", ar: "الخزانة", famille: "lieux", ville: "fes", ico: "khizana",
      sous: "La bibliothèque",
      ancien: "La khizana est le trésor : l'armoire où l'on serre les manuscrits. Celle de la Qarawiyine passe pour la plus ancienne encore en service au monde.",
      maison: "À l'ouest de la cour. Ses rayonnages portent le lexique, les ressources, le catalogue — et le sandouq attend au fond." },
    { cle: "sandouq", nom: "Sandouq", ar: "الصندوق", famille: "liens", ville: "fes", ico: "sandouq",
      sous: "Le coffre",
      ancien: "Le sandouq est le coffre de bois cerclé où une maison garde ce qui compte : le contrat, le bijou, le titre. On l'ouvre rarement et devant témoins.",
      maison: "Le coffre de la Khizana. Il tient les pages que Nsyan a arrachées à la Rihla : une énigme d'histoire du Maroc par page, une réponse au clavier, de la Dhakira qui monte." },
    { cle: "sahn", nom: "Sahn", ar: "الصحن", famille: "lieux", ville: "meknes", ico: "sahn",
      sous: "La cour, autour de la fontaine",
      ancien: "Le sahn est la cour à ciel ouvert d'une mosquée ou d'une médersa : le bassin au milieu, le zellige au sol, la lumière. C'est là qu'on se croise, qu'on se salue, qu'on attend.",
      maison: "Le cœur du jeu. Les sept valeurs y sont calligraphiées sur les murs, dans l'ordre. Un salam dans le Sahn est le début de tout." },
    { cle: "riwaq", nom: "Riwaq", ar: "الرواق", famille: "lieux", ville: "meknes", ico: "riwaq",
      sous: "La galerie couverte",
      ancien: "Le riwaq est la galerie à arcades qui borde la cour : on y marche à l'ombre, on y lit, on y affiche. Le passage où l'on croise ce qui va se passer.",
      maison: "La galerie où la maison annonce : les rencontres à venir, et le point hebdo où l'on valide sa présence — sur preuve, avec le mot dit en séance." },
    { cle: "bab", nom: "Bab", ar: "الباب", famille: "lieux", ville: "meknes", ico: "bab",
      sous: "La porte",
      ancien: "Le bab est la porte de la ville ou de la maison : monumentale à Meknès, en bois clouté partout ailleurs. Franchir un bab, c'est changer de monde — dehors, dedans.",
      maison: "La porte nord de la cour. Elle ne ferme pas. C'est par elle qu'on sort au Souk poser sa ferracha." },
    { cle: "souk", nom: "Souk", ar: "السوق", famille: "lieux", ville: "casablanca", ico: "souk",
      sous: "Le marché, dehors des murs",
      ancien: "Le souk est le marché : par métier dans la médina (les teinturiers, les dinandiers), par jour dans la campagne (souk el-arba, celui du mercredi). On y vend, on y apprend les nouvelles, on y règle les comptes.",
      maison: "Dehors des murs, passé le Bab. Chacun y étale au plus trois produits, liens compris. C'est ici que le travail d'un Talib libre se fait voir." },
    { cle: "foundouk", nom: "Foundouk", ar: "الفندق", famille: "lieux", ville: "marrakech", ico: "foundouk",
      sous: "Le caravansérail des artisans",
      ancien: "Le foundouk loge les marchands de passage et leurs bêtes : la cour pour les mules, les galeries pour les hommes et la marchandise. Puis les artisans s'y installent — un foundouk par métier.",
      maison: "L'atelier des blocages : le Ta7addi de la semaine, et le tableau où l'on porte une pierre pour un autre." },
    { cle: "warcha", nom: "Warcha", ar: "الورشة", famille: "lieux", ville: "marrakech", ico: "warcha",
      sous: "L'atelier",
      ancien: "La warcha est l'atelier : l'établi, les outils accrochés, la sciure, le m3ellem au fond et les mt3ellmine devant. On n'y parle pas beaucoup — on y montre.",
      maison: "L'établi de la Madrasa, où la Sna3a se gagne. Ce qu'on y fabrique finit sur une ferracha." },
    { cle: "halqa", nom: "Halqa", ar: "الحلقة", famille: "lieux", ville: "marrakech", ico: "halqa",
      sous: "Le cercle",
      ancien: "La halqa est le cercle : celui des tolba autour du maître, celui des passants autour du conteur, sur Jemaa el-Fna. Tout le monde à la même hauteur, le savoir au milieu.",
      maison: "La rencontre de la maison. Le M39ol s'y donne devant tout le monde ; on ne parle jamais de haut dans une halqa." },
    { cle: "mawsem", nom: "Mawsem", ar: "الموسم", famille: "lieux", ville: "dakhla", ico: "mawsem",
      sous: "La saison — le grand rassemblement",
      ancien: "Le moussem est la fête de saison : la tribu, les tentes, les chevaux, le marché, la zaouïa qui accueille. Une fois l'an, tout le monde revient au même endroit.",
      maison: "Le rassemblement de la saison, à Dakhla. C'est le seul moment où un rang change : l'Ijaza s'y reçoit, la ferracha s'y expose." },
    { cle: "atay", nom: "Atay", ar: "أتاي", famille: "lieux", ville: "dakhla", ico: "atay",
      sous: "Le thé — et ce qu'on se dit autour",
      ancien: "Le thé à la menthe se sert trois fois : amer comme la vie, fort comme l'amour, doux comme la mort, dit le proverbe du Sahara. On ne refuse pas un verre — c'est là que tout se dit.",
      maison: "Le T3arefna à l'Atay : se rencontrer, quatrième motivation du jeu. Un but, pas une conséquence." },

    // ---- les gens et les métiers ----
    { cle: "bawwab", nom: "Bawwab", ar: "البوّاب", famille: "gens", ville: "meknes", ico: "bawwab",
      sous: "Le portier",
      ancien: "Le bawwab tient la porte : il sait qui entre, qui sort, qui attend. Il n'a l'air de rien et il connaît toute la maison.",
      maison: "Ba Driss, le premier visage du jeu : « Dehors tu étais peut-être ingénieur, docteur, patron. Ici tu es Talib. »" },
    { cle: "warraq", nom: "Warraq", ar: "الورّاق", famille: "gens", ville: "meknes", ico: "warraq",
      sous: "Le copiste",
      ancien: "Le warraq copie les manuscrits à la main, les relie, les vend. Sans lui, pas de bibliothèque : chaque livre de la Qarawiyine est passé par un calame.",
      maison: "Si Abdellah : « La machine écrit mille pages le temps que je taille mon calame. Mais elle ne sait pas quand elle se trompe. Alors toi, sache-le à sa place. »" },
    { cle: "tajer", nom: "Tajer", ar: "التاجر", famille: "gens", ville: "casablanca", ico: "tajer",
      sous: "Le marchand",
      ancien: "Le tajer achète et vend ; il tient boutique au souk ou fait la route avec les caravanes. Sa parole vaut contrat, sa balance doit être juste — le mohtasib y veille.",
      maison: "Celui qui étale au Souk. Trois produits au plus, et un point à son nom pour poser son tapis." },
    { cle: "ferracha", nom: "Ferracha", ar: "الفرّاشة", famille: "gens", ville: "casablanca", ico: "ferracha",
      sous: "Le tapis étalé à même le sol",
      ancien: "Le ferrach n'a pas de boutique : il déplie son tapis sur la place et pose sa marchandise dessus. Pas d'enseigne, pas de discours — on regarde, on voit.",
      maison: "La première valeur de la charte en est tirée : étale, ne raconte pas. Ton tapis est ton profil." },
    { cle: "mohtasib", nom: "Mohtasib", ar: "المحتسب", famille: "gens", ville: "casablanca", ico: "mohtasib",
      sous: "Le contrôleur du souk",
      ancien: "Le mohtasib fait la police des marchés : il vérifie les poids, les prix, la qualité du pain, la propreté des rues. Un marchand qui triche le retrouve sur son chemin.",
      maison: "La règle du Souk : personne n'annonce au-dessus d'une tête ni dans une halqa. Ce qui est posé doit être vrai." },
    { cle: "amine", nom: "Amine", ar: "الأمين", famille: "gens", ville: "marrakech", ico: "amine",
      sous: "Le chef de la corporation",
      ancien: "L'amine est élu par les m3ellmine d'un métier : il tranche les disputes, atteste les apprentissages, garantit la qualité. Son nom veut dire « celui à qui l'on fait confiance ».",
      maison: "Nia w Amana, cinquième valeur : la bonne foi et la confiance. Le M39ol se donne, jamais ne se réclame." },
    { cle: "hanta", nom: "Hanta", ar: "الحنطة", famille: "gens", ville: "marrakech", ico: "hanta",
      sous: "La corporation de métier",
      ancien: "La hanta rassemble tous ceux d'un même métier — les tanneurs, les brodeurs, les potiers. Elle fixe les règles, forme les apprentis, veille sur ses anciens. On n'exerce pas sans elle.",
      maison: "La communauté elle-même : personne ne construit seul. Le rang, c'est ensemble ou rien." },

    // ---- les liens et les règles ----
    { cle: "silsila", nom: "Silsila", ar: "السلسلة", famille: "liens", ville: "oujda", ico: "silsila",
      sous: "La chaîne de transmission",
      ancien: "La silsila est la chaîne : de maître à élève, de génération en génération, on sait par qui un savoir est arrivé jusqu'à soi. Un savoir sans chaîne est un savoir sans garant.",
      maison: "Troisième valeur : chacun a reçu, chacun transmet. Transmettre est la première motivation du jeu — avant briller, avant montrer." },
    { cle: "ijaza", nom: "Ijaza", ar: "الإجازة", famille: "liens", ville: "rabat", ico: "ijaza",
      sous: "La licence d'enseigner",
      ancien: "L'ijaza est l'autorisation qu'un maître donne à son élève de transmettre à son tour. Elle s'écrit, elle se signe, elle nomme la chaîne. C'est le diplôme d'avant les diplômes.",
      maison: "Se reçoit au Mawsem, devant tous : le seul moment où un rang change. Elle ne s'achète pas, ne se transfère pas, ne se réclame pas." },
    { cle: "chajara", nom: "Chajara", ar: "الشجرة", famille: "liens", ville: "rabat", ico: "chajara",
      sous: "L'arbre — d'où l'on vient",
      ancien: "La chajara est l'arbre généalogique : celui d'une famille, d'une confrérie, d'une lignée de maîtres. On le déroule pour savoir qui l'on est.",
      maison: "La promotion qui a formé un membre dans la maison. Elle se reconnaît à l'entrée — le registre est en base, personne ne déclare rien." },
    { cle: "arb3ine", nom: "Arb3ine", ar: "الأربعين", famille: "liens", ville: "rabat", ico: "arb3ine",
      sous: "Les quarante jours",
      ancien: "Quarante jours : le temps d'une retraite, d'un deuil, d'un hiver (les liyali). Le nombre des épreuves qu'on traverse avant d'être admis.",
      maison: "Comptés du premier pas dans la cour. Quatre défis à tenir avant la fin : les rencontres, le cours d'initiation, dix membres salués, un savoir partagé." },
    { cle: "twiza", nom: "Twiza", ar: "تويزة", famille: "liens", ville: "agadir", ico: "twiza",
      sous: "L'entraide — personne ne construit seul",
      ancien: "La twiza est le chantier collectif des villages de l'Atlas : on moissonne le champ du voisin, on rebâtit sa maison, on cure la seguia — ensemble, sans salaire, parce que demain ce sera le sien.",
      maison: "Deuxième valeur. Le tableau des blocages au Foundouk : porter une pierre rapporte du M39ol donné par le débloqué." },
    { cle: "m39ol", nom: "M39ol", ar: "معقول", famille: "liens", ville: "rabat", ico: "m39ol",
      sous: "Le sérieux — ce qui se reçoit d'un autre",
      ancien: "Un homme m39ol est un homme sur qui l'on peut compter : sérieux, sensé, réglo. Ça ne se décrète pas, ça se constate — les autres le disent de vous.",
      maison: "L'axe communautaire. Il se reçoit d'un autre — le témoin, la salle, le bureau — jamais du navigateur. Le seul des trois comptes qui donne un rang." },
    { cle: "sna3a", nom: "Sna3a", ar: "الصنعة", famille: "liens", ville: "agadir", ico: "sna3a",
      sous: "Le métier — ce que les mains savent faire",
      ancien: "La sna3a est le métier au sens du geste : la main qui sait. « Sna3a f lyed, aman men lfaqr » — un métier en main est une sûreté contre la pauvreté.",
      maison: "L'axe technique, sur trois voies : dire juste, voir juste, vérifier juste. Elle se gagne à l'établi, s'affiche partout, et ne donne aucun rang." },
    { cle: "dhakira", nom: "Dhakira", ar: "الذاكرة", famille: "liens", ville: "oujda", ico: "dhakira",
      sous: "La mémoire — le contraire de Nsyan",
      ancien: "La mémoire d'un pays tient dans ce qu'on répète : un nom, une date, la main qui a posé la première pierre. Ce qu'on cesse de raconter s'efface.",
      maison: "L'axe de la mémoire : ce que tu sais de ton pays. Elle se gagne au sandouq, une page perdue à la fois." },
    { cle: "khatt", nom: "Khatt", ar: "الخط", famille: "liens", ville: "oujda", ico: "khatt",
      sous: "Le trait — la calligraphie",
      ancien: "Le khatt est l'écriture belle : le trait du calame, le maghribi aux courbes rondes qu'on ne trouve qu'ici. Sur les murs, dans les livres, sur la lou7a.",
      maison: "Les sept valeurs calligraphiées sur les murs du Sahn. Chacune dit sa phrase — et ce qu'elle fait refuser." },
    { cle: "darija", nom: "B darija", ar: "بالدارجة", famille: "liens", ville: "oujda", ico: "darija",
      sous: "Dans notre langue",
      ancien: "La darija est la langue de la rue, du souk, de la cuisine : celle où l'on ne ment pas parce qu'on n'a pas le temps de chercher ses mots.",
      maison: "Septième valeur. Le vocabulaire du jeu est le lexique de la maison : Nsyan, pas the Void ; sandouq, pas chest ; Sna3a, pas skill points." },
    { cle: "nsyan", nom: "Nsyan", ar: "النسيان", famille: "liens", ville: "dakhla", ico: "nsyan",
      sous: "L'oubli — celui qu'on affronte",
      ancien: "Ce qui efface sans bruit : le nom d'une porte, le sens d'un mot, la main qui a posé la première pierre. Il n'a pas de visage.",
      maison: "Ni un peuple, ni un pays, ni un système : c'est le point. Il a arraché des pages à la Rihla ; chaque page retrouvée le fait reculer d'un pas. Il ne meurt pas — il attend qu'on cesse de raconter." },
    { cle: "mawsoul", nom: "Al-Mawsoul", ar: "الموصول", famille: "liens", ville: "tanger", ico: "mawsoul",
      sous: "Le Relié — c'est toi",
      ancien: "Celui dont la chaîne tient encore : il sait de qui il a reçu, et à qui il va donner.",
      maison: "Le joueur. Choisi par les neuf Mourchidine pour aller retrouver les pages perdues — pas le plus savant, pas le plus fort. Avec l'IA pour compagnon." }
  ];
  function mot(cle) {
    for (var i = 0; i < MOTS.length; i++) if (MOTS[i].cle === cle) return MOTS[i];
    return null;
  }

  // =====================================================================
  // LES FIGURES — les gens que les pages perdues ont retrouvés. Chaque
  // ligne reprend le FAIT et la SOURCE de la page du jeu (pages.js) : rien
  // n'est écrit de mémoire. `page` : la clé de la page perdue d'origine.
  // Le récit vise l'oubli : on dit ce qu'une figure a fait, jamais contre qui.
  // =====================================================================
  var FIGURES = [
    { cle: "fatima", nom: "Fatima al-Fihriya", ar: "فاطمة الفهرية", ville: "fes", epoque: "859", ico: "f-minaret", page: "fes-fondatrice",
      titre: "La fondatrice",
      detail: "Fille d'un marchand venu de Kairouan, elle fonde à Fès, en 859, la mosquée Al-Qarawiyine — devenue un centre d'enseignement qui n'a jamais fermé depuis. On l'appelle aussi Oum al-Banine, « la mère des fils ». Le jeu tout entier est sa maison.",
      source: "UNESCO, « Médina de Fès » (1981) ; Ibn Abi Zar, Rawd al-Qirtas (vers 1326), seule source ancienne de la fondation." },
    { cle: "mariam", nom: "Mariam al-Fihriya", ar: "مريم الفهرية", ville: "fes", epoque: "859", ico: "f-deux-rives", page: "fes-seconde-soeur",
      titre: "L'autre sœur",
      detail: "La même année, sur l'autre rive de l'oued, la tradition lui attribue la mosquée des Andalous. Deux sœurs, un héritage partagé, deux rives : c'est le plan de la vieille ville encore aujourd'hui.",
      source: "Ibn Abi Zar, Rawd al-Qirtas (vers 1326) ; mosquée al-Andalusiyyin, médina de Fès (UNESCO, 1981)." },
    { cle: "idris", nom: "Idris II", ar: "إدريس الثاني", ville: "fes", epoque: "809", ico: "f-pont", page: "fes-fondateur",
      titre: "La ville aux deux rives",
      detail: "Deux fondations, 789 et 809, une sur chaque rive de l'oued Fès — plus tard réunies en une seule ville. Avant la Qarawiyine, il y avait déjà deux Fès.",
      source: "Ibn Abi Zar, Rawd al-Qirtas (vers 1326) ; UNESCO, « Médina de Fès » (1981)." },
    { cle: "khaldoun", nom: "Ibn Khaldoun", ar: "ابن خلدون", ville: "fes", epoque: "XIVᵉ siècle", ico: "f-roue", page: "fes-fondatrice",
      titre: "Le passant de la Qarawiyine",
      detail: "Il passe par la Qarawiyine au XIVᵉ siècle — l'un des tolba les plus célèbres de la maison. Sa Muqaddima lit l'histoire comme une roue : ce qui monte, ce qui tombe, ce qui recommence.",
      source: "Page perdue « La fondatrice » : « Ibn Khaldoun y passe au XIVᵉ siècle. »" },
    { cle: "battuta", nom: "Ibn Battuta", ar: "ابن بطوطة", ville: "tanger", epoque: "1304 → 1355", ico: "f-astrolabe", page: "tanger-voyageur",
      titre: "Le voyageur",
      detail: "Né à Tanger en 1304, il voyage trente ans et dicte sa Rihla à Fès en 1355. C'est à sa Rihla que Nsyan a arraché les pages perdues : le voyage du jeu est le sien, à l'envers.",
      source: "Ibn Battuta, Tuhfat an-Nuzzar (la Rihla), rédigée par Ibn Juzayy à Fès, 1355." },
    { cle: "tariq", nom: "Tariq ibn Ziyad", ar: "طارق بن زياد", ville: "tanger", epoque: "711", ico: "f-rocher", page: "tanger-detroit",
      titre: "Le rocher qui porte son nom",
      detail: "Il traverse le détroit en 711. Le rocher où il débarque garde son nom jusqu'à aujourd'hui : Jabal Tariq — Gibraltar.",
      source: "Ibn Abd al-Hakam, Futuh Misr wa-l-Maghrib (IXᵉ siècle), le plus ancien récit de la traversée ; toponymie." },
    { cle: "hurra", nom: "Sayyida al-Hurra", ar: "السيدة الحرة", ville: "tanger", epoque: "1515-1542", ico: "f-barre", page: "tanger-hurra",
      titre: "La femme libre",
      detail: "Elle gouverne Tétouan pendant près de trente ans et tient la mer devant elle. Son nom dit tout : la Dame libre.",
      source: "Chroniques du XVIᵉ siècle (gouvernement de Tétouan, 1515-1542) ; Fatima Mernissi, Sultanes oubliées (1990)." },
    { cle: "tachfin", nom: "Youssef ibn Tachfin", ar: "يوسف بن تاشفين", ville: "marrakech", epoque: "1086", ico: "f-dunes", page: "marrakech-emir",
      titre: "L'émir venu du désert",
      detail: "Marrakech est fondée en 1070-1072 par les Almoravides, venus du Sahara. En 1086, à Zallaqa, leur émir change le cours de l'Andalousie.",
      source: "UNESCO, « Médina de Marrakech » (1985) ; Ibn Idhari, al-Bayan al-Mughrib (vers 1312)." },
    { cle: "toumert", nom: "Ibn Toumert", ar: "ابن تومرت", ville: "agadir", epoque: "1121", ico: "f-tinmel", page: "agadir-mahdi",
      titre: "Le prêcheur du Souss",
      detail: "Depuis Tinmel, dans le Haut Atlas, sa prédication fait naître les Almohades. La mosquée de Tinmel, touchée par le séisme d'Al Haouz en 2023, en garde la trace.",
      source: "Ibn Khaldoun, Kitab al-Ibar (XIVᵉ siècle) ; mosquée de Tinmel, liste indicative de l'UNESCO (1995)." },
    { cle: "mansour", nom: "Yacoub al-Mansour", ar: "يعقوب المنصور", ville: "rabat", epoque: "1199", ico: "f-tour", page: "rabat-tour",
      titre: "La tour qui s'est arrêtée",
      detail: "La tour Hassan devait dépasser 80 mètres. À sa mort en 1199, le chantier s'arrête à 44 : une mosquée sans toit, des piliers qui attendent encore. La leçon de la maison : ce qui est promis porte une date.",
      source: "UNESCO, « Rabat, capitale moderne et ville historique » (2012)." },
    { cle: "ahmad", nom: "Ahmad al-Mansour", ar: "أحمد المنصور الذهبي", ville: "marrakech", epoque: "1578", ico: "f-palais", page: "marrakech-incomparable",
      titre: "Le palais Incomparable",
      detail: "Après la bataille d'Oued al-Makhazine, le 4 août 1578, il ouvre le chantier d'al-Badi — l'Incomparable — quinze ans de marbre et d'or, dont il reste les murs.",
      source: "UNESCO, « Médina de Marrakech » (1985) ; palais al-Badi, chantier 1578-1593." },
    { cle: "ismail", nom: "Moulay Ismaïl", ar: "مولاي إسماعيل", ville: "meknes", epoque: "1672-1727", ico: "f-cheval", page: "meknes-sultan",
      titre: "Cinquante-cinq ans",
      detail: "Meknès capitale pendant cinquante-cinq ans : les greniers d'Heri es-Souani, les écuries, les murailles. Bab Mansour, achevée après lui en 1732, ferme sa place.",
      source: "UNESCO, « Ville historique de Meknès » (1996)." },
    { cle: "ziri", nom: "Ziri ibn Atiyya", ar: "زيري بن عطية", ville: "oujda", epoque: "994", ico: "f-oud", page: "oujda-musique",
      titre: "La musique venue d'Andalousie",
      detail: "Chef des Maghraoua, il fonde Oujda en 994. La ville devient l'une des maisons du gharnati, la nouba venue de Grenade par Tlemcen.",
      source: "Fondation d'Oujda par Ziri ibn Atiyya (994) ; répertoire du gharnati, écoles de Tlemcen et d'Oujda." },
    { cle: "youssi", nom: "Al-Hassan al-Youssi", ar: "الحسن اليوسي", ville: "marrakech", epoque: "vers 1700", ico: "f-sept", page: "marrakech-sept",
      titre: "Les sept hommes",
      detail: "Le savant qui met en ordre la ziyara des Sebaatou Rijal, les sept saints de Marrakech, à la fin du XVIIᵉ siècle. Sept, pas vingt-huit — la charte a retenu le nombre.",
      source: "Ziyara des Sebaatou Rijal, instituée sous Moulay Ismaïl ; zaouïa de Sidi Bel Abbès, médina de Marrakech (UNESCO, 1985)." },
    { cle: "zayani", nom: "Moha ou Hammou Zayani", ar: "موحى أوحمو الزياني", ville: "meknes", epoque: "1914", ico: "f-cedre", page: "meknes-zayani",
      titre: "L'homme du Moyen Atlas",
      detail: "Chef des Zayanes de Khénifra. La bataille d'El Herri, le 13 novembre 1914, porte son nom dans toutes les montagnes ; il tombe le 27 mars 1921, debout.",
      source: "Bataille d'El Herri, 13 novembre 1914 (Khénifra) ; historiographie de la résistance du Moyen Atlas." },
    { cle: "khattabi", nom: "Abdelkrim al-Khattabi", ar: "عبد الكريم الخطابي", ville: "tanger", epoque: "1921", ico: "f-rif", page: "tanger-rif",
      titre: "La république du Rif",
      detail: "Anoual, du 22 juillet au 9 août 1921 : le Rif se donne une république. Vingt et un ans d'exil à La Réunion, puis Le Caire, où il meurt le 6 février 1963.",
      source: "Bataille d'Anoual, 22 juillet-9 août 1921 ; exil à La Réunion (1926-1947) ; décès au Caire, 6 février 1963." },
    { cle: "zerktouni", nom: "Mohamed Zerktouni", ar: "محمد الزرقطوني", ville: "casablanca", epoque: "1954", ico: "f-flamme", page: "casablanca-resistant",
      titre: "Celui qui n'a pas parlé",
      detail: "Arrêté à Casablanca, il choisit le silence pour que d'autres continuent. Il meurt le 18 juin 1954. Une page perdue porte son nom : la voie « dire juste ».",
      source: "Haut-Commissariat aux anciens résistants et anciens membres de l'armée de libération (Maroc)." },
    { cle: "mohammed5", nom: "Mohammed V", ar: "محمد الخامس", ville: "rabat", epoque: "1955", ico: "f-retour", page: "rabat-retour",
      titre: "Le jour du retour",
      detail: "Le 16 novembre 1955, il rentre à Rabat. Deux jours plus tard, le discours du Trône ; le 2 mars 1956, l'indépendance. La dernière page du premier cahier.",
      source: "Retour à Rabat le 16 novembre 1955 ; discours du Trône du 18 novembre 1955 ; déclaration commune du 2 mars 1956." }
  ];
  function figure(cle) {
    for (var i = 0; i < FIGURES.length; i++) if (FIGURES[i].cle === cle) return FIGURES[i];
    return null;
  }

  // Les gens de la maison — les PNJ du jeu, avec l'enseigne qui leur va.
  var GENS = [
    { cle: "bawwab",  nom: "Ba Driss",    role: "le bawwab — tient la porte, qui ne ferme pas", ico: "bawwab" },
    { cle: "warraq",  nom: "Si Abdellah", role: "le warraq — quarante ans de manuscrits copiés à la main", ico: "warraq" },
    { cle: "zhor",    nom: "Lalla Zhor",  role: "assise sous la galerie depuis plus longtemps que le zellige", ico: "riwaq" },
    { cle: "nour",    nom: "Nour",        role: "premier jour, n'ose pas encore descendre dans la cour", ico: "talib" },
    { cle: "yassine", nom: "Yassine",     role: "tourne autour de la fontaine, récite, retient", ico: "sahn" },
    { cle: "omar",    nom: "Omar",        role: "a fini son Arb3ine : « la présence, c'est tout »", ico: "m39ol" }
  ];

  // =====================================================================
  // LES ILLUSTRATIONS — un trait par enseigne, viewBox 0 0 64 64, à l'encre
  // (stroke = currentColor, jamais de remplissage plein). Dessinées ici pour
  // que la carte, le lexique, le casting et la vignette partagent le même trait.
  // =====================================================================
  var S = ' fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
  var ICONES = {
    // -- rangs --
    talib:    '<g' + S + '><circle cx="32" cy="15" r="6"/><path d="M14 52c0-11 8-18 18-18s18 7 18 18"/><path d="M22 52v-8h20v8"/><rect x="25" y="34" width="14" height="12" rx="1.5"/><path d="M29 39h6M29 42h6"/></g>',
    mt3ellem: '<g' + S + '><path d="M18 46l14-14"/><path d="M28 24l8 8 6-6-8-8z"/><path d="M14 50l4-4"/><path d="M40 44l4 8 4-8"/><path d="M44 36v8"/><path d="M50 30l6 2-2 6"/></g>',
    m3ellem:  '<g' + S + '><path d="M32 12l4 26M32 12l-4 26"/><circle cx="32" cy="10" r="3"/><path d="M22 44l10-4 10 4"/><path d="M24 50l8-3 8 3"/><path d="M12 30l6-6M46 24l6 6"/><path d="M8 52h48"/></g>',
    fqih:     '<g' + S + '><path d="M12 18c8-4 14-3 20 2 6-5 12-6 20-2v30c-8-4-14-3-20 2-6-5-12-6-20-2z"/><path d="M32 20v30"/><path d="M50 8l-6 6"/><path d="M18 28h8M18 34h8M38 28h8M38 34h8"/></g>',
    morchid:  '<g' + S + '><path d="M24 22h16l-2 22H26z"/><path d="M28 22v-4h8v4"/><path d="M26 44h12v4H26z"/><path d="M32 10v4"/><path d="M14 26l4 2M50 26l-4 2M16 40l4-2M48 40l-4-2"/><path d="M30 30h4"/></g>',
    // -- lieux --
    zawia:    '<g' + S + '><path d="M12 52V28h40v24"/><path d="M20 28c0-10 6-16 12-16s12 6 12 16"/><path d="M26 52V40c0-4 3-6 6-6s6 2 6 6v12"/><path d="M8 52h48"/><path d="M32 8v4"/><circle cx="32" cy="24" r="2"/></g>',
    msid:     '<g' + S + '><rect x="18" y="16" width="28" height="36" rx="3"/><path d="M28 16v-6h8v6"/><path d="M24 26h16M24 33h16M24 40h10"/></g>',
    madrasa:  '<g' + S + '><path d="M10 52V22h44v30"/><path d="M18 52V36c0-4 3-7 7-7s7 3 7 7v16M32 52V36c0-4 3-7 7-7s7 3 7 7v16"/><path d="M10 22l22-10 22 10"/><path d="M6 52h52"/><path d="M32 12v6"/></g>',
    khizana:  '<g' + S + '><rect x="12" y="10" width="40" height="44" rx="2"/><path d="M12 24h40M12 38h40"/><path d="M18 24v-10M24 24v-10M30 24v-10M38 24l6-10"/><path d="M20 38v-9h6v9M30 38v-9h5v9M40 38l4-9"/><path d="M20 46h24"/></g>',
    sandouq:  '<g' + S + '><rect x="10" y="28" width="44" height="24" rx="3"/><path d="M10 28c0-8 6-12 22-12s22 4 22 12"/><path d="M10 38h44"/><rect x="28" y="34" width="8" height="8" rx="1"/><path d="M32 38v4"/><path d="M18 16v12M46 16v12"/></g>',
    sahn:     '<g' + S + '><path d="M10 52h44"/><path d="M14 52V40h36v12"/><path d="M20 40c0-6 4-8 12-8s12 2 12 8"/><path d="M32 32V16"/><path d="M26 18c2-4 10-4 12 0"/><path d="M24 26c-2 2-3 4-3 6M40 26c2 2 3 4 3 6"/><path d="M8 20l6 0M50 20l6 0"/></g>',
    riwaq:    '<g' + S + '><path d="M6 52h52"/><path d="M8 52V26c0-6 4-10 8-10s8 4 8 10v26"/><path d="M24 52V26c0-6 4-10 8-10s8 4 8 10v26"/><path d="M40 52V26c0-6 4-10 8-10s8 4 8 10v26"/><path d="M6 12h52"/></g>',
    bab:      '<g' + S + '><path d="M12 54V26c0-12 8-18 20-18s20 6 20 18v28"/><path d="M32 12v42"/><circle cx="26" cy="34" r="2.5"/><circle cx="38" cy="34" r="2.5"/><path d="M8 54h48"/><path d="M18 22l4-4M46 22l-4-4"/></g>',
    souk:     '<g' + S + '><path d="M8 24l6-10h36l6 10"/><path d="M8 24c0 4 3 6 6 6s6-2 6-6c0 4 3 6 6 6s6-2 6-6c0 4 3 6 6 6s6-2 6-6c0 4 3 6 6 6s6-2 6-6"/><path d="M14 30v22h36V30"/><path d="M22 52V42h8v10"/><circle cx="40" cy="40" r="4"/><path d="M40 30v6"/></g>',
    foundouk: '<g' + S + '><path d="M8 54V18l24-8 24 8v36"/><path d="M8 36h48"/><path d="M14 36v-8h6v8M26 36v-8h6v8M38 36v-8h6v8"/><path d="M14 54v-8h6v8M38 54v-8h6v8"/><path d="M24 54V40c0-4 4-6 8-6s8 2 8 6v14"/><path d="M4 54h56"/></g>',
    warcha:   '<g' + S + '><path d="M8 40h48v6H8z"/><path d="M14 46v10M50 46v10"/><path d="M20 32l10-10 6 6-10 10z"/><path d="M30 22l6-6"/><path d="M40 36c6-2 10 0 12 4H36c0-2 1-3 4-4z"/><path d="M8 14h10M8 20h6"/></g>',
    halqa:    '<g' + S + '><circle cx="32" cy="34" r="20"/><circle cx="32" cy="12" r="3"/><circle cx="50" cy="24" r="3"/><circle cx="50" cy="44" r="3"/><circle cx="32" cy="56" r="3"/><circle cx="14" cy="44" r="3"/><circle cx="14" cy="24" r="3"/><circle cx="32" cy="34" r="4"/><path d="M32 38v6"/></g>',
    mawsem:   '<g' + S + '><path d="M8 52L32 16l24 36z"/><path d="M26 52V40h12v12"/><path d="M32 16V6"/><path d="M32 6h12l-4 4 4 4H32"/><path d="M4 52h56"/><path d="M14 52l6-14M50 52l-6-14"/></g>',
    atay:     '<g' + S + '><path d="M14 22h22v14c0 6-5 10-11 10s-11-4-11-10z"/><path d="M36 26h6c3 0 4 2 4 4v2c0 3-3 4-6 4h-4"/><path d="M18 22c0-6 4-10 8-10h4c4 0 8 4 8 10"/><path d="M25 8h6"/><path d="M14 50h24"/><path d="M48 34h8v14c0 2-2 4-4 4s-4-2-4-4z"/><path d="M44 20c4 2 6 8 6 14"/></g>',
    // -- gens & métiers --
    bawwab:   '<g' + S + '><path d="M14 54V24c0-9 6-14 14-14s14 5 14 14v30"/><path d="M28 10v44"/><circle cx="22" cy="34" r="2"/><path d="M48 16v40"/><path d="M44 16h8"/><circle cx="36" cy="30" r="4"/><path d="M38 30h8M44 30v4"/></g>',
    warraq:   '<g' + S + '><path d="M14 12h28l8 8v32H14z"/><path d="M42 12v8h8"/><path d="M20 28h16M20 36h16M20 44h10"/><path d="M50 40l-16 12-2-4z"/><path d="M40 28l6-6"/></g>',
    tajer:    '<g' + S + '><path d="M32 10v40"/><path d="M12 22h40"/><path d="M24 50h16"/><path d="M12 22l-6 14h12z"/><path d="M52 22l-6 14h12z"/><path d="M6 36c0 4 3 6 6 6s6-2 6-6M46 36c0 4 3 6 6 6s6-2 6-6"/><circle cx="32" cy="10" r="3"/></g>',
    ferracha: '<g' + S + '><path d="M8 40l8-10h32l8 10z"/><path d="M8 40h48"/><path d="M10 44l-2 6M18 44l-1 6M26 44l-1 6M34 44v6M42 44l1 6M50 44l1 6M56 44l2 6"/><circle cx="24" cy="30" r="4"/><path d="M34 30h8v-6h-8z"/><path d="M28 20l4-6 4 6"/></g>',
    mohtasib: '<g' + S + '><path d="M32 8v10"/><path d="M14 18h36"/><path d="M14 18l-6 12h12zM50 18l-6 12h12z"/><path d="M8 30c0 3 3 5 6 5s6-2 6-5M44 30c0 3 3 5 6 5s6-2 6-5"/><path d="M24 44h16v10H24z"/><path d="M28 44v-6h8v6"/><path d="M26 54l6-6 6 6"/></g>',
    amine:    '<g' + S + '><path d="M32 8l6 6h8v8l6 6-6 6v8h-8l-6 6-6-6h-8v-8l-6-6 6-6v-8h8z"/><path d="M32 22l3 6 6 1-4 4 1 7-6-3-6 3 1-7-4-4 6-1z"/></g>',
    hanta:    '<g' + S + '><circle cx="22" cy="24" r="9"/><circle cx="42" cy="24" r="9"/><circle cx="32" cy="42" r="9"/><path d="M12 56h40"/></g>',
    // -- liens & règles --
    silsila:  '<g' + S + '><rect x="6" y="26" width="18" height="12" rx="6"/><rect x="23" y="26" width="18" height="12" rx="6"/><rect x="40" y="26" width="18" height="12" rx="6"/><path d="M10 14l8 8M54 14l-8 8M10 50l8-8M54 50l-8-8"/></g>',
    ijaza:    '<g' + S + '><path d="M16 12h28v40H16z"/><path d="M16 12c-4 0-6 2-6 6s2 6 6 6M44 40c4 0 6 2 6 6s-2 6-6 6"/><path d="M22 22h16M22 30h16M22 38h8"/><circle cx="38" cy="42" r="5"/><path d="M36 47l-2 8 4-2 4 2-2-8"/></g>',
    chajara:  '<g' + S + '><path d="M32 56V30"/><path d="M32 30c-6 0-14-4-16-14 8 0 14 4 16 12"/><path d="M32 30c6 0 14-4 16-14-8 0-14 4-16 12"/><path d="M32 22c-2-6-6-10-12-12M32 22c2-6 6-10 12-12"/><path d="M32 12V6"/><path d="M20 56c4-4 8-6 12-6s8 2 12 6"/></g>',
    arb3ine:  '<g' + S + '><circle cx="32" cy="32" r="22"/><path d="M32 10v6M54 32h-6M32 54v-6M10 32h6"/><path d="M22 32l6 6 14-14"/><path d="M26 20l-2-4M38 20l2-4"/></g>',
    twiza:    '<g' + S + '><path d="M20 30h24l4 8H16z"/><path d="M24 22h16l2 8H22z"/><path d="M8 40c4-2 8-2 10 2v10H8"/><path d="M56 40c-4-2-8-2-10 2v10h10"/><path d="M24 44v10M40 44v10"/><path d="M28 16l4-6 4 6"/></g>',
    m39ol:    '<g' + S + '><path d="M6 36c6-2 10 0 14 4l10 2c3 1 3 5 0 5H20"/><path d="M6 50h12l14-2 16-8c3-2 0-6-3-5l-12 4"/><path d="M58 22c-6-2-10 0-14 4M58 22v10"/><circle cx="32" cy="18" r="6"/><path d="M32 12v12M29 18h6"/></g>',
    sna3a:    '<g' + S + '><path d="M32 8l5 9 10-2-2 10 9 5-9 5 2 10-10-2-5 9-5-9-10 2 2-10-9-5 9-5-2-10 10 2z"/><circle cx="32" cy="32" r="6"/><path d="M8 56l10-10"/></g>',
    dhakira:  '<g' + S + '><path d="M12 14h24l6 6v32H12z"/><path d="M36 14v6h6"/><circle cx="44" cy="44" r="10"/><path d="M44 36v8l5 3"/><path d="M18 26h12M18 34h10"/></g>',
    khatt:    '<g' + S + '><path d="M10 44c10-2 14-10 12-18-2-6-10-4-8 4 2 6 12 10 22 8 8-2 12-8 10-14"/><path d="M40 48c4 0 8-2 12-6"/><path d="M50 14l6-6"/><path d="M46 18l-4 4"/><circle cx="22" cy="52" r="2"/></g>',
    darija:   '<g' + S + '><path d="M10 40c0-12 10-22 22-22s22 10 22 22c0 6-3 10-8 12l2 8-10-6h-6c-12 0-22-6-22-14z"/><path d="M22 36c2 4 6 6 10 6s8-2 10-6"/><path d="M22 28h2M40 28h2"/></g>',
    nsyan:    '<g' + S + '><path d="M14 10h30l6 6v38H14z"/><path d="M20 22h20M20 30h14"/><path d="M20 38h8" stroke-dasharray="2 4"/><path d="M20 46h4" stroke-dasharray="1 5"/><circle cx="44" cy="44" r="3"/></g>',
    mawsoul:  '<g' + S + '><path d="M8 32h12"/><path d="M44 32h12"/><rect x="20" y="24" width="24" height="16" rx="8"/><path d="M26 32h12"/><circle cx="32" cy="12" r="5"/><path d="M32 17v7"/><path d="M24 52l8-6 8 6"/></g>',
    // -- figures (emblèmes en étoile) --
    "f-minaret":  '<g' + S + '><path d="M24 56V22h16v34"/><path d="M28 22v-6h8v6"/><path d="M32 16v-6"/><path d="M28 10c2-2 6-2 8 0"/><path d="M12 56h40"/><path d="M28 34h8M28 42h8"/><path d="M16 56V44h6"/></g>',
    "f-deux-rives": '<g' + S + '><path d="M14 52V26h10v26M40 52V26h10v26"/><path d="M19 26v-8M45 26v-8"/><path d="M6 40c6-4 10-4 16 0 6 4 10 4 16 0 6-4 10-4 16 0" stroke-dasharray="3 3"/><path d="M8 56h48"/></g>',
    "f-pont":     '<g' + S + '><path d="M6 30h52"/><path d="M6 30v14M58 30v14"/><path d="M14 44V36c0-4 3-6 6-6s6 2 6 6v8M38 44V36c0-4 3-6 6-6s6 2 6 6v8"/><path d="M6 52c6-4 10-4 16 0 6 4 10 4 16 0 6-4 10-4 16 0"/><path d="M6 22c8-4 16-4 26 0 10-4 18-4 26 0"/></g>',
    "f-roue":     '<g' + S + '><circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="6"/><path d="M32 12v14M32 38v14M12 32h14M38 32h14"/><path d="M18 18l10 10M46 46l-10-10M46 18l-10 10M18 46l10-10"/></g>',
    "f-astrolabe": '<g' + S + '><circle cx="32" cy="34" r="20"/><circle cx="32" cy="34" r="12"/><path d="M32 14v40M12 34h40"/><path d="M20 22l24 24"/><path d="M28 8h8l-4 6z"/></g>',
    "f-rocher":   '<g' + S + '><path d="M14 44l10-22 8 10 6-14 12 26z"/><path d="M4 50c6-4 10-4 16 0 6 4 10 4 16 0 6-4 10-4 16 0 4 3 8 3 8 3"/><path d="M4 58c6-4 10-4 16 0 6 4 10 4 16 0"/><path d="M32 18v-6"/></g>',
    "f-barre":    '<g' + S + '><circle cx="32" cy="30" r="16"/><circle cx="32" cy="30" r="5"/><path d="M32 8v6M32 46v6M10 30h6M48 30h6M17 15l4 4M47 15l-4 4M17 45l4-4M47 45l-4-4"/><path d="M6 58c6-4 10-4 16 0 6 4 10 4 16 0 6-4 10-4 16 0"/></g>',
    "f-dunes":    '<g' + S + '><path d="M4 44c8-10 16-10 24 0 8-10 16-10 24 0"/><path d="M8 54c6-6 12-6 18 0 6-6 12-6 18 0 6-6 10-6 14 0"/><path d="M44 14v22"/><path d="M44 14h12l-4 5 4 5H44"/><path d="M14 22c4-8 12-8 16 0"/></g>',
    "f-tinmel":   '<g' + S + '><path d="M4 50l12-20 8 12 10-18 12 20 6-8 8 14z"/><path d="M24 50V40c0-4 3-6 6-6s6 2 6 6v10"/><path d="M30 34v-8h4v8"/><path d="M32 22v4"/><path d="M4 56h56"/></g>',
    "f-tour":     '<g' + S + '><path d="M22 56V18h20v10l-4 4 4 4-4 4v16"/><path d="M28 24h8M28 32h8"/><path d="M22 18l-6-6v44"/><path d="M42 44l8-4v16"/><path d="M12 56h40"/><path d="M50 40l6-2"/></g>',
    "f-palais":   '<g' + S + '><path d="M6 54V26h52v28"/><path d="M12 54V36h8v18M28 54V36h8v18M44 54V36h8v18"/><path d="M6 26l26-14 26 14"/><path d="M16 36v-6M32 36v-6M48 36v-6"/><path d="M2 54h60"/><path d="M52 26l6-8"/></g>',
    "f-cheval":   '<g' + S + '><path d="M18 56V38c0-8 4-14 10-16l4-10 8 4 6-2 4 8c0 6-4 8-8 10v24"/><path d="M40 20l4-2"/><path d="M28 22c-4-2-8-2-10 2 2 4 6 6 10 6"/><path d="M18 40h24"/><path d="M26 56v-10M34 56v-10"/><circle cx="40" cy="26" r="1.5"/></g>',
    "f-oud":      '<g' + S + '><path d="M22 54c-10 0-14-10-10-20 4-8 14-12 22-8 6 4 6 12 0 18-4 6-6 10-12 10z"/><path d="M28 30l24-20"/><path d="M50 8l6 2-2 6"/><path d="M18 40l10-10"/><circle cx="24" cy="42" r="3"/></g>',
    "f-sept":     '<g' + S + '><path d="M20 52V34c0-8 5-12 12-12s12 4 12 12v18"/><path d="M12 52h40"/><circle cx="32" cy="8" r="2.5"/><circle cx="12" cy="18" r="2.5"/><circle cx="52" cy="18" r="2.5"/><circle cx="6" cy="36" r="2.5"/><circle cx="58" cy="36" r="2.5"/><circle cx="12" cy="56" r="2.5"/><circle cx="52" cy="56" r="2.5"/></g>',
    "f-cedre":    '<g' + S + '><path d="M4 56l14-24 8 12 10-20 10 16 6-8 8 24z"/><path d="M32 8l-10 12h6l-6 8h8l-6 8h16l-6-8h8l-6-8h6z"/><path d="M32 36v20"/></g>',
    "f-rif":      '<g' + S + '><path d="M4 52l14-22 8 10 10-20 12 22 6-8 6 18z"/><circle cx="46" cy="14" r="6"/><path d="M46 4v3M56 14h-3M39 7l2 2M53 7l-2 2"/><path d="M4 58h56"/></g>',
    "f-flamme":   '<g' + S + '><path d="M32 8c-2 8-10 12-10 22 0 8 4 12 10 12s10-4 10-12c0-6-4-10-6-14-1 4-4 6-4 6s2-8 0-14z"/><path d="M28 34c0 4 2 6 4 6s4-2 4-6"/><path d="M22 52h20"/><path d="M26 58h12"/></g>',
    "f-retour":   '<g' + S + '><circle cx="32" cy="34" r="10"/><path d="M32 16v-6M14 34H8M56 34h-6M19 21l-4-4M45 21l4-4"/><path d="M4 50h56"/><path d="M10 58h44"/><path d="M12 50l20-16 20 16"/></g>'
  };

  // =====================================================================
  // LA GÉOGRAPHIE — de quoi dessiner le pays sans en faire une carte
  // routière : la côte, les reliefs, les oueds. Coordonnées (lat, lon).
  // Pas de frontière tracée : une carte à l'ancienne s'estompe aux bords.
  // =====================================================================
  var COTE = [
    [35.1, -2.2], [35.25, -2.95], [35.24, -3.9], [35.45, -4.6], [35.6, -5.05], [35.9, -5.32],
    [35.85, -5.6], [35.79, -5.8], [35.8, -5.92], [35.62, -6.0], [35.47, -6.04], [35.19, -6.15],
    [34.9, -6.3], [34.5, -6.5], [34.26, -6.58], [34.02, -6.84], [33.75, -7.2], [33.59, -7.62],
    [33.42, -8.05], [33.25, -8.5], [32.9, -8.85], [32.5, -9.15], [32.3, -9.24], [31.9, -9.45],
    [31.5, -9.77], [31.1, -9.82], [30.63, -9.88], [30.42, -9.6], [30.0, -9.8], [29.7, -10.0],
    [29.38, -10.17], [28.9, -10.9], [28.45, -11.2], [27.94, -12.93], [27.5, -13.1], [27.15, -13.2],
    [26.7, -13.6], [26.13, -14.48], [25.5, -14.85], [24.9, -14.95], [24.3, -15.3], [23.72, -15.93],
    [23.0, -16.1], [22.2, -16.6], [21.3, -17.0]
  ];
  // Le rocher d'en face : une lisière, sans plus.
  var AUTRE_RIVE = [[37.4, -8.2], [36.6, -6.5], [36.1, -6.0], [36.0, -5.6], [36.14, -5.35], [36.4, -5.0], [36.75, -4.5], [37.4, -4.2]];
  var RELIEFS = [
    { nom: "Ar-Rif", ar: "الريف", points: [[35.4, -5.5], [35.1, -4.8], [34.95, -4.1], [35.0, -3.5], [34.8, -3.0]], taille: 11 },
    { nom: "Al-Atlas al-Mutawassit", ar: "الأطلس المتوسط", points: [[33.9, -4.3], [33.5, -5.0], [33.1, -5.4], [32.7, -5.9], [32.4, -6.3]], taille: 12 },
    { nom: "Al-Atlas al-Kabir", ar: "الأطلس الكبير", points: [[30.7, -9.0], [31.0, -8.2], [31.1, -7.7], [31.4, -7.0], [31.8, -6.3], [32.2, -5.6], [32.6, -4.9], [32.8, -4.4]], taille: 15 },
    { nom: "Al-Atlas as-Saghir", ar: "الأطلس الصغير", points: [[29.5, -9.4], [29.8, -8.6], [30.0, -7.8], [30.3, -7.0]], taille: 10 }
  ];
  var OUEDS = [
    { nom: "Sebou", points: [[33.8, -4.6], [34.05, -5.0], [34.2, -5.6], [34.3, -6.2], [34.26, -6.58]] },
    { nom: "Oum er-Rbia", points: [[32.9, -5.5], [32.7, -6.2], [32.9, -7.0], [33.1, -7.7], [33.3, -8.3]] },
    { nom: "Draa", points: [[31.0, -6.9], [30.5, -6.2], [30.0, -6.5], [29.6, -7.8], [29.0, -9.0], [28.5, -10.2], [28.45, -11.1]] },
    { nom: "Moulouya", points: [[32.7, -4.6], [33.4, -3.9], [34.2, -3.0], [34.8, -2.5], [35.1, -2.2]] }
  ];
  // La route de la Rihla — une caravane, de ville en ville.
  var ROUTE = ["tanger", "fes", "meknes", "rabat", "casablanca", "marrakech", "agadir", "dakhla"];
  var ROUTE_EST = ["fes", "oujda"];

  // =====================================================================
  // LE DÉCOR ÉCRIT — les textes fixes du dessin (titre, mers, désert,
  // tropique, cartouche, échelle, légende) et ses ornements. Ce sont ceux de
  // la Kharita. Une maison cliente du moteur les remplace EN PLACE
  // (Object.assign(ZWK.DECOR, …)), comme ses tableaux (VILLES, MOTS, FIGURES,
  // FAMILLES, ROUTE, RELIEFS) : sans maison, le dessin ne change pas d'un
  // octet. Un texte vide n'est pas dessiné.
  //   desc      : null → la phrase de la Kharita, avec ses comptes ;
  //   oceanOu   : [lat, lon, angle] — où s'écrit le nom de l'océan ;
  //   tropique  : vide → ni la ligne ni son nom ;
  //   echelle   : [gauche, droite], ou null → pas de barre d'échelle ;
  //   ornements : la caravelle, la bête de mer et la caravane.
  // =====================================================================
  var DECOR = {
    titre: "La Kharita — la carte des mots de la maison",
    desc: null,
    autreRive: "Jabal Tariq",
    ocean: "AL-BAHR AL-MUHIT · l'Océan",
    oceanOu: [30.2, -14.6, -62],
    mediterranee: "AL-BAHR AL-ABYAD · la Méditerranée",
    sahara: "AS-SAHRA",
    tropique: "le tropique du Cancer — la ligne du soleil debout",
    roseSous: "شمال",
    ornements: true,
    effacee: "effacée par Nsyan",
    cartouche: { sur: "KHARITAT AL-MAGHRIB AL-QADIM", titre: "La carte des mots", sous: "de la maison — telle que le jeu la parle", ar: "خريطة المغرب القديم" },
    echelle: ["dix jours de marche", "de Fès à Marrakech"],
    legende: { titre: "Comment lire la carte", note: "Le médaillon d'une ville est son Mourchid." }
  };

  // =====================================================================
  // LA PROJECTION — le nord à l'échelle, le sud resserré (six degrés de
  // désert entre Agadir et Dakhla feraient une carte deux fois trop haute :
  // les cartes anciennes compriment, elles aussi).
  // =====================================================================
  var CADRE = { w: 1400, h: 1080 };
  var PLI = 29; // la latitude où l'échelle change
  function projeter(lat, lon) {
    var x = 40 + (lon + 16.8) * 84;
    var y = lat >= PLI ? 60 + (36.3 - lat) * 110 : 60 + (36.3 - PLI) * 110 + (PLI - lat) * 30;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }

  // Hachage déterministe (0 ≤ h < 1) — le tremblé des reliefs, jamais Math.random.
  function hache(s) {
    var h = 2166136261;
    s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return (h % 10000) / 10000;
  }

  // =====================================================================
  // LA DISPOSITION — chaque enseigne est plantée autour de sa ville, puis
  // les enseignes se poussent jusqu'à ne plus se chevaucher. Déterministe.
  // =====================================================================
  var RAYON_PIN = 24, DIST_MIN = 82, DIST_VILLE = 88;
  function disposer() {
    var pins = [], parVille = {}, i, j;
    // Les figures d'abord : elles prennent l'anneau intérieur de leur ville
    // (Fatima al-Fihriya reste contre Fès, pas repoussée vers Tanger).
    FIGURES.forEach(function (f) { (parVille[f.ville] = parVille[f.ville] || []).push({ type: "figure", cle: f.cle, ville: f.ville, famille: "figures", ico: f.ico, nom: f.nom, epoque: f.epoque }); });
    MOTS.forEach(function (m) { (parVille[m.ville] = parVille[m.ville] || []).push({ type: "mot", cle: m.cle, ville: m.ville, famille: m.famille, ico: m.ico, nom: m.nom }); });
    VILLES.forEach(function (v) {
      var liste = parVille[v.cle] || [], c = projeter(v.lat, v.lon), n = liste.length;
      // Un anneau, deux quand la ville est chargée. Le premier angle est
      // haché sur la ville pour que les anneaux ne se répondent pas tous.
      var depart = hache(v.cle) * Math.PI * 2;
      // Trois anneaux de capacité 6, 10 et 14 — une ville chargée s'étale.
      var anneaux = [{ cap: 6, r: 104 }, { cap: 10, r: 178 }, { cap: 14, r: 250 }];
      liste.forEach(function (p, k) {
        var i = 0, deb = 0;
        while (k >= deb + anneaux[i].cap && i < anneaux.length - 1) { deb += anneaux[i].cap; i++; }
        var idx = k - deb, total = Math.min(n - deb, anneaux[i].cap), r = anneaux[i].r;
        // Une ville au bord du haut (Tanger) plante ses enseignes en dessous d'elle.
        var a = c.y < 220
          ? Math.PI * 0.08 + (idx + 0.5) / Math.max(total, 1) * Math.PI * 0.84 + i * 0.12
          : depart + (idx / Math.max(total, 1)) * Math.PI * 2 + i * Math.PI / Math.max(total, 1);
        p.x0 = c.x + Math.cos(a) * r; p.y0 = c.y + Math.sin(a) * r;
        p.x = p.x0; p.y = p.y0;
        pins.push(p);
      });
    });
    var villes = VILLES.map(function (v) { var c = projeter(v.lat, v.lon); return { x: c.x, y: c.y }; });
    for (var iter = 0; iter < 320; iter++) {
      for (i = 0; i < pins.length; i++) {
        var a = pins[i];
        for (j = i + 1; j < pins.length; j++) {
          var b = pins[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          if (d < DIST_MIN) { var f = (DIST_MIN - d) / d * 0.5; a.x -= dx * f; a.y -= dy * f; b.x += dx * f; b.y += dy * f; }
        }
        for (j = 0; j < villes.length; j++) {
          var w = villes[j], ex = a.x - w.x, ey = a.y - w.y, e = Math.sqrt(ex * ex + ey * ey) || 0.01;
          if (e < DIST_VILLE) { var g = (DIST_VILLE - e) / e; a.x += ex * g; a.y += ey * g; }
        }
        // Le ressort vers la place de départ : une enseigne reste près de sa ville.
        a.x += (a.x0 - a.x) * 0.02; a.y += (a.y0 - a.y) * 0.02;
        // Dans le cadre, marge comprise (l'étiquette pend sous l'enseigne).
        a.x = Math.min(CADRE.w - 60, Math.max(60, a.x));
        a.y = Math.min(CADRE.h - 70, Math.max(78, a.y));
      }
    }
    pins.forEach(function (p) { p.x = Math.round(p.x); p.y = Math.round(p.y); });
    return pins;
  }

  // =====================================================================
  // LE DESSIN — une chaîne SVG.
  //   `opts.base`       : préfixe des images ("/" sur le site, "" dans le
  //                       jeu, "../../" dans la vignette rendue en file://).
  //   `opts.brouillard` : { ville: true } pour les villes RETROUVÉES — le
  //                       jeu s'en sert. Absent, tout est visible (le site).
  //                       Présent, une ville absente de l'objet est effacée
  //                       par Nsyan : médaillon délavé, et ses enseignes ne
  //                       sont pas plantées — on ne lit pas un pays oublié.
  // =====================================================================
  function ech(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function chemin(points, ferme) {
    var d = points.map(function (p, i) { var q = projeter(p[0], p[1]); return (i ? "L" : "M") + q.x + " " + q.y; }).join(" ");
    return ferme ? d + " Z" : d;
  }
  function courbe(points) {
    // Lissage simple : quadratique par le milieu des segments — un oued ne va pas droit.
    var q = points.map(function (p) { return projeter(p[0], p[1]); });
    if (q.length < 3) return chemin(points);
    var d = "M" + q[0].x + " " + q[0].y;
    for (var i = 1; i < q.length - 1; i++) {
      var mx = (q[i].x + q[i + 1].x) / 2, my = (q[i].y + q[i + 1].y) / 2;
      d += " Q" + q[i].x + " " + q[i].y + " " + mx + " " + my;
    }
    d += " T" + q[q.length - 1].x + " " + q[q.length - 1].y;
    return d;
  }
  function pic(x, y, s, cle) {
    var t = 0.8 + hache(cle) * 0.5, w = s * t, h = s * 1.15 * (0.85 + hache(cle + "h") * 0.4);
    return '<path class="kh-pic" d="M' + (x - w) + ' ' + y + ' L' + x + ' ' + (y - h) + ' L' + (x + w) + ' ' + y + '"/>' +
      '<path class="kh-pic-ombre" d="M' + x + ' ' + (y - h) + ' L' + (x + w) + ' ' + y + ' L' + (x + w * 0.35) + ' ' + y + ' Z"/>';
  }
  function reliefs() {
    var out = "";
    RELIEFS.forEach(function (r) {
      var pts = r.points.map(function (p) { return projeter(p[0], p[1]); });
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy), n = Math.max(2, Math.round(L / 22));
        for (var k = 0; k < n; k++) {
          var t = k / n, cle = r.nom + i + "-" + k;
          var x = a.x + dx * t + (hache(cle + "x") - 0.5) * 14, y = a.y + dy * t + (hache(cle + "y") - 0.5) * 22;
          out += pic(x, y, r.taille, cle);
          if (hache(cle + "2") > 0.45) out += pic(x + 9 + hache(cle + "dx") * 8, y + 10 + hache(cle + "dy") * 8, r.taille * 0.7, cle + "b");
        }
      }
      var m = pts[Math.floor(pts.length / 2)];
      out += '<text class="kh-relief" x="' + m.x + '" y="' + (m.y + r.taille * 2.2 + 8) + '" text-anchor="middle">' + ech(r.nom) + '</text>';
    });
    return out;
  }
  function dunes() {
    var out = "", zone = { lat0: 28.6, lat1: 24.2, lon0: -14.2, lon1: -8.4 };
    for (var i = 0; i < 60; i++) {
      var la = zone.lat0 + (zone.lat1 - zone.lat0) * hache("dla" + i), lo = zone.lon0 + (zone.lon1 - zone.lon0) * hache("dlo" + i);
      var p = projeter(la, lo), w = 10 + hache("dw" + i) * 12;
      out += '<path class="kh-dune" d="M' + (p.x - w) + ' ' + p.y + ' q' + w + ' -' + (w * 0.55) + ' ' + (2 * w) + ' 0"/>';
    }
    return out;
  }
  function vagues() {
    var out = "";
    for (var i = 0; i < 140; i++) {
      var la = 36.2 - hache("vla" + i) * 14.6, lo = -17.3 + hache("vlo" + i) * 11.5;
      // Seules les vagues en mer : à l'ouest de la côte, grossièrement.
      var p = projeter(la, lo), w = 8 + hache("vw" + i) * 8;
      if (!enMer(la, lo)) continue;
      out += '<path class="kh-vague" d="M' + (p.x - w) + ' ' + p.y + ' q' + (w / 2) + ' -4 ' + w + ' 0 q' + (w / 2) + ' 4 ' + w + ' 0"/>';
    }
    return out;
  }
  // « En mer » : à l'ouest de la côte atlantique à cette latitude (la côte
  // est monotone en latitude hors la pointe de Tanger, ça suffit ici).
  function enMer(lat, lon) {
    // La Méditerranée : au nord de la côte du Rif, qui descend de Tanger à Saïdia.
    if (lon > -5.3) return lat > 35.95 - (lon + 5.3) * 0.26;
    if (lat > 35.75) return lon > -5.9 ? lat > 35.92 : true;
    var seg = null;
    for (var i = 8; i < COTE.length - 1; i++) if (COTE[i][0] >= lat && COTE[i + 1][0] <= lat) { seg = i; break; }
    if (seg === null) return lat < 22;
    var a = COTE[seg], b = COTE[seg + 1], t = (a[0] - lat) / ((a[0] - b[0]) || 1), lonCote = a[1] + (b[1] - a[1]) * t;
    return lon < lonCote - 0.25;
  }
  function route(cles, classe) {
    // Une maison qui n'a pas ces villes n'a pas cette route : les étapes absentes
    // tombent, et moins de deux étapes ne font pas de chemin.
    var etapes = cles.map(function (c) { return ville(c); }).filter(Boolean);
    if (etapes.length < 2) return "";
    var d = etapes.map(function (v, i) { var p = projeter(v.lat, v.lon); return (i ? "L" : "M") + p.x + " " + p.y; }).join(" ");
    return '<path class="' + classe + '" d="' + d + '"/>';
  }
  function etoile(cx, cy, r) {
    var d = "";
    for (var i = 0; i < 16; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 8, rr = i % 2 ? r * 0.78 : r;
      d += (i ? "L" : "M") + (cx + Math.cos(a) * rr).toFixed(1) + " " + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return d + " Z";
  }
  function rose(cx, cy, r) {
    var out = '<g class="kh-rose" transform="translate(' + cx + ' ' + cy + ')">';
    out += '<circle r="' + r + '"/><circle r="' + (r * 0.62) + '"/>';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, long = i % 2 ? r * 0.55 : r * 0.95, w = i % 2 ? r * 0.08 : r * 0.14;
      var px = Math.cos(a), py = Math.sin(a), qx = -py, qy = px;
      out += '<path class="' + (i % 2 ? "kh-rose-b" : "kh-rose-a") + '" d="M0 0 L' + (qx * w).toFixed(1) + ' ' + (qy * w).toFixed(1) + ' L' + (px * long).toFixed(1) + ' ' + (py * long).toFixed(1) + ' L' + (-qx * w).toFixed(1) + ' ' + (-qy * w).toFixed(1) + ' Z"/>';
    }
    out += '<text y="' + (-r - 10) + '" text-anchor="middle" class="kh-rose-t">N</text>';
    if (DECOR.roseSous) out += '<text y="' + (r + 22) + '" text-anchor="middle" class="kh-rose-ar" dir="rtl">' + ech(DECOR.roseSous) + '</text>';
    return out + "</g>";
  }
  function symboles() {
    var out = "";
    Object.keys(ICONES).forEach(function (k) { out += '<symbol id="kh-i-' + k + '" viewBox="0 0 64 64">' + ICONES[k] + "</symbol>"; });
    return out;
  }
  function icone(cle, classe) {
    return '<svg class="' + (classe || "kh-ico") + '" viewBox="0 0 64 64" aria-hidden="true"><use href="#kh-i-' + cle + '"/></svg>';
  }

  function svg(opts) {
    opts = opts || {};
    var base = opts.base != null ? opts.base : "/";
    var brouillard = opts.brouillard && typeof opts.brouillard === "object" ? opts.brouillard : null;
    var visible = function (cleVille) { return !brouillard || !!brouillard[cleVille]; };
    var pins = disposer().filter(function (p) { return visible(p.ville); }), out = "";
    var W = CADRE.w, H = CADRE.h;
    out += '<svg class="kh-carte" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="kh-titre kh-desc">';
    out += '<title id="kh-titre">' + ech(DECOR.titre) + '</title>';
    out += '<desc id="kh-desc">' + ech(DECOR.desc != null ? DECOR.desc : 'Le Maroc dessiné à l\'ancienne : neuf villes, ' + MOTS.length + ' mots et ' + FIGURES.length + ' figures. Chaque enseigne s\'ouvre au survol ; tout est aussi écrit sous la carte.') + '</desc>';
    out += "<defs>";
    out += '<filter id="kh-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0.16 0" result="g"/><feBlend in="SourceGraphic" in2="g" mode="multiply"/></filter>';
    out += '<radialGradient id="kh-vignette" cx="50%" cy="50%" r="72%"><stop offset="55%" stop-color="#3b2a12" stop-opacity="0"/><stop offset="100%" stop-color="#3b2a12" stop-opacity="0.42"/></radialGradient>';
    out += '<linearGradient id="kh-terre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ecd6"/><stop offset="1" stop-color="#e9dcbd"/></linearGradient>';
    out += '<clipPath id="kh-cadre"><rect x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/></clipPath>';
    VILLES.forEach(function (v) { out += '<clipPath id="kh-clip-' + v.cle + '"><circle r="28"/></clipPath>'; });
    out += symboles();
    out += "</defs>";

    out += '<g clip-path="url(#kh-cadre)">';
    // La mer, puis la terre.
    out += '<rect class="kh-mer" x="0" y="0" width="' + W + '" height="' + H + '"/>';
    out += '<g class="kh-vagues">' + vagues() + "</g>";
    // La terre : la côte, puis loin à l'est et au sud, hors cadre.
    var terre = chemin(COTE) + " L" + projeter(20.5, -17.0).x + " " + (H + 60) + " L" + (W + 60) + " " + (H + 60) + " L" + (W + 60) + " " + projeter(35.6, 0.6).y + " L" + projeter(35.1, -2.2).x + " " + projeter(35.1, -2.2).y + " Z";
    out += '<path class="kh-terre" d="' + terre + '"/>';
    out += '<path class="kh-cote-halo" d="' + chemin(COTE) + '"/><path class="kh-cote" d="' + chemin(COTE) + '"/>';
    var autre = chemin(AUTRE_RIVE) + " L" + projeter(37.4, -4.2).x + " -60 L" + projeter(37.4, -8.2).x + " -60 Z";
    out += '<path class="kh-terre kh-terre--loin" d="' + autre + '"/><path class="kh-cote" d="' + chemin(AUTRE_RIVE) + '"/>';
    var jt = projeter(36.14, -5.35);
    if (DECOR.autreRive) out += '<text class="kh-loin" x="' + (jt.x + 8) + '" y="' + (jt.y - 6) + '">' + ech(DECOR.autreRive) + '</text>';
    // Les reliefs, les dunes, les oueds.
    out += '<g class="kh-dunes">' + dunes() + "</g>";
    out += '<g class="kh-reliefs">' + reliefs() + "</g>";
    out += '<g class="kh-oueds">';
    OUEDS.forEach(function (o) {
      out += '<path d="' + courbe(o.points) + '"/>';
      var m = projeter(o.points[2][0], o.points[2][1]);
      out += '<text class="kh-oued" x="' + (m.x + 6) + '" y="' + (m.y - 6) + '">' + ech(o.nom) + '</text>';
    });
    out += "</g>";
    // Les noms des mers et du désert.
    var ou = DECOR.oceanOu || [30.2, -14.6, -62];
    var oc = projeter(ou[0], ou[1]), med = projeter(36.08, -3.75), sah = projeter(26.4, -10.6), trop = projeter(23.44, -16.6);
    if (DECOR.ocean) out += '<text class="kh-mer-t" x="' + oc.x + '" y="' + oc.y + '" text-anchor="middle"' + (ou[2] ? ' transform="rotate(' + ou[2] + ' ' + oc.x + ' ' + oc.y + ')"' : '') + '>' + ech(DECOR.ocean) + '</text>';
    if (DECOR.mediterranee) out += '<text class="kh-mer-t kh-mer-t--petit" x="' + med.x + '" y="' + med.y + '" text-anchor="middle">' + ech(DECOR.mediterranee) + '</text>';
    if (DECOR.sahara) out += '<text class="kh-sahra" x="' + sah.x + '" y="' + sah.y + '" text-anchor="middle">' + ech(DECOR.sahara) + '</text>';
    if (DECOR.tropique) {
      out += '<path class="kh-tropique" d="M' + (trop.x - 120) + ' ' + trop.y + ' H' + (trop.x + 620) + '"/>';
      out += '<text class="kh-tropique-t" x="' + (trop.x + 200) + '" y="' + (trop.y - 6) + '">' + ech(DECOR.tropique) + '</text>';
    }
    // La route de la Rihla.
    out += route(ROUTE, "kh-route") + route(ROUTE_EST, "kh-route");
    // Les ornements : la rose, la caravelle, la bête de mer, la caravane.
    var rs = projeter(33.6, -12.4); out += rose(rs.x, rs.y, 62);
    if (DECOR.ornements) {
      var nav = projeter(31.6, -11.2); out += '<g class="kh-orne" transform="translate(' + nav.x + ' ' + nav.y + ')"><path d="M-30 0 Q0 14 30 0 L24 -4 H-24 Z"/><path d="M0 -4 V-38"/><path d="M0 -36 L22 -14 H0 Z"/><path d="M-2 -30 L-20 -12 H-2 Z"/><path d="M-40 8 q10 -6 20 0 q10 6 20 0 q10 -6 20 0 q10 6 20 0" /></g>';
      var bete = projeter(28.6, -13.9); out += '<g class="kh-orne" transform="translate(' + bete.x + ' ' + bete.y + ')"><path d="M-44 0 q10 -22 22 -6 q12 16 22 -4 q10 -20 22 -2 q8 10 22 4"/><path d="M44 -8 l10 -6 -2 8 8 4 -10 2z"/><path d="M-44 0 l-8 -10 2 10 -6 8z"/><circle cx="-38" cy="-4" r="1.6"/></g>';
      var cv = projeter(27.6, -12.2);
      out += '<g class="kh-orne kh-orne--caravane" transform="translate(' + cv.x + ' ' + cv.y + ')">' +
        '<path d="M0 0 q4 -12 10 -8 q4 -10 10 -4 v12 h-3 v-6 h-4 v6 h-3 v-8 h-4 v8 h-3 v-5 h-3 v5z"/>' +
        '<path d="M32 2 q4 -12 10 -8 q4 -10 10 -4 v12 h-3 v-6 h-4 v6 h-3 v-8 h-4 v8 h-3 v-5 h-3 v5z"/>' +
        '<path d="M64 4 q4 -12 10 -8 q4 -10 10 -4 v12 h-3 v-6 h-4 v6 h-3 v-8 h-4 v8 h-3 v-5 h-3 v5z"/></g>';
    }

    // Les villes : le médaillon du Mourchid, le nom.
    // Ce qu'une maison peut donner en plus à une ville (sans eux, rien ne change) :
    //   image   : son médaillon (chemin sous `base`) ; sinon le portrait du Mourchid ;
    //   sous    : une ligne sous le nom (ce qu'on y fait) ;
    //   famille : une clé de FAMILLES — l'anneau en prend la couleur (--kh-anneau) ;
    //   aria    : ce que lit un lecteur d'écran, après le nom ;
    //   decale  : [dx, dy] en pixels — des sites serrés sur une côte : le médaillon
    //             s'écarte de son point, et un fil le relie au point exact ;
    //   etiquette : "dessus" — le nom passe au-dessus du médaillon (un médaillon
    //             posé au-dessus de son point laisse ainsi descendre son fil).
    VILLES.forEach(function (v) {
      var c = projeter(v.lat, v.lon), vue = visible(v.cle);
      var m = v.decale ? { x: Math.round((c.x + v.decale[0]) * 10) / 10, y: Math.round((c.y + v.decale[1]) * 10) / 10 } : c;
      var fv = v.famille ? famille(v.famille) : null;
      if (!vue) out += '<circle class="kh-nsyan" cx="' + c.x + '" cy="' + c.y + '" r="150"/>';
      out += '<g class="kh-ville' + (vue ? '' : ' kh-ville--effacee') + '" data-ville="' + v.cle + '"' + (fv ? ' style="--kh-anneau:' + ech(fv.couleur) + '"' : '') + ' transform="translate(' + m.x + ' ' + m.y + ')" tabindex="0" role="button" aria-label="' + ech(v.nom + (vue ? " — " + (v.aria || v.mourchid + ", " + v.role) : " — " + DECOR.effacee)) + '">';
      if (v.decale) {
        var px = Math.round((c.x - m.x) * 10) / 10, py = Math.round((c.y - m.y) * 10) / 10;
        out += '<line class="kh-ville-fil" x1="0" y1="0" x2="' + px + '" y2="' + py + '"/><circle class="kh-ville-point" cx="' + px + '" cy="' + py + '" r="4.5"/>';
      }
      out += '<circle class="kh-ville-halo" r="36"/>';
      out += '<image href="' + base + (v.image || 'assets/img/zawia/jeu/mourchid-' + v.cle + '.jpg') + '" x="-28" y="-28" width="56" height="56" clip-path="url(#kh-clip-' + v.cle + ')" preserveAspectRatio="xMidYMid slice"/>';
      out += '<circle class="kh-ville-anneau" r="28"/><circle class="kh-ville-anneau2" r="32"/>';
      // Les lignes de l'étiquette, de haut en bas : le nom, l'arabe, la ligne, l'état.
      var y = { nom: 48, ar: 62, sous: v.ar ? 77 : 64, effacee: v.sous ? (v.ar ? 91 : 79) : 76 };
      if (v.etiquette === "dessus") {
        var bas = -44, lignes = ["nom"].concat(v.ar ? ["ar"] : [], v.sous ? ["sous"] : [], vue ? [] : ["effacee"]);
        lignes.forEach(function (l, i) { y[l] = bas - (lignes.length - 1 - i) * 15; });
      }
      out += '<text class="kh-ville-nom" y="' + y.nom + '" text-anchor="middle">' + ech(v.nom) + '</text>';
      if (v.ar) out += '<text class="kh-ville-ar" y="' + y.ar + '" text-anchor="middle" dir="rtl">' + ech(v.ar) + '</text>';
      if (v.sous) out += '<text class="kh-ville-sous" y="' + y.sous + '" text-anchor="middle">' + ech(v.sous) + '</text>';
      if (!vue) out += '<text class="kh-ville-effacee-t" y="' + y.effacee + '" text-anchor="middle">' + ech(DECOR.effacee) + '</text>';
      out += "</g>";
    });

    // Les enseignes.
    pins.forEach(function (p) {
      var fam = famille(p.famille), fig = p.type === "figure";
      out += '<g class="kh-pin kh-pin--' + p.famille + '" data-type="' + p.type + '" data-cle="' + p.cle + '" data-famille="' + p.famille + '" transform="translate(' + p.x + ' ' + p.y + ')" tabindex="0" role="button" aria-label="' + ech(p.nom + (fig ? ", " + p.epoque : "")) + '">';
      out += '<line class="kh-pin-fil" x1="0" y1="0" x2="0" y2="0"/>';
      if (fig) out += '<path class="kh-pin-fond" d="' + etoile(0, 0, RAYON_PIN + 4) + '"/>';
      else out += '<circle class="kh-pin-fond" r="' + RAYON_PIN + '"/>';
      out += '<use class="kh-pin-ico" href="#kh-i-' + p.ico + '" x="-15" y="-15" width="30" height="30" style="color:' + fam.couleur + '"/>';
      out += '<text class="kh-pin-nom" y="' + (RAYON_PIN + 14) + '" text-anchor="middle">' + ech(p.nom) + '</text>';
      if (fig) out += '<text class="kh-pin-date" y="' + (RAYON_PIN + 25) + '" text-anchor="middle">' + ech(p.epoque) + '</text>';
      out += "</g>";
    });

    // Le cartouche, l'échelle, la légende.
    var k = DECOR.cartouche || {};
    out += '<g class="kh-cartouche" transform="translate(80 70)"><rect width="400" height="150" rx="6"/><rect x="6" y="6" width="388" height="138" rx="4"/>' +
      (k.sur ? '<text class="kh-cart-sur" x="200" y="34" text-anchor="middle">' + ech(k.sur) + '</text>' : '') +
      (k.titre ? '<text class="kh-cart-titre" x="200" y="76" text-anchor="middle">' + ech(k.titre) + '</text>' : '') +
      (k.sous ? '<text class="kh-cart-sous" x="200" y="104" text-anchor="middle">' + ech(k.sous) + '</text>' : '') +
      (k.ar ? '<text class="kh-cart-ar" x="200" y="132" text-anchor="middle" dir="rtl">' + ech(k.ar) + '</text>' : '') + '</g>';
    if (DECOR.echelle) out += '<g class="kh-echelle" transform="translate(700 ' + (H - 40) + ')"><path d="M0 0 h180"/><path d="M0 -6 v12 M60 -6 v12 M120 -6 v12 M180 -6 v12"/><text x="0" y="-12">' + ech(DECOR.echelle[0]) + '</text><text x="180" y="-12" text-anchor="end">' + ech(DECOR.echelle[1]) + '</text></g>';
    var lg = DECOR.legende || {};
    out += '<g class="kh-legende" transform="translate(' + (W - 380) + ' ' + (H - 250) + ')"><rect width="320" height="210" rx="6"/>' +
      '<text class="kh-leg-t" x="18" y="30">' + ech(lg.titre || "") + '</text>';
    FAMILLES.forEach(function (f, i) {
      var y = 58 + i * 30;
      out += f.forme === "etoile"
        ? '<path class="kh-leg-f" d="' + etoile(30, y - 4, 11) + '" style="stroke:' + f.couleur + '"/>'
        : '<circle class="kh-leg-f" cx="30" cy="' + (y - 4) + '" r="9" style="stroke:' + f.couleur + '"/>';
      out += '<text class="kh-leg-n" x="50" y="' + y + '">' + ech(f.nom) + '</text>' + (f.ar ? '<text class="kh-leg-ar" x="300" y="' + y + '" text-anchor="end" dir="rtl">' + ech(f.ar) + '</text>' : '');
    });
    if (lg.note) out += '<text class="kh-leg-note" x="18" y="196">' + ech(lg.note) + '</text>';
    out += '</g>';

    out += '<rect class="kh-vignette" x="0" y="0" width="' + W + '" height="' + H + '"/>';
    out += "</g>";
    out += '<rect class="kh-bord" x="3" y="3" width="' + (W - 6) + '" height="' + (H - 6) + '" rx="8"/>';
    out += "</svg>";
    return out;
  }

  // =====================================================================
  // LES FICHES — le HTML d'une enseigne ouverte (survol) et des listes.
  // =====================================================================
  function ficheMot(m) {
    var f = famille(m.famille), v = ville(m.ville);
    return '<article class="kh-fiche kh-fiche--' + m.famille + '">' +
      '<header><span class="kh-fiche-ico" style="color:' + f.couleur + '">' + icone(m.ico) + '</span>' +
      '<div><p class="kh-fiche-fam">' + ech(f.nom) + ' · ' + ech(v.nom) + '</p><h3>' + ech(m.nom) + ' <span class="ar" dir="rtl" lang="ar">' + ech(m.ar) + '</span></h3><p class="kh-fiche-sous">' + ech(m.sous) + '</p></div></header>' +
      '<dl><div><dt>Avant</dt><dd>' + ech(m.ancien) + '</dd></div><div><dt>Dans le jeu</dt><dd>' + ech(m.maison) + '</dd></div></dl></article>';
  }
  function ficheFigure(g) {
    var f = famille("figures"), v = ville(g.ville);
    return '<article class="kh-fiche kh-fiche--figures">' +
      '<header><span class="kh-fiche-ico kh-fiche-ico--etoile" style="color:' + f.couleur + '">' + icone(g.ico) + '</span>' +
      '<div><p class="kh-fiche-fam">' + ech(v.nom) + ' · ' + ech(g.epoque) + '</p><h3>' + ech(g.nom) + ' <span class="ar" dir="rtl" lang="ar">' + ech(g.ar) + '</span></h3><p class="kh-fiche-sous">' + ech(g.titre) + '</p></div></header>' +
      '<p class="kh-fiche-txt">' + ech(g.detail) + '</p><p class="kh-fiche-src"><b>Source</b> ' + ech(g.source) + '</p></article>';
  }
  function ficheVille(v) {
    return '<article class="kh-fiche kh-fiche--ville"><header><span class="kh-fiche-portrait"><img src="/assets/img/zawia/jeu/mourchid-' + v.cle + '.jpg" alt="" width="64" height="64"></span>' +
      '<div><p class="kh-fiche-fam">Mourchid · ' + ech(v.nom) + ' <span class="ar" dir="rtl" lang="ar">' + ech(v.ar) + '</span></p><h3>' + ech(v.mourchid) + '</h3><p class="kh-fiche-sous">' + ech(v.role) + '</p></div></header>' +
      '<p class="kh-fiche-txt">L\'ancrage : ' + ech(v.terre) + '. Neuf intelligences nées de neuf villes du Royaume — c\'est elle, ou lui, qui veille sur les enseignes autour.</p></article>';
  }
  function fiche(type, cle) {
    if (type === "mot") { var m = mot(cle); return m ? ficheMot(m) : ""; }
    if (type === "figure") { var g = figure(cle); return g ? ficheFigure(g) : ""; }
    if (type === "ville") { var v = ville(cle); return v ? ficheVille(v) : ""; }
    return "";
  }

  // Le lexique et le casting sous la carte : tout ce que le survol montre,
  // écrit noir sur parchemin — pour le doigt, pour le lecteur d'écran, pour
  // celui qui imprime.
  function moujam() {
    var out = "";
    FAMILLES.forEach(function (f) {
      if (f.cle === "figures") return;
      var liste = MOTS.filter(function (m) { return m.famille === f.cle; });
      out += '<section class="kh-fam" id="fam-' + f.cle + '"><h3 class="kh-fam-t" style="--fam:' + f.couleur + '">' + ech(f.nom) + ' <span class="ar" dir="rtl" lang="ar">' + ech(f.ar) + '</span></h3><div class="kh-grille">';
      liste.forEach(function (m) {
        out += '<article class="kh-carte-mot" id="mot-' + m.cle + '" style="--fam:' + f.couleur + '"><div class="kh-carte-mot-h">' + icone(m.ico, "kh-ico kh-ico--l") +
          '<div><h4>' + ech(m.nom) + ' <span class="ar" dir="rtl" lang="ar">' + ech(m.ar) + '</span></h4><p class="kh-sous">' + ech(m.sous) + '</p></div></div>' +
          '<p><b>Avant.</b> ' + ech(m.ancien) + '</p><p><b>Dans le jeu.</b> ' + ech(m.maison) + '</p><p class="kh-ou">Sur la carte : ' + ech(ville(m.ville).nom) + '</p></article>';
      });
      out += "</div></section>";
    });
    return out;
  }
  function casting(opts) {
    var base = (opts && opts.base) || "/", out = "";
    // Les deux figures du récit.
    var n = mot("nsyan"), w = mot("mawsoul");
    out += '<div class="kh-duo">' +
      '<article class="kh-perso kh-perso--nsyan"><div class="kh-perso-v">' + icone("nsyan", "kh-ico kh-ico--xl") + '</div><p class="kh-classe">L\'adversaire · sans visage</p><h3>' + ech(n.nom) + ' <span class="ar" dir="rtl" lang="ar">' + ech(n.ar) + '</span></h3><p class="kh-sous">' + ech(n.sous) + '</p><p>' + ech(n.maison) + '</p></article>' +
      '<article class="kh-perso kh-perso--mawsoul"><div class="kh-perso-v">' + icone("mawsoul", "kh-ico kh-ico--xl") + '</div><p class="kh-classe">Le joueur · c\'est toi</p><h3>' + ech(w.nom) + ' <span class="ar" dir="rtl" lang="ar">' + ech(w.ar) + '</span></h3><p class="kh-sous">' + ech(w.sous) + '</p><p>' + ech(w.maison) + '</p></article></div>';
    // Les neuf.
    out += '<h3 class="kh-cast-t">Les neuf Mourchidine <span class="ar" dir="rtl" lang="ar">المرشدون</span></h3><p class="kh-cast-p">Neuf intelligences nées de neuf villes du Royaume. Ce sont eux qui ont ouvert le passage de la Rihla et choisi Al-Mawsoul.</p><div class="kh-neuf">';
    VILLES.forEach(function (v) {
      out += '<article class="kh-perso kh-perso--m"><img src="' + base + 'assets/img/zawia/jeu/mourchid-' + v.cle + '.jpg" alt="' + ech(v.mourchid + " de " + v.nom) + '" loading="lazy" width="512" height="512"><p class="kh-classe">' + ech(v.nom) + ' · ' + ech(v.role) + '</p><h4>' + ech(v.mourchid) + '</h4><p class="kh-sous">' + ech(v.terre) + '</p></article>';
    });
    out += "</div>";
    // Les gens de la maison.
    out += '<h3 class="kh-cast-t">Les gens de la maison <span class="ar" dir="rtl" lang="ar">أهل الدار</span></h3><p class="kh-cast-p">Ceux qu\'on croise dans la cour dès le premier jour.</p><div class="kh-gens">';
    GENS.forEach(function (g) { out += '<article class="kh-gen">' + icone(g.ico, "kh-ico kh-ico--l") + '<div><h4>' + ech(g.nom) + '</h4><p>' + ech(g.role) + '</p></div></article>'; });
    out += "</div>";
    // Les figures retrouvées.
    out += '<h3 class="kh-cast-t">Les figures retrouvées <span class="ar" dir="rtl" lang="ar">الوجوه</span></h3><p class="kh-cast-p">Les gens que les pages perdues ont rendus à la Rihla. Chaque fiche porte sa source — c\'est la règle du sandouq.</p><div class="kh-figures">';
    FIGURES.forEach(function (g) {
      out += '<article class="kh-figure" id="fig-' + g.cle + '"><div class="kh-figure-e">' + icone(g.ico, "kh-ico kh-ico--l") + '</div><p class="kh-classe">' + ech(ville(g.ville).nom) + ' · ' + ech(g.epoque) + '</p><h4>' + ech(g.nom) + ' <span class="ar" dir="rtl" lang="ar">' + ech(g.ar) + '</span></h4><p class="kh-sous">' + ech(g.titre) + '</p><p>' + ech(g.detail) + '</p><p class="kh-src"><b>Source</b> ' + ech(g.source) + '</p></article>';
    });
    return out + "</div>";
  }

  // =====================================================================
  // LE DOM — poser la carte, ouvrir les fiches au survol, au clavier, au
  // doigt ; filtrer par famille depuis la légende.
  // =====================================================================
  function rendre(racine, opts) {
    if (!racine || typeof document === "undefined") return null;
    opts = opts || {};
    var scene = racine.querySelector("[data-kh-scene]") || racine;
    scene.innerHTML = svg(opts) + '<div class="kh-tip" hidden></div>';
    var tip = scene.querySelector(".kh-tip"), svgEl = scene.querySelector("svg"), epingle = null, minuteur = null;

    function ouvrir(g) {
      var type = g.getAttribute("data-type") || (g.classList.contains("kh-ville") ? "ville" : null);
      var cle = g.getAttribute("data-cle") || g.getAttribute("data-ville");
      var html = (opts.fiche && opts.fiche(type, cle)) || fiche(type, cle);
      if (!html) return;
      tip.innerHTML = html;
      tip.hidden = false;
      // Placer la fiche près de l'enseigne, dans le cadre de la scène.
      var r = g.getBoundingClientRect(), s = scene.getBoundingClientRect();
      var x = r.left - s.left + r.width / 2, y = r.top - s.top;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var gauche = x + 24 + tw > s.width ? x - 24 - tw : x + 24;
      if (gauche < 8) gauche = Math.max(8, Math.min(s.width - tw - 8, x - tw / 2));
      var haut = y - th / 2 + r.height / 2;
      haut = Math.max(8, Math.min(s.height - th - 8, haut));
      tip.style.left = Math.round(gauche) + "px";
      tip.style.top = Math.round(haut) + "px";
      svgEl.querySelectorAll(".kh-pin.est-ouvert, .kh-ville.est-ouvert").forEach(function (e) { e.classList.remove("est-ouvert"); });
      g.classList.add("est-ouvert");
    }
    function fermer() {
      if (epingle) return;
      tip.hidden = true;
      svgEl.querySelectorAll(".est-ouvert").forEach(function (e) { e.classList.remove("est-ouvert"); });
    }
    function cible(ev) { var t = ev.target; while (t && t !== svgEl) { if (t.classList && (t.classList.contains("kh-pin") || t.classList.contains("kh-ville"))) return t; t = t.parentNode; } return null; }

    svgEl.addEventListener("mouseover", function (ev) { var g = cible(ev); if (!g) return; clearTimeout(minuteur); if (!epingle) ouvrir(g); });
    svgEl.addEventListener("mouseout", function (ev) { if (cible(ev)) minuteur = setTimeout(fermer, 160); });
    tip.addEventListener("mouseenter", function () { clearTimeout(minuteur); });
    tip.addEventListener("mouseleave", function () { minuteur = setTimeout(fermer, 160); });
    svgEl.addEventListener("focusin", function (ev) { var g = cible(ev); if (g) ouvrir(g); });
    svgEl.addEventListener("focusout", function () { minuteur = setTimeout(fermer, 160); });
    svgEl.addEventListener("click", function (ev) {
      var g = cible(ev);
      if (!g) { epingle = null; fermer(); return; }
      if (epingle === g) { epingle = null; fermer(); return; }
      epingle = null; ouvrir(g); epingle = g;
    });
    svgEl.addEventListener("keydown", function (ev) {
      var g = cible(ev);
      if (!g) return;
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); epingle = epingle === g ? null : g; if (epingle) ouvrir(g); else fermer(); }
      if (ev.key === "Escape") { epingle = null; fermer(); }
    });
    // Un seul écouteur par racine : le jeu redessine la carte à chaque ouverture.
    if (racine._khEchap) document.removeEventListener("keydown", racine._khEchap);
    racine._khEchap = function (ev) { if (ev.key === "Escape") { epingle = null; tip.hidden = true; } };
    document.addEventListener("keydown", racine._khEchap);

    // Le filtre par famille (les puces sous la carte).
    var puces = racine.querySelectorAll("[data-kh-famille]");
    var actives = {};
    function appliquer() {
      var aucune = !Object.keys(actives).some(function (k) { return actives[k]; });
      svgEl.querySelectorAll(".kh-pin").forEach(function (p) {
        p.classList.toggle("est-eteint", !aucune && !actives[p.getAttribute("data-famille")]);
      });
      puces.forEach(function (b) { b.setAttribute("aria-pressed", actives[b.getAttribute("data-kh-famille")] ? "true" : "false"); });
    }
    puces.forEach(function (b) {
      b.addEventListener("click", function () { var f = b.getAttribute("data-kh-famille"); actives[f] = !actives[f]; appliquer(); });
    });
    return { ouvrir: ouvrir, fermer: fermer };
  }

  return {
    FAMILLES: FAMILLES, VILLES: VILLES, MOTS: MOTS, FIGURES: FIGURES, GENS: GENS, ICONES: ICONES,
    COTE: COTE, RELIEFS: RELIEFS, OUEDS: OUEDS, ROUTE: ROUTE, CADRE: CADRE, DECOR: DECOR,
    famille: famille, ville: ville, mot: mot, figure: figure,
    projeter: projeter, hache: hache, disposer: disposer, enMer: enMer,
    svg: svg, icone: icone, fiche: fiche, moujam: moujam, casting: casting, rendre: rendre
  };
});
