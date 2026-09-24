// ZAW'IA — le jeu · DERB T-TADAMOUN (درب التضامن) : l'économie sociale et solidaire au Souk (pur).
//
// v8.7 — 24/09/2026. Youssef, au lendemain de l'ouverture : « j'ai rencontré tout à
// l'heure un policier qui voulait entreprendre, très motivé… je pense ouvrir une
// rubrique dans le jeu concernant l'économie sociale et solidaire, les projets RSE…
// comme une section du Souk dédiée à ces jeunes ». Le Souk montre des PRODUITS ; le
// Derb montre des PROJETS qui ont besoin des autres : une coopérative, une
// association, une entreprise sociale, un projet RSE d'entreprise, une initiative de
// quartier — ou UNE IDÉE (le policier n'a pas encore de produit).
//
// Un projet du Derb est une ligne de la MÊME table que la ferracha (zawia_projets,
// dans le CRM), marquée `derb = 'tadamoun'`, avec sa forme, ce qu'il change, où il en
// est, et ce dont il a besoin. Ce fichier est PARTAGÉ : le jeu le lit dans le
// navigateur, et la fonction du Souk (netlify/functions/zawia-souk.js) le `require` —
// les mêmes listes, les mêmes coupes, la même règle des deux côtés. La base les tient
// une troisième fois (les CHECK de scripts/sql/zawia-projets.sql) : un test compare.
//
// Règles tenues par les tests :
//  1. AUCUNE SMSRA sur le Derb : la zawia ne prend rien sur la solidarité — on n'y
//     propose pas d'affaire (la Safqa ne s'ouvre pas sur un projet du Derb) ;
//  2. AUCUN POINT : poser un projet, aider, parrainer ne touchent ni le M39ol, ni la
//     Sna3a, ni la Dhakira. Le M39ol d'une Twiza viendra des témoins, le jour où le
//     bureau aura son barème — pas d'ici ;
//  3. une idée est admise : ni lien, ni produit, ni structure exigés — un nom et une
//     forme suffisent ;
//  4. le voile : aucun nom de la maison, aucun lien écrit ici.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.tadamoun = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var NOM = "Derb t-Tadamoun", AR = "درب التضامن";

  // ---- Les deux derbs d'une ferracha -----------------------------------------------------
  // « souk » : un produit, un service (le Souk, la Safqa, la smsra) ; « tadamoun » : un
  // projet solidaire (le Derb). Une ligne sans valeur est au Souk : c'est tout l'existant.
  var DERBS = ["souk", "tadamoun"];

  // ---- Ce qu'un projet du Derb dit de lui --------------------------------------------------
  // ⚠️ Ces clés existent TROIS fois : ici, dans les CHECK de zawia-projets.sql, et (par
  // require) dans la fonction du Souk. Un test compare. Ajouter une clé = les deux fichiers.
  var FORMES = [
    { cle: "cooperative", nom: "Une coopérative", ar: "تعاونية" },
    { cle: "association", nom: "Une association", ar: "جمعية" },
    { cle: "entreprise-sociale", nom: "Une entreprise sociale", ar: "مقاولة اجتماعية" },
    { cle: "rse", nom: "Un projet RSE d'entreprise", ar: "مشروع للمسؤولية الاجتماعية لمقاولة" },
    { cle: "quartier", nom: "Une initiative de quartier", ar: "مبادرة في الحي" },
    { cle: "idee", nom: "Une idée, pas encore de structure", ar: "فكرة، بلا هيكل بعد" }
  ];
  var STADES = [
    { cle: "idee", nom: "Une idée", ar: "فكرة" },
    { cle: "prototype", nom: "Un prototype", ar: "نموذج أولي" },
    { cle: "lance", nom: "Lancé", ar: "انطلق" },
    { cle: "croissance", nom: "En croissance", ar: "في نموّ" }
  ];
  // Les mots de la Bitaqa quand ils disent la même chose (mentor, bénévoles, financement).
  var BESOINS = [
    { cle: "ia", nom: "des compétences IA", ar: "كفاءات في الذكاء الاصطناعي" },
    { cle: "mentor", nom: "un mentor", ar: "موجّه" },
    { cle: "benevoles", nom: "des bénévoles", ar: "متطوّعين" },
    { cle: "local", nom: "un local", ar: "مقرّ" },
    { cle: "financement", nom: "un financement", ar: "تمويل" },
    { cle: "partenaire-rse", nom: "un partenaire RSE", ar: "شريك في المسؤولية الاجتماعية" },
    { cle: "visibilite", nom: "de la visibilité", ar: "إشعاع" }
  ];
  var IMPACT_MAX = 280;   // « ce que ça change » : qui en profite, où, combien — ⚠️ = le CHECK de la base

  // ---- Parrainer (RSE) : une entreprise qui veut adopter un projet écrit au bureau ----------
  // ⚠️ = zawia-derb.sql (les coupes et le plafond). Le bureau répond dans le jeu ; une
  // entreprise qui adopte un projet est gravée à la Rkhama (la console le fait, à la main).
  var ENTREPRISE_MIN = 2, ENTREPRISE_MAX = 90, MOT_MAX = 400, OUVERTS_MAX = 5;
  var ETATS = [
    { cle: "nouveau", nom: "Envoyé au bureau", ar: "أُرسل إلى المكتب" },
    { cle: "en-cours", nom: "Le bureau s'en occupe", ar: "المكتب يتابعه" },
    { cle: "conclu", nom: "Conclu", ar: "تمّ" },
    { cle: "decline", nom: "Pas cette fois", ar: "ليس هذه المرّة" }
  ];

  function cles(liste) { return liste.map(function (e) { return e.cle; }); }
  function trouver(liste, cle) {
    for (var i = 0; i < liste.length; i++) if (liste[i].cle === cle) return liste[i];
    return null;
  }
  // Le libellé d'une clé, dans la langue de la page. Les listes portent leur arabe : un
  // libellé posé par le code ne passe pas par le dictionnaire (la leçon de la Bitaqa —
  // deux listes qui partagent un mot se disputeraient sa traduction).
  function nom(liste, cle, ar) {
    var e = trouver(liste, cle);
    return e ? (ar && e.ar ? e.ar : e.nom) : "";
  }
  function nettoyer(v, max) {
    if (typeof v !== "string") return "";
    return v.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  }
  function derbDe(v) { return v === "tadamoun" ? "tadamoun" : "souk"; }
  function besoinsPropres(v) {
    var voulus = Array.isArray(v) ? v.map(String) : [];
    return BESOINS.map(function (b) { return b.cle; }).filter(function (c) { return voulus.indexOf(c) >= 0; });
  }

  // ---- Ce que la ligne porte (la fonction du Souk l'écrit tel quel) --------------------------
  // Au Souk, rien du Derb : un projet repassé au Souk perd sa forme et ses besoins, il ne
  // les garde pas en secret. Au Derb, une forme inconnue vaut null (la fonction refuse
  // alors l'envoi : la base exige une forme), un stade inconnu vaut « une idée ».
  function ligne(p) {
    p = p || {};
    var derb = derbDe(p.derb);
    if (derb === "souk") return { derb: "souk", forme: null, stade: null, impact: null, besoins: null };
    var impact = nettoyer(p.impact, IMPACT_MAX);
    return {
      derb: "tadamoun",
      forme: trouver(FORMES, p.forme) ? p.forme : null,
      stade: trouver(STADES, p.stade) ? p.stade : "idee",
      impact: impact || null,
      besoins: besoinsPropres(p.besoins)
    };
  }

  // Ce que le formulaire envoie : dit AVANT d'essayer ce que la fonction refuserait.
  function valider(champs) {
    var l = ligne(champs);
    if (l.derb === "tadamoun" && !l.forme) {
      return { ok: false, texte: "Dis ce qu'est ton projet : une coopérative, une association, une entreprise sociale, un projet RSE, une initiative de quartier — ou une idée." };
    }
    return { ok: true, valeur: l };
  }

  // Ce qu'un projet affiche (après la fonction : on revérifie chaque clé).
  function projet(p) {
    p = p || {};
    if (derbDe(p.derb) !== "tadamoun") return { derb: "souk", forme: "", stade: "", impact: "", besoins: [] };
    return {
      derb: "tadamoun",
      forme: trouver(FORMES, p.forme) ? p.forme : "idee",
      stade: trouver(STADES, p.stade) ? p.stade : "idee",
      impact: nettoyer(p.impact, IMPACT_MAX),
      besoins: besoinsPropres(p.besoins)
    };
  }
  function estDuDerb(p) { return !!p && derbDe(p.derb) === "tadamoun"; }

  // ---- La ruelle : tous les projets, d'un regard ----------------------------------------------
  // `tapis` : ce que souk.js a rangé (Sk.etat(...).tapis), où chaque tapis porte `derb`,
  // ses projets solidaires. Rend une liste à plat, dans l'ordre du site (le même pour
  // tous) : [{ t, p, tapis, projet }] — `t` l'indice du tapis, `p` celui du projet.
  function liste(tapis) {
    var out = [];
    (Array.isArray(tapis) ? tapis : []).forEach(function (t, ti) {
      (t && Array.isArray(t.derb) ? t.derb : []).forEach(function (pr, pi) {
        out.push({ t: ti, p: pi, tapis: t, projet: pr });
      });
    });
    return out;
  }
  // Les filtres de l'onglet : un besoin, une forme. Vide = tout.
  function filtrer(l, f) {
    f = f || {};
    return (Array.isArray(l) ? l : []).filter(function (e) {
      var pr = e && e.projet;
      if (!pr) return false;
      if (f.besoin && (pr.besoins || []).indexOf(f.besoin) < 0) return false;
      if (f.forme && pr.forme !== f.forme) return false;
      return true;
    });
  }
  function compter(l) {
    var porteurs = {};
    (Array.isArray(l) ? l : []).forEach(function (e) { porteurs[e.t] = true; });
    return { projets: (l || []).length, porteurs: Object.keys(porteurs).length };
  }

  // ---- « Je peux aider » : le premier mot d'une Rasa'il, déjà écrit ---------------------------
  // On ouvre le fil avec le porteur, ce texte dans la case — on ne l'envoie JAMAIS à sa
  // place : il le relit, le complète, et c'est lui qui appuie.
  function messageAide(projetNom, besoinCle, ar) {
    var n = nettoyer(projetNom, 48) || (ar ? "مشروعك" : "ton projet");
    var b = nom(BESOINS, besoinCle, ar);
    if (ar) return "السلام عليكم! رأيت «" + n + "» في درب التضامن. " + (b ? "أستطيع المساعدة في: " + b + ". " : "أستطيع المساعدة. ") + "هذا ما أقترحه: ";
    return "Salam ! J'ai vu « " + n + " » au Derb t-Tadamoun. " + (b ? "Je peux aider pour : " + b + ". " : "Je peux aider. ") + "Voilà ce que je propose : ";
  }

  function validerParrainage(champs) {
    champs = champs || {};
    var entreprise = nettoyer(champs.entreprise, ENTREPRISE_MAX);
    var mot = nettoyer(champs.mot, MOT_MAX);
    if (entreprise.length < ENTREPRISE_MIN) return { ok: false, texte: "Dis au nom de quelle entreprise tu proposes ce parrainage." };
    return { ok: true, valeur: { entreprise: entreprise, mot: mot } };
  }

  return {
    NOM: NOM, AR: AR, DERBS: DERBS, FORMES: FORMES, STADES: STADES, BESOINS: BESOINS, IMPACT_MAX: IMPACT_MAX,
    ENTREPRISE_MIN: ENTREPRISE_MIN, ENTREPRISE_MAX: ENTREPRISE_MAX, MOT_MAX: MOT_MAX, OUVERTS_MAX: OUVERTS_MAX, ETATS: ETATS,
    cles: cles, trouver: trouver, nom: nom, nettoyer: nettoyer, derbDe: derbDe, besoinsPropres: besoinsPropres,
    ligne: ligne, valider: valider, projet: projet, estDuDerb: estDuDerb,
    liste: liste, filtrer: filtrer, compter: compter,
    messageAide: messageAide, validerParrainage: validerParrainage
  };
});
