// ZAW'IA — le jeu · LE MONDE : Jami3at al Qarawiyine, l'antre du savoir de Fès.
//
// La carte est un DESSIN : un caractère par tuile, une chaîne par rangée.
// On la modifie dans un éditeur de texte, sans outil — et tests/zawia-jeu.test.js
// vérifie qu'elle reste rectangulaire, que l'apparition est franchissable et
// que chaque point d'intérêt reste atteignable à pied depuis le Bab.
//
// Aucun rendu ici : rendu.js dessine les caractères, jeu.js les fait vivre.
// Pur, donc testable sous Node.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.monde = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var TUILE = 16; // pixels d'une tuile, avant agrandissement

  // ---- La légende -------------------------------------------------------------
  // solide : on ne marche pas dessus. poi : on peut lui « parler » en lui
  // faisant face. Le sol des objets posés (rihal, lanterne…) est celui de la
  // pièce où ils sont : rendu.js choisit le fond d'après le voisinage.
  var LEGENDE = {
    // --- solides ---
    "w": { nom: "dehors",     solide: true },
    "#": { nom: "mur",        solide: true },
    "A": { nom: "arcade",     solide: true },
    "|": { nom: "colonne",    solide: true },
    "M": { nom: "minaret",    solide: true,  poi: true },
    "G": { nom: "bab",        solide: true,  poi: true },
    "C": { nom: "mechouar",   solide: true,  poi: true },   // v7.7 — Bab al-Mechouar : la place où l'on est vu
    "F": { nom: "eau",        solide: true },              // l'eau est enclose : c'est la margelle (f) qu'on aborde
    "f": { nom: "margelle",   solide: true,  poi: true },
    "~": { nom: "bassin",     solide: true,  poi: true },
    "T": { nom: "oranger",    solide: true,  poi: true },
    "g": { nom: "parterre",   solide: true },
    "B": { nom: "rayonnage",  solide: true,  poi: true },
    "L": { nom: "lanterne",   solide: true,  poi: true },
    "k": { nom: "lawh",       solide: true,  poi: true },
    "K": { nom: "lawh du jour", solide: true, poi: true },   // v4.7 — Lkelma d'lyoum : le mot du jour (Madrasa, mur nord)
    "Y": { nom: "établi du prompt", solide: true, poi: true },   // v4.8 — Qlil w mfid : le golf du prompt (Madrasa, coin nord-est)
    "r": { nom: "rihal",      solide: true,  poi: true },
    "h": { nom: "halqa",      solide: true,  poi: true },
    "Q": { nom: "mihrab",     solide: true,  poi: true },
    "1": { nom: "panneau",    solide: true,  poi: true },
    "2": { nom: "panneau",    solide: true,  poi: true },
    "3": { nom: "panneau",    solide: true,  poi: true },
    "4": { nom: "panneau",    solide: true,  poi: true },
    "S": { nom: "sandouq",    solide: true,  poi: true },   // le coffre des pages perdues (Khizana)
    "V": { nom: "khatt",      solide: true,  poi: true },   // une valeur de la charte, calligraphiée au mur du Sahn
    "E": { nom: "etabli",     solide: true,  poi: true },   // l'établi des Ta7addi (Madrasa)
    // v3.3 — la porte du Majliss (Qa3a, au fond à droite du mihrab). Un mur
    // pour tout le monde : solide, sans point d'intérêt. Seuls les membres
    // du Majliss (une liste en base, jamais dans le code) la voient et
    // l'ouvrent — jeu.js l'intercepte comme le rihal et le Bab.
    "X": { nom: "porte du Majliss", solide: true },
    // v8.0 — LA RKHAMA (الرخامة) : dans une médersa, la dalle de marbre gravée
    // au mur de la cour, qui nomme ceux qui ont soutenu la maison. Ici, les
    // partenaires. « P » comme la plaque. Un MUR, comme la porte du Majliss :
    // solide, sans point d'intérêt — la marche n'est pas modifiée d'un pas, et
    // c'est jeu.js qui l'intercepte, la dessine et l'ouvre. Ce qu'elle porte
    // vient de la base, jamais d'ici : un nom de partenaire est un nom réel.
    "P": { nom: "Rkhama", solide: true },
    // v5.2 — Bab ar-Rihla, la porte du temps (au fond de la Khizana) : on sort
    // dans la médina de Fès, le mode Rihla. jeu.js l'intercepte comme le Bab.
    "R": { nom: "Bab ar-Rihla", solide: true, poi: true },
    // v5.7 — l'étal de la Rahba (rahba.js) : le tapis d'un marchand, posé au sol du
    // Souk. Solide (on se tient devant), et c'est jeu.js qui dit à qui il est.
    "e": { nom: "étal", solide: true, poi: true },
    // v8.7 — le Derb t-Tadamoun (rahba.js) : l'arganier et le puits de la Twiza. La
    // planche ne les peint pas (leur sol est la pierre de la ruelle) : jeu.js les dessine.
    "a": { nom: "arganier", solide: true, poi: true },
    "u": { nom: "puits", solide: true, poi: true },
    // --- franchissables ---
    ".": { nom: "zellige",    solide: false },
    ",": { nom: "bejmat",     solide: false },
    ":": { nom: "natte",      solide: false },
    "=": { nom: "tapis rouge", solide: false },
    "-": { nom: "tapis vert", solide: false },
    "p": { nom: "marbre",     solide: false },
    "D": { nom: "seuil",      solide: false },
    "_": { nom: "sol",        solide: false }
  };

  // ---- La carte : 46 × 36 -----------------------------------------------------
  //
  //   x →  0         1         2         3         4
  //        0123456789012345678901234567890123456789012345
  //
  // Nord : le minaret (M), le riad aux orangers, le Bab (G) et son vestibule
  //        où l'on apparaît, la salle des ablutions (~).
  // Ouest : la Khizana — rayonnages (B), rihal (r), le sandouq des pages perdues (S),
//         et au fond, dans le mur sud, Bab ar-Rihla (RR) : la porte du temps vers Fès.
  // Ouest encore : sur le mur du Sahn, entre le premier et le deuxième khatt,
  //         la Rkhama (P) — la dalle des partenaires (v8.0).
  // Est : la Madrasa — le lawh (k), le lawh du jour au mur nord (K), l'établi du prompt (Y) et l'établi des Ta7addi (E). Sur les murs du Sahn : sept khatt (V), une
  // valeur de la charte chacun, dans l'ordre de lecture (rangée par rangée).
  // Centre : le Sahn — zellige (.), la fontaine (fF), deux pavillons (|p|),
  //          quatre galeries à colonnes (,|).
  // Sud : la Qa3a — forêt de colonnes, tapis (= -), le cercle de la halqa (h)
  //       et son rihal (r), le mihrab (Q).
  var CARTE = [
    "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww", //  0
    "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww", //  1
    "wwMMMMMw##############GG##############wwwwwwww", //  2
    "wwMMMMMw#_gg__gg_##________##________#wwwwwwww", //  3
    "wwMMMMMw#________#1________##________#wwwwwwww", //  4
    "wwMMMMMw#_T____T_##________##___~~___#wwwwwwww", //  5
    "wwMMMMMw#________##________##___~~___#wwwwwwww", //  6
    "wwMMMMMw#_gg__gg_##_L____L_##________#wwwwwwww", //  7
    "wwMMMMMw#________##________##________#wwwwwwww", //  8
    "w#MMMMM##AAADDAAAAAAAADDAAAAAAAAADAAA####K###w", //  9
    "w#B_____#,,,,,,,,,,,,,,,,,,,,,,,,,,,,#______#w", // 10
    "w#B_____V,,|,,|,,|,,|,,,,|,,|,,|,,|,,V_____Y#w", // 11
    "w#B__S__P,,........................,,#______#w", // 12
    "w#B_BB__V,|.L....................L.|,#______#w", // 13
    "w#B_____#,,........................,,3_----_#w", // 14
    "w#B_____2,,........................,,#_----_#w", // 15
    "w#B__r__#,|..|p|.....ffff.....|p|..|,#_----_kw", // 16
    "w#B_____D,,..ppp.....fFFf.....ppp..,,D_----_kw", // 17
    "w#B_____#,,..ppp.....fFFf.....ppp..,,#_----_#w", // 18
    "w#B_____#,|..|p|.....ffff.....|p|..|,#_----_#w", // 19
    "w#B_BB__V,,........................,,V_----_#w", // 20
    "w#B_____#,,........................,,#_----_#w", // 21
    "w#B____L#,|.L....................L.|,#______#w", // 22
    "w#B_____V,,........................,,V______#w", // 23
    "w#B_____#,,|,,|,,|,,|,,,,|,,|,,|,,|,,#__r_E_#w", // 24
    "w#B____L#,,,,,,,,,,,,,,,,,,,,,,,,,,,,#_____L#w", // 25
    "w###RR###AAAAAADDAAAAADDA4AAADDAAAAAA########w", // 26
    "w#::::::::::::::::::::::::::::::::::::::::::#w", // 27
    "w#:::|:::|:::|:::|:::|:::|:::|:::|:::|:::|::#w", // 28
    "w#==========================================#w", // 29
    "w#====================rh====================#w", // 30
    "w#:::|:::|:::|:::|:::|:::|:::|:::|:::|:::|::#w", // 31
    "w#------------------------------------------#w", // 32
    "w#::::::::::::::::::::::::::::::::::::::::::#w", // 33
    "w#############CC######QQ################X####w", // 34
    "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww"  // 35
  ];

  // v5.2 — LA FABRIQUE DE MONDES. Tout ce qui suit (collisions, pas,
  // désenclavement, dialogues) vaut pour N'IMPORTE QUELLE carte : la cour de la
  // zawia, et la médina de Fès du mode Rihla (fes.js). `monter(def)` rend un
  // monde entier pour une carte ; ce module rend celui de la zawia, et prête la
  // fabrique aux régions — une seule physique, déjà éprouvée, pour toutes.
  function monter(def) {
  var CARTE = def.carte, LEGENDE = def.legende, APPARITION = def.apparition, DIALOGUES = def.dialogues || {};
  var LARGEUR = CARTE[0].length;
  var HAUTEUR = CARTE.length;

  // Où l'on apparaît : dans le vestibule, sous le Bab, face à la cour.
  // (l'apparition vient de la définition : celle de la zawia est APPARITION_ZAWIA)

  var DIRS = {
    haut:   { dx: 0,  dy: -1 },
    bas:    { dx: 0,  dy: 1 },
    gauche: { dx: -1, dy: 0 },
    droite: { dx: 1,  dy: 0 }
  };

  function tuile(x, y) {
    if (y < 0 || y >= HAUTEUR || x < 0 || x >= LARGEUR) return "w";
    return CARTE[y].charAt(x);
  }

  function info(c) { return LEGENDE[c] || LEGENDE["w"]; }
  function solide(x, y) { return info(tuile(x, y)).solide; }
  function franchissable(x, y) { return !solide(x, y); }
  function estPointInteret(c) { return !!info(c).poi; }

  // La tuile qu'on regarde depuis (x, y) en direction `dir`.
  function devant(x, y, dir) {
    var d = DIRS[dir] || DIRS.bas;
    return { x: x + d.dx, y: y + d.dy, c: tuile(x + d.dx, y + d.dy) };
  }

  // Une position enregistrée n'est reprise que si elle est dans la carte ET
  // sur une tuile franchissable — sinon on réapparaît au Bab. Jamais coincé.
  // ---- LE CORPS DU MARCHEUR ----------------------------------------------------------
  // Sa boîte de collision, en pixels : 10 de large, 6 de haut, au bas des
  // pieds. Elle vit ICI, et pas dans jeu.js, parce que « est-ce que ça
  // passe ? » est une question de MONDE — et surtout parce que le
  // déplacement et la reprise de position doivent poser EXACTEMENT la même.
  //
  // ⚠️ Le 13/09/2026, elles en posaient deux différentes, et un joueur est
  //    resté figé dans la Khizana. `positionValide` ne regardait que la tuile
  //    du CENTRE ; sa position enregistrée mordait, du coin de sa boîte, une
  //    tuile devenue solide entre-temps (le sandouq, posé la veille). Reprise
  //    acceptée, puis les quatre directions refusées : plus un pas, et un jeu
  //    qui a l'air planté. Toute tuile qu'on rend solide peut refaire ça à
  //    quelqu'un — la réponse n'est donc pas « faire attention », c'est
  //    `libre()` partout et `degager()` au chargement.
  var CORPS = { demi: 5, haut: 6 };

  // Le corps tient-il ENTIÈREMENT sur des tuiles franchissables ? Les quatre
  // coins suffisent : la boîte est plus petite qu'une tuile.
  function libre(x, y) {
    var x0 = x - CORPS.demi, x1 = x + CORPS.demi - 1, y0 = y - CORPS.haut + 1, y1 = y;
    return franchissable(Math.floor(x0 / TUILE), Math.floor(y0 / TUILE)) &&
           franchissable(Math.floor(x1 / TUILE), Math.floor(y0 / TUILE)) &&
           franchissable(Math.floor(x0 / TUILE), Math.floor(y1 / TUILE)) &&
           franchissable(Math.floor(x1 / TUILE), Math.floor(y1 / TUILE));
  }

  // Le centre d'une tuile, en pixels. Un centre est toujours libre quand la
  // tuile l'est (la boîte tient dans une tuile) : c'est ce qui fait des centres
  // des refuges sûrs, et c'est testé.
  function centre(tx, ty) { return { x: tx * TUILE + TUILE / 2, y: ty * TUILE + TUILE / 2 }; }

  function positionValide(pos) {
    if (!pos || typeof pos !== "object") return false;
    var x = Number(pos.x), y = Number(pos.y);
    if (!isFinite(x) || !isFinite(y)) return false;
    return libre(x, y);
  }

  // AVANCER — un pas, axe par axe, en glissant le long des murs plutôt qu'en
  // s'y collant. Le déplacement vit ICI, avec la boîte et `libre` : c'est la
  // seule façon de le mettre à l'épreuve sans navigateur.
  //
  // ⚠️ Le calage contre le mur ne se fait QUE s'il aboutit à une place libre.
  //    Avant le 13/09/2026 il se faisait TOUJOURS, et sa formule pouvait poser
  //    le corps DANS le mur : sur 114 816 marches légales de la carte, 1 668
  //    finissaient à l'intérieur d'un solide. Là, plus aucune direction ne
  //    s'ouvre — c'est ce qui a figé un joueur à l'intérieur d'un rihal de la
  //    Khizana, un pupitre pourtant présent depuis le premier jour. Le pas
  //    refusé est préférable au pas qui enferme.
  function avancer(p, dx, dy) {
    if (dx !== 0) {
      var nx = p.x + dx;
      if (libre(nx, p.y)) p.x = nx;
      else {
        var cx = dx > 0 ? Math.floor((p.x + CORPS.demi) / TUILE) * TUILE + TUILE - CORPS.demi - 0.01
                        : Math.floor((p.x - CORPS.demi) / TUILE) * TUILE + CORPS.demi;
        if (libre(cx, p.y)) p.x = cx;
      }
    }
    if (dy !== 0) {
      var ny = p.y + dy;
      if (libre(p.x, ny)) p.y = ny;
      else {
        var cy = dy > 0 ? Math.floor(p.y / TUILE) * TUILE + TUILE - 1
                        : Math.floor((p.y - CORPS.haut + 1) / TUILE) * TUILE + CORPS.haut - 1;
        if (libre(p.x, cy)) p.y = cy;
      }
    }
    return p;
  }

  // LE DÉSENCLAVEMENT. Rend la position libre la plus proche : le centre de la
  // tuile où l'on est s'il est libre, sinon le centre de la tuile libre la plus
  // proche, en cercles concentriques. Ne rend JAMAIS null — l'apparition est le
  // dernier recours. C'est le filet : une carte qui change ne doit pas pouvoir
  // enfermer quelqu'un, elle doit le déplacer d'un pas.
  function degager(x, y) {
    if (libre(x, y)) return { x: x, y: y };
    var tx = Math.floor(Number(x) / TUILE), ty = Math.floor(Number(y) / TUILE);
    if (!isFinite(tx) || !isFinite(ty)) { tx = APPARITION.x; ty = APPARITION.y; }
    for (var r = 0; r <= Math.max(LARGEUR, HAUTEUR); r++) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          if (r > 0 && Math.abs(dx) !== r && Math.abs(dy) !== r) continue;  // l'anneau seulement
          var nx = tx + dx, ny = ty + dy;
          if (nx < 0 || ny < 0 || nx >= LARGEUR || ny >= HAUTEUR) continue;
          var c = centre(nx, ny);
          if (libre(c.x, c.y)) return c;
        }
      }
    }
    return centre(APPARITION.x, APPARITION.y);
  }

  // Toutes les tuiles franchissables qu'on atteint à pied depuis l'apparition.
  // Sert aux tests (chaque point d'intérêt doit toucher l'une d'elles) — et à
  // rien d'autre : le jeu, lui, ne calcule pas de chemins.
  function atteignables() {
    var vus = {};
    var pile = [[APPARITION.x, APPARITION.y]];
    vus[APPARITION.x + "," + APPARITION.y] = true;
    while (pile.length) {
      var p = pile.pop(), x = p[0], y = p[1];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var nx = x + d[0], ny = y + d[1], k = nx + "," + ny;
        if (!vus[k] && franchissable(nx, ny)) { vus[k] = true; pile.push([nx, ny]); }
      });
    }
    return vus;
  }

  // Le rang d'une tuile parmi celles du même caractère, en ordre de lecture
  // (rangée par rangée, de gauche à droite). Sert aux sept khatt : le n-ième
  // « V » porte la n-ième valeur de la charte — sans rien coder dans la carte.
  function ordinal(x, y, c) {
    var n = 0;
    for (var yy = 0; yy < HAUTEUR; yy++) for (var xx = 0; xx < LARGEUR; xx++) {
      if (yy === y && xx === x) return tuile(x, y) === c ? n : -1;
      if (tuile(xx, yy) === c) n += 1;
    }
    return -1;
  }

  function pointsInteret() {
    var liste = [];
    for (var y = 0; y < HAUTEUR; y++) for (var x = 0; x < LARGEUR; x++) {
      var c = tuile(x, y);
      if (estPointInteret(c)) liste.push({ x: x, y: y, c: c });
    }
    return liste;
  }

  function dialogue(c, ctx) {
    var d = DIALOGUES[c];
    if (!d) return null;
    var pages = typeof d.pages === "function" ? d.pages(ctx) : d.pages.slice();
    // Le nom peut dépendre du contexte (le khatt porte le nom de sa valeur).
    var nom = typeof d.nom === "function" ? d.nom(ctx) : d.nom;
    return { nom: nom, pages: pages };
  }

  return {
    TUILE: TUILE, LARGEUR: LARGEUR, HAUTEUR: HAUTEUR,
    CARTE: CARTE, LEGENDE: LEGENDE, APPARITION: APPARITION, DIRS: DIRS,
    tuile: tuile, info: info, solide: solide, franchissable: franchissable,
    estPointInteret: estPointInteret, devant: devant, positionValide: positionValide,
    atteignables: atteignables, pointsInteret: pointsInteret, ordinal: ordinal,
    CORPS: CORPS, libre: libre, centre: centre, degager: degager, avancer: avancer,
    DIALOGUES: DIALOGUES, dialogue: dialogue
  };
  }

  // Où l'on apparaît dans la zawia : dans le vestibule, sous le Bab, face à la cour.
  var APPARITION_ZAWIA = { x: 22, y: 6, dir: "bas" };

  // ---- Les dialogues --------------------------------------------------------------
  // Une entrée par caractère. Un tableau = des pages ; une fonction = des pages
  // calculées d'après le contexte { joueur, arb3ine, defis, sna3a, pages, khatt }.
  // Le nom aussi peut être une fonction du contexte. Le nom au-dessus
  // de la boîte est celui du lieu, pas d'un personnage : ici, la maison parle
  // par ses murs. Les gens qui y marchent, eux, parlent dans pnj.js.
  //
  // ⚠️ Le voile (ZAWIA-VOILE.md) s'applique : la maison ne se nomme pas, ni ses
  //    cours. « Le cours d'initiation IA offert par la maison » — pas plus.
  var COCHE = { a_faire: "☐", en_cours: "◔", valide: "☑" };

  var DIALOGUES = {
    "1": { nom: "Le Bab", pages: [
      "Salam, Talib. Tu es à Jami3at al Qarawiyine — l'antre du savoir de Fès, ouverte en 859.",
      "Ici le savoir se transmet gratuitement, de celui qui sait à celui qui arrive. Tu arrives. Marche, regarde, écoute.",
      "Ton Arb3ine a commencé : 40 jours pour les quatre premiers défis de la maison. Le lawh de la Madrasa, à l'est, les tient."
    ] },
    // ⚠️ Le Bab n'ouvre plus cette boîte : depuis le Souk (13/09/2026), jeu.js
    //    l'intercepte et fait sortir le joueur des murs. La phrase, elle, n'est
    //    pas perdue — elle est passée en tête du panneau du Souk. On garde
    //    l'entrée pour que la tuile sache encore se décrire.
    "C": { nom: "Bab al-Mechouar", pages: [
      "La porte du Mechouar — le terre-plein où la garde se montrait. On y va pour être vu, pas pour se cacher."
    ] },
    "G": { nom: "Le Bab", pages: [
      "La porte est ouverte. Elle le reste — c'est la règle de la maison."
    ] },
    "R": { nom: "Bab ar-Rihla", pages: [
      "La porte du temps. Derrière elle, la médina de Fès — telle que Nsyan l'a laissée."
    ] },
    // v5.7 — l'étal (rahba.js) : la cour n'en a pas, mais la tuile sait se décrire.
    "e": { nom: "Un étal", pages: [
      "Un étal du Souk : le tapis d'un marchand, posé dehors des murs — sur la Rahba, passé le Bab."
    ] },
    // v8.7 — le Derb t-Tadamoun (rahba.js dit mieux, sur place) : la cour n'en a pas.
    "a": { nom: "Un arganier", pages: [
      "Un arganier. Il donne à qui sait attendre — et mieux encore à ceux qui récoltent ensemble."
    ] },
    "u": { nom: "Un puits", pages: [
      "Un puits. Au douar, on ne le creuse jamais seul."
    ] },
    "M": { nom: "Le minaret", pages: [
      "Le minaret. Il ne dit pas l'heure : il dit qu'il est temps d'apprendre."
    ] },
    "T": { nom: "Le riad", pages: [
      "Un oranger. Il fleurit sans qu'on le lui demande — comme un projet bien commencé."
    ] },
    "~": { nom: "Les ablutions", pages: [
      "Le bassin des ablutions. On y laisse ce qu'on croit savoir avant d'entrer."
    ] },
    "L": { nom: "Une lanterne", pages: [
      "Une lanterne de laiton. Le soir, c'est à celles-là que la cour s'allume."
    ] },
    "f": { nom: "La fontaine", pages: [
      "La fontaine du Sahn. L'eau vient d'en haut, coule vers tous, et personne ne la garde pour lui.",
      "La Silsila, version plomberie."
    ] },
    "2": { nom: "La Khizana", pages: [
      "الخزانة — La Khizana. La plus vieille bibliothèque du monde encore en activité.",
      "C'est ici que se donnera le cours d'initiation IA offert par la maison. Chaque Talib doit le finir — en entier — pendant son Arb3ine.",
      "Au fond, le sandouq : les pages que Nsyan a arrachées à la Rihla. Ce qu'il a effacé, c'est ici qu'on le retrouve."
    ] },
    "B": { nom: "La Khizana", pages: [
      "Des rayonnages. Ils ont quelques siècles d'avance sur toi — rattrape-les."
    ] },
    "r": { nom: "Un rihal", pages: [
      "Un rihal : le pupitre qui tient le livre ouvert pendant que la main note."
    ] },
    "3": { nom: "La Madrasa", pages: [
      "المدرسة — La Madrasa. Là où les Tolba apprennent — et se comptent.",
      "Le lawh, au fond de la salle, tient ton Arb3ine."
    ] },
    "k": { nom: "Le lawh", pages: function (ctx) {
      ctx = ctx || {};
      var a = ctx.arb3ine, d = ctx.defis || {}, defs = ctx.DEFIS || [];
      var titre = a
        ? (a.ecoule
          ? "Le lawh de l'Arb3ine — les 40 jours sont passés."
          : "Le lawh de l'Arb3ine — " + a.libelle + " · jour " + a.jour + " sur " + a.total + ".")
        : "Le lawh de l'Arb3ine.";
      var lignes = defs.map(function (x) { return (COCHE[d[x.cle]] || COCHE.a_faire) + " " + x.titre; });
      var pages = [
        titre,
        lignes.join("\n"),
        "Aucun défi ne se coche ici : c'est quelqu'un de la maison qui l'accorde, à la halqa, devant tout le monde. Le M39ol se donne, il ne se réclame pas."
      ];
      // v1.3 — le carnet : les trois axes, publics, côte à côte, et qui ne se
      // convertissent jamais l'un dans l'autre.
      if (ctx.carnet) {
        var c = ctx.carnet;
        pages.push(
          "Le carnet de " + (ctx.joueur && ctx.joueur.pseudo ? ctx.joueur.pseudo : "ce Talib") + " :\n" +
          "· M39ol " + c.m39ol.points + " — " + c.m39ol.rang.nom + ", " + c.m39ol.presences + " présence" + (c.m39ol.presences > 1 ? "s" : "") + "\n" +
          "· Sna3a " + c.sna3a.total + " — " + c.sna3a.niveau.nom + "\n" +
          "· Dhakira " + c.dhakira.total + " — " + c.dhakira.niveau.nom
        );
        pages.push(
          "Le M39ol vient des autres : ta présence aux sessions, ce que tu portes, ce que tu tiens. C'est le SEUL des trois qui donne un rang.\n" +
          "La Sna3a se gagne à l'établi, la Dhakira au sandouq — seul, et elles n'achètent aucun rang."
        );
      }
      return pages;
    } },
    // v4.8 — l'établi du prompt : jeu.js ouvre Qlil w mfid ; ceci est le repli.
    "Y": { nom: "L'établi du prompt", pages: [
      "L'établi du prompt. Neuf trous : fais dire au modèle exactement ce qu'on demande, avec le moins de mots possible. Le plus court gagne."
    ] },
    // v4.7 — le lawh du jour : jeu.js ouvre Lkelma d'lyoum ; ceci est le repli.
    "K": { nom: "Le lawh du jour", pages: [
      "Le lawh du jour. Un mot, le même pour tous, six essais — il s'efface à minuit, heure de Fès."
    ] },
    // Le sandouq : jeu.js ouvre la page perdue lui-même ; ceci est le repli
    // (et ce que lit le test) quand personne ne fournit l'état des pages.
    "S": { nom: "Le sandouq", pages: function (ctx) {
      ctx = ctx || {};
      var e = ctx.pages;
      if (!e) return ["Le sandouq des pages perdues. Ce que Nsyan a effacé, c'est ici qu'on le retrouve — une ville à la fois."];
      if (e.complet) return ["Le sandouq est vide : les " + e.total + " pages sont revenues. Nsyan attend qu'on cesse de raconter — alors raconte."];
      return ["Le sandouq des pages perdues — " + e.resolues + " sur " + e.total + " retrouvée" + (e.resolues > 1 ? "s" : "") + ". La prochaine parle de " + (ctx.villeNom || e.prochaine.ville) + ", " + e.prochaine.epoque + "."];
    } },
    // L'établi : jeu.js ouvre le Ta7addi lui-même ; ceci est le repli.
    "E": { nom: "L'établi", pages: function (ctx) {
      ctx = ctx || {};
      var e = ctx.tahaddi;
      if (!e) return ["L'établi des Ta7addi. On y mesure ce qu'on sait faire — pas ce qu'on sait dire."];
      if (e.complet) return ["L'établi est net : les " + e.total + " Ta7addi de la maison sont passés. Les suivants viendront des entreprises, au Souk — ceux-là ne se corrigent pas au clavier, ils se livrent."];
      return ["L'établi des Ta7addi — " + e.reussis + " sur " + e.total + ". Le prochain : « " + e.prochain.titre + " »."];
    } },
    // Un khatt : la valeur est fournie par jeu.js (recit.khatt(ordinal)) ; sans
    // elle, le mur dit au moins ce qu'il est.
    "V": { nom: function (ctx) { return ctx && ctx.khatt && ctx.khatt.nom ? ctx.khatt.nom : "Un khatt"; }, pages: function (ctx) {
      if (ctx && ctx.khatt && ctx.khatt.pages) return ctx.khatt.pages.slice();
      return ["Une calligraphie au mur : une des sept valeurs de la maison. Approche-toi, elle se lit."];
    } },
    "4": { nom: "La Qa3a", pages: [
      "قاعة الدرس — La Qa3a. Seize nefs de colonnes, et au milieu, la halqa.",
      "Les meetups de la maison se tiennent ici. Six semaines, toutes les halqas : c'est le premier défi."
    ] },
    "h": { nom: "La halqa", pages: [
      "Le cercle de la halqa. Le M3ellem s'assied là ; les Tolba autour, tous à la même hauteur.",
      "Personne ne se présente par son titre ici. On se présente par ce qu'on construit."
    ] },
    "Q": { nom: "Le mihrab", pages: [
      "Le mihrab. Tout le monde regarde le même point — c'est ce qui fait une maison."
    ] }
  };
  DIALOGUES["F"] = DIALOGUES["f"];

  var api = monter({ carte: CARTE, legende: LEGENDE, apparition: APPARITION_ZAWIA, dialogues: DIALOGUES });
  api.monter = monter;   // v5.2 — prêtée aux régions (fes.js)
  return api;
});
