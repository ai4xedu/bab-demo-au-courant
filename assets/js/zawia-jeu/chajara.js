// ZAW'IA — le jeu · LA CHAJARA (الشجرة) : la lignée, côté navigateur (pur).
//
// La chajara est l'arbre d'où l'on vient : la promotion qui a formé un membre
// dans la maison. Elle se RECONNAÎT à l'entrée — le bureau pose une liste
// d'e-mails en base, le serveur rapproche, et le joueur n'a rien à déclarer.
// Deux mondes s'en déduisent : les GENS DE LA MAISON (chajara reconnue) et les
// TOLBA LIBRES (sans lignée), qui se promènent, retrouvent les pages perdues,
// lisent les rayons ouverts de la bibliothèque et étalent au Souk — mais ne
// s'assoient ni à l'établi, ni au rihal, ni au point hebdo.
//
// ⚠️ CE MODULE NE DÉCIDE RIEN, et c'est tout le dispositif. La clé du jeu est
//    publique : le cloisonnement vit en base (RLS sans policy, fonctions
//    SECURITY DEFINER — zawia-chajara.sql), jamais ici. Ce module ne fait que
//    DIRE POURQUOI une porte est fermée avant que le joueur ne s'y cogne ;
//    la base, elle, la tient fermée pour de vrai.
//
// ⚠️ AUCUN NOM DE PROMO NE VIT ICI — ni dans aucun fichier servi. Le libellé
//    d'une chajara vient du serveur, qui ne le rend qu'à son porteur (et,
//    demain, aux autres gens de la maison). Un test garde ce fichier, et le
//    voile s'applique : la maison ne se nomme pas.
//
// v3.8 — LE VOILE EST UNE PORTE (décision D1, 15/09/2026). Les gens de la
//    maison reçoivent, avec leur promo, le NOM de la maison et sa phrase
//    (`devoile`, lu en base par le serveur) ; les Tolba libres gardent le
//    voile. Ce module ne fait que remettre d'aplomb ce que le serveur rend :
//    `devoile` n'existe que si `maison` est vrai — jamais l'inverse.
//
// ⚠️ CE QUE LE GATE D'ÉCRAN NE GARDE PAS, et qu'il faut dire : l'établi est
//    corrigé par le navigateur et les axes solitaires (Sna3a, Dhakira) restent
//    déclaratifs (voir zawia-joueurs.sql). Fermer l'établi à un Talib libre
//    est une règle d'écran ; les portes qui comptent — les séances, le rihal,
//    ce que le Riwaq et la bibliothèque montrent — sont tenues par la base.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.chajara = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- Les deux mondes -----------------------------------------------------------
  var STATUTS = {
    maison: { cle: "maison", nom: "Gens de la maison", ar: "أهل الدار",
      sous: "la Chajara reconnue à l'entrée — jamais déclarée" },
    libre: { cle: "libre", nom: "Talib 7orr", ar: "طالب حر",
      sous: "sans lignée — le sandouq, la bibliothèque et le Souk lui sont ouverts" }
  };

  function statut(maison) { return maison ? STATUTS.maison : STATUTS.libre; }

  // ---- Ce que chaque monde ouvre ---------------------------------------------------
  // MIROIR de ce que la base tient : ici on l'explique avant, là-bas on le
  // tient pour de vrai. Le Riwaq et la bibliothèque s'ouvrent aux deux mondes —
  // c'est leur CONTENU que la base filtre (colonne `ouverte`, fonctions).
  var ACCES = {
    sandouq: { maison: true, libre: true },
    bibliotheque: { maison: true, libre: true },
    souk: { maison: true, libre: true },
    tableau: { maison: true, libre: true },
    riwaq: { maison: true, libre: true },
    etabli: { maison: true, libre: false },
    rihal: { maison: true, libre: false },
    seances: { maison: true, libre: false }
  };

  // Une pièce inconnue reste fermée à un Talib libre : on n'ouvre pas une
  // porte qu'on a oublié de déclarer (fail-close, comme le voile).
  function peut(maison, piece) {
    var a = ACCES[piece];
    if (!a) return !!maison;
    return maison ? a.maison : a.libre;
  }

  // ---- Ce qu'on dit à la porte fermée -----------------------------------------------
  // Le refus ORIENTE : le but de l'étage libre est d'observer des bâtisseurs,
  // pas de les éconduire. Chaque refus dit où aller construire — et c'est le
  // Souk qui fait voir le talent vers le haut.
  var REFUS = {
    etabli: { nom: "L'établi", pages: [
      "L'établi des Ta7addi est aux gens de la maison — ceux dont la Chajara, la lignée d'un parcours fini, a été reconnue à l'entrée.",
      "Toi, tu as le sandouq de la Khizana, les rayons ouverts de la bibliothèque — et le Souk, dehors des murs, où poser ce que tu construis.\nC'est là qu'on te verra. Étale, ne raconte pas."
    ] },
    rihal: { nom: "Le rihal", pages: [
      "Le rihal interroge les gens de la maison : ses questions viennent de ce qui s'apprend derrière la porte.",
      "Ce qui t'est ouvert vaut mieux qu'un quiz : les pages perdues du sandouq, les rayons de la bibliothèque, et le Souk pour montrer ce que tes mains savent faire."
    ] },
    seances: { nom: "Le point hebdo", pages: [
      "Le point hebdo se tient entre gens de la maison — le M39ol s'y gagne sur preuve, et il se reçoit d'un autre.",
      "Quand la maison ouvre une rencontre à tous, elle s'affiche au Riwaq comme les autres. Regarde ce qui y est posé."
    ] }
  };
  var REFUS_DEFAUT = { nom: "Une porte fermée", pages: [
    "Cette porte est aux gens de la maison. Le sandouq, la bibliothèque et le Souk, eux, te sont ouverts."
  ] };

  function refus(piece) {
    var r = REFUS[piece] || REFUS_DEFAUT;
    // une copie : la boîte de dialogue n'a pas à partager ses pages avec le module
    return { nom: r.nom, pages: r.pages.slice() };
  }

  // ---- Ce que le serveur répond, remis d'aplomb --------------------------------------
  // zawia_reclamer_chajara() rend { ok, maison, chajara } — et le mode atelier
  // rend { maison: true, chajara: null, atelier: true } : l'atelier est à soi,
  // on y démontre tout, et il ne simule JAMAIS un nom de promo (le voile).
  function texte(v, max) { return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null; }
  function normaliser(r) {
    var maison = !!(r && r.maison);
    var d = maison && r.devoile && typeof r.devoile === "object" ? r.devoile : null;
    var nom = d ? texte(d.nom, 60) : null;
    return {
      maison: maison,
      chajara: r && typeof r.chajara === "string" && r.chajara.trim() ? r.chajara.trim().slice(0, 80) : null,
      // le nom de la maison ne se garde qu'avec une lignée reconnue — et jamais sans nom
      devoile: nom ? { nom: nom, phrase: texte(d.phrase, 400) || "", phrase_ar: texte(d.phrase_ar, 400) || "" } : null
    };
  }

  return {
    STATUTS: STATUTS, ACCES: ACCES,
    statut: statut, peut: peut, refus: refus, normaliser: normaliser
  };
});
