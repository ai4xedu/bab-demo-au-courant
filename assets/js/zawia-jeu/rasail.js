// ZAW'IA — le jeu · LES RASA'IL (الرسائل) : écrire à un membre, en privé.
//
// v8.5 — 24/09/2026, Youssef : « je ne parviens pas à avoir une conversation fluide
// avec les membres… j'adorerais favoriser le networking et l'apprentissage ». Le
// Kalam de la pièce (sahn.js) parle à ceux qui sont là, et s'efface. Les Rasa'il,
// elles, restent : un fil par paire de membres, gardé en base, qu'on retrouve au
// retour — c'est là qu'une conversation de la cour devient une relation.
//
// CE MODULE EST PUR. Il dit ce qu'est un message, ce qu'une boîte contient, ce qu'on
// peut écrire et pourquoi pas, et comment on le dit. La BASE tient le registre
// (scripts/sql/zawia-rasail.sql) : elle seule écrit, et elle rejoue les mêmes
// règles — un test compare les chiffres des deux fichiers.
//
// ⚠️⚠️ CONTRE LA RELANCE — la ligne rouge des prospects (la charte). Une messagerie
// ouverte à tous les membres est d'abord un canal de prospection. Trois freins, tenus
// PAR LA BASE, que l'écran ne fait qu'expliquer :
//   · DEUX messages au plus tant que l'autre n'a pas répondu — on se présente, on
//     relance une fois, et on attend ;
//   · DIX nouvelles conversations par jour ;
//   · « Bloquer », d'un geste, sans avoir à se justifier.
// « Signaler » envoie le fil au bureau, qui ne lit QUE les fils signalés — et
// l'écran le dit avant qu'on signale.
//
// ⚠️ Rendu sûr : le texte d'un membre passe par `kalam.js` (Kl.rendre) — tout
// échappé d'abord, liens https seuls. Et il porte `translate="no"` dans la page :
// la version arabe traduit le DOM, jamais les mots d'un membre.
// ⚠️ La charte vaut : écrire ne donne JAMAIS un point. Aucun compteur ici.
// Pur : aucun accès au DOM, au réseau, à l'horloge ni au hasard — testable sous Node.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.rasail = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ⚠️ Les MÊMES chiffres que zawia-rasail.sql (un test compare).
  var TEXTE_MAX = 600;          // un message (le même que le fil d'une affaire)
  var SANS_REPONSE_MAX = 2;     // messages envoyés tant que l'autre n'a pas répondu
  var NOUVEAUX_PAR_JOUR = 10;   // conversations neuves ouvertes par 24 h
  var PAR_JOUR_MAX = 200;       // messages par 24 h, toutes conversations confondues
  var FIL_MAX = 100;            // les derniers messages d'un fil que la base rend
  var MOT_MIN = 3;              // le mot d'un signalement : dire de quoi il s'agit
  var MOT_MAX = 140;
  var RELECTURE_MS = 60000;     // la boîte se relit toutes les minutes (et au retour sur l'onglet)
  var APERCU_MAX = 80;
  var PSEUDO_MAX = 40;

  function nettoyer(t, max) {
    return String(t == null ? "" : t)
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")   // les commandes, sauf \n et \t
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, max || TEXTE_MAX);
  }
  function id(v) { return String(v == null ? "" : v).replace(/[^0-9a-zA-Z_-]/g, "").slice(0, 64); }
  function nombre(v) { var n = Number(v); return isFinite(n) && n > 0 ? Math.floor(n) : 0; }

  // ---- Ce qu'on écrit avant d'envoyer ------------------------------------------------------
  function valider(brut) {
    var t = nettoyer(brut);
    if (!t) return { ok: false, erreur: "Écris quelque chose." };
    return { ok: true, texte: t };
  }
  function validerMot(brut) {
    var t = nettoyer(brut, MOT_MAX).replace(/\n+/g, " ");
    if (t.length < MOT_MIN) return { ok: false, erreur: "Dis en quelques mots ce qui ne va pas — le bureau lira le fil avec." };
    return { ok: true, mot: t };
  }

  // ---- Un fil -------------------------------------------------------------------------------
  // La base rend { ok, autre: {id, pseudo, avatar}, messages: [{id, moi, texte, le}],
  // bloque, signale, plus }. `moi` est posé par la base : c'est elle qui sait qui écrit.
  function normaliserMessage(m) {
    m = m && typeof m === "object" ? m : {};
    return { id: m.id == null ? null : String(m.id), moi: !!m.moi, texte: nettoyer(m.texte), le: m.le || null };
  }
  function normaliserAutre(a) {
    a = a && typeof a === "object" ? a : {};
    return { id: id(a.id), pseudo: nettoyer(a.pseudo, PSEUDO_MAX).replace(/\n+/g, " ") || "Un Talib", avatar: a.avatar && typeof a.avatar === "object" ? a.avatar : null };
  }
  function normaliserFil(r) {
    r = r && typeof r === "object" ? r : {};
    var messages = (Array.isArray(r.messages) ? r.messages : []).map(normaliserMessage).filter(function (m) { return !!m.texte; });
    return { autre: normaliserAutre(r.autre), messages: messages, bloque: !!r.bloque, signale: !!r.signale, plus: !!r.plus };
  }
  // Mes messages depuis la dernière réponse de l'autre (ou depuis le début).
  function sansReponse(messages) {
    var n = 0, l = Array.isArray(messages) ? messages : [];
    for (var i = l.length - 1; i >= 0; i--) { if (!l[i] || !l[i].moi) break; n++; }
    return n;
  }
  // Peut-on écrire dans ce fil ? { ok } ou { ok: false, raison } — la raison DIT
  // pourquoi (la règle de la maison : on explique la porte).
  function peutEcrire(fil) {
    if (!fil) return { ok: false, raison: "Choisis à qui écrire." };
    if (fil.bloque) return { ok: false, raison: "Tu as bloqué cette personne. Débloque-la pour lui écrire." };
    if (sansReponse(fil.messages) >= SANS_REPONSE_MAX) {
      return { ok: false, raison: "Deux messages sans réponse : attends que l'autre te réponde." };
    }
    return { ok: true };
  }
  // Ouvrir une conversation neuve : la base compte les miennes du jour.
  function peutOuvrir(nouveaux) {
    if (nombre(nouveaux) >= NOUVEAUX_PAR_JOUR) {
      return { ok: false, raison: "Dix nouvelles conversations aujourd'hui : c'est la limite. Reprends demain." };
    }
    return { ok: true, reste: NOUVEAUX_PAR_JOUR - nombre(nouveaux) };
  }

  // ---- La boîte : mes fils -------------------------------------------------------------------
  function apercu(texte) {
    var t = nettoyer(texte).replace(/\s*\n+\s*/g, " ");
    return t.length > APERCU_MAX ? t.slice(0, APERCU_MAX - 1) + "…" : t;
  }
  function normaliserFils(r) {
    r = r && typeof r === "object" ? r : {};
    var fils = (Array.isArray(r.fils) ? r.fils : []).map(function (f) {
      f = f && typeof f === "object" ? f : {};
      var a = normaliserAutre({ id: f.autre, pseudo: f.pseudo, avatar: f.avatar });
      return { autre: a.id, pseudo: a.pseudo, avatar: a.avatar, apercu: apercu(f.dernier), dernierLe: f.dernierLe || null,
        dernierMoi: !!f.dernierMoi, nonLus: f.bloque ? 0 : nombre(f.nonLus), bloque: !!f.bloque, signale: !!f.signale };
    }).filter(function (f) { return !!f.autre; });
    return { fils: fils, nouveaux: nombre(r.nouveaux) };
  }
  function nonLus(fils) {
    return (Array.isArray(fils) ? fils : []).reduce(function (n, f) { return n + (f && !f.bloque ? nombre(f.nonLus) : 0); }, 0);
  }

  // ---- Quand -----------------------------------------------------------------------------------
  // Relatif, jamais une heure du Maroc : la tzdata des navigateurs n'est pas à jour (le
  // Maroc est à UTC+0 depuis le 20/09/2026), une heure affichée serait fausse d'une heure.
  function quand(iso, maintenant) {
    var t = Date.parse(iso || ""), n = maintenant instanceof Date ? maintenant.getTime() : Number(maintenant);
    if (!isFinite(t) || !isFinite(n)) return "";
    var s = Math.max(0, Math.floor((n - t) / 1000));
    if (s < 60) return "à l'instant";
    if (s < 3600) return "il y a " + Math.floor(s / 60) + " min";
    if (s < 86400) return "il y a " + Math.floor(s / 3600) + " h";
    if (s < 172800) return "hier";
    return "il y a " + Math.floor(s / 86400) + " j";
  }

  // ---- Ce que la base a répondu, dit ---------------------------------------------------------
  function texteErreur(r) {
    if (r && r.erreur) return String(r.erreur);
    return "Le message n'est pas parti. Réessaie.";
  }

  return {
    TEXTE_MAX: TEXTE_MAX, SANS_REPONSE_MAX: SANS_REPONSE_MAX, NOUVEAUX_PAR_JOUR: NOUVEAUX_PAR_JOUR,
    PAR_JOUR_MAX: PAR_JOUR_MAX, FIL_MAX: FIL_MAX, MOT_MIN: MOT_MIN, MOT_MAX: MOT_MAX,
    RELECTURE_MS: RELECTURE_MS, APERCU_MAX: APERCU_MAX,
    nettoyer: nettoyer, valider: valider, validerMot: validerMot,
    normaliserMessage: normaliserMessage, normaliserFil: normaliserFil, sansReponse: sansReponse,
    peutEcrire: peutEcrire, peutOuvrir: peutOuvrir,
    apercu: apercu, normaliserFils: normaliserFils, nonLus: nonLus, quand: quand, texteErreur: texteErreur
  };
});
