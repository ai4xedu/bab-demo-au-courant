// ZAW'IA — le jeu · LE NADI (النادي) : les clubs de la zawia (pur).
//
// v5.9 (19/09/2026). Un club, c'est une halqa qui dure : UN PORTEUR (M3ellem
// ou plus — ou membre du Majliss), une CHARTE (la guideline), des MEMBRES
// qu'il accepte ou refuse, des SÉANCES en visio dont le lien ne va qu'aux
// membres. Le premier : Madrassat al mouqawiline, porté par Lmourid.
//
// Ce module DIT et VÉRIFIE ; il ne décide rien : qui peut ouvrir un club, qui
// porte, qui est entré, c'est la base (zawia-nadi.sql) qui le tient. Ici :
// les constantes (⚠️ les mêmes qu'en SQL, un test compare), la règle du rang
// telle que l'écran la montre, le slug (le même algorithme que la base), les
// validations avant envoi, la normalisation de ce que la base rend, l'état
// d'une séance, et TOUS les textes du panneau — pour que la version arabe
// les couvre (un test le dit). Ni DOM, ni réseau, ni horloge cachée.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.nadi = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ⚠️ Les mêmes chiffres que zawia-nadi.sql — un test compare.
  var NOM_MIN = 3, NOM_MAX = 60, ACCROCHE_MAX = 160, CHARTE_MAX = 4000, MOT_MAX = 300;
  var TITRE_MAX = 90, DETAIL_MAX = 220, DUREE_MIN = 15, DUREE_MAX = 300;
  var CLUBS_MAX = 3, MEMBRES_MAX = 200, DEMANDES_MAX = 10, SEANCES_MAX = 30;
  var AVANT = 15 * 60 * 1000;        // « Rejoindre » un quart d'heure avant (comme le Riwaq)
  var APRES = 2 * 60 * 60 * 1000;    // une séance reste visible deux heures après sa fin
  var FUSEAU = "Africa/Casablanca";  // l'heure de la maison, jamais celle du joueur
  // Les rangs qui ouvrent un club — la charte : M3ellem, « la maîtrise oblige ».
  var RANGS_CREATEURS = ["m3ellem", "fqih", "morchid"];

  // Ce qu'on est dans un club, dit au joueur.
  var MOI = {
    porteur: "Tu portes ce club.",
    membre: "Tu en es membre.",
    demande: "Ta demande attend la réponse du porteur.",
    refuse: "Ta demande a été refusée. Tu peux redemander plus tard.",
    retire: "Tu as quitté ce club."
  };

  // Tous les textes du panneau (jeu.js ne porte aucune phrase à lui) — la
  // version arabe couvre chacun. Les {1} sont des gabarits : f(texte, valeur).
  var TEXTES = {
    menu: "Les clubs de la zawia",
    menuDemande1: "Les clubs · 1 demande",
    menuDemandes: "Les clubs · {1} demandes",
    kicker: "Le Nadi",
    titre: "Les clubs de la zawia",
    lead: "Un club, c'est une halqa qui dure : un M3ellem le porte, une charte le tient, des membres le font vivre. Les séances se tiennent en visio ; le porteur accepte qui entre.",
    vide: "Aucun club n'est ouvert pour l'instant. Le premier s'ouvrira ici.",
    chargement: "On regarde les clubs…",
    atelier: "Mode atelier : les clubs restent dans ce navigateur — le club de démonstration accepte tout le monde.",
    ouvrir: "Ouvrir un club",
    regleOuvrir: "Un club s'ouvre au rang de M3ellem — ou depuis le Majliss. Le tien viendra avec ton M39ol.",
    membre1: "1 membre",
    membres: "{1} membres",
    portePar: "Porté par {1}",
    accepte: "Accepte les demandes",
    nAcceptePas: "N'accepte pas de demande pour l'instant",
    prochaine: "Prochaine séance : {1}",
    aucuneSeance: "Aucune séance annoncée pour l'instant.",
    retour: "Tous les clubs",
    charteTitre: "La charte du club",
    sansCharte: "Le porteur n'a pas encore écrit la charte.",
    seancesTitre: "Les séances",
    membresTitre: "Les membres",
    demandesTitre: "Les demandes",
    aucuneDemande: "Aucune demande en attente.",
    lien: "Le lien",
    rejoindre: "Rejoindre",
    lienMembres: "Le lien de visio est réservé aux membres.",
    demander: "Demander à rejoindre",
    motDemande: "Un mot pour le porteur : pourquoi ce club, ce que tu apportes (facultatif)",
    envoyerDemande: "Envoyer la demande",
    demandeEnvoyee: "Ta demande est partie. Le porteur te répondra ici.",
    quitter: "Quitter le club",
    quitterConfirm: "Quitter ce club ? Tu pourras redemander plus tard.",
    quitte: "Tu as quitté le club.",
    gerer: "Gérer le club",
    voirClub: "Voir le club",
    enregistrer: "Enregistrer",
    enregistre: "C'est enregistré.",
    nom: "Le nom du club",
    nomAr: "Le nom en arabe",
    accroche: "En une ligne : ce que fait le club",
    charte: "La charte : ce qu'on y fait, ce qu'on y refuse",
    lienClub: "Le lien de visio habituel (https — vu des membres seulement)",
    ouvertLabel: "Accepter les demandes d'adhésion",
    creerLead: "Tu portes ce club : sa charte, ses séances, ceux qui entrent. Trois au plus par porteur.",
    creer: "Ouvrir ce club",
    cree: "Le club est ouvert. Écris sa charte, pose sa première séance.",
    poserSeance: "Poser une séance",
    titreSeance: "Le titre de la séance",
    detailSeance: "Un mot de plus (facultatif)",
    debutSeance: "Le début (heure de Casablanca)",
    dureeSeance: "La durée, en minutes",
    lienSeance: "Le lien de visio (https, facultatif)",
    poser: "Poser",
    seancePosee: "La séance est posée.",
    retirer: "Retirer",
    seanceRetiree: "La séance est retirée.",
    accepter: "Accepter",
    refuser: "Refuser",
    accepteFait: "Il fait maintenant partie du club.",
    refuseFait: "La demande est refusée.",
    retirerMembre: "Retirer du club",
    retirerConfirm: "Retirer ce membre du club ?",
    membreRetire: "Le membre est retiré.",
    porteurBadge: "porteur",
    fermer: "Fermer le club",
    fermerConfirm: "Fermer ce club ? Ses membres le perdront ; le bureau peut le rouvrir.",
    ferme: "Le club est fermé.",
    depuisLe: "depuis le {1}",
    demandeLe: "demandé le {1}",
    ratee: "Ça n'a pas marché.",
    reseau: "La maison ne répond pas. Réessaie dans un instant.",
    public: "Ce club se lit aussi sans compte, à l'adresse /clubs du jeu."
  };

  // Un gabarit, rempli : f("{1} membres", 12) → "12 membres".
  function f(gabarit) {
    var out = String(gabarit == null ? "" : gabarit);
    for (var i = 1; i < arguments.length; i++) out = out.split("{" + i + "}").join(String(arguments[i]));
    return out;
  }
  function pluriel(n, un, plusieurs) { return n === 1 ? un : f(plusieurs, n); }

  function nettoyer(t, max) {
    if (typeof t !== "string") return "";
    return t.replace(/\s+/g, " ").trim().slice(0, max || 160);
  }
  function nettoyerBloc(t, max) {   // garde les retours à la ligne (la charte)
    if (typeof t !== "string") return "";
    return t.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim().slice(0, max || 4000);
  }
  function lienSur(url) {
    if (typeof url !== "string") return false;
    var u = url.trim();
    return /^https:\/\/[^\s<>"']+$/i.test(u) && u.length <= 500;
  }
  function entier(v) { var n = typeof v === "number" ? v : parseInt(v, 10); return isNaN(n) || n < 0 ? 0 : Math.floor(n); }

  // ---- Le slug : le même algorithme que zawia_nadi_slug() (un test compare) ----
  var ACCENTS = { "œ": "o", "æ": "a" };
  function slug(nom) {
    var s = String(nom == null ? "" : nom).toLowerCase()
      .replace(/[œæ]/g, function (c) { return ACCENTS[c]; })
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return s.slice(0, NOM_MAX);
  }

  // ---- Qui peut ouvrir un club, tel que l'écran le montre ----
  // R.communaute lit le rang de la ligne, ou le déduit du M39ol ; le Majliss
  // ouvre aussi (Youssef, 19/09/2026). La base a la même règle et tranche.
  function peutCreer(joueur, majliss, R) {
    if (majliss) return { ok: true, raison: "" };
    var rang = R && typeof R.communaute === "function" ? R.communaute(joueur || {}).rang : null;
    if (rang && RANGS_CREATEURS.indexOf(rang.cle) >= 0) return { ok: true, raison: "" };
    return { ok: false, raison: TEXTES.regleOuvrir };
  }

  // ---- Les validations avant envoi (la base revalide tout) ----
  function validerClub(v) {
    v = v || {};
    var nom = nettoyer(v.nom, NOM_MAX + 10);
    if (nom.length < NOM_MIN || nom.length > NOM_MAX) return { ok: false, erreur: "Le nom d'un club fait de 3 à 60 caractères." };
    if (slug(nom).length < NOM_MIN) return { ok: false, erreur: "Le nom du club s'écrit en lettres latines — le nom arabe a sa case." };
    var lien = typeof v.lien === "string" ? v.lien.trim() : "";
    if (lien && !lienSur(lien)) return { ok: false, erreur: "Un lien commence par https:// — ou reste vide." };
    return { ok: true, valeurs: {
      nom: nom, nomAr: nettoyer(v.nomAr, NOM_MAX), accroche: nettoyer(v.accroche, ACCROCHE_MAX),
      charte: nettoyerBloc(v.charte, CHARTE_MAX), lien: lien, ouvert: v.ouvert !== false
    } };
  }
  function validerMot(mot) { return nettoyerBloc(mot, MOT_MAX); }

  // « AAAA-MM-JJTHH:MM » (ce que rend un <input type="datetime-local">), lu
  // comme une heure de CASABLANCA — c'est la base qui convertit. On vérifie
  // seulement la forme, et qu'on ne pose pas une séance pour hier.
  var RE_DEBUT = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;
  function maintenantCasa(maintenant) {
    var d = maintenant ? new Date(maintenant) : new Date();
    try {
      var p = {};
      new Intl.DateTimeFormat("en-GB", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
        .formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return p.year + "-" + p.month + "-" + p.day + "T" + (p.hour === "24" ? "00" : p.hour) + ":" + p.minute;
    } catch (e) { return d.toISOString().slice(0, 16); }
  }
  function validerSeance(v, maintenant) {
    v = v || {};
    var titre = nettoyer(v.titre, TITRE_MAX + 10);
    if (titre.length < 3 || titre.length > TITRE_MAX) return { ok: false, erreur: "Le titre d'une séance fait de 3 à 90 caractères." };
    var debut = String(v.debut == null ? "" : v.debut).trim(), m = RE_DEBUT.exec(debut);
    if (!m) return { ok: false, erreur: "L'heure ne se lit pas (AAAA-MM-JJ HH:MM, heure de Casablanca)." };
    debut = m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5];
    var duree = entier(v.duree);
    if (duree < DUREE_MIN || duree > DUREE_MAX) return { ok: false, erreur: "Une séance dure de 15 minutes à 5 heures." };
    var lien = typeof v.lien === "string" ? v.lien.trim() : "";
    if (lien && !lienSur(lien)) return { ok: false, erreur: "Un lien commence par https:// — ou reste vide." };
    // une séance NEUVE se pose pour plus tard (deux heures de marge, comme la base)
    if (!v.id) {
      var seuil = maintenantCasa(new Date((maintenant ? new Date(maintenant) : new Date()).getTime() - APRES));
      if (debut < seuil) return { ok: false, erreur: "Une séance se pose pour plus tard, pas pour hier." };
    }
    return { ok: true, valeurs: { id: v.id || null, titre: titre, detail: nettoyer(v.detail, DETAIL_MAX), debut: debut, duree: duree, lien: lien } };
  }

  // ---- Ce que la base rend, remis d'équerre ----
  function normaliserSeance(s) {
    if (!s || typeof s !== "object" || !s.debut) return null;
    var d = new Date(s.debut), fn = s.fin ? new Date(s.fin) : null;
    if (isNaN(d.getTime())) return null;
    return {
      id: s.id == null ? "" : String(s.id),
      titre: nettoyer(s.titre, TITRE_MAX) || "Séance",
      detail: nettoyer(s.detail, DETAIL_MAX),
      debut: d.toISOString(),
      fin: fn && !isNaN(fn.getTime()) ? fn.toISOString() : new Date(d.getTime() + 60 * 60 * 1000).toISOString(),
      lien: lienSur(s.lien) ? s.lien.trim() : null
    };
  }
  function normaliserPersonne(p) {
    if (!p || typeof p !== "object" || typeof p.pseudo !== "string") return null;
    return { joueur: p.joueur == null ? "" : String(p.joueur), pseudo: nettoyer(p.pseudo, 40), role: p.role === "porteur" ? "porteur" : "membre",
      mot: nettoyerBloc(p.mot, MOT_MAX), depuis: typeof p.depuis === "string" ? p.depuis : "" };
  }
  var MOIS = ["porteur", "membre", "demande", "refuse", "retire"];
  function normaliserClub(c) {
    if (!c || typeof c !== "object" || typeof c.slug !== "string" || !c.slug) return null;
    var seances = [], membres = [], demandes = [];
    (Array.isArray(c.seances) ? c.seances : []).forEach(function (s) { var x = normaliserSeance(s); if (x) seances.push(x); });
    (Array.isArray(c.membres_liste) ? c.membres_liste : []).forEach(function (p) { var x = normaliserPersonne(p); if (x) membres.push(x); });
    (Array.isArray(c.demandes) && typeof c.demandes !== "number" ? c.demandes : []).forEach(function (p) { var x = normaliserPersonne(p); if (x) demandes.push(x); });
    return {
      slug: c.slug, nom: nettoyer(c.nom, NOM_MAX) || c.slug, nomAr: nettoyer(c.nom_ar, NOM_MAX),
      accroche: nettoyer(c.accroche, ACCROCHE_MAX), charte: nettoyerBloc(c.charte, CHARTE_MAX),
      porteur: nettoyer(c.porteur, 40), membres: entier(c.membres), ouvert: c.ouvert !== false,
      etat: c.etat === "ferme" ? "ferme" : "actif", lien: lienSur(c.lien) ? c.lien.trim() : null,
      prochaine: c.prochaine && !isNaN(new Date(c.prochaine).getTime()) ? new Date(c.prochaine).toISOString() : null,
      moi: MOIS.indexOf(c.moi) >= 0 ? c.moi : null, gere: c.gere === true || c.moi === "porteur",
      nDemandes: typeof c.demandes === "number" ? entier(c.demandes) : demandes.length,
      seances: seances, listeMembres: membres, listeDemandes: demandes
    };
  }
  function normaliserListe(l) {
    var out = [];
    (Array.isArray(l) ? l : []).forEach(function (c) { var x = normaliserClub(c); if (x) out.push(x); });
    return out;
  }
  // Les demandes qui attendent MA réponse, tous mes clubs confondus (le menu le dit).
  function demandesEnAttente(liste) {
    var n = 0;
    (liste || []).forEach(function (c) { if (c && c.moi === "porteur") n += entier(c.nDemandes); });
    return n;
  }

  // ---- Les séances : avenir · ouverte (un quart d'heure avant → la fin) · passee ----
  function etatSeance(s, maintenant) {
    if (!s || !s.debut) return "passee";
    var m = (maintenant ? new Date(maintenant) : new Date()).getTime();
    var d = new Date(s.debut).getTime(), fn = new Date(s.fin || s.debut).getTime();
    if (m > fn) return "passee";
    if (d - m <= AVANT) return "ouverte";
    return "avenir";
  }
  // Celles qui méritent l'affichage : à venir, en cours, finies depuis moins de deux heures.
  function seancesUtiles(liste, maintenant) {
    var m = (maintenant ? new Date(maintenant) : new Date()).getTime();
    return (liste || []).filter(function (s) { return s && s.debut && new Date(s.fin || s.debut).getTime() >= m - APRES; })
      .sort(function (a, b) { return new Date(a.debut) - new Date(b.debut); });
  }
  // L'heure, dite dans la langue demandée, à l'heure de Casablanca.
  function quand(iso, locale) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try {
      return new Intl.DateTimeFormat(locale || "fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: FUSEAU }).format(d);
    } catch (e) { return d.toISOString().slice(0, 16).replace("T", " "); }
  }
  function jour(iso, locale) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try { return new Intl.DateTimeFormat(locale || "fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: FUSEAU }).format(d); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }

  return {
    NOM_MIN: NOM_MIN, NOM_MAX: NOM_MAX, ACCROCHE_MAX: ACCROCHE_MAX, CHARTE_MAX: CHARTE_MAX, MOT_MAX: MOT_MAX,
    TITRE_MAX: TITRE_MAX, DETAIL_MAX: DETAIL_MAX, DUREE_MIN: DUREE_MIN, DUREE_MAX: DUREE_MAX,
    CLUBS_MAX: CLUBS_MAX, MEMBRES_MAX: MEMBRES_MAX, DEMANDES_MAX: DEMANDES_MAX, SEANCES_MAX: SEANCES_MAX,
    AVANT: AVANT, APRES: APRES, FUSEAU: FUSEAU, RANGS_CREATEURS: RANGS_CREATEURS,
    MOI: MOI, TEXTES: TEXTES, f: f, pluriel: pluriel,
    slug: slug, peutCreer: peutCreer, validerClub: validerClub, validerMot: validerMot, validerSeance: validerSeance, maintenantCasa: maintenantCasa,
    normaliserClub: normaliserClub, normaliserListe: normaliserListe, normaliserSeance: normaliserSeance, demandesEnAttente: demandesEnAttente,
    etatSeance: etatSeance, seancesUtiles: seancesUtiles, quand: quand, jour: jour, lienSur: lienSur
  };
});
