// ZAW'IA — le jeu · LA BITAQA (البطاقة) : la carte d'un membre, et l'annuaire (pur).
//
// v8.6 — 24/09/2026, Youssef : « prévois les données sociales de nos membres au sein du
// jeu, pour le networking ». La cour montrait qui est là ; rien ne disait QUI il est, ce
// qu'il cherche, ce qu'il peut offrir. La carte a deux moitiés :
//   · ce que le JEU SAIT, sans rien déclarer — le rang, la tariqa et le maydan, les
//     maharat prouvées et les ijazat, « dans la cour depuis » (la même vérité que le
//     Lawh, qui la montre déjà par pseudo) ;
//   · ce que le MEMBRE CHOISIT DE DIRE, tout facultatif — sa ville, ce qu'il fait,
//     ce qu'il cherche et ce qu'il offre (des étiquettes et deux lignes), ses langues,
//     cinq liens https au plus.
//
// ⚠️⚠️ NI TÉLÉPHONE NI E-MAIL : on se joint par les Rasa'il (rasail.js), qui tiennent
//      les freins contre la relance. Un numéro sur une carte les contournerait tous.
// ⚠️ La carte est FERMÉE par défaut, et ne se lit que par les joueurs ADMIS (ni les
//    invités, ni le Lawh public). C'est la base qui tient la porte (zawia-bitaqa.sql) ;
//    ici on ne fait que valider, dire et ranger.
// ⚠️ Les étiquettes, les langues, les liens et leurs domaines existent DEUX fois — ici et
//    dans zawia-bitaqa.sql. Un test compare les deux fichiers.
// ⚠️ La charte vaut : se montrer ne donne jamais un point.
// Pur : aucun accès au DOM, au réseau, à l'horloge ni au hasard — testable sous Node.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.bitaqa = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var VILLE_MAX = 40, METIER_MAX = 80, MOT_MAX = 120, LIENS_MAX = 5, URL_MAX = 200;
  var PAR_PAGE = 30;

  // « Je cherche » — ce qu'un maker demande à la maison.
  // Chaque liste porte son arabe (`ar`), comme les tariqat et les maharat : la page le lit
  // directement — le dictionnaire aurait heurté « Français » (le bouton de langue) et « un stage ».
  var CHERCHE = [
    { cle: "associe", nom: "un associé", ar: "شريك" },
    { cle: "mentor", nom: "un mentor", ar: "موجّه" },
    { cle: "clients", nom: "des clients", ar: "زبائن" },
    { cle: "emploi", nom: "un emploi", ar: "عمل" },
    { cle: "stage", nom: "un stage", ar: "تدريب" },
    { cle: "benevoles", nom: "des bénévoles", ar: "متطوّعين" },
    { cle: "financement", nom: "un financement", ar: "تمويل" },
    { cle: "testeurs", nom: "des testeurs", ar: "من يجرّب" },
    { cle: "apprendre", nom: "apprendre", ar: "التعلّم" }
  ];
  // « J'offre » — ce qu'il peut donner.
  var OFFRE = [
    { cle: "mentorat", nom: "du mentorat", ar: "توجيه" },
    { cle: "relecture", nom: "une relecture", ar: "مراجعة" },
    { cle: "technique", nom: "un coup de main technique", ar: "مساعدة تقنية" },
    { cle: "mission", nom: "une mission", ar: "مهمّة" },
    { cle: "stage", nom: "un stage", ar: "تدريب" },
    { cle: "emploi", nom: "un emploi", ar: "عمل" },
    { cle: "benevolat", nom: "du temps bénévole", ar: "وقت تطوّعي" },
    { cle: "tester", nom: "tester vos produits", ar: "تجربة منتجاتكم" }
  ];
  var LANGUES = [
    { cle: "darija", nom: "Darija", ar: "الدارجة" },
    { cle: "arabe", nom: "Arabe", ar: "العربية" },
    { cle: "amazigh", nom: "Amazigh", ar: "الأمازيغية" },
    { cle: "francais", nom: "Français", ar: "الفرنسية" },
    { cle: "anglais", nom: "Anglais", ar: "الإنجليزية" },
    { cle: "espagnol", nom: "Espagnol", ar: "الإسبانية" }
  ];
  // Un lien a un TYPE, et le type a ses domaines : un « LinkedIn » qui mène ailleurs est
  // refusé (c'est ainsi qu'on déguise un lien). « Site » accepte tout domaine en https.
  var LIENS = [
    { cle: "linkedin", nom: "LinkedIn", domaines: ["linkedin.com"] },
    { cle: "github", nom: "GitHub", domaines: ["github.com"] },
    { cle: "site", nom: "Site", ar: "موقع", domaines: null },
    { cle: "behance", nom: "Behance", domaines: ["behance.net"] },
    { cle: "youtube", nom: "YouTube", domaines: ["youtube.com", "youtu.be"] },
    { cle: "instagram", nom: "Instagram", domaines: ["instagram.com"] },
    { cle: "tiktok", nom: "TikTok", domaines: ["tiktok.com"] },
    { cle: "x", nom: "X", domaines: ["x.com", "twitter.com"] }
  ];
  // Des villes pour la saisie (une suggestion, jamais une liste fermée : la maison a des portes dehors).
  var VILLES = ["Casablanca", "Rabat", "Fès", "Marrakech", "Tanger", "Agadir", "Oujda", "Meknès", "Tétouan", "Kénitra",
    "Salé", "El Jadida", "Béni Mellal", "Nador", "Safi", "Essaouira", "Laâyoune", "Dakhla", "Ouarzazate", "Ifrane",
    "Montréal", "Paris", "Bruxelles", "Sydney"];

  function trouve(liste, cle) {
    for (var i = 0; i < liste.length; i++) if (liste[i].cle === cle) return liste[i];
    return null;
  }
  function libelle(liste, cle) { var e = trouve(liste, cle); return e ? e.nom : ""; }
  function entree(liste, cle) { return trouve(liste, cle); }
  function ligne(v, max) {
    return String(v == null ? "" : v).replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  }
  function etiquettes(liste, v) {
    var out = [];
    (Array.isArray(v) ? v : []).forEach(function (c) { c = String(c || ""); if (trouve(liste, c) && out.indexOf(c) < 0) out.push(c); });
    // l'ordre de la liste, pas celui des clics : deux cartes se lisent pareil
    return liste.map(function (e) { return e.cle; }).filter(function (c) { return out.indexOf(c) >= 0; });
  }

  // ---- Les liens -----------------------------------------------------------------------------
  function hote(url) {
    var m = /^https:\/\/([^\/?#\s]+)/i.exec(String(url || ""));
    if (!m) return "";
    var h = m[1].toLowerCase();
    if (h.indexOf("@") >= 0 || h.indexOf(":") >= 0) return "";   // ni identifiants ni port dans une adresse partagée
    return /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(h) ? h : "";
  }
  function surDomaine(h, domaines) {
    if (!domaines) return true;
    return domaines.some(function (d) { return h === d || h.slice(-(d.length + 1)) === "." + d; });
  }
  function lienValide(type, url) {
    var t = trouve(LIENS, type);
    if (!t) return { ok: false, erreur: "Ce type de lien n'existe pas." };
    var u = String(url == null ? "" : url).trim();
    if (!u) return { ok: false, erreur: "" };
    if (u.length > URL_MAX) return { ok: false, erreur: "Ce lien est trop long." };
    if (!/^https:\/\//i.test(u)) return { ok: false, erreur: "Un lien commence par https://" };
    var h = hote(u);
    if (!h || /\s/.test(u)) return { ok: false, erreur: "Ce lien " + t.nom + " n'est pas une adresse valide." };
    if (!surDomaine(h, t.domaines)) return { ok: false, erreur: "Ce lien " + t.nom + " ne mène pas à " + t.domaines[0] + "." };
    return { ok: true, url: u };
  }

  // ---- Ce qu'on pose ------------------------------------------------------------------------
  // `saisie` : { visible, ville, metier, cherche[], chercheMot, offre[], offreMot, langues[], liens: [{ type, url }] }.
  // Rend { ok, carte } ou { ok: false, erreur } — l'erreur dit quoi corriger.
  function valider(saisie) {
    var s = saisie && typeof saisie === "object" ? saisie : {};
    var liens = [];
    var brut = Array.isArray(s.liens) ? s.liens : [];
    for (var i = 0; i < brut.length; i++) {
      var l = brut[i] || {};
      if (!String(l.url == null ? "" : l.url).trim()) continue;   // une case vide n'est pas un lien
      var v = lienValide(l.type, l.url);
      if (!v.ok) return { ok: false, erreur: v.erreur || "Ce lien n'est pas valide." };
      if (liens.some(function (x) { return x.url === v.url; })) continue;
      liens.push({ type: String(l.type), url: v.url });
    }
    if (liens.length > LIENS_MAX) return { ok: false, erreur: "Cinq liens au plus." };
    return { ok: true, carte: {
      visible: s.visible === true,
      ville: ligne(s.ville, VILLE_MAX),
      metier: ligne(s.metier, METIER_MAX),
      cherche: etiquettes(CHERCHE, s.cherche), chercheMot: ligne(s.chercheMot, MOT_MAX),
      offre: etiquettes(OFFRE, s.offre), offreMot: ligne(s.offreMot, MOT_MAX),
      langues: etiquettes(LANGUES, s.langues),
      liens: liens
    } };
  }

  // ---- Ce que la base rend ---------------------------------------------------------------------
  // { joueur: { id, pseudo, avatar, rang, tariqa, maydan, depuis, maharat[] }, visible, carte }
  function normaliserCarte(c) {
    c = c && typeof c === "object" ? c : {};
    var liens = (Array.isArray(c.liens) ? c.liens : []).map(function (l) {
      var v = lienValide(l && l.type, l && l.url);
      return v.ok ? { type: String(l.type), url: v.url } : null;
    }).filter(Boolean).slice(0, LIENS_MAX);
    return {
      ville: ligne(c.ville, VILLE_MAX), metier: ligne(c.metier, METIER_MAX),
      cherche: etiquettes(CHERCHE, c.cherche), chercheMot: ligne(c.chercheMot, MOT_MAX),
      offre: etiquettes(OFFRE, c.offre), offreMot: ligne(c.offreMot, MOT_MAX),
      langues: etiquettes(LANGUES, c.langues), liens: liens, maj: c.maj || null
    };
  }
  function normaliserJoueur(j) {
    j = j && typeof j === "object" ? j : {};
    return {
      id: String(j.id || "").replace(/[^0-9a-zA-Z_-]/g, "").slice(0, 64),
      pseudo: ligne(j.pseudo, 40) || "Un Talib",
      avatar: j.avatar && typeof j.avatar === "object" ? j.avatar : null,
      rang: ligne(j.rang, 20) || null, tariqa: ligne(j.tariqa, 20) || null, maydan: ligne(j.maydan, 30) || null,
      depuis: j.depuis || null,
      maharat: (Array.isArray(j.maharat) ? j.maharat : []).map(function (m) { return ligne(m, 60); }).filter(Boolean)
    };
  }
  function normaliser(r) {
    r = r && typeof r === "object" ? r : {};
    return { joueur: normaliserJoueur(r.joueur), visible: r.visible === true, carte: r.carte ? normaliserCarte(r.carte) : null };
  }
  // Rien de choisi : la carte ouverte ne dirait que ce que le jeu sait.
  function vide(c) {
    return !c || (!c.ville && !c.metier && !c.cherche.length && !c.chercheMot && !c.offre.length && !c.offreMot && !c.langues.length && !c.liens.length);
  }

  // ---- L'annuaire ------------------------------------------------------------------------------
  // Les filtres que la base comprend. Une valeur inconnue est laissée de côté (jamais une erreur).
  function filtres(f, tariqat, mayadin) {
    f = f && typeof f === "object" ? f : {};
    var dans = function (liste, v) { return liste && liste.some(function (e) { return e.cle === v; }) ? v : null; };
    return {
      texte: ligne(f.texte, 40) || null,
      tariqa: dans(tariqat, f.tariqa), maydan: dans(mayadin, f.maydan),
      cherche: dans(CHERCHE, f.cherche), offre: dans(OFFRE, f.offre),
      ville: ligne(f.ville, VILLE_MAX) || null,
      mahara: ligne(f.mahara, 60) || null
    };
  }
  function normaliserAnnuaire(r) {
    r = r && typeof r === "object" ? r : {};
    var cartes = (Array.isArray(r.cartes) ? r.cartes : []).map(function (x) {
      var n = normaliser({ joueur: x.joueur, visible: true, carte: x.carte });
      return { joueur: n.joueur, carte: n.carte || normaliserCarte({}) };
    }).filter(function (x) { return !!x.joueur.id; });
    var total = Math.max(0, Math.floor(Number(r.total) || 0));
    var page = Math.max(0, Math.floor(Number(r.page) || 0));
    return { cartes: cartes, total: total, page: page, plus: (page + 1) * PAR_PAGE < total };
  }

  return {
    VILLE_MAX: VILLE_MAX, METIER_MAX: METIER_MAX, MOT_MAX: MOT_MAX, LIENS_MAX: LIENS_MAX, URL_MAX: URL_MAX, PAR_PAGE: PAR_PAGE,
    CHERCHE: CHERCHE, OFFRE: OFFRE, LANGUES: LANGUES, LIENS: LIENS, VILLES: VILLES,
    libelle: libelle, entree: entree, hote: hote, lienValide: lienValide, valider: valider,
    normaliser: normaliser, normaliserCarte: normaliserCarte, normaliserJoueur: normaliserJoueur, vide: vide,
    filtres: filtres, normaliserAnnuaire: normaliserAnnuaire
  };
});
