// ZAW'IA — le jeu · LES MASARAT (المسارات) : les parcours (pur).
//
// Un masar est une suite d'ÉTAPES ; chaque étape est un Ta7addi à LIVRABLE
// RÉEL — un skill, une vidéo, une app — remis par un lien et trois lignes (ce
// que ça règle, ce que l'IA a fait, ce que la main a fait), puis ATTESTÉ par
// le bureau : +20 Sna3a attestée. La première étape de chaque masar est
// ouverte à tout joueur entré ; les autres s'ouvrent quand le joueur suit la
// formation qui les enseigne. Toutes les étapes d'un masar attestées :
// l'Ijaza du masar. Décisions du Morchid, 19/09/2026.
//
// CE MODULE NE GARDE RIEN. La clé du jeu est publique : le brief d'une étape
// réservée ne descend que si LA BASE le rend (zawia_etape, zawia-masarat.sql),
// qui tient aussi « ouverte », « accessible » et l'attestation. Ici : la forme
// d'une réponse, l'état d'une étape, la progression, et la validation d'un
// livrable (les mêmes refus que la base, pour ne pas faire attendre).
//
// ⚠️ AUCUN MASAR, AUCUNE ÉTAPE, AUCUN LIEN, AUCUN NOM ICI (le voile) : tout
//    vit en base, posé par la console.
// ⚠️ Les nombres (20, 3, les longueurs) sont aussi dans zawia-masarat.sql —
//    un test compare.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.masarat = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var SNA3A_ETAPE = 20;    // un livrable attesté : le double d'un Ta7addi QCM
  var MIN_ETAPES = 3;      // un masar se publie à trois étapes (sinon il serait gratuit en entier)
  var VOIES = ["prompt", "image", "savoir"];
  var LIMITES = { lien: 500, ligne: 200, titre: 90, resume: 220, brief: 12000, critere: 160, grilleMin: 3, grilleMax: 6, livrable: 300, ouApprendre: 120 };
  // Les trois lignes d'un livrable, dans l'ordre où on les demande.
  var LIGNES = [
    { cle: "regle", nom: "Ce que ça règle" },
    { cle: "ia", nom: "Ce que l'IA a fait" },
    { cle: "main", nom: "Ce que la main a fait" }
  ];
  // L'état d'une étape pour le joueur, du plus avancé au plus lointain.
  var ETATS = {
    attestee: "Attestée",
    a_revoir: "À revoir",
    remise: "Remise — le bureau la relit",
    ouverte: "Ouverte à tous",
    accessible: "Avec ta formation",
    fermee: "Réservée"
  };

  function texte(t, max) {
    if (typeof t !== "string") return "";
    var v = t.replace(/\s+/g, " ").trim();
    return max && v.length > max ? v.slice(0, max) : v;
  }
  function lienSur(url) {
    if (typeof url !== "string") return false;
    var u = url.trim();
    return /^https:\/\/[^\s<>"']+$/i.test(u) && u.length <= LIMITES.lien;
  }
  // « mon-outil.ma/x » se complète en https:// ; « http:// » ne passe pas.
  function completerLien(url) {
    var u = typeof url === "string" ? url.trim() : "";
    if (!u) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return u;
    if (/^[^\s\/]+\.[^\s\/]+/.test(u)) return "https://" + u.replace(/^\/+/, "");
    return u;
  }

  // validerLivrable({ lien, regle, ia, main }) → { ok, valeurs } | { ok: false, erreur }
  // Les mêmes refus que zawia_livrer — la base reste le juge.
  function validerLivrable(v) {
    v = v || {};
    var lien = completerLien(v.lien);
    if (!lienSur(lien)) return { ok: false, erreur: "Le lien du livrable commence par https://." };
    var valeurs = { lien: lien };
    for (var i = 0; i < LIGNES.length; i++) {
      var l = texte(v[LIGNES[i].cle]);
      if (!l) return { ok: false, erreur: "Les trois lignes : ce que ça règle, ce que l'IA a fait, ce que la main a fait." };
      if (l.length > LIMITES.ligne) return { ok: false, erreur: "Deux cents caractères au plus par ligne." };
      valeurs[LIGNES[i].cle] = l;
    }
    return { ok: true, valeurs: valeurs };
  }

  function entier(n, defaut) {
    var v = typeof n === "number" ? n : parseInt(n, 10);
    return isNaN(v) ? defaut : Math.floor(v);
  }
  function normaliserEtape(e) {
    if (!e || typeof e !== "object" || !e.id || !e.titre) return null;
    var liv = e.livrable && typeof e.livrable === "object" && /^(remis|a_revoir|atteste)$/.test(e.livrable.etat)
      ? { etat: e.livrable.etat, note: typeof e.livrable.note_bureau === "string" ? e.livrable.note_bureau : null } : null;
    var pl = e.plus_loin && typeof e.plus_loin === "object" && lienSur(e.plus_loin.lien) && e.plus_loin.titre
      ? { titre: String(e.plus_loin.titre), lien: String(e.plus_loin.lien).trim() } : null;
    return {
      id: String(e.id),
      position: entier(e.position, 0),
      titre: String(e.titre),
      resume: typeof e.resume === "string" ? e.resume : "",
      voie: VOIES.indexOf(e.voie) !== -1 ? e.voie : "prompt",
      dureeMin: Math.max(0, entier(e.duree_min, 0)),
      ouverte: e.ouverte === true,
      accessible: e.accessible === true || e.ouverte === true,
      // null : la base ne dit pas les titres (Talib libre — le voile) ; [] : aucune
      formations: Array.isArray(e.formations) ? e.formations.filter(function (f) { return typeof f === "string" && f; }) : null,
      plusLoin: pl,
      livrable: liv
    };
  }
  // normaliser(réponse de zawia_masarat) → { ok, maison, formationsLues, masarat }
  function normaliser(r) {
    if (!r || r.ok !== true) return { ok: false, erreur: (r && r.erreur) || "Les Masarat ne répondent pas.", maison: false, formationsLues: null, masarat: [] };
    var masarat = (Array.isArray(r.masarat) ? r.masarat : []).map(function (m) {
      if (!m || !m.id || !m.titre) return null;
      var etapes = (Array.isArray(m.etapes) ? m.etapes : []).map(normaliserEtape).filter(Boolean)
        .sort(function (a, b) { return a.position - b.position; });
      return { id: String(m.id), titre: String(m.titre), resume: typeof m.resume === "string" ? m.resume : "",
               genre: m.genre === "technique" ? "technique" : "metier", ijaza: m.ijaza === true, etapes: etapes };
    }).filter(Boolean);
    return { ok: true, maison: r.maison === true, formationsLues: r.formations_lues_le || null, masarat: masarat };
  }

  // etat(étape) → une clé d'ETATS
  function etat(e) {
    if (!e) return "fermee";
    if (e.livrable && e.livrable.etat === "atteste") return "attestee";
    if (e.livrable && e.livrable.etat === "a_revoir") return "a_revoir";
    if (e.livrable && e.livrable.etat === "remis") return "remise";
    if (e.ouverte) return "ouverte";
    if (e.accessible) return "accessible";
    return "fermee";
  }
  function peutOuvrir(e) { return !!e && (e.accessible || e.ouverte || !!e.livrable); }

  // progression(masar) → { attestees, total, complet }
  function progression(m) {
    var etapes = (m && m.etapes) || [], n = 0;
    etapes.forEach(function (e) { if (etat(e) === "attestee") n += 1; });
    return { attestees: n, total: etapes.length, complet: etapes.length > 0 && n === etapes.length };
  }
  // Une étape qui vit dans deux masarat ne compte qu'une fois.
  function etapesDistinctes(masarat) {
    var vues = {}, out = [];
    (masarat || []).forEach(function (m) {
      (m.etapes || []).forEach(function (e) { if (!vues[e.id]) { vues[e.id] = true; out.push(e); } });
    });
    return out;
  }
  // bilan(masarat) → { attestees, remises, ouvertes, accessibles, total, ijazat }
  function bilan(masarat) {
    var b = { attestees: 0, remises: 0, ouvertes: 0, accessibles: 0, total: 0, ijazat: 0 };
    etapesDistinctes(masarat).forEach(function (e) {
      b.total += 1;
      var s = etat(e);
      if (s === "attestee") b.attestees += 1;
      if (s === "remise") b.remises += 1;
      if (e.ouverte) b.ouvertes += 1;
      if (e.accessible || e.ouverte) b.accessibles += 1;
    });
    (masarat || []).forEach(function (m) { if (m.ijaza) b.ijazat += 1; });
    return b;
  }
  // La prochaine étape à faire : accessible, ni remise ni attestée, dans l'ordre des masarat.
  function prochaine(masarat) {
    var liste = etapesDistinctes(masarat);
    for (var i = 0; i < liste.length; i++) {
      var s = etat(liste[i]);
      if (s === "ouverte" || s === "accessible" || s === "a_revoir") return liste[i];
    }
    return null;
  }
  // Ce que dit une étape fermée. Les gens de la maison lisent les titres des
  // formations (le voile est une porte) ; un Talib libre, non.
  function ouvrePar(e) {
    if (!e || e.accessible || e.ouverte) return "";
    if (e.formations && e.formations.length) return "S'ouvre avec : " + e.formations.join(" ou ") + ".";
    return "S'ouvre avec une formation de la maison.";
  }
  // Le ratio de la console : étapes ouvertes / étapes publiées.
  function ratio(ouvertes, total) {
    var o = Math.max(0, entier(ouvertes, 0)), t = Math.max(0, entier(total, 0));
    return { ouvertes: o, total: t, pourcent: t ? Math.round((o / t) * 100) : 0 };
  }
  function peutPublier(nbEtapes) { return entier(nbEtapes, 0) >= MIN_ETAPES; }

  return {
    SNA3A_ETAPE: SNA3A_ETAPE, MIN_ETAPES: MIN_ETAPES, VOIES: VOIES, LIMITES: LIMITES, LIGNES: LIGNES, ETATS: ETATS,
    lienSur: lienSur, completerLien: completerLien, validerLivrable: validerLivrable,
    normaliser: normaliser, normaliserEtape: normaliserEtape, etat: etat, peutOuvrir: peutOuvrir,
    progression: progression, bilan: bilan, prochaine: prochaine, ouvrePar: ouvrePar,
    ratio: ratio, peutPublier: peutPublier
  };
});
