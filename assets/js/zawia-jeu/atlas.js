// ZAW'IA — le jeu · L'ATLAS : quelle image pour quelle tuile.
//
// v3.0 — le monde peint. Les tuiles ne sont plus dessinées en code : elles
// sont LUES dans une planche (assets/img/zawia/jeu/tuiles.png, 96 px la
// tuile source, 48 px CSS à l'écran) décrite par tuiles.json. Ce module est
// la LOGIQUE qui reliait un caractère de la carte à son dessin — les
// variantes par voisinage (bord de tapis, montant de seuil, moitié du Bab,
// case du minaret ou de la fontaine), le sol sous un objet posé, la teinte
// d'un personnage. Il est PUR : testé sous Node, sans image ni canvas.
// rendu.js lit ce qu'il rend et dessine.
//
// Trois règles :
//  - chaque caractère de la légende de monde.js rend au moins une couche —
//    un test le garde, avec la liste SPRITES que la planche doit contenir ;
//  - un objet (colonne, oranger, coffre…) se pose sur le sol de SA pièce,
//    jamais sur du noir : `fondPour` reprend la règle de l'ancien rendu ;
//  - les personnages sont des couches TEINTABLES : la planche les porte en
//    couleurs-témoins (gris = djellaba, vert = peau, magenta = cheveux) et
//    `teinter` donne à chaque pixel la couleur choisie à l'Atelier.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.atlas = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var TUILE_SRC = 96;   // pixels d'une tuile dans la planche
  var TUILE_CSS = 48;   // pixels CSS d'une tuile à l'écran (décision 1 du plan)
  var ECHELLE = TUILE_SRC / 16;   // 6 : pixels source par pixel « monde » (monde.TUILE = 16)

  var FICHIERS = {
    planche: "assets/img/zawia/jeu/tuiles.webp",
    atlas: "assets/img/zawia/jeu/tuiles.json"
  };

  // ---- Les neuf positions d'un « 9-patch » --------------------------------------
  // Un tapis, un parterre : une image de 3 × 3 tuiles découpée en centre,
  // quatre bords et quatre coins. La position d'une case se lit à ses voisins
  // du même caractère.
  function neufPatch(memeHaut, memeBas, memeGauche, memeDroite) {
    var v = memeHaut ? (memeBas ? "" : "b") : "h";
    var h = memeGauche ? (memeDroite ? "" : "d") : "g";
    return (v + h) || "c";
  }
  var POSITIONS = ["c", "h", "b", "g", "d", "hg", "hd", "bg", "bd"];

  // ---- Les sols, par caractère ---------------------------------------------------
  var SOLS = { "w": "sol.dehors", "_": "sol.terre", ".": "sol.zellige", ",": "sol.bejmat", ":": "sol.natte", "p": "sol.marbre",
    "e": "sol.bejmat",    // v5.7 — l'étal de la Rahba : le sol de la place ; le tapis teinté vient par-dessus (jeu.js, rendu.spriteTeinte)
    "a": "sol.terre", "u": "sol.terre" };   // v8.7 — l'arganier et le puits du Derb : la pierre de la ruelle ; jeu.js les dessine
  var NEUF = { "=": "tapis.rouge", "-": "tapis.vert", "g": "parterre" };
  // v8.0 — « P », la Rkhama : muette dans l'atlas, comme la porte du Majliss.
  // La planche ne la peint pas ; jeu.js grave la dalle par-dessus le rendu.
  var MURS = { "#": null, "X": null, "P": null, "A": "mur.arcade", "k": "mur.lawh", "K": "mur.lawh", "Q": "mur.mihrab", "1": "mur.panneau", "2": "mur.panneau", "3": "mur.panneau", "4": "mur.panneau", "V": "mur.khatt" };
  var OBJETS = { "|": "obj.colonne", "T": "obj.oranger", "L": "obj.lanterne", "B": "obj.rayonnage", "r": "obj.rihal", "h": "obj.coussin", "S": "obj.sandouq", "E": "obj.etabli", "Y": "obj.etabli" };
  // Les blocs : une image de plusieurs tuiles, posée d'un bloc ; chaque case
  // en dessine sa part. Les caractères qui composent le bloc.
  var BLOCS = { "M": { sprite: "minaret", chars: "M" }, "F": { sprite: "fontaine", chars: "Ff" }, "f": { sprite: "fontaine", chars: "Ff" }, "~": { sprite: "bassin", chars: "~" } };

  // Toutes les clés que la planche doit contenir — le test compare à tuiles.json.
  var SPRITES = ["sol.dehors", "sol.terre", "sol.zellige", "sol.bejmat", "sol.natte", "sol.marbre",
    "mur", "mur.haut", "mur.arcade", "mur.lawh", "mur.mihrab", "mur.panneau", "mur.khatt",
    "seuil", "seuil.g", "seuil.d", "bab.g", "bab.d", "minaret", "fontaine", "bassin", "eau.1", "eau.2"];
  Object.keys(NEUF).forEach(function (ch) { POSITIONS.forEach(function (p) { SPRITES.push(NEUF[ch] + "." + p); }); });
  Object.keys(OBJETS).forEach(function (ch) { if (SPRITES.indexOf(OBJETS[ch]) < 0) SPRITES.push(OBJETS[ch]); });   // v4.8 — deux tuiles peuvent partager une image

  // Le sol sous un objet posé : celui de la pièce (voisin de gauche/droite,
  // puis du haut, puis du bas). Un objet ne flotte jamais sur du noir.
  function fondPour(m, x, y) {
    var ordre = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var i = 0; i < ordre.length; i++) {
      var nx = x + ordre[i][0], ny = y + ordre[i][1];
      var ch = m.tuile(nx, ny);
      if (!m.solide(nx, ny) && (SOLS[ch] || NEUF[ch])) return ch;
    }
    return "_";
  }

  // L'origine d'un bloc : on remonte vers le haut puis vers la gauche tant
  // que la tuile appartient au bloc.
  function origineBloc(m, x, y, chars) {
    var x0 = x, y0 = y;
    while (chars.indexOf(m.tuile(x0 - 1, y)) >= 0) x0--;
    while (chars.indexOf(m.tuile(x, y0 - 1)) >= 0) y0--;
    return { x: x0, y: y0 };
  }

  function couchesSol(m, x, y, ch) {
    var v = function (dx, dy) { return m.tuile(x + dx, y + dy); };
    if (NEUF[ch]) return [{ s: NEUF[ch] + "." + neufPatch(v(0, -1) === ch, v(0, 1) === ch, v(-1, 0) === ch, v(1, 0) === ch) }];
    if (SOLS[ch]) return [{ s: SOLS[ch] }];
    return [{ s: "sol.terre" }];
  }

  // Les couches d'une case : { sol: [couches], objet: couche|null, eau: bool }.
  // Une couche est { s: clé } ou, pour un bloc, { s: clé, cx, cy } — la case
  // (cx, cy) de l'image du bloc.
  function couches(m, x, y) {
    var ch = m.tuile(x, y);
    var v = function (dx, dy) { return m.tuile(x + dx, y + dy); };
    var out = { sol: [], objet: null, eau: false };

    if (ch in MURS) {
      // convention des jeux vus de dessus : un mur montre sa FACE quand une
      // pièce s'ouvre dessous, et seulement son DESSUS quand le mur continue
      // (les murs latéraux, le mur du fond d'une salle)
      out.sol.push({ s: ch === "#" && m.solide(x, y + 1) ? "mur.haut" : "mur" });
      if (MURS[ch]) out.sol.push({ s: MURS[ch] });
      return out;
    }
    if (ch === "D") {
      out.sol.push({ s: "seuil" });
      if (v(-1, 0) !== "D") out.sol.push({ s: "seuil.g" });
      if (v(1, 0) !== "D") out.sol.push({ s: "seuil.d" });
      return out;
    }
    // v5.2 — Bab ar-Rihla (R) se peint comme le Bab : deux battants
    if (ch === "G" || ch === "R" || ch === "C") { out.sol.push({ s: v(-1, 0) === ch ? "bab.d" : "bab.g" }); return out; }
    if (BLOCS[ch]) {
      var b = BLOCS[ch], o = origineBloc(m, x, y, b.chars);
      out.sol.push({ s: b.sprite, cx: x - o.x, cy: y - o.y });
      if (ch === "F") out.eau = true;   // l'eau libre de la fontaine ondule (deux images alternées)
      return out;
    }
    if (OBJETS[ch]) {
      out.sol = couchesSol(m, x, y, fondPour(m, x, y));
      out.objet = { s: OBJETS[ch] };
      return out;
    }
    out.sol = couchesSol(m, x, y, ch);
    return out;
  }

  // ---- Les personnages : les couches teintables --------------------------------
  // La planche porte chaque figure en 4 directions × 2 pas, peinte en
  // couleurs-témoins. Un pixel se classe par sa teinte : gris → la djellaba,
  // vert → la peau, magenta → les cheveux ; le reste (yeux, contour,
  // babouches, tarbouche, taqiya, turban) garde sa couleur.
  var FIGURES = ["cheveux", "capuche", "tarbouche", "taqiya", "hijab", "turban", "cheikh", "lalla"];
  var DIRECTIONS = ["bas", "haut", "gauche", "droite"];

  function hex(h) { var n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function classer(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var sat = max === 0 ? 0 : (max - min) / max;
    if (max < 50) return null;            // le contour sombre garde sa couleur
    if (sat < 0.22) return "djellaba";
    if (g >= max && g > r * 1.5 && g > b * 1.5) return "peau";
    if (r > g * 1.6 && b > g * 1.6) return "cheveux";
    return null;
  }
  // La luminance du témoin, pour que la couleur choisie garde le modelé peint.
  var TEMOIN = { djellaba: 0.54, peau: 0.587, cheveux: 0.413 };
  function teinter(r, g, b, couleurs) {
    var cl = classer(r, g, b);
    if (!cl || !couleurs[cl]) return [r, g, b];
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    var k = lum / TEMOIN[cl];
    var c = hex(couleurs[cl]);
    return [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k))];
  }

  // La figure d'un avatar : son couvre-chef, ou une figure propre (les PNJ
  // anciens : `figure` dans l'avatar) quand la planche la connaît.
  function figurePour(avatar, connues) {
    var liste = connues || FIGURES;
    if (avatar && avatar.figure && liste.indexOf(avatar.figure) >= 0) return avatar.figure;
    if (avatar && liste.indexOf(avatar.tete) >= 0) return avatar.tete;
    return "cheveux";
  }

  return {
    TUILE_SRC: TUILE_SRC, TUILE_CSS: TUILE_CSS, ECHELLE: ECHELLE, FICHIERS: FICHIERS,
    SPRITES: SPRITES, POSITIONS: POSITIONS, FIGURES: FIGURES, DIRECTIONS: DIRECTIONS,
    SOLS: SOLS, NEUF: NEUF, MURS: MURS, OBJETS: OBJETS, BLOCS: BLOCS,
    neufPatch: neufPatch, fondPour: fondPour, origineBloc: origineBloc, couches: couches,
    classer: classer, teinter: teinter, figurePour: figurePour
  };
});
