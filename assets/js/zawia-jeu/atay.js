// ZAW'IA — le jeu · ATAY : le thé versé de haut (pur : ni DOM, ni horloge).
//
// v4.7 — sous les orangers du riad, un berrad et trois verres. Un seul
// bouton : on TIENT pour lever la théière et verser, on LÂCHE pour la
// redescendre. Plus on verse haut, plus la rghwa monte — mais plus le filet
// danse, et ce qui tombe à côté du verre reste sur la siniya.
//
// Cinq règles, tenues par les tests :
//  1. jamais le hasard du navigateur : le filet danse selon `onde(t)`, deux
//     sinus fixes — deux joueurs ont la même main, seul le geste diffère ;
//  2. la physique est ici, pas dans jeu.js : `pas(etat, dt, tient)` avance
//     d'un instant, et Node rejoue un service entier sans navigateur ;
//  3. le berrad tient BERRAD verres : qui renverse trop n'a plus de quoi finir ;
//  4. AUCUN POINT : ni M39ol, ni Sna3a, ni Dhakira. Le thé compte des verres ;
//  5. l'Atay est un rituel de la charte — on le sert, on ne le vend pas.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.atay = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var VERRES = 3;          // un service : trois verres
  var MONTEE = 0.85;       // hauteur gagnée par seconde, main tenue (0 → 1)
  var DESCENTE = 1.6;      // hauteur perdue par seconde, main lâchée
  var DEBIT = 0.28;        // un verre se remplit en ≈ 3,6 s de versé
  var BERRAD = 3.9;        // ce que tient la théière, en verres : de quoi rater un peu
  var AMPLITUDE = 2.3;     // l'écart du filet à pleine hauteur, en demi-bouches de verre
  var BOUCHE = 1;          // la demi-largeur de la bouche du verre
  var HAUT_PARFAIT = 0.8;  // à partir de cette hauteur, la rghwa est pleine
  var PENALITE = 40;       // points perdus par verre renversé sur la siniya
  var GESTE = "atay";      // la goutte qu'il verse à la fontaine (khessa.js)

  // Le filet : deux sinus fixes, entre -1 et 1 — jamais le hasard du navigateur.
  function onde(t) { return 0.62 * Math.sin(2.3 * t) + 0.38 * Math.sin(3.9 * t + 1.3); }
  // L'écart du filet à une hauteur : nul main basse, large main haute.
  function amplitude(h) { return AMPLITUDE * Math.pow(Math.max(0, Math.min(1, h)), 1.5); }
  function dansLeVerre(x) { return Math.abs(x) <= BOUCHE; }

  function nouveau() {
    var verres = [];
    for (var i = 0; i < VERRES; i++) verres.push({ niveau: 0, mousse: 0, renverse: 0 });
    return { t: 0, h: 0, x: 0, tient: false, verse: false, verre: 0, verres: verres, berrad: BERRAD, fini: false, vide: false };
  }
  function copier(e) {
    return { t: e.t, h: e.h, x: e.x, tient: e.tient, verse: e.verse, verre: e.verre, berrad: e.berrad, fini: e.fini, vide: e.vide,
      verres: e.verres.map(function (v) { return { niveau: v.niveau, mousse: v.mousse, renverse: v.renverse }; }) };
  }

  // Un instant de service. `tient` : la main est-elle posée sur le bouton ?
  function pas(etat, dt, tient) {
    var e = copier(etat);
    dt = Math.max(0, Math.min(0.1, Number(dt) || 0));   // un onglet ralenti ne fait pas sauter la théière
    e.t += dt;
    e.tient = !!tient && !e.fini;
    e.h = e.tient ? Math.min(1, e.h + MONTEE * dt) : Math.max(0, e.h - DESCENTE * dt);
    e.x = amplitude(e.h) * onde(e.t);
    e.verse = e.tient && e.berrad > 0;
    if (e.verse) {
      var vol = Math.min(DEBIT * dt, e.berrad);
      e.berrad -= vol;
      var v = e.verres[e.verre];
      if (dansLeVerre(e.x)) {
        var entre = Math.min(vol, 1 - v.niveau);
        v.niveau += entre;
        v.mousse += entre * Math.min(1, e.h / HAUT_PARFAIT);
        v.renverse += vol - entre;
      } else {
        v.renverse += vol;
      }
      if (v.niveau >= 1 - 1e-9) {
        v.niveau = 1;
        e.verre += 1;
        if (e.verre >= VERRES) { e.verre = VERRES - 1; e.fini = true; e.tient = false; e.verse = false; }
      }
      if (!e.fini && e.berrad <= 1e-9) { e.berrad = 0; e.fini = true; e.vide = true; e.tient = false; e.verse = false; }
    }
    return e;
  }

  // Le compte d'un service : la rghwa (la hauteur moyenne du versé qui est
  // entré), ce qui est tombé sur la siniya, et une note sur cent.
  function score(etat) {
    var niveau = 0, mousse = 0, renverse = 0, pleins = 0;
    etat.verres.forEach(function (v) { niveau += v.niveau; mousse += v.mousse; renverse += v.renverse; if (v.niveau >= 1 - 1e-9) pleins += 1; });
    var rghwa = niveau > 0 ? mousse / niveau : 0;
    var brut = 100 * rghwa - PENALITE * renverse;
    var note = Math.max(0, Math.min(100, Math.round(brut * (niveau / VERRES))));
    return { note: note, rghwa: Math.round(100 * rghwa), renverse: Math.round(renverse * 100) / 100, gouttes: Math.round(renverse * 20), pleins: pleins, niveau: niveau };
  }

  // Ce que dit celui qui goûte.
  function verdict(s) {
    var n = s && typeof s.note === "number" ? s.note : 0;
    if (s && s.pleins < VERRES) return "Le berrad est vide, et la siniya est pleine. On recommence ?";
    if (n >= 90) return "Rghwa bhal lqtn — de la mousse comme du coton. Qui t'a appris à verser comme ça ?";
    if (n >= 70) return "Atay m9ad. Le verre chante, la mousse tient.";
    if (n >= 45) return "Mzyan. Encore un peu de hauteur, et la rghwa viendra.";
    return "Du thé, oui. De la rghwa, pas encore. Lève la main — doucement.";
  }

  // Qui goûte aujourd'hui : un des gens de la cour, selon le jour — le même
  // pour tous. `jourN` : un entier (le numéro du jour).
  var GOUTEURS = ["zhor", "bawwab", "warraq", "omar", "yassine", "nour"];
  function gouteur(jourN) { var n = Math.abs(Math.floor(Number(jourN) || 0)); return GOUTEURS[n % GOUTEURS.length]; }

  // ---- Ce qu'on garde (recit.atay) --------------------------------------------------
  //   s : services servis ; v : verres pleins ; m : la meilleure note ;
  //   dj : le jour du dernier service (AAAA-MM-JJ) ; mj : la meilleure note ce jour-là.
  function normaliserEtat(x) {
    var e = { s: 0, v: 0, m: 0, dj: "", mj: 0 };
    if (!x || typeof x !== "object") return e;
    e.s = Math.max(0, Math.floor(Number(x.s) || 0));
    e.v = Math.max(0, Math.floor(Number(x.v) || 0));
    e.m = Math.max(0, Math.min(100, Math.floor(Number(x.m) || 0)));
    if (typeof x.dj === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.dj)) { e.dj = x.dj; e.mj = Math.max(0, Math.min(100, Math.floor(Number(x.mj) || 0))); }
    return e;
  }
  function enregistrer(x, s, jour) {
    var e = normaliserEtat(x);
    var memeJour = e.dj === jour;
    return {
      s: e.s + 1, v: e.v + (s.pleins || 0), m: Math.max(e.m, s.note || 0),
      dj: jour, mj: memeJour ? Math.max(e.mj, s.note || 0) : (s.note || 0)
    };
  }
  function servi(x, jour) { return normaliserEtat(x).dj === jour; }

  return {
    VERRES: VERRES, MONTEE: MONTEE, DESCENTE: DESCENTE, DEBIT: DEBIT, BERRAD: BERRAD, AMPLITUDE: AMPLITUDE,
    BOUCHE: BOUCHE, HAUT_PARFAIT: HAUT_PARFAIT, PENALITE: PENALITE, GESTE: GESTE, GOUTEURS: GOUTEURS,
    onde: onde, amplitude: amplitude, dansLeVerre: dansLeVerre, nouveau: nouveau, pas: pas,
    score: score, verdict: verdict, gouteur: gouteur,
    normaliserEtat: normaliserEtat, enregistrer: enregistrer, servi: servi
  };
});
