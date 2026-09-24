// ZAW'IA — le jeu · L'INTRO : le voyage dans le temps, en six vieilles photos.
//
// Le storytelling d'entrée, joué UNE fois avant la Porte (rejouable par le
// lien de la Porte) : on a voyagé dans le temps, vers l'ère où ce pays
// transmettait le savoir mieux que personne — et on est revenus avec la
// raison d'être de ZAW'IA : accélérer, avec l'IA, la route vers un Maroc
// d'excellence. Horizon 2040.
//
// Chaque scène est une « photo d'époque » : un tableau pixel-art SÉPIA,
// dessiné en code dans un canvas de 192 × 120 — grain de pellicule, cadre
// blanc mangé aux angles, une rayure qui passe. Pas une image hébergée, pas
// une photo empruntée : comme les tuiles de rendu.js et l'Āla de musique.js,
// tout sort du code. Trois raisons — rien à télécharger, rien dont on ne
// détient pas les droits, et le voile n'a rien à craindre d'un pixel.
//
// ⚠️ Jamais le hasard du navigateur : tout sort de `hache()`, reproductible —
//    deux joueurs voient la même photo, et un test peut la regarder. Un test le garde.
// ⚠️ Le récit vise l'OUBLI, jamais un coupable (la règle de recit.js) : Nsyan
//    efface, personne n'a volé. Un test relit les textes.
// ⚠️ Le voile s'applique : la maison ne se nomme pas — ZAW'IA, elle, est
//    publique, c'est son domaine qui sert cette page.
//
// Parties PURES (SCENES, duree, TABLEAUX — qui ne demandent qu'un contexte à
// `fillRect`) : testées sous Node. `creer()` seul touche le document.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.intro = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var LARG = 192, HAUT = 120;   // la photo, en pixels de tableau
  var FOND = "#07100d";         // la nuit derrière la photo (le corps de la page)

  // ---- La palette : un seul bain sépia pour les six photos ------------------------
  var P = {
    cadre: "#efe6d0", cadreOmbre: "#c9bda0", papier: "#e4d6b4",
    ciel: "#3a2d1c", ciel2: "#4a3a24", ciel3: "#5c492e",
    aube: "#8a6a42", aube2: "#a5814f", aube3: "#c09a5e",
    lumiere: "#f2d896", or: "#d9a441", braise: "#e8b96a",
    ombre: "#241a10", ombre2: "#302213", brun: "#54402a", brun2: "#6b5335",
    sable: "#8a6d46", sable2: "#a08051", sable3: "#b5945e",
    pierre: "#7c6440", pierre2: "#93784e", pierre3: "#ab8f5c",
    blanc: "#f4ead2", vert: "#5c5a32",
    grainSombre: "rgba(36, 26, 16, 0.3)", grainClair: "rgba(244, 234, 210, 0.2)",
    voile: "rgba(36, 26, 16, 0.35)"
  };

  // ---- Les six scènes : l'époque, le titre, le texte, la photo --------------------
  // Les textes suivent la hiérarchie des motivations (recit.js) : la
  // transmission d'abord — la vision est une conséquence de la chaîne reprise.
  var SCENES = [
    { cle: "voyage", epoque: "ZAW'IA · avant d'entrer", titre: "On a fait un voyage", tableau: "passage",
      texte: "Pas vers un ailleurs — vers un avant. Les neuf Mourchidine ont ouvert un passage dans le temps, vers l'ère où ce pays transmettait le savoir mieux que personne. Regarde ce qu'on a rapporté." },
    { cle: "qarawiyine", epoque: "859 · Fès", titre: "La première université du monde", tableau: "qarawiyine",
      texte: "Fatima al-Fihriya pose la première pierre de la Qarawiyine. Pas un palais, pas une caserne : une maison de savoir. Douze siècles plus tard, elle enseigne encore — la plus ancienne université du monde en activité." },
    { cle: "halqa", epoque: "Xᵉ siècle · la cour", titre: "Le savoir se donne", tableau: "halqa",
      texte: "Le mou'allim s'assoit, la halqa se forme. Droit, médecine, astronomie, calcul. Ici, savoir c'est transmettre : celui qui apprend enseigne à son tour, et la chaîne — la Silsila — ne se rompt pas." },
    { cle: "routes", epoque: "1355 · les routes", titre: "Le Maroc rayonne", tableau: "routes",
      texte: "Ibn Battuta dicte sa Rihla à Fès : trente ans de routes, du Sahara jusqu'à la Chine. Les caravanes portent l'or et le sel — et les livres. On venait de loin apprendre ici. L'excellence était une habitude." },
    { cle: "nsyan", epoque: "Puis, sans bruit", titre: "Nsyan", tableau: "nsyan",
      texte: "Rien ne s'est cassé d'un coup. On a juste oublié — le nom d'une porte, le sens d'un mot, la fierté du geste. L'oubli ne casse rien, ne vole rien : il efface. Il n'a pas de visage. Dans la maison, on l'appelle Nsyan." },
    { cle: "demain", epoque: "Aujourd'hui → 2040", titre: "La raison d'être", tableau: "demain",
      texte: "On est revenus avec une mission. C'est la raison d'être de ZAW'IA : reprendre la transmission là où elle excellait, avec l'IA pour compagnon — accélérer ce qui se construit. Bâtisseur après bâtisseur : un Maroc d'excellence. Horizon 2040." }
  ];

  // Le temps de lire une scène avant que la suivante vienne d'elle-même.
  function duree(texte) {
    var n = String(texte || "").length;
    return Math.max(6, Math.min(16, 3.5 + n * 0.05));
  }

  // ---- Les outils de dessin (les mêmes gestes que rendu.js) -----------------------
  function px(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w == null ? 1 : w, h == null ? 1 : h); }

  function hache(x, y, s) {
    var n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s || 0, 2246822519)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function cielNuit(c, t, seuil) {
    px(c, P.ciel, 0, 0, LARG, 78);
    px(c, P.ciel2, 0, 50, LARG, 18);
    px(c, P.ciel3, 0, 66, LARG, 12);
    for (var i = 0; i < 40; i++) {
      var sx = Math.floor(hache(i, 1, 11) * LARG), sy = Math.floor(hache(i, 2, 11) * 58);
      if (hache(i, Math.floor(t * 1.5), 13) > (seuil == null ? 0.3 : seuil)) px(c, P.lumiere, sx, sy, 1, 1);
    }
  }

  function croissant(c, cx, cy, r, col) {
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      var plein = dx * dx + dy * dy <= r * r;
      var creux = (dx - 2) * (dx - 2) + (dy - 1) * (dy - 1) <= r * r;
      if (plein && !creux) px(c, col, cx + dx, cy + dy, 1, 1);
    }
  }

  function minaret(c, x, base, h) {
    px(c, P.pierre, x, base - h, 10, h);
    px(c, P.pierre2, x + 1, base - h, 2, h);
    px(c, P.ombre2, x + 8, base - h, 2, h);
    px(c, P.vert, x - 1, base - h - 3, 12, 3);
    px(c, P.pierre3, x + 2, base - h - 7, 6, 4);
    px(c, P.or, x + 4, base - h - 9, 2, 2);
    for (var k = 1; k <= 3; k++) px(c, P.ombre, x + 4, base - Math.floor(h * k / 4), 2, 3);
  }

  function silhouette(c, x, y, col, bras) {
    px(c, col, x + 1, y, 1, 1);
    px(c, col, x, y + 1, 3, 4);
    px(c, col, x, y + 5, 1, 2); px(c, col, x + 2, y + 5, 1, 2);
    if (bras) px(c, col, x + 3, y + 1, 1, 1);
  }

  function palmier(c, x, sol) {
    px(c, P.brun, x, sol - 14, 2, 14);
    px(c, P.vert, x - 5, sol - 16, 5, 2); px(c, P.vert, x + 2, sol - 16, 5, 2);
    px(c, P.vert, x - 3, sol - 18, 3, 2); px(c, P.vert, x + 2, sol - 18, 3, 2);
    px(c, P.vert, x, sol - 19, 2, 2);
  }

  function chameau(c, x, y, pas) {
    px(c, P.ombre, x, y, 10, 4);
    px(c, P.ombre, x + 3, y - 2, 3, 2);
    px(c, P.ombre, x + 9, y - 3, 2, 3);
    px(c, P.ombre, x + 10, y - 4, 2, 2);
    px(c, P.ombre, x + 1 + pas, y + 4, 1, 3);
    px(c, P.ombre, x + 8 - pas, y + 4, 1, 3);
    // la charge : des livres sanglés sur la bosse, un reflet quand le pas porte
    px(c, P.brun2, x + 2, y - 4, 4, 2);
    if (pas) px(c, P.lumiere, x + 3, y - 4, 1, 1);
  }

  // ---- Les six photos --------------------------------------------------------------
  var TABLEAUX = {};

  // 1 · Le passage : la porte que les Mourchidine ont ouverte dans le temps.
  TABLEAUX.passage = function (c, t) {
    cielNuit(c, t);
    px(c, P.ombre2, 0, 78, LARG, HAUT - 78);
    px(c, P.brun, 0, 78, LARG, 2);
    px(c, P.brun, 20, 40, 152, 40);
    px(c, P.brun2, 20, 40, 152, 2);
    for (var m = 24; m < 168; m += 10) px(c, P.brun2, m, 36, 6, 4);
    // l'ouverture en fer à cheval, et sa lumière qui respire
    var souffle = 0.5 + 0.5 * Math.sin(t * 2);
    for (var dy = 0; dy < 34; dy++) {
      var w = dy < 10 ? Math.floor(Math.sqrt(100 - (10 - dy) * (10 - dy)) * 1.3) : 13;
      px(c, dy < 5 ? P.braise : P.lumiere, 96 - w, 46 + dy, w * 2, 1);
    }
    px(c, P.or, 82, 44, 28, 2);
    px(c, P.or, 81, 46, 2, 34); px(c, P.or, 109, 46, 2, 34);
    px(c, "rgba(242, 216, 150, " + (0.08 + 0.08 * souffle).toFixed(3) + ")", 58, 80, 76, 16);
    // la silhouette, de dos, au seuil
    px(c, P.ombre, 94, 60, 4, 3);
    px(c, P.ombre, 93, 63, 6, 11);
    px(c, P.ombre, 93, 74, 2, 5); px(c, P.ombre, 97, 74, 2, 5);
  };

  // 2 · 859 : la Qarawiyine se bâtit, l'aube se lève sur Fès.
  TABLEAUX.qarawiyine = function (c, t) {
    px(c, P.ciel2, 0, 0, LARG, 30); px(c, P.aube, 0, 30, LARG, 22);
    px(c, P.aube2, 0, 52, LARG, 16); px(c, P.aube3, 0, 68, LARG, 10);
    croissant(c, 30, 16, 5, P.lumiere);
    for (var i = 0; i < 12; i++) {
      if (hache(i, Math.floor(t), 21) > 0.5) px(c, P.lumiere, Math.floor(hache(i, 1, 21) * LARG), Math.floor(hache(i, 2, 21) * 22), 1, 1);
    }
    px(c, P.sable, 0, 78, LARG, HAUT - 78);
    // la muraille en chantier : les assises, l'échafaudage
    px(c, P.pierre, 14, 58, 62, 20);
    for (var r = 0; r < 5; r++) {
      px(c, P.ombre2, 14, 61 + r * 4, 62, 1);
      for (var b = 14 + ((r & 1) ? 5 : 0); b < 72; b += 10) px(c, P.ombre2, b, 58 + r * 4, 1, 3);
    }
    px(c, P.pierre2, 14, 54, 30, 4);   // la dernière assise, en cours
    px(c, P.brun2, 20, 38, 1, 40); px(c, P.brun2, 48, 38, 1, 40);
    px(c, P.brun2, 16, 44, 40, 1); px(c, P.brun2, 16, 56, 44, 1);
    // le corps de la mosquée, et le minaret
    px(c, P.pierre2, 96, 62, 40, 16);
    px(c, P.vert, 94, 58, 44, 4);
    for (var a = 100; a < 132; a += 8) px(c, P.ombre2, a, 68, 4, 10);
    minaret(c, 142, 78, 44);
    // les bâtisseurs — et la fondatrice, un peu à part, qui regarde monter
    var pas = Math.floor(t * 2) % 2;
    silhouette(c, 30, 84, P.ombre2, pas);
    silhouette(c, 46, 88, P.ombre2, 1 - pas);
    px(c, P.blanc, 79, 78, 2, 2); px(c, P.blanc, 78, 80, 4, 8);
    px(c, P.or, 79, 77, 2, 1);
    palmier(c, 172, 78);
  };

  // 3 · La halqa — et sa version pâlie, que Nsyan mange (photo 5).
  function peindreHalqa(c, t, pale) {
    var F = pale
      ? { mur: P.sable3, creux: P.sable, sol: P.sable2, trame: P.sable3, ombre: P.brun, or: P.aube3, blanc: P.papier }
      : { mur: P.pierre2, creux: P.ombre2, sol: P.brun2, trame: P.brun, ombre: P.ombre, or: P.or, blanc: P.blanc };
    px(c, F.mur, 0, 0, LARG, 70);
    for (var a = 0; a < 5; a++) {
      var ax = 14 + a * 34;
      px(c, F.creux, ax + 2, 18, 12, 42);
      px(c, F.creux, ax + 4, 15, 8, 3);
      px(c, F.blanc, ax, 18, 2, 42); px(c, F.blanc, ax + 14, 18, 2, 42);
    }
    px(c, F.sol, 0, 70, LARG, 50);
    for (var yy = 73; yy < HAUT; yy += 3) px(c, F.trame, 0, yy, LARG, 1);
    // la lampe qui respire au-dessus du cercle
    px(c, F.or, 95, 4, 2, 12);
    px(c, F.or, 92, 16, 8, 6);
    if (!pale && Math.floor(t * 4) % 3 !== 0) px(c, P.lumiere, 94, 18, 4, 2);
    px(c, "rgba(242, 216, 150, 0.1)", 74, 24, 44, 34);
    // le mou'allim : le turban, le livre, la main qui bat la leçon
    px(c, F.ombre, 92, 58, 8, 10);
    px(c, F.ombre, 94, 54, 4, 4);
    px(c, F.blanc, 93, 53, 6, 2);
    var main = Math.floor(t * 2) % 2;
    px(c, F.ombre, main ? 101 : 100, main ? 60 : 63, 2, 1);
    px(c, F.blanc, 93, 69, 6, 3);
    // la halqa : huit tolba, chacun sa page sur les genoux
    var places = [[60, 72], [72, 78], [86, 84], [104, 84], [118, 78], [130, 72], [70, 92], [122, 92]];
    for (var i = 0; i < places.length; i++) {
      var p = places[i];
      px(c, F.ombre, p[0], p[1], 5, 6);
      px(c, F.ombre, p[0] + 1, p[1] - 3, 3, 3);
      px(c, F.blanc, p[0] + 1, p[1] + 6, 3, 2);
    }
    if (!pale && Math.floor(t * 3) % 2) px(c, F.blanc, 99, 68, 1, 1);
  }
  TABLEAUX.halqa = function (c, t) { peindreHalqa(c, t, false); };

  // 4 · 1355 : la caravane sous les étoiles — les livres voyagent aussi.
  TABLEAUX.routes = function (c, t) {
    cielNuit(c, t, 0.25);
    croissant(c, 160, 14, 6, P.lumiere);
    px(c, P.sable, 0, 70, LARG, 50);
    for (var x = 0; x < LARG; x++) {
      var y1 = 72 + Math.floor(5 * Math.sin(x / 22));
      px(c, P.sable3, x, y1, 1, Math.max(1, 86 - y1));
      px(c, P.sable2, x, 92 + Math.floor(3 * Math.sin(x / 30 + 2)), 1, 4);
    }
    var pas = Math.floor(t * 3) % 2;
    for (var k = 0; k < 4; k++) {
      var cx = 28 + k * 36;
      chameau(c, cx, 62 + Math.floor(2 * Math.sin(cx / 22)) + ((k % 2 === pas) ? 0 : 1), (k + pas) % 2);
    }
    // le meneur à pied, la lanterne à la main
    px(c, P.ombre, 16, 62, 3, 6); px(c, P.ombre, 17, 60, 1, 2);
    px(c, Math.floor(t * 4) % 4 ? P.lumiere : P.braise, 14, 65, 2, 2);
    // le vent porte quelques grains de sable
    for (var i = 0; i < 6; i++) {
      px(c, P.sable3, Math.floor(hache(i, 1, 41) * LARG + t * 30) % LARG, 58 + Math.floor(hache(i, 2, 41) * 22), 1, 1);
    }
  };

  // 5 · Nsyan : la même photo de la halqa, pâlie — et des morceaux manquent.
  TABLEAUX.nsyan = function (c, t) {
    peindreHalqa(c, 0, true);
    var n = Math.min(26, 8 + Math.floor(t * 2));
    for (var i = 0; i < n; i++) {
      var ex = Math.floor(hache(i, 4, 31) * (LARG - 14)), ey = Math.floor(hache(i, 5, 31) * (HAUT - 12));
      var ew = 4 + Math.floor(hache(i, 6, 31) * 14), eh = 3 + Math.floor(hache(i, 7, 31) * 8);
      px(c, P.papier, ex, ey, ew, eh);
      px(c, P.cadreOmbre, ex, ey + eh - 1, ew, 1);
    }
    // les pages arrachées s'en vont vers le bord
    for (var k = 0; k < 3; k++) {
      var fx = (Math.floor(t * 22) + k * 64) % (LARG + 28) - 14;
      var fy = 24 + k * 26 + Math.floor(3 * Math.sin(t * 3 + k * 2));
      px(c, P.blanc, fx, fy, 5, 4);
      px(c, P.cadreOmbre, fx, fy + 3, 5, 1);
    }
    px(c, "rgba(36, 26, 16, 0.18)", 0, 0, LARG, HAUT);
  };

  // 6 · Aujourd'hui → 2040 : la médina et la ville qui vient, reliées d'un fil d'or.
  TABLEAUX.demain = function (c, t) {
    px(c, P.aube, 0, 0, LARG, 26); px(c, P.aube2, 0, 26, LARG, 22);
    px(c, P.aube3, 0, 48, LARG, 16); px(c, P.lumiere, 0, 62, LARG, 4);
    for (var dy = 0; dy < 7; dy++) {
      var w = Math.floor(Math.sqrt(49 - dy * dy));
      px(c, P.lumiere, 96 - w, 66 - dy, 2 * w, 1);
    }
    px(c, P.sable2, 0, 66, LARG, HAUT - 66);
    // à gauche, la médina : la muraille et le minaret
    px(c, P.pierre, 8, 56, 36, 12);
    for (var m = 10; m < 42; m += 8) px(c, P.pierre2, m, 52, 4, 4);
    minaret(c, 24, 66, 40);
    palmier(c, 54, 66);
    // à droite, la ville qui vient : deux tours sobres, l'éolienne, les panneaux
    px(c, P.pierre2, 146, 34, 10, 32);
    px(c, P.pierre3, 160, 42, 8, 24);
    for (var f = 0; f < 6; f++) {
      if (hache(f, Math.floor(t * 2), 71) > 0.3) px(c, P.lumiere, 148 + (f % 2) * 4, 38 + Math.floor(f / 2) * 8, 2, 2);
    }
    px(c, P.brun2, 178, 48, 1, 18);
    var helice = Math.floor(t * 5) % 4;
    var pales = [[[-3, 0], [3, 0], [0, -3]], [[-2, -2], [2, -2], [0, 3]], [[-3, 1], [3, -1], [1, -3]], [[-2, 2], [2, 2], [0, -3]]][helice];
    for (var pl = 0; pl < 3; pl++) px(c, P.blanc, 178 + pales[pl][0], 47 + pales[pl][1], 1, 1);
    px(c, P.ciel2, 138, 72, 16, 3); px(c, P.ciel2, 138, 77, 16, 3);
    if (Math.floor(t * 3) % 2) px(c, P.lumiere, 144, 72, 2, 1);
    // le fil d'or : de l'ancienne maison de savoir vers ce qui se construit
    for (var i = 0; i < 24; i++) {
      var fx = 32 + i * 5, fy = 22 - Math.floor(10 * Math.sin(Math.PI * i / 23));
      if ((i - Math.floor(t * 8)) % 4 === 0) px(c, P.or, fx, fy, 2, 1);
      else px(c, "rgba(217, 164, 65, 0.35)", fx, fy, 1, 1);
    }
    // les bâtisseurs, entre les deux — c'est eux, le pont
    var pas = Math.floor(t * 2) % 2;
    silhouette(c, 86, 84, P.ombre2, pas);
    silhouette(c, 98, 88, P.ombre2, 1 - pas);
    silhouette(c, 110, 84, P.ombre2, pas);
  };

  // ---- La pellicule : le grain, la rayure, le cadre --------------------------------
  function pellicule(c, t) {
    var image = Math.floor(t * 9);
    for (var i = 0; i < 70; i++) {
      if (hache(i, image, 51) < 0.72) continue;
      px(c, hache(i, image, 59) > 0.5 ? P.grainSombre : P.grainClair,
        Math.floor(hache(i, image, 53) * LARG), Math.floor(hache(i, image, 57) * HAUT), 1, 1);
    }
    var raie = Math.floor(t * 2);
    if (hache(raie, 1, 61) > 0.8) px(c, P.grainClair, 4 + Math.floor(hache(raie, 2, 61) * (LARG - 8)), 4, 1, HAUT - 8);
    // le vignettage, dans le cadre
    px(c, P.voile, 4, 4, LARG - 8, 2); px(c, P.voile, 4, HAUT - 6, LARG - 8, 2);
    px(c, P.voile, 4, 4, 2, HAUT - 8); px(c, P.voile, LARG - 6, 4, 2, HAUT - 8);
  }

  function cadre(c) {
    px(c, P.cadre, 0, 0, LARG, 4); px(c, P.cadre, 0, HAUT - 4, LARG, 4);
    px(c, P.cadre, 0, 0, 4, HAUT); px(c, P.cadre, LARG - 4, 0, 4, HAUT);
    px(c, P.cadreOmbre, 4, 4, LARG - 8, 1); px(c, P.cadreOmbre, 4, HAUT - 5, LARG - 8, 1);
    px(c, P.cadreOmbre, 4, 4, 1, HAUT - 8); px(c, P.cadreOmbre, LARG - 5, 4, 1, HAUT - 8);
    // les angles mangés par le temps
    px(c, FOND, 0, 0, 3, 1); px(c, FOND, 0, 0, 1, 3);
    px(c, FOND, LARG - 2, HAUT - 1, 2, 1); px(c, FOND, LARG - 1, HAUT - 2, 1, 2);
  }

  // La photo entière, dans un contexte 2D quelconque — y compris un bouchon de test.
  function peindre(c, indexScene, t) {
    var sc = SCENES[indexScene] || SCENES[0];
    TABLEAUX[sc.tableau](c, t || 0);
    pellicule(c, t || 0);
    cadre(c);
  }

  // ---- Le projecteur (navigateur seulement) ----------------------------------------
  function creer(canvas) {
    var c = canvas.getContext("2d");
    var off = document.createElement("canvas");
    off.width = LARG; off.height = HAUT;
    var oc = off.getContext("2d");
    function redimensionner() {
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    }
    function rendre(indexScene, t) {
      peindre(oc, indexScene, t);
      c.imageSmoothingEnabled = false;
      c.fillStyle = FOND;
      c.fillRect(0, 0, canvas.width, canvas.height);
      // la photo tient au-dessus du texte : 92 % de la largeur, 58 % de la
      // hauteur — et se centre dans l'espace restant (un téléphone est haut).
      var z = Math.max(1, Math.min(canvas.width * 0.92 / LARG, canvas.height * 0.58 / HAUT));
      var w = Math.round(LARG * z), h = Math.round(HAUT * z);
      var y = Math.max(Math.round(canvas.height * 0.05), Math.round((canvas.height * 0.62 - h) / 2));
      c.drawImage(off, Math.round((canvas.width - w) / 2), y, w, h);
    }
    return { rendre: rendre, redimensionner: redimensionner };
  }

  return { LARG: LARG, HAUT: HAUT, SCENES: SCENES, TABLEAUX: TABLEAUX, duree: duree, peindre: peindre, creer: creer };
});
