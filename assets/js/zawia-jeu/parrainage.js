// ZAW'IA — le jeu · LE PARRAINAGE : pas de parrainage, pas de jeu (v4.1, pur).
//
// On n'entre plus dans la cour par une inscription libre. Trois voies, toutes
// prouvées par le serveur, et toutes par un LIEN REÇU DANS LA BOÎTE (règle de
// Youssef, précisée le 17/09/2026) :
//   1. les gens de la maison — la plateforme d'apprentissage de la maison
//      connaît l'adresse (inscription active) : invitation « communaute » ;
//   2. les autres — dossier déposé sur zawia.tech, accepté : invitation
//      « dossier » (le fondateur répond de la personne) ;
//   3. le parrainage — par un membre de la maison seulement, et il SCELLE la
//      relation entre le parrain et le parrainé.
// La liste de promo ne crée plus de compte : elle donne la LIGNÉE.
// Seuls les gens de la maison parrainent. Explorateur (parrainé) et builder
// (dossier) partagent l'étage des Tolba libres ; la porte du Souk est le
// dossier, comme depuis la v3.7.
//
// ⚠️ CE MODULE NE DÉCIDE RIEN. Le hook Auth refuse le compte, le déclencheur
//    refuse le personnage, la reconnaissance dit `admis`. Ici on lit un lien,
//    on valide une saisie avant de l'envoyer, et on DIT les choses.
// ⚠️ Les chiffres (trois invitations en attente, trente jours) vivent aussi
//    dans le SQL et la fonction Netlify — un test compare les trois fichiers.
// ⚠️ Le voile : « un membre de la maison », jamais un nom d'organisme ni de
//    promo. Le pseudo du parrain vient de la base.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.parrainage = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var MAX_EN_ATTENTE = 3;
  var JOURS = 30;
  var RE_CODE = /^[0-9a-f]{32}$/;
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---- Le lien ------------------------------------------------------------------
  // `?invitation=<32 hex>` — rien d'autre n'est accepté.
  function codeDepuis(recherche) {
    var m = /[?&]invitation=([^&#]*)/.exec(String(recherche || ""));
    if (!m) return null;
    var c;
    try { c = decodeURIComponent(m[1]); } catch (e) { return null; }
    c = c.trim().toLowerCase();
    return RE_CODE.test(c) ? c : null;
  }
  function estCode(c) { return RE_CODE.test(String(c || "")); }
  // L'adresse sans le code : il sort de la barre d'adresse avant toute mesure.
  function sansCode(recherche) {
    var q = String(recherche || "").replace(/^\?/, "").split("&").filter(function (p) {
      return p && p.split("=")[0] !== "invitation";
    });
    return q.length ? "?" + q.join("&") : "";
  }

  function validerEmail(email) {
    var e = String(email == null ? "" : email).trim().toLowerCase();
    if (!RE_EMAIL.test(e) || e.length > 200) return { ok: false, texte: "Cette adresse ne ressemble pas à un e-mail." };
    return { ok: true, email: e };
  }

  // ---- Ce que la base rend, remis d'aplomb ---------------------------------------
  // zawia_reclamer_chajara() rend { admis, voie, parrain }. Un serveur qui ne
  // dit rien (panne, réseau) n'est PAS un refus : la base tient la porte de
  // toute façon, on ne jette pas un joueur dehors pour une coupure.
  function admission(r) {
    var voies = ["chajara", "communaute", "parrainage", "dossier", "historique", "bureau"];
    return {
      admis: !(r && r.admis === false),
      voie: r && voies.indexOf(r.voie) !== -1 ? r.voie : null,
      parrain: r && typeof r.parrain === "string" && r.parrain.trim() ? r.parrain.trim().slice(0, 40) : null
    };
  }

  // Ce que la Porte dit d'un lien d'invitation (zawia_invitation, anon).
  var RAISONS_LIEN = {
    acceptee: "Cette invitation a déjà servi. Si c'est la tienne, entre avec ton e-mail et ton mot de passe.",
    retiree: "Cette invitation a été retirée par celui qui l'avait envoyée. Demande-lui un nouveau lien.",
    expiree: "Cette invitation a passé ses trente jours. Demande un nouveau lien à celui qui t'avait invité.",
    inconnue: "Ce lien d'invitation n'est pas reconnu. Vérifie qu'il est complet.",
    atelier: "Mode atelier : on entre sans invitation, tout vit dans ce navigateur."
  };
  function lienTexte(r) {
    if (r && r.valide) {
      if (r.voie === "communaute") return { ok: true, texte: "Tu es de la maison : la cour t'est ouverte. Crée ton compte avec l'adresse où l'invitation est arrivée." };
      return r.voie === "dossier"
        ? { ok: true, texte: "Ton dossier a été accepté : la cour t'est ouverte. Crée ton compte avec l'adresse où l'invitation est arrivée." }
        : { ok: true, texte: (r.parrain ? r.parrain + ", membre de la maison, t'invite." : "Un membre de la maison t'invite.") + " Crée ton compte avec l'adresse où l'invitation est arrivée." };
    }
    var raison = r && RAISONS_LIEN[r.raison] ? r.raison : "inconnue";
    return { ok: false, texte: RAISONS_LIEN[raison] };
  }

  // ---- La Porte -------------------------------------------------------------------
  var REGLE = "On entre ici par un lien reçu dans sa boîte : tu es de la maison, ton dossier est accepté sur zawia.tech, ou un membre de la maison te parraine.";
  var FERMEE = {
    titre: "Pas de parrainage, pas de jeu",
    texte: "Ce compte n'a pas encore d'admission. Tu es de la maison, ou ton dossier est accepté sur zawia.tech ? Donne ton adresse ci-dessous : elle sera reconnue — sors, puis entre à nouveau. Sinon, un membre de la maison peut te parrainer.",
    // ⚠️ v7.3 — UNE RÈGLE SANS SORTIE EST UN MUR. Jusqu'ici, cet écran disait
    // la règle et s'arrêtait là : l'inconnu repartait. Depuis qu'il existe une
    // porte d'invité, il n'y a plus aucune raison de renvoyer quelqu'un —
    // la coutume dit même le contraire.
    invite: "Et en attendant, entre quand même : on reçoit un invité trois jours sans rien lui demander.",
    inviteBouton: "Entrer en invité"
  };
  var DOSSIER = {
    ouvrir: "Je suis de la maison, ou mon dossier est accepté",
    lead: "Donne ton adresse : celle de ton inscription à la plateforme de formation de la maison, ou celle de ton dossier accepté sur zawia.tech. Ton lien d'entrée part dans ta boîte.",
    bouton: "Recevoir mon lien d'entrée"
  };
  // Le refus du hook Auth, reconnu à son texte (compte.js le laisse passer tel quel).
  function estRefusDePorte(message) { return /parrainage/i.test(String(message || "")); }


  // ---- v4.5 — Le retour : le mot de passe oublié -------------------------------------
  // On entre ici par un lien reçu dans sa boîte ; on REVIENT par la même porte.
  // Sans ce parcours, un compte dont le mot de passe s'oublie était perdu : la
  // Porte n'offrait qu'Entrer et S'inscrire, et « Recevoir mon lien d'entrée »
  // ne rend qu'une ADMISSION, jamais un accès. C'est ce qui a fermé la cour à
  // la première personne à qui c'est arrivé (17/09/2026).
  //
  // Supabase renvoie le lien sur la maison en flot IMPLICITE : les jetons
  // arrivent dans le fragment (`#access_token=…&type=recovery`), jamais dans
  // la requête. ⚠️ Ce fragment porte un jeton de session : il sort de la barre
  // d'adresse dans le script de tête, AVANT la mesure d'audience — GTM lit
  // `page_location`, fragment compris. Le parseur vit ici pour être testé.
  var PASSE = {
    ouvrir: "Mot de passe oublié",
    lead: "Donne ton adresse : un lien de retour part dans ta boîte. Il ne sert qu'une fois.",
    bouton: "Recevoir mon lien de retour",
    // Anti-énumération : la même phrase, que l'adresse ait un compte ou non.
    envoye: "Si un compte porte cette adresse, le lien de retour est parti. Regarde ta boîte — et les indésirables.",
    titre: "Choisis ton nouveau mot de passe",
    lead2: "Ton lien de retour est reconnu. Pose un mot de passe, et la cour se rouvre.",
    poser: "Poser ce mot de passe",
    faite: "C'est posé. La cour se rouvre.",
    // Le lien a passé son heure, ou a déjà servi.
    expire: "Ce lien de retour a expiré, ou il a déjà servi. Demande-en un autre.",
    atelier: "Mode atelier : aucun e-mail ne part. Le mot de passe se change ici même."
  };

  // Ce que le fragment d'un lien de retour contient, remis d'aplomb. Rien
  // d'autre n'est accepté : ni un autre `type`, ni un jeton seul.
  function recuperationDepuis(fragment) {
    var f = String(fragment || "").replace(/^#/, "");
    if (!f) return null;
    var champs = {};
    f.split("&").forEach(function (p) {
      if (!p) return;
      var i = p.indexOf("="), c = i === -1 ? p : p.slice(0, i), v = i === -1 ? "" : p.slice(i + 1);
      try { champs[decodeURIComponent(c)] = decodeURIComponent(v.replace(/\+/g, " ")); } catch (e) { /* champ illisible : ignoré */ }
    });
    // Un lien mort revient en erreur, pas en jetons : on le dit, on ne se tait pas.
    if (champs.error || champs.error_code) return { ok: false, raison: "expire" };
    if (champs.type !== "recovery") return null;
    if (!champs.access_token || !champs.refresh_token) return { ok: false, raison: "expire" };
    return { ok: true, acces: champs.access_token, rafraichi: champs.refresh_token };
  }

  // ---- Le parrain ------------------------------------------------------------------
  var ETATS = {
    attente: "en attente",
    acceptee: "entré",
    expiree: "expirée",
    retiree: "retirée"
  };
  function normaliserFilleuls(d) {
    var liste = d && Array.isArray(d.invitations) ? d.invitations : [];
    var max = d && typeof d.max === "number" ? d.max : MAX_EN_ATTENTE;
    var attente = d && typeof d.en_attente === "number" ? d.en_attente
      : liste.filter(function (i) { return i && i.etat === "attente"; }).length;
    return {
      ok: !!(d && d.ok),
      max: max,
      enAttente: attente,
      restant: Math.max(0, max - attente),
      invitations: liste.filter(function (i) { return i && typeof i.email === "string" && ETATS[i.etat]; }).map(function (i) {
        return {
          code: estCode(i.code) ? i.code : null,
          email: i.email.slice(0, 200),
          etat: i.etat,
          libelle: ETATS[i.etat],
          filleul: typeof i.filleul === "string" && i.filleul ? i.filleul.slice(0, 40) : null,
          cree_le: i.cree_le || null,
          expire_le: i.expire_le || null
        };
      })
    };
  }
  function placesTexte(f) {
    if (f.restant === 0) return "Tes trois invitations attendent leur réponse. Une place se libère quand l'une est acceptée, retirée ou expire.";
    return f.restant === 1 ? "Il te reste une invitation." : "Il te reste " + f.restant + " invitations.";
  }
  var PANNEAU = {
    lead: "Ici, on n'entre que parrainé. Inviter quelqu'un, c'est répondre de lui : ce que ton filleul fait dans la cour, la maison le lira à côté de ton nom.",
    regles: "L'invitation est à son nom : il crée son compte avec cette adresse-là, et le lien ne sert à personne d'autre. Elle vaut trente jours. Trois au plus attendent en même temps.",
    externe: "Seuls les gens de la maison parrainent. Toi, tu as été invité : tiens ta place, et la maison saura qui t'a ouvert la porte."
  };
  function envoiTexte(r) {
    if (!r || !r.ok) return (r && r.erreur) || "Ça n'a pas marché.";
    if (r.deja) return r.envoye ? "Cette adresse était déjà invitée : le lien vient de repartir." : "Cette adresse était déjà invitée. Le lien est ci-dessous, à copier.";
    return r.envoye ? "L'invitation est partie. Le lien est aussi ci-dessous, si tu préfères l'envoyer toi-même." : "L'invitation est prête, mais l'e-mail n'est pas parti. Copie le lien et envoie-le toi-même.";
  }

  // ---- Le carnet d'un externe ----------------------------------------------------------
  function voieTexte(a) {
    if (!a) return null;
    if (a.voie === "parrainage") return a.parrain ? "Tu es entré parrainé par " + a.parrain + "." : "Tu es entré parrainé par un membre de la maison.";
    if (a.voie === "dossier") return "Tu es entré sur dossier accepté : un fondateur a répondu de toi.";
    return null;
  }

  return {
    MAX_EN_ATTENTE: MAX_EN_ATTENTE, JOURS: JOURS, REGLE: REGLE, FERMEE: FERMEE, DOSSIER: DOSSIER, PANNEAU: PANNEAU, PASSE: PASSE,
    ETATS: ETATS, RAISONS_LIEN: RAISONS_LIEN,
    codeDepuis: codeDepuis, estCode: estCode, sansCode: sansCode, validerEmail: validerEmail,
    admission: admission, lienTexte: lienTexte, estRefusDePorte: estRefusDePorte, recuperationDepuis: recuperationDepuis,
    normaliserFilleuls: normaliserFilleuls, placesTexte: placesTexte, envoiTexte: envoiTexte, voieTexte: voieTexte
  };
});
