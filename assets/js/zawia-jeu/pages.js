// ZAW'IA — le jeu · LES PAGES PERDUES (pures : ni DOM, ni réseau, ni canvas).
//
// Le mode « histoire du Maroc » : Nsyan a arraché neuf pages à la Rihla, une
// par ville des neuf Mourchidine. Chaque page est une énigme dont la réponse
// est un FAIT marocain — et dont la résolution exerce une VOIE de la Sna3a :
// dire juste (le prompt), voir juste (l'image générée, confrontée au réel),
// vérifier juste (ce qu'un modèle sait, devine, et où aller voir).
// Apprendre l'IA en s'amusant, en se reconnectant à son histoire.
//
// Trois règles, tenues par les tests :
//   1. Chaque page porte une SOURCE vérifiable — l'histoire jouée reste exacte,
//      ou elle ne se joue pas. C'est le rôle du « Fqih de l'histoire » : relire
//      ces neuf entrées avant chaque ajout.
//   2. La réponse se compare NORMALISÉE (casse, accents, articles, alef) : on
//      ne refuse pas « Fatima al Fihri » parce qu'on attendait un tiret.
//   3. Une page rapporte de la DHAKIRA — l'axe culture marocaine. Jamais de
//      Sna3a (la technique se mesure aux Ta7addi), jamais de M39ol, jamais un rang.
//
// v3.4 — LES CARTES DE LA DHAKIRA (15/09/2026, décision de Youssef). Le
// sandouq devient une SAISON : après les dix pages fondatrices (saison 0,
// ouvertes d'emblée), douze pages de plus (saison 1) s'ouvrent UNE PAR
// SEMAINE, le jeudi à minuit, heure de Casablanca — champ `des`. Chaque page
// retrouvée donne une CARTE : le portrait peint du personnage, sa ville, son
// époque, sa source ; dorée quand on l'a trouvée sans indice. Douze cartes et
// le joueur est Rawi — celui qui peut raconter. La règle 1 vaut double ici :
// ces pages parlent de personnes, chaque ligne a été relue contre une source.
// Ce que la carte NE donne PAS : le M39ol. Raconter sa page à la halqa, oui —
// et c'est le bureau qui crédite, jamais le sandouq.
//
// ⚠️ Le voile (ZAWIA-VOILE.md) s'applique : la maison ne se nomme pas.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.pages = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var DHAKIRA_PAGE = 10;     // ce qu'une page rapporte, en Dhakira
  var BONUS_SANS_INDICE = 5; // …et cinq de plus quand on l'a trouvée seul

  // ---- Les neuf pages, dans l'ordre du voyage ------------------------------------
  // Fès (le hub) → l'ouest et le sud → l'est → Tanger, où le voyageur est né :
  // la Rihla se referme sur celui qui l'a dictée.
  //
  // Champs : cle · ville (cle d'un Mourchid) · epoque · titre · enigme ·
  // indices [l'aide de l'IA, puis un indice de fond] · reponses (la première
  // est la forme canonique) · fait · source · voie (prompt | image | savoir).
  // Chaque page porte `saison` (0 : fondatrices ; 1 : la saison des cartes) et,
  // pour la saison 1, `des` : la date (AAAA-MM-JJ) à partir de laquelle elle s'ouvre.
  var PAGES = [
    {
      cle: "fes-fondatrice", ville: "fes", epoque: "859", titre: "La fondatrice", voie: "prompt", saison: 0,
      enigme: "Une héritière venue de Kairouan a bâti à Fès, en 859, une mosquée devenue le plus ancien établissement d'enseignement encore en activité. La tradition dit qu'elle y a mis tout ce que son père lui avait laissé. Nsyan a effacé son nom. Rends-le-lui.",
      indices: [
        "Voie « dire juste » : demande au modèle la fondatrice d'Al-Qarawiyine en donnant la ville, l'année et le mot « mosquée-université ». Un prompt qui pose le contexte obtient un nom ; un prompt vague obtient une légende.",
        "Sa famille était arrivée de Kairouan — c'est ce que dit le nom de la mosquée, al-Qarawiyine, « celle des Kairouanais ». Son nom à elle est celui d'un clan arabe, les Banu Fihr."
      ],
      reponses: ["Fatima al-Fihriya", "Fatima al-Fihri", "Fatima el Fihria", "Fatima Fihriya", "Fatima Fihri", "Oum al-Banine", "Fatima al-Fihriyya", "Fatima al-Fihriyyah", "Fatima Fihriyya", "Fatima bint Mohammed al-Fihri", "فاطمة الفهرية", "فاطمة الفهري"],
      fait: "Fatima al-Fihriya, fille d'un marchand venu de Kairouan, fonde la mosquée Al-Qarawiyine en 859 (245 de l'hégire). Elle devient un centre d'enseignement qui n'a jamais fermé depuis : Ibn Khaldoun y passe au XIVᵉ siècle. On l'appelle aussi Oum al-Banine, « la mère des fils ». Prudence d'usage : la fondation par Fatima nous vient d'une seule source ancienne, écrite quatre siècles et demi après les faits.",
      source: "UNESCO, « Médina de Fès » (inscrite en 1981), pour la ville et sa mosquée-université ; Ibn Abi Zar, Rawd al-Qirtas (vers 1326), seule source ancienne de la fondation par Fatima al-Fihriya."
    },
    {
      cle: "fes-seconde-soeur", ville: "fes", epoque: "859", titre: "L'autre sœur", voie: "savoir", saison: 0,
      enigme: "La même année, dans la même ville, sur l'autre rive de l'oued, une seconde mosquée sort de terre — celle des Andalous, bâtie par les exilés de Cordoue. La tradition dit qu'elle est l'œuvre de la sœur de la fondatrice de la Qarawiyine. Comment s'appelle-t-elle ?",
      indices: [
        "Voie « vérifier juste » : demande le fondateur de la mosquée des Andalous à Fès. Beaucoup de modèles répondront la sœur de Fatima — d'autres inventeront un homme, ou répéteront Fatima elle-même. Trois réponses différentes à la même question : c'est le signal qu'il faut ouvrir une source, pas en reformuler une quatrième.",
        "Un prénom de femme, arabe, qu'on retrouve dans le Coran et dans l'Évangile."
      ],
      reponses: ["Mariam al-Fihriya", "Mariam al-Fihri", "Meriem al-Fihriya", "Mariam", "Meriem", "Maryam al-Fihriya", "Maryam", "مريم الفهرية", "مريم"],
      fait: "La tradition attribue la mosquée al-Andalusiyyin — celle des Andalous, sur l'autre rive de l'oued Fès — à Mariam al-Fihriya, sœur de Fatima, la même année 859. Les deux sœurs, un héritage partagé, deux rives : c'est le plan de la vieille ville encore aujourd'hui. Prudence d'usage, la même que pour sa sœur : cette attribution nous vient d'une seule source ancienne, écrite quatre siècles et demi après les faits.",
      source: "Ibn Abi Zar, Rawd al-Qirtas (vers 1326), même source ancienne que pour Fatima ; mosquée al-Andalusiyyin, dans la médina de Fès inscrite à l'UNESCO en 1981."
    },
    {
      cle: "meknes-porte", ville: "meknes", epoque: "1732", titre: "La porte qui porte un nom", voie: "image", saison: 0,
      enigme: "La plus monumentale des portes de Meknès a été achevée en 1732, cinq ans après la mort du sultan qui l'avait voulue. Ses colonnes de marbre passent pour venir d'une cité romaine voisine. Elle porte le nom de l'architecte qui l'a dessinée. Laquelle ?",
      indices: [
        "Voie « voir juste » : demande une image de « la porte monumentale de Meknès, zellige vert et colonnes de marbre », puis compare-la à une vraie photo. Ce que le modèle invente — le nombre d'arcs, la couleur du zellige — t'apprend à te méfier ; ce qu'il garde te met sur la piste.",
        "Son surnom, el-Aleuj, dit que l'architecte était un converti."
      ],
      reponses: ["Bab Mansour", "Bab el-Mansour", "Bab Mansour el-Aleuj", "Bab al-Mansour", "Bab Mansour Laalej", "Bab el Mansour el Aleuj", "Bab Mansur", "Bab Mansur al-Alj", "Bab Mansour al-Aleuj", "باب المنصور", "باب منصور"],
      fait: "Bab Mansour el-Aleuj, achevée en 1732 sous Moulay Abdallah, ferme la place El-Hedim de Meknès, la capitale voulue par son père Moulay Ismaïl. Ses colonnes de marbre proviennent sans doute de la cité romaine voisine, Volubilis. Elle porte le nom de son architecte, Mansour el-Aleuj — « le converti ».",
      source: "UNESCO, « Ville historique de Meknès » (inscrite en 1996), qui nomme Bâb Mansûr al-'Alj — « la porte de Mansûr le converti »."
    },
    {
      cle: "rabat-tour", ville: "rabat", epoque: "1199", titre: "La tour qui s'est arrêtée", voie: "savoir", saison: 0,
      enigme: "Elle devait dépasser 80 mètres et devenir le plus grand minaret du monde. Elle s'est arrêtée à 44, l'année où le sultan qui la bâtissait est mort, en 1199. Quel sultan ?",
      indices: [
        "Voie « vérifier juste » : les modèles confondent souvent les sultans almohades entre eux. Demande la liste des souverains almohades avec leurs dates, puis cherche celui qui meurt en 1199. Recouper vaut mieux que croire.",
        "Son surnom veut dire « le victorieux » — il l'a pris après la bataille d'Alarcos, en 1195."
      ],
      reponses: ["Yacoub al-Mansour", "Yaqub al-Mansur", "Abu Yusuf Yaqub al-Mansur", "Yacoub el Mansour", "Yaacoub el Mansour", "Abou Youssef Yacoub al-Mansour", "Yaqub al-Mansour", "Ya'qub al-Mansur", "Abu Yusuf Ya'qub al-Mansur", "Yaqoub al-Mansour", "يعقوب المنصور", "أبو يوسف يعقوب المنصور"],
      fait: "La tour Hassan, entreprise par le sultan almohade Yacoub al-Mansour (règne 1184-1199), devait dépasser 80 mètres. À sa mort en 1199, le chantier s'arrête : 44 mètres, une mosquée sans toit, des colonnes qui attendent encore. Rabat en a fait un symbole — et la maison, sa leçon : ce qui est promis porte une date.",
      source: "UNESCO, « Rabat, capitale moderne et ville historique : un patrimoine en partage » (inscrite en 2012)."
    },
    {
      cle: "casablanca-nom", ville: "casablanca", epoque: "vers 1770", titre: "Trois langues, un seul nom", voie: "prompt", saison: 0,
      enigme: "Les Amazighs l'appelaient Anfa. Les Portugais, qui l'ont rasée en 1468 puis ont bâti une place forte sur ses ruines, l'ont nommée dans leur langue : « la maison blanche ». Vers 1770, le sultan Mohammed ben Abdallah la relève et lui donne le même nom — en arabe. Écris ce nom, comme on le dit ici.",
      indices: [
        "Voie « dire juste » : demande au modèle le nom de Casablanca en trois langues, en précisant « darija » et pas seulement « arabe ». La précision d'un mot change la réponse — c'est la septième valeur, en pratique.",
        "Deux mots : la maison, puis la couleur."
      ],
      reponses: ["Dar el-Beida", "Dar al-Bayda", "ad-Dar al-Bayda", "Dar lBida", "Dar el Bida", "Dar Beida", "Dar el Baida", "Dar al Baida", "Addar Elbaida", "Eddar el Beida", "Dar lBeida", "Addar Albayda", "الدار البيضاء", "دار البيضاء"],
      fait: "Anfa pour les Amazighs, Casa Branca pour les Portugais — qui détruisent la ville en 1468 et s'installent bien plus tard sur ses ruines —, Dar el-Beida — « la maison blanche » — quand le sultan Mohammed ben Abdallah la rebâtit vers 1770. Trois langues, un seul nom : dire les choses dans la nôtre, c'est la septième valeur de la maison.",
      source: "Toponymie : Anfa (amazighe), Casa Branca (portugais), ad-Dar al-Bayda (arabe) ; expédition portugaise de 1468 qui détruit Anfa ; reconstruction par le sultan Mohammed ben Abdallah vers 1770."
    },
    {
      cle: "marrakech-soeurs", ville: "marrakech", epoque: "vers 1195", titre: "Les trois sœurs", voie: "image", saison: 0,
      enigme: "Trois tours du même sang : l'une veille sur Séville, l'une est restée inachevée à Rabat, l'aînée se dresse à Marrakech, au-dessus d'un ancien souk de libraires. Nomme l'aînée.",
      indices: [
        "Voie « voir juste » : demande une image des « trois minarets almohades côte à côte », puis compare avec de vraies photos. Les proportions et le nombre d'arcs qu'il invente t'apprennent à te méfier ; la silhouette carrée et le jamour doré qu'il garde — eux, bien réels — te mettent sur la piste.",
        "Son nom vient des koutoubiyine — les libraires qui tenaient boutique à son pied."
      ],
      reponses: ["Koutoubia", "Kutubiyya", "La Koutoubia", "Mosquée Koutoubia", "Jamaa el Koutoubia", "Kutubiya", "Koutoubiya", "Koutoubya", "Mosquée de la Koutoubia", "الكتبية", "جامع الكتبية"],
      fait: "La Koutoubia, minaret de 77 mètres achevé sous le sultan almohade Yacoub al-Mansour vers 1195, a servi de modèle à la Giralda de Séville et à la tour Hassan de Rabat. Son nom vient du souk des libraires qui l'entourait — le savoir au pied du minaret.",
      source: "UNESCO, « Médina de Marrakech » (inscrite en 1985), qui cite le minaret de 77 mètres de la Koutoubia et la capitale almohade (1147-1269)."
    },
    {
      cle: "agadir-nuit", ville: "agadir", epoque: "1960", titre: "La ville qui a recommencé", voie: "savoir", saison: 0,
      enigme: "Une nuit de février, en une quinzaine de secondes, la ville s'est couchée. Le roi a dit : « Si le destin a décidé de la destruction d'Agadir, sa reconstruction dépend de notre foi et de notre volonté. » Quel jour exactement ? (le jour, le mois et l'année)",
      indices: [
        "Voie « vérifier juste » : pose la question à un modèle, puis demande-lui sa source. S'il n'en donne pas, cherche la date dans une encyclopédie. Une date qu'un modèle affirme sans source est une date à vérifier — c'est tout le métier.",
        "C'est un jour qui n'existe qu'une année sur quatre."
      ],
      reponses: ["29 février 1960", "29 fevrier 1960", "29/02/1960", "29-02-1960", "29 02 1960", "29.02.1960", "nuit du 29 février 1960", "٢٩ فبراير ١٩٦٠"],
      fait: "Le 29 février 1960, vers 23 h 40, un séisme d'une quinzaine de secondes détruit Agadir et fait des milliers de morts. Mohammed V décide de rebâtir la ville deux kilomètres plus au sud. Le geste de la maison vient de là : un échec publié vaut une ferracha entière.",
      source: "Séisme du 29 février 1960 (≈ 23 h 40, une quinzaine de secondes) ; programme officiel de reconstruction d'Agadir, 1960-1966."
    },
    {
      cle: "dakhla-ligne", ville: "dakhla", epoque: "chaque 21 juin", titre: "La ligne du soleil debout", voie: "savoir", saison: 0,
      enigme: "Au sud de Dakhla, une ligne invisible traverse le Royaume. Un seul jour par an, vers le 21 juin, le soleil s'y tient exactement à la verticale : au midi solaire, plus aucune ombre. Comment s'appelle cette ligne ?",
      indices: [
        "Voie « vérifier juste » : demande au modèle la latitude de Dakhla, puis celle de la ligne. Si les deux chiffres sont proches — autour de 23° nord — tu as ta réponse, et tu as appris à vérifier une affirmation par un calcul simple.",
        "Elle porte le nom d'un signe du zodiaque."
      ],
      reponses: ["Tropique du Cancer", "Le tropique du Cancer", "Tropique Cancer", "Tropic of Cancer", "Tropique du cancer nord", "مدار السرطان"],
      fait: "Le tropique du Cancer (23°26′ de latitude nord) passe au sud de Dakhla : au solstice de juin, le soleil y est au zénith — le long de cette ligne, et là seulement dans le Royaume, l'ombre disparaît au midi solaire de ce jour-là. Dakhla est la grande ville la plus proche de cette ligne.",
      source: "Coordonnées géographiques : Dakhla ≈ 23°43′ N, tropique du Cancer 23°26′ N ; panneau du Tropique du Cancer sur la route nationale 1, au sud de Dakhla."
    },
    {
      cle: "oujda-musique", ville: "oujda", epoque: "994", titre: "La musique venue d'Andalousie", voie: "prompt", saison: 0,
      enigme: "Fondée en 994 par Ziri ibn Atiyya, chef zénète, la ville de l'extrême est garde une musique venue d'une cité d'Andalousie qui lui a laissé son nom. Quelle musique ?",
      indices: [
        "Voie « dire juste » : demande la musique arabo-andalouse « telle qu'on la joue à Oujda et à Tlemcen ». Sans les deux villes, le modèle répond « musique andalouse » et te fait rater la nuance ; avec, il nomme l'école.",
        "Grenade, en arabe, se dit Gharnata."
      ],
      reponses: ["Gharnati", "Le gharnati", "Musique gharnati", "Gharnatie", "Tarab gharnati", "Al-gharnati", "Gharnata", "Musique gharnatie", "الغرناطي", "غرناطي", "الطرب الغرناطي"],
      fait: "Oujda, fondée en 994 par Ziri ibn Atiyya, est la ville du gharnati : l'école de musique arabo-andalouse héritée de Grenade (Gharnata), portée par les exilés d'Andalousie ; l'école de Tlemcen la transmet, et Oujda la garde de ce côté de la frontière. À l'autre bout du Royaume, personne n'est trop loin — c'est le Mourchid d'Oujda.",
      source: "Fondation d'Oujda par Ziri ibn Atiyya, chef des Maghraoua (994) ; répertoire du gharnati, écoles de Tlemcen et d'Oujda."
    },
    {
      cle: "tanger-voyageur", ville: "tanger", epoque: "né en 1304, la Rihla en 1355", titre: "Le voyageur", voie: "prompt", saison: 0,
      enigme: "Né ici en 1304, il part à vingt-et-un ans pour le pèlerinage et voyage près de trente ans, jusqu'à l'Inde et la Chine. À Fès, en 1355, il dicte son récit — celui dont Nsyan a arraché les pages. Qui est-il ?",
      indices: [
        "Voie « dire juste » : donne au modèle les trois indices — Tanger, 1304, 1355 — dans une seule phrase et demande une seule réponse, avec son degré de certitude. Un modèle qu'on oblige à dire « sûr » ou « pas sûr » ne se trompe pas moins — mais il te dit où aller vérifier.",
        "Son récit s'appelle la Rihla — le mot que tu lis sur ton propre lawh."
      ],
      reponses: ["Ibn Battuta", "Ibn Batouta", "Ibn Battouta", "Ibn Batuta", "Ibn Batoutah", "Ibn Battutah", "Battuta", "Batouta", "Chams ad-Din Ibn Battuta", "ابن بطوطة", "بن بطوطة"],
      fait: "Ibn Battuta, né à Tanger en 1304, parcourt près de 120 000 kilomètres en une trentaine d'années, de l'Andalousie à la Chine. Rentré au Maroc, il dicte sa Rihla à Fès en 1355, à la demande du sultan Abou Inan, au lettré Ibn Juzayy. Le nom de la progression du jeu vient de là : un voyage qu'on raconte pour qu'il ne se perde pas.",
      source: "Ibn Battuta, Tuhfat an-Nuzzar (la Rihla), rédigée par Ibn Juzayy à Fès, 1355 ; traduction Defrémery & Sanguinetti (1853-1858)."
    },

    // ---- SAISON 1 · les cartes de la Dhakira — une page par jeudi -----------------------
    // Ordre : celui de l'histoire, de 711 à 1955. Restent pour une deuxième
    // saison (relus, pas encore écrits) : Léon l'Africain, al-Idrissi, Sidi
    // Mohammed ben Abdallah et 1777, Allal El Fassi, Assou Oubasslam.
    {
      cle: "tanger-detroit", ville: "tanger", epoque: "711", titre: "Le rocher qui porte son nom", voie: "prompt", saison: 1, des: "2026-09-17",
      enigme: "Au printemps 711, un général amazigh part des environs de Tanger et de Ceuta, traverse le détroit avec quelques milliers d'hommes et débarque au pied d'un rocher. Treize siècles plus tard, le rocher porte encore son nom — déformé par les langues qui l'ont repris. Qui est-il ?",
      indices: [
        "Voie « dire juste » : demande au modèle « qui a traversé le détroit en 711 depuis le Maroc, et quel lieu porte son nom ». Deux faits liés dans une seule question obligent la réponse à se tenir ; une question à un seul fait obtient souvent un roman.",
        "Le rocher s'appelle aujourd'hui Gibraltar — Jabal Tariq, « la montagne de Tariq »."
      ],
      reponses: ["Tariq ibn Ziyad", "Tarik ibn Ziyad", "Tariq ben Ziyad", "Tarek ibn Ziyad", "Tariq Ibn Zyad", "Tarik Ibn Zyad", "Tariq", "Tarik", "طارق بن زياد", "طارق"],
      fait: "Tariq ibn Ziyad, général amazigh au service des Omeyyades, traverse le détroit en 711 et débarque au pied du rocher qui garde son nom : Jabal Tariq, devenu Gibraltar. La victoire du Guadalete la même année ouvre la péninsule. Prudence d'usage : le discours des navires brûlés est une légende tardive, absente des sources les plus anciennes.",
      source: "Ibn Abd al-Hakam, Futuh Misr wa-l-Maghrib (IXᵉ siècle), le plus ancien récit de la traversée ; toponymie : Jabal Tariq → Gibraltar."
    },
    {
      cle: "fes-fondateur", ville: "fes", epoque: "809", titre: "La ville aux deux rives", voie: "savoir", saison: 1, des: "2026-09-24",
      enigme: "Né après la mort de son père, proclamé imam à onze ans, il fonde en 809 une ville neuve sur la rive de l'oued qui fait face à celle que son père avait tracée vingt ans plus tôt. Les deux rives finiront par ne faire qu'une : Fès. Son mausolée est au cœur de la médina. Qui est-il ?",
      indices: [
        "Voie « vérifier juste » : demande la date de fondation de Fès. Les modèles répondent 789, 808 ou 809 selon qu'ils pensent au père ou au fils, et rarement en le disant. Demande QUI a fondé QUELLE rive, puis ouvre une source : la bonne réponse est un couple de dates, pas une seule.",
        "Il porte le même nom que son père, avec un « II »."
      ],
      reponses: ["Idris II", "Idriss II", "Moulay Idriss II", "Moulay Idris II", "Idris ibn Idris", "Idris 2", "Idriss 2", "إدريس الثاني", "مولاي إدريس الثاني"],
      fait: "Idris II, né en 791 après la mort d'Idris Ier, fonde en 809 la ville d'al-Aliya sur la rive opposée au premier établissement de son père (789). Les deux rives — celle des Andalous et celle des Kairouanais — sont réunies au XIᵉ siècle sous les Almoravides. Son mausolée, au cœur de la médina, reste un lieu de visite. C'est la première dynastie d'un État marocain.",
      source: "Ibn Abi Zar, Rawd al-Qirtas (vers 1326), pour les deux fondations (789 et 809) ; UNESCO, « Médina de Fès » (inscrite en 1981), pour l'unification des deux rives."
    },
    {
      cle: "marrakech-emir", ville: "marrakech", epoque: "1086", titre: "L'émir venu du désert", voie: "prompt", saison: 1, des: "2026-10-01",
      enigme: "Émir des Almoravides, il fait de Marrakech — fondée vers 1070 par les siens — sa capitale, et lui donne ses murailles et ses premiers jardins. En 1086, appelé à l'aide par les princes d'Andalousie, il traverse le détroit et l'emporte à Zallaqa. Qui est-il ?",
      indices: [
        "Voie « dire juste » : donne au modèle les trois indices — Almoravide, Marrakech, Zallaqa 1086 — et demande un seul nom, avec l'orthographe arabe. Sans « Zallaqa », il hésite entre deux cousins ; avec, il n'a plus le choix.",
        "Son nom : Yusuf, fils de Tashfin."
      ],
      reponses: ["Youssef Ibn Tachfine", "Yusuf ibn Tashfin", "Youssef ben Tachfine", "Youssef Ben Tachfin", "Yusuf ibn Tashufin", "Youssef Ibn Tachfin", "Ibn Tachfine", "Ibn Tashfin", "يوسف بن تاشفين", "ابن تاشفين"],
      fait: "Youssef Ibn Tachfine (règne 1061-1106) fait de Marrakech, fondée vers 1070 par les Almoravides, la capitale d'un empire qui va du Sénégal à l'Èbre. Le 23 octobre 1086, à Zallaqa (Sagrajas), son armée l'emporte sur celle d'Alphonse VI de Castille, à l'appel des princes de taïfas. Prudence d'usage : la fondation même de Marrakech est attribuée tantôt à lui, tantôt à son cousin Abu Bakr ibn Umar — les sources anciennes divergent.",
      source: "UNESCO, « Médina de Marrakech » (inscrite en 1985) : ville fondée en 1070-1072 par les Almoravides ; Ibn Idhari, al-Bayan al-Mughrib (vers 1312), pour Zallaqa."
    },
    {
      cle: "agadir-mahdi", ville: "agadir", epoque: "1121", titre: "Le prêcheur du Souss", voie: "savoir", saison: 1, des: "2026-10-08",
      enigme: "Né dans le Souss, revenu d'Orient avec une doctrine, il prêche dans le Haut Atlas, se proclame Mahdi vers 1121 et rassemble à Tinmel la communauté d'où sortira l'empire almohade. La mosquée bâtie sur sa tombe a été blessée par le séisme du 8 septembre 2023. Qui est-il ?",
      indices: [
        "Voie « vérifier juste » : demande sa date de naissance. Les modèles donnent 1078, 1080 ou 1082 avec la même assurance. Ce flottement n'est pas une erreur du modèle : les sources anciennes ne la donnent pas. Apprends à reconnaître une date que personne ne connaît.",
        "Son nom commence par « fils de », et les Almohades l'appelaient l'Imam."
      ],
      reponses: ["Ibn Toumart", "Ibn Tumart", "Mohammed ibn Toumart", "Muhammad ibn Tumart", "Ibn Toumert", "Al-Mahdi ibn Toumart", "Mehdi Ibn Toumart", "ابن تومرت", "المهدي بن تومرت"],
      fait: "Ibn Toumart, né dans le Souss vers 1080, se proclame Mahdi vers 1121 et fonde à Tinmel, dans le Haut Atlas, la communauté almohade. Il meurt en 1130 ; son disciple Abd al-Mumin bâtit l'empire. La mosquée de Tinmel, élevée vers 1153 sur sa tombe, a été gravement endommagée par le séisme du 8 septembre 2023 et se restaure. Le recommencement, c'est le rôle de la Mourchida d'Agadir.",
      source: "Ibn Khaldoun, Kitab al-Ibar (XIVᵉ siècle), pour la prédication et Tinmel ; mosquée de Tinmel, liste indicative de l'UNESCO (1995) ; séisme d'Al Haouz, 8 septembre 2023."
    },
    {
      cle: "tanger-hurra", ville: "tanger", epoque: "1515-1542", titre: "La femme libre", voie: "image", saison: 1, des: "2026-10-15",
      enigme: "Née à Chefchaouen dans une famille venue de Grenade, elle gouverne Tétouan près de trente ans, arme des navires avec le frère de Barberousse, et en 1541 un sultan vient jusqu'à elle pour l'épouser — la seule fois qu'un sultan se marie hors de sa capitale. Son titre veut dire « la femme libre ». Comment la nomme-t-on ?",
      indices: [
        "Voie « voir juste » : demande une image de « la gouverneure de Tétouan au XVIᵉ siècle sur les remparts, face au détroit ». Aucun portrait d'époque n'existe : tout ce que le modèle te montre est inventé. Compare avec un portrait réel de la même époque, andalou ou ottoman — et apprends à voir ce qu'une image affirme sans preuve.",
        "En arabe, « la libre » se dit al-Hurra ; « la dame », Sayyida."
      ],
      reponses: ["Sayyida al-Hurra", "Sayyida al Hurra", "Sayida al-Hurra", "Sayyida El Horra", "Sitt al-Hurra", "Al-Hurra", "Lalla Aicha al-Hurra", "Sayyida al-Horra", "السيدة الحرة", "الحرة"],
      fait: "Sayyida al-Hurra, née vers 1485 à Chefchaouen dans une famille andalouse, gouverne Tétouan de 1515 à 1542. Alliée d'Arudj puis de Khayr ad-Din Barberousse, elle arme des corsaires qui tiennent la Méditerranée occidentale. En 1541, le sultan wattasside Ahmed al-Wattasi vient l'épouser à Tétouan. Écartée en 1542, elle se retire à Chefchaouen. Son vrai prénom reste discuté ; son titre, lui, est certain.",
      source: "Chroniques portugaises et espagnoles du XVIᵉ siècle (gouvernement de Tétouan, 1515-1542) ; Fatima Mernissi, Sultanes oubliées (1990)."
    },
    {
      cle: "marrakech-incomparable", ville: "marrakech", epoque: "1578", titre: "Le palais Incomparable", voie: "image", saison: 1, des: "2026-10-22",
      enigme: "Le 4 août 1578, à Oued al-Makhazine, trois rois meurent le même jour. Avec les rançons de cette bataille, le sultan qui en sort vainqueur bâtit à Marrakech un palais qu'il appelle « l'Incomparable » — al-Badi. Un siècle plus tard, un autre sultan le démonte pour Meknès. Qui l'a bâti ?",
      indices: [
        "Voie « voir juste » : demande une image du palais al-Badi « en 1600, intact, avec ses bassins et ses pavillons ». Puis regarde les ruines réelles. Le modèle te montre des dorures qu'aucune source ne décrit — et le plan des bassins, lui, est juste. Trier le vrai de l'inventé dans une même image : c'est le geste.",
        "Son surnom, ad-Dahbi, veut dire « le Doré » — l'or lui vient de Tombouctou, en 1591."
      ],
      reponses: ["Ahmed al-Mansour", "Ahmed el Mansour Eddahbi", "Ahmad al-Mansur", "Ahmed El Mansour", "Ahmed al-Mansour ad-Dahbi", "Al-Mansour ad-Dahbi", "Ahmad al-Mansur al-Dhahabi", "Moulay Ahmed El Mansour", "أحمد المنصور الذهبي", "أحمد المنصور"],
      fait: "Ahmed al-Mansour (règne 1578-1603), sultan saadien, prend le pouvoir au soir de la bataille des Trois Rois, le 4 août 1578, et entreprend la même année le palais al-Badi, achevé vers 1593. L'expédition de 1591 vers Tombouctou lui vaut le surnom ad-Dahbi, le Doré. Vers 1696, Moulay Ismaïl fait démonter le palais pour en remployer les marbres à Meknès. Il n'en reste que le plan — et les bassins.",
      source: "UNESCO, « Médina de Marrakech » (inscrite en 1985) ; palais al-Badi, chantier 1578-1593 ; bataille d'Oued al-Makhazine, 4 août 1578."
    },
    {
      cle: "meknes-sultan", ville: "meknes", epoque: "1672-1727", titre: "Cinquante-cinq ans", voie: "image", saison: 1, des: "2026-10-29",
      enigme: "Il règne cinquante-cinq ans, choisit Meknès pour capitale et la ceint de quarante kilomètres de murailles. Ses greniers, Heri es-Souani, gardaient le blé au frais sous des voûtes de quatre mètres d'épaisseur ; ses écuries passaient pour loger douze mille chevaux. Quel sultan ?",
      indices: [
        "Voie « voir juste » : demande une image de « Heri es-Souani à Meknès, les greniers voûtés, lumière du matin ». Puis compare aux photos. Le modèle ajoute presque toujours des fenêtres : les vrais greniers n'en ont pas, c'est ainsi qu'ils gardaient le frais. Ce qu'il ajoute par habitude, tu apprends à le retirer.",
        "La porte Bab Mansour, que tu as peut-être déjà retrouvée, a été achevée cinq ans après sa mort."
      ],
      reponses: ["Moulay Ismaïl", "Moulay Ismail", "Ismaïl ben Chérif", "Ismail Ibn Sharif", "Moulay Ismail Ibn Sharif", "Mawlay Ismail", "Sultan Moulay Ismaïl", "مولاي إسماعيل", "المولى إسماعيل"],
      fait: "Moulay Ismaïl (règne 1672-1727), sultan alaouite, fait de Meknès sa capitale : murailles, portes, palais, et les greniers-écuries Heri es-Souani, dont les murs épais et le réseau d'eau souterrain gardaient le grain au frais. Son règne de cinquante-cinq ans unifie le pays et reprend plusieurs places côtières. La porte Bab Mansour, achevée en 1732, ferme la ville qu'il a voulue.",
      source: "UNESCO, « Ville historique de Meknès » (inscrite en 1996) : capitale sous Moulay Ismaïl, 1672-1727, ensemble de Heri es-Souani."
    },
    {
      cle: "marrakech-sept", ville: "marrakech", epoque: "vers 1700", titre: "Les sept hommes", voie: "savoir", saison: 1, des: "2026-11-05",
      enigme: "Sept tombes, un pèlerinage en sept étapes, institué au tournant du XVIIIᵉ siècle : on l'appelle Sebaatou Rijal, « les sept hommes », et Marrakech en porte le surnom. Le patron de la ville est l'un d'eux — un saint né à Ceuta, protecteur des aveugles et des commerçants. Nomme-le.",
      indices: [
        "Voie « vérifier juste » : demande la liste des sept saints de Marrakech à deux modèles différents. Compare les listes : il y aura presque toujours un nom qui change. Cherche alors lequel est attesté — c'est l'exercice même du recoupement, et sept noms suffisent à l'apprendre.",
        "Sa zaouïa donne son nom à tout un quartier, au nord de la médina : Sidi Bel Abbès."
      ],
      reponses: ["Sidi Bel Abbès", "Sidi Bel Abbes", "Abu al-Abbas as-Sabti", "Abou al-Abbas as-Sabti", "Sidi Bel Abbes Sebti", "Sidi Belabbès", "Abu l-Abbas al-Sabti", "Sidi Bel Abbas", "سيدي بلعباس", "أبو العباس السبتي"],
      fait: "Abu al-Abbas as-Sabti (1129-1204), né à Ceuta, est le patron de Marrakech : sa zaouïa, au nord de la médina, donne son nom au quartier de Sidi Bel Abbès. Le pèlerinage des Sebaatou Rijal — Sidi Youssef Ben Ali, Cadi Ayyad, Sidi Bel Abbès, Sidi Mohammed al-Jazouli, Sidi Abdelaziz Tebbaa, Sidi Abdellah al-Ghazwani et l'imam as-Suhayli — est institué sous Moulay Ismaïl, sur le conseil du savant al-Hassan al-Youssi, pour donner à la ville ses sept protecteurs.",
      source: "Ziyara des Sebaatou Rijal, instituée à la fin du XVIIᵉ siècle sous Moulay Ismaïl (al-Hassan al-Youssi) ; zaouïa de Sidi Bel Abbès, médina de Marrakech (UNESCO, 1985)."
    },
    {
      cle: "meknes-zayani", ville: "meknes", epoque: "1914", titre: "L'homme du Moyen Atlas", voie: "savoir", saison: 1, des: "2026-11-12",
      enigme: "Chef des Zayanes, il tient le Moyen Atlas autour de Khénifra. Le 13 novembre 1914, à El Herri, il inflige à une colonne française l'une de ses défaites les plus lourdes au Maroc. Il combat encore sept ans, jusqu'à sa mort au combat en 1921. Qui est-il ?",
      indices: [
        "Voie « vérifier juste » : demande la date de la bataille d'El Herri. Certains modèles donnent le 13 novembre 1914, d'autres inventent un mois. Une date de bataille se vérifie en trente secondes dans deux encyclopédies ; une date de bataille non vérifiée n'est pas une date.",
        "Son nom dit sa tribu : Zayani, des Zayanes ; et son prénom est double, comme souvent dans l'Atlas."
      ],
      reponses: ["Moha ou Hammou Zayani", "Mouha ou Hammou Zayani", "Moha ou Hammou", "Mouha ou Hamou", "Moha Ou Hamou Zayani", "Moha U Hammu", "Mha ou Hammou", "موحى أوحمو الزياني", "موحى وحمو الزياني"],
      fait: "Moha ou Hammou Zayani (vers 1863-1921), chef des Zayanes du Moyen Atlas, remporte le 13 novembre 1914 la bataille d'El Herri, près de Khénifra, contre la colonne du colonel Laverdure. Il refuse de se soumettre jusqu'à sa mort, le 27 mars 1921, les armes à la main. Sa mémoire tient dans les chants du Moyen Atlas — et le jeu, ici, dit le pays entier, pas seulement ses capitales.",
      source: "Bataille d'El Herri, 13 novembre 1914 (Khénifra) ; mort de Moha ou Hammou Zayani le 27 mars 1921 — témoignages et historiographie de la résistance du Moyen Atlas."
    },
    {
      cle: "tanger-rif", ville: "tanger", epoque: "1921", titre: "La république du Rif", voie: "savoir", saison: 1, des: "2026-11-19",
      enigme: "Né à Ajdir, cadi puis chef de guerre, il l'emporte à Anoual en juillet 1921 sur une armée bien plus nombreuse et proclame une république dans le Rif. Vaincu en 1926, exilé vingt ans dans une île de l'océan Indien, il s'échappe au Caire, où il meurt en 1963. Qui est-il ?",
      indices: [
        "Voie « vérifier juste » : demande la date d'Anoual. Tu obtiendras « juillet 1921 », parfois un jour précis. La bataille a duré plusieurs jours : quand un modèle te donne UN jour, demande-lui lequel des jours il a choisi, et pourquoi. C'est ainsi qu'on apprend qu'une date peut être un intervalle.",
        "Son nom de famille est celui de sa tribu, les Aït Khattab ; le prénom se dit en deux mots, « serviteur du Généreux »."
      ],
      reponses: ["Abdelkrim al-Khattabi", "Abdelkrim El Khattabi", "Abdelkrim Khattabi", "Mohamed ben Abdelkrim el-Khattabi", "Abd el-Krim", "Abdelkrim", "Abd el-Krim el-Khattabi", "Abdelkarim Khattabi", "عبد الكريم الخطابي", "محمد بن عبد الكريم الخطابي"],
      fait: "Mohamed ben Abdelkrim al-Khattabi (1882-1963), né à Ajdir, remporte du 22 juillet au 9 août 1921 la bataille d'Anoual, puis proclame la République du Rif (1921-1926). Vaincu par les armées espagnole et française réunies, il est exilé à La Réunion de 1926 à 1947, s'échappe en Égypte et meurt au Caire le 6 février 1963. Son nom est devenu, dans le monde entier, celui d'une résistance.",
      source: "Bataille d'Anoual, 22 juillet-9 août 1921 ; exil à La Réunion (1926-1947) ; décès au Caire, 6 février 1963."
    },
    {
      cle: "casablanca-resistant", ville: "casablanca", epoque: "1954", titre: "Celui qui n'a pas parlé", voie: "prompt", saison: 1, des: "2026-11-26",
      enigme: "Né à Casablanca en 1927, cadre de la résistance armée dans sa ville, il est arrêté le 18 juin 1954 et choisit de mourir plutôt que de livrer un seul nom. Le grand boulevard qui traverse Casablanca porte le sien. Qui est-il ?",
      indices: [
        "Voie « dire juste » : demande au modèle « le résistant casablancais mort le 18 juin 1954 sans parler ». Puis demande-lui la même chose sans la date : tu verras la réponse changer de nom. La date est ce qui tient la question debout — c'est la précision d'un mot, la septième valeur.",
        "Son nom sonne comme celui d'une couleur en darija : zerq, le bleu."
      ],
      reponses: ["Mohamed Zerktouni", "Zerktouni", "Mohammed Zerktouni", "Mohamed Zerqtouni", "Zerqtouni", "Mohamed Zarktouni", "Mohamed Zerktouny", "محمد الزرقطوني", "الزرقطوني"],
      fait: "Mohamed Zerktouni (1927-1954), né à Casablanca, organise la résistance armée dans sa ville. Arrêté le 18 juin 1954, il avale une capsule de cyanure pour ne livrer aucun de ses compagnons. Casablanca lui a donné son plus long boulevard, et le pays, la mémoire d'un homme qui a tenu sa parole jusqu'au bout — Nia w Amana, la règle de la maison.",
      source: "Haut-Commissariat aux anciens résistants et anciens membres de l'armée de libération (Maroc) ; décès le 18 juin 1954 à Casablanca."
    },
    {
      cle: "rabat-retour", ville: "rabat", epoque: "1955", titre: "Le jour du retour", voie: "savoir", saison: 1, des: "2026-12-03",
      enigme: "Exilé le 20 août 1953, en Corse puis à Madagascar, le sultan revient à Rabat en novembre 1955, acclamé par une foule immense ; deux jours plus tard, il annonce la fin de la tutelle étrangère, et l'indépendance est reconnue le 2 mars 1956. Quel jour exactement est-il rentré ? (le jour, le mois et l'année)",
      indices: [
        "Voie « vérifier juste » : demande la date du retour de Mohammed V. Beaucoup de modèles répondent le 18 novembre — c'est la fête nationale, la date du discours, pas celle de l'arrivée. Quand une date est célébrée, vérifie si l'on célèbre l'événement ou son annonce.",
        "Deux jours avant la fête de l'Indépendance, qui est le 18."
      ],
      reponses: ["16 novembre 1955", "16/11/1955", "16-11-1955", "16 11 1955", "16.11.1955", "le 16 novembre 1955", "١٦ نوفمبر ١٩٥٥"],
      fait: "Mohammed V, exilé le 20 août 1953 en Corse puis à Madagascar, rentre à Rabat le 16 novembre 1955. Le 18 novembre, dans le discours du Trône, il annonce la fin de la tutelle et le retour à l'indépendance, reconnue le 2 mars 1956. Le 18 novembre est depuis la fête de l'Indépendance. Le Gardien de Rabat veille sur cette page : la confiance, c'est un retour qu'on attendait.",
      source: "Retour de Mohammed V à Rabat le 16 novembre 1955 ; discours du Trône du 18 novembre 1955 ; déclaration commune franco-marocaine du 2 mars 1956."
    }
  ];

  function page(cle) {
    for (var i = 0; i < PAGES.length; i++) if (PAGES[i].cle === cle) return PAGES[i];
    return null;
  }

  // ---- Normaliser une réponse -------------------------------------------------------
  // Minuscules, sans accents, sans ponctuation, sans articles ni particules
  // (le, la, al-, el-…) ; l'arabe sans voyelles courtes, alef unifié, ta
  // marbouta → ha. « Fatima al-Fihriya », « fatima el fihri » et « FATIMA
  // FIHRIYA » deviennent la même chose.
  var PARTICULES = { le: 1, la: 1, les: 1, l: 1, el: 1, al: 1, ad: 1, ed: 1, de: 1, du: 1, des: 1, d: 1, the: 1, un: 1, une: 1, "ال": 1 };

  function normaliser(s) {
    var t = String(s == null ? "" : s).toLowerCase();
    if (t.normalize) t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
    t = t.replace(/[ً-ْٰـ]/g, "")
      .replace(/[آأإ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      // chiffres arabes-indiens → chiffres
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
    t = t.replace(/[’'`´ʼ]/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    var mots = t.split(/\s+/).filter(function (m) { return m && !PARTICULES[m]; });
    return mots.join(" ");
  }

  // La saisie est bonne si, normalisée, elle EST une des réponses — ou si elle
  // la CONTIENT en mots entiers (« c'est la Koutoubia » passe). Jamais
  // l'inverse : « Ibn » seul ne vaut pas « Ibn Battuta ».
  function verifierReponse(p, saisie) {
    p = typeof p === "string" ? page(p) : p;
    if (!p) return { ok: false, saisie: "", attendu: null };
    var s = normaliser(saisie);
    if (!s) return { ok: false, saisie: s, attendu: p.reponses[0] };
    var ok = false;
    for (var i = 0; i < p.reponses.length && !ok; i++) {
      var r = normaliser(p.reponses[i]);
      if (!r) continue;
      if (s === r) ok = true;
      else if (r.length >= 5 && (" " + s + " ").indexOf(" " + r + " ") !== -1) ok = true;
    }
    return { ok: ok, saisie: s, attendu: p.reponses[0] };
  }

  // Ce qu'une page rapporte : dix de Dhakira, quinze si aucun indice n'a été
  // demandé. La voie exercée reste écrite sur la page — elle enseigne, elle ne
  // note pas : c'est l'établi des Ta7addi qui note la technique.
  function recompense(p, indicesVus) {
    p = typeof p === "string" ? page(p) : p;
    if (!p) return 0;
    var n = Number(indicesVus) || 0;
    return DHAKIRA_PAGE + (n <= 0 ? BONUS_SANS_INDICE : 0);
  }

  // ---- L'état des pages d'un joueur -----------------------------------------------
  // joueur.pages = { "<cle>": "<date ISO de la découverte>", … }. Une clé
  // inconnue ou une valeur vide ne compte pas : on ne crédite pas une page sur
  // une faute de frappe.
  function normaliserPages(pj) {
    var propre = {};
    if (pj && typeof pj === "object") {
      PAGES.forEach(function (p) {
        var v = pj[p.cle];
        if (typeof v === "string" && v) propre[p.cle] = v;
      });
    }
    return propre;
  }

  // ---- La saison : une page s'ouvre le jeudi, à minuit, heure de Casablanca ----------
  // `des` est un jour (AAAA-MM-JJ) ; la page s'ouvre à 00:00 à Casablanca
  // (UTC+1 toute l'année depuis 2018). Sans `des`, la page est ouverte d'emblée.
  // ⚠️ La date est celle de l'horloge du joueur : on ouvre une énigme, pas un
  //    coffre-fort — tricher sur sa date ne rapporte qu'une page plus tôt.
  function ouvertureDe(p) {
    p = typeof p === "string" ? page(p) : p;
    if (!p || !p.des) return null;
    return new Date(p.des + "T00:00:00+01:00");
  }
  function ouverte(p, maintenant) {
    var o = ouvertureDe(p);
    if (!o) return !!(typeof p === "string" ? page(p) : p);
    var now = maintenant ? new Date(maintenant).getTime() : Date.now();
    return now >= o.getTime();
  }

  // etat(pages, maintenant) : ce que le joueur a, ce qui l'attend, ce qui vient.
  //   prochaine : la première page OUVERTE non retrouvée (le sandouq la sert) ;
  //   aVenir    : la première page pas encore ouverte, avec sa date ;
  //   ouvertes  : combien de pages sont ouvertes à cette heure.
  function etat(pj, maintenant) {
    var pages = normaliserPages(pj);
    var resolues = 0, prochaine = null, aVenir = null, ouvertes = 0;
    var liste = PAGES.map(function (p) {
      var ok = !!pages[p.cle], ouv = ouverte(p, maintenant);
      if (ouv) ouvertes += 1;
      if (ok) resolues += 1;
      else if (ouv && !prochaine) prochaine = p;
      else if (!ouv && !aVenir) aVenir = { cle: p.cle, titre: p.titre, ville: p.ville, saison: p.saison, le: ouvertureDe(p) };
      return { cle: p.cle, ville: p.ville, titre: p.titre, epoque: p.epoque, voie: p.voie, saison: p.saison || 0,
        ouverte: ouv, des: p.des || null, retrouvee: ok, le: pages[p.cle] || null };
    });
    return {
      total: PAGES.length, resolues: resolues, restantes: PAGES.length - resolues, ouvertes: ouvertes,
      complet: resolues === PAGES.length, prochaine: prochaine, aVenir: aVenir, liste: liste
    };
  }

  // Les cartes : une par page retrouvée, dorée quand elle a été trouvée sans
  // indice. `pages` (clé → date ISO) et `dorees` (clé → true) viennent de la
  // ligne du joueur ; une clé inconnue est ignorée, comme partout.
  function cartes(pj, dorees, maintenant) {
    var e = etat(pj, maintenant);
    var d = dorees && typeof dorees === "object" ? dorees : {};
    return e.liste.map(function (l) {
      return { cle: l.cle, ville: l.ville, titre: l.titre, epoque: l.epoque, saison: l.saison,
        ouverte: l.ouverte, des: l.des, gagnee: l.retrouvee, doree: l.retrouvee && !!d[l.cle], le: l.le };
    });
  }

  // Marquer une page retrouvée : renvoie un NOUVEL objet pages.
  function retrouver(pj, cle, quand) {
    var pages = normaliserPages(pj);
    if (!page(cle)) return pages;
    pages[cle] = (quand ? new Date(quand) : new Date()).toISOString();
    return pages;
  }

  function saison(n) { return PAGES.filter(function (p) { return (p.saison || 0) === n; }); }

  return {
    PAGES: PAGES, page: page, saison: saison, DHAKIRA_PAGE: DHAKIRA_PAGE, BONUS_SANS_INDICE: BONUS_SANS_INDICE,
    normaliser: normaliser, verifierReponse: verifierReponse, recompense: recompense,
    normaliserPages: normaliserPages, etat: etat, retrouver: retrouver,
    ouvertureDe: ouvertureDe, ouverte: ouverte, cartes: cartes
  };
});
