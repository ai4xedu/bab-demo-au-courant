// ZAW'IA — le jeu · LE MASQUE DU MORCHID (v3.2, 14/09/2026) — pur, testé sous Node.
//
// Un seul personnage de la cour peut changer de visage : le Morchid, celui qui
// a construit le jeu. Il porte un MASQUE — un rang, une lignée, un moment de
// l'Arb3ine — qu'il change d'une touche, pour traverser tous les mondes du
// jeu sans créer dix comptes : le Talib 7orr devant l'établi fermé, le
// Mt3ellem après son Arb3ine, le Fqih au tableau. Plusieurs personnages en un.
//
// ⚠️ CE MODULE NE DÉCIDE RIEN — comme chajara.js. Qui est le Morchid vit EN
//    BASE (une liste d'e-mails aveugle au navigateur, zawia-chajara.sql) et le
//    masque se pose par zawia_incarner() (zawia-morchid.sql), qui refuse tout
//    autre compte. Ici : la grammaire des raccourcis, la forme d'un masque et
//    ce qu'il change à l'affichage. Le rang réel de la ligne, lui, est écrit
//    par la fonction — la garde de zawia_joueurs le tient pour tout le monde.
//
// ⚠️ v8.2 (23/09/2026) — LE MASQUE EST AU COMPTE D'ESSAI SEUL. Le Morchid a
//    deux comptes dans la liste : le PRINCIPAL, qui joue, siège et ne se
//    réinitialise jamais (le 23/09/2026 « Rejouer le début » lui a effacé sa
//    Dhakira et ses pages), et le compte d'ESSAI (`zawia_morchid.essai`), le
//    personnage-caméléon. La reconnaissance rend `essai` ; `depuis()` le porte ;
//    jeu.js n'ouvre le masque, les raccourcis et la remise à zéro qu'à lui. Et
//    la base refuse de toute façon (zawia_incarner, la garde de zawia_joueurs).
//
// ⚠️ AUCUN NOM, AUCUN E-MAIL ICI — ni dans aucun fichier servi (le voile, et
//    la règle des listes du bureau : elles se posent en base, jamais dans un
//    fichier que `publish = "."` sert en HTTP).
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.morchid = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Les cinq rangs de la charte, dans l'ordre de regles.js (un test le vérifie).
  var RANGS_CLES = ["talib", "mt3ellem", "m3ellem", "fqih", "morchid"];
  var LIGNEES = ["maison", "libre"];
  // Les trois moments de l'Arb3ine qu'on veut pouvoir regarder : le premier
  // jour, la veille de la fin, et après — dans cet ordre, puis on la rend.
  var ARB3INES = ["debut", "fin", "ecoulee"];
  var JOUR_MS = 24 * 60 * 60 * 1000;

  // ---- Les raccourcis ------------------------------------------------------------------
  // Des touches que la cour n'utilise pas : ZQSD/WASD et les flèches marchent,
  // E/Espace/Entrée agissent, T dit un mot, Échap ferme. Les chiffres, L et J
  // sont libres.
  var RACCOURCIS = {
    "1": { rang: "talib" }, "2": { rang: "mt3ellem" }, "3": { rang: "m3ellem" },
    "4": { rang: "fqih" }, "5": { rang: "morchid" },
    "l": { lignee: true }, "L": { lignee: true },
    "j": { arb3ine: true }, "J": { arb3ine: true },
    "0": { retirer: true }
  };
  // v3.6 : R rejoue le début (intro, prologue, tutoriel, Wird du jour 1) — jeu.js le porte,
  // ce n'est pas un masque : rien à retenir, tout repart.
  // ⚠️ « R » tout seul a été retiré le 23/09/2026 : la lettre se frappe en
  // marchant, et ce geste efface les pages retrouvées et la Dhakira sans qu'on
  // puisse les rendre. Il faut Maj+Alt+R — une combinaison qu'on ne tape pas par
  // accident. L'entrée du menu reste, elle, à portée de clic.
  var AIDE = "Raccourcis du Morchid : 1 à 5 pour le rang · L pour la lignée · J pour l'Arb3ine · 0 pour retirer le masque · Maj+Alt+R pour rejouer le début";

  function estRaccourci(touche) { return Object.prototype.hasOwnProperty.call(RACCOURCIS, String(touche)); }

  // ---- La forme d'un masque -------------------------------------------------------------
  // { rang, lignee, arb3ine } — chaque champ vaut null quand le masque ne le
  // touche pas. Un masque sans aucun champ est « pas de masque » : null.
  function normaliser(m) {
    if (!m || typeof m !== "object") return null;
    var rang = RANGS_CLES.indexOf(m.rang) >= 0 ? m.rang : null;
    var lignee = LIGNEES.indexOf(m.lignee) >= 0 ? m.lignee : null;
    var arb3ine = ARB3INES.indexOf(m.arb3ine) >= 0 ? m.arb3ine : null;
    if (!rang && !lignee && !arb3ine) return null;
    return { rang: rang, lignee: lignee, arb3ine: arb3ine };
  }

  // Ce que le serveur (ou l'atelier) répond à la reconnaissance : { morchid, masque, essai }.
  // v8.2 — `essai` : le compte d'ESSAI du Morchid, le seul qui porte le masque et
  // rejoue le début. Le compte principal reçoit morchid: true et essai: false ;
  // un `essai` sans `morchid` n'est rien — la base a dit non.
  function depuis(r) {
    var actif = !!(r && r.morchid);
    return { actif: actif, masque: actif ? normaliser(r.masque) : null, essai: !!(actif && r.essai) };
  }

  // ---- Le masque suivant, d'une touche -------------------------------------------------
  // `contexte.maison` : la lignée EFFECTIVE en ce moment (masque compris) — L
  // la retourne. Rend undefined si la touche n'est pas un raccourci, null pour
  // « retirer », un masque sinon.
  function suivant(masque, touche, contexte) {
    if (!estRaccourci(touche)) return undefined;
    var r = RACCOURCIS[String(touche)];
    var m = normaliser(masque) || { rang: null, lignee: null, arb3ine: null };
    if (r.retirer) return null;
    if (r.rang) m.rang = r.rang;
    if (r.lignee) {
      var maison = contexte && typeof contexte.maison === "boolean" ? contexte.maison : (m.lignee === "maison");
      m.lignee = maison ? "libre" : "maison";
    }
    if (r.arb3ine) {
      var i = ARB3INES.indexOf(m.arb3ine);
      m.arb3ine = i < 0 ? ARB3INES[0] : (i + 1 < ARB3INES.length ? ARB3INES[i + 1] : null);
    }
    return normaliser(m);
  }

  // ---- Ce que le masque change à l'écran ----------------------------------------------
  // Le premier jour de l'Arb3ine tel qu'on veut le voir — la ligne du joueur
  // n'est jamais réécrite : on regarde à travers le masque, on n'efface rien.
  function arb3ineDebut(masque, reel, maintenant) {
    var m = normaliser(masque);
    if (!m || !m.arb3ine) return reel;
    var now = maintenant ? new Date(maintenant).getTime() : Date.now();
    var recul = m.arb3ine === "debut" ? 0 : m.arb3ine === "fin" ? 39 : 41;
    return new Date(now - recul * JOUR_MS).toISOString();
  }

  // La lignée effective : le masque prime sur ce que le serveur a reconnu.
  function maison(masque, reconnue) {
    var m = normaliser(masque);
    if (m && m.lignee) return m.lignee === "maison";
    return !!reconnue;
  }

  // L'étiquette du HUD. `R` est ZWJ.regles (les noms des rangs y vivent).
  function libelle(masque, R) {
    var m = normaliser(masque);
    if (!m) return "";
    var parts = ["Masque"];
    if (m.rang) parts.push(R && R.rang ? R.rang(m.rang).nom : m.rang);
    if (m.lignee) parts.push(m.lignee === "maison" ? "gens de la maison" : "Talib 7orr");
    if (m.arb3ine) parts.push(m.arb3ine === "debut" ? "Arb3ine jour 1" : m.arb3ine === "fin" ? "Arb3ine J-1" : "Arb3ine écoulée");
    return parts.join(" · ");
  }

  return {
    RANGS_CLES: RANGS_CLES, LIGNEES: LIGNEES, ARB3INES: ARB3INES, RACCOURCIS: RACCOURCIS, AIDE: AIDE,
    estRaccourci: estRaccourci, normaliser: normaliser, depuis: depuis, suivant: suivant,
    arb3ineDebut: arb3ineDebut, maison: maison, libelle: libelle
  };
});
