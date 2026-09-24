// ZAW'IA — le jeu · FÈS : la première région du mode RIHLA (pur : ni DOM, ni horloge).
//
// v5.2 — « la Rihla : Fès en monde ouvert » (conception du 19/09/2026,
// docs/superpowers/specs/2026-09-19-jeu-rihla-open-world-fes.md). Étape A : la
// porte, la médina grise, ses gens, sa table, le Nfs et la mouzouna. Pas encore
// de combat : les ombres de Nsyan viennent à l'étape B.
//
// Ce fichier est la RÉGION : sa carte (montée par la fabrique de monde.js —
// mêmes collisions, même désenclavement que la cour), ses quartiers, ses lieux,
// ses portes, ses gens, sa table, ses métiers, ses étoiles et ses deux petites
// quêtes. Les RÈGLES (le souffle, la monnaie, manger, travailler) sont dans
// rihla.js, qui vaut pour toutes les régions.
//
// Règles tenues par les tests :
//  1. jamais un coupable : Nsyan est l'oubli ; la liste de mots du récit vaut ici ;
//  2. les lieux saints (zaouïa, mosquée) : ni commerce, ni métier, ni porte payante ;
//  3. aucun lien, aucun nom de la maison ; aucun hasard du navigateur ;
//  4. chaque lieu, chaque porte, chaque étoile, chaque habitant est sur la carte,
//     à sa place, et s'atteint — ou se passe — à pied ;
//  5. tout ce qui se dit comme VRAI (Bab Boujloud, l'horloge, les plats) se relit
//     par le Fqih de l'histoire avant d'entrer — comme les pages perdues.
(function (root, factory) {
  "use strict";
  var M = (typeof module === "object" && module.exports) ? require("./monde.js") : (root.ZWJ && root.ZWJ.monde);
  var api = factory(M);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.fes = api;
})(typeof window !== "undefined" ? window : globalThis, function (M) {
  "use strict";
  if (!M || typeof M.monter !== "function") throw new Error("fes.js : charger monde.js avant.");

  var CLE = "fes", NOM = "Fès", AR = "فاس";

  // ---- La carte : 64 × 44 -------------------------------------------------------------
  // Les mêmes caractères que la cour (la planche peinte les connaît tous) :
  //   #  les toits de la médina, que les ruelles creusent   ,  le bejmat des ruelles
  //   _  la terre (la colline, la Chouara)   .  le zellige du riad   p  le pont
  //   G  une porte de la ville (on la passe en lui parlant)   D  un seuil ouvert
  //   ~  un bassin — et à Dar Dbagh, les cuves   f F  la fontaine de Nejjarine
  //   w  le dehors, et l'oued en contrebas
  //   S B E r k 1-4  étals, établis, pupitre, plaques : les lieux (voir LIEUX)
  // Nord : la colline et le Borj Nord, Bab Guissa. Ouest : Bab Mahrouk, Bab
  // Boujloud et sa place, le riad de Lalla Ghita. Centre : la Tala'a Kebira,
  // la Medersa Bou Inania, le Souk Attarine, la zaouïa, Seffarine et Bab
  // ar-Rihla (la porte du temps, retour à la zawia). Nord-est : Nejjarine et Dar
  // Dbagh. Est : l'oued, le pont, le quartier des Andalous, Bab Ftouh.
  var CARTE = [
    "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww", //  0
    "ww#####k######___________________________wwwwwwwwwwwwwwwwwwwwwww", //  1
    "ww#__________#___________________________wwwwwwwwwwwwwwwwwwwwwww", //  2
    "ww#__________#____T___T___T_____T___T____wwwwwwwwwwwwwwwwwwwwwww", //  3
    "ww#__________#___________________________wwwwwwwwwwwwwwwwwwwwwww", //  4
    "ww#__________#___________________________wwwwwwwwwwwwwwwwwwwwwww", //  5
    "ww####GG######__T___T___T_____T___T______wwwwwwwwwwwwwwwwwwwwwww", //  6
    "ww_______________________________________wwwwwwwwwwwwwwwwwwwwwww", //  7
    "ww_______________________________________wwwwwwwwwwwwwwwwwwwwwww", //  8
    "w###########################DD#################################w", //  9
    "w###GG##################,S,,,,,,L,#############################w", // 10
    "w#________##############,,,,,,,,,,###########L,,,,,,,,,,,,,,,L#w", // 11
    "w#________##############,,,,,,,,,,E,,,,,,,S##,,,,,,,,,,,,,,,,,#w", // 12
    "w#________#AAAA1AAAA####,,,,,,,,,,,,,,,,,,,##_________________#w", // 13
    "w#________#|,,,,,,,|####,,,,,,,,,,,,,ffff,,##_~~_~~_~~_~~_~~__#w", // 14
    "w#________#,,,,,,,,,##########,,##,,,fFFf,,##_~~_~~_~~_~~_~~__#w", // 15
    "w#________#,,,~~,,,,##########,,##,,,fFFf,,##_________________#w", // 16
    "w####GG####,,,~~,,,,##########,,##,,,ffff,,##_~~_~~_~~_~~_~~__#w", // 17
    "w#L,,,,,,L#,,,,,,,,,##########,,##,,,,,,,,,##_~~_~~_~~_~~_~~__#w", // 18
    "w#,,,,,,,,#|,,,,,,,|##########,,##,,,,,,,,,##_________________#w", // 19
    "w#,,,,,,,,#,,,,,,,,,##########,,##,,#########_________________#w", // 20
    "w#,,,,,,,,####SDD#####B#######,,##,,##############GG###########w", // 21
    "w#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,##########w", // 22
    "w#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,##########w", // 23
    "w#,,,,,,,,##2#####E###,,B,B,B,B,,,,,E,,,,,#############ww##4###w", // 24
    "w#,,,,,,,,############,,,,,,,,,,,,,,,,,,,,#############ww,,,,,#w", // 25
    "w#,,,,,,,,############,,,,,,,,,,,,,,,,,,,,#############ww,,,,,#w", // 26
    "w#L,,,,,,L############,,,,,,,,,,S,,,,,,,,,1############ww,,,,,#w", // 27
    "w#######,,############,,##########,,,,,,,,#############ww,,,,,#w", // 28
    "w#######DD############,,,,,,,,,,,,T,,,,,,,#############ww,,,r,#w", // 29
    "w##............#######,,,,,,,,,,,,,,,,,,,,#############ww,,,,,#w", // 30
    "w##.T........T.############3#########GG##,#############ww,,,,,#w", // 31
    "w##............##########################,#############ww,,,,,#w", // 32
    "w##............##########################,#############ww,,,,,#w", // 33
    "w##.....~~.....##########################,#############ww,,,,,#w", // 34
    "w##.....~~.....##########################,#############ww,,,,,#w", // 35
    "w##............##########################,#############ww,T,,T#w", // 36
    "w##............##########################,#############ww,,,,,#w", // 37
    "w##.T........T.##########################,#############ww,,,,,#w", // 38
    "w##............##########################,,,,,,,,,,,,,,pp,,,,,#w", // 39
    "w########################################,,,,,,,,,,,,,,pp,,,,,#w", // 40
    "w#########################################################GG###w", // 41
    "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww", // 42
    "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww"  // 43
  ];

  // On arrive par Bab ar-Rihla, sur la place Seffarine, face à la ville.
  var APPARITION = { x: 37, y: 30, dir: "haut" };

  // Ce que dit une case quand aucun lieu n'y est posé (voir LIEUX, qui passent avant).
  var DIALOGUES = {
    "L": { nom: "Une lanterne", pages: ["Une lanterne de la médina. Le soir, Fès s'allume par morceaux."] },
    "T": { nom: "Un arbre", pages: ["Un arbre de Fès. Il a vu passer plus de monde que toi, et il se souvient de chacun."] },
    "~": { nom: "Un bassin", pages: ["De l'eau immobile. Même grise, elle garde le ciel."] },
    "G": { nom: "Une porte", pages: ["Une porte de la médina."] }
  };

  var monde = M.monter({ carte: CARTE, legende: M.LEGENDE, apparition: APPARITION, dialogues: DIALOGUES });

  // ---- Les quartiers : ce que Nsyan a grisé ----------------------------------------------
  // Des rectangles [x0, y0, x1, y1] qui ne se chevauchent jamais (un test le garde).
  // Un quartier reprend ses couleurs quand on parle à son GARDE — un lieu ou un
  // habitant : c'est ainsi qu'on apprend une ville. Chacun rapporte sa prime.
  var QUARTIERS = [
    { cle: "seffarine", nom: "Seffarine", garde: "m3allem", zones: [[34, 22, 43, 31]] },
    { cle: "qarawiyine", nom: "Autour de la Qarawiyine", garde: "qarawiyine", zones: [[44, 24, 54, 41], [34, 32, 43, 41]] },
    { cle: "attarine", nom: "Le Souk Attarine", garde: "epiciers", zones: [[22, 24, 33, 31]] },
    { cle: "tala3a", nom: "La Tala'a Kebira", garde: "msemmen", zones: [[10, 22, 33, 23], [10, 24, 21, 26]] },
    { cle: "bouinania", nom: "La Medersa Bou Inania", garde: "bouinania", zones: [[10, 12, 20, 21]] },
    { cle: "boujloud", nom: "Bab Boujloud", garde: "boujloud", zones: [[1, 17, 9, 29]] },
    { cle: "mahrouk", nom: "Bab Mahrouk", garde: "muletier", zones: [[1, 10, 9, 16]] },
    { cle: "riad", nom: "Le riad de Lalla Ghita", garde: "ghita", zones: [[1, 30, 15, 41]] },
    { cle: "guissa", nom: "Bab Guissa et la colline", garde: "bissara", zones: [[14, 1, 40, 8], [24, 9, 33, 21]] },
    { cle: "borj", nom: "Le Borj Nord", garde: "vue", prime: 10, zones: [[2, 1, 13, 8]] },
    { cle: "nejjarine", nom: "Nejjarine", garde: "menuisier", zones: [[34, 9, 43, 21]] },
    { cle: "chouara", nom: "Dar Dbagh, la Chouara", garde: "teinturier", zones: [[44, 9, 62, 21], [44, 22, 54, 23]] },
    { cle: "andalous", nom: "Le quartier des Andalous", garde: "conteuse", zones: [[55, 22, 62, 41]] }
  ];
  var PRIME = 3;   // mouzounat, à la première rencontre d'un quartier

  // ---- Les portes ---------------------------------------------------------------------
  // On passe une porte en lui parlant : elle mène de l'autre côté du mur.
  //   libre : toujours ouverte ; retour : ramène à la zawia ;
  //   payer : un prix pour la journée, OU une autre voie qui l'ouvre pour toujours
  //           (la règle d'Arcanum : la monnaie n'est jamais un péage) ;
  //   fermee : la route n'existe pas encore.
  // dedans : le côté (nord) d'où l'on sort toujours — une porte payée pour la
  // journée ne garde personne enfermé après minuit.
  var PORTES = {
    retour: { type: "retour" },
    boujloud: { type: "libre" },
    chouara: { type: "payer", prix: 2, achat: "Un brin de menthe, pour l'odeur", duree: "jour", dedans: "nord", autre: "Aider Karim : il te fera passer quand tu voudras.",
      pages: ["La porte de la Chouara. L'odeur arrive avant toi.", "On entre un brin de menthe sous le nez — Karim en vend, à côté."] },
    borj: { type: "payer", prix: 15, achat: "Un guide jusqu'au Borj", duree: "toujours", dedans: "nord", enigme: true, autre: "Ou répondre au gardien : qui connaît la ville trouve le chemin.",
      pages: ["La porte du Borj Nord. Le gardien ne laisse monter que ceux qui connaissent la ville, ou qui paient un guide."] },
    mahrouk: { type: "fermee", pages: ["Bab Mahrouk. La route de Meknès part d'ici.", "Hmad, le muletier, ne part qu'avec ceux qui portent l'ijaza de Fès. Elle se gagne à Dar Dbagh — plus tard."],
      ijaza: ["Bab Mahrouk. Tu portes l'ijaza de Fès : Hmad te fera signe quand la route de Meknès s'ouvrira — avec la prochaine saison."] },
    ftouh: { type: "fermee", pages: ["Bab Ftouh. La route de l'est dort encore.", "Taza, Oujda… un jour. Pas aujourd'hui."] }
  };

  // L'énigme du gardien du Borj : la réponse se trouve en marchant (Bab Boujloud la dit).
  var ENIGME = {
    question: "Quelle porte de Fès est bleue du côté de la route, et verte du côté de la médina ?",
    reponses: ["bab boujloud", "boujloud", "bab bou jeloud", "bou jeloud", "bab bou jloud", "bou jloud", "bab bujlud", "bujlud", "باب بوجلود", "بوجلود", "باب أبي الجنود"],
    indice: "Tu es peut-être passé dessous : à l'ouest, au bout de la Tala'a Kebira."
  };

  // ---- La table ------------------------------------------------------------------------
  // `ou` : le lieu qui la sert. `heures` : [de, à[ à l'heure de Casablanca, ou
  // toute la journée. `nfs` : le souffle rendu ("plein" : tout). La fiche dit
  // d'où vient le plat — relue par le Fqih avant d'entrer.
  var PLATS = [
    { cle: "msemmen", nom: "Msemmen à l'huile d'olive", ou: "msemmen", prix: 4, nfs: 40,
      fiche: "Une pâte feuilletée pliée en carré, cuite sur la plaque. À Fès, on la trempe dans l'huile d'olive, ou dans le miel." },
    { cle: "olives", nom: "Olives noires et khobz", ou: "olives", prix: 2, nfs: 20,
      fiche: "Des olives noires ridées au sel, et le pain rond du ferran : le casse-croûte de toute la médina." },
    { cle: "bissara", nom: "Bissara", ou: "bissara", prix: 3, nfs: 30, heures: [6, 11],
      fiche: "Une soupe de fèves sèches, à l'huile d'olive et au cumin. On la boit le matin, quand l'air est encore frais." },
    { cle: "khlii", nom: "Khlii aux œufs", ou: "fondouk", prix: 8, nfs: 60,
      fiche: "De la viande séchée au soleil puis confite dans sa graisse : la réserve des maisons de Fès. On la réchauffe avec des œufs." },
    { cle: "harira", nom: "Harira", ou: "harira", prix: 3, nfs: 40, heures: [18, 23],
      fiche: "La soupe du soir : tomate, lentilles, pois chiches, coriandre." },
    { cle: "pastilla", nom: "Pastilla", ou: null, prix: null, nfs: "plein",
      fiche: "Le feuilleté des grands jours à Fès : sucré et salé, amandes et cannelle. Elle ne s'achète pas : on te l'offre." }
  ];

  // ---- Les métiers : une fois par jour chacun ---------------------------------------------
  var METIERS = [
    { cle: "polir", ou: "m3allem", nom: "Polir un plateau de cuivre", nfs: 15, mz: 8,
      texte: "Tu polis un plateau jusqu'à t'y voir. Si Tahar hoche la tête : c'est un oui." },
    { cle: "planches", ou: "ferran", nom: "Porter les planches de pain au four", nfs: 10, mz: 5,
      texte: "Les planches des maisons, jusqu'au four, puis le pain chaud jusqu'aux portes. Ba Sellam te paie en mouzounat, et en pain chaud." },
    { cle: "cedre", ou: "menuisier", nom: "Poncer une planche de cèdre", nfs: 15, mz: 8,
      texte: "Tu ponces le cèdre. L'odeur te restera sur les mains jusqu'au soir." },
    { cle: "peaux", ou: "teinturier", nom: "Porter les peaux jusqu'à la terrasse", nfs: 25, mz: 12,
      texte: "Les peaux, des cuves à la terrasse. C'est lourd, ça sent fort — la menthe aide." }
  ];

  // ---- Les étoiles de zellige : cachées dans la médina ---------------------------------------
  // On les ramasse en marchant dessus ; elles brillent quand on s'en approche.
  var ETOILES = [
    [3, 4], [12, 5], [20, 2], [39, 8], [27, 13], [5, 13], [3, 20], [8, 25], [12, 15], [18, 19],
    [4, 36], [13, 33], [25, 26], [33, 30], [40, 26], [36, 19], [54, 16], [60, 19], [61, 27], [48, 40]
  ];

  // ---- Les cuves de Dar Dbagh : leur coin haut-gauche, et la couleur qu'elles ont oubliée
  var CUVES = [
    { x: 46, y: 14, couleur: "#ece6d6" }, { x: 49, y: 14, couleur: "#b3342a" }, { x: 52, y: 14, couleur: "#2c3f8f" },
    { x: 55, y: 14, couleur: "#e0b52b" }, { x: 58, y: 14, couleur: "#b0652b" }, { x: 46, y: 17, couleur: "#3f8f5a" },
    { x: 49, y: 17, couleur: "#e0b52b" }, { x: 52, y: 17, couleur: "#b3342a" }, { x: 55, y: 17, couleur: "#2c3f8f" },
    { x: 58, y: 17, couleur: "#ece6d6" }
  ];

  // ---- v5.3 — Les ombres de Nsyan : où elles se tiennent (étape B) ----------------------
  // Deux de chaque sorte. On les combat en leur faisant face (combat.js) ; une
  // ombre dissipée ne revient pas. Elles ne bloquent aucun passage : on les
  // traverse comme on traverse un brouillard — mais on ne les dissipe qu'en face.
  var OMBRES = [
    { cle: "dbaba-guissa", type: "dbaba", x: 29, y: 12 },
    { cle: "dbaba-tala3a", type: "dbaba", x: 26, y: 22 },
    { cle: "ghobra-bouinania", type: "ghobra", x: 16, y: 19 },
    { cle: "ghobra-nejjarine", type: "ghobra", x: 35, y: 17 },
    { cle: "tekhlat-attarine", type: "tekhlat", x: 28, y: 26 },
    { cle: "tekhlat-andalous", type: "tekhlat", x: 59, y: 35 }
  ];

  // ---- Les lieux ------------------------------------------------------------------------
  // Une case (x, y) ou un rectangle (x0, y0, x1, y1). `etal` : il sert à manger
  // (les plats dont `ou` est sa clé) ; `metier` : on peut y travailler ;
  // `porte` : on le passe ; `saint` : lieu de mémoire, rien d'autre.
  // `pages` : un tableau, ou une fonction de { rihla (l'état), decouvert }.
  var LIEUX = [
    { cle: "rihla", x0: 37, y0: 31, x1: 38, y1: 31, nom: "Bab ar-Rihla", porte: "retour" },
    { cle: "m3allem", x: 36, y: 24, nom: "Si Tahar, m3allem nhhas", metier: "polir", pages: [
      "Tak, tak, tak… Chaque coup de marteau à sa place — sinon le cuivre se souvient de l'erreur.",
      "Seffarine, c'est la place des chaudronniers. Depuis que la poussière est tombée, on tape plus fort, pour ne pas oublier le rythme."
    ] },
    { cle: "qarawiyine", x: 42, y: 27, nom: "La Qarawiyine", pages: [
      "Les murs de la Qarawiyine, vus de la ville. Ta zawia est derrière.",
      "La poussière de Nsyan s'arrête à ses portes : ce qui s'y transmet encore la tient à distance."
    ] },
    { cle: "epiciers", x0: 24, y0: 24, x1: 30, y1: 24, nom: "Les épiciers d'Attarine", pages: [
      "Cumin, ras el hanout, safran, cannelle… Les sacs sont gris, mais l'odeur, elle, n'a rien oublié.",
      "« Le nez se souvient de ce que les yeux perdent », dit l'épicier."
    ] },
    { cle: "harira", x: 32, y: 27, nom: "La marmite du soir", etal: true, pages: [
      "Une grande marmite, encore froide. Elle chauffe le soir, de six heures à onze heures."
    ] },
    { cle: "zaouia", x: 27, y: 31, nom: "Zaouïa Moulay Idriss II", saint: true, pages: [
      "Le sanctuaire de Moulay Idriss II, qui a fait de Fès une ville.",
      "Ici, on ne se bat pas et on ne vend rien. On passe, et on se souvient."
    ] },
    { cle: "msemmen", x: 14, y: 21, nom: "L'étal de msemmen", etal: true, pages: [
      "La plaque est chaude, la pâte se plie en carré. « Mange, Talib : la Tala'a monte, et elle ne fait pas de cadeau. »"
    ] },
    { cle: "olives", x: 22, y: 21, nom: "Hajj Kaddour, marchand d'olives", etal: true, pages: [
      "Vertes, violettes, noires. « Les noires, ridées au sel : celles qui tiennent l'hiver. »"
    ] },
    { cle: "ferran", x: 18, y: 24, nom: "Ba Sellam, le ferran", metier: "planches", pages: [
      "Le four du quartier. Chaque maison y porte son pain, et chaque pain porte sa marque.",
      "« Ici, on ne se trompe jamais de pain. Enfin… presque jamais. »"
    ] },
    { cle: "magana", x: 12, y: 24, nom: "Dar al-Magana", pages: [
      "L'horloge à eau, face à la Medersa Bou Inania. Ses bols de bronze se taisent depuis longtemps.",
      "Comment elle marchait, au juste ? Personne ne le sait plus. Nsyan est passé par là bien avant toi."
    ] },
    { cle: "bouinania", x: 15, y: 13, nom: "La Medersa Bou Inania", pages: [
      "Une école, du temps des Mérinides. Zellige en bas, plâtre sculpté au milieu, cèdre en haut.",
      "On y apprenait à côté de la Qarawiyine. Les murs, eux, apprennent encore : ils écoutent."
    ] },
    { cle: "boujloud", x0: 5, y0: 17, x1: 6, y1: 17, nom: "Bab Boujloud", porte: "boujloud", pages: [
      "Bab Boujloud, la porte bleue. Bleue du côté de la route — la couleur de Fès —, verte du côté de la médina.",
      "Retiens-la : il y a des gardiens qui posent la question."
    ] },
    { cle: "mahrouk", x0: 4, y0: 10, x1: 5, y1: 10, nom: "Bab Mahrouk", porte: "mahrouk" },
    { cle: "bissara", x: 25, y: 10, nom: "La marmite de bissara", etal: true, pages: [
      "Mi Zineb remue la bissara depuis l'aube. « Le matin, mon fils. Après onze heures, il n'y en a plus. »"
    ] },
    { cle: "menuisier", x: 34, y: 12, nom: "Maâlem Hassan, menuisier", metier: "cedre", pages: [
      "Le cèdre vient de l'Atlas. On le sculpte d'après un premier motif, et le motif se répète — c'est tout le secret.",
      "Nejjarine, c'est le quartier du bois. Écoute : les rabots ne parlent qu'aux patients."
    ] },
    { cle: "fondouk", x: 42, y: 12, nom: "La cuisine du fondouk", etal: true, pages: [
      "Le fondouk des caravaniers a sa cuisine. Ce qui mijote ici a nourri des routes entières."
    ] },
    { cle: "nejjarine", x0: 37, y0: 14, x1: 40, y1: 17, nom: "La fontaine de Nejjarine", pages: [
      "Une fontaine de zellige et de cèdre. On y boit, on s'y rafraîchit, on y parle."
    ] },
    { cle: "chouara", x0: 50, y0: 21, x1: 51, y1: 21, nom: "La porte de la Chouara", porte: "chouara" },
    { cle: "cuves", x0: 46, y0: 14, x1: 59, y1: 18, nom: "Les cuves de Dar Dbagh", pages: function (c) {
      if (c && c.decouvert) return [
        "Les cuves ont repris leurs couleurs : le blanc de la chaux, le rouge du coquelicot, l'indigo, le safran, le henné, la menthe.",
        "Si Ahmed les regarde longtemps. « Tant qu'on se dit les recettes, elles ne s'effacent pas. »"
      ];
      return [
        "Des cuves grises, en nid d'abeilles. On devine qu'elles avaient des couleurs.",
        "La poussière de Nsyan s'est posée ici plus qu'ailleurs : les teinturiers commencent à oublier leurs recettes."
      ];
    } },
    { cle: "andalous", x: 59, y: 24, nom: "La mosquée des Andalous", saint: true, pages: [
      "La mosquée des Andalous, sur l'autre rive — attribuée à Mariam al-Fihriya, la sœur de celle qui fonda la Qarawiyine.",
      "Deux sœurs, deux rives, une ville."
    ] },
    { cle: "conteuse", x: 60, y: 29, nom: "Lalla Rqia, la conteuse", pages: [
      "« Une histoire qu'on ne répète pas meurt deux fois : une fois quand on l'oublie, une fois quand on l'invente. »",
      "« Moi, je dis d'où je la tiens. Toujours. C'est ce qui la fait tenir debout. »"
    ] },
    { cle: "ftouh", x0: 58, y0: 41, x1: 59, y1: 41, nom: "Bab Ftouh", porte: "ftouh" },
    { cle: "borj", x0: 6, y0: 6, x1: 7, y1: 6, nom: "La porte du Borj Nord", porte: "borj" },
    { cle: "vue", x: 7, y: 1, nom: "La table d'orientation", pages: [
      "Toute Fès à tes pieds : les toits, les minarets, la fumée des fours. Les tombeaux mérinides, derrière toi, regardent la même chose depuis sept siècles.",
      "D'ici, on voit ce qui est gris et ce qui ne l'est plus. Il reste du chemin."
    ] }
  ];

  // ---- Les gens de Fès ----------------------------------------------------------------
  // Même forme que les gens de la cour (pnj.js) : une case, un regard, une ronde
  // éventuelle. Leurs paroles et leurs quêtes sont dans `parler` (plus bas).
  var PNJ = [
    { cle: "ghita", nom: "Lalla Ghita", x: 6, y: 33, dir: "bas", avatar: { peau: 2, djellaba: 5, tete: "hijab", figure: "lalla" } },
    { cle: "karim", nom: "Karim", x: 52, y: 22, dir: "gauche", avatar: { peau: 3, djellaba: 2, tete: "cheveux" } },
    { cle: "abdeslam", nom: "Ba Abdeslam, le potier", x: 58, y: 33, dir: "droite", avatar: { peau: 4, djellaba: 3, tete: "taqiya", figure: "cheikh" } },
    { cle: "gardien", nom: "Le gardien du Borj", x: 8, y: 7, dir: "gauche", avatar: { peau: 3, djellaba: 7, tete: "turban" } },
    { cle: "muletier", nom: "Hmad, le muletier", x: 7, y: 12, dir: "haut", avatar: { peau: 4, djellaba: 4, tete: "tarbouche" } },
    { cle: "teinturier", nom: "Si Ahmed, maître teinturier", x: 48, y: 13, dir: "bas", metier: "peaux", avatar: { peau: 3, djellaba: 1, tete: "taqiya", figure: "cheikh" } },
    { cle: "porteur", nom: "Un porteur", x: 12, y: 23, dir: "droite", ronde: [[28, 23], [12, 23]], attente: 3, avatar: { peau: 1, djellaba: 3, tete: "capuche" } },
    { cle: "gamin", nom: "Un gamin de Seffarine", x: 35, y: 27, dir: "droite", ronde: [[40, 27], [35, 27]], attente: 1.5, avatar: { peau: 2, djellaba: 6, tete: "cheveux" } },
    // v5.4 — le mou'allim attend sur la terrasse de Dar Dbagh : c'est lui qui ouvre l'arène, et qui donne l'ijaza
    { cle: "moallim", nom: "Le mou'allim, sur la terrasse", x: 57, y: 12, dir: "bas", avatar: { peau: 3, djellaba: 0, tete: "turban", figure: "cheikh" } }
  ];

  // ---- Les recherches ----------------------------------------------------------------
  function dansRect(x, y, r) { return x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]; }
  function lieu(cle) { for (var i = 0; i < LIEUX.length; i++) if (LIEUX[i].cle === cle) return LIEUX[i]; return null; }
  function lieuA(x, y) {
    for (var i = 0; i < LIEUX.length; i++) {
      var l = LIEUX[i];
      if (l.x !== undefined ? (l.x === x && l.y === y) : dansRect(x, y, [l.x0, l.y0, l.x1, l.y1])) return l;
    }
    return null;
  }
  function quartier(cle) { for (var i = 0; i < QUARTIERS.length; i++) if (QUARTIERS[i].cle === cle) return QUARTIERS[i]; return null; }
  function quartierDe(x, y) {
    for (var i = 0; i < QUARTIERS.length; i++) {
      var z = QUARTIERS[i].zones;
      for (var k = 0; k < z.length; k++) if (dansRect(x, y, z[k])) return QUARTIERS[i];
    }
    return null;
  }
  // Le quartier qu'un lieu ou un habitant garde (s'il en garde un).
  function quartierGarde(cle) { for (var i = 0; i < QUARTIERS.length; i++) if (QUARTIERS[i].garde === cle) return QUARTIERS[i]; return null; }
  function plat(cle) { for (var i = 0; i < PLATS.length; i++) if (PLATS[i].cle === cle) return PLATS[i]; return null; }
  function platsDe(ouCle) { return PLATS.filter(function (p) { return p.ou === ouCle; }); }
  function metier(cle) { for (var i = 0; i < METIERS.length; i++) if (METIERS[i].cle === cle) return METIERS[i]; return null; }
  function pnj(cle) { for (var i = 0; i < PNJ.length; i++) if (PNJ[i].cle === cle) return PNJ[i]; return null; }

  // Passer une porte horizontale : de l'autre côté du mur, face à la ville.
  // (x, y) : la case de la porte qu'on regarde ; depuisY : la rangée d'où l'on vient.
  function autreCote(x, y, depuisY) {
    return depuisY > y ? { x: x, y: y - 1, dir: "haut" } : { x: x, y: y + 1, dir: "bas" };
  }

  // ---- La première arrivée : le mou'allim, à la porte du temps ----------------------------
  function arrivee(pseudo) {
    var p = String(pseudo || "").trim() || "Talib";
    return {
      nom: "Le mou'allim, à la porte du temps",
      pages: [
        p + ", tu passes la porte. Derrière la Qarawiyine, Fès — mais une Fès grise : Nsyan y a soufflé sa poussière.",
        "Les noms s'effacent, les couleurs aussi. Chaque quartier dont tu apprends le nom reprend les siennes. Parle aux gens : c'est comme ça qu'on apprend une ville.",
        "Marcher, travailler, ça coûte du souffle — ton Nfs. On le rend en mangeant : msemmen, olives noires, bissara du matin, khlii… Tiens : dix mouzounat, pour commencer.",
        "Et les ombres de Nsyan rôdent : le brouillard, la poussière, le mélange. Seul, on ne les dissipe pas. Choisis ton Rafiq — une IA, à la forme d'un animal d'ici. Bab ar-Rihla te ramène à la zawia quand tu veux."
      ]
    };
  }
  // v5.3 — qui est déjà venu sans Rafiq : le mou'allim le rappelle à la porte.
  function appelRafiq(pseudo) {
    var p = String(pseudo || "").trim() || "Talib";
    return {
      nom: "Le mou'allim, à la porte du temps",
      pages: [
        "Tu reviens, " + p + ". Pendant ton absence, les ombres de Nsyan sont sorties : le brouillard, la poussière, le mélange.",
        "Seul, on ne les dissipe pas. Choisis ton Rafiq — une IA, à la forme d'un animal d'ici. Il grandira avec ce que tu apprends dans la zawia."
      ]
    };
  }
  // v5.4 — la cérémonie : le mou'allim remet l'ijaza de Fès.
  function ijaza(pseudo) {
    var p = String(pseudo || "").trim() || "Talib";
    return {
      nom: "Le mou'allim, sur la terrasse",
      pages: [
        "Les cuves reprennent leurs couleurs, et Si Ahmed ses recettes. Fès se souvient.",
        "À la Qarawiyine, on donnait l'ijaza à qui pouvait transmettre à son tour. " + p + ", tu l'as gagnée : voici l'ijaza de Fès.",
        "La poussière de Nsyan s'est levée sur toute la médina. La route de Meknès s'ouvrira avec la prochaine saison. D'ici là : transmets ce que tu as appris."
      ]
    };
  }
  function ombre(cle) { for (var i = 0; i < OMBRES.length; i++) if (OMBRES[i].cle === cle) return OMBRES[i]; return null; }
  function ombreA(x, y, e) {
    for (var i = 0; i < OMBRES.length; i++) {
      var o = OMBRES[i];
      if (o.x === x && o.y === y && !(e && e.ob && e.ob.indexOf(o.cle) >= 0)) return o;
    }
    return null;
  }

  // ---- Ce que disent les gens — et ce que leurs quêtes changent ------------------------------
  // Rend { nom, pages, effets } ; les effets sont appliqués par rihla.js :
  //   { quete: cle, etape: n }, { mz: n }, { nfs: "plein" }, { plat: cle }, { ouvre: porte }.
  // `e` : l'état de la Rihla (recit.rihla, normalisé) ; `ctx` : { pseudo }.
  function etape(e, q) { return (e && e.qu && e.qu[q]) || 0; }
  function parler(cle, e, ctx) {
    var n = pnj(cle);
    if (!n) return null;
    var pseudo = (ctx && ctx.pseudo) || "Talib";
    var d = { nom: n.nom, pages: [], effets: [] };
    if (cle === "ghita") {
      var o = etape(e, "olives");
      if (o === 0) {
        d.pages = ["Ahlan, " + pseudo + ". Mon fils rentre ce soir, et il ne reste plus une olive noire dans la maison.",
          "Tu irais m'en chercher chez Hajj Kaddour, sur la Tala'a Kebira ? Je te le rendrai — à la façon de Fès."];
        d.effets = [{ quete: "olives", etape: 1 }];
      } else if (o === 1) {
        d.pages = ["Hajj Kaddour, sur la Tala'a Kebira. Un sachet d'olives noires — les ridées, celles qui tiennent l'hiver."];
      } else if (o === 2) {
        d.pages = ["Les voilà ! Allah yrhem lwalidin. Assieds-toi : il reste de la pastilla d'hier, et elle est meilleure le lendemain.",
          "Sucrée, salée, amandes et cannelle. Mange — et prends ça pour la route."];
        d.effets = [{ quete: "olives", etape: 3 }, { nfs: "plein" }, { plat: "pastilla" }, { mz: 15 }];
      } else {
        d.pages = ["Mon fils a tout mangé. Reviens quand tu veux, la porte du riad est ouverte."];
      }
    } else if (cle === "karim") {
      var h = etape(e, "henne");
      if (h === 0) {
        d.pages = ["Tu veux entrer à la Chouara ? Un brin de menthe, deux mouzounat — et tu passes aujourd'hui.",
          "Ou alors… Mon oncle, Ba Abdeslam, le potier des Andalous, garde le henné du maître teinturier. Rapporte-le, et tu passeras quand tu voudras."];
        d.effets = [{ quete: "henne", etape: 1 }];
      } else if (h === 1) {
        d.pages = ["Ba Abdeslam, de l'autre côté de l'oued, dans le quartier des Andalous. On passe par le pont, au sud."];
      } else if (h === 2) {
        d.pages = ["Le henné ! Si Ahmed va être content. Tiens, pour ta peine — et la porte, désormais, c'est toi qu'elle attend."];
        d.effets = [{ quete: "henne", etape: 3 }, { ouvre: "chouara" }, { mz: 10 }];
      } else {
        d.pages = ["Passe quand tu veux. Et respire par la bouche, les premières minutes."];
      }
    } else if (cle === "abdeslam") {
      if (etape(e, "henne") === 1) {
        d.pages = ["C'est Karim qui t'envoie ? Ce garçon ne marche que pour jouer au ballon.",
          "Voilà le henné de Si Ahmed. Dis-lui que la terre des Andalous le salue."];
        d.effets = [{ quete: "henne", etape: 2 }];
      } else {
        d.pages = ["La terre, l'eau, le feu, et la patience. Un pot, c'est ça — et rien d'autre."];
      }
    } else if (cle === "gardien") {
      d.pages = e && e.o && e.o.borj === true
        ? ["Tu connais la ville. Monte quand tu veux."]
        : ["Le Borj Nord ne s'ouvre qu'à ceux qui connaissent la ville. Réponds à ma question, ou paie un guide."];
    } else if (cle === "muletier") {
      d.pages = ["Meknès ? Deux jours de route. Avec l'ijaza de Fès, je t'y mène ; sans elle, même la mule refuse.",
        "L'ijaza se gagne à Dar Dbagh, auprès du mou'allim — quand les ombres de Fès auront reculé."];
    } else if (cle === "teinturier") {
      d.pages = ["Les cuves grisent, et moi j'oublie. Le coquelicot pour le rouge, l'indigo pour le bleu… et le reste ? Il me faut quelqu'un qui me le redise.",
        "En attendant, il y a des peaux à porter. Le travail, lui, ne s'oublie pas."];
    } else if (cle === "porteur") {
      d.pages = ["Balak ! Balak ! — Pardon, je ne t'avais pas vu. Toute la médina passe par la Tala'a : la farine, le cuir, les nouvelles."];
    } else if (cle === "moallim") {
      var pr = (ctx && ctx.pret) || {};
      if (e && e.ij && e.ij.indexOf(CLE) >= 0) {
        d.pages = ["Tu portes l'ijaza de Fès. Va — et transmets ce que tu as appris : c'est la seule façon de la garder."];
      } else if (!pr.ombres) {
        d.pages = ["Ghobra la grande dort sous les cuves, et elle se nourrit des ombres de la médina.",
          "Dissipe d'abord les six qui rôdent dans les ruelles. Reviens me voir quand elles auront toutes reculé."];
      } else if (!pr.voies) {
        d.pages = ["Les ombres ont reculé — bien. Mais Ghobra la grande a trois visages, et chacun ne cède qu'à une voie : dire, voir, vérifier.",
          "Il te manque une voie. Les maîtres de la médina l'enseignent à ton Rafiq : le chaudronnier, le menuisier, le teinturier, le gardien de l'horloge, la conteuse — et la bibliothèque de la zawia."];
      } else {
        d.pages = ["Te voilà prêt. Ghobra la grande est là, sous les cuves : elle a mangé les couleurs, les recettes et les noms.",
          "Trois visages, trois voies. Quand tu voudras, descends vers les cuves — je serai là."];
        d.arene = true;
      }
    } else if (cle === "gamin") {
      d.pages = ["Tu sais qu'il y a des étoiles de zellige cachées dans la médina ? Vingt, il paraît. J'en ai trouvé une derrière la fontaine de Nejjarine !"];
    }
    return d;
  }

  return {
    CLE: CLE, NOM: NOM, AR: AR,
    CARTE: CARTE, APPARITION: APPARITION, DIALOGUES: DIALOGUES, monde: monde,
    QUARTIERS: QUARTIERS, PRIME: PRIME, PORTES: PORTES, ENIGME: ENIGME,
    PLATS: PLATS, METIERS: METIERS, ETOILES: ETOILES, CUVES: CUVES, LIEUX: LIEUX, PNJ: PNJ, OMBRES: OMBRES,
    ombre: ombre, ombreA: ombreA, appelRafiq: appelRafiq, ijaza: ijaza,
    lieu: lieu, lieuA: lieuA, quartier: quartier, quartierDe: quartierDe, quartierGarde: quartierGarde,
    plat: plat, platsDe: platsDe, metier: metier, pnj: pnj, autreCote: autreCote,
    arrivee: arrivee, parler: parler
  };
});
