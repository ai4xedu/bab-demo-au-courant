// ZAW'IA — le jeu · L'IMTIHAN (الامتحان) : l'épreuve, côté navigateur (pur).
//
// On s'assied au rihal — le pupitre de lecture — et on répond à une question,
// seul, chronométré. Les questions viennent des quiz de la plateforme
// d'apprentissage ; elles mesurent ce qu'on sait de l'IA, pas ce qu'on sait
// faire (ça, c'est l'établi) ni ce qu'on sait du pays (ça, c'est le sandouq).
//
// ⚠️ CE MODULE NE SAIT PAS QUELLE RÉPONSE EST JUSTE, et c'est tout le
//    dispositif. Le serveur sert l'énoncé et les options mélangées, sans dire
//    laquelle est bonne ; il compare, il chronomètre, il crédite. Ici on ne
//    fait qu'afficher et compter les secondes qui restent — un chronomètre
//    d'affichage, jamais l'arbitre.
//
// Les trois règles, posées par Youssef, et où chacune est tenue :
//   · une question ne se répète jamais       → base (le tirage est enregistré)
//   · quitter la fenêtre brûle la question   → ici (on le signale), base (elle l'acte)
//   · le chronomètre est court                → base (l'heure de service fait foi)
//
// Le coefficient est FAIBLE et c'est délibéré : une bonne réponse vaut un
// point quand un Ta7addi en vaut quinze. Un quiz se devine, se cherche à deux,
// se lit sur un autre écran. On ne prétend pas l'empêcher — on fait en sorte
// que ça ne rapporte presque rien.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.imtihan = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var QUOTA_JOUR = 5;     // ce que la base applique ; ici, pour le dire à l'écran
  var PAR_BONNE = 1;      // le coefficient faible, écrit noir sur blanc

  // Le temps qui reste, d'après l'heure où la question a été servie.
  // Rendu borné à [0, secondes] : une horloge de navigateur en avance ne doit
  // pas afficher un temps négatif ni un compte à rebours qui remonte.
  function restant(servieLe, secondes, maintenant) {
    var total = Number(secondes) || 20;
    var d = new Date(servieLe).getTime();
    if (isNaN(d)) return { secondes: total, part: 1, ecoule: 0, fini: false };
    var m = (maintenant ? new Date(maintenant) : new Date()).getTime();
    var ecoule = Math.max(0, (m - d) / 1000);
    var reste = Math.max(0, total - ecoule);
    return {
      secondes: Math.ceil(reste),
      part: Math.max(0, Math.min(1, reste / total)),
      ecoule: ecoule,
      fini: reste <= 0
    };
  }

  // La couleur du compte à rebours : vert, puis or, puis rouge. Un seul
  // endroit pour en décider, sinon la barre et le chiffre se contredisent.
  function urgence(part) {
    if (part > 0.5) return "calme";
    if (part > 0.2) return "presse";
    return "urgent";
  }

  // Ce que l'écran doit montrer, d'après la réponse du serveur.
  function verdict(r) {
    if (!r || !r.ok) return { etat: "erreur", texte: (r && r.erreur) || "Ça n'a pas marché." };
    if (r.abandon) return { etat: "abandon", texte: "Tu as quitté la fenêtre : la question est perdue." };
    if (r.trop_tard) return { etat: "tard", texte: "Trop tard. La question est passée." };
    if (r.juste) return { etat: "juste", texte: "Juste. +" + (r.points || PAR_BONNE) + " Sna3a." };
    return { etat: "faux", texte: "Ce n'était pas ça." };
  }

  // Ce qu'on dit quand il n'y a plus rien à tirer aujourd'hui.
  function pourquoiRien(r) {
    if (!r) return "Le rihal ne répond pas.";
    if (r.quota) return "Cinq questions par jour, c'est la règle. Reviens demain — le rihal ne se vide pas d'un coup.";
    if (r.epuise) return "Tu as vu toutes les questions du rihal. D'autres viendront.";
    return r.erreur || "Le rihal ne répond pas.";
  }

  return {
    QUOTA_JOUR: QUOTA_JOUR, PAR_BONNE: PAR_BONNE,
    restant: restant, urgence: urgence, verdict: verdict, pourquoiRien: pourquoiRien
  };
});
