// ZAW'IA — le jeu · LE RENDU : le monde PEINT (v3.0), et le pixel en repli.
//
// Depuis le 14/09/2026 au soir (décision de Youssef : « le monde en peinture »),
// les tuiles et les personnages sont LUS dans une planche peinte —
// assets/img/zawia/jeu/tuiles.webp, 96 px la tuile source, 48 px CSS à
// l'écran, décrite par tuiles.json — et atlas.js dit quelle image va sur
// quelle case (c'est lui qui porte les variantes par voisinage, testées sous
// Node). Ici : le chargement, la caméra, l'ordre de dessin, la teinte des
// personnages (gris → djellaba, vert → peau, magenta → cheveux), l'eau en
// deux images fondues l'une dans l'autre, et l'agrandissement AVEC lissage.
//
// Le pixel-art procédural des versions 1.0 → 2.6 reste ici en entier, en
// REPLI RÉEL : si la planche ne descend pas (réseau, fichier absent), la cour
// se dessine comme avant — jamais un écran noir avec tous les tests verts.
// Tant que la planche charge, la scène reste voilée (sombre), pas en pixel :
// on ne montre pas deux mondes à la suite.
//
// ⚠️ PLANCHE.version suit le ?v= des scripts (un test le garde) : /assets/*
// est servi immutable un an, une planche remplacée sans bump ne descendrait
// jamais.
//
// Dépend de regles.js (palette de l'avatar), monde.js (la carte) et atlas.js.
// Navigateur seulement : rien ici n'est testé sous Node, et c'est voulu.
(function (root) {
  "use strict";
  var ZWJ = root.ZWJ = root.ZWJ || {};
  var regles = ZWJ.regles, monde = ZWJ.monde;
  if (!regles || !monde) throw new Error("rendu.js : charger regles.js et monde.js avant.");

  var T = monde.TUILE;      // 16
  var PL = 16, PH = 22;     // le personnage : 16 de large, 22 de haut (dont 1 rangée de contour sous les pieds)

  // ---- La palette du monde ------------------------------------------------------
  var P = {
    contour: "#1d1a2e",
    dehors: "#0b1815", dehors2: "#102420",
    sol: "#e6dac2", sol2: "#dccfb3", solJoint: "#cfc0a1",
    marbre: "#ece3cd", marbre2: "#e1d6bb", marbreJoint: "#c9ba9a", marbreOmbre: "#b5a585",
    zelligeVert: "#1f8a5e", zelligeBleu: "#2f5fa8", zelligeOr: "#d9a441", zelligeBlanc: "#f7f1e1", zelligeNoir: "#20242a",
    bejmat: "#c4744c", bejmat2: "#b46540", bejmatJoint: "#8d4a2d",
    natte: "#dac79f", natte2: "#cdb98e", natte3: "#bda67a",
    tapisRouge: "#b23a3f", tapisRougeFonce: "#8b2a30", tapisVert: "#2c7d5a", tapisVertFonce: "#1f5f44", tapisOr: "#e2b64c", tapisCreme: "#f1e3c2",
    mur: "#d9bb87", murHaut: "#f0dfb9", murOmbre: "#b7935c", murJoint: "#c9aa74", friseFond: "#f4ecd9",
    arche: "#3a2a22", archeBord: "#e2b64c",
    bois: "#7c4b2a", boisClair: "#a9703f", boisFonce: "#4d2b16",
    colonne: "#f3ecda", colonneClair: "#fffaf0", colonneOmbre: "#b9ad93", colonneBase: "#d8cdb1",
    eau: "#3ba1d9", eau2: "#7fd0f2", eauFonce: "#2a7fb5",
    laiton: "#e0b34a", laitonFonce: "#9a7524", lueur: "#fff2b8",
    feuille: "#2f8f4e", feuille2: "#49b56a", feuilleOmbre: "#1f6a3a", orange: "#f28c28", orangeClair: "#ffb457",
    terre: "#6d4a2e", fleur1: "#e75a7c", fleur2: "#f5d442", fleur3: "#f8f4ea", bordure: "#cfc0a1",
    minaret: "#f1e9d6", minaretOmbre: "#cbbfa4", minaretOmbre2: "#b5a889", minaretVert: "#1f8a5e",
    coussin: "#8e2c3e", coussinClair: "#b54458", coussinOmbre: "#5e1c29",
    craie: "#f4ecd9", lawh: "#2b3a33", nicheFond: "#0f3d2e",
    page: "#f6efdc", pageOmbre: "#d9ccae", encre: "#3a2a22",
    tarbouche: "#b8242f", tarboucheOmbre: "#8a1a23", cheveux: "#3a2416", taqiya: "#f8f4ea", taqiyaPoint: "#d8d0bd",
    turban: "#f2e9d2", turbanPli: "#d4c8aa", babouche: "#e8c15a", baboucheOmbre: "#b48f2e", oeil: "#20242a"
  };

  function hache(x, y, s) {
    var n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s || 0, 2246822519)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function px(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w == null ? 1 : w, h == null ? 1 : h); }

  // Un losange centré sur le pixel (cx, cy), de rayon r.
  function losange(c, col, cx, cy, r) {
    for (var dy = -r; dy <= r; dy++) { var w = r - Math.abs(dy); px(c, col, cx - w, cy + dy, 2 * w + 1, 1); }
  }
  // Un disque plein centré sur (cx, cy).
  function disque(c, col, cx, cy, r) {
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r * 0.6) px(c, col, cx + dx, cy + dy, 1, 1);
  }

  // ---- Les tuiles -------------------------------------------------------------------------
  // Signature : (ctx, ox, oy, x, y, v, t) — ox/oy l'origine en pixels, x/y la
  // tuile, v(dx, dy) le caractère voisin, t le temps (secondes) pour l'eau.
  var TUILES = {};

  TUILES["w"] = function (c, ox, oy, x, y) {
    px(c, P.dehors, ox, oy, T, T);
    for (var i = 0; i < 3; i++) px(c, P.dehors2, ox + Math.floor(hache(x, y, i) * T), oy + Math.floor(hache(x, y, i + 9) * T), 2, 1);
  };

  TUILES["_"] = function (c, ox, oy, x, y) {
    px(c, P.sol, ox, oy, T, T);
    for (var i = 0; i < 4; i++) px(c, P.sol2, ox + Math.floor(hache(x, y, i) * T), oy + Math.floor(hache(x, y, i + 5) * T), 1, 1);
    px(c, P.solJoint, ox, oy + 15, T, 1); px(c, P.solJoint, ox + 15, oy, 1, T);
  };

  TUILES["."] = function (c, ox, oy, x, y) {
    var pair = ((x + y) & 1) === 0;
    px(c, pair ? P.marbre : P.marbre2, ox, oy, T, T);
    px(c, P.marbreJoint, ox, oy + 15, T, 1); px(c, P.marbreJoint, ox + 15, oy, 1, T);
    if (pair) {
      var col = [P.zelligeVert, P.zelligeBleu, P.zelligeOr][(x * 7 + y * 3) % 3];
      losange(c, col, ox + 7, oy + 7, 3);
      px(c, P.zelligeBlanc, ox + 7, oy + 7, 1, 1);
    } else {
      px(c, P.zelligeNoir, ox + 7, oy + 7, 1, 1);
    }
  };

  TUILES[","] = function (c, ox, oy, x, y) {
    px(c, P.bejmatJoint, ox, oy, T, T);
    for (var r = 0; r < 4; r++) {
      var off = (r & 1) ? 4 : 0;
      for (var b = -1; b < 3; b++) {
        var bx = b * 8 + off, x0 = Math.max(0, bx), x1 = Math.min(T, bx + 7);
        if (x1 > x0) px(c, ((b + r + x * 2 + y) & 1) ? P.bejmat : P.bejmat2, ox + x0, oy + r * 4, x1 - x0, 3);
      }
    }
  };

  TUILES[":"] = function (c, ox, oy, x) {
    px(c, P.natte, ox, oy, T, T);
    for (var yy = 1; yy < T; yy += 2) px(c, P.natte2, ox, oy + yy, T, 1);
    for (var xx = (x & 1) ? 2 : 0; xx < T; xx += 4) px(c, P.natte3, ox + xx, oy, 1, T);
  };

  function tapis(ch, fond, fonce) {
    return function (c, ox, oy, x, y, v) {
      px(c, fond, ox, oy, T, T);
      if (v(0, -1) !== ch) { px(c, fonce, ox, oy, T, 2); px(c, P.tapisCreme, ox, oy + 2, T, 1); }
      if (v(0, 1) !== ch) { px(c, fonce, ox, oy + 14, T, 2); px(c, P.tapisCreme, ox, oy + 13, T, 1); }
      var k;
      if (v(-1, 0) !== ch) for (k = 1; k < T; k += 2) px(c, P.tapisCreme, ox, oy + k, 1, 1);
      if (v(1, 0) !== ch) for (k = 1; k < T; k += 2) px(c, P.tapisCreme, ox + 15, oy + k, 1, 1);
      if ((x & 1) === 0) { losange(c, P.tapisOr, ox + 7, oy + 7, 2); px(c, P.tapisCreme, ox + 7, oy + 7, 1, 1); }
      else px(c, P.tapisCreme, ox + 7, oy + 7, 2, 2);
      px(c, fonce, ox + 2, oy + 5); px(c, fonce, ox + 13, oy + 5); px(c, fonce, ox + 2, oy + 10); px(c, fonce, ox + 13, oy + 10);
    };
  }
  TUILES["="] = tapis("=", P.tapisRouge, P.tapisRougeFonce);
  TUILES["-"] = tapis("-", P.tapisVert, P.tapisVertFonce);

  TUILES["p"] = function (c, ox, oy) {
    px(c, P.marbre, ox, oy, T, T);
    px(c, P.marbreJoint, ox, oy + 15, T, 1); px(c, P.marbreJoint, ox + 15, oy, 1, T);
    losange(c, P.zelligeVert, ox + 7, oy + 7, 4);
    px(c, P.zelligeOr, ox + 6, oy + 6, 3, 3); px(c, P.zelligeBlanc, ox + 7, oy + 7, 1, 1);
    px(c, P.zelligeBleu, ox + 7, oy + 1); px(c, P.zelligeBleu, ox + 7, oy + 13); px(c, P.zelligeBleu, ox + 1, oy + 7); px(c, P.zelligeBleu, ox + 13, oy + 7);
  };

  TUILES["D"] = function (c, ox, oy, x, y, v) {
    px(c, P.marbre2, ox, oy, T, T); px(c, P.marbreJoint, ox, oy + 15, T, 1);
    px(c, P.murOmbre, ox, oy, T, 2);
    if (v(-1, 0) !== "D") { px(c, P.bois, ox, oy + 2, 2, 12); px(c, P.boisFonce, ox + 1, oy + 2, 1, 12); px(c, P.laiton, ox, oy + 7); }
    if (v(1, 0) !== "D") { px(c, P.bois, ox + 14, oy + 2, 2, 12); px(c, P.boisFonce, ox + 14, oy + 2, 1, 12); px(c, P.laiton, ox + 15, oy + 7); }
  };

  function mur(c, ox, oy, x, y, v, frise) {
    px(c, P.mur, ox, oy, T, T);
    px(c, P.murHaut, ox, oy, T, 3);
    px(c, P.murOmbre, ox, oy + 14, T, 2);
    // pierres de taille : deux lits de mortier, joints verticaux en quinconce
    var q = (x + y) & 1;
    px(c, P.murJoint, ox, oy + 7, T, 1); px(c, P.murJoint, ox, oy + 11, T, 1);
    px(c, P.murJoint, ox + (q ? 4 : 10), oy + 3, 1, 4); px(c, P.murJoint, ox + (q ? 11 : 5), oy + 8, 1, 3); px(c, P.murJoint, ox + (q ? 7 : 2), oy + 12, 1, 2);
    if (frise && !monde.solide(x, y + 1)) {
      px(c, P.friseFond, ox, oy + 6, T, 4);
      for (var k = 0; k < T; k += 4) px(c, [P.zelligeVert, P.zelligeBleu][((k >> 2) + x) & 1], ox + k + 1, oy + 7, 2, 2);
    }
  }
  TUILES["#"] = function (c, ox, oy, x, y, v) { mur(c, ox, oy, x, y, v, true); };
  TUILES["X"] = TUILES["#"];   // v3.3 — la porte du Majliss : un mur pour qui n'en est pas
  TUILES["P"] = TUILES["#"];   // v8.0 — la Rkhama : un mur de plus en repli pixel (jeu.js y grave la dalle)

  TUILES["A"] = function (c, ox, oy, x, y, v) {
    mur(c, ox, oy, x, y, v, false);
    px(c, P.arche, ox + 3, oy + 8, 10, 8);
    px(c, P.arche, ox + 4, oy + 6, 8, 2); px(c, P.arche, ox + 5, oy + 5, 6, 1); px(c, P.arche, ox + 6, oy + 4, 4, 1);
    px(c, P.arche, ox + 2, oy + 9, 12, 3);
    for (var k = 0; k < 3; k++) px(c, P.boisClair, ox + 4 + k * 4, oy + 8, 1, 8);
    px(c, P.boisClair, ox + 3, oy + 11, 10, 1); px(c, P.boisClair, ox + 3, oy + 14, 10, 1);
    px(c, P.archeBord, ox + 6, oy + 3, 4, 1); px(c, P.archeBord, ox + 4, oy + 5, 2, 1); px(c, P.archeBord, ox + 10, oy + 5, 2, 1);
    px(c, P.archeBord, ox + 3, oy + 7); px(c, P.archeBord, ox + 12, oy + 7);
  };

  // Le sol d'un objet posé : celui de la pièce (voisin de gauche/droite, puis
  // du haut, puis du bas). Un objet ne flotte jamais sur du noir.
  function fondPour(x, y) {
    var ordre = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var i = 0; i < ordre.length; i++) {
      var ch = monde.tuile(x + ordre[i][0], y + ordre[i][1]);
      if (!monde.solide(x + ordre[i][0], y + ordre[i][1]) && TUILES[ch]) return ch;
    }
    return "_";
  }
  function fond(c, ox, oy, x, y, v) { TUILES[fondPour(x, y)](c, ox, oy, x, y, v); }

  TUILES["|"] = function (c, ox, oy, x, y, v) {
    fond(c, ox, oy, x, y, v);
    px(c, P.colonneOmbre, ox + 3, oy + 4, 10, 10);
    px(c, P.colonneBase, ox + 3, oy + 3, 10, 10);
    px(c, P.colonneOmbre, ox + 4, oy + 12, 9, 1);
    disque(c, P.colonneOmbre, ox + 8, oy + 9, 4);
    disque(c, P.colonne, ox + 8, oy + 8, 4);
    px(c, P.colonneClair, ox + 6, oy + 6, 2, 2);
  };

  TUILES["M"] = function (c, ox, oy, x, y, v) {
    px(c, P.minaret, ox, oy, T, T);
    var haut = v(0, -1) !== "M", bas = v(0, 1) !== "M", droite = v(1, 0) !== "M";
    var k;
    if (droite) px(c, P.minaretOmbre, ox + 13, oy, 3, T);
    if (haut) {
      px(c, P.minaretVert, ox, oy + 1, T, 3);
      for (k = 0; k < T; k += 4) px(c, P.minaret, ox + k + 1, oy, 2, 1);
      for (k = 0; k < T; k += 4) px(c, P.zelligeOr, ox + k + 2, oy + 2, 1, 1);
    } else if (bas) {
      px(c, P.minaretOmbre2, ox, oy + 13, T, 3);
    } else if (y % 3 === 1) {
      for (k = 0; k < T; k += 4) px(c, [P.minaretVert, P.zelligeBleu][((k >> 2) + x) & 1], ox + k + 1, oy + 6, 2, 2);
    } else if (y % 3 === 2 && (x & 1) === 0) {
      px(c, P.arche, ox + 7, oy + 4, 2, 8); px(c, P.archeBord, ox + 7, oy + 3, 2, 1);
    }
  };

  TUILES["G"] = function (c, ox, oy, x, y, v) {
    px(c, P.mur, ox, oy, T, T); px(c, P.murHaut, ox, oy, T, 2);
    var gauche = v(-1, 0) !== "G";
    px(c, P.bois, ox, oy + 2, T, 14);
    for (var k = 0; k < T; k += 4) px(c, P.boisFonce, ox + k, oy + 2, 1, 14);
    for (var yy = 5; yy < 15; yy += 4) for (var xx = 2; xx < T; xx += 4) px(c, P.laiton, ox + xx, oy + yy);
    if (gauche) { px(c, P.boisFonce, ox + 15, oy + 2, 1, 14); px(c, P.laiton, ox + 12, oy + 8, 2, 2); }
    else { px(c, P.boisFonce, ox, oy + 2, 1, 14); px(c, P.laiton, ox + 2, oy + 8, 2, 2); }
    px(c, P.laiton, ox, oy + 2, T, 1);
  };

  function eau(c, ox, oy, x, y, t) {
    px(c, P.eau, ox, oy, T, T);
    for (var k = 0; k < 3; k++) {
      var rx = Math.floor((hache(x, y, k) * T + t * 5 * (k + 1)) % T), ry = Math.floor(hache(x, y, k + 3) * T);
      px(c, k === 1 ? P.eauFonce : P.eau2, ox + rx, oy + ry, Math.min(3, T - rx), 1);
    }
  }
  TUILES["F"] = function (c, ox, oy, x, y, v, t) { eau(c, ox, oy, x, y, t || 0); };

  TUILES["f"] = function (c, ox, oy, x, y, v) {
    px(c, P.marbre, ox, oy, T, T);
    px(c, P.marbreJoint, ox, oy + 15, T, 1); px(c, P.marbreJoint, ox + 15, oy, 1, T);
    var cols = [P.zelligeVert, P.zelligeBlanc, P.zelligeBleu, P.zelligeBlanc];
    for (var k = 0; k < T; k += 4) {
      px(c, cols[(k >> 2) & 3], ox + k + 1, oy + 2, 2, 2); px(c, cols[((k >> 2) + 1) & 3], ox + k + 1, oy + 12, 2, 2);
      px(c, cols[((k >> 2) + 2) & 3], ox + 2, oy + k + 1, 2, 2); px(c, cols[((k >> 2) + 3) & 3], ox + 12, oy + k + 1, 2, 2);
    }
    if (v(1, 0) === "F") px(c, P.marbreOmbre, ox + 14, oy, 2, T);
    if (v(-1, 0) === "F") px(c, P.marbreOmbre, ox, oy, 2, T);
    if (v(0, 1) === "F") px(c, P.marbreOmbre, ox, oy + 14, T, 2);
    if (v(0, -1) === "F") px(c, P.marbreOmbre, ox, oy, T, 2);
  };

  TUILES["~"] = function (c, ox, oy, x, y, v, t) {
    eau(c, ox, oy, x, y, t || 0);
    if (v(0, -1) !== "~") { px(c, P.marbre, ox, oy, T, 3); px(c, P.marbreOmbre, ox, oy + 3, T, 1); }
    if (v(0, 1) !== "~") { px(c, P.marbre, ox, oy + 13, T, 3); px(c, P.marbreOmbre, ox, oy + 12, T, 1); }
    if (v(-1, 0) !== "~") { px(c, P.marbre, ox, oy, 3, T); px(c, P.marbreOmbre, ox + 3, oy, 1, T); }
    if (v(1, 0) !== "~") { px(c, P.marbre, ox + 13, oy, 3, T); px(c, P.marbreOmbre, ox + 12, oy, 1, T); }
  };

  TUILES["T"] = function (c, ox, oy, x, y, v) {
    fond(c, ox, oy, x, y, v);
    disque(c, P.feuilleOmbre, ox + 8, oy + 9, 6);
    disque(c, P.feuille, ox + 8, oy + 8, 6);
    disque(c, P.feuille2, ox + 6, oy + 6, 3);
    [[5, 9], [10, 5], [11, 10], [6, 4]].forEach(function (p) { px(c, P.orange, ox + p[0], oy + p[1], 2, 2); px(c, P.orangeClair, ox + p[0], oy + p[1]); });
  };

  TUILES["g"] = function (c, ox, oy, x, y, v) {
    px(c, P.terre, ox, oy, T, T);
    if (v(0, -1) !== "g") px(c, P.bordure, ox, oy, T, 2);
    if (v(0, 1) !== "g") px(c, P.bordure, ox, oy + 14, T, 2);
    if (v(-1, 0) !== "g") px(c, P.bordure, ox, oy, 2, T);
    if (v(1, 0) !== "g") px(c, P.bordure, ox + 14, oy, 2, T);
    [[3, 4], [9, 3], [5, 10], [11, 9], [7, 7]].forEach(function (p, i) { px(c, i % 2 ? P.feuille : P.feuille2, ox + p[0], oy + p[1], 2, 2); });
    [[4, 3], [10, 4], [6, 9], [12, 10]].forEach(function (p, i) { px(c, [P.fleur1, P.fleur2, P.fleur3, P.fleur1][(i + x + y) & 3], ox + p[0], oy + p[1]); });
  };

  TUILES["B"] = function (c, ox, oy, x, y) {
    px(c, P.boisFonce, ox, oy, T, T);
    px(c, P.bois, ox + 1, oy + 1, 14, 14);
    var couleurs = ["#8a2b3c", "#3b4d9c", "#1f8a5e", "#d9a441", "#efe6d3", "#cf6b45", "#6a7dff", "#2a3440"];
    for (var r = 0; r < 3; r++) {
      var sy = oy + 2 + r * 4;
      px(c, P.boisClair, ox + 1, sy + 4, 14, 1);
      for (var b = 0; b < 6; b++) {
        var col = couleurs[Math.floor(hache(x, y, r * 6 + b) * couleurs.length)];
        var h = hache(x, y, 100 + r * 6 + b) > 0.5 ? 4 : 3;
        px(c, col, ox + 2 + b * 2, sy + (4 - h), 2, h);
      }
    }
  };

  TUILES["L"] = function (c, ox, oy, x, y, v) {
    fond(c, ox, oy, x, y, v);
    c.globalAlpha = 0.28; disque(c, P.lueur, ox + 8, oy + 5, 7); c.globalAlpha = 1;
    px(c, P.laitonFonce, ox + 7, oy + 8, 2, 7); px(c, P.laiton, ox + 5, oy + 14, 6, 2);
    px(c, P.laitonFonce, ox + 5, oy + 2, 6, 6); px(c, P.lueur, ox + 6, oy + 3, 4, 4);
    px(c, P.laiton, ox + 5, oy + 2, 1, 6); px(c, P.laiton, ox + 10, oy + 2, 1, 6); px(c, P.laiton, ox + 7, oy + 1, 2, 1);
  };

  TUILES["k"] = function (c, ox, oy, x, y, v) {
    mur(c, ox, oy, x, y, v, false);
    var hautK = v(0, -1) !== "k", basK = v(0, 1) !== "k";
    px(c, P.boisFonce, ox + 1, oy, 14, T);
    px(c, P.lawh, ox + 2, oy + (hautK ? 2 : 0), 12, T - (hautK ? 2 : 0) - (basK ? 3 : 0));
    if (basK) px(c, P.boisClair, ox + 1, oy + 13, 14, 2);
    for (var l = 0; l < 3; l++) {
      var ly = oy + 3 + l * 4 - (hautK ? 0 : 1);
      if (ly < oy + T - (basK ? 4 : 1)) px(c, P.craie, ox + 4, ly, 3 + Math.floor(hache(x, y, l) * 6), 1);
    }
  };

  // v4.7 — le lawh du jour (mur nord de la Madrasa) : le même lawh, d'une seule tuile.
  TUILES["K"] = TUILES["k"];

  TUILES["r"] = function (c, ox, oy, x, y, v) {
    fond(c, ox, oy, x, y, v);
    px(c, P.bois, ox + 4, oy + 10, 2, 5); px(c, P.bois, ox + 10, oy + 10, 2, 5); px(c, P.boisFonce, ox + 6, oy + 12, 4, 1);
    px(c, P.boisFonce, ox + 2, oy + 9, 12, 2);
    px(c, P.page, ox + 3, oy + 4, 10, 6); px(c, P.pageOmbre, ox + 8, oy + 4, 1, 6);
    px(c, P.encre, ox + 4, oy + 5, 3, 1); px(c, P.encre, ox + 4, oy + 7, 3, 1); px(c, P.encre, ox + 10, oy + 5, 2, 1); px(c, P.encre, ox + 10, oy + 7, 2, 1);
  };

  // v4.8 — l'établi du prompt : en repli, un pupitre comme le rihal (la planche peinte, elle, montre l'établi).
  TUILES["Y"] = TUILES["r"];
  // v5.2 — Bab ar-Rihla : en repli, dessinée comme le Bab.
  TUILES["R"] = function (c, ox, oy, x, y, v) { return TUILES["G"](c, ox, oy, x, y, v); };
  // v5.7 — l'étal de la Rahba : en repli, le sol de la place (le tapis coloré est dessiné par jeu.js).
  TUILES["e"] = function (c, ox, oy, x, y, v, t) { return TUILES[","](c, ox, oy, x, y, v, t); };
  // v8.7 — l'arganier et le puits du Derb : la pierre de la ruelle (jeu.js les dessine par-dessus)
  TUILES["a"] = function (c, ox, oy, x, y, v, t) { return TUILES["_"](c, ox, oy, x, y, v, t); };
  TUILES["u"] = TUILES["a"];

  TUILES["h"] = function (c, ox, oy, x, y, v) {
    fond(c, ox, oy, x, y, v);
    disque(c, P.coussinOmbre, ox + 8, oy + 9, 6);
    disque(c, P.coussin, ox + 8, oy + 8, 6);
    disque(c, P.coussinClair, ox + 6, oy + 6, 2);
    px(c, P.laiton, ox + 7, oy + 7, 2, 2);
    px(c, P.laiton, ox + 2, oy + 8); px(c, P.laiton, ox + 14, oy + 8); px(c, P.laiton, ox + 8, oy + 2); px(c, P.laiton, ox + 8, oy + 14);
  };

  TUILES["Q"] = function (c, ox, oy, x, y, v) {
    mur(c, ox, oy, x, y, v, false);
    px(c, P.nicheFond, ox + 2, oy + 6, 12, 10); px(c, P.nicheFond, ox + 3, oy + 4, 10, 2); px(c, P.nicheFond, ox + 5, oy + 3, 6, 1);
    px(c, P.laiton, ox + 2, oy + 5, 1, 11); px(c, P.laiton, ox + 13, oy + 5, 1, 11); px(c, P.laiton, ox + 3, oy + 3, 1, 2); px(c, P.laiton, ox + 12, oy + 3, 1, 2); px(c, P.laiton, ox + 4, oy + 2, 8, 1);
    px(c, P.laiton, ox + 7, oy + 4, 2, 3); px(c, P.lueur, ox + 6, oy + 7, 4, 3);
  };

  function panneau(c, ox, oy, x, y, v) {
    mur(c, ox, oy, x, y, v, false);
    px(c, P.laiton, ox + 7, oy + 3, 2, 1);
    px(c, P.boisFonce, ox + 2, oy + 4, 12, 9); px(c, P.bois, ox + 3, oy + 5, 10, 7);
    px(c, P.craie, ox + 4, oy + 7, 8, 1); px(c, P.craie, ox + 4, oy + 9, 5, 1);
  }
  TUILES["1"] = TUILES["2"] = TUILES["3"] = TUILES["4"] = panneau;

  // Un khatt (V) : une calligraphie encadrée au mur du Sahn — une valeur de la
  // charte. Cadre de bois sombre, parchemin, deux traits d'encre et un point d'or.
  TUILES["V"] = function (c, ox, oy, x, y, v) {
    mur(c, ox, oy, x, y, v, false);
    px(c, P.laiton, ox + 7, oy + 2, 2, 1);
    px(c, P.boisFonce, ox + 2, oy + 3, 12, 10);
    px(c, P.page, ox + 3, oy + 4, 10, 8);
    px(c, P.encre, ox + 4, oy + 6, 6, 1); px(c, P.encre, ox + 9, oy + 5, 1, 2);
    px(c, P.encre, ox + 5, oy + 9, 4, 1); px(c, P.encre, ox + 8, oy + 8, 1, 2);
    px(c, P.zelligeOr, ox + 11, oy + 5, 1, 1); px(c, P.zelligeOr, ox + 4, oy + 10, 1, 1);
  };

  // Le sandouq (S) : le coffre des pages perdues, à la Khizana. Bois, coins de
  // laiton, et une page qui s'échappe par le couvercle entrouvert.
  TUILES["S"] = function (c, ox, oy, x, y, v) {
    fond(c, ox, oy, x, y, v);
    px(c, P.contour, ox + 2, oy + 14, 12, 1);
    px(c, P.boisFonce, ox + 2, oy + 6, 12, 8);
    px(c, P.bois, ox + 3, oy + 7, 10, 6);
    px(c, P.boisClair, ox + 2, oy + 5, 12, 2);
    px(c, P.boisFonce, ox + 2, oy + 9, 12, 1);
    px(c, P.laiton, ox + 2, oy + 6, 2, 2); px(c, P.laiton, ox + 12, oy + 6, 2, 2);
    px(c, P.laiton, ox + 2, oy + 12, 2, 2); px(c, P.laiton, ox + 12, oy + 12, 2, 2);
    px(c, P.laiton, ox + 7, oy + 9, 2, 2); px(c, P.laitonFonce, ox + 7, oy + 11, 2, 1);
    px(c, P.page, ox + 6, oy + 3, 4, 2); px(c, P.pageOmbre, ox + 9, oy + 3, 1, 2);
    px(c, P.page, ox + 9, oy + 1, 3, 2); px(c, P.encre, ox + 7, oy + 4, 2, 1);
  };

  var ANIMEES = { "F": true, "~": true };

  function dessinerTuile(c, x, y, t) {
    var ch = monde.tuile(x, y);
    var v = function (dx, dy) { return monde.tuile(x + dx, y + dy); };
    (TUILES[ch] || TUILES["w"])(c, x * T, y * T, x, y, v, t || 0);
  }

  // ---- Le personnage ---------------------------------------------------------------
  // Un tampon 16 × 22 de couleurs, composé couche par couche (pieds, corps,
  // tête, couvre-chef, visage), puis un contour d'un pixel tout autour, puis
  // — pour « droite » — un miroir de « gauche ». Rendu dans un petit canvas,
  // mis en cache par (avatar, direction, pas).
  function luminance(hex) {
    var n = parseInt(String(hex).slice(1), 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  function pixelsPerso(avatar, dir, frame) {
    var a = regles.normaliserAvatar(avatar);
    var peau = regles.PEAUX[a.peau], peauOmbre = regles.nuance(peau, 0.8);
    var dj = regles.DJELLABAS[a.djellaba].hex, djOmbre = regles.nuance(dj, 0.7);
    var clair = luminance(dj) > 0.6;
    var fil = clair ? "#c9a24a" : regles.nuance(dj, 1.35);
    var foulard = clair ? regles.nuance(dj, 0.82) : regles.nuance(dj, 1.45), foulardOmbre = regles.nuance(foulard, 0.78);
    var miroir = dir === "droite", d = miroir ? "gauche" : (dir || "bas");
    var bob = frame ? -1 : 0;

    var buf = [];
    for (var yy = 0; yy < PH; yy++) { var ligne = []; for (var xx = 0; xx < PL; xx++) ligne.push(null); buf.push(ligne); }
    function s(x, y, col) { if (x >= 0 && x < PL && y >= 0 && y < PH && col) buf[y][x] = col; }
    function rect(x, y, w, h, col) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) s(x + i, y + j, col); }

    // -- pieds (babouches) : ils restent au sol, le reste du corps se soulève d'un pixel au pas --
    if (d === "gauche") {
      var pieds = [[[4, 3], [8, 3]], [[3, 3], [9, 3]], [[5, 3], [7, 3]]][frame || 0];
      rect(pieds[0][0], 19, pieds[0][1], 2, P.babouche); rect(pieds[1][0], 19, pieds[1][1], 2, P.baboucheOmbre);
    } else {
      if (!frame) { rect(5, 19, 2, 2, P.babouche); rect(9, 19, 2, 2, P.babouche); }
      else if (frame === 1) { rect(5, 19, 2, 2, P.babouche); rect(9, 20, 2, 1, P.baboucheOmbre); }
      else { rect(5, 20, 2, 1, P.baboucheOmbre); rect(9, 19, 2, 2, P.babouche); }
    }

    // -- le corps : la djellaba, un cylindre qui s'évase --
    var B = 10 + bob; // rangée des épaules
    rect(5, B, 6, 1, dj); rect(4, B + 1, 8, 1, dj); rect(3, B + 2, 10, 7, dj);
    rect(11, B + 2, 2, 7, djOmbre); rect(3, B + 8, 10, 1, djOmbre);
    if (d === "bas") {
      rect(7, B + 1, 2, 7, fil);                     // la sfifa, le galon du devant
      s(3, B + 5, peau); s(3, B + 6, peau); s(12, B + 5, peau); s(12, B + 6, peau); // les mains
    } else if (d === "haut") {
      if (a.tete !== "capuche") { rect(5, B, 6, 1, djOmbre); rect(6, B + 1, 4, 1, djOmbre); rect(7, B + 2, 2, 1, djOmbre); } // le qob qui pend
    } else {
      rect(6, B + 2, 1, 5, djOmbre);                 // le pli de la manche
    }

    // -- la tête --
    var H = 3 + bob;
    rect(5, H, 6, 1, peau); rect(4, H + 1, 8, 5, peau); rect(5, H + 6, 6, 1, peauOmbre);

    // -- cheveux et couvre-chef --
    var tete = a.tete;
    if (tete === "cheveux" || tete === "tarbouche" || tete === "taqiya" || tete === "turban") {
      if (d === "haut") { rect(5, H - 1, 6, 1, P.cheveux); rect(4, H, 8, 6, P.cheveux); }
      else if (d === "gauche") { rect(5, H - 1, 6, 1, P.cheveux); rect(4, H, 8, 3, P.cheveux); rect(9, H + 3, 3, 3, P.cheveux); }
      else { rect(5, H - 1, 6, 1, P.cheveux); rect(4, H, 8, 3, P.cheveux); s(4, H + 3, P.cheveux); s(11, H + 3, P.cheveux); }
    }
    if (tete === "capuche") {
      if (d === "haut") {
        rect(7, H - 2, 2, 1, dj); rect(6, H - 1, 4, 1, dj); rect(5, H, 6, 1, dj); rect(4, H + 1, 8, 7, dj);
        rect(10, H + 1, 2, 7, djOmbre); rect(4, H + 7, 8, 1, djOmbre);
      } else if (d === "gauche") {
        rect(8, H - 2, 3, 1, dj); rect(6, H - 1, 6, 1, dj); rect(5, H, 8, 1, dj); rect(3, H + 1, 10, 7, dj);
        rect(11, H + 1, 2, 7, djOmbre); rect(4, H + 2, 6, 5, peau); s(3, H + 2, djOmbre);
      } else {
        rect(7, H - 2, 2, 1, dj); rect(6, H - 1, 4, 1, dj); rect(5, H, 6, 1, dj); rect(3, H + 1, 10, 7, dj);
        rect(11, H + 1, 2, 7, djOmbre); rect(5, H + 2, 6, 5, peau); s(4, H + 2, djOmbre); s(11, H + 2, djOmbre);
      }
    } else if (tete === "tarbouche") {
      rect(5, H - 2, 6, 3, P.tarbouche); rect(5, H + 1, 6, 1, P.tarboucheOmbre);
      if (d === "haut") { s(4, H - 1, P.contour); s(3, H, P.contour); s(3, H + 1, P.contour); }
      else { s(11, H - 1, P.contour); s(12, H, P.contour); s(12, H + 1, P.contour); }
    } else if (tete === "taqiya") {
      rect(5, H - 1, 6, 1, P.taqiya); rect(4, H, 8, 2, P.taqiya); s(6, H, P.taqiyaPoint); s(9, H, P.taqiyaPoint);
    } else if (tete === "turban") {
      rect(5, H - 1, 6, 1, P.turban); rect(3, H, 10, 3, P.turban); rect(4, H + 1, 8, 1, P.turbanPli); s(12, H + 1, P.turbanPli); s(12, H + 2, P.turbanPli);
    } else if (tete === "hijab") {
      if (d === "haut") {
        rect(5, H - 1, 6, 1, foulard); rect(4, H, 8, 8, foulard); rect(10, H, 2, 8, foulardOmbre); rect(3, H + 7, 10, 1, foulard);
      } else if (d === "gauche") {
        rect(5, H - 1, 6, 1, foulard); rect(4, H, 9, 2, foulard); rect(9, H + 2, 4, 6, foulard); rect(11, H + 2, 2, 6, foulardOmbre);
        rect(3, H + 1, 1, 7, foulard); rect(3, H + 7, 10, 1, foulard);
      } else {
        rect(5, H - 1, 6, 1, foulard); rect(4, H, 8, 2, foulard); rect(3, H + 1, 2, 7, foulard); rect(11, H + 1, 2, 7, foulardOmbre);
        rect(3, H + 7, 10, 1, foulard);
      }
    }

    // -- le visage --
    if (d === "bas") { s(6, H + 4, P.oeil); s(9, H + 4, P.oeil); }
    else if (d === "gauche") {
      s(5, H + 4, P.oeil);
      if (tete !== "capuche" && tete !== "hijab") s(3, H + 5, peau);
    }

    // -- le contour --
    var out = [];
    for (yy = 0; yy < PH; yy++) {
      var l2 = [];
      for (xx = 0; xx < PL; xx++) {
        if (buf[yy][xx]) l2.push(buf[yy][xx]);
        else {
          var voisin = (yy > 0 && buf[yy - 1][xx]) || (yy < PH - 1 && buf[yy + 1][xx]) || (xx > 0 && buf[yy][xx - 1]) || (xx < PL - 1 && buf[yy][xx + 1]);
          l2.push(voisin ? P.contour : null);
        }
      }
      out.push(miroir ? l2.reverse() : l2);
    }
    return out;
  }

  var cacheSprites = {};
  function spritePerso(avatar, dir, frame) {
    var a = regles.normaliserAvatar(avatar);
    var cle = a.peau + "-" + a.djellaba + "-" + a.tete + "-" + dir + "-" + (frame || 0);
    if (cacheSprites[cle]) return cacheSprites[cle];
    var cv = document.createElement("canvas"); cv.width = PL; cv.height = PH;
    var c = cv.getContext("2d");
    var pix = pixelsPerso(a, dir, frame || 0);
    for (var y = 0; y < PH; y++) for (var x = 0; x < PL; x++) if (pix[y][x]) px(c, pix[y][x], x, y, 1, 1);
    cacheSprites[cle] = cv;
    return cv;
  }

  // Dessine le personnage sur `c`, pieds posés en (x, y) (en pixels ÉCRAN), agrandi ×zoom.
  function dessinerPersoPixel(c, avatar, dir, frame, x, y, zoom, ombre) {
    var sp = spritePerso(avatar, dir, frame);
    if (ombre !== false) {
      c.fillStyle = "rgba(0,0,0,0.28)";
      c.beginPath(); c.ellipse(x, y - 1 * zoom, 6 * zoom, 2.2 * zoom, 0, 0, Math.PI * 2); c.fill();
    }
    c.drawImage(sp, Math.round(x - (PL / 2) * zoom), Math.round(y - (PH - 1) * zoom), PL * zoom, PH * zoom);
  }

  // ---- La scène : la carte pré-rendue + la caméra -------------------------------------
  function creerScenePixel(canvas) {
    var ctx = canvas.getContext("2d", { alpha: false });
    var carte = document.createElement("canvas");
    carte.width = monde.LARGEUR * T; carte.height = monde.HAUTEUR * T;
    var cc = carte.getContext("2d");
    var animees = [];
    for (var y = 0; y < monde.HAUTEUR; y++) for (var x = 0; x < monde.LARGEUR; x++) {
      dessinerTuile(cc, x, y, 0);
      if (ANIMEES[monde.tuile(x, y)]) animees.push([x, y]);
    }

    var etat = { zoom: 4, dpr: 1, cssL: 0, cssH: 0 };

    function redimensionner() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      var cssL = Math.max(1, Math.round(r.width)), cssH = Math.max(1, Math.round(r.height));
      // ~12 tuiles de large au minimum, ~10 de haut ; entre ×2 et ×4 en pixels CSS.
      var zoomCss = Math.max(2, Math.min(4, Math.floor(Math.min(cssL / (T * 12), cssH / (T * 10)))));
      etat.zoom = Math.max(2, Math.round(zoomCss * dpr));
      etat.dpr = dpr; etat.cssL = cssL; etat.cssH = cssH;
      canvas.width = Math.round(cssL * dpr); canvas.height = Math.round(cssH * dpr);
      ctx.imageSmoothingEnabled = false;
    }

    // joueur : { x, y (pixels MONDE, bas des pieds), dir, frame, avatar } ;
    // autres : la même forme, pour les PNJ (facultatif).
    var decor = null;   // v5.7 — { sol, dessus } : ce qu'une région dessine sous et sur les gens (la Rahba)
    function rendre(joueur, t, autres) {
      var z = etat.zoom, W = canvas.width, Hh = canvas.height;
      var vw = Math.ceil(W / z), vh = Math.ceil(Hh / z);
      var mapW = carte.width, mapH = carte.height;
      var camX = Math.round(joueur.x - vw / 2), camY = Math.round(joueur.y - 10 - vh / 2);
      var ox = 0, oy = 0;
      if (vw >= mapW) { camX = 0; ox = Math.floor((vw - mapW) / 2); } else camX = Math.max(0, Math.min(mapW - vw, camX));
      if (vh >= mapH) { camY = 0; oy = Math.floor((vh - mapH) / 2); } else camY = Math.max(0, Math.min(mapH - vh, camY));

      for (var i = 0; i < animees.length; i++) dessinerTuile(cc, animees[i][0], animees[i][1], t);

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = P.dehors; ctx.fillRect(0, 0, W, Hh);
      var sw = Math.min(vw, mapW - camX), sh = Math.min(vh, mapH - camY);
      ctx.drawImage(carte, camX, camY, sw, sh, ox * z, oy * z, sw * z, sh * z);
      var cam = { camX: camX, camY: camY, ox: ox, oy: oy, zoom: z };
      if (decor && decor.sol) decor.sol(ctx, cam, t);

      // v2.5 — les PNJ (pnj.js) se dessinent avec le joueur, du plus haut au
      // plus bas de l'écran : celui qui est devant passe devant.
      var gens = (autres || []).concat([joueur]).slice().sort(function (a, b) { return a.y - b.y; });
      for (var g = 0; g < gens.length; g++) {
        var q = gens[g];
        var sx = (Math.round(q.x) - camX + ox) * z, sy = (Math.round(q.y) - camY + oy) * z;
        dessinerPersoPixel(ctx, q.avatar, q.dir, q.frame, sx, sy, z, true);
      }
      if (decor && decor.dessus) decor.dessus(ctx, cam, t);
      return cam;
    }

    redimensionner();
    return { redimensionner: redimensionner, rendre: rendre, etat: etat, carte: carte, set decor(d) { decor = d; }, get decor() { return decor; } };
  }

  // ---- L'aperçu de l'atelier : une petite scène de 4 × 3 tuiles ----------------------------
  var scenette = null;
  function apercuPixel(canvas, avatar, dir, frame) {
    var ctx = canvas.getContext("2d");
    var z = Math.max(2, Math.floor(Math.min(canvas.width / (4 * T), canvas.height / (3 * T))));
    if (!scenette) {
      scenette = document.createElement("canvas"); scenette.width = 4 * T; scenette.height = 3 * T;
      var c2 = scenette.getContext("2d");
      var v = function () { return "."; };
      for (var y = 0; y < 3; y++) for (var x = 0; x < 4; x++) TUILES["."](c2, x * T, y * T, x + 20, y + 14, v);
      TUILES["L"](c2, 0, 0, 12, 13, function (dx, dy) { return "."; });
    }
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = P.dehors; ctx.fillRect(0, 0, canvas.width, canvas.height);
    var ox = Math.floor((canvas.width - 4 * T * z) / 2), oy = Math.floor((canvas.height - 3 * T * z) / 2);
    ctx.drawImage(scenette, ox, oy, 4 * T * z, 3 * T * z);
    dessinerPersoPixel(ctx, avatar, dir, frame, ox + 2 * T * z, oy + (2 * T + 4) * z, z, true);
  }


  // =====================================================================================
  // ---- LE MONDE PEINT (v3.0) ------------------------------------------------------------
  // =====================================================================================
  var atlas = ZWJ.atlas;
  var PLANCHE = { version: "?v=85", fichier: null, image: null, meta: null, etat: "vide", erreur: null, attente: [] };
  var S = 6;                         // pixels source par pixel monde (96 / 16) — atlas.ECHELLE
  var EAU_PERIODE = 2.6;             // secondes d'un aller-retour entre les deux images de l'eau

  function chargerPlanche() {
    if (!atlas || PLANCHE.etat !== "vide") return;
    if (typeof Image === "undefined" || typeof fetch !== "function") { PLANCHE.etat = "erreur"; return; }
    PLANCHE.etat = "charge";
    var rate = function (e) { PLANCHE.etat = "erreur"; PLANCHE.erreur = e; PLANCHE.attente.splice(0).forEach(function (f) { f(false); }); };
    var img = new Image();
    var meta = null, image = null;
    function fini() {
      if (!meta || !image) return;
      PLANCHE.image = image; PLANCHE.meta = meta; PLANCHE.etat = "pret";
      PLANCHE.attente.splice(0).forEach(function (f) { f(true); });
    }
    fetch(atlas.FICHIERS.atlas + PLANCHE.version).then(function (r) { if (!r.ok) throw new Error("atlas " + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.sprites || !j.figures) throw new Error("atlas vide"); meta = j; fini(); }).catch(rate);
    img.onload = function () { image = img; fini(); };
    img.onerror = function () { rate(new Error("planche")); };
    img.src = atlas.FICHIERS.planche + PLANCHE.version;
  }
  function quandPrete(f) {
    if (PLANCHE.etat === "pret") f(true);
    else if (PLANCHE.etat === "erreur") f(false);
    else { PLANCHE.attente.push(f); chargerPlanche(); }
  }

  // Un sprite de la planche, dessiné en (dx, dy) écran, à l'échelle k (px écran par px source).
  function sprite(cle) { return PLANCHE.meta && PLANCHE.meta.sprites[cle]; }
  function poser(c, r, dx, dy, k, cx, cy) {
    if (!r) return;
    var sx = r.x, sy = r.y, sw = r.w, sh = r.h;
    if (cx != null) { sx += cx * atlas.TUILE_SRC; sy += cy * atlas.TUILE_SRC; sw = atlas.TUILE_SRC; sh = atlas.TUILE_SRC; }
    c.drawImage(PLANCHE.image, sx, sy, sw, sh, dx, dy, sw * k, sh * k);
  }

  // ---- Les personnages : une cellule teintée, mise en cache ----------------------------
  var cachePeint = {};
  function cellulePerso(avatar, dir, frame) {
    var a = regles.normaliserAvatar(avatar);
    var fig = atlas.figurePour(avatar && avatar.figure ? { tete: a.tete, figure: avatar.figure } : a, Object.keys(PLANCHE.meta.figures));
    var d = dir === "droite" || dir === "gauche" || dir === "haut" ? dir : "bas";
    var f = frame ? 1 : 0;
    var miroir = frame === 2 && (d === "bas" || d === "haut");   // l'autre jambe : le pas, en miroir
    // Les cinq axes du visage entrent dans la clé : deux joueurs qui ne
    // diffèrent que par la barbe ne doivent pas se partager une cellule.
    var Tr = ZWJ.traits;
    var tr = Tr ? Tr.normaliser(a) : null;
    var cle = fig + "|" + a.peau + "|" + a.djellaba + "|" + d + "|" + f + (miroir ? "m" : "") +
      (tr ? "|" + tr.cheveux + tr.coiffure + tr.barbe + tr.moustache + tr.bijou : "");
    if (cachePeint[cle]) return cachePeint[cle];
    var r = PLANCHE.meta.figures[fig][d][f];
    var cv = document.createElement("canvas"); cv.width = r.w; cv.height = r.h;
    var c = cv.getContext("2d");
    if (miroir) { c.translate(r.w, 0); c.scale(-1, 1); }
    c.drawImage(PLANCHE.image, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    var hexCheveux = tr ? Tr.CHEVEUX[tr.cheveux].hex : P.cheveux;
    var hexPeau = regles.PEAUX[a.peau];
    var couleurs = { djellaba: regles.DJELLABAS[a.djellaba].hex, peau: hexPeau, cheveux: hexCheveux };
    var id = c.getImageData(0, 0, r.w, r.h), px = id.data;
    var bc = null, peaux = [], i, p, x, y, t;
    function etendre(b, xx, yy) {
      if (!b) return { x: xx, y: yy, x2: xx, y2: yy };
      if (xx < b.x) b.x = xx; if (yy < b.y) b.y = yy;
      if (xx > b.x2) b.x2 = xx; if (yy > b.y2) b.y2 = yy;
      return b;
    }
    // PASSE 1 — mesurer. Les ANCRAGES ne sont jamais écrits en dur : une
    // planche repeinte déplace les traits toute seule. La barbe doit savoir OÙ
    // est le visage AVANT qu'on teigne — une fois repeint, le pixel a perdu sa
    // couleur-témoin.
    var classe = new Uint8Array(px.length / 4);   // 1 = cheveux, 2 = peau
    for (i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 8) continue;
      var cl = atlas.classer(px[i], px[i + 1], px[i + 2]);
      if (cl !== "cheveux" && cl !== "peau") continue;
      p = i / 4; x = p % r.w; y = (p / r.w) | 0;
      classe[p] = cl === "cheveux" ? 1 : 2;
      if (cl === "cheveux") bc = etendre(bc, x, y); else peaux.push(x, y);
    }
    var visageBoite = visage(peaux, bc);
    var zones = tr ? Tr.zonePoils(Object.assign({ tete: a.tete }, tr), { peau: visageBoite }, d) : [];
    // PASSE 2 — teindre. Un pixel de peau dans une zone de poils prend la
    // couleur des cheveux : le modelé peint du visage reste dessous, et c'est
    // ce qui sépare une barbe d'une tache. Essayé d'abord en ellipses posées
    // PAR-DESSUS (20/09/2026) : à ~14 px de visage, ça faisait un cache-cou.
    for (i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 8) continue;
      var couleursPx = couleurs;
      if (zones.length && classe[i / 4] === 2) {
        p = i / 4; x = p % r.w; y = (p / r.w) | 0;
        var fz = forcePoils(zones, x, y);
        if (fz > 0) couleursPx = { djellaba: couleurs.djellaba, cheveux: couleurs.cheveux,
                                   peau: fz >= 1 ? hexCheveux : melange(hexPeau, hexCheveux, fz) };
      }
      t = atlas.teinter(px[i], px[i + 1], px[i + 2], couleursPx);
      px[i] = t[0]; px[i + 1] = t[1]; px[i + 2] = t[2];
    }
    c.putImageData(id, 0, 0);
    if (tr) poserMarques(c, Tr.marques(Object.assign({ tete: a.tete }, tr), { cheveux: enBoite(bc), peau: visageBoite }, d), hexPeau);
    cachePeint[cle] = cv;
    return cv;
  }

  function enBoite(b) { return b ? { x: b.x, y: b.y, w: b.x2 - b.x + 1, h: b.y2 - b.y + 1 } : null; }

  // Le VISAGE parmi tous les pixels de peau : ceux qui tombent dans la bande de
  // la chevelure. ⚠️ La boîte de TOUTE la peau descend jusqu'aux MAINS, peintes
  // de la même couleur-témoin — une barbe ancrée dessus atterrit à la taille,
  // vu à l'écran au premier essai. Sans chevelure pour repère (tête couverte),
  // c'est le tiers HAUT : les mains sont toujours plus bas.
  function visage(coords, bc) {
    if (!coords.length) return null;
    var yMax = Infinity, i, y;
    if (bc) yMax = bc.y2 + (bc.y2 - bc.y) * 1.2;
    else {
      var yMin = Infinity, yBas = -Infinity;
      for (i = 1; i < coords.length; i += 2) { y = coords[i]; if (y < yMin) yMin = y; if (y > yBas) yBas = y; }
      yMax = yMin + (yBas - yMin) * 0.34;
    }
    var b = null;
    for (i = 0; i < coords.length; i += 2) {
      if (coords[i + 1] > yMax) continue;
      var x = coords[i]; y = coords[i + 1];
      if (!b) b = { x: x, y: y, x2: x, y2: y };
      else { if (x < b.x) b.x = x; if (y < b.y) b.y = y; if (x > b.x2) b.x2 = x; if (y > b.y2) b.y2 = y; }
    }
    return enBoite(b);
  }

  function dansEllipse(z, x, y) {
    var rx = z.w / 2, ry = z.h / 2;
    if (!(rx > 0) || !(ry > 0)) return false;
    var dx = (x + 0.5 - (z.x + rx)) / rx, dy = (y + 0.5 - (z.y + ry)) / ry;
    return dx * dx + dy * dy <= 1;
  }
  // 0 dehors, `force` dedans. Un « creux » (la barbe en collier) exclut le
  // centre du visage : sans lui, l'anneau devient un masque.
  function forcePoils(zones, x, y) {
    var f = 0;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (!dansEllipse(z, x, y)) continue;
      if (z.creux && dansEllipse(z.creux, x, y)) continue;
      if (z.force > f) f = z.force;
    }
    return f;
  }
  function melange(hexA, hexB, k) {
    var a = parseInt(String(hexA).slice(1), 16), b = parseInt(String(hexB).slice(1), 16);
    var r0 = (a >> 16) & 255, g0 = (a >> 8) & 255, b0 = a & 255;
    var r1 = (b >> 16) & 255, g1 = (b >> 8) & 255, b1 = b & 255;
    return "#" + ((1 << 24) + (Math.round(r0 + (r1 - r0) * k) << 16)
      + (Math.round(g0 + (g1 - g0) * k) << 8) + Math.round(b0 + (b1 - b0) * k)).toString(16).slice(1);
  }

  // Les marques que traits.js décrit (coiffures, bijoux), posées sur la
  // cellule. Le module ne connaît pas le canvas : il rend des rectangles et des
  // ellipses, et « @peau » quand une marque prend la teinte de peau du joueur
  // (la coiffure rasée, qui rabaisse le crâne peint).
  function poserMarques(c, liste, hexPeau) {
    for (var i = 0; i < liste.length; i++) {
      var m = liste[i];
      if (!(m.w > 0) || !(m.h > 0)) continue;
      c.save();
      c.globalAlpha = typeof m.alpha === "number" ? m.alpha : 1;
      c.fillStyle = m.hex === "@peau" ? hexPeau : m.hex;
      if (m.forme === "ellipse") {
        c.beginPath();
        c.ellipse(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, m.h / 2, 0, 0, Math.PI * 2);
        c.fill();
      } else {
        c.fillRect(m.x, m.y, m.w, m.h);
      }
      c.restore();
    }
  }

  // v5.7 — UN SPRITE DE LA PLANCHE, TEINTÉ. La Rahba peint chaque tapis de la
  // couleur de son marchand : le sprite est recopié dans un canvas, et chaque
  // pixel prend la couleur cible à la luminosité du pixel d'origine (rapportée
  // à la luminosité moyenne du sprite) — le modelé peint reste, la teinte
  // change. Mis en cache par (clé, couleur) : douze couleurs, quatre coins.
  // Rend null tant que la planche n'est pas là : le dessinateur pose un aplat.
  var cacheTeinte = {};
  function spriteTeinte(cle, hex) {
    if (PLANCHE.etat !== "pret") return null;
    var k = cle + "|" + hex;
    if (cacheTeinte[k]) return cacheTeinte[k];
    var r = sprite(cle);
    if (!r || typeof document === "undefined") return null;
    var cv = document.createElement("canvas");
    cv.width = r.w; cv.height = r.h;
    var c = cv.getContext("2d");
    c.drawImage(PLANCHE.image, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    var id = c.getImageData(0, 0, r.w, r.h), px = id.data, i, somme = 0, n = 0;
    for (i = 0; i < px.length; i += 4) { if (px[i + 3] < 8) continue; somme += (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255; n++; }
    var ref = n ? somme / n : 0.5, cible = atlasHex(hex);
    for (i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 8) continue;
      var f = ((0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255) / ref;
      px[i] = Math.min(255, Math.round(cible[0] * f)); px[i + 1] = Math.min(255, Math.round(cible[1] * f)); px[i + 2] = Math.min(255, Math.round(cible[2] * f));
    }
    c.putImageData(id, 0, 0);
    cacheTeinte[k] = cv;
    return cv;
  }
  function atlasHex(h) { var n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  // Dessine le personnage peint, pieds posés en (x, y) écran, `zoom` px écran par px monde.
  function dessinerPersoPeint(c, avatar, dir, frame, x, y, zoom, ombre) {
    var sp = cellulePerso(avatar, dir, frame);
    var k = zoom / S, w = sp.width * k, h = sp.height * k;
    if (ombre !== false) {
      c.fillStyle = "rgba(20,10,0,0.28)";
      c.beginPath(); c.ellipse(x, y - 0.6 * zoom, 5.5 * zoom, 2 * zoom, 0, 0, Math.PI * 2); c.fill();
    }
    c.drawImage(sp, x - w / 2, y - h + 0.5 * zoom, w, h);
  }

  // ---- La scène peinte ----------------------------------------------------------------------
  function creerScenePeint(canvas) {
    var ctx = canvas.getContext("2d", { alpha: false });
    var etat = { zoom: 6, dpr: 1, cssL: 0, cssH: 0, peint: true };
    var cellules = null;   // [y][x] → atlas.couches, résolu une fois
    var decor = null;      // v5.7 — { sol, dessus } : ce qu'une région dessine sous et sur les gens (la Rahba)

    function resoudre() {
      cellules = [];
      for (var y = 0; y < monde.HAUTEUR; y++) {
        var ligne = [];
        for (var x = 0; x < monde.LARGEUR; x++) ligne.push(atlas.couches(monde, x, y));
        cellules.push(ligne);
      }
    }

    function redimensionner() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      var cssL = Math.max(1, Math.round(r.width)), cssH = Math.max(1, Math.round(r.height));
      // 48 px CSS la tuile (décision 1) ; sur un écran étroit on descend jusqu'à
      // 32 px pour garder onze tuiles de large — la peinture supporte le fractionnaire.
      var zoomCss = Math.max(2, Math.min(atlas.TUILE_CSS / T, cssL / (T * 11)));
      etat.zoom = zoomCss * dpr;
      etat.dpr = dpr; etat.cssL = cssL; etat.cssH = cssH;
      canvas.width = Math.round(cssL * dpr); canvas.height = Math.round(cssH * dpr);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    }

    function rendre(joueur, t, autres) {
      var z = etat.zoom, W = canvas.width, Hh = canvas.height;
      var vw = W / z, vh = Hh / z;
      var mapW = monde.LARGEUR * T, mapH = monde.HAUTEUR * T;
      var camX = joueur.x - vw / 2, camY = joueur.y - 10 - vh / 2;
      var ox = 0, oy = 0;
      if (vw >= mapW) { camX = 0; ox = (vw - mapW) / 2; } else camX = Math.max(0, Math.min(mapW - vw, camX));
      if (vh >= mapH) { camY = 0; oy = (vh - mapH) / 2; } else camY = Math.max(0, Math.min(mapH - vh, camY));
      // la caméra s'arrondit au pixel ÉCRAN : pas de tremblement entre deux tuiles
      camX = Math.round(camX * z) / z; camY = Math.round(camY * z) / z;

      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = P.dehors; ctx.fillRect(0, 0, W, Hh);
      var cam = { camX: camX, camY: camY, ox: ox, oy: oy, zoom: z };
      if (PLANCHE.etat !== "pret") return cam;
      if (!cellules) resoudre();

      var k = z / S, tuileEcran = T * z;
      var x0 = Math.max(0, Math.floor((camX - ox) / T) - 1), x1 = Math.min(monde.LARGEUR - 1, Math.ceil((camX - ox + vw) / T) + 1);
      var y0 = Math.max(0, Math.floor((camY - oy) / T) - 1), y1 = Math.min(monde.HAUTEUR - 1, Math.ceil((camY - oy + vh) / T) + 1);
      var acteurs = [];
      var eauA = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / EAU_PERIODE);
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
        var cel = cellules[y][x];
        var dx = (x * T - camX + ox) * z, dy = (y * T - camY + oy) * z;
        for (var i = 0; i < cel.sol.length; i++) {
          var l = cel.sol[i];
          poser(ctx, sprite(l.s), dx, dy, k, l.cx, l.cy);
        }
        if (cel.eau) {
          // décision 3 : deux images de reflet, fondues l'une dans l'autre
          poser(ctx, sprite("eau.1"), dx, dy, k);
          ctx.globalAlpha = eauA; poser(ctx, sprite("eau.2"), dx, dy, k); ctx.globalAlpha = 1;
        }
        if (cel.objet) acteurs.push({ y: (y + 1) * T, objet: cel.objet.s, tx: x, ty: y });
      }
      // v5.7 — le décor d'une région, sous les gens : les tapis de la Rahba
      if (decor && decor.sol) decor.sol(ctx, cam, t);
      (autres || []).concat([joueur]).forEach(function (q) { acteurs.push({ y: q.y, perso: q }); });
      // du plus haut au plus bas de l'écran : ce qui est devant passe devant —
      // un Talib derrière une colonne passe derrière elle
      acteurs.sort(function (a, b) { return a.y - b.y; });
      for (var g = 0; g < acteurs.length; g++) {
        var q = acteurs[g];
        if (q.perso) {
          dessinerPersoPeint(ctx, q.perso.avatar, q.perso.dir, q.perso.frame, (q.perso.x - camX + ox) * z, (q.perso.y - camY + oy) * z, z, true);
        } else {
          var r = sprite(q.objet);
          if (!r) continue;
          var w = r.w * k, h = r.h * k;
          poser(ctx, r, (q.tx * T + T / 2 - camX + ox) * z - w / 2, ((q.ty + 1) * T - camY + oy) * z - h + 0.15 * tuileEcran, k);
        }
      }
      // v5.7 — et sur les gens : les auvents, la corde des teinturiers, les guirlandes
      if (decor && decor.dessus) decor.dessus(ctx, cam, t);
      return cam;
    }

    redimensionner();
    chargerPlanche();
    return { redimensionner: redimensionner, rendre: rendre, etat: etat, peint: true, set decor(d) { decor = d; }, get decor() { return decor; } };
  }

  // L'aperçu peint de l'atelier : 4 × 3 tuiles de zellige, une lanterne, le personnage.
  function apercuPeint(canvas, avatar, dir, frame) {
    var ctx = canvas.getContext("2d");
    var z = Math.max(2, Math.min(canvas.width / (4 * T), canvas.height / (3 * T)));
    var k = z / S;
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = P.dehors; ctx.fillRect(0, 0, canvas.width, canvas.height);
    var ox = (canvas.width - 4 * T * z) / 2, oy = (canvas.height - 3 * T * z) / 2;
    for (var y = 0; y < 3; y++) for (var x = 0; x < 4; x++) poser(ctx, sprite("sol.zellige"), ox + x * T * z, oy + y * T * z, k);
    var lan = sprite("obj.lanterne");
    if (lan) poser(ctx, lan, ox + T * z / 2 - lan.w * k / 2, oy + T * z - lan.h * k + 0.15 * T * z, k);
    dessinerPersoPeint(ctx, avatar, dir, frame, ox + 2 * T * z, oy + (2 * T + 4) * z, z, true);
  }

  // ---- La couture : peint si la planche est là, pixel sinon -------------------------------
  function creerScene(canvas) {
    if (!atlas) return creerScenePixel(canvas);
    var peint = creerScenePeint(canvas);
    var pixel = null;
    var courant = peint;
    quandPrete(function (ok) {
      if (ok) return;
      pixel = creerScenePixel(canvas);
      courant = pixel;
    });
    var decor = null;
    return {
      redimensionner: function () { courant.redimensionner(); },
      rendre: function (j, t, a) { courant.decor = decor; return courant.rendre(j, t, a); },
      get etat() { return courant.etat; },
      // v5.7 — { sol(ctx, cam, t), dessus(ctx, cam, t) } : la Rahba pose ses tapis et ses auvents
      set decor(d) { decor = d; },
      get decor() { return decor; }
    };
  }
  function dessinerPerso(c, avatar, dir, frame, x, y, zoom, ombre) {
    if (PLANCHE.etat === "pret") return dessinerPersoPeint(c, avatar, dir, frame, x, y, zoom, ombre);
    if (PLANCHE.etat !== "erreur") {
      // la planche descend encore : on repasse dessiner dès qu'elle est là (le
      // petit portrait du HUD n'est demandé qu'une fois, à l'entrée dans la cour)
      quandPrete(function () { dessinerPerso(c, avatar, dir, frame, x, y, zoom, ombre); });
      return;
    }
    return dessinerPersoPixel(c, avatar, dir, frame, x, y, zoom, ombre);
  }
  function apercu(canvas, avatar, dir, frame) {
    if (PLANCHE.etat === "pret") return apercuPeint(canvas, avatar, dir, frame);
    if (PLANCHE.etat !== "erreur") {
      chargerPlanche();
      var c = canvas.getContext("2d"); c.fillStyle = P.dehors; c.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }
    return apercuPixel(canvas, avatar, dir, frame);
  }

  ZWJ.rendu = {
    PALETTE: P, TUILES: TUILES, dessinerTuile: dessinerTuile,
    pixelsPerso: pixelsPerso, spritePerso: spritePerso, dessinerPerso: dessinerPerso,
    creerScene: creerScene, apercu: apercu, PL: PL, PH: PH,
    // v5.2 — le monde que les scènes À VENIR dessinent : la cour de la zawia, ou
    // une région du mode Rihla. Une scène déjà créée garde le sien (sa carte est
    // résolue une fois) : on en crée une nouvelle en changeant de monde.
    utiliserMonde: function (m) { if (m && typeof m.tuile === "function" && typeof m.solide === "function") monde = m; return monde; },
    get monde() { return monde; },
    PLANCHE: PLANCHE, chargerPlanche: chargerPlanche, quandPrete: quandPrete, cellulePerso: cellulePerso,
    // v5.7 — pour le décor d'une région : un sprite de la planche teinté (canvas, ou null sans planche), et ses dimensions source
    spriteTeinte: spriteTeinte, sprite: function (cle) { return sprite(cle) || null; }, ECHELLE_SPRITE: S
  };
})(typeof window !== "undefined" ? window : globalThis);
