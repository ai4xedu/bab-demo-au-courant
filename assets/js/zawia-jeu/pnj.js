// ZAW'IA — le jeu · LES PNJ : les gens de la cour.
//
// v2.5 — jusqu'ici la maison parlait par ses murs. Elle a maintenant des
// FIGURANTS : quelques personnes posées dans le vestibule et le Sahn, qui se
// tournent, marchent une petite ronde, et parlent quand on leur fait face.
// Ils sont dessinés comme le joueur (le même personnage procédural de
// rendu.js, avec un avatar parmi les options de regles.js) — rien de plus à
// dessiner, rien à héberger.
//
// Ce fichier est PUR (testé sous Node) : la liste, les rondes, le pas d'un
// PNJ, la collision avec le corps du joueur, le dialogue. jeu.js branche et
// rendu.js dessine.
//
// Trois règles :
//  - ⚠️ jamais le hasard du navigateur — une pause vient de `hache()` : deux
//    joueurs voient la même cour, et un test peut rejouer une ronde ;
//  - un PNJ ne se tient JAMAIS sur un seuil (D) ni sur l'apparition, et sa
//    ronde ne traverse que des tuiles franchissables — un test le garde ;
//  - le voile : personne ici ne nomme la maison ni ses cours. Un PNJ parle de
//    ce qu'il fait, pas de qui l'emploie.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.pnj = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var TUILE = 16;
  var VITESSE = 24;          // pixels monde par seconde — on flâne, on ne court pas
  var CORPS = { demi: 5, haut: 6 };   // la même boîte que monde.CORPS

  // ---- Les figurants ------------------------------------------------------------
  // x, y : la tuile de base (là où le PNJ se tient, ou d'où sa ronde part).
  // ronde : des tuiles-étapes, parcourues en boucle, chacune sur le même axe
  //   que la précédente — le PNJ marche droit, il ne coupe pas les coins.
  // attente : secondes de pause à chaque étape (plus un peu, par hache()).
  // pages : un tableau, ou une fonction du contexte { pseudo, arb3ine }.
  var PNJ = [
    // -- le vestibule : la première salle, sous le Bab --
    {
      cle: "bawwab", nom: "Ba Driss, le bawwab", x: 25, y: 4, dir: "gauche",
      avatar: { peau: 4, djellaba: 0, tete: "turban", figure: "cheikh" },   // v3.0 : un ancien, peint avec sa barbe et son bâton
      pages: function (ctx) {
        var pages = [
          "Salam, " + pseudo(ctx) + ". Je suis Ba Driss. Je tiens la porte — enfin, je la regarde : elle ne ferme pas.",
          "Dehors tu étais peut-être ingénieur, docteur, patron. Ici tu es Talib. Comme tout le monde le premier jour, moi compris.",
          "Bla hchouma, bla kbar rass. Pose tes questions, même les bêtes — surtout les bêtes. C'est comme ça qu'on apprend ici."
        ];
        // v3.6 — le bawwab dit le Wird du jour : c'est lui qu'on croise en entrant.
        var w = ctx && ctx.wird;
        if (w && w.prochain) pages.push("Ton Wird du jour : « " + w.prochain.titre + " » — " + w.prochain.minutes + " minutes, pas plus. Un par jour, quarante jours. Le Menu te dit lequel.");
        else if (w && w.fini) pages.push("Quarante Wird, quarante jours tenus. Maintenant, c'est la maison qui te dit la suite.");
        else if (w) pages.push("Ton Wird du jour est fait. Flâne, ou reviens demain — il y en aura un autre.");
        return pages;
      }
    },
    {
      cle: "nour", nom: "Nour", x: 19, y: 5, dir: "bas",
      avatar: { peau: 1, djellaba: 1, tete: "hijab" },
      ronde: [[19, 8], [19, 5]], attente: 2.5,
      pages: function (ctx) {
        return [
          "Toi aussi c'est ton premier jour ? Moi c'est Nour. Je tourne en rond depuis une heure, je n'ose pas descendre dans la cour.",
          "On m'a dit qu'il y a un coffre à la Khizana, avec des pages arrachées à un vieux livre. Des énigmes sur le pays. Ça me tente plus que je ne l'avoue.",
          "Allez, " + pseudo(ctx) + ". On se retrouve à la halqa ? Je te garde une place au cercle."
        ];
      }
    },
    {
      cle: "warraq", nom: "Si Abdellah, le warraq", x: 26, y: 8, dir: "gauche",
      avatar: { peau: 3, djellaba: 5, tete: "taqiya", figure: "cheikh" },
      pages: [
        "Quarante ans que je copie des manuscrits à la main. Une page par jour, les bons jours.",
        "La machine, elle, écrit mille pages le temps que je taille mon calame. Mais elle ne sait pas ce qu'elle copie. Elle ne sait pas quand elle se trompe.",
        "Alors toi, sache-le à sa place. Dire juste, voir juste — ça vient vite. Vérifier juste, c'est le métier. Le mien, et bientôt le tien."
      ]
    },

    // -- le Sahn : la cour, autour de la fontaine --
    {
      cle: "yassine", nom: "Yassine", x: 19, y: 15, dir: "droite",
      avatar: { peau: 2, djellaba: 2, tete: "capuche" },
      ronde: [[19, 15], [26, 15], [26, 20], [19, 20]], attente: 1.5,
      pages: function (ctx) {
        var a = ctx && ctx.arb3ine;
        return [
          "Je tourne autour de la fontaine, je récite, je retiens. Nsyan déteste la répétition — c'est ma meilleure arme contre lui.",
          a && !a.ecoule
            ? "Ton Arb3ine, tu en es au jour " + a.jour + " ? Le mien finit dans une semaine. Les quarante jours passent plus vite qu'on ne croit."
            : "Quarante jours pour les quatre premiers défis. Ça a l'air long. Ça ne l'est pas.",
          "Un conseil : ne reste pas seul avec tes écrans. Ce qu'on apprend ici, on l'apprend à plusieurs."
        ];
      }
    },
    {
      cle: "zhor", nom: "Lalla Zhor", x: 10, y: 14, dir: "droite",
      avatar: { peau: 2, djellaba: 4, tete: "hijab", figure: "lalla" },
      pages: [
        "Je suis assise sous cette galerie depuis plus longtemps que le zellige. J'ai vu passer des milliers de Tolba.",
        "Ceux qui restent ne sont pas les plus brillants, ma fille, mon fils. Ce sont ceux qui reviennent. Encore, et encore.",
        "Nsyan efface ce qu'on ne répète pas. Moi, je me souviens de chacun. Reviens, et je me souviendrai de toi."
      ]
    },
    {
      cle: "omar", nom: "Omar", x: 33, y: 18, dir: "gauche",
      avatar: { peau: 3, djellaba: 7, tete: "cheveux" },
      pages: [
        "J'ai fini mon Arb3ine la semaine dernière. Tu veux savoir le secret ? Il n'y en a pas. La présence, c'est tout.",
        "Mon M39ol, personne ne me l'a vendu, et je ne l'ai pas réclamé. Il m'a été donné, à la halqa, devant tout le monde. Ça change tout.",
        "La technique, tu la gagnes à l'établi de la Madrasa. La mémoire, au sandouq. Mais le rang — ça, c'est ensemble ou rien."
      ]
    }
  ];

  function pseudo(ctx) { return ctx && ctx.pseudo ? ctx.pseudo : "Talib"; }

  // Le hasard REPRODUCTIBLE — le même que rendu.js et intro.js.
  function hache(x, y, s) {
    var n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s || 0, 2246822519)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function graine(cle) {
    var g = 7;
    for (var i = 0; i < cle.length; i++) g = (Math.imul(g, 31) + cle.charCodeAt(i)) | 0;
    return g;
  }

  var OPPOSE = { haut: "bas", bas: "haut", gauche: "droite", droite: "gauche" };
  function faceA(dir) { return OPPOSE[dir] || "bas"; }

  // Les pieds au bas d'une tuile — comme l'apparition du joueur.
  function pied(tx, ty) { return { x: tx * TUILE + TUILE / 2, y: ty * TUILE + TUILE - 1 }; }
  function tuileDe(p) { return { x: Math.floor(p.x / TUILE), y: Math.floor((p.y - 2) / TUILE) }; }

  // Les tuiles que foule une ronde, étape par étape (droit, sur un axe).
  function tuilesDeRonde(pnj) {
    var out = [[pnj.x, pnj.y]];
    var r = pnj.ronde || [];
    for (var i = 0; i < r.length; i++) {
      var a = i === 0 ? [pnj.x, pnj.y] : r[i - 1], b = r[i];
      var dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
      var x = a[0], y = a[1];
      while (x !== b[0] || y !== b[1]) { x += dx; y += dy; out.push([x, y]); }
    }
    return out;
  }

  // ---- L'état vivant ----------------------------------------------------------------
  // v5.2 — `liste` : les gens d'une région du mode Rihla (fes.js) ; sans elle, ceux de la cour.
  function creer(liste) {
    return (liste || PNJ).map(function (d, i) {
      var p = pied(d.x, d.y);
      return {
        cle: d.cle, nom: d.nom, avatar: d.avatar, base: d.dir,
        x: p.x, y: p.y, dir: d.dir, frame: 0, animT: 0,
        ronde: d.ronde || null, etape: 0, attente: d.attente || 2,
        pause: 1 + hache(i, 0, graine(d.cle)) * 2,   // ils ne partent pas tous en même temps
        regard: 0
      };
    });
  }

  // Deux corps se touchent-ils ? La boîte est celle de monde.CORPS.
  function seTouchent(ax, ay, bx, by) {
    return Math.abs(ax - bx) < CORPS.demi * 2 && Math.abs(ay - by) < CORPS.haut;
  }
  // Le corps du joueur en (x, y) heurte-t-il un PNJ ?
  function heurte(pnjs, x, y) {
    for (var i = 0; i < pnjs.length; i++) if (seTouchent(x, y, pnjs[i].x, pnjs[i].y)) return pnjs[i];
    return null;
  }
  // Le PNJ qui se tient sur la tuile (tx, ty), s'il y en a un.
  function aTuile(pnjs, tx, ty) {
    for (var i = 0; i < pnjs.length; i++) {
      var t = tuileDe(pnjs[i]);
      if (t.x === tx && t.y === ty) return pnjs[i];
    }
    return null;
  }

  // Un pas d'un PNJ. `libre(x, y)` est monde.libre ; `joueur` la position du
  // joueur (ou null) ; `fige` gèle tout le monde (une boîte de dialogue est
  // ouverte). Un PNJ ne marche jamais dans un mur ni dans le joueur : s'il
  // est bloqué, il attend — il ne pousse personne.
  function avancer(n, dt, libre, joueur, fige, pnjs) {
    if (n.regard > 0) { n.regard -= dt; if (n.regard <= 0 && !n.ronde) n.dir = n.base; }
    if (fige || !n.ronde) { n.frame = 0; n.animT = 0; return n; }
    if (n.pause > 0) { n.pause -= dt; n.frame = 0; n.animT = 0; return n; }
    var cible = pied(n.ronde[n.etape][0], n.ronde[n.etape][1]);
    var dx = cible.x - n.x, dy = cible.y - n.y;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
      n.x = cible.x; n.y = cible.y;
      n.etape = (n.etape + 1) % n.ronde.length;
      n.pause = n.attente + hache(n.etape, 1, graine(n.cle)) * 1.5;
      n.frame = 0; n.animT = 0;
      return n;
    }
    var pas = VITESSE * dt;
    var nx = n.x, ny = n.y;
    if (Math.abs(dx) >= Math.abs(dy)) { nx += Math.sign(dx) * Math.min(pas, Math.abs(dx)); n.dir = dx < 0 ? "gauche" : "droite"; }
    else { ny += Math.sign(dy) * Math.min(pas, Math.abs(dy)); n.dir = dy < 0 ? "haut" : "bas"; }
    var bloque = !libre(nx, ny) || (joueur && seTouchent(nx, ny, joueur.x, joueur.y));
    if (!bloque && pnjs) {
      for (var i = 0; i < pnjs.length; i++) if (pnjs[i] !== n && seTouchent(nx, ny, pnjs[i].x, pnjs[i].y)) { bloque = true; break; }
    }
    if (bloque) { n.frame = 0; n.animT = 0; return n; }
    n.x = nx; n.y = ny;
    n.animT += dt;
    n.frame = [0, 1, 0, 2][Math.floor(n.animT * 7) % 4];
    return n;
  }

  // Quand on lui parle : il se tourne vers le joueur, et garde le regard un moment.
  function interpeller(n, dirDuJoueur) {
    n.dir = faceA(dirDuJoueur);
    n.regard = 4;
    return n;
  }

  function dialogue(n, ctx) {
    var d = null;
    for (var i = 0; i < PNJ.length; i++) if (PNJ[i].cle === n.cle) d = PNJ[i];
    if (!d) return null;
    var pages = typeof d.pages === "function" ? d.pages(ctx || {}) : d.pages.slice();
    return { nom: d.nom, pages: pages };
  }

  return {
    PNJ: PNJ, VITESSE: VITESSE, CORPS: CORPS,
    creer: creer, avancer: avancer, heurte: heurte, aTuile: aTuile, seTouchent: seTouchent,
    interpeller: interpeller, faceA: faceA, dialogue: dialogue,
    pied: pied, tuileDe: tuileDe, tuilesDeRonde: tuilesDeRonde, hache: hache
  };
});
