// ZAW'IA — le jeu · LES PALIERS : ce qui s'ouvre, et quand (pur : ni DOM, ni horloge).
//
// v5.5 — la cohérence (19/09/2026, « proceed to your recommendations ») : le jeu
// avait grandi en une semaine — six nombres, une douzaine de salles, deux modes —
// et un nouveau venu voyait tout le premier jour. Ce module dit trois choses :
//  1. LA BOUCLE, dite à voix haute : apprendre dans la zawia, le prouver à Fès,
//     le partager à la halqa. Chaque salle appartient à l'un des trois verbes ;
//     le menu et le Wird sont rangés ainsi ;
//  2. LES PALIERS : le jour 1, la cour et le tutoriel ; la fin du tutoriel ouvre
//     la porte du temps et le mot du jour ; le jour 2, les autres jeux. Ce qui
//     n'est pas encore ouvert se dit (« demain »), il ne se cache pas en silence ;
//  3. un ancien ne perd rien : dès le 2ᵉ jour de l'Arb3ine, tout est ouvert.
//
// Règles tenues par les tests : jamais un point, jamais un lien, jamais l'horloge
// (jeu.js donne le jour de l'Arb3ine et l'état du tutoriel) ; ce module ne ferme
// rien que la base tienne — il règle ce que l'écran PROPOSE.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.paliers = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var BOUCLE = "Apprendre dans la zawia · le prouver à Fès · le partager à la halqa.";
  var VERBES = [
    { cle: "apprendre", nom: "Apprendre", ou: "dans la zawia" },
    { cle: "jouer", nom: "Jouer", ou: "à Fès et dans la cour" },
    { cle: "partager", nom: "Partager", ou: "à la halqa" }
  ];

  // Ce qui s'ouvre après l'accueil. Tout le reste est ouvert dès l'entrée.
  //   apres : "tutoriel" — la fin du tutoriel l'ouvre (ou le 2ᵉ jour) ;
  //           "jour2"    — le 2ᵉ jour de l'Arb3ine l'ouvre.
  var PALIERS = {
    rihla: { apres: "tutoriel", nom: "Bab ar-Rihla" },
    kelma: { apres: "tutoriel", nom: "Lkelma d'lyoum" },
    atay: { apres: "jour2", nom: "Atay" },
    qlil: { apres: "jour2", nom: "Qlil w mfid" },
    khessa: { apres: "jour2", nom: "La fontaine du Sahn" },
    nsyan: { apres: "jour2", nom: "Chkoun Nsyan ?" },
    wach: { apres: "jour2", nom: "Wach hadi IA ?" },
    jeux: { apres: "jour2", nom: "Les jeux de la cour" },   // l'annonce de Ba Driss
    // v7.7 — le Mechouar : au 2e jour, comme le reste. La nzaha y est ouverte
    // tout de suite, mais la place n'apparaît pas le jour 1 : on entre dans la
    // cour avant d'entrer dans un cercle.
    mechouar: { apres: "jour2", nom: "Al-Mechouar" }
  };

  // ctx : { jour: jour de l'Arb3ine (1…40), ecoule: bool, tutorielFini: bool }
  function deuxiemeJour(ctx) { return !!(ctx && (ctx.ecoule || Math.floor(Number(ctx.jour) || 1) >= 2)); }
  function accueilFait(ctx) { return !!(ctx && ctx.tutorielFini) || deuxiemeJour(ctx); }
  function ouvert(cle, ctx) {
    var p = PALIERS[cle];
    if (!p) return true;
    return p.apres === "tutoriel" ? accueilFait(ctx) : deuxiemeJour(ctx);
  }

  // La ligne du menu : ce qui vient, dit une fois, sous « Jouer ». Vide quand tout est ouvert.
  function bientot(ctx) {
    if (deuxiemeJour(ctx)) return "";
    if (!accueilFait(ctx)) return "Après le tutoriel : la porte du temps et le mot du jour. Demain : les autres jeux de la cour.";
    return "Demain : l'Atay, le golf du prompt, la fontaine du Sahn et les jeux entre amis.";
  }

  // Ce que dit une tuile encore fermée — elle explique, et elle oriente.
  function refus(cle, ctx) {
    var p = PALIERS[cle];
    if (!p || ouvert(cle, ctx)) return null;
    if (cle === "mechouar") {
      // une place, pas un jeu — et on dit ce qu'on y fera, pour donner envie
      return { nom: p.nom, pages: [
        "La place est encore fermée pour toi.",
        "Elle s'ouvre au deuxième jour de ton Arb3ine. Entre d'abord dans la cour ; on entre dans un cercle après."
      ] };
    }
    if (cle === "rihla") {
      return { nom: p.nom, pages: [
        "La porte du temps est encore fermée pour toi.",
        "Elle s'ouvre quand le mou'allim t'a montré la maison : finis le tutoriel (Menu › Le tutoriel), ou reviens demain."
      ] };
    }
    if (p.apres === "tutoriel") {
      return { nom: p.nom, pages: ["Ce jeu s'ouvre à la fin du tutoriel. Le mou'allim te montre d'abord la maison."] };
    }
    return { nom: p.nom, pages: [
      "Ce jeu s'ouvre demain, au deuxième jour de ton Arb3ine.",
      "Aujourd'hui, la maison d'abord : le Wird dit par où commencer."
    ] };
  }

  return {
    BOUCLE: BOUCLE, VERBES: VERBES, PALIERS: PALIERS,
    deuxiemeJour: deuxiemeJour, accueilFait: accueilFait, ouvert: ouvert, bientot: bientot, refus: refus
  };
});
