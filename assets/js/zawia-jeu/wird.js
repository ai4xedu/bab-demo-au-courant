// ZAW'IA — le jeu · LE WIRD : un défi par jour, quarante jours (pur : ni DOM, ni horloge).
//
// v3.6 — « pour un nouveau joueur, il n'y a aucune visibilité des choses à
// faire » (Youssef, 15/09/2026). Les salles existaient, rien ne les nommait
// comme des choses À FAIRE. Le Wird (الورد) — à la Qarawiyine, la portion
// qu'on lit chaque jour, ni plus ni moins — est la réponse : UN défi par jour
// de l'Arb3ine, quarante en tout, vingt minutes au plus, fait UNIQUEMENT de
// ce que le jeu sait déjà faire. Aucune mécanique nouvelle, aucun point
// nouveau : des cases sur des gestes existants.
//
// Six règles, tenues par les tests :
//  1. le Wird est indexé sur le JOUR de l'Arb3ine (1 à 40), jamais sur le
//     calendrier : deux joueurs au jour 12 ont le même Wird ;
//  2. vingt minutes au plus, écrites sur chacun (MAX_MINUTES) ;
//  3. il ne donne AUCUN point — un Ta7addi donne sa Sna3a, une page sa
//     Dhakira, par le geste lui-même ; le Wird compte des JOURS TENUS ;
//  4. la veille se rattrape (RATTRAPAGE) : un jour manqué reste manqué, il
//     n'efface rien — la maison n'est pas une machine à sous ;
//  5. il ne montre jamais une porte fermée à la lignée : le Talib 7orr a son
//     propre calendrier (`libre`), sans établi, sans rihal, sans cours ;
//  6. aucun lien, aucun nom : le voile.
//
// Ce module ne DÉCIDE rien sur l'état : il reçoit ce que pages.js et
// tahaddi.js ont calculé (ctx.pages, ctx.tahaddi) et ce que jeu.js a posé
// dans joueur.recit.wird (recit.js le garde). Il rend ce qui est tenu, ce qui
// manque, et le prochain pas.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.wird = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var JOURS = 40;
  var MAX_MINUTES = 20;      // la règle de Youssef : « le défi peut ne pas dépasser 20 minutes »
  var RATTRAPAGE = 1;        // la veille se rattrape ; l'avant-veille est manquée
  var DAFTAR_MAX = 600;      // une entrée du daftar, en caractères

  var FAMILLES = {
    bab:     { nom: "Bab",      ar: "الباب",   sous: "entrer" },
    rihla:   { nom: "Rihla",    ar: "الرحلة",  sous: "retrouver une page" },
    tahaddi: { nom: "Ta7addi",  ar: "التحدي",  sous: "faire, puis répondre" },
    rihal:   { nom: "Rihal",    ar: "الرحل",   sous: "être interrogé" },
    qiraa:   { nom: "Qira'a",   ar: "القراءة", sous: "lire une leçon" },
    liqa:    { nom: "Liqa'",    ar: "اللقاء",  sous: "rencontrer" },
    kitaba:  { nom: "Kitaba",   ar: "الكتابة", sous: "écrire" },
    souk:    { nom: "Souk",     ar: "السوق",   sous: "étaler" },
    bilan:   { nom: "Bilan",    ar: "الحصيلة", sous: "relire" }
  };

  // ---- Les preuves ----------------------------------------------------------------------
  // Une preuve est ce que le jeu SAIT vérifier ; `declare` est le bouton
  // « C'est fait », pour ce que le jeu ne voit pas (une leçon lue, une
  // question posée au cercle). `declarable: true` sur un Wird ajoute le
  // bouton à une preuve automatique qui peut ne pas se produire (le Sahn
  // vide un soir de Liqa').
  //   tutoriel                 recit.tutoriel.fini
  //   khatt {n}                n khatt lus (recit.wird.khatt)
  //   pnj {cles}               chacun de ces gens a parlé (recit.wird.pnj)
  //   moujam | riwaq | cartes  la salle a été ouverte (drapeau)
  //   pages {cles}             chacune de ces pages est retrouvée
  //   aJour                    toutes les pages OUVERTES sont retrouvées
  //   tahaddi {cles}           chacun de ces Ta7addi est réussi
  //   imtihan {n}              n bonnes réponses au rihal (joueur.imtihan)
  //   rencontres {n}           n rencontres au Sahn (joueur.rencontres, la base)
  //   souk                     un étal posé (drapeau, posé par le Souk)
  //   daftar                   l'entrée du daftar de CE jour n'est pas vide
  //   declare                  le bouton seulement
  var LES_SIX = ["bawwab", "nour", "warraq", "yassine", "zhor", "omar"];

  // ---- Le calendrier des gens de la maison --------------------------------------------
  // `ouvrir` est ce que jeu.js ouvre au bouton « M'y mener » ; `tuile` la
  // case où mène le fil d'or (le BFS du tutoriel). L'un, l'autre, ou aucun.
  var MAISON = [
    /* ---- Semaine 1 — Entrer ---- */
    { jour: 1, famille: "bab", titre: "Suis le mou'allim jusqu'au bout", minutes: 10, ouvrir: "tutoriel",
      consigne: "Sept pas, un par geste. Il te montre le khatt, le sandouq, le tableau, la bibliothèque, ton carnet — puis le Souk, où tu poses ton tapis. Laisse-toi mener.",
      preuve: { type: "tutoriel" } },
    { jour: 2, famille: "bab", titre: "Les sept khatt du Sahn", minutes: 8, tuile: "V",
      consigne: "Sept calligraphies sur les murs du Sahn, sept valeurs de la maison. Approche-toi de chacune — Espace ou A. Puis parle à Ba Driss, à la porte, et à Nour.",
      preuve: [{ type: "khatt", n: 7 }, { type: "pnj", cles: ["bawwab", "nour"] }] },
    { jour: 3, famille: "bab", titre: "Les gens de la cour, et Al-Moujam", minutes: 15, ouvrir: "bibliotheque",
      consigne: "Six personnes habitent la maison. Parle à chacune. Puis va aux rayonnages de la Khizana et lis Al-Moujam : les mots d'ici, expliqués.",
      preuve: [{ type: "pnj", cles: LES_SIX }, { type: "moujam" }] },
    { jour: 4, famille: "rihla", titre: "Fès, deux fois, et Meknès", minutes: 15, tuile: "S",
      consigne: "Le sandouq de la Khizana tient les pages que Nsyan a arrachées. Retrouve les deux de Fès et celle de Meknès — avec l'IA pour compagnon, le premier indice te dit comment.",
      preuve: { type: "pages", cles: ["fes-fondatrice", "fes-seconde-soeur", "meknes-porte"] } },
    { jour: 5, famille: "tahaddi", titre: "Un Ta7addi par voie", minutes: 20, tuile: "E", ouvrir: "etabli:format-oublie",
      consigne: "À l'établi de la Madrasa : « Le format qu'on oublie », « Le cadrage avant le style », « La citation trop belle ». Dire juste, voir juste, vérifier juste — une fois chacun.",
      preuve: { type: "tahaddi", cles: ["format-oublie", "cadrage", "citation-trop-belle"] },
      libre: { famille: "rihla", titre: "Rabat et Casablanca", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Deux pages de plus au sandouq : la tour qui s'est arrêtée, et la ville aux trois noms.",
        preuve: { type: "pages", cles: ["rabat-tour", "casablanca-nom"] } } },
    { jour: 6, famille: "rihal", titre: "Tes cinq premières questions", minutes: 8, tuile: "r", ouvrir: "imtihan",
      consigne: "Au rihal de la Khizana : cinq questions, vingt secondes chacune, seul. Puis ouvre le Riwaq, au menu, et note le mercredi de la maison.",
      preuve: [{ type: "imtihan", n: 1 }, { type: "riwaq" }],
      libre: { famille: "bab", titre: "Le Riwaq, et ton mercredi", minutes: 5, tuile: null, ouvrir: "riwaq",
        consigne: "Ouvre le Riwaq, au menu : c'est là que la maison annonce ses rencontres. Note le prochain mercredi.",
        preuve: { type: "riwaq" } } },
    { jour: 7, famille: "kitaba", titre: "Cinq lignes", minutes: 10, ouvrir: "wird",
      consigne: "Dans ton daftar, ici même : ce que tu as appris cette semaine, en cinq lignes. Personne ne le lit — tu le reliras au jour 40.",
      preuve: { type: "daftar" } },

    /* ---- Semaine 2 — Dire juste ---- */
    { jour: 8, famille: "qiraa", titre: "La première leçon", minutes: 20, ouvrir: "bibliotheque",
      consigne: "Sur les rayons de la Khizana, la maison a posé son cours. Lis la première leçon, en entier. Vingt minutes, pas plus — le reste demain.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "Marrakech et Agadir", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Deux pages de plus au sandouq : les trois sœurs, et la ville qui a recommencé.",
        preuve: { type: "pages", cles: ["marrakech-soeurs", "agadir-nuit"] } } },
    { jour: 9, famille: "tahaddi", titre: "Un résumé, pour qui ?", minutes: 15, tuile: "E", ouvrir: "etabli:resume-pour-qui",
      consigne: "Avant l'établi : prends un long e-mail ou un article, et demande un résumé « pour quelqu'un qui doit décider quelque chose ». Puis réponds au Ta7addi.",
      preuve: { type: "tahaddi", cles: ["resume-pour-qui"] },
      libre: { famille: "qiraa", titre: "Les rayons ouverts", minutes: 10, tuile: "B", ouvrir: "bibliotheque",
        consigne: "Les rayonnages de la Khizana montrent ce qui est ouvert à tous. Lis-le.",
        preuve: { type: "declare" } } },
    { jour: 10, famille: "rihla", titre: "Casablanca et Oujda", minutes: 10, tuile: "S",
      consigne: "Deux pages de la voie « dire juste » : la ville aux trois noms, et la musique venue d'Andalousie.",
      preuve: { type: "pages", cles: ["casablanca-nom", "oujda-musique"] },
      libre: { titre: "Dakhla et Oujda", consigne: "Deux pages de plus : la ligne du soleil debout, et la musique venue d'Andalousie.",
        preuve: { type: "pages", cles: ["dakhla-ligne", "oujda-musique"] } } },
    { jour: 11, famille: "tahaddi", titre: "Le même texte, trois lecteurs", minutes: 20, tuile: "E", ouvrir: "etabli:trois-lecteurs",
      consigne: "Un exercice de quinze minutes avec une IA, puis le Ta7addi qui le vérifie. L'énoncé de l'établi te dit quoi faire.",
      preuve: { type: "tahaddi", cles: ["trois-lecteurs"] },
      libre: { famille: "liqa", titre: "Salue quelqu'un", minutes: 5, tuile: null, ouvrir: null, declarable: true,
        consigne: "Au Sahn, si un autre joueur est là : approche-toi, fais le geste d'action. Sinon, dis un mot (T) — quelqu'un le lira.",
        preuve: { type: "rencontres", n: 1 } } },
    { jour: 12, famille: "liqa", titre: "Salue quelqu'un", minutes: 5, declarable: true,
      consigne: "Au Sahn, si un autre joueur est là : approche-toi, fais le geste d'action. Il te rend le salam, la maison compte la rencontre. Sinon, dis un mot (T).",
      preuve: { type: "rencontres", n: 1 } },
    { jour: 13, famille: "qiraa", titre: "La leçon suivante", minutes: 20, ouvrir: "bibliotheque",
      consigne: "La deuxième leçon du cours, sur les rayons de la Khizana. En entier, vingt minutes.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "Le voyageur", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "La dernière page fondatrice : celui dont Nsyan a mangé la Rihla. Après elle, les dix sont à toi.",
        preuve: { type: "pages", cles: ["tanger-voyageur"] } } },
    { jour: 14, famille: "tahaddi", titre: "Un exemple vaut dix consignes", minutes: 20, tuile: "E", ouvrir: "etabli:un-exemple",
      consigne: "Avant l'établi : donne à une IA deux textes que TU as écrits, et demande le troisième dans le même esprit. Puis le Ta7addi, puis cinq lignes dans ton daftar.",
      preuve: [{ type: "tahaddi", cles: ["un-exemple"] }, { type: "daftar" }],
      libre: { famille: "kitaba", titre: "Cinq lignes", minutes: 10, tuile: null, ouvrir: "wird",
        consigne: "Dans ton daftar : ce que tu as appris cette semaine, en cinq lignes.",
        preuve: { type: "daftar" } } },

    /* ---- Semaine 3 — Voir juste ---- */
    { jour: 15, famille: "qiraa", titre: "La leçon suivante", minutes: 20, ouvrir: "bibliotheque",
      consigne: "La troisième leçon du cours, sur les rayons de la Khizana. Vingt minutes.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "À jour du sandouq", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Une page nouvelle s'ouvre chaque jeudi. Retrouve celles qui sont ouvertes et que tu n'as pas encore.",
        preuve: { type: "aJour" } } },
    { jour: 16, famille: "tahaddi", titre: "Ce que l'image invente", minutes: 15, tuile: "E", ouvrir: "etabli:ce-que-limage-invente",
      consigne: "Avant l'établi : fais générer une devanture de boutique avec une enseigne en arabe, et lis l'enseigne lettre par lettre. Puis le Ta7addi.",
      preuve: { type: "tahaddi", cles: ["ce-que-limage-invente"] },
      libre: { famille: "qiraa", titre: "Le catalogue", minutes: 10, tuile: "B", ouvrir: "bibliotheque",
        consigne: "Le troisième rayon de la Khizana dit ce que la maison propose. Lis-le, on entre de son pas.",
        preuve: { type: "declare" } } },
    { jour: 17, famille: "rihla", titre: "Marrakech et Rabat", minutes: 10, tuile: "S",
      consigne: "Deux pages : les trois sœurs, et la tour qui s'est arrêtée.",
      preuve: { type: "pages", cles: ["marrakech-soeurs", "rabat-tour"] },
      libre: { famille: "liqa", titre: "Une question au cercle", minutes: 5, tuile: null, ouvrir: "bibliotheque", declarable: true,
        consigne: "La Twiza a son cercle — la ligne est sur les rayons de la Khizana. Entre, et pose UNE question, même bête. Surtout bête.",
        preuve: { type: "declare" } } },
    { jour: 18, famille: "tahaddi", titre: "La porte vraie et la porte inventée", minutes: 20, tuile: "E", ouvrir: "etabli:porte-inventee",
      consigne: "Un exercice de quinze minutes avec un modèle d'image, puis le Ta7addi. L'énoncé de l'établi te dit quoi faire.",
      preuve: { type: "tahaddi", cles: ["porte-inventee"] },
      libre: { famille: "rihla", titre: "À jour du sandouq", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Retrouve les pages ouvertes qu'il te manque.",
        preuve: { type: "aJour" } } },
    { jour: 19, famille: "liqa", titre: "Une question au cercle", minutes: 5, ouvrir: "bibliotheque", declarable: true,
      consigne: "La Twiza a son cercle — la ligne est sur les rayons de la Khizana. Entre, et pose UNE question, même bête. Surtout bête.",
      preuve: { type: "declare" } },
    { jour: 20, famille: "qiraa", titre: "La leçon suivante", minutes: 20, ouvrir: "bibliotheque",
      consigne: "La quatrième leçon du cours, sur les rayons de la Khizana. Vingt minutes.",
      preuve: { type: "declare" },
      libre: { famille: "liqa", titre: "Salue quelqu'un", minutes: 5, tuile: null, ouvrir: null, declarable: true,
        consigne: "Au Sahn : un salut rendu, une rencontre comptée. Sinon, dis un mot.",
        preuve: { type: "rencontres", n: 2 } } },
    { jour: 21, famille: "tahaddi", titre: "Le même personnage, deux fois", minutes: 20, tuile: "E", ouvrir: "etabli:meme-personnage",
      consigne: "Avant l'établi : écris la fiche d'un personnage — âge, visage, vêtement, couleurs — et fais-le générer deux fois. Puis le Ta7addi, puis cinq lignes.",
      preuve: [{ type: "tahaddi", cles: ["meme-personnage"] }, { type: "daftar" }],
      libre: { famille: "kitaba", titre: "Cinq lignes", minutes: 10, tuile: null, ouvrir: "wird",
        consigne: "Dans ton daftar : ce que tu as appris cette semaine.",
        preuve: { type: "daftar" } } },

    /* ---- Semaine 4 — Vérifier juste ---- */
    { jour: 22, famille: "qiraa", titre: "La leçon suivante", minutes: 20, ouvrir: "bibliotheque",
      consigne: "La cinquième leçon du cours, sur les rayons de la Khizana. Vingt minutes.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "À jour du sandouq", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Retrouve les pages ouvertes qu'il te manque.",
        preuve: { type: "aJour" } } },
    { jour: 23, famille: "tahaddi", titre: "Une date sans source", minutes: 15, tuile: "E", ouvrir: "etabli:date-sans-source",
      consigne: "Avant l'établi : demande une date historique à une IA, puis ouvre une source qui la confirme — ou pas. Puis le Ta7addi.",
      preuve: { type: "tahaddi", cles: ["date-sans-source"] },
      libre: { famille: "liqa", titre: "Salue quelqu'un", minutes: 5, tuile: null, ouvrir: null, declarable: true,
        consigne: "Au Sahn : un salut rendu, une rencontre comptée. Sinon, dis un mot.",
        preuve: { type: "rencontres", n: 3 } } },
    { jour: 24, famille: "rihla", titre: "Agadir, Dakhla, Tanger", minutes: 15, tuile: "S",
      consigne: "Les trois dernières pages fondatrices : la ville qui a recommencé, la ligne du soleil debout, le voyageur. Après elles, les dix sont à toi.",
      preuve: { type: "pages", cles: ["agadir-nuit", "dakhla-ligne", "tanger-voyageur"] },
      libre: { titre: "À jour du sandouq", consigne: "Retrouve les pages ouvertes qu'il te manque.", preuve: { type: "aJour" } } },
    { jour: 25, famille: "tahaddi", titre: "Cinq faits, deux faux", minutes: 20, tuile: "E", ouvrir: "etabli:cinq-faits",
      consigne: "Un exercice de quinze minutes — cinq faits sur ta ville, vérifiés un par un — puis le Ta7addi. L'énoncé de l'établi te dit quoi faire.",
      preuve: { type: "tahaddi", cles: ["cinq-faits"] },
      libre: { famille: "qiraa", titre: "Les rayons ouverts", minutes: 10, tuile: "B", ouvrir: "bibliotheque",
        consigne: "Un rayon bouge : la maison pose des choses. Relis ce qui est ouvert à tous.",
        preuve: { type: "declare" } } },
    { jour: 26, famille: "liqa", titre: "Présente-toi au cercle", minutes: 5, ouvrir: "bibliotheque", declarable: true,
      consigne: "Si ce n'est pas fait : au cercle de la Twiza, dis qui tu es en trois lignes — ce que tu fais, ce que tu cherches. Et salue quelqu'un au Sahn.",
      preuve: { type: "rencontres", n: 3 } },
    { jour: 27, famille: "qiraa", titre: "La leçon suivante", minutes: 20, ouvrir: "bibliotheque",
      consigne: "La sixième leçon du cours, sur les rayons de la Khizana. Vingt minutes.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "À jour du sandouq", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Retrouve les pages ouvertes qu'il te manque.",
        preuve: { type: "aJour" } } },
    { jour: 28, famille: "tahaddi", titre: "Le document était là, la réponse est fausse", minutes: 20, tuile: "E", ouvrir: "etabli:rag-faux",
      consigne: "Avant l'établi : donne un document à une IA et pose une question dont la réponse y est. Regarde ce qu'elle retrouve — ou pas. Puis le Ta7addi, puis cinq lignes.",
      preuve: [{ type: "tahaddi", cles: ["rag-faux"] }, { type: "daftar" }],
      libre: { famille: "kitaba", titre: "Cinq lignes", minutes: 10, tuile: null, ouvrir: "wird",
        consigne: "Dans ton daftar : ce que tu as appris cette semaine.",
        preuve: { type: "daftar" } } },

    /* ---- Semaine 5 — Faire ---- */
    { jour: 29, famille: "qiraa", titre: "La leçon suivante", minutes: 20, ouvrir: "bibliotheque",
      consigne: "La septième leçon du cours, sur les rayons de la Khizana. Vingt minutes.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "À jour du sandouq", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Retrouve les pages ouvertes qu'il te manque.",
        preuve: { type: "aJour" } } },
    { jour: 30, famille: "tahaddi", titre: "La deuxième demande", minutes: 20, tuile: "E", ouvrir: "etabli:deuxieme-demande",
      consigne: "Un exercice de quinze minutes — corriger une IA au lieu de recommencer — puis le Ta7addi. L'énoncé de l'établi te dit quoi faire.",
      preuve: { type: "tahaddi", cles: ["deuxieme-demande"] },
      libre: { famille: "liqa", titre: "Salue quelqu'un", minutes: 5, tuile: null, ouvrir: null, declarable: true,
        consigne: "Au Sahn : un salut rendu, une rencontre comptée. Sinon, dis un mot.",
        preuve: { type: "rencontres", n: 4 } } },
    { jour: 31, famille: "tahaddi", titre: "Décrire avant de demander", minutes: 20, tuile: "E", ouvrir: "etabli:decrire-avant",
      consigne: "Un exercice de quinze minutes avec un modèle d'image, puis le Ta7addi. L'énoncé de l'établi te dit quoi faire.",
      preuve: { type: "tahaddi", cles: ["decrire-avant"] },
      libre: { famille: "rihla", titre: "À jour du sandouq", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Retrouve les pages ouvertes qu'il te manque.",
        preuve: { type: "aJour" } } },
    { jour: 32, famille: "tahaddi", titre: "La source qu'on peut ouvrir", minutes: 20, tuile: "E", ouvrir: "etabli:source-ouverte",
      consigne: "Un exercice de quinze minutes — exiger les sources, les ouvrir toutes — puis le Ta7addi. L'énoncé de l'établi te dit quoi faire.",
      preuve: { type: "tahaddi", cles: ["source-ouverte"] },
      libre: { famille: "qiraa", titre: "Le catalogue", minutes: 10, tuile: "B", ouvrir: "bibliotheque",
        consigne: "Relis le catalogue : ce que la maison propose a peut-être bougé.",
        preuve: { type: "declare" } } },
    { jour: 33, famille: "liqa", titre: "Salue quelqu'un", minutes: 5, declarable: true,
      consigne: "Au Sahn : un salut rendu, une rencontre comptée. Quatre au moins depuis le début. Sinon, dis un mot.",
      preuve: { type: "rencontres", n: 4 } },
    { jour: 34, famille: "qiraa", titre: "La leçon suivante", minutes: 20, ouvrir: "bibliotheque",
      consigne: "La huitième leçon du cours, sur les rayons de la Khizana. Vingt minutes.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "À jour du sandouq", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Retrouve les pages ouvertes qu'il te manque.",
        preuve: { type: "aJour" } } },
    { jour: 35, famille: "kitaba", titre: "Ce que tu vas poser au Souk", minutes: 10, ouvrir: "wird",
      consigne: "Dans ton daftar : UN projet, une chose que tu as faite avec l'IA, en cinq lignes — son nom, ce que ça règle, à qui. C'est ce que tu étaleras au jour 38.",
      preuve: { type: "daftar" } },

    /* ---- Semaine 6 — Donner ---- */
    { jour: 36, famille: "qiraa", titre: "Les leçons qui restent", minutes: 20, ouvrir: "bibliotheque",
      consigne: "Finis le cours : ce qui reste sur les rayons. C'est l'un des quatre défis de l'Arb3ine — la maison le valide, pas le jeu.",
      preuve: { type: "declare" },
      libre: { famille: "rihla", titre: "À jour du sandouq", minutes: 10, tuile: "S", ouvrir: null,
        consigne: "Retrouve les pages ouvertes qu'il te manque.",
        preuve: { type: "aJour" } } },
    { jour: 37, famille: "tahaddi", titre: "Ce qui sort de la maison", minutes: 15, tuile: "E", ouvrir: "etabli:ce-qui-sort",
      consigne: "Le dixième Ta7addi de la maison : un dossier client, une IA, et la seule question qui compte. Avant l'établi, relis ce que tu confies à une IA dans une journée.",
      preuve: { type: "tahaddi", cles: ["ce-qui-sort"] },
      libre: { famille: "liqa", titre: "Salue quelqu'un", minutes: 5, tuile: null, ouvrir: null, declarable: true,
        consigne: "Au Sahn : un salut rendu, une rencontre comptée. Sinon, dis un mot.",
        preuve: { type: "rencontres", n: 5 } } },
    { jour: 38, famille: "souk", titre: "Pose ta ferracha", minutes: 15, tuile: "G", ouvrir: "souk", declarable: true,
      consigne: "Dehors des murs, au Souk : étale ce que tu as écrit au jour 35 — son nom, ce que ça règle, un lien. C'est ton savoir partagé, le quatrième défi de l'Arb3ine.",
      preuve: { type: "souk" } },
    { jour: 39, famille: "liqa", titre: "Raconte une page", minutes: 5, ouvrir: "cartes", declarable: true,
      consigne: "À la halqa ou au cercle : raconte UNE page que tu as retrouvée, avec sa source. Et salue quelqu'un au Sahn — la dixième rencontre valide le défi.",
      preuve: { type: "rencontres", n: 5 } },
    { jour: 40, famille: "bilan", titre: "L'Arb3ine est rendue", minutes: 10, ouvrir: "carnet",
      consigne: "Relis ton carnet — les trois axes — et ton daftar du jour 7. Ce que tu sais aujourd'hui, tu ne le savais pas il y a quarante jours. Le reste, c'est la maison qui le dit.",
      preuve: { type: "declare" } }
  ];

  // ---- Résolution par lignée ------------------------------------------------------------
  function resoudre(w, maison) {
    var base = {
      jour: w.jour, famille: w.famille, titre: w.titre, consigne: w.consigne, minutes: w.minutes,
      tuile: w.tuile || null, ouvrir: w.ouvrir || null, declarable: !!w.declarable, preuve: w.preuve
    };
    if (maison || !w.libre) return base;
    var l = w.libre;
    return {
      jour: w.jour,
      famille: l.famille || w.famille, titre: l.titre || w.titre, consigne: l.consigne || w.consigne,
      minutes: typeof l.minutes === "number" ? l.minutes : w.minutes,
      tuile: "tuile" in l ? l.tuile : (w.tuile || null),
      ouvrir: "ouvrir" in l ? l.ouvrir : (w.ouvrir || null),
      declarable: "declarable" in l ? !!l.declarable : !!w.declarable,
      preuve: l.preuve || w.preuve
    };
  }
  function liste(maison) { return MAISON.map(function (w) { return resoudre(w, maison !== false); }); }
  function wird(jour, maison) {
    var n = Number(jour);
    if (!Number.isInteger(n) || n < 1 || n > JOURS) return null;
    return resoudre(MAISON[n - 1], maison !== false);
  }
  function famille(cle) { return FAMILLES[cle] || null; }

  // ---- L'état posé par jeu.js dans recit.wird ------------------------------------------
  // recit.js le garde (normaliserRecit) ; ici on le lit, avec les mêmes défauts.
  function etatVide() { return { khatt: [], pnj: [], moujam: false, riwaq: false, cartes: false, souk: false, tenus: {}, daftar: {} }; }
  function lireEtat(recit) {
    var e = etatVide();
    var w = recit && recit.wird;
    if (!w || typeof w !== "object") return e;
    if (Array.isArray(w.khatt)) e.khatt = w.khatt.filter(function (k) { return Number.isInteger(k) && k >= 0; });
    if (Array.isArray(w.pnj)) e.pnj = w.pnj.filter(function (k) { return typeof k === "string" && k; });
    ["moujam", "riwaq", "cartes", "souk"].forEach(function (k) { e[k] = w[k] === true; });
    if (w.tenus && typeof w.tenus === "object") Object.keys(w.tenus).forEach(function (k) { if (typeof w.tenus[k] === "string" && w.tenus[k]) e.tenus[k] = w.tenus[k]; });
    if (w.daftar && typeof w.daftar === "object") Object.keys(w.daftar).forEach(function (k) { if (typeof w.daftar[k] === "string" && w.daftar[k].trim()) e.daftar[k] = w.daftar[k]; });
    return e;
  }

  // ---- Une preuve, face à l'état -----------------------------------------------------------
  // ctx : { recit, joueur: { imtihan, rencontres }, pages: P.etat(...), tahaddi: Th.etat(...) }
  function retrouvee(ctxPages, cle) {
    var l = ctxPages && ctxPages.liste;
    if (!l) return false;
    for (var i = 0; i < l.length; i++) if (l[i].cle === cle) return !!l[i].retrouvee;
    return false;
  }
  function reussi(ctxTahaddi, cle) {
    var l = ctxTahaddi && ctxTahaddi.liste;
    if (!l) return false;
    for (var i = 0; i < l.length; i++) if (l[i].cle === cle) return !!l[i].reussi;
    return false;
  }
  function preuveTenue(p, w, ctx) {
    if (Array.isArray(p)) return p.every(function (q) { return preuveTenue(q, w, ctx); });
    var e = ctx.etat;
    switch (p.type) {
      case "tutoriel": return !!(ctx.recit && ctx.recit.tutoriel && ctx.recit.tutoriel.fini);
      case "khatt": return e.khatt.length >= p.n;
      case "pnj": return p.cles.every(function (c) { return e.pnj.indexOf(c) !== -1; });
      case "moujam": case "riwaq": case "cartes": case "souk": return e[p.type] === true;
      case "pages": return p.cles.every(function (c) { return retrouvee(ctx.pages, c); });
      case "aJour": return !!(ctx.pages && ctx.pages.ouvertes > 0 && !ctx.pages.prochaine);
      case "tahaddi": return p.cles.every(function (c) { return reussi(ctx.tahaddi, c); });
      case "imtihan": return (Number(ctx.joueur && ctx.joueur.imtihan) || 0) >= p.n;
      case "rencontres": return (Number(ctx.joueur && ctx.joueur.rencontres) || 0) >= p.n;
      case "daftar": return !!e.daftar[String(w.jour)];
      case "declare": return false;   // le bouton seulement : tenu par `tenus`
      default: return false;
    }
  }
  // Le Wird a-t-il besoin du bouton « C'est fait » ?
  function aBouton(w) {
    if (w.declarable) return true;
    var ps = Array.isArray(w.preuve) ? w.preuve : [w.preuve];
    return ps.some(function (p) { return p.type === "declare"; });
  }
  function aDaftar(w) {
    var ps = Array.isArray(w.preuve) ? w.preuve : [w.preuve];
    return ps.some(function (p) { return p.type === "daftar"; });
  }

  // ---- L'état complet -----------------------------------------------------------------
  // etat(ctx) avec ctx = { jour, maison, recit, joueur, pages, tahaddi }.
  //   jour : le jour de l'Arb3ine (R.arb3ine().jour), 1..40 — jamais l'horloge.
  // Rend : { jour, liste[40] (chacun : tenu, tenuPar, ouvert, manque, aVenir),
  //          courant, veille (si ouverte et pas tenue), tenus, manques,
  //          prochain (le premier ouvert non tenu), fini, minutesRestantes }
  function etat(ctx) {
    ctx = ctx || {};
    var jour = Math.max(1, Math.min(JOURS, Number(ctx.jour) || 1));
    var maison = ctx.maison !== false;
    var e = lireEtat(ctx.recit);
    var c = { etat: e, recit: ctx.recit, joueur: ctx.joueur || {}, pages: ctx.pages, tahaddi: ctx.tahaddi };
    var tenus = 0, manques = 0, prochain = null, minutesRestantes = 0;
    var lst = liste(maison).map(function (w) {
      var parPreuve = preuveTenue(w.preuve, w, c);
      var parDeclaration = !!e.tenus[String(w.jour)];
      var tenu = parPreuve || parDeclaration;
      var ouvert = w.jour <= jour && w.jour >= jour - RATTRAPAGE;
      var passe = w.jour < jour - RATTRAPAGE;
      var manque = passe && !tenu;
      if (tenu) tenus += 1;
      if (manque) manques += 1;
      if (ouvert && !tenu && !prochain) prochain = w;
      if (!tenu && w.jour <= jour) minutesRestantes += w.minutes;
      return Object.assign({}, w, {
        tenu: tenu, tenuPar: tenu ? (parPreuve ? "preuve" : "declaration") : null,
        ouvert: ouvert, manque: manque, aVenir: w.jour > jour,
        bouton: aBouton(w), daftar: aDaftar(w), texte: e.daftar[String(w.jour)] || ""
      });
    });
    // le prochain pas : d'abord la veille non tenue, puis le jour — dans l'ordre
    var courant = lst[jour - 1];
    var veille = jour > 1 && !lst[jour - 2].tenu ? lst[jour - 2] : null;
    if (!prochain && !courant.tenu) prochain = courant;
    return {
      jour: jour, total: JOURS, liste: lst, courant: courant, veille: veille,
      tenus: tenus, manques: manques, prochain: prochain ? lst[prochain.jour - 1] : null,
      fini: tenus === JOURS, minutesRestantes: minutesRestantes
    };
  }

  // ---- Poser un drapeau (rend un NOUVEAU recit.wird, jamais muté) --------------------
  function copier(recit) { return Object.assign(etatVide(), lireEtat(recit)); }
  function marquerKhatt(recit, index) {
    var w = copier(recit);
    if (Number.isInteger(index) && index >= 0 && w.khatt.indexOf(index) === -1) w.khatt = w.khatt.concat([index]);
    return w;
  }
  function marquerPnj(recit, cle) {
    var w = copier(recit);
    if (typeof cle === "string" && cle && w.pnj.indexOf(cle) === -1) w.pnj = w.pnj.concat([cle]);
    return w;
  }
  function marquerSalle(recit, salle) {
    var w = copier(recit);
    if (["moujam", "riwaq", "cartes", "souk"].indexOf(salle) !== -1) w[salle] = true;
    return w;
  }
  function tenir(recit, jour, quand) {
    var w = copier(recit);
    var n = Number(jour);
    if (Number.isInteger(n) && n >= 1 && n <= JOURS) w.tenus[String(n)] = (quand ? new Date(quand) : new Date()).toISOString();
    return w;
  }
  function ecrireDaftar(recit, jour, texte) {
    var w = copier(recit);
    var n = Number(jour);
    if (!Number.isInteger(n) || n < 1 || n > JOURS) return w;
    var t = String(texte == null ? "" : texte).replace(/\r/g, "").trim().slice(0, DAFTAR_MAX);
    if (t) w.daftar[String(n)] = t; else delete w.daftar[String(n)];
    return w;
  }

  // Le HUD : « Wird · jour 12 · Ce que l'image invente ». Court, et le titre
  // du prochain pas — jamais une consigne entière au-dessus du jeu.
  function libelleHud(et) {
    if (!et) return "";
    if (et.fini) return "Wird · 40/40";
    var p = et.prochain;
    if (!p) return "Wird · jour " + et.jour + " · fait";
    return "Wird · jour " + p.jour + " · " + p.titre;
  }

  return {
    JOURS: JOURS, MAX_MINUTES: MAX_MINUTES, RATTRAPAGE: RATTRAPAGE, DAFTAR_MAX: DAFTAR_MAX,
    FAMILLES: FAMILLES, famille: famille, MAISON: MAISON, LES_SIX: LES_SIX,
    liste: liste, wird: wird, etat: etat, lireEtat: lireEtat, etatVide: etatVide,
    aBouton: aBouton, aDaftar: aDaftar,
    marquerKhatt: marquerKhatt, marquerPnj: marquerPnj, marquerSalle: marquerSalle, tenir: tenir, ecrireDaftar: ecrireDaftar,
    libelleHud: libelleHud
  };
});
