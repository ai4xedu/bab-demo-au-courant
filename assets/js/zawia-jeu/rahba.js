// ZAW'IA — le jeu · LA RAHBA : la place du Souk, dehors des murs (pur : ni DOM, ni horloge).
//
// v5.7 — « le Souk doit être un vrai endroit, où les joueurs se rencontrent et
// font des affaires ; la zawia prend 5 % ; et que le marché soit TRÈS coloré »
// (Youssef, 19/09/2026). Jusqu'ici le Souk était un PANNEAU qu'on ouvrait au
// Bab. Il est maintenant une PLACE : on sort par le Bab, on marche sur la
// Rahba (الرحبة — la place du marché, comme Rahba Kedima à Marrakech), et
// chaque ferracha du site y est un étal posé à même le sol, sous un auvent
// rayé de la couleur de son marchand. Les autres joueurs y sont en direct
// (le Sahn ouvert, sur son propre canal) ; devant un étal, on propose un
// prix — la Safqa (safqa.js) ; la zawia prend sa smsra, cinq pour cent.
//
// Ce fichier est la RÉGION, comme fes.js pour la Rihla : sa carte (montée par
// la fabrique de monde.js — mêmes collisions, même désenclavement), ses
// VINGT-SIX places d'étal et l'ordre dans lequel on les donne, ses couleurs, ses
// gens, ses dialogues, et la géométrie de ce qui la rend colorée (la corde
// des teinturiers, les guirlandes) — que jeu.js dessine par-dessus le rendu.
//
// LA QISSARIA (القيسارية — le marché couvert des belles choses, au cœur des
// médinas) : au fond de la place, sous la grande toile aux couleurs de la
// maison, LA VITRINE DE LA MAISON ELLE-MÊME (demande de Youssef, 19/09/2026 :
// « un super shop de la maison, où tous nos produits sont exposés »). Six
// vitrines et une porte. ⚠️ Le code ne porte AUCUN nom, aucun produit : les
// vitrines montrent le catalogue que le bureau tient EN BASE (zawia_ressources,
// genre « produit », le même que lit la bibliothèque), et la base ne rend à
// chacun que ce qu'il peut voir — ouvert à tous, ou gens de la maison. Le
// voile est une porte (v3.8) : un Talib libre voit des volets fermés, et
// sait pourquoi. Rien ne se vend ici : un lien mène chez la maison.
//
// Règles tenues par les tests :
//  1. la carte est un rectangle fermé où chaque étal se rejoint À PIED, et
//     devant lequel on peut se tenir ; l'apparition est devant le Bab, face à
//     la place ; aucune place ne chevauche une autre ;
//  2. la carte est LA MÊME pour tous (pas un tracé qui dépend de qui est là) :
//     les positions des autres joueurs se valident contre elle ; une place vide
//     est une place vide, elle se dit ;
//  3. la ferracha nº k va à la place nº k pour tout le monde ; qui n'a pas de
//     tapis reçoit la première place libre, la sienne, marquée « Ta place » ;
//  4. aucun hasard du navigateur : la couleur d'un marchand vient d'un hachage
//     de qui il est — deux joueurs voient le même Souk ;
//  5. la charte : jamais un coupable, aucun lien, aucun nom de la maison, aucun
//     point ; la smsra se DIT ici (cinq pour cent), safqa.js la CALCULE.
//
// v8.7 — LE DERB T-TADAMOUN (درب التضامن, 24/09/2026) : par un passage dans le mur
// est de la place, une ruelle de pierre claire — auvents verts, un arganier, le
// puits de la Twiza et sa bannière. Ses douze étals sont des TAPIS DE PROJET : les
// projets solidaires des membres (tadamoun.js), un par porteur, dans l'ordre du
// site comme sur la place. On n'y marchande pas, et la zawia n'y prend rien.
(function (root, factory) {
  "use strict";
  var M = (typeof module === "object" && module.exports) ? require("./monde.js") : (root.ZWJ && root.ZWJ.monde);
  var api = factory(M);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.rahba = api;
})(typeof window !== "undefined" ? window : globalThis, function (M) {
  "use strict";
  if (!M || typeof M.monter !== "function") throw new Error("rahba.js : charger monde.js avant.");

  var CLE = "rahba", NOM = "La Rahba du Souk", AR = "رحبة السوق";
  var LARGEUR = 57, HAUTEUR = 30;   // v8.7 — la place (0-43), puis le Derb derrière son mur est
  var SMSRA_PCT = 5;   // ce que le dellal DIT ; safqa.js et zawia-safqa.sql le calculent (un test compare)

  // ---- Les places d'étal : trente, dans l'ordre où on les donne ---------------------------
  // (x, y) : le coin haut-gauche d'un tapis de 2 × 2. Les premières sont les
  // plus proches du Bab (la rangée sud, du centre vers les bords) : la
  // ferracha nº 001 est la première qu'on voit en sortant. Puis la rangée du
  // milieu, de part et d'autre de la fontaine ; la rangée nord, sous la corde
  // des teinturiers ; enfin les deux allées, contre les murs.
  var PLACES = [
    { x: 18, y: 25 }, { x: 24, y: 25 }, { x: 14, y: 25 }, { x: 28, y: 25 }, { x: 10, y: 25 }, { x: 32, y: 25 }, { x: 6, y: 25 }, { x: 36, y: 25 },
    { x: 14, y: 12 }, { x: 28, y: 12 }, { x: 10, y: 12 }, { x: 32, y: 12 }, { x: 6, y: 12 }, { x: 36, y: 12 },
    { x: 11, y: 3 }, { x: 31, y: 3 }, { x: 7, y: 3 }, { x: 35, y: 3 }, { x: 3, y: 3 }, { x: 39, y: 3 },
    { x: 2, y: 8 }, { x: 40, y: 8 }, { x: 2, y: 16 }, { x: 40, y: 16 }, { x: 2, y: 20 }, { x: 40, y: 20 }
  ];
  var ETAL = 2;   // un tapis fait 2 × 2 tuiles

  var LANTERNES = [[2, 2], [10, 2], [33, 2], [41, 2], [16, 10], [27, 10], [16, 17], [27, 17]];
  var ORANGERS = [[5, 6], [38, 6], [5, 22], [38, 22]];
  var FONTAINE = { x: 20, y: 12 };            // le coin haut-gauche du bloc 4 × 4 (ffff / fFFf / fFFf / ffff)
  var ZELLIGE = { x0: 18, y0: 10, x1: 25, y1: 17 };   // le tour de la fontaine
  var BAB = [[21, 28], [22, 28]];             // le Bab de la zawia, vu de dehors : on rentre en lui parlant

  // ---- v8.7 — Le Derb t-Tadamoun, derrière le mur est de la place -------------------------
  // Une ruelle de 12 × 26 (x 43-54), pavée de pierre claire (« _ ») pour qu'on sache,
  // au premier pas, qu'on a changé de lieu ; le passage dans le mur (x 42, y 12-14)
  // s'ouvre au milieu, là où la bannière de la Twiza traverse la ruelle.
  var MUR_EST = 42;
  var DERB = { x0: 43, y0: 2, x1: 54, y1: 27, entree: [[42, 12], [42, 13], [42, 14]] };
  // Douze tapis de projet, en quatre rangées de trois. Donnés du plus proche du
  // passage au plus loin : les deux rangées du milieu d'abord, d'ouest en est.
  var PLACES_DERB = [
    { x: 44, y: 8 }, { x: 44, y: 18 }, { x: 48, y: 8 }, { x: 48, y: 18 }, { x: 52, y: 8 }, { x: 52, y: 18 },
    { x: 44, y: 3 }, { x: 44, y: 23 }, { x: 48, y: 3 }, { x: 48, y: 23 }, { x: 52, y: 3 }, { x: 52, y: 23 }
  ];
  var LANTERNES_DERB = [[43, 6], [54, 6], [43, 21], [54, 21]];
  var ARGANIER = { x: 46, y: 15 };            // le tronc ; sa ramure, jeu.js la dessine par-dessus (sous la bannière, jamais dedans)
  var PUITS = { x: 50, y: 13 };               // le coin haut-gauche d'une margelle de 2 × 2
  // La bannière de la Twiza, tendue d'un mur à l'autre au-dessus du passage (tuiles).
  var BANNIERE = { y: 10.35, x0: 43, x1: 55, cx: 49, largeur: 5.2, hauteur: 1.25 };

  // ---- La Qissaria : le pavillon de la maison, adossé au mur nord ---------------------------
  // Un bloc de murs (le toit) ; sa façade, au sud, porte quatre vitrines (« 2 »,
  // deux tuiles chacune) et la porte (« 1 », deux tuiles) ; deux vitrines de
  // plus sur ses flancs. On parle à une vitrine comme à un étal ; la porte
  // ouvre tout le catalogue. Les vitrines sont données dans l'ordre où le
  // catalogue les remplit : les deux du milieu d'abord, puis les côtés.
  var QISSARIA = { x0: 14, y0: 2, x1: 29, y1: 5, porte: [[21, 5], [22, 5]] };
  var VITRINES = [
    { x: 18, y: 5, w: 2, h: 1, face: "sud" }, { x: 24, y: 5, w: 2, h: 1, face: "sud" },
    { x: 15, y: 5, w: 2, h: 1, face: "sud" }, { x: 27, y: 5, w: 2, h: 1, face: "sud" },
    { x: 14, y: 2, w: 1, h: 2, face: "ouest" }, { x: 29, y: 2, w: 1, h: 2, face: "est" }
  ];

  // ---- La carte, CONSTRUITE (pas dessinée à la main : trente tapis à aligner) ---------------
  // Les mêmes caractères que la cour — la planche peinte les connaît tous —,
  // plus « e », l'étal (monde.js, atlas.js) : le sol de la place sous le
  // tapis, que jeu.js peint de la couleur du marchand.
  function construire() {
    var g = [], x, y;
    for (y = 0; y < HAUTEUR; y++) {
      var l = [];
      for (x = 0; x < LARGEUR; x++) {
        var bord = x === 0 || y === 0 || x === LARGEUR - 1 || y === HAUTEUR - 1;
        var mur = x === 1 || x === LARGEUR - 2 || y === 1 || y === HAUTEUR - 2 || x === MUR_EST;
        l.push(bord ? "w" : mur ? "#" : x > MUR_EST ? "_" : ",");
      }
      g.push(l);
    }
    for (y = ZELLIGE.y0; y <= ZELLIGE.y1; y++) for (x = ZELLIGE.x0; x <= ZELLIGE.x1; x++) g[y][x] = ".";
    for (y = 0; y < 4; y++) for (x = 0; x < 4; x++) g[FONTAINE.y + y][FONTAINE.x + x] = (x === 0 || x === 3 || y === 0 || y === 3) ? "f" : "F";
    LANTERNES.forEach(function (p) { g[p[1]][p[0]] = "L"; });
    ORANGERS.forEach(function (p) { g[p[1]][p[0]] = "T"; });
    BAB.forEach(function (p) { g[p[1]][p[0]] = "G"; });
    PLACES.forEach(function (p) { for (y = 0; y < ETAL; y++) for (x = 0; x < ETAL; x++) g[p.y + y][p.x + x] = "e"; });
    for (y = QISSARIA.y0; y <= QISSARIA.y1; y++) for (x = QISSARIA.x0; x <= QISSARIA.x1; x++) g[y][x] = "#";
    VITRINES.forEach(function (v) { for (y = 0; y < v.h; y++) for (x = 0; x < v.w; x++) g[v.y + y][v.x + x] = "2"; });
    QISSARIA.porte.forEach(function (p) { g[p[1]][p[0]] = "1"; });
    // v8.7 — le Derb : le passage, ses lanternes, l'arganier, le puits, ses tapis de projet
    DERB.entree.forEach(function (p) { g[p[1]][p[0]] = "_"; });
    LANTERNES_DERB.forEach(function (p) { g[p[1]][p[0]] = "L"; });
    g[ARGANIER.y][ARGANIER.x] = "a";
    for (y = 0; y < 2; y++) for (x = 0; x < 2; x++) g[PUITS.y + y][PUITS.x + x] = "u";
    PLACES_DERB.forEach(function (p) { for (y = 0; y < ETAL; y++) for (x = 0; x < ETAL; x++) g[p.y + y][p.x + x] = "e"; });
    return g.map(function (l) { return l.join(""); });
  }
  var CARTE = construire();

  // On sort du Bab : devant lui, face à la place.
  var APPARITION = { x: 22, y: 27, dir: "haut" };

  // Ce que dit une case quand aucune place n'y est posée (jeu.js passe avant pour « e » et « G »).
  var DIALOGUES = {
    "G": { nom: "Le Bab", pages: ["Le Bab de la zawia. Derrière, la cour — et dedans, on apprend. Ici, on montre."] },
    "f": { nom: "La fontaine de la Rahba", pages: ["La fontaine de la Rahba. On y boit avant de marchander — et après, pour se réconcilier avec le prix."] },
    "T": { nom: "Un oranger", pages: ["Un oranger de la Rahba. Il donne de l'ombre aux marchands et son parfum aux passants."] },
    "L": { nom: "Une lanterne", pages: ["Une lanterne du Souk. Le soir, la Rahba brille comme un tapis de fête."] },
    "e": { nom: "Un étal", pages: ["Un étal de la Rahba. Approche-toi de son tapis : on voit ce qu'on y pose."] },
    "1": { nom: "La Qissaria", pages: ["La Qissaria — la vitrine de la maison, sous la grande toile. Sa porte ouvre tout ce que la maison propose ; ses vitrines en montrent six."] },
    "2": { nom: "Une vitrine", pages: ["Une vitrine de la Qissaria. Ce qu'elle montre, c'est la maison qui le pose."] },
    // v8.7 — le Derb t-Tadamoun
    "a": { nom: "L'arganier du Derb", pages: [
      "L'arganier. Il ne pousse presque nulle part ailleurs que chez nous, dans le Souss — et des villages entiers en vivent, parce que les femmes en ont fait de l'huile, ensemble, en coopérative.",
      "Les chèvres y grimpent. Personne ne leur a appris : elles ont regardé les autres le faire."] },
    "u": { nom: "Le puits de la Twiza", pages: [
      "Le puits de la Twiza. Au douar, on ne creuse jamais un puits seul : chacun vient donner sa journée, et l'eau est à tous. C'est ça, la Twiza.",
      "Les projets de la ruelle attendent des mains. Regarde ce dont chacun a besoin : une heure de toi peut valoir plus qu'un don."] }
  };
  DIALOGUES["F"] = DIALOGUES["f"];

  var monde = M.monter({ carte: CARTE, legende: M.LEGENDE, apparition: APPARITION, dialogues: DIALOGUES });

  // ---- Les couleurs : douze, comme un zellige ---------------------------------------------------
  // Saturées, pour que la place soit une fête ; distinctes, pour qu'un tapis se
  // reconnaisse de loin. La couleur d'un marchand vient d'un hachage de qui il
  // est (son compte de jeu, sinon son adresse, sinon son nom) — la même pour
  // tous, la même demain.
  var PALETTE = [
    { cle: "safran", hex: "#f2b632" }, { cle: "majorelle", hex: "#2757b8" }, { cle: "corail", hex: "#e2552c" },
    { cle: "menthe", hex: "#2f8f5f" }, { cle: "fuchsia", hex: "#c8397f" }, { cle: "turquoise", hex: "#2ea6a0" },
    { cle: "orange", hex: "#ee8a2a" }, { cle: "violet", hex: "#6b4fbf" }, { cle: "olive", hex: "#8fb63a" },
    { cle: "rouge", hex: "#c22f2f" }, { cle: "indigo", hex: "#3b3f9e" }, { cle: "rose", hex: "#e7728f" }
  ];
  function hache(t) {
    var h = 2166136261;
    t = String(t || "");
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function couleurDe(graine) { return PALETTE[hache(graine) % PALETTE.length]; }
  function graineDe(t) { return t ? (t.joueur || t.slug || t.nom || "") : ""; }

  // ---- Qui étale où -------------------------------------------------------------------------
  // `tapis` : ce que souk.js a rangé (Sk.etat(...).tapis — un par marchand, dans
  // l'ordre du site : les fondateurs par rang, puis les joueurs sans dossier,
  // les plus anciens d'abord). `moi` : { pseudo } — pour la couleur de ma place
  // quand je n'ai encore rien étalé. Rend { places[], mienne, debordement[] } :
  //   · places[k] = { i, x, y, tapis|null, mien, libre, couleur, nom } ;
  //   · mienne : ma place (celle de mon tapis, ou la première libre) ;
  //   · debordement : les marchands au-delà de la trentième place — le dellal
  //     les tient (le panneau du Souk les montre tous).
  function placer(tapis, moi) {
    var liste = Array.isArray(tapis) ? tapis : [];
    var places = PLACES.map(function (p, i) {
      var t = liste[i] || null;
      return {
        i: i, x: p.x, y: p.y, tapis: t, mien: !!(t && t.moi), libre: !t,
        couleur: t ? couleurDe(graineDe(t)) : null, nom: t ? t.nom : ""
      };
    });
    var mienne = null;
    for (var k = 0; k < places.length; k++) if (places[k].mien) { mienne = places[k]; break; }
    if (!mienne && liste.length < places.length) {
      mienne = places[liste.length];
      mienne.mien = true;
      mienne.couleur = couleurDe((moi && moi.pseudo) || "talib");
    }
    return { places: places, mienne: mienne, debordement: liste.slice(places.length) };
  }
  // La place qui couvre la tuile (x, y), ou null.
  function placeA(places, x, y) {
    for (var i = 0; i < places.length; i++) {
      var p = places[i];
      if (x >= p.x && x < p.x + ETAL && y >= p.y && y < p.y + ETAL) return p;
    }
    return null;
  }
  // La tuile devant une place : celle du bas, au milieu — là où le fil d'or mène.
  function devantPlace(p) { return { x: p.x, y: p.y + ETAL }; }

  // ---- v8.7 — Qui pose où, dans le Derb ---------------------------------------------------------
  // Un tapis de projet par PORTEUR qui a au moins un projet solidaire (`t.derb`, que
  // souk.js a rangé à part), dans l'ordre du site — le même pour tous. Pas de « Ta
  // place » ici : on ne pousse personne à se dire solidaire ; ma place n'existe que
  // si j'ai posé un projet. Au-delà de douze, le panneau les montre tous.
  function placerDerb(tapis) {
    var porteurs = (Array.isArray(tapis) ? tapis : []).filter(function (t) { return t && Array.isArray(t.derb) && t.derb.length > 0; });
    var places = PLACES_DERB.map(function (p, i) {
      var t = porteurs[i] || null;
      return {
        i: i, x: p.x, y: p.y, tapis: t, mien: !!(t && t.moi), libre: !t, derb: true,
        couleur: t ? couleurDe(graineDe(t)) : null, nom: t ? t.nom : "", projets: t ? t.derb.length : 0
      };
    });
    var mienne = null;
    for (var k = 0; k < places.length; k++) if (places[k].mien) { mienne = places[k]; break; }
    return { places: places, mienne: mienne, debordement: porteurs.slice(places.length), porteurs: porteurs.length };
  }
  // Ce que dit un tapis de projet vide.
  function direPlaceDerb() {
    return { nom: "Une place du Derb", pages: ["Une place du Derb, sous l'auvent vert. Un projet solidaire posé depuis sa ferracha, « au Derb t-Tadamoun », vient s'étaler ici."] };
  }
  // Suis-je dans la ruelle ? (le HUD le dit, la musique ne change pas)
  function dansDerb(x, y) { return x >= DERB.x0 && x <= DERB.x1 && y >= DERB.y0 && y <= DERB.y1; }

  // ---- Les vitrines de la Qissaria ------------------------------------------------------------
  // `catalogue` : les lignes « produit » que la base a rendues au joueur (ressources.js
  // les a rangées par ordre). La k-ième remplit la k-ième vitrine ; les autres
  // restent des volets fermés — la porte, elle, montre tout. Une lettre et une
  // couleur par produit, tirées de son titre, toujours les mêmes.
  function vitrines(catalogue) {
    var liste = Array.isArray(catalogue) ? catalogue : [];
    return VITRINES.map(function (v, i) {
      var p = liste[i] || null;
      var lettre = p ? ((String(p.titre || "").match(/[\p{L}\p{N}]/u) || ["·"])[0].toUpperCase()) : "";
      return { i: i, x: v.x, y: v.y, w: v.w, h: v.h, face: v.face, produit: p, couleur: p ? couleurDe(p.titre) : null, lettre: lettre };
    });
  }
  function vitrineA(liste, x, y) {
    for (var i = 0; i < liste.length; i++) {
      var v = liste[i];
      if (x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.h) return v;
    }
    return null;
  }
  function estPorte(x, y) { return QISSARIA.porte.some(function (p) { return p[0] === x && p[1] === y; }); }
  // Ce que dit une vitrine sans produit : le voile est une porte.
  function direVitrineFermee(atelier) {
    return { nom: "Une vitrine fermée", pages: [atelier
      ? "Les volets sont tirés : en mode atelier, les vitrines de la Qissaria sont vides — le catalogue vit en base."
      : "Les volets sont tirés. Les vitrines de la Qissaria s'ouvrent aux gens de la maison — et à tous, le jour du dévoilement."] };
  }

  // ---- Les gens de la Rahba ---------------------------------------------------------------------
  // Même forme que les gens de la cour (pnj.js). Le dellal (الدلال — celui qui
  // crie les enchères et court entre les tapis) tourne autour de la fontaine ;
  // l'amin (أمين السوق — le garant des règles du métier) se tient près du Bab ;
  // Mi Fadma offre le thé ; un porteur traverse. Leurs paroles : `parler`.
  var PNJ = [
    { cle: "dellal", nom: "Si Lahcen, le dellal", x: 18, y: 9, dir: "droite", avatar: { peau: 3, djellaba: 6, tete: "tarbouche" },
      ronde: [[25, 9], [25, 18], [18, 18], [18, 9]], attente: 2 },
    { cle: "amin", nom: "Ba Hmed, l'amin du Souk", x: 20, y: 27, dir: "droite", avatar: { peau: 4, djellaba: 0, tete: "turban", figure: "cheikh" } },
    { cle: "fadma", nom: "Mi Fadma, le thé du Souk", x: 30, y: 20, dir: "bas", avatar: { peau: 2, djellaba: 4, tete: "hijab", figure: "lalla" } },
    { cle: "porteur", nom: "Un porteur", x: 5, y: 7, dir: "droite", avatar: { peau: 1, djellaba: 3, tete: "capuche" },
      ronde: [[38, 7], [5, 7]], attente: 3 },
    // v8.7 — Lalla Ito tient le puits de la Twiza (un prénom du Souss, où la Twiza est chez elle)
    { cle: "ito", nom: "Lalla Ito, de la Twiza", x: 49, y: 15, dir: "bas", avatar: { peau: 2, djellaba: 5, tete: "hijab", figure: "lalla" } }
  ];
  function pnj(cle) { for (var i = 0; i < PNJ.length; i++) if (PNJ[i].cle === cle) return PNJ[i]; return null; }
  function pluriel(n, mot) { return n + " " + mot + (n > 1 ? "s" : ""); }

  // ctx : { pseudo, marchands, mienne (j'ai un tapis), placeLibre (ma place est vide), aTraiter (affaires qui m'attendent) }
  function parler(cle, ctx) {
    var n = pnj(cle);
    if (!n) return null;
    ctx = ctx || {};
    var pseudo = String(ctx.pseudo || "").trim() || "Talib";
    var marchands = Math.max(0, Math.floor(Number(ctx.marchands) || 0));
    var aTraiter = Math.max(0, Math.floor(Number(ctx.aTraiter) || 0));
    var d = { nom: n.nom, pages: [], affaires: false, souk: false };
    if (cle === "dellal") {
      d.pages.push("Chkoun yzid ? Chkoun yzid ?… Ah, " + pseudo + " ! Bienvenue à la Rahba — la place du Souk, dehors des murs.");
      d.pages.push(marchands === 0
        ? "Personne n'a encore étalé. La première ferracha posée ici aura la meilleure place — juste devant le Bab."
        : pluriel(marchands, "ferracha") + " sur la place aujourd'hui. Approche-toi d'un tapis : tu vois ce qu'on y pose, et tu peux proposer ton prix.");
      d.pages.push("Une affaire se conclut à deux : l'acheteur propose, le vendeur accepte ; l'un dit « réglé », l'autre dit « livré ». La zawia prend " + SMSRA_PCT + " pour cent sur ce qui se conclut ici — la smsra. C'est ce qui tient la place.");
      if (!ctx.mienne) d.pages.push("Ta place t'attend" + (ctx.placeLibre ? " — la lanterne d'or te la montre" : "") + ". Pose ton premier produit, même petit, même en chantier.");
      d.pages.push("Et là-haut, sous la grande toile : la Qissaria — la vitrine de la maison elle-même. Ses vitrines montrent ce que la maison propose ; sa porte t'ouvre tout.");
      d.pages.push("Et par le passage du mur est : le Derb t-Tadamoun. Là, pas de marchandage — des projets solidaires qui cherchent des mains.");   // v8.7
      if (aTraiter > 0) { d.pages.push(pluriel(aTraiter, "affaire") + " attend" + (aTraiter > 1 ? "ent" : "") + " ta réponse. Je t'ouvre le registre."); d.affaires = true; }
      else d.pages.push("Tu veux voir tout le Souk d'un coup d'œil ? Demande-moi : je connais chaque tapis de la place.");
      d.souk = aTraiter === 0;
    } else if (cle === "amin") {
      d.pages = [
        "Je suis l'amin du Souk. Ici on ne vend pas de mots : on pose, et on tient parole.",
        "Ce qui se dit « réglé » a été réglé ; ce qui se dit « livré » a été livré. Le Souk ne compte que ce que les deux ont dit. Qui manque à sa parole touche la ligne rouge de la charte — et c'est moi qu'on vient voir.",
        "La smsra — " + SMSRA_PCT + " sur cent — se verse à la maison une fois l'affaire conclue. Le bureau la note reçue, et te le dit."
      ];
    } else if (cle === "fadma") {
      d.pages = [
        "Un verre, " + pseudo + " ? Ici le thé est offert — c'est le Souk qui régale.",
        "Marchande d'abord, bois ensuite : le sucre embrouille les prix."
      ];
    } else if (cle === "porteur") {
      d.pages = ["Balak ! Balak !… Les ferrachas arrivent par le Bab, et la Rahba se remplit chaque jour un peu plus."];
    } else if (cle === "ito") {
      // ctx.projets : les projets du Derb ; ctx.monProjet : j'en ai posé un
      var projets = Math.max(0, Math.floor(Number(ctx.projets) || 0));
      d.pages.push("Mrahba bik f Derb t-Tadamoun, " + pseudo + ". Ici, pas de produits à vendre : des projets qui ont besoin des autres.");
      d.pages.push(projets === 0
        ? "Personne n'a encore posé de projet dans la ruelle. Le premier qui le fait l'ouvre pour tous."
        : pluriel(projets, "projet") + " attend" + (projets > 1 ? "ent" : "") + " des mains aujourd'hui. Chacun dit ce dont il a besoin.");
      d.pages.push("Une coopérative, une association, une entreprise sociale, un projet RSE, une initiative de quartier — ou juste une idée. Tout a sa place ici, même ce qui n'a pas encore de nom.");
      d.pages.push("Tu peux aider ? Dis-le à son porteur : ton mot part dans sa boîte. Ton entreprise veut adopter un projet ? Écris au bureau, il fera le lien.");
      d.pages.push(ctx.monProjet
        ? "Ton projet a sa place, sous l'auvent vert à ton nom. Et ici, la zawia ne prend rien : pas de smsra sur la solidarité."
        : "Tu portes un projet ? Pose-le depuis ta ferracha, « au Derb t-Tadamoun ». Et ici, la zawia ne prend rien : pas de smsra sur la solidarité.");
      d.derb = true;
    }
    return d;
  }

  // La première fois sur la place : le dellal hèle depuis la fontaine.
  function accueil(pseudo) {
    var p = String(pseudo || "").trim() || "Talib";
    return {
      nom: "Si Lahcen, depuis la fontaine",
      pages: [
        p + " ! Par ici, la Rahba ! Chaque tapis que tu vois est la ferracha de quelqu'un de la maison — posée dehors des murs, sous son auvent.",
        "Marche jusqu'à un étal et fais face à son tapis : tu vois ce qu'on y pose, et tu proposes ton prix si le cœur t'en dit. Les autres joueurs sont là, en chair et en pixel : salue-les.",
        "Et pose le tien — la lanterne d'or dit où. Étale, ne raconte pas."
      ]
    };
  }

  // Ce que dit une place quand on lui fait face et qu'elle est vide.
  function direPlace(p, pseudo) {
    var nom = String(pseudo || "").trim() || "Talib";
    if (p && p.mien && p.libre) return { nom: "Ta place", pages: ["Ta place, " + nom + ". Étale ton premier produit ici — même petit, même en chantier. Ce que tu poses, toute la Rahba le voit."], mienne: true };
    return { nom: "Une place libre", pages: ["Une place libre. Le prochain ferrach qui pose son tapis l'aura."] };
  }

  // ---- Ce qui rend la place colorée (géométrie ; jeu.js dessine) --------------------------------
  // La corde des teinturiers (الصباغين) court sous le mur nord, d'une lanterne
  // à l'autre ; des écheveaux de laine teinte y pendent, une couleur après
  // l'autre. Rien au-dessus d'une lanterne. Unités : tuiles (flottantes).
  function corde() {
    var lanternesNord = LANTERNES.filter(function (p) { return p[1] === 2; }).map(function (p) { return p[0]; });
    var segments = [{ x0: 2, x1: QISSARIA.x0 - 0.2 }, { x0: QISSARIA.x1 + 1.2, x1: MUR_EST }];
    var echeveaux = [];
    for (var i = 0, x = 2.7; x <= 40.9; i++, x += 1.45) {
      var pres = lanternesNord.some(function (lx) { return Math.abs(x - (lx + 0.5)) < 0.75; });
      var dessus = segments.some(function (sg) { return x > sg.x0 + 0.2 && x < sg.x1 - 0.2; });
      if (pres || !dessus) continue;
      echeveaux.push({ x: x, couleur: PALETTE[(i * 5) % PALETTE.length].hex, hauteur: 0.85 + ((i * 7) % 3) * 0.12, phase: (i * 0.9) % 6.28 });
    }
    return { y: 1.72, segments: segments, echeveaux: echeveaux };
  }
  // Les guirlandes : entre deux lanternes d'une même rangée autour de la fontaine.
  function guirlandes() {
    var out = [];
    var ring = LANTERNES.filter(function (p) { return p[1] !== 2; });
    for (var i = 0; i < ring.length; i++) for (var j = i + 1; j < ring.length; j++) {
      if (ring[i][1] === ring[j][1]) out.push({ x0: Math.min(ring[i][0], ring[j][0]), x1: Math.max(ring[i][0], ring[j][0]), y: ring[i][1] });
    }
    return out;
  }
  // v8.7 — les fanions du Derb : trois cordes tendues d'un mur à l'autre, vert, blanc,
  // terre cuite — les couleurs de la Twiza, jamais celles d'un marchand. Chacune court
  // juste SOUS une rangée de tapis : jamais sur le nom d'un porteur (au-dessus d'un auvent).
  var TWIZA = ["#2f8f5f", "#f3e7c9", "#c45c3a"];
  function fanions() {
    return [5.05, 20.1, 25.1].map(function (y, k) {
      var n = 16, out = [];
      for (var i = 0; i < n; i++) out.push({ u: (i + 0.5) / n, couleur: TWIZA[(i + k) % TWIZA.length] });
      return { y: y, x0: DERB.x0 + 0.1, x1: DERB.x1 + 0.9, fanions: out };
    });
  }
  // Où poser les paquets sur un tapis : jusqu'à huit, en deux rangées, en tuiles depuis le coin du tapis.
  function paquets(n) {
    var k = Math.max(0, Math.min(8, Math.floor(Number(n) || 0))), out = [];
    for (var i = 0; i < k; i++) out.push({ x: 0.28 + (i % 4) * 0.4, y: 0.42 + Math.floor(i / 4) * 0.72, taille: 0.3 });
    return out;
  }

  return {
    CLE: CLE, NOM: NOM, AR: AR, LARGEUR: LARGEUR, HAUTEUR: HAUTEUR, SMSRA_PCT: SMSRA_PCT,
    CARTE: CARTE, APPARITION: APPARITION, DIALOGUES: DIALOGUES, monde: monde,
    PLACES: PLACES, ETAL: ETAL, LANTERNES: LANTERNES, ORANGERS: ORANGERS, FONTAINE: FONTAINE, ZELLIGE: ZELLIGE, BAB: BAB,
    QISSARIA: QISSARIA, VITRINES: VITRINES, vitrines: vitrines, vitrineA: vitrineA, estPorte: estPorte, direVitrineFermee: direVitrineFermee,
    PALETTE: PALETTE, hache: hache, couleurDe: couleurDe, graineDe: graineDe,
    placer: placer, placeA: placeA, devantPlace: devantPlace,
    PNJ: PNJ, pnj: pnj, parler: parler, accueil: accueil, direPlace: direPlace,
    corde: corde, guirlandes: guirlandes, paquets: paquets,
    // v8.7 — le Derb t-Tadamoun
    MUR_EST: MUR_EST, DERB: DERB, PLACES_DERB: PLACES_DERB, LANTERNES_DERB: LANTERNES_DERB,
    ARGANIER: ARGANIER, PUITS: PUITS, BANNIERE: BANNIERE, TWIZA: TWIZA,
    placerDerb: placerDerb, direPlaceDerb: direPlaceDerb, dansDerb: dansDerb, fanions: fanions
  };
});
