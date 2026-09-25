// Au Courant — la maison Nareva : le CONTENU (24/09/2026).
//
// Le jeu d'accueil de Nareva, sur le moteur Mrehba (ex-Bab). Ce fichier ne porte que des
// DONNÉES, dans la forme EXACTE des modules qu'elles remplacent :
// assets/js/zawia-jeu/maison.js les pose sur le moteur au chargement, sans
// toucher aux modules. La configuration (chemins, menu, lieux, portraits) vit
// à côté, dans maison.js ; le vocabulaire de l'écran, dans interface.js.
//
// L'histoire : LA LUMIÈRE QUI S'ÉTEINT. Quand un ancien part, un peu de ce qu'il
// savait s'éteint avec lui ; si personne ne le reprend, la maison s'assombrit,
// lampe après lampe. Le nouvel arrivant a quarante jours pour rallumer ce qui
// s'éteint. Ce qui éteint s'appelle le Blackout : un PHÉNOMÈNE — le départ,
// l'oubli, l'usure —, jamais une personne, un service, un métier ou un groupe.
// Le guide est Ba Lahcen, un ancien de fiction entré à la création, en 2004.
//
// Les trois axes, jamais additionnés : la LUMIÈRE (la culture : valeurs, sites,
// histoire — l'axe « Dhakira » du moteur), la PUISSANCE (le métier prouvé —
// « Sna3a ») et le RÉSEAU (ce que les autres te reconnaissent — « M39ol »).
//
// Les sections, dans l'ordre du fichier :
//    1 valeurs · 2 blackout, relie · 3 prologue, epilogue · 4 sites · 5 pages ·
//    6 tahaddi, voies · 7 pnj · 8 tutoriel · 9 wird, familles · 10 rangs, niveaux ·
//   11 maharat · 12 collegues · 13 porte · 14 histoire, codes, rituels, metiers ·
//   15 quiz.
// `epilogue` et `collegues` n'ont pas encore de place dans maison.js, et interface.js
// (chargé après) pose aujourd'hui son propre guide et ses propres voisins de démo :
// chaque section dit en tête ce qu'il en est.
//
// ⚠️ Trois règles, tenues par tests/maison-nareva-contenu.test.js :
//   1. Les faits sur Nareva viennent UNIQUEMENT des pages publiques de nareva.ma,
//      relevées le 24/09/2026 : /a-propos-nous/ (la frise « Notre histoire »,
//      les valeurs), /nos-projets/, /nos-metiers/, /nos-filiales/ et l'accueil.
//      Aucun chiffre inventé : chaque nombre des pages et de l'histoire est dans
//      la liste que le test tient, page par page.
//   2. Jamais un coupable. Aucun nom de personne réelle : tous les prénoms sont
//      de fiction.
//   3. Rien de l'univers de Zawia (décision de Youssef, 24/09/2026 : un MVP pour
//      Nareva, pas une copie). Les clés internes du moteur restent (« rihla »,
//      « talib »…) : elles ne s'affichent jamais.
(function (root, factory) {
  "use strict";
  var contenu = factory();
  if (typeof module === "object" && module.exports) module.exports = contenu;
  // Au navigateur : interface.js, chargé après, complète ce même objet.
  if (typeof window !== "undefined") {
    var deja = window.ZWJ_MAISON_CONTENU || {};
    Object.keys(contenu).forEach(function (k) { deja[k] = contenu[k]; });
    window.ZWJ_MAISON_CONTENU = deja;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Le nom du joueur, quand le jeu le donne ; rien sinon (jamais un nom par défaut).
  function nomDe(ctx) { return ctx && ctx.pseudo ? String(ctx.pseudo) : ""; }
  function virgule(ctx) { var n = nomDe(ctx); return n ? ", " + n : ""; }

  // ======================================================================================
  // 1 · LES VALEURS — forme de VALEURS (recit.js) : { cle, nom, ar, phrase, refuse }.
  // Sept murs de la cour, dans l'ordre : les cinq valeurs de nareva.ma, MOT POUR MOT
  // (https://www.nareva.ma/a-propos-nous/#nos-valeurs, apostrophes typographiques
  // comprises), puis la mission (même page) et la vision (page d'accueil).
  // ⚠️ La page de Nareva écrit « Cohérence, solidarité et intelligence collective AU
  //    QUOTIDIEN » : c'est cette phrase-là qui est au mur.
  // `refuse` se lit après le préfixe du khatt (« Donc on refuse : » dans le moteur,
  // « Au quotidien, on refuse : » dans maison.js) : il commence en minuscule.
  // ======================================================================================
  var valeurs = [
    { cle: "audace", nom: "Audace", ar: "الجرأة",
      phrase: "Entreprendre avec confiance et vision éclairée des enjeux",
      refuse: "attendre que tout soit parfait pour proposer une idée ; oser sans avoir regardé les enjeux en face." },
    { cle: "innovation", nom: "Innovation", ar: "الابتكار",
      phrase: "Créer des solutions adaptées aux besoins de demain",
      refuse: "la nouveauté pour la nouveauté ; la solution qui brille en réunion et ne tient pas sur le terrain ; le « on a toujours fait comme ça » qui ferme une idée avant de l'avoir écoutée." },
    { cle: "equipe", nom: "Esprit d’équipe", ar: "روح الفريق",
      phrase: "Cohérence, solidarité et intelligence collective au quotidien",
      refuse: "l'information gardée pour soi ; le « ce n'est pas mon site, pas mon problème » ; laisser un collègue seul face à une difficulté qu'on sait régler." },
    { cle: "responsabilite", nom: "Responsabilité", ar: "المسؤولية",
      phrase: "Valeur partagée et solutions durables pour l’avenir",
      refuse: "le raccourci qui arrange aujourd'hui et coûte demain ; le problème qu'on laisse à l'équipe suivante ; la consigne contournée « juste cette fois »." },
    { cle: "respect", nom: "Respect", ar: "الاحترام",
      phrase: "Écoute, éthique et considération dans toutes nos interactions",
      refuse: "couper la parole à celui qui arrive ; la règle qu'on contourne parce que personne ne regarde ; parler d'un collègue au lieu de lui parler." },
    { cle: "mission", nom: "Notre mission", ar: "مهمّتنا",
      phrase: "Contribuer activement à la transition énergétique et à la mobilisation des ressources hydriques du Maroc",
      refuse: "le travail fait sans savoir à qui il sert — chaque mégawatt et chaque mètre cube ont quelqu'un au bout." },
    { cle: "vision", nom: "Notre vision", ar: "رؤيتنا",
      phrase: "Leader africain dans la production d’électricité et le cycle de l’eau",
      refuse: "se croire arrivé — on ne reste en tête qu'en apprenant chaque jour, et en transmettant ce qu'on sait." }
  ];

  // ======================================================================================
  // 2 · LES DEUX FIGURES — formes de NSYAN et de MAWSOUL (recit.js) : { nom, ar, sous, detail }.
  // ======================================================================================
  var blackout = {
    nom: "Le Blackout", ar: "الانطفاء", sous: "La lumière qui s'éteint",
    detail: "Ce qui s'éteint sans bruit quand un ancien part : un geste, un raccourci qu'on ne prend jamais, le nom de celui qu'il faut appeler. Ce n'est la faute de personne — c'est le départ, l'oubli, l'usure. Il recule chaque fois qu'un savoir est repris."
  };
  var relie = {
    nom: "Le Relais", ar: "حامل المشعل", sous: "Le Nouvel arrivant",
    detail: "Celui qui reprend la lumière avant qu'elle ne s'éteigne. Pas le plus ancien, pas le plus savant : celui qui arrive, écoute, et rallume."
  };

  // ======================================================================================
  // 3 · LE PROLOGUE — forme de PROLOGUE_PAGES (recit.js) : sept pages, {pseudo} pour le
  // nom du joueur, 260 caractères au plus chacune. Ba Lahcen le raconte ; la boîte
  // porte le titre du jeu (maison.js : prologueTitre).
  // ======================================================================================
  var prologue = [
    "Marhba, {pseudo}. Moi, c'est Ba Lahcen. Je suis entré dans cette maison en 2004, l'année de sa naissance. J'ai vu l'eau arriver aux orangers, le premier vent faire tourner les pales, la grande centrale s'allumer.",
    "Je vais te dire une chose qu'aucun manuel n'écrit. Quand un ancien part, un peu de ce qu'il savait s'éteint avec lui : le bruit d'une machine qui va mal, le raccourci qu'on ne prend jamais, le nom de celui qu'il faut appeler.",
    "Personne n'éteint cette lumière exprès. Ce n'est la faute de personne : c'est le départ, l'oubli, l'usure. Mais si personne ne reprend ce savoir, la maison s'assombrit, lampe après lampe. Ici, on appelle ça le Blackout.",
    "Toi, tu arrives. Et celui qui arrive a un pouvoir que les anciens ont perdu : il pose les questions que plus personne ne pose. Tu as quarante jours pour rallumer ce qui s'éteint.",
    "Trois compteurs te suivront, et aucun ne se change en l'autre. La Lumière : ce que tu sais de la maison. La Puissance : ce que tu prouves de ton métier. Le Réseau : ce que les autres te reconnaissent — celui-là, personne ne se le donne seul.",
    "Une seule règle avant d'entrer : ici, personne n'est né en sachant. Pose tes questions, même les plus simples — surtout les plus simples. Chaque réponse que tu gardes, et que tu transmets, rallume une lampe.",
    "Commence par les archives, à l'ouest de la cour. Le coffre y garde une page par site : ce que les anciens savaient de chacun. Yallah, {pseudo} — la première lampe t'attend."
  ];

  // Quand les huit pages sont revenues — forme d'EPILOGUE (recit.js). Même titre que
  // le prologue (maison.js : prologueTitre), donc le même visage, celui de Ba Lahcen.
  // ⚠️ maison.js ne le pose pas encore sur recit.EPILOGUE : sans lui, le moteur dirait
  //    la fin de l'histoire de Zawia.
  var epilogue = {
    nom: "Au Courant",
    pages: [
      "Huit pages, huit sites. Les archives sont rallumées — pour cette saison.",
      "Le Blackout ne disparaît pas : il revient chaque fois que quelqu'un part sans transmettre. Alors transmets. Raconte. Note. C'est comme ça qu'une lampe reste allumée."
    ]
  };

  // ======================================================================================
  // 4 · LES SITES — forme de MOURCHIDINE (recit.js) : { cle, ville, ar, nom, role }.
  // Le coffre dit, pour chaque page : « <nom> — <role> — veille sur cette page ».
  // Les huit clés sont celles des portraits et des cartes (assets/maisons/nareva/),
  // plus « ancien » : Ba Lahcen, qui n'a pas de page mais un visage.
  // ======================================================================================
  var sites = [
    { cle: "sebt-el-guerdane", ville: "Sebt El Guerdane", ar: "سبت الكردان", nom: "Le jardinier", role: "l'eau des orangers" },
    { cle: "foum-el-oued", ville: "Foum El Oued", ar: "فم الواد", nom: "L'éclaireur", role: "parmi les premiers parcs de la loi 13-09" },
    { cle: "haouma", ville: "Haouma", ar: "حومة", nom: "Le veilleur du Nord", role: "le vent près de Tanger" },
    { cle: "akhfennir", ville: "Akhfennir", ar: "أخفنير", nom: "Les jumeaux", role: "deux parcs, un seul souffle" },
    { cle: "tarfaya", ville: "Tarfaya", ar: "طرفاية", nom: "Le géant", role: "le plus grand d'Afrique, le jour de sa mise en service" },
    { cle: "aftissat", ville: "Aftissat", ar: "أفتيسات", nom: "Le bâtisseur", role: "grandir par étapes" },
    { cle: "safi", ville: "Safi", ar: "آسفي", nom: "Le cœur régulier", role: "la production stable du réseau" },
    { cle: "dakhla", ville: "Dakhla", ar: "الداخلة", nom: "La source", role: "l'eau douce née du vent" },
    { cle: "ancien", ville: "Tous les sites", ar: "كل المواقع", nom: "Ba Lahcen", role: "la mémoire de la maison" }
  ];

  // ======================================================================================
  // 5 · LES PAGES DES ARCHIVES — forme de PAGES (pages.js) : une page par site, toutes
  // ouvertes (saison 0, pas de `des`), dans l'ordre des mises en service.
  //   indices[0] dit OÙ CHERCHER (sur nareva.ma), indices[1] donne un FAIT.
  //   reponses : la forme canonique d'abord ; le moteur compare sans casse, sans
  //   accents, sans articles (el, al, de…) et accepte une phrase qui contient la réponse.
  //   source : la page nareva.ma qui prouve le fait (deux quand la date vient de la frise).
  // `voie` : « savoir » (eau, environnement, culture technique) ou « image »
  // (exploitation et maintenance) — la page l'exerce, l'établi la note.
  // ======================================================================================
  var PROJETS = "https://www.nareva.ma/nos-projets/";
  var FRISE = "https://www.nareva.ma/a-propos-nous/#notre-histoire";
  var pages = [
    {
      cle: "sebt-el-guerdane", ville: "sebt-el-guerdane", epoque: "2009", titre: "L'eau avant le vent", voie: "savoir", saison: 0,
      enigme: "Avant le premier vent, la maison a commencé par l'eau. En 2009, elle met en service un projet d'irrigation qui sauve un grand périmètre d'agrumes : 10 600 hectares, jusqu'à 45 millions de m³ d'eau par an. On le dit premier partenariat public-privé au monde dans l'irrigation. Quel est le nom de ce périmètre ?",
      indices: [
        "Où chercher : sur nareva.ma, la page « Nos Métiers », au paragraphe « Transfert de l'eau ». Ou la frise « Notre histoire » : c'est la première date après la fondation.",
        "Un fait : l'eau vient du barrage d'Aoulouz, par un ouvrage de 384 km. Et le nom du périmètre commence par « Sebt »."
      ],
      reponses: ["Sebt El Guerdane", "Sebt Guerdane", "Sebt El Gardane", "Sebt Gardane", "Sebt Elguerdane", "Sebt Lguerdane", "Sebt El Guerdan", "Guerdane", "سبت الكردان", "سبت الگردان"],
      fait: "Sebt El Guerdane, mis en service en 2009, irrigue 10 600 hectares d'agrumes avec jusqu'à 45 millions de m³ d'eau par an, amenés du barrage d'Aoulouz par un ouvrage de 384 km. Double objectif : sauver le périmètre agrumicole et rééquilibrer les ressources en eau souterraines. C'est le premier partenariat public-privé au monde dans l'irrigation : la maison a commencé par l'eau.",
      source: "https://www.nareva.ma/nos-metiers/#cycle-de-l-eau"
    },
    {
      cle: "foum-el-oued", ville: "foum-el-oued", epoque: "2013", titre: "Parmi les tout premiers", voie: "savoir", saison: 0,
      enigme: "Septembre 2013, près de Laâyoune : un parc éolien de 50 MW entre en exploitation. C'est l'un des tout premiers de la maison sous la loi 13-09, une étape pour la production privée d'électricité renouvelable. Chaque année, il évite près de 150 000 tonnes de CO₂. Quel est son nom ?",
      indices: [
        "Où chercher : sur nareva.ma, la page « Nos Projets », rubrique « Nos réalisations » — c'est le premier parc de la liste.",
        "Un fait : il est à 20 km au sud-ouest de Laâyoune et produit environ 220 GWh par an. Son nom commence par « Foum »."
      ],
      reponses: ["Foum El Oued", "Foum el Oued", "Foum Eloued", "Foum Oued", "Foum El Wad", "Foum Loued", "Foum El Ouad", "فم الواد", "فم الوادي"],
      fait: "Foum El Oued, à 20 km au sud-ouest de Laâyoune, est entré en exploitation commerciale en septembre 2013 : l'un des premiers projets de la maison sous la loi 13-09, une étape importante pour la production privée d'électricité renouvelable. Ses 50 MW produisent environ 220 GWh par an et évitent près de 150 000 tonnes de CO₂.",
      source: PROJETS
    },
    {
      cle: "haouma", ville: "haouma", epoque: "2013", titre: "Le vent du Nord", voie: "savoir", saison: 0,
      enigme: "Décembre 2013. Pendant que le Sud reçoit ses premiers parcs, le Nord reçoit le sien : 50 MW, à 50 km à l'est de Tanger, l'un des premiers de la maison sous la loi 13-09. Son nom tient en un seul mot. Lequel ?",
      indices: [
        "Où chercher : sur nareva.ma, la page « Nos Projets », rubrique « Nos réalisations » — le parc près de Tanger.",
        "Un fait : il produit environ 170 GWh par an et évite près de 120 000 tonnes de CO₂. Son nom commence par « Hao »."
      ],
      reponses: ["Haouma", "Houma", "Hawma", "Haoma", "Haoumah", "حومة", "الحومة"],
      fait: "Haouma, à 50 km à l'est de Tanger, est entré en exploitation commerciale en décembre 2013 : l'un des premiers projets de la maison sous la loi 13-09, pour l'électricité renouvelable du nord du Maroc. Ses 50 MW produisent environ 170 GWh par an et évitent près de 120 000 tonnes de CO₂.",
      source: PROJETS
    },
    {
      cle: "akhfennir", ville: "akhfennir", epoque: "2013-2016", titre: "Deux parcs, un seul souffle", voie: "image", saison: 0,
      enigme: "Deux parcs en un : le premier tourne depuis juillet 2013, le second depuis juin 2016. Ensemble, 117 turbines et 200 MW, à 100 km au nord-est de la ville de Tarfaya. Quel est le nom de ce complexe ?",
      indices: [
        "Où chercher : sur nareva.ma, la page « Nos Projets », rubrique « Nos réalisations » — le complexe « 1 & 2 ».",
        "Un fait : 61 turbines pour le premier parc, 56 pour le second, et environ 490 000 tonnes de CO₂ évitées par an. Son nom commence par « Akh »."
      ],
      reponses: ["Akhfennir", "Akhfenir", "Akhfanir", "Akhfannir", "Akhefennir", "Akhfinir", "Akhfennir 1 et 2", "أخفنير", "اخفنير"],
      fait: "Le complexe d'Akhfennir, à 100 km au nord-est de la ville de Tarfaya, réunit deux parcs : Akhfennir 1, en exploitation depuis juillet 2013, et Akhfennir 2, depuis juin 2016. Ses 117 turbines — 61 et 56 — totalisent 200 MW, produisent près de 735 GWh par an et évitent environ 490 000 tonnes de CO₂.",
      source: PROJETS
    },
    {
      cle: "tarfaya", ville: "tarfaya", epoque: "2014", titre: "Le plus grand d'Afrique, un jour", voie: "savoir", saison: 0,
      enigme: "En 2014, à 20 km de la ville qui lui donne son nom, un parc de 300 MW entre en exploitation. Ce jour-là, c'est le plus grand parc éolien d'Afrique. Quel est son nom ?",
      indices: [
        "Où chercher : sur nareva.ma, la page « Nos Projets » — le parc de 300 MW, « le plus grand d'Afrique lors de sa mise en service ».",
        "Un fait : sa ville est celle dont Akhfennir est à 100 km, vers le nord-est. Le parc produit environ 1 100 GWh par an."
      ],
      reponses: ["Tarfaya", "Tarfaia", "Tarfaïa", "Terfaya", "Tarfaya ville", "طرفاية"],
      fait: "Le parc de Tarfaya, à 20 km au sud-est de la ville, est entré en exploitation commerciale en 2014 : il était alors le plus grand parc éolien d'Afrique. Ses 300 MW produisent environ 1 100 GWh d'électricité verte par an. Un investissement de 600 millions de dollars, et environ 800 000 tonnes de CO₂ évitées chaque année.",
      source: PROJETS
    },
    {
      cle: "aftissat", ville: "aftissat", epoque: "2018-2026", titre: "Grandir par étapes", voie: "image", saison: 0,
      enigme: "Dans la région de Boujdour, un complexe a grandi en quatre étapes, avec des turbines toujours plus puissantes : 3,6 MW, puis 5 MW, puis 6,2 MW. Aujourd'hui, 550 MW : le second plus grand parc éolien d'Afrique. Quel est son nom ?",
      indices: [
        "Où chercher : sur nareva.ma, la page « Nos Projets » — le complexe « 1, 2, 3 & 4 ». Ou la frise « Notre histoire » : il y revient en 2018, en 2023 et en 2026.",
        "Un fait : 121 turbines, et près de 3 000 GWh par an — l'équivalent de la consommation électrique de toute la région de l'Oriental. Son nom commence par « Aft »."
      ],
      reponses: ["Aftissat", "Aftisat", "Aftissate", "Aftiçat", "Aftisset", "أفتيسات", "افتيسات"],
      fait: "Le complexe d'Aftissat, dans la région de Boujdour, a grandi par phases : Aftissat 1 en 2018, Aftissat 2 en 2023, Aftissat 3 et 4 en 2026. Ses 121 turbines — 56 de 3,6 MW, 40 de 5 MW, 25 de 6,2 MW — totalisent 550 MW : le second plus grand parc éolien d'Afrique. Il produit près de 3 000 GWh par an, l'équivalent de la consommation électrique de toute la région de l'Oriental.",
      source: PROJETS + " — et, pour les dates, " + FRISE
    },
    {
      cle: "safi", ville: "safi", epoque: "2018", titre: "La centrale qui tient le réseau", voie: "image", saison: 0,
      enigme: "Elle ne tourne pas au vent, et pourtant elle compte : avec 1 386 MW, elle couvre environ 20 % de la demande électrique du pays. Mise en service en 2018, c'est la seule centrale d'Afrique à utiliser la technologie dite ultra-supercritique. Dans quelle ville se trouve-t-elle ?",
      indices: [
        "Où chercher : sur nareva.ma, la page « Nos Projets », rubrique « Énergie thermique ».",
        "Un fait : elle produit environ 10 000 GWh par an, et sur la frise de la maison elle porte le nom de sa société, « Safiec » — la ville est dans le nom."
      ],
      reponses: ["Safi", "Asfi", "Safy", "À Safi", "Centrale de Safi", "Centrale thermique de Safi", "Safiec", "آسفي"],
      fait: "La centrale thermique de Safi, mise en service en 2018, a une capacité de 1 386 MW et produit environ 10 000 GWh par an : près de 20 % de la demande électrique du Maroc. C'est la seule centrale d'Afrique à utiliser la technologie ultra-supercritique, pour un rendement élevé. Elle assure une production stable et fiable, indispensable au bon fonctionnement du réseau électrique.",
      source: PROJETS
    },
    {
      cle: "dakhla", ville: "dakhla", epoque: "2025-2026", titre: "Le vent qui fait de l'eau", voie: "savoir", saison: 0,
      enigme: "Ici, le vent fait de l'eau douce. Un parc éolien de 60 MW alimente une unité de dessalement de 37 millions de m³ par an : la première au monde, à grande échelle, alimentée exclusivement par de l'électricité renouvelable. Environ 80 % de l'eau iront à l'irrigation, le reste à l'eau potable de la région. Quelle ville ?",
      indices: [
        "Où chercher : sur nareva.ma, la page « Nos Projets », rubrique « Dessalement ». Ou la frise « Notre histoire », en 2025 et en 2026.",
        "Un fait : le périmètre irrigué fera 5 000 hectares, pour un investissement de 240 millions de dollars. La ville est au bout de la frise, et son nom commence par « Dak »."
      ],
      reponses: ["Dakhla", "Dakhlah", "Dakla", "Ad-Dakhla", "Dakhla dessalement", "الداخلة", "داخلة"],
      fait: "À Dakhla, la maison construit la première unité de dessalement à grande échelle au monde alimentée exclusivement par de l'électricité renouvelable : 37 millions de m³ d'eau par an, grâce à un parc éolien dédié de 60 MW. Environ 80 % de l'eau iront irriguer 5 000 hectares de cultures à haute valeur ajoutée, les 20 % restants à l'eau potable de la région. Un investissement de 240 millions de dollars, qui associe transition énergétique et sécurité hydrique.",
      source: PROJETS + " — et, pour les dates, " + FRISE
    }
  ];

  // ======================================================================================
  // 6 · LES DÉFIS DE MÉTIER — forme de TAHADDI (tahaddi.js) : { cle, voie, titre, enonce,
  // options[4], bonne, explication }. Aucun `exercice` : l'établi l'annonce « avec une
  // IA », ce qui n'a pas de sens ici. Dans l'ordre où le programme du jour les sert.
  //   prompt = Sécurité · image = Exploitation et maintenance ·
  //   savoir = Eau, environnement et culture technique.
  // ⚠️ Aucun chiffre technique : une limite de vent, une tension, une hauteur se lisent
  //    dans la procédure du site, jamais dans un jeu.
  // ======================================================================================
  var tahaddi = [
    {
      cle: "droit-arret", voie: "prompt", titre: "Le droit d'arrêter",
      enonce: "Pendant une intervention, tu vois qu'une consigne n'est pas respectée et qu'un collègue risque de se blesser. Tu es nouveau. Que fais-tu ?",
      options: [
        "Tu te tais : tu es nouveau, les anciens savent ce qu'ils font",
        "Tu attends la fin du travail pour en parler au responsable",
        "Tu filmes la scène pour avoir une preuve",
        "Tu fais arrêter le travail, calmement, et tu dis ce que tu as vu"
      ],
      bonne: 3,
      explication: "Arrêter un travail dangereux n'est pas un manque de respect : c'est la forme la plus haute du respect. Un arrêt pour rien coûte quelques minutes ; un silence peut coûter une vie. On arrête, on explique ce qu'on a vu, on reprend quand le risque est traité. Dans une culture de sécurité, chacun a ce droit — le nouvel arrivant aussi, et même d'abord lui : il voit ce que l'habitude ne voit plus."
    },
    {
      cle: "alarme", voie: "image", titre: "L'alarme qui s'efface",
      enonce: "Sur l'écran de supervision, une alarme « température élevée » s'allume sur une turbine, puis s'efface d'elle-même au bout de quelques minutes. Que fais-tu ?",
      options: [
        "Rien : elle s'est effacée d'elle-même",
        "Tu la notes, tu regardes si elle revient et sur quelle machine, et tu la signales selon la procédure",
        "Tu la masques pour ne plus être dérangé",
        "Tu redémarres la supervision pour repartir à zéro"
      ],
      bonne: 1,
      explication: "Une alarme qui s'efface n'est pas une alarme réglée. On lit ce qu'elle dit, où, quand, et si elle revient : c'est la répétition qui raconte la panne avant qu'elle n'arrive. Masquer une alarme sans décision écrite, c'est éteindre un témoin — le contraire du métier."
    },
    {
      cle: "vent-fort", voie: "savoir", titre: "Quand le vent est trop fort",
      enonce: "Grand vent sur le parc. Toutes les turbines se sont arrêtées d'elles-mêmes, pales en drapeau. Que se passe-t-il ?",
      options: [
        "Une panne générale : il faut appeler le constructeur",
        "Il n'y a plus assez de vent pour tourner",
        "Elles se protègent : au-delà d'un certain vent, une éolienne se met en sécurité et s'arrête",
        "Quelqu'un a déclenché un arrêt d'urgence sur tout le parc"
      ],
      bonne: 2,
      explication: "Une éolienne produit dans une plage de vent. Trop faible, elle attend ; trop fort, elle se met en sécurité : elle oriente ses pales pour ne plus prendre le vent — on dit « en drapeau » — et s'arrête. Ce n'est pas une panne, c'est un réflexe. Les interventions ont, elles aussi, leurs limites de vent, écrites dans les procédures : ce jour-là, on ne monte pas."
    },
    {
      cle: "consignation", voie: "image", titre: "Couper ne suffit pas",
      enonce: "Tu dois intervenir dans une armoire électrique. Le disjoncteur est déjà ouvert. Que fais-tu avant de toucher quoi que ce soit ?",
      options: [
        "Tu y vas : le disjoncteur est ouvert, il n'y a plus de courant",
        "Tu demandes à un collègue de surveiller le disjoncteur pendant que tu travailles",
        "Tu consignes : tu sépares la source, tu la condamnes avec ton cadenas et ton étiquette, et tu vérifies toi-même l'absence de tension",
        "Tu travailles vite, pour limiter le temps d'exposition"
      ],
      bonne: 2,
      explication: "Un disjoncteur ouvert n'est pas une preuve. La consignation est une suite de gestes : séparer la source d'énergie, la condamner — ton cadenas, ton étiquette —, identifier le bon équipement, vérifier l'absence de tension avec un appareil éprouvé et, quand la procédure le demande, mettre à la terre. On ne se fie ni à la position d'un interrupteur, ni à la parole d'un collègue : on vérifie soi-même."
    },
    {
      cle: "hauteur", voie: "prompt", titre: "Toujours relié",
      enonce: "Tu montes dans le mât d'une éolienne par l'échelle. Qu'est-ce qui ne se discute jamais ?",
      options: [
        "Harnais vérifié, longe reliée à l'antichute à chaque instant, jamais seul, et le plan de secours connu avant de monter",
        "Monter sans harnais si l'on est deux et qu'on se sent en forme",
        "Décrocher sa longe un instant pour aller plus vite",
        "Monter le plus vite possible pour réduire le temps passé en hauteur"
      ],
      bonne: 0,
      explication: "En hauteur, on reste relié à chaque instant, du pied de la tour jusqu'à la nacelle. On vérifie son harnais avant chaque montée, on ne monte jamais seul, et l'on sait AVANT de monter comment on redescendrait un collègue blessé : le secours en hauteur se prépare au sol, pas dans l'urgence."
    },
    {
      cle: "presque-accident", voie: "prompt", titre: "L'accident qui a eu de la chance",
      enonce: "En haut d'un escabeau, un outil t'échappe et tombe à un mètre d'un collègue. Personne n'est blessé. Que fais-tu ?",
      options: [
        "Rien : il n'y a pas eu d'accident",
        "Tu le déclares comme presque-accident, pour que la cause soit corrigée avant de blesser quelqu'un",
        "Tu t'excuses auprès du collègue, et ça reste entre vous",
        "Tu attends de voir si ça se reproduit"
      ],
      bonne: 1,
      explication: "Un presque-accident, c'est un accident qui a eu de la chance. La chance ne se répète pas ; la cause, si. Le déclarer, ce n'est dénoncer personne — ni toi, ni un autre : c'est offrir à la maison l'occasion de corriger avant qu'il y ait un blessé. Ici, peut-être un simple porte-outil attaché au poignet."
    },
    {
      cle: "dessalement", voie: "savoir", titre: "De la mer à l'eau douce",
      enonce: "Dans une unité de dessalement par osmose inverse, comment l'eau de mer devient-elle de l'eau douce ?",
      options: [
        "On la fait bouillir, et l'on récupère la vapeur",
        "On y ajoute un produit qui fait disparaître le sel",
        "On la filtre simplement sur du sable fin",
        "On la pousse sous forte pression à travers des membranes qui laissent passer l'eau et retiennent l'essentiel du sel"
      ],
      bonne: 3,
      explication: "L'osmose inverse pousse l'eau de mer à travers des membranes très fines : l'eau passe, le sel reste. Il faut une forte pression, donc de l'énergie — c'est ce qui rend Dakhla remarquable : la maison y construit une unité alimentée exclusivement par l'électricité renouvelable d'un parc éolien dédié. Faire bouillir l'eau existe aussi : c'est la distillation, un autre procédé. Et ce qui reste, une eau très salée, se rejette avec soin."
    },
    {
      cle: "gestes-urgence", voie: "prompt", titre: "Protéger d'abord",
      enonce: "Tu découvres un collègue au sol, inconscient, près d'une armoire électrique ouverte. Que fais-tu d'abord ?",
      options: [
        "Tu le tires tout de suite loin de l'armoire",
        "Tu attends qu'il reprenne connaissance avant d'appeler",
        "Tu fais couper l'énergie ou tu t'assures qu'elle l'est, tu alertes selon la consigne du site, puis tu secours dans la limite de ta formation",
        "Tu lui donnes à boire pour le réveiller"
      ],
      bonne: 2,
      explication: "Protéger, alerter, secourir — dans cet ordre. Près d'une installation électrique, toucher la victime avant que l'énergie soit coupée, c'est risquer une deuxième victime. Puis on alerte, selon la consigne affichée sur ton site, et on ne fait que les gestes qu'on a appris. On ne donne jamais à boire à une personne inconsciente."
    },
    {
      cle: "rapport-incident", voie: "image", titre: "Un rapport pour apprendre",
      enonce: "Après un incident sans gravité, c'est à toi d'en rédiger le rapport. Qu'est-ce qui le rend utile ?",
      options: [
        "Des faits datés, dans l'ordre, les causes trouvées, et des actions avec un nom et une date",
        "Le nom du responsable, écrit clairement",
        "Le plus court possible, pour clore le dossier vite",
        "Attendre une semaine, pour avoir du recul"
      ],
      bonne: 0,
      explication: "Un rapport d'incident sert à apprendre, pas à punir. Des faits, dans l'ordre, sans adjectifs ; les causes — souvent plusieurs, rarement une seule personne ; des actions qui ont un porteur et une date. On l'écrit tôt, tant que les souvenirs sont frais. Un rapport qui cherche un coupable fait taire le suivant."
    },
    {
      cle: "moment-securite", voie: "prompt", titre: "Cinq minutes qui comptent",
      enonce: "Ton équipe ouvre sa semaine par un moment sécurité de quelques minutes. À quoi sert-il vraiment ?",
      options: [
        "À cocher une case pour l'audit",
        "À partager un risque du jour ou une situation vécue, pour que chacun reparte avec un geste en tête",
        "À chercher qui a commis une faute la semaine passée",
        "À relire le règlement à voix haute"
      ],
      bonne: 1,
      explication: "Un bon moment sécurité est court, concret, et parle d'aujourd'hui : le levage de l'après-midi, la route du parc par grand vent, le presque-accident de la semaine. On n'y cherche pas un coupable : on y cherche le geste qui protège. Et chacun peut y apporter un cas — le nouvel arrivant aussi."
    }
  ];

  // Les trois familles de défis, telles que l'établi les nomme. maison.js les pose sur
  // regles.VOIES : `nom` devient le nom affiché, `sens` le détail (« Voie « … » : … »).
  var voies = {
    prompt: { nom: "Sécurité", ar: "السلامة",
      sens: "Se protéger et protéger les autres : les gestes, les règles, et le droit d'arrêter un travail dangereux." },
    image: { nom: "Exploitation et maintenance", ar: "الاستغلال والصيانة",
      sens: "Faire tourner les installations, les entretenir, et savoir lire ce qu'elles disent." },
    savoir: { nom: "Eau et environnement", ar: "الماء والبيئة",
      sens: "L'eau, l'environnement et la culture technique : comprendre ce que font nos installations, et pourquoi." }
  };

  // ======================================================================================
  // 7 · LES GENS DE LA COUR — pour chacune des six clés de pnj.js : { nom, pages }.
  // Les places, les rondes et les visages ne changent pas. Même mécanique que
  // l'original : Ba Lahcen dit le programme du jour, Kawtar dit le nom du joueur,
  // Anas lit le jour des quarante. Les cinq collègues sont ceux de `metiers`.
  // ======================================================================================
  var pnj = {
    bawwab: {
      nom: "Ba Lahcen, l'ancien",
      pages: function (ctx) {
        var p = [
          "Marhba" + virgule(ctx) + ". Je suis Ba Lahcen. Je suis entré ici en 2004, l'année où la maison est née. Depuis, j'ai vu chaque site s'allumer.",
          "Le premier jour, personne ne sait tout. Moi non plus, je ne savais rien. Pose tes questions, même les plus simples — surtout les plus simples.",
          "Ici, rien ne s'éteint si quelqu'un le reprend. Écoute les anciens, note ce qu'ils disent, et un jour tu le diras à ton tour."
        ];
        // Il dit le programme du jour : c'est lui qu'on croise en entrant.
        var w = ctx && ctx.wird;
        if (w && w.prochain) p.push("Ton programme du jour : « " + w.prochain.titre + " » — " + w.prochain.minutes + " minutes, pas plus. Un pas par jour, quarante jours. Le Menu te dit lequel.");
        else if (w && w.fini) p.push("Quarante jours tenus. Maintenant, c'est la maison qui te dit la suite.");
        else if (w) p.push("Ton pas du jour est fait. Promène-toi, ou reviens demain — il y en aura un autre.");
        return p;
      }
    },
    nour: {
      nom: "Kawtar",
      pages: function (ctx) {
        var n = nomDe(ctx);
        return [
          "Toi aussi, tu commences ? Moi, c'est Kawtar. J'arrive pour le projet de dessalement de Dakhla, et je n'ose pas encore descendre dans la cour.",
          "On m'a dit qu'aux archives, un coffre garde une page par site : ce que les anciens savaient de chacun. Huit sites, huit histoires. Ça me tente plus que je ne l'avoue.",
          (n ? "Allez, " + n + "." : "Allez.") + " On y va ensemble ? À deux, on ose plus de questions."
        ];
      }
    },
    warraq: {
      nom: "Mbarek, de la maintenance",
      pages: [
        "Je suis à Akhfennir depuis que le premier parc tourne, en 2013. J'ai appris chaque machine à la main.",
        "Un document que personne ne relit finit par mentir : la machine change, le papier reste. Alors quand tu apprends un geste, écris-le — deux lignes suffisent.",
        "Et consigne toujours. Même pour cinq minutes. Même quand tu es pressé. Surtout quand tu es pressé."
      ]
    },
    yassine: {
      nom: "Anas",
      pages: function (ctx) {
        var a = ctx && ctx.arb3ine;
        return [
          "Je fais le tour du cœur d'énergie pour réviser mes procédures. À force de les répéter, elles deviennent des réflexes — c'est ça qui te protège, en haut d'une tour.",
          a && !a.ecoule
            ? "Tes quarante jours, tu en es au jour " + a.jour + " ? Les miens sont loin derrière moi. Ça passe plus vite qu'on ne croit."
            : "Quarante jours pour trouver ta place. Ça a l'air long. Ça ne l'est pas.",
          "Un conseil de Tarfaya : sur l'écran, une alarme qui s'efface n'est pas une alarme réglée. Note-la, et regarde si elle revient."
        ];
      }
    },
    zhor: {
      nom: "Touria, des ressources humaines",
      pages: [
        "Je suis au siège depuis longtemps. J'ai accueilli des centaines de nouveaux, et je me souviens de chacun.",
        "Ceux qui réussissent ne sont pas les plus brillants. Ce sont ceux qui demandent, et qui reviennent.",
        "Le Blackout, c'est ce qu'on ne transmet pas. Moi, je retiens les visages. Viens me dire bonjour — et pose-moi tes questions : il n'y en a pas de bêtes."
      ]
    },
    omar: {
      nom: "Reda",
      pages: [
        "J'ai fini mes quarante jours la semaine dernière. Le secret ? Il n'y en a pas : être là, poser des questions, noter.",
        "À Safi, j'ai appris une chose : un presque-accident déclaré, c'est un accident évité. Déclarer n'accuse personne.",
        "La Puissance, tu la gagnes à l'établi de l'atelier métier. La Lumière, aux archives. Mais le Réseau — ça, c'est ensemble ou rien."
      ]
    }
  };

  // ======================================================================================
  // 8 · LE GUIDE DE BA LAHCEN — forme de tutoriel.js : ECHAUFFEMENT et etapes(maison, geste).
  // Mêmes étapes, mêmes clés, mêmes tuiles, mêmes événements que le moteur, SAUF la
  // septième : le moteur menait au Souk (clé « souk », événement « etal », tuile G) —
  // une salle qui n'existe pas chez Nareva (décision de Youssef, 24/09/2026). Elle
  // devient « lumiere » : rallumer seul une deuxième page au coffre des archives
  // (événement « page », tuile S), un geste que jeu.js sait déjà reconnaître.
  // Le moment sécurité n'est PAS une preuve de présence : il se présente, sans compteur.
  // ⚠️ interface.js (chargé après) remplace aujourd'hui tout ce guide par le sien, en six
  //    pas — et sans ECHAUFFEMENT, le moteur garderait celui de Zawia.
  // ======================================================================================
  var ECHAUFFEMENT = {
    cle: "echauffement-securite",
    voie: "prompt",
    titre: "L'échauffement de Ba Lahcen",
    enonce: "Premier jour sur un site. Avant de franchir la clôture, qu'est-ce qui passe avant tout ?",
    options: [
      "Suivre le premier collègue qui entre",
      "Recevoir l'accueil sécurité du site et porter les protections demandées",
      "Prendre des photos pour ta présentation",
      "Chercher le bureau du chef de site"
    ],
    bonne: 1,
    explication: "Sur un site, la sécurité passe la porte avant toi : l'accueil sécurité, les protections, les zones où l'on n'entre pas seul. Ce n'est pas une formalité — c'est la première chose que les anciens te transmettent."
  };

  var GUIDE = "Ba Lahcen · l'ancien";

  function etapes(maison, geste) {
    var pas = [];
    pas.push({
      cle: "khatt", evenement: "tuile:V", tuile: "V",
      consigne: "Lis une valeur sur un mur de la cour — approche-toi, Espace ou A",
      debut: {
        nom: GUIDE,
        pages: [
          "Marhba. Le prologue t'a dit pourquoi tu es là ; moi, je te montre comment on vit ici. Sept pas suffisent — suis le fil d'or au sol.",
          "D'abord, les jambes : flèches ou ZQSD — ou la croix sous ton pouce. Sur les murs de la cour, sept inscriptions portent ce que la maison croit : ses cinq valeurs, sa mission, sa vision. Va en lire une : approche-toi, et appuie sur Espace (ou A)."
        ]
      }
    });
    pas.push({
      cle: "page", evenement: "page", tuile: "S",
      consigne: "Ouvre le coffre des archives, et rallume la première page",
      debut: {
        nom: GUIDE,
        pages: [
          "☑ Un mur lu. Les sept tiennent debout ensemble : on les lit en passant, tous les jours, sans y penser.",
          "Maintenant, la Lumière — ce que tu sais de la maison. À l'ouest, dans les archives, un coffre garde une page par site : ce que les anciens savaient de chacun. Ouvre-le : la première parle d'eau, avant même le premier vent. Les indices sont là pour servir."
        ]
      }
    });
    if (maison) {
      pas.push({
        cle: "defi", evenement: "defi", tuile: "E",
        consigne: "Passe un défi de métier à l'établi de l'atelier métier",
        debut: {
          nom: GUIDE,
          pages: [
            "☑ Une page rallumée : ta Lumière monte, et une lampe se rallume dans la maison.",
            "Deuxième compteur : la Puissance — ce que tu prouves de ton métier. À l'établi de l'atelier métier, à l'est, un défi t'attend : une situation du terrain, corrigée par le jeu. Trois familles s'y exercent : la sécurité ; l'exploitation et la maintenance ; l'eau et l'environnement."
          ]
        }
      });
    } else {
      pas.push({
        cle: "defi", evenement: "echauffement", echauffement: true,
        consigne: "L'échauffement de Ba Lahcen — réponds au défi",
        debut: {
          nom: GUIDE,
          pages: [
            "☑ Une page rallumée : ta Lumière monte, et une lampe se rallume dans la maison.",
            "Deuxième compteur : la Puissance — ce que tu prouves de ton métier. L'établi attend ton inscription par la RH ; mais je te montre le geste, sans points ni registre. Un échauffement :",
            ECHAUFFEMENT.enonce
          ]
        }
      });
    }
    pas.push({
      cle: "tableau", evenement: "tableau", salle: "tableau",
      consigne: "Ouvre le Menu, puis le tableau",
      debut: {
        nom: GUIDE,
        pages: [
          maison
            ? "☑ C'est ça, la Puissance : elle se gagne seul, à l'établi et au quiz du jour — et elle ne fera jamais ton palier."
            : "☑ C'est ça, un défi de métier. Ta Puissance s'écrira le jour où la RH t'aura inscrit ; d'ici là, la Lumière t'est grande ouverte.",
          "Reste le troisième compteur, le seul qui fasse ton palier : le Réseau. Ouvre le Menu, en haut à droite, et lis le tableau."
        ]
      }
    });
    var reseau = [
      "Le Réseau, personne ne se l'écrit : il se reçoit. Regarde qui monte au tableau — ceux qui aident.",
      "Il se gagne ensemble : saluer un collègue dans la cour, l'aider, répondre à ses messages. Et pour comprendre les mots d'ici, le lexique de la maison t'attend sur les rayonnages des archives. Vas-y."
    ];
    if (maison) reseau.push("Les rituels de la maison — le moment sécurité du lundi, la réunion d'équipe — se présentent dans la salle de réunion, au sud. On n'y gagne pas de points : on y apprend des autres.");
    pas.push({
      cle: "biblio", evenement: "biblio", tuile: "B",
      consigne: "Va aux rayonnages des archives — le lexique de la maison y est rangé",
      debut: { nom: GUIDE, pages: reseau }
    });
    pas.push({
      cle: "carnet", evenement: "carnet", salle: "carnet",
      consigne: "Ouvre le Menu, puis ton carnet",
      debut: {
        nom: GUIDE,
        pages: [
          "☑ Les rayonnages des archives : le lexique de la maison, et les documents qu'un nouveau lit dans ses premiers jours.",
          "Sixième pas : ouvre ton carnet, au Menu. Regarde tes trois compteurs côte à côte."
        ]
      }
    });
    pas.push({
      cle: "lumiere", evenement: "page", tuile: "S",
      consigne: "Retourne au coffre des archives, et rallume une deuxième page — seul, cette fois",
      debut: {
        nom: GUIDE,
        pages: [
          "☑ Trois compteurs, et aucun ne se change en l'autre. Reste le geste qui compte le plus.",
          "Rallumer une lampe toi-même. Retourne au coffre des archives, à l'ouest : la deuxième page parle d'un parc de 2013. Cette fois, je ne te donne pas la réponse — le premier indice te dit où chercher."
        ]
      }
    });
    pas.push({
      cle: "fin", evenement: null, fin: true,
      consigne: "",
      debut: {
        nom: GUIDE,
        pages: [
          "☑ Deux lampes rallumées de ta main. Les autres t'attendent, une par site.",
          "Ta Lumière a bougé aujourd'hui" + (maison ? ", ta Puissance aussi" : "") + ". Le Réseau, lui, est à zéro — et c'est normal : il se reçoit des autres, jamais d'ici. Les trois ne se changent pas l'un en l'autre.",
          "Au Menu t'attendent le programme du jour, ta carte de collègue et tes messages. Tes quarante jours commencent : ils sont faits pour rallumer ce qui s'éteint. Yallah."
        ].concat(typeof geste === "string" && geste.trim() ? [geste.trim()] : [])
      }
    });
    return pas;
  }

  // ======================================================================================
  // 9 · LE PROGRAMME DES QUARANTE JOURS — forme de MAISON (wird.js), le tableau des
  // quarante (⚠️ pas JOURS, qui est le nombre 40). Mêmes familles, mêmes preuves que
  // le moteur, jour par jour, SAUF ces écarts, voulus et tenus par le test :
  //   · jours 11, 18, 25, 30, 31, 32 — le moteur y servait six défis de plus ; Nareva
  //     en a dix, pas seize : ce sont des exercices de TERRAIN (un vrai geste sur le
  //     site ou au bureau), prouvés par ce que le joueur écrit dans son journal ;
  //   · jour 6 — le panneau des rendez-vous n'est pas dans le périmètre : ce sont
  //     les cartes de site qui s'ouvrent ;
  //   · jour 38 — pas de Souk : on partage son savoir sur sa carte de collègue ;
  //   · libre, jour 13 — les huit pages sont déjà rallumées : « à jour des archives ».
  // Vingt minutes au plus chaque jour. Les jours 1 à 5 sont ceux de la démo.
  // ======================================================================================
  var LES_SIX = ["bawwab", "nour", "warraq", "yassine", "zhor", "omar"];
  var CINQ_LIGNES = { famille: "kitaba", titre: "Cinq lignes", minutes: 10, tuile: null, ouvrir: "wird",
    consigne: "Dans ton journal : ce que tu as appris cette semaine, en cinq lignes.", preuve: { type: "daftar" } };
  function aJour(consigne) {
    return { famille: "rihla", titre: "À jour des archives", minutes: 10, tuile: "S", ouvrir: null,
      consigne: consigne || "Rallume les pages qu'il te manque au coffre des archives.", preuve: { type: "aJour" } };
  }
  function salue(n) {
    return { famille: "liqa", titre: "Salue quelqu'un", minutes: 5, tuile: null, ouvrir: null, declarable: true,
      consigne: "Dans la cour : un salut rendu, une rencontre comptée. Sinon, dis un mot (T) — quelqu'un le lira.",
      preuve: { type: "rencontres", n: n } };
  }
  function copie(o) { return JSON.parse(JSON.stringify(o)); }

  var wird = [
    /* ---- Semaine 1 — Entrer ---- */
    { jour: 1, famille: "bab", titre: "Suis Ba Lahcen jusqu'au bout", minutes: 10, ouvrir: "tutoriel",
      consigne: "Ba Lahcen te fait visiter la maison, un pas après l'autre : les valeurs sur les murs, le coffre des archives, les rayonnages, ton carnet. Suis le fil d'or au sol, et laisse-toi guider.",
      preuve: { type: "tutoriel" } },
    { jour: 2, famille: "bab", titre: "Les sept murs de la cour", minutes: 8, tuile: "V",
      consigne: "Sept inscriptions sur les murs de la cour : les cinq valeurs de la maison, sa mission, sa vision. Approche-toi de chacune — Espace ou A. Puis parle à Ba Lahcen, à l'entrée, et à Kawtar.",
      preuve: [{ type: "khatt", n: 7 }, { type: "pnj", cles: ["bawwab", "nour"] }] },
    { jour: 3, famille: "bab", titre: "Les gens de la maison, et leurs mots", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Six personnes habitent la maison, et chacune a une chose vraie à t'apprendre. Parle à chacune. Puis va aux archives et ouvre le lexique de la maison : les mots d'ici, expliqués.",
      preuve: [{ type: "pnj", cles: LES_SIX.slice() }, { type: "moujam" }] },
    { jour: 4, famille: "rihla", titre: "L'eau, puis le vent", minutes: 15, tuile: "S",
      consigne: "Le coffre des archives garde une page par site. Rallume les trois premières : l'eau de 2009, puis deux parcs de 2013, l'un au sud, l'autre au nord. Le premier indice te dit où chercher.",
      preuve: { type: "pages", cles: ["sebt-el-guerdane", "foum-el-oued", "haouma"] } },
    { jour: 5, famille: "tahaddi", titre: "Un défi par famille", minutes: 20, tuile: "E", ouvrir: "etabli:droit-arret",
      consigne: "À l'établi de l'atelier métier, trois défis : « Le droit d'arrêter », « L'alarme qui s'efface », « Quand le vent est trop fort ». Sécurité, exploitation, culture technique — une fois chacun.",
      preuve: { type: "tahaddi", cles: ["droit-arret", "alarme", "vent-fort"] },
      libre: { famille: "rihla", titre: "Deux parcs du Sud", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Deux pages de plus au coffre des archives : les deux parcs réunis en un, et celui qui fut un jour le plus grand d'Afrique.",
        preuve: { type: "pages", cles: ["akhfennir", "tarfaya"] } } },
    { jour: 6, famille: "rihal", titre: "Ton premier quiz du jour", minutes: 8, tuile: "r", ouvrir: "imtihan",
      consigne: "Au pupitre de sécurité, dans les archives : le quiz du jour, cinq questions, vingt secondes chacune, seul. Puis ouvre tes cartes de site, au Menu : chaque page rallumée t'en a donné une.",
      preuve: [{ type: "imtihan", n: 1 }, { type: "cartes" }],
      libre: { famille: "bab", titre: "Tes cartes de site", minutes: 5, tuile: null, ouvrir: "cartes",
        consigne: "Ouvre tes cartes de site, au Menu : chaque page rallumée t'en a donné une. Les autres attendent, avec leur site et leur année.",
        preuve: { type: "cartes" } } },
    { jour: 7, famille: "kitaba", titre: "Cinq lignes", minutes: 10, ouvrir: "wird",
      consigne: "Dans ton journal, ici même : ce que tu as appris cette semaine, en cinq lignes. Personne ne le lit — tu le reliras au jour 40.",
      preuve: { type: "daftar" } },

    /* ---- Semaine 2 — La sécurité d'abord ---- */
    { jour: 8, famille: "qiraa", titre: "L'histoire de la maison", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Aux archives, lis l'histoire de la maison racontée par Ba Lahcen, de 2004 à aujourd'hui. Choisis l'année qui te surprend le plus, et retiens pourquoi.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "Aftissat et Safi", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Deux pages de plus au coffre des archives : le complexe qui a grandi par étapes, et la centrale qui tient le réseau.",
        preuve: { type: "pages", cles: ["aftissat", "safi"] } } },
    { jour: 9, famille: "tahaddi", titre: "Couper ne suffit pas", minutes: 15, tuile: "E", ouvrir: "etabli:consignation",
      consigne: "Avant l'établi : demande à un collègue de te montrer un cadenas et une étiquette de consignation, ou repère-les sur ton site. Puis réponds au défi « Couper ne suffit pas ».",
      preuve: { type: "tahaddi", cles: ["consignation"] },
      libre: { famille: "qiraa", titre: "Le lexique de la maison", minutes: 10, tuile: "B", ouvrir: "bibliotheque",
        consigne: "Aux archives, relis le lexique de la maison : les mots d'ici, et ce qu'ils veulent dire.",
        preuve: { type: "declare" } } },
    { jour: 10, famille: "rihla", titre: "Deux parcs du Sud", minutes: 10, tuile: "S",
      consigne: "Deux pages au coffre des archives : les deux parcs réunis en un, et celui qui fut un jour le plus grand d'Afrique.",
      preuve: { type: "pages", cles: ["akhfennir", "tarfaya"] },
      libre: { titre: "Dakhla", consigne: "La dernière page du coffre : là où le vent fait de l'eau douce.",
        preuve: { type: "pages", cles: ["dakhla"] } } },
    { jour: 11, famille: "tahaddi", titre: "Le point de rassemblement", minutes: 15, ouvrir: "wird",
      consigne: "Sur ton site ou à ton bureau, repère trois choses : le point de rassemblement, le numéro d'urgence affiché, la sortie la plus proche de l'endroit où tu travailles. Écris-les ici, dans ton journal.",
      preuve: { type: "daftar" },
      libre: salue(1) },
    { jour: 12, famille: "liqa", titre: "Salue quelqu'un", minutes: 5, declarable: true,
      consigne: "Dans la cour, si un collègue est là : approche-toi, fais le geste d'action. Il te rend ton salut, la maison compte la rencontre. Sinon, dis un mot (T).",
      preuve: { type: "rencontres", n: 1 } },
    { jour: 13, famille: "qiraa", titre: "Les huit codes", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Aux archives, lis les huit codes de la maison — comment on travaille ici. Choisis celui que tu appliqueras dès demain.",
      preuve: { type: "declare" },
      libre: aJour("Le coffre garde huit pages, une par site. Rallume celles qui te manquent.") },
    { jour: 14, famille: "tahaddi", titre: "Toujours relié", minutes: 20, tuile: "E", ouvrir: "etabli:hauteur",
      consigne: "À l'établi : le défi « Toujours relié », sur le travail en hauteur. Puis cinq lignes dans ton journal : ce que tu as appris de la sécurité cette semaine.",
      preuve: [{ type: "tahaddi", cles: ["hauteur"] }, { type: "daftar" }],
      libre: copie(CINQ_LIGNES) },

    /* ---- Semaine 3 — Le terrain ---- */
    { jour: 15, famille: "qiraa", titre: "Les métiers de la maison", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Aux archives, lis les six métiers de la maison, chacun raconté par un collègue. Note celui que tu connais le moins : c'est le prochain que tu iras voir.",
      preuve: { type: "declare" },
      libre: aJour() },
    { jour: 16, famille: "tahaddi", titre: "L'accident qui a eu de la chance", minutes: 15, tuile: "E", ouvrir: "etabli:presque-accident",
      consigne: "Avant l'établi : demande à un collègue comment on déclare un presque-accident dans ton équipe — à qui, et par quel moyen. Puis réponds au défi.",
      preuve: { type: "tahaddi", cles: ["presque-accident"] },
      libre: { famille: "qiraa", titre: "La carte des sites", minutes: 10, tuile: null, ouvrir: "kharita",
        consigne: "Ouvre la carte des sites : où tourne le vent de la maison, où l'eau se fabrique. Repère les huit sites des archives.",
        preuve: { type: "declare" } } },
    { jour: 17, famille: "rihla", titre: "Aftissat et Safi", minutes: 10, tuile: "S",
      consigne: "Deux pages au coffre des archives : le complexe qui a grandi par étapes, et la centrale qui tient le réseau.",
      preuve: { type: "pages", cles: ["aftissat", "safi"] },
      libre: { famille: "liqa", titre: "Une question à ton parrain", minutes: 5, tuile: null, ouvrir: null, declarable: true,
        consigne: "Écris à ton parrain d'intégration, ou à un collègue, par les messages : pose UNE question, même simple. Surtout simple.",
        preuve: { type: "declare" } } },
    { jour: 18, famille: "tahaddi", titre: "Les protections de ton métier", minutes: 15, ouvrir: "wird",
      consigne: "Demande à un collègue de ton équipe quels équipements de protection ton métier exige — sur le terrain comme au bureau — et à quoi sert chacun. Écris la liste ici, une raison par ligne.",
      preuve: { type: "daftar" },
      libre: aJour() },
    { jour: 19, famille: "liqa", titre: "Une question à ton parrain", minutes: 5, declarable: true,
      consigne: "Écris à ton parrain d'intégration, ou à un collègue, par les messages : pose UNE question, même simple. Surtout simple.",
      preuve: { type: "declare" } },
    { jour: 20, famille: "qiraa", titre: "Les rituels de la maison", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Aux archives, lis les quatre rituels de la maison : quand ils ont lieu, et à quoi ils servent. Puis va voir la salle de réunion, au sud de la cour.",
      preuve: { type: "declare" },
      libre: salue(2) },
    { jour: 21, famille: "tahaddi", titre: "De la mer à l'eau douce", minutes: 20, tuile: "E", ouvrir: "etabli:dessalement",
      consigne: "À l'établi : le défi « De la mer à l'eau douce », sur le dessalement. Puis cinq lignes dans ton journal : ce que tu as appris des sites cette semaine.",
      preuve: [{ type: "tahaddi", cles: ["dessalement"] }, { type: "daftar" }],
      libre: copie(CINQ_LIGNES) },

    /* ---- Semaine 4 — Apprendre des écarts ---- */
    { jour: 22, famille: "qiraa", titre: "Le lexique, en entier", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Aux archives, lis le lexique de la maison jusqu'au bout. Choisis trois mots que tu sauras expliquer à la personne qui arrivera après toi.",
      preuve: { type: "declare" },
      libre: aJour() },
    { jour: 23, famille: "tahaddi", titre: "Protéger d'abord", minutes: 15, tuile: "E", ouvrir: "etabli:gestes-urgence",
      consigne: "Avant l'établi : relis le numéro d'urgence noté au jour 11, et demande qui, dans ton équipe, est formé aux premiers secours. Puis réponds au défi.",
      preuve: { type: "tahaddi", cles: ["gestes-urgence"] },
      libre: salue(3) },
    { jour: 24, famille: "rihla", titre: "La dernière page", minutes: 10, tuile: "S",
      consigne: "La dernière page du coffre : là où le vent fait de l'eau douce. Après elle, les huit sites sont à toi.",
      preuve: { type: "pages", cles: ["dakhla"] },
      libre: { titre: "À jour des archives", consigne: "Rallume les pages qu'il te manque au coffre des archives.", preuve: { type: "aJour" } } },
    { jour: 25, famille: "tahaddi", titre: "Le papier et le terrain", minutes: 20, ouvrir: "wird",
      consigne: "Choisis une procédure de ton équipe et lis-la avec quelqu'un qui l'applique chaque jour. Où le terrain et le papier diffèrent-ils ? Écris-le ici — puis dis-le à celui qui tient la procédure.",
      preuve: { type: "daftar" },
      libre: { famille: "qiraa", titre: "Le lexique de la maison", minutes: 10, tuile: "B", ouvrir: "bibliotheque",
        consigne: "Aux archives, relis le lexique de la maison : un mot a peut-être été ajouté depuis ton arrivée.",
        preuve: { type: "declare" } } },
    { jour: 26, famille: "liqa", titre: "Ta carte de collègue", minutes: 10, declarable: true,
      consigne: "Remplis ta carte de collègue — ton métier, ton site, ce que tu cherches, ce que tu offres — pour que la maison te trouve. Et salue quelqu'un dans la cour.",
      preuve: { type: "rencontres", n: 3 } },
    { jour: 27, famille: "qiraa", titre: "Un site, une année", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Aux archives, relis l'histoire de la maison et retrouve l'année de chacune de tes cartes de site. Laquelle a changé le plus de choses, à ton avis ?",
      preuve: { type: "declare" },
      libre: aJour() },
    { jour: 28, famille: "tahaddi", titre: "Un rapport pour apprendre", minutes: 20, tuile: "E", ouvrir: "etabli:rapport-incident",
      consigne: "À l'établi : le défi « Un rapport pour apprendre ». Puis cinq lignes dans ton journal : un écart que tu as vu ce mois-ci, écrit comme un fait — sans nom.",
      preuve: [{ type: "tahaddi", cles: ["rapport-incident"] }, { type: "daftar" }],
      libre: copie(CINQ_LIGNES) },

    /* ---- Semaine 5 — Reprendre ce que les anciens savent ---- */
    { jour: 29, famille: "qiraa", titre: "Ce que la maison prépare", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Aux archives, lis la fin de l'histoire de la maison : ce qu'elle construit pour demain. Choisis le projet sur lequel tu aimerais un jour travailler.",
      preuve: { type: "declare" },
      libre: aJour() },
    { jour: 30, famille: "tahaddi", titre: "Ce que personne n'a écrit", minutes: 20, ouvrir: "wird",
      consigne: "Pose à un ancien la question que personne ne pose : « Qu'est-ce que tu sais ici, que personne n'a jamais écrit ? » Écoute, puis écris sa réponse ici, en cinq lignes. Tu viens de rallumer une lampe.",
      preuve: { type: "daftar" },
      libre: salue(4) },
    { jour: 31, famille: "tahaddi", titre: "Un site que tu ne connais pas", minutes: 20, ouvrir: "wird",
      consigne: "Choisis un site de la maison où tu n'as jamais mis les pieds. Trouve quelqu'un qui y a travaillé, et demande-lui ce qu'on n'y apprend que sur place. Écris-le ici.",
      preuve: { type: "daftar" },
      libre: aJour() },
    { jour: 32, famille: "tahaddi", titre: "Le geste que tu fais sans y penser", minutes: 20, ouvrir: "wird",
      consigne: "Écris, pas à pas, un geste de ton métier que tu fais déjà sans y penser — comme si tu l'expliquais à la personne qui arrivera après toi.",
      preuve: { type: "daftar" },
      libre: { famille: "qiraa", titre: "La carte des sites", minutes: 10, tuile: null, ouvrir: "kharita",
        consigne: "Rouvre la carte des sites : pour chacun des huit, dis à voix haute ce que tu en sais maintenant.",
        preuve: { type: "declare" } } },
    { jour: 33, famille: "liqa", titre: "Salue quelqu'un", minutes: 5, declarable: true,
      consigne: "Dans la cour : un salut rendu, une rencontre comptée. Quatre au moins depuis le début. Sinon, dis un mot.",
      preuve: { type: "rencontres", n: 4 } },
    { jour: 34, famille: "qiraa", titre: "Tes compétences", minutes: 15,
      consigne: "Ouvre tes compétences, au Menu : repère celles de ton métier, et ce qui prouve chacune. Choisis celle que tu feras attester en premier par ton manager.",
      preuve: { type: "declare" },
      libre: aJour() },
    { jour: 35, famille: "kitaba", titre: "Ce que tu apportes", minutes: 10, ouvrir: "wird",
      consigne: "Dans ton journal : UNE chose que tu apportes à la maison, en cinq lignes — ce que c'est, ce que ça règle, pour qui. Au jour 38, tu la mettras sur ta carte de collègue.",
      preuve: { type: "daftar" } },

    /* ---- Semaine 6 — Transmettre ---- */
    { jour: 36, famille: "qiraa", titre: "Ce que tu transmettras", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Aux archives, relis les huit codes et les quatre rituels. Choisis le code que tu voudrais transmettre en premier à la personne qui arrivera après toi.",
      preuve: { type: "declare" },
      libre: aJour() },
    { jour: 37, famille: "tahaddi", titre: "Cinq minutes qui comptent", minutes: 15, tuile: "E", ouvrir: "etabli:moment-securite",
      consigne: "Le dernier défi de l'établi : le moment sécurité. Avant de répondre, prépare en trois lignes le cas que tu pourrais y partager — un vrai, vécu ici.",
      preuve: { type: "tahaddi", cles: ["moment-securite"] },
      libre: salue(5) },
    { jour: 38, famille: "liqa", titre: "Partage ce que tu sais", minutes: 15, declarable: true,
      consigne: "Sur ta carte de collègue, à « J'offre », pose ce que tu as écrit au jour 35 : ce que tu apportes, et pour qui. Puis dis-le à un collègue, dans la cour ou par les messages.",
      preuve: { type: "declare" } },
    { jour: 39, famille: "liqa", titre: "Raconte un site", minutes: 5, ouvrir: "cartes", declarable: true,
      consigne: "À la réunion d'équipe, ou à ton parrain : raconte UN site que tu as rallumé, avec sa source. Et salue quelqu'un dans la cour — dix collègues rencontrés, c'est un beau Réseau.",
      preuve: { type: "rencontres", n: 5 } },
    { jour: 40, famille: "bilan", titre: "Tes quarante jours sont rendus", minutes: 10, ouvrir: "carnet",
      consigne: "Relis ton carnet — Lumière, Puissance, Réseau — et ton journal du jour 7. Ce que tu sais aujourd'hui, tu ne le savais pas il y a quarante jours. Le reste, c'est la maison qui le dira.",
      preuve: { type: "declare" } }
  ];

  // Le nom des familles, tel que la carte du jour l'écrit (forme de FAMILLES, wird.js :
  // mêmes clés) : sans elles, la carte dirait « Rihla », « Ta7addi »… au-dessus des
  // textes de Nareva. maison.js les pose sur wird.FAMILLES.
  var familles = {
    bab:     { nom: "L'entrée",        ar: "المدخل",       sous: "entrer" },
    rihla:   { nom: "Les archives",    ar: "الأرشيف",      sous: "rallumer une page" },
    tahaddi: { nom: "Défi de métier",  ar: "تحدّي المهنة",  sous: "faire, puis répondre" },
    rihal:   { nom: "Le quiz du jour", ar: "اختبار اليوم", sous: "être interrogé" },
    qiraa:   { nom: "Lecture",         ar: "القراءة",      sous: "lire" },
    liqa:    { nom: "Rencontre",       ar: "اللقاء",       sous: "rencontrer" },
    kitaba:  { nom: "Journal",         ar: "اليوميات",     sous: "écrire" },
    souk:    { nom: "Partager",        ar: "المشاركة",     sous: "montrer ce qu'on sait faire" },
    bilan:   { nom: "Bilan",           ar: "الحصيلة",      sous: "relire" }
  };

  // ======================================================================================
  // 10 · LES PALIERS ET LES NIVEAUX — les NOMS seulement : les seuils et les clés du
  // moteur ne bougent pas. maison.js (renommer) accepte une chaîne ou un objet partiel ;
  // ce sont des objets, pour que le sous-titre et l'arabe que le HUD affiche à côté du
  // nom (« Talib · طالب », « Le guide de la Zawia ») changent avec lui.
  // Les paliers, dans l'ordre décidé par Youssef le 24/09/2026. Le dernier n'a pas de
  // seuil dans le moteur : il ne se gagne pas, la maison le confie.
  // ======================================================================================
  var rangs = [
    { nom: "Nouvel arrivant", sous: "Celui qui arrive", ar: "وافد جديد" },
    { nom: "Équipier", sous: "Celui sur qui l'équipe compte", ar: "عضو الفريق" },
    { nom: "Pilier", sous: "Celui qui tient quand ça secoue", ar: "ركيزة" },
    { nom: "Référent", sous: "Celui qu'on vient consulter", ar: "مرجع" },
    { nom: "Mentor", sous: "Il ne se gagne pas : la maison le confie", ar: "موجّه" }
  ];
  var niveaux = {
    // la Puissance : le métier prouvé
    sna3a: [
      { nom: "Initié", sous: "Il apprend les gestes", ar: "مبتدئ" },
      { nom: "Autonome", sous: "Il travaille seul, en sécurité", ar: "مستقل" },
      { nom: "Confirmé", sous: "Il tient les cas difficiles", ar: "متمرّس" },
      { nom: "Expert", sous: "Il améliore la méthode", ar: "خبير" }
    ],
    // la Lumière : ce qu'on sait de la maison
    dhakira: [
      { nom: "Curieux", sous: "Il découvre la maison", ar: "فضولي" },
      { nom: "Au courant", sous: "Il connaît les sites", ar: "مطّلع" },
      { nom: "Connaisseur", sous: "Il connaît l'histoire et les codes", ar: "عارف" },
      { nom: "Passeur", sous: "Il peut raconter la maison", ar: "ناقل" }
    ]
  };

  // ======================================================================================
  // 11 · LES COMPÉTENCES (GPEC) — formes de DOMAINES et de MAHARAT (maharat.js).
  // Six domaines, quatre compétences chacun. Chaque compétence dit ce qui la PROUVE :
  // un livrable qu'un manager regarde, jamais une déclaration. `geste` et `niveau`
  // gardent les clés du moteur ; `silsila` marque une compétence de transmission.
  // ⚠️ Deux réglages du moteur ne vont pas avec ce référentiel (maharat.js) : bilan()
  //    lit en dur les domaines « socle » et « amana », et l'ijaza d'un domaine demande
  //    cinq compétences prouvées (SEUIL_IJAZA) quand un domaine en compte quatre.
  // ======================================================================================
  function m(cle, dom, geste, niveau, nom, ar, preuve, ar_preuve, extra) {
    var o = { cle: cle, dom: dom, geste: geste, niveau: niveau, nom: nom, ar: ar, preuve: preuve, ar_preuve: ar_preuve };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  var maharat = {
    domaines: [
      { cle: "exploitation-eolienne", nom: "Exploitation éolienne", ar: "استغلال المحطات الريحية" },
      { cle: "maintenance", nom: "Maintenance", ar: "الصيانة" },
      { cle: "securite-hse", nom: "Sécurité, santé, environnement (HSE)", ar: "السلامة والصحة والبيئة" },
      { cle: "eau-dessalement", nom: "Eau et dessalement", ar: "الماء وتحلية المياه" },
      { cle: "projets", nom: "Développement de projets", ar: "تطوير المشاريع" },
      { cle: "fonctions-support", nom: "Fonctions support", ar: "وظائف الدعم" }
    ],
    maharat: [
      // ── EXPLOITATION ÉOLIENNE ─────────────────────────────────────────────
      m("eolien-supervision", "exploitation-eolienne", "voir", "mbtadi",
        "Lire l'écran de supervision d'un parc et dire l'état de chaque machine",
        "أن تقرأ شاشة الإشراف على محطة ريحية وتصف حالة كل آلة",
        "Le relevé d'une journée de supervision : l'état de chaque turbine, les alarmes vues, ce qui a été signalé et à qui.",
        "حصيلة يوم من الإشراف: حالة كل توربين، والإنذارات المرصودة، وما تم التبليغ عنه ولمن."),
      m("eolien-alarmes", "exploitation-eolienne", "verifier", "sani3",
        "Trier les alarmes d'une turbine : ce qui s'efface, ce qui revient, ce qui annonce une panne",
        "أن تفرز إنذارات التوربين: ما يختفي، وما يعود، وما يُنذر بعطل",
        "Un mois d'alarmes classées, avec celles qui reviennent le plus et la suite donnée à chacune.",
        "شهر من الإنذارات مصنَّفة، مع الأكثر تكراراً وما اتُّخذ بشأن كل واحد منها."),
      m("eolien-vent", "exploitation-eolienne", "tenir", "sani3",
        "Préparer une journée d'intervention avec la prévision de vent et les limites de la procédure",
        "أن تُعدّ يوم تدخّل وفق توقعات الرياح وحدود المسطرة",
        "Un planning d'interventions ajusté à la prévision de vent, avec les créneaux écartés et la raison de chacun.",
        "برنامج تدخّلات مضبوط على توقعات الرياح، مع الفترات المستبعدة وسبب كل واحدة."),
      m("eolien-arrets", "exploitation-eolienne", "verifier", "hadeq",
        "Analyser les arrêts d'une machine et proposer ce qui les réduit",
        "أن تحلّل توقفات آلة وتقترح ما يقلّلها",
        "Une note d'une page sur une turbine : ses arrêts du trimestre, leurs causes, et une action proposée puis suivie.",
        "مذكرة من صفحة عن توربين: توقفاته خلال الفصل، وأسبابها، وإجراء مقترح ثم متابَع."),

      // ── MAINTENANCE ───────────────────────────────────────────────────────
      m("maintenance-consignation", "maintenance", "faire", "mbtadi",
        "Consigner un équipement avant d'intervenir : séparer, condamner, identifier, vérifier",
        "أن تعزل معدّة قبل التدخّل: الفصل، والإقفال، والتعريف، والتحقق",
        "Une consignation réalisée devant un référent, fiche remplie et signée, cadenas et étiquette en place.",
        "عزل مُنجَز أمام مرجع، بطاقة مملوءة وموقَّعة، والقفل والملصق في مكانهما."),
      m("maintenance-preventive", "maintenance", "tenir", "sani3",
        "Tenir un plan de maintenance préventive sans laisser glisser une échéance",
        "أن تلتزم بمخطط الصيانة الوقائية دون أن يتأخر أي موعد",
        "Trois mois de préventif à jour : chaque intervention faite et datée, chaque écart expliqué.",
        "ثلاثة أشهر من الصيانة الوقائية محيَّنة: كل تدخّل منجَز ومؤرَّخ، وكل فرق مشروح."),
      m("maintenance-cause", "maintenance", "verifier", "hadeq",
        "Remonter une panne récurrente jusqu'à sa cause première",
        "أن تتتبّع عطلاً متكرراً حتى سببه الأول",
        "L'analyse de cause d'une vraie panne, et l'action qui l'a fait cesser, vérifiée dans la durée.",
        "تحليل أسباب لعطل حقيقي، والإجراء الذي أوقفه، مع التحقق منه على المدى."),
      m("maintenance-transmettre", "maintenance", "dire", "hadeq",
        "Transmettre une intervention à un nouvel arrivant jusqu'à ce qu'il la fasse seul",
        "أن تنقل تدخّلاً إلى وافد جديد حتى يُنجزه وحده",
        "Un nouvel arrivant nommé qui réalise l'intervention devant toi, et la fiche de transmission signée par vous deux.",
        "وافد جديد مسمّى يُنجز التدخّل أمامك، وبطاقة النقل موقَّعة منكما معاً.", { silsila: true }),

      // ── SÉCURITÉ, SANTÉ, ENVIRONNEMENT ─────────────────────────────────────
      m("hse-presque-accident", "securite-hse", "dire", "mbtadi",
        "Déclarer un presque-accident de façon utile : les faits, le lieu, la cause probable, sans coupable",
        "أن تبلّغ عن حادث وشيك بطريقة مفيدة: الوقائع، والمكان، والسبب المحتمل، دون متّهَم",
        "Une déclaration réelle, écrite sans nom de coupable, que le service HSE a pu traiter jusqu'à une action.",
        "تبليغ حقيقي، مكتوب دون اسم متّهَم، استطاعت مصلحة السلامة معالجته حتى إجراء."),
      m("hse-risques", "securite-hse", "voir", "sani3",
        "Analyser les risques d'une intervention avant de commencer",
        "أن تحلّل مخاطر تدخّل قبل البدء",
        "Une analyse de risques remplie pour une vraie intervention, avec la mesure prise pour chaque risque.",
        "تحليل مخاطر مملوء لتدخّل حقيقي، مع الإجراء المتَّخذ لكل خطر."),
      m("hse-moment", "securite-hse", "dire", "hadeq",
        "Animer un moment sécurité à partir d'un cas vécu",
        "أن تنشّط لحظة سلامة انطلاقاً من حالة معيشة",
        "Un moment sécurité animé devant l'équipe sur un cas vécu, et le geste que chacun en a retenu.",
        "لحظة سلامة منشَّطة أمام الفريق حول حالة معيشة، والفعل الذي احتفظ به كل واحد.", { silsila: true }),
      m("hse-incident", "securite-hse", "verifier", "mtqen",
        "Mener l'analyse d'un incident jusqu'aux actions qui l'empêchent de revenir",
        "أن تقود تحليل حادث حتى الإجراءات التي تمنع تكراره",
        "Un rapport d'incident complet : faits datés, causes, actions avec un porteur et une date, et leur clôture vérifiée.",
        "تقرير حادث كامل: وقائع مؤرَّخة، وأسباب، وإجراءات لكل منها مسؤول وتاريخ، مع التحقق من إغلاقها."),

      // ── EAU ET DESSALEMENT ─────────────────────────────────────────────────
      m("eau-chemin", "eau-dessalement", "dire", "mbtadi",
        "Expliquer le chemin de l'eau d'un projet, de la ressource jusqu'à l'usager",
        "أن تشرح مسار الماء في مشروع، من المورد إلى المستعمل",
        "Un schéma d'une page, expliqué à un collègue qui ne connaît pas le site, et ses questions notées.",
        "رسم من صفحة واحدة، مشروح لزميل لا يعرف الموقع، مع تدوين أسئلته."),
      m("eau-qualite", "eau-dessalement", "verifier", "sani3",
        "Suivre la qualité d'une eau produite et signaler un écart à temps",
        "أن تتابع جودة الماء المنتَج وتبلّغ عن أي انحراف في الوقت المناسب",
        "Un mois de relevés de qualité, avec l'écart repéré, l'heure du signalement et la suite donnée.",
        "شهر من قياسات الجودة، مع الانحراف المرصود، وساعة التبليغ، وما تلاه."),
      m("eau-ligne", "eau-dessalement", "voir", "sani3",
        "Lire l'état d'une ligne de dessalement : pressions, débits, encrassement",
        "أن تقرأ حالة خط تحلية: الضغوط، والصبيب، والانسداد",
        "Le relevé commenté d'une ligne : les valeurs lues, ce qui dérive, et l'alerte donnée avant la panne.",
        "قراءة معلَّقة لخط تحلية: القيم المقروءة، وما ينحرف، والإنذار المُعطى قبل العطل."),
      m("eau-energie", "eau-dessalement", "tenir", "hadeq",
        "Tenir le lien entre l'énergie consommée et l'eau produite",
        "أن تضبط العلاقة بين الطاقة المستهلكة والماء المنتَج",
        "Un tableau mensuel de l'énergie consommée et de l'eau produite, tenu trois mois, avec les écarts expliqués.",
        "جدول شهري للطاقة المستهلكة والماء المنتَج، ممسوك ثلاثة أشهر، مع شرح الفروق."),

      // ── DÉVELOPPEMENT DE PROJETS ───────────────────────────────────────────
      m("projet-reunion", "projets", "dire", "mbtadi",
        "Conduire une réunion de chantier et en sortir des actions",
        "أن تسيّر اجتماع ورش وتخرج منه بإجراءات",
        "Un compte rendu envoyé le jour même : décisions, actions, porteurs, dates.",
        "محضر مُرسَل في اليوم نفسه: القرارات، والإجراءات، والمسؤولون، والتواريخ."),
      m("projet-planning", "projets", "tenir", "sani3",
        "Tenir un planning de chantier et dire tôt ce qui glisse",
        "أن تمسك جدول أشغال ورش وتعلن مبكراً عمّا يتأخر",
        "Un planning suivi sur trois mois, chaque glissement annoncé avant l'échéance, avec sa cause.",
        "جدول متابَع على ثلاثة أشهر، وكل تأخير مُعلَن قبل موعده، مع سببه."),
      m("projet-risques", "projets", "voir", "hadeq",
        "Tenir le registre des risques d'un projet",
        "أن تمسك سجلّ مخاطر مشروع",
        "Un registre des risques à jour : chaque risque avec son porteur, sa parade et sa date de revue.",
        "سجلّ مخاطر محيَّن: لكل خطر مسؤوله، وتدبيره، وتاريخ مراجعته."),
      m("projet-reception", "projets", "verifier", "mtqen",
        "Réceptionner un ouvrage : essais, réserves, levée des réserves",
        "أن تتسلّم منشأة: الاختبارات، والتحفظات، ورفع التحفظات",
        "Un procès-verbal de réception avec la liste des réserves et la date de levée de chacune.",
        "محضر تسلّم مع قائمة التحفظات وتاريخ رفع كل واحد منها."),

      // ── FONCTIONS SUPPORT ──────────────────────────────────────────────────
      m("support-procedure", "fonctions-support", "dire", "sani3",
        "Écrire une procédure qu'un collègue suit sans toi",
        "أن تكتب مسطرة يتبعها زميل دون حضورك",
        "Une procédure suivie de bout en bout par un collègue, sans appeler son auteur.",
        "مسطرة اتّبعها زميل من أولها إلى آخرها دون أن يتصل بكاتبها.", { silsila: true }),
      m("support-achat", "fonctions-support", "verifier", "sani3",
        "Préparer un achat conforme : le besoin écrit, les offres comparées, la décision motivée",
        "أن تُعدّ شراءً مطابقاً: الحاجة مكتوبة، والعروض مقارَنة، والقرار معلَّل",
        "Un dossier d'achat complet et relu : le besoin, les offres comparées, la décision et sa raison.",
        "ملف شراء كامل ومراجَع: الحاجة، والعروض المقارَنة، والقرار وسببه."),
      m("support-donnees", "fonctions-support", "tenir", "sani3",
        "Protéger les données personnelles d'un dossier, selon la loi 09-08",
        "أن تحمي المعطيات الشخصية في ملف، وفق القانون 09-08",
        "Un traitement décrit sur une fiche : ce qui est collecté, pourquoi, qui y accède, combien de temps.",
        "معالجة موصوفة في بطاقة: ما يُجمع، ولماذا، ومن يطّلع عليه، وإلى متى."),
      m("support-accueil", "fonctions-support", "faire", "hadeq",
        "Accueillir un nouvel arrivant et tenir ses premières semaines",
        "أن تستقبل وافداً جديداً وترافق أسابيعه الأولى",
        "Un parcours d'accueil tenu pour un nouvel arrivant nommé, et ce qu'il en dit à la fin.",
        "مسار استقبال مُنجَز لوافد جديد مسمّى، وما يقوله عنه في النهاية.", { silsila: true })
    ]
  };

  // ======================================================================================
  // 12 · LES COLLÈGUES DE DÉMONSTRATION — formes de DEMO_RASAIL et de DEMO_CARTES
  // (compte.js) : les voisins de l'annuaire et des messages en atelier. Les clés
  // internes « demo-yassine », « demo-nour », « demo-omar » restent (la logique de
  // l'atelier les nomme) ; les gens sont ceux de `metiers`, pour que la cour,
  // l'annuaire et les archives racontent les mêmes personnes :
  //   demo-yassine → Ghita (projets) : elle t'écrit, et répond ;
  //   demo-nour    → Kawtar (eau) : carte ouverte, elle ne répond pas — c'est elle qui
  //                  montre la règle des deux messages sans réponse ;
  //   demo-omar    → Reda (HSE) : carte fermée, la moitié que le jeu sait.
  // Ni téléphone ni e-mail, aucun lien (bitaqa.js).
  // ⚠️ interface.js pose aussi des voisins (C.atelier : Salma, Nadia, Karim) : un
  //    seul des deux jeux de gens doit rester.
  // ======================================================================================
  var collegues = {
    rasail: {
      "demo-yassine": { pseudo: "Ghita", avatar: { peau: 1, djellaba: 6, tete: "cheveux" },
        premier: "Marhba ! Moi, c'est Ghita, du développement de projets, au siège. Tu arrives dans quelle équipe ?",
        reponses: [
          "Bienvenue ! Si tu veux voir comment naît un projet, passe me voir au siège.",
          "Et pose toutes tes questions : ici, on apprend la maison en demandant.",
          "Bon courage pour tes quarante jours !"
        ] },
      "demo-nour": { pseudo: "Kawtar", avatar: { peau: 1, djellaba: 1, tete: "hijab" }, premier: null, reponses: [] }
    },
    cartes: {
      "demo-yassine": {
        joueur: { pseudo: "Ghita", avatar: { peau: 1, djellaba: 6, tete: "cheveux" }, rang: "m3ellem", tariqa: null, maydan: null,
          depuis: "2026-09-10T08:00:00Z", maharat: ["projet-reunion", "projet-planning", "projet-risques", "hse-risques"] },
        visible: true,
        carte: { ville: "Casablanca", metier: "Développement de projets, au siège",
          cherche: ["apprendre"], chercheMot: "Voir un parc en exploitation, de près : Tarfaya ou Akhfennir.",
          offre: ["mentorat", "relecture"], offreMot: "Je t'explique comment naît un projet, de la première étude au chantier.",
          langues: ["arabe", "francais", "anglais"], liens: [], maj: "2026-09-22T09:00:00Z" } },
      "demo-nour": {
        joueur: { pseudo: "Kawtar", avatar: { peau: 1, djellaba: 1, tete: "hijab" }, rang: "talib", tariqa: null, maydan: null,
          depuis: "2026-09-21T08:00:00Z", maharat: [] },
        visible: true,
        carte: { ville: "Dakhla", metier: "Ingénieure eau et dessalement, projet de Dakhla",
          cherche: ["mentor"], chercheMot: "Quelqu'un qui connaît l'exploitation d'un parc éolien.",
          offre: ["relecture"], offreMot: "Je relis tes notes techniques sur l'eau, en français ou en arabe.",
          langues: ["arabe", "francais", "anglais"], liens: [], maj: "2026-09-23T18:00:00Z" } },
      "demo-omar": {
        joueur: { pseudo: "Reda", avatar: { peau: 3, djellaba: 7, tete: "cheveux" }, rang: "mt3ellem", tariqa: null, maydan: null,
          depuis: "2026-08-10T08:00:00Z", maharat: ["hse-presque-accident", "hse-risques"] },
        visible: false, carte: null }
    }
  };

  // ======================================================================================
  // 13 · L'ÉCRAN D'ACCUEIL ET L'ATELIER DU PERSONNAGE — { avant, apres } : le texte
  // EXACT de la page (espaces normalisés, comme langue.js) → celui de Nareva.
  // maison.js en fait un dictionnaire « fr » : une clé vaut pour toute la page.
  // Ce qui s'y trouve : les écrans #ecran-porte et #ecran-atelier, l'en-tête et le
  // <title> qu'on voit en même temps, et les textes que jeu.js y écrit lui-même.
  // ⚠️ Un <p> qui ne contient qu'un lien est remplacé EN ENTIER par langue.js : le
  //    lien « Revoir l'intro » se réécrit donc en HTML, avec son id, sinon il meurt.
  // ⚠️ La signature « Mrehba · une création Ai4x » n'est pas ici : maison.js (surPage)
  //    la pose déjà au pied de l'écran d'accueil — la poser deux fois la doublerait.
  // ⚠️ interface.js (M.vocabulaire) est posé APRÈS ces paires : sur une même clé, c'est
  //    lui qui gagne. Les valeurs ci-dessous sont les mêmes que les siennes quand il y en a.
  // ======================================================================================
  var porte = [
    // le <title> de la page (à poser sur document.title : langue.js ne lit que le <body>)
    { avant: "Jami3at al Qarawiyine — le jeu de ZAW'IA", apres: "Au Courant — le jeu d'accueil de Nareva" },
    // l'en-tête
    { avant: "ZAW'IA", apres: "Nareva" },
    // le titre (dans l'en-tête et sur la Porte) : le texte, puis sa calligraphie
    { avant: "Jami3at al Qarawiyine", apres: "Au Courant" },
    { avant: "جامعة القرويين", apres: "على اطّلاع" },
    // la Porte
    { avant: "Le jeu", apres: "Le jeu d'accueil de Nareva" },
    { avant: "L'antre du savoir de Fès. On y entre Talib, avec une Arb3ine — quarante jours — pour les quatre premiers défis de la maison.",
      apres: "La maison de Nareva, en jeu. On y entre nouvel arrivant, avec quarante jours pour rallumer ce qui s'éteint : les valeurs, les sites, les gestes du métier, et les collègues qui les portent." },
    { avant: "Et une Rihla : neuf pages que Nsyan, l'oubli, a arrachées à l'histoire du Maroc. Une par ville, à retrouver avec l'IA pour compagnon — dire juste, voir juste, vérifier juste.",
      apres: "Quand un ancien part, un peu de ce qu'il savait s'éteint avec lui : on l'appelle le Blackout. Huit pages attendent aux archives, une par site — à rallumer une à une." },
    { avant: "Ce que tu entendras est une pièce composée pour la maison, qui tourne en boucle — avec la couleur de l'Āla, la musique arabo-andalouse du Maroc. Elle se fait plus discrète là où l'on lit, plus présente dans la cour ; le bouton ♪ la coupe.",
      apres: "La musique tourne en boucle : discrète là où l'on lit, plus présente dans la cour. Le bouton ♪ la coupe." },
    { avant: "Trois carnets se remplissent ici : le M39ol, ce que tu donnes à la maison — il vient des autres et lui seul fait ton rang ; la Sna3a, ce que tu sais faire ; la Dhakira, ce que tu sais de ton pays.",
      apres: "Trois compteurs se remplissent ici, et aucun ne se change en l'autre : la Lumière, ce que tu sais de la maison ; la Puissance, ce que tu prouves de ton métier ; le Réseau, ce que les autres te reconnaissent — lui seul fait ton palier." },
    { avant: "La maison reconnaît les siens à l'entrée — leur Chajara. Les autres entrent sur dossier accepté, ou parrainés par un membre de la maison. Le sandouq, la bibliothèque et le Souk leur sont ouverts, et c'est au Souk qu'on se fait voir.",
      apres: "La maison reconnaît les siens à l'entrée : l'adresse de travail que la RH a inscrite suffit. Ba Lahcen t'attend juste derrière la porte, et ton parrain d'intégration n'est jamais loin." },
    { avant: "Pas de parrainage, pas de jeu.", apres: "Réservé aux équipes de Nareva." },
    { avant: "Mode atelier — les comptes et ton personnage vivent dans ce navigateur, rien ne part sur le réseau.",
      apres: "Démo — ton compte et ton personnage vivent dans ce navigateur : rien ne part sur le réseau." },
    // la porte fermée (le titre est aussi écrit par jeu.js, parrainage.FERMEE)
    { avant: "Pas de parrainage, pas de jeu", apres: "Cette porte est réservée aux équipes de Nareva" },
    { avant: "Ce compte n'a pas encore d'admission. Tu es de la maison, ou ton dossier est accepté sur zawia.tech ? Donne ton adresse ci-dessous : elle sera reconnue — sors, puis entre à nouveau. Sinon, un membre de la maison peut te parrainer.",
      apres: "Ce compte n'est pas encore reconnu. Tu fais partie de la maison ? Donne ton adresse de travail ci-dessous : elle sera reconnue — sors, puis entre à nouveau. Sinon, demande à ton contact RH de t'inscrire." },
    { avant: "Et en attendant, entre quand même : on reçoit un invité trois jours sans rien lui demander.",
      apres: "En attendant, tu peux entrer en visiteur : trois jours, sans compte." },
    // l'entrée du visiteur (si la maison la garde)
    { avant: "Tu ne fais que passer ?", apres: "Tu viens découvrir la maison ?" },
    { avant: "Entre quand même. Chez nous, on reçoit un invité trois jours sans rien lui demander : ni son nom, ni ce qu'il vient chercher. Pas de compte, pas d'adresse e-mail.",
      apres: "Entre quand même : un visiteur est reçu trois jours sans qu'on lui demande rien — ni son nom, ni ce qu'il vient chercher. Pas de compte, pas d'adresse e-mail." },
    // le lien d'entrée
    { avant: "Je suis de la maison, ou mon dossier est accepté", apres: "Je fais partie de la maison" },
    { avant: "Donne ton adresse : celle de ton inscription à la plateforme de formation de la maison, ou celle de ton dossier accepté sur zawia.tech. Ton lien d'entrée part dans ta boîte.",
      apres: "Donne ton adresse de travail, celle que la RH a inscrite. Ton lien d'entrée part dans ta boîte." },
    { avant: "Ni l'un ni l'autre ? Dépose ton dossier sur zawia.tech.", apres: "Pas encore inscrit ? Demande-le à ton contact RH." },
    // la légende de l'onglet « S'inscrire » (écrite par jeu.js : parrainage.REGLE + la suite)
    { avant: "On entre ici par un lien reçu dans sa boîte : tu es de la maison, ton dossier est accepté sur zawia.tech, ou un membre de la maison te parraine. Première fois : un e-mail, un mot de passe de 8 caractères au moins. Ton Arb3ine commence quand ton personnage entre.",
      apres: "On entre ici avec son adresse de travail, celle que la RH a inscrite. Première fois : un e-mail, un mot de passe de 8 caractères au moins. Tes quarante jours commencent quand ton personnage entre." },
    // les deux dernières lignes de la Porte
    { avant: "Le premier rang est Talib — celui qui cherche. Les cinq rangs de la maison.",
      apres: "Le premier palier est Nouvel arrivant — celui qui arrive. Les suivants se reçoivent des collègues." },
    { avant: "Revoir l'intro — le voyage dans le temps", apres: "<a id=\"zj-intro-revoir\" href=\"#\">Revoir le film d'ouverture</a>" },
    // l'atelier du personnage
    { avant: "Pseudo — le nom qu'on verra dans la cour", apres: "Ton prénom — celui que tes collègues verront" },
    { avant: "Entrer dans la Qarawiyine", apres: "Entrer dans la maison" }
  ];

  // ======================================================================================
  // 14 · LA CULTURE — l'axe central du jeu (décision de Youssef, 24/09/2026).
  // Quatre tableaux de { cle, titre, texte } — texte : deux à quatre phrases.
  // ⚠️⚠️ À recaler sur le livret d'accueil de Nareva, qu'on reçoit le 25/09.
  // Les archives les montrent pliées (maison.js, rayonsCulture) sous un titre composé :
  // « année · titre » pour l'histoire, « titre · quand » pour les rituels,
  // « prénom — titre · site » pour les métiers.
  // ======================================================================================

  // L'HISTOIRE — racontée par Ba Lahcen, avec `annee`. UNIQUEMENT les dates et les
  // faits publiés sur nareva.ma : la frise « Notre histoire » (/a-propos-nous/), les
  // pages /nos-projets/, /nos-metiers/, /nos-filiales/ et l'accueil. Le seul trait
  // de fiction : Ba Lahcen lui-même, entré en 2004.
  var histoire = [
    { cle: "fondation", annee: "2004", titre: "La maison est née",
      texte: "En 2004, la maison est née — et moi, j'y suis entré la même année. Énergéticien marocain, filiale d'Al Mada, elle s'est donné une mission : contribuer activement à la transition énergétique et à la mobilisation des ressources hydriques du Maroc." },
    { cle: "sebt-el-guerdane", annee: "2009", titre: "L'eau avant le vent",
      texte: "Le premier chantier que j'ai vu finir n'était pas une éolienne : c'était l'eau. Lancé en 2005 avec le Ministère de l'Agriculture, Sebt El Guerdane entre en service en 2009 : un ouvrage de 384 km amène l'eau du barrage d'Aoulouz jusqu'à 10 600 hectares d'agrumes. On le dit premier partenariat public-privé au monde dans l'irrigation." },
    { cle: "premier-vent", annee: "2013", titre: "Le vent se lève",
      texte: "En 2013, le vent s'est levé pour de bon : Akhfennir 1 en juillet, Foum El Oued en septembre, Haouma en décembre. Ce sont parmi les premiers parcs de la loi 13-09, qui permet à un opérateur privé de vendre directement son électricité renouvelable aux industriels." },
    { cle: "tarfaya", annee: "2014", titre: "Le géant de Tarfaya",
      texte: "En 2014, Tarfaya entre en service : 300 MW, le plus grand parc éolien d'Afrique à ce moment-là. Il produit environ 1 100 GWh d'électricité verte par an. Un investissement de 600 millions de dollars, et environ 800 000 tonnes de CO₂ évitées chaque année." },
    { cle: "akhfennir-2", annee: "2016", titre: "Les jumeaux",
      texte: "En juin 2016, Akhfennir 2 rejoint Akhfennir 1 : le complexe atteint 200 MW, avec 117 turbines. Deux parcs, un seul souffle." },
    { cle: "safi-aftissat", annee: "2018", titre: "La centrale et le premier Aftissat",
      texte: "En 2018, la centrale thermique de Safi entre en service : 1 386 MW, environ 20 % de la demande électrique du pays, et la seule centrale d'Afrique à utiliser la technologie ultra-supercritique. La même année, dans la région de Boujdour, Aftissat 1 apporte ses 200 MW." },
    { cle: "midelt", annee: "2020", titre: "Midelt",
      texte: "En 2020, le parc de Midelt entre en service : 180 MW. Il fait partie, avec Boujdour et Essaouira, du projet éolien intégré de la maison." },
    { cle: "boujdour", annee: "2023", titre: "Deux parcs la même année",
      texte: "En 2023, deux parcs d'un coup, tous deux dans la région de Boujdour : Aftissat 2 et ses 200 MW, et le parc de Boujdour, 300 MW. Ce dernier représente à lui seul un investissement de 400 millions de dollars." },
    { cle: "jbel-lahdid", annee: "2024", titre: "Jbel Lahdid",
      texte: "En 2024, le parc de Jbel Lahdid, à Essaouira, ajoute 270 MW. Le projet éolien intégré compte désormais 750 MW en exploitation." },
    { cle: "dakhla-vent", annee: "2025", titre: "Le vent pour l'eau",
      texte: "En 2025, à Dakhla, un parc éolien de 60 MW entre en service, dédié à l'unité de dessalement. Ici, le vent servira à faire de l'eau." },
    { cle: "aujourd-hui", annee: "2026", titre: "Aujourd'hui",
      texte: "En 2026, Aftissat 3 et 4 portent le complexe à 550 MW : le second plus grand parc éolien d'Afrique. À Dakhla, l'unité de dessalement — 37 millions de m³ par an — rejoint la frise. Aujourd'hui, la maison compte 3 431 MW installés et plus de 16 TWh produits par an : c'est le premier producteur indépendant d'électricité du Royaume." },
    { cle: "demain-energie", annee: "Demain", titre: "L'énergie",
      texte: "Demain se prépare déjà. À Tahaddart, des centrales à cycle combiné au gaz porteront le site à environ 1 800 MW ; à Midelt, le solaire de Noor Midelt 2 et 3 réunira 800 MW et 1 200 MWh de batteries, pour une mise en service prévue fin 2027. À Casablanca, un projet valorisera plus de 1,4 million de tonnes de déchets par an. Et un nouveau parc de 300 MW, Boujdour 2, rejoindra les autres." },
    { cle: "demain-eau", annee: "Demain", titre: "L'eau et l'hydrogène",
      texte: "Pour l'eau, de nouvelles unités de dessalement sont en développement à Nador, Tanger, Guelmim, Tan-Tan et Souss-Massa : 900 millions de m³ par an au total. Et pour l'hydrogène vert, la maison est le seul développeur marocain sélectionné dans l'Offre H2 Maroc." }
  ];

  // LES CODES — comment on travaille ici. Des pratiques crédibles pour un
  // énergéticien, écrites pour le jeu : ce ne sont PAS les règles officielles de Nareva.
  var codes = [
    { cle: "securite-avant-vitesse", titre: "La sécurité avant la vitesse",
      texte: "Un travail en retard se rattrape ; un accident, jamais. Quand le planning presse, c'est le moment de relire la procédure une fois de plus. Prendre le temps de bien faire n'est pas un retard." },
    { cle: "dire-quand-on-ne-sait-pas", titre: "On dit quand on ne sait pas",
      texte: "« Je ne sais pas » est une réponse de professionnel. Ce qui est dangereux, c'est une supposition présentée comme une certitude. On dit ce qu'on ne sait pas, puis on va chercher qui sait." },
    { cle: "arreter-le-danger", titre: "On arrête un travail dangereux",
      texte: "Si tu vois un danger, tu fais arrêter le travail, calmement, et tu dis ce que tu as vu. Un arrêt pour rien coûte quelques minutes ; un silence peut coûter bien plus. Le nouvel arrivant peut le faire comme les autres : il voit souvent ce que l'habitude ne voit plus." },
    { cle: "declarer", titre: "Ce qui a failli arriver se déclare",
      texte: "Un presque-accident, c'est un accident qui a eu de la chance. Le déclarer n'accuse personne : c'est donner à la maison l'occasion de corriger avant qu'il y ait un blessé." },
    { cle: "jamais-seul", titre: "Personne n'est seul face au risque",
      texte: "En hauteur, dans une armoire électrique, sur un site isolé : on travaille à deux, et chacun sait comment prévenir les secours. C'est pareil pour les doutes : on ne les garde pas pour soi." },
    { cle: "transmettre", titre: "On transmet ce qu'on sait",
      texte: "Ce qu'un ancien sait et n'a jamais dit s'éteint le jour où il part. Alors on montre, on explique, on laisse l'autre refaire devant soi. Celui qui transmet ne perd rien : il rallume une lampe." },
    { cle: "ecrire", titre: "Ce qui compte s'écrit",
      texte: "Un geste appris sur le terrain tient en deux lignes dans une procédure. Un document que personne ne relit finit par mentir : quand le terrain change, on corrige le papier." },
    { cle: "voisins", titre: "Un site a des voisins",
      texte: "Autour de chaque parc, de chaque centrale, de chaque ouvrage d'eau, des gens vivent et travaillent. On les respecte, on les écoute, et on se souvient que l'électricité et l'eau qu'on produit sont aussi pour eux." }
  ];

  // LES RITUELS — avec `quand`. Le moment sécurité se présente : ce n'est pas une
  // preuve de présence, aucun compteur ne le lit.
  var rituels = [
    { cle: "moment-securite", quand: "En ouverture de semaine", titre: "Le moment sécurité du lundi",
      texte: "Quelques minutes pour parler d'un risque de la semaine, d'un geste, d'un presque-accident. Court, concret, et sans chercher de coupable. Chacun peut y apporter un cas vécu — le nouvel arrivant aussi." },
    { cle: "reunion-equipe", quand: "Chaque semaine", titre: "La réunion d'équipe",
      texte: "On y dit où on en est, ce qui bloque et qui peut aider. On en sort avec des actions, chacune avec un nom et une date. La question qu'on n'ose pas poser en réunion, on la pose juste après — mais on la pose." },
    { cle: "accueil-nouveau", quand: "Le premier jour, puis les quarante suivants", titre: "L'accueil d'un nouveau",
      texte: "Le premier jour, un nouveau reçoit l'accueil sécurité de son site et rencontre son équipe et son parrain d'intégration. Pendant ses quarante jours, on lui montre, on l'écoute, on le laisse refaire. Chacun de nous a été nouveau." },
    { cle: "retour-experience", quand: "Après chaque incident ou presque-accident", titre: "Le retour d'expérience",
      texte: "On raconte ce qui s'est passé, dans l'ordre, sans adjectifs ni coupable. On cherche les causes — elles sont souvent plusieurs — et on décide ce qui change. Puis on le partage : ce qu'un site apprend, toute la maison le sait." }
  ];

  // LES MÉTIERS — six métiers, chacun porté par un collègue de fiction (`prenom`,
  // `site`) qui dit ce qu'il fait et ce qu'il aimerait qu'un nouveau sache.
  // ⚠️ L'ORDRE COMPTE : maison.js pose metiers[i] sur le figurant cfg.pnjMetiers[i]
  //    (nour, warraq, yassine, zhor, omar — dans maison.js de Nareva), et le visage
  //    du figurant ne change pas. Kawtar prend la jeune femme du vestibule, Mbarek
  //    l'ancien à la barbe blanche, Anas le jeune qui tourne autour du cœur d'énergie,
  //    Touria la dame sous la galerie, Reda celui qui vient de finir ses quarante
  //    jours. Ghita, sixième, n'a pas de place dans la cour : c'est elle qui écrit
  //    aux nouveaux (collegues).
  // `site` se lit après une virgule : « Marhba ! Moi c'est Kawtar, projet de Dakhla. »
  var metiers = [
    { cle: "eau-dessalement", titre: "Eau et dessalement", prenom: "Kawtar", site: "projet de Dakhla",
      texte: "Je travaille sur l'unité qui fera de l'eau douce avec l'électricité du vent, pour l'irrigation et l'eau potable de la région. Ce que j'aimerais qu'un nouveau sache : chaque mètre cube demande de l'énergie, et l'eau ne se gaspille jamais." },
    { cle: "maintenance", titre: "Maintenance", prenom: "Mbarek", site: "parc éolien d'Akhfennir",
      texte: "Je répare et j'entretiens les machines, du pied de la tour jusqu'à la nacelle. Ce que j'aimerais qu'un nouveau sache : on consigne toujours, même pour cinq minutes, même quand on est pressé." },
    { cle: "exploitation-eolienne", titre: "Exploitation éolienne", prenom: "Anas", site: "parc éolien de Tarfaya",
      texte: "Je surveille les turbines depuis l'écran de supervision, et je décide quand on intervient, selon le vent et les alarmes. Ce que j'aimerais qu'un nouveau sache : une alarme qui s'efface n'est pas une alarme réglée." },
    { cle: "fonctions-support", titre: "Fonctions support", prenom: "Touria", site: "siège de Casablanca",
      texte: "Aux ressources humaines, j'accueille les nouveaux et je veille à ce que personne ne reste seul avec une question. Ce que j'aimerais qu'un nouveau sache : il n'y a pas de question bête — demande, c'est comme ça qu'on apprend la maison." },
    { cle: "hse", titre: "Sécurité, santé, environnement (HSE)", prenom: "Reda", site: "centrale thermique de Safi",
      texte: "J'aide chaque équipe à voir les risques avant qu'ils ne blessent quelqu'un, et à apprendre de chaque presque-accident. Ce que j'aimerais qu'un nouveau sache : déclarer ce qui a failli arriver n'accuse personne, ça protège tout le monde." },
    { cle: "projets", titre: "Développement de projets", prenom: "Ghita", site: "siège de Casablanca",
      texte: "J'accompagne un projet de sa première étude jusqu'à sa construction : le terrain, les partenaires, le planning, les risques. Ce que j'aimerais qu'un nouveau sache : un retard annoncé tôt se rattrape, un retard caché, jamais." }
  ];

  // ======================================================================================
  // 15 · LE QUIZ DU JOUR — la banque des questions (cinq tirées chaque jour, au
  // pupitre de sécurité) : { cle, theme, question, options[4], bonne, explication },
  // `theme` ∈ securite · culture · sites · metier, cinq questions chacun.
  // Culture et sites : UNIQUEMENT des faits de nareva.ma (valeurs, dates, sites).
  // Sécurité et métier : des principes généraux et justes, sans chiffre douteux.
  // ======================================================================================
  var quiz = [
    // ── culture ─────────────────────────────────────────────────────────────
    { cle: "culture-naissance", theme: "culture",
      question: "En quelle année la maison est-elle née ?",
      options: ["2013", "2018", "2004", "2009"], bonne: 2,
      explication: "La maison est née en 2004 : c'est la première date de sa frise « Notre histoire ». Sebt El Guerdane suit en 2009, puis les premiers parcs éoliens en 2013." },
    { cle: "culture-intrus", theme: "culture",
      question: "Laquelle de ces valeurs n'est PAS une des cinq valeurs de la maison ?",
      options: ["Audace", "Respect", "Esprit d’équipe", "Rapidité"], bonne: 3,
      explication: "Les cinq valeurs sont l'Audace, l'Innovation, l'Esprit d’équipe, la Responsabilité et le Respect. La rapidité n'en fait pas partie : ici, la sécurité passe avant la vitesse." },
    { cle: "culture-respect", theme: "culture",
      question: "Quelle phrase accompagne la valeur Respect ?",
      options: [
        "Entreprendre avec confiance et vision éclairée des enjeux",
        "Écoute, éthique et considération dans toutes nos interactions",
        "Créer des solutions adaptées aux besoins de demain",
        "Valeur partagée et solutions durables pour l’avenir"
      ], bonne: 1,
      explication: "« Écoute, éthique et considération dans toutes nos interactions » : c'est la phrase du Respect. Les trois autres sont celles de l'Audace, de l'Innovation et de la Responsabilité." },
    { cle: "culture-mission", theme: "culture",
      question: "Que dit la mission de la maison ?",
      options: [
        "Construire le plus d'éoliennes possible, où que ce soit",
        "Produire l'électricité la moins chère, quel qu'en soit le prix pour l'environnement",
        "Contribuer activement à la transition énergétique et à la mobilisation des ressources hydriques du Maroc",
        "Remplacer toutes les centrales du pays"
      ], bonne: 2,
      explication: "La mission de la maison : contribuer activement à la transition énergétique et à la mobilisation des ressources hydriques du Maroc. L'électricité et l'eau, ensemble." },
    { cle: "culture-vision", theme: "culture",
      question: "Quelle est la vision de la maison ?",
      options: [
        "Leader africain dans la production d’électricité et le cycle de l’eau",
        "Leader mondial des panneaux solaires",
        "Premier distributeur d'eau potable d'Europe",
        "Premier constructeur d'éoliennes d'Afrique"
      ], bonne: 0,
      explication: "La vision : « Leader africain dans la production d’électricité et le cycle de l’eau ». Elle est écrite sur la page d'accueil de nareva.ma — et sur un mur de la cour." },

    // ── sites ───────────────────────────────────────────────────────────────
    { cle: "sites-tarfaya", theme: "sites",
      question: "Lors de sa mise en service en 2014, quel parc de la maison était le plus grand parc éolien d'Afrique ?",
      options: ["Haouma", "Foum El Oued", "Midelt", "Tarfaya"], bonne: 3,
      explication: "Tarfaya, 300 MW, mis en exploitation en 2014, était alors le plus grand parc éolien d'Afrique. Il produit environ 1 100 GWh d'électricité verte par an." },
    { cle: "sites-aftissat", theme: "sites",
      question: "Quel complexe de la maison est le second plus grand parc éolien d'Afrique, avec 550 MW ?",
      options: ["Aftissat", "Akhfennir", "Jbel Lahdid", "Haouma"], bonne: 0,
      explication: "Aftissat, dans la région de Boujdour, a grandi en quatre phases jusqu'à 550 MW : c'est le second plus grand parc éolien d'Afrique." },
    { cle: "sites-safi", theme: "sites",
      question: "Qu'est-ce qui rend la centrale de Safi unique en Afrique ?",
      options: [
        "Elle tourne au vent",
        "Elle dessale l'eau de mer",
        "C'est la seule centrale d'Afrique à utiliser la technologie ultra-supercritique",
        "C'est la toute première installation de la maison"
      ], bonne: 2,
      explication: "La centrale de Safi, 1 386 MW, mise en service en 2018, est la seule d'Afrique à utiliser la technologie ultra-supercritique. Elle couvre environ 20 % de la demande électrique nationale." },
    { cle: "sites-dakhla", theme: "sites",
      question: "À Dakhla, qu'est-ce qui alimente l'unité de dessalement ?",
      options: ["La centrale de Safi", "Un parc éolien dédié de 60 MW", "Des groupes électrogènes", "Un barrage"], bonne: 1,
      explication: "À Dakhla, un parc éolien dédié de 60 MW alimente l'unité de dessalement : la première à grande échelle au monde alimentée exclusivement par de l'électricité renouvelable." },
    { cle: "sites-sebt", theme: "sites",
      question: "Selon la frise « Notre histoire », quel est le premier projet de la maison après sa fondation ?",
      options: ["Sebt El Guerdane, en 2009", "Tarfaya, en 2014", "Safi, en 2018", "Aftissat, en 2018"], bonne: 0,
      explication: "Sebt El Guerdane, en 2009 : un projet d'irrigation, premier partenariat public-privé au monde dans ce domaine. La maison a commencé par l'eau, avant le vent." },

    // ── sécurité ────────────────────────────────────────────────────────────
    { cle: "securite-consigner", theme: "securite",
      question: "Avant d'intervenir sur une installation électrique, que veut dire « consigner » ?",
      options: [
        "Noter l'intervention dans un registre",
        "Couper le disjoncteur, et c'est tout",
        "Prévenir son chef par téléphone",
        "Séparer la source d'énergie, la condamner, identifier l'équipement et vérifier l'absence de tension"
      ], bonne: 3,
      explication: "Consigner, c'est une suite de gestes : séparer la source, la condamner avec son cadenas et son étiquette, identifier le bon équipement, vérifier soi-même l'absence de tension. Couper ne suffit pas." },
    { cle: "securite-hauteur", theme: "securite",
      question: "Dans le mât d'une éolienne, quelle règle ne se discute jamais ?",
      options: [
        "Rester relié à l'antichute à chaque instant, et ne jamais monter seul",
        "Monter vite pour passer moins de temps en hauteur",
        "Décrocher sa longe pour doubler un collègue",
        "Garder le harnais dans son sac jusqu'à la nacelle"
      ], bonne: 0,
      explication: "En hauteur, on reste relié à chaque instant, on ne monte jamais seul, et on connaît le plan de secours avant de monter." },
    { cle: "securite-presque", theme: "securite",
      question: "Qu'est-ce qu'un presque-accident ?",
      options: [
        "Un accident sans importance, qu'on oublie",
        "Une faute qu'on reproche à quelqu'un",
        "Un événement qui aurait pu blesser et ne l'a pas fait : on le déclare pour en corriger la cause",
        "Un accident arrivé sur un autre site"
      ], bonne: 2,
      explication: "Un presque-accident est un accident qui a eu de la chance. On le déclare sans chercher de coupable : c'est ce qui évite le suivant." },
    { cle: "securite-arret", theme: "securite",
      question: "Tu es nouveau, et tu vois un collègue sur le point de se mettre en danger. Que fais-tu ?",
      options: [
        "Rien : tu es nouveau, les anciens savent ce qu'ils font",
        "Tu fais arrêter le travail, calmement, et tu dis ce que tu as vu",
        "Tu en parles plus tard, à la pause",
        "Tu prends une photo pour avoir une preuve"
      ], bonne: 1,
      explication: "Arrêter un travail dangereux, c'est le droit — et le devoir — de chacun, nouveau compris. Un arrêt pour rien coûte quelques minutes ; un silence peut coûter bien plus." },
    { cle: "securite-urgence", theme: "securite",
      question: "Face à un collègue inconscient, dans quel ordre agit-on ?",
      options: [
        "Secourir, puis alerter, puis protéger",
        "Alerter, puis attendre sans rien faire",
        "Déplacer la victime, puis appeler",
        "Protéger, alerter, puis secourir"
      ], bonne: 3,
      explication: "Protéger, alerter, secourir : d'abord supprimer le danger pour ne pas faire une deuxième victime, puis alerter selon la consigne du site, puis faire les gestes qu'on a appris." },

    // ── métier ──────────────────────────────────────────────────────────────
    { cle: "metier-puissance", theme: "metier",
      question: "Quelle différence entre un mégawatt (MW) et un gigawattheure (GWh) ?",
      options: [
        "Le MW dit la puissance d'une installation ; le GWh, l'énergie produite dans le temps",
        "Ce sont deux façons d'écrire la même chose",
        "Le MW mesure l'eau, le GWh l'électricité",
        "Le GWh est la puissance d'une seule turbine"
      ], bonne: 0,
      explication: "Le mégawatt dit ce qu'une installation peut fournir à un instant ; le gigawattheure, l'énergie qu'elle produit dans la durée. Tarfaya : 300 MW de puissance, environ 1 100 GWh par an." },
    { cle: "metier-drapeau", theme: "metier",
      question: "Que veut dire « pales en drapeau » ?",
      options: [
        "Des pales peintes aux couleurs du pays",
        "Des pales cassées, à remplacer",
        "Des pales qui tournent à pleine vitesse",
        "Des pales orientées pour ne plus prendre le vent : l'éolienne se met en sécurité"
      ], bonne: 3,
      explication: "« En drapeau », les pales ne prennent plus le vent : par grand vent, l'éolienne se met ainsi en sécurité et s'arrête. Ce n'est pas une panne, c'est un réflexe." },
    { cle: "metier-osmose", theme: "metier",
      question: "Dans le dessalement par osmose inverse, que retiennent les membranes ?",
      options: ["L'eau douce", "L'essentiel du sel", "L'air dissous", "La chaleur"], bonne: 1,
      explication: "Sous forte pression, l'eau de mer traverse des membranes très fines : l'eau passe, l'essentiel du sel reste. C'est pour cela que le dessalement demande de l'énergie." },
    { cle: "metier-alarme", theme: "metier",
      question: "Une alarme apparaît puis disparaît seule sur l'écran de supervision. Que fais-tu ?",
      options: [
        "Tu la notes, et tu regardes si elle revient",
        "Rien : elle a disparu",
        "Tu la masques",
        "Tu éteins l'écran"
      ], bonne: 0,
      explication: "Une alarme qui s'efface n'est pas une alarme réglée. On la note, on regarde si elle revient et sur quelle machine : c'est la répétition qui annonce la panne." },
    { cle: "metier-rapport", theme: "metier",
      question: "Qu'est-ce qui rend un rapport d'incident utile ?",
      options: [
        "Le nom du coupable",
        "Le moins de détails possible",
        "Des faits datés, les causes, et des actions avec un porteur et une date",
        "L'avis de chacun sur les personnes"
      ], bonne: 2,
      explication: "Un rapport d'incident sert à apprendre, pas à punir : des faits dans l'ordre, les causes — souvent plusieurs —, et des actions qui ont un nom et une date." }
  ];

  return {
    valeurs: valeurs,
    blackout: blackout, relie: relie,
    prologue: prologue, epilogue: epilogue,
    sites: sites,
    pages: pages,
    tahaddi: tahaddi, voies: voies,
    pnj: pnj,
    tutoriel: { ECHAUFFEMENT: ECHAUFFEMENT, etapes: etapes },
    wird: wird, familles: familles,
    rangs: rangs, niveaux: niveaux,
    maharat: maharat,
    collegues: collegues,
    porte: porte,
    histoire: histoire, codes: codes, rituels: rituels, metiers: metiers,
    quiz: quiz
  };
});
