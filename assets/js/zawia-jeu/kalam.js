// ZAW'IA — le jeu · LE KALAM (الكلام) : ce qui se dit sur une affaire.
//
// v7.1 — « avançons sur le fil de la discussion sur l'affaire » (Youssef,
// 20/09/2026). La v5.7 a posé la Safqa : un prix, un mot, accepter, régler,
// livrer. Entre les deux, RIEN — et c'est là que la conversation sortait de la
// zawia : « envoie-moi ton numéro », et l'affaire finissait sur WhatsApp, où
// la maison ne tient plus la parole de personne. Le fil la ramène dedans.
//
// CE MODULE EST PUR. Il dit ce qu'est un message, qui peut parler, jusqu'à
// quand, et comment un texte d'auteur se rend sans danger. La BASE tient le
// registre (scripts/sql/zawia-safqa-kalam.sql) : elle seule écrit, et elle
// rejoue les mêmes règles — un test compare les constantes des deux fichiers.
//
// QUI PARLE. Les DEUX parties, personne d'autre. Le bureau LIT (l'amin
// tranche les litiges, décision D3 du 19/09) et n'écrit jamais : un fil où
// l'arbitre peut écrire n'est plus une preuve.
//
// JUSQU'À QUAND. Tant que l'affaire vit, et SEPT JOURS après sa conclusion —
// l'après-vente, c'est là qu'elle se joue. Une affaire refusée ou annulée
// ferme le fil tout de suite : le refus porte déjà son mot, et un fil qui
// resterait ouvert ferait du Souk une messagerie vers n'importe qui.
//
// LES LIENS. Le https seul, et rendu cliquable — c'est par là que se livre un
// bien numérique, et le refuser renverrait la livraison dehors. Tout le reste
// est ÉCHAPPÉ D'ABORD : aucune balise de l'auteur ne traverse (la règle de
// kounnach.js).
//
// ⚠️ La charte vaut : parler ne donne JAMAIS un point. Aucun compteur ici.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.kalam = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ⚠️ Les MÊMES chiffres que zawia-safqa-kalam.sql (un test compare).
  var TEXTE_MAX = 600;        // un message
  var PAR_AFFAIRE_MAX = 80;   // messages dans un fil, les deux voix confondues
  var PAR_JOUR_MAX = 200;     // messages par personne et par jour, tous fils confondus
  var APRES_JOURS = 7;        // l'après-vente : on parle encore sept jours après la conclusion

  // ---- Un message ----------------------------------------------------------------------------
  // { id, safqa, auteur, pseudo, texte, quand, moi }
  function nettoyer(t) {
    return String(t == null ? "" : t)
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")   // les commandes, sauf \n et \t
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, TEXTE_MAX);
  }
  function normaliser(m, moi) {
    m = m && typeof m === "object" ? m : {};
    var auteur = String(m.auteur || "");
    return {
      id: m.id == null ? null : String(m.id),
      safqa: m.safqa == null ? null : String(m.safqa),
      auteur: auteur,
      pseudo: nettoyer(m.pseudo).slice(0, 40) || "Un Talib",
      texte: nettoyer(m.texte),
      quand: m.quand || null,
      moi: !!moi && auteur === String(moi)
    };
  }
  function normaliserFil(liste, moi) {
    return (Array.isArray(liste) ? liste : [])
      .map(function (m) { return normaliser(m, moi); })
      .filter(function (m) { return !!m.texte; });
  }

  // ---- Qui peut parler, et jusqu'à quand -------------------------------------------------------
  // `affaire` : la forme de safqa.js. `maintenant` : un Date ou un ISO.
  // Rend { ok: true } ou { ok: false, texte } — le texte DIT pourquoi, il ne
  // se contente pas de refuser (la règle de la maison : on explique la porte).
  function ouvert(affaire, moi, maintenant) {
    if (!affaire || !moi) return { ok: false, texte: "Cette affaire n'est pas la tienne." };
    var mien = affaire.vendeur === moi || affaire.acheteur === moi;
    if (!mien) return { ok: false, texte: "Ce fil est celui de deux autres." };
    if (affaire.etat === "refusee" || affaire.etat === "annulee") {
      return { ok: false, texte: "Cette affaire est close. Le fil s'est refermé avec elle." };
    }
    if (affaire.etat === "conclue") {
      var fin = finApres(affaire, maintenant);
      if (fin && fin.passe) {
        return { ok: false, texte: "L'affaire est conclue depuis plus de " + APRES_JOURS + " jours : le fil s'est refermé." };
      }
    }
    return { ok: true };
  }
  // Combien de jours reste-t-il à l'après-vente ? null si la question ne se pose pas.
  function finApres(affaire, maintenant) {
    if (!affaire || affaire.etat !== "conclue" || !affaire.conclue) return null;
    var t0 = Date.parse(affaire.conclue), t1 = maintenant instanceof Date ? maintenant.getTime() : Date.parse(maintenant || "");
    if (!isFinite(t0) || !isFinite(t1)) return null;
    var ecoules = (t1 - t0) / 86400000;
    return { passe: ecoules > APRES_JOURS, reste: Math.max(0, Math.ceil(APRES_JOURS - ecoules)) };
  }
  // Ce qu'on écrit avant d'envoyer. Rend { ok, texte } ou { ok: false, erreur }.
  function valider(brut) {
    var t = nettoyer(brut);
    if (!t) return { ok: false, erreur: "Écris quelque chose." };
    return { ok: true, texte: t };
  }

  // ---- Ce qui n'a pas été lu ---------------------------------------------------------------------
  // La base pose `nonLus` sur chaque affaire (ce qui a été dit par l'AUTRE
  // depuis mon dernier passage). Ici on ne fait qu'additionner et dire.
  function nonLus(liste) {
    return (Array.isArray(liste) ? liste : []).reduce(function (n, a) {
      var k = Number(a && a.nonLus);
      return n + (isFinite(k) && k > 0 ? k : 0);
    }, 0);
  }
  // ⚠️ `Sf.normaliser` rebâtit l'affaire champ par champ : `messages` et
  //    `nonLus`, que la base ajoute, y seraient PERDUS. On les repose ici —
  //    c'est le fil qui les porte, pas l'affaire.
  function compter(affaire, brut) {
    if (!affaire) return affaire;
    var b = brut && typeof brut === "object" ? brut : {};
    var m = Number(b.messages), n = Number(b.nonLus);
    affaire.messages = isFinite(m) && m > 0 ? m : 0;
    affaire.nonLus = isFinite(n) && n > 0 ? n : 0;
    return affaire;
  }
  function badge(a) {
    var k = Number(a && a.nonLus);
    return isFinite(k) && k > 0 ? k : 0;
  }

  // ---- Le rendu sûr -------------------------------------------------------------------------------
  // ⚠️ Tout est échappé D'ABORD : le texte vient d'un membre, et aucune balise
  //    de sa main ne doit traverser. Ensuite seulement on rend cliquables les
  //    liens https — et EUX SEULS (ni http, ni javascript:, ni data:).
  function echapper(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var LIEN = /https:\/\/[^\s<>"']+/g;
  function rendre(texte) {
    var sur = echapper(nettoyer(texte));
    // Le lien est cherché DANS le texte déjà échappé : une URL n'y contient
    // plus ni « < » ni guillemet, donc l'attribut href ne peut pas s'ouvrir.
    var avecLiens = sur.replace(LIEN, function (u) {
      var fin = "";
      // la ponctuation finale n'appartient pas au lien
      while (/[.,;:!?)\]]$/.test(u)) { fin = u.slice(-1) + fin; u = u.slice(0, -1); }
      if (!u) return fin;
      return '<a href="' + u + '" target="_blank" rel="noopener noreferrer nofollow ugc">' + u + "</a>" + fin;
    });
    return avecLiens.split("\n").map(function (l) { return l || "&nbsp;"; }).join("<br>");
  }

  return {
    TEXTE_MAX: TEXTE_MAX, PAR_AFFAIRE_MAX: PAR_AFFAIRE_MAX, PAR_JOUR_MAX: PAR_JOUR_MAX, APRES_JOURS: APRES_JOURS,
    nettoyer: nettoyer, normaliser: normaliser, normaliserFil: normaliserFil,
    ouvert: ouvert, finApres: finApres, valider: valider,
    nonLus: nonLus, badge: badge, compter: compter, echapper: echapper, rendre: rendre
  };
});
