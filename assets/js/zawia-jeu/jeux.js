// ZAW'IA — le jeu · LES JEUX DE LA ZAWIA : où ils sont, et qui le dit (pur : ni DOM, ni horloge).
//
// v5.1 — « Comment les gens découvriront-ils les jeux ? » (Youssef, 19/09/2026).
// Six jeux étaient posés, chacun à sa place, et presque personne ne le savait :
// Atay n'était qu'au pied des orangers, Wach nulle part. Ce module est la liste
// UNIQUE — le menu, Ba Driss, le Wird et le carnet la lisent tous ici.
//
// Quatre règles, tenues par les tests :
//  1. le monde le dit, jamais une bannière (la charte) : Ba Driss, une fois par
//     édition ; le Wird, chaque jour ; le carnet, quand on l'ouvre ;
//  2. AUCUN POINT : un jeu donne sa goutte à la fontaine, pas un compteur. Le
//     carnet montre ce qu'on a joué, il ne le convertit en rien ;
//  3. aucun lien absolu : les jeux entre amis vivent sur le domaine du jeu ;
//  4. une nouvelle ÉDITION (un jeu de plus) se pose en changeant `EDITION` :
//     Ba Driss la redit à chacun, une fois.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.jeux = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var EDITION = "2026-09-20";   // v5.2 — la porte du temps s'est ouverte : Ba Driss le redit

  // rythme : « jour » (se rejoue chaque matin), « semaine » (la fontaine),
  // « amis » (une page à part, sans compte, qu'on envoie).
  var JEUX = [
    { cle: "kelma", nom: "Lkelma d'lyoum", rythme: "jour", tuile: "K" },
    { cle: "atay", nom: "Atay", rythme: "jour", tuile: "T" },
    { cle: "qlil", nom: "Qlil w mfid", rythme: "jour", tuile: "Y" },
    { cle: "khessa", nom: "La fontaine du Sahn", rythme: "semaine", tuile: "f" },
    { cle: "nsyan", nom: "Chkoun Nsyan ?", rythme: "amis", lien: "/nsyan" },
    { cle: "wach", nom: "Wach hadi IA ?", rythme: "amis", lien: "/wach" }
  ];
  function jeu(cle) { for (var i = 0; i < JEUX.length; i++) if (JEUX[i].cle === cle) return JEUX[i]; return null; }
  function duRythme(r) { return JEUX.filter(function (j) { return j.rythme === r; }); }

  // ---- Ce qu'on garde (recit.jeux) : { vu: "<édition entendue>" } --------------------
  function normaliserEtat(x) {
    return x && typeof x === "object" && typeof x.vu === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.vu) ? { vu: x.vu } : {};
  }
  function aAnnoncer(recit) { return normaliserEtat(recit && recit.jeux).vu !== EDITION; }
  function marquer(recit) {
    var r = recit && typeof recit === "object" ? Object.assign({}, recit) : {};
    r.jeux = { vu: EDITION };
    return r;
  }

  // ---- Ba Driss, une fois par édition ------------------------------------------------
  // Le bawwab voit tout le monde passer : c'est lui qui dit ce qui a changé.
  // Même texte pour les deux lignées — tous ces jeux sont ouverts au Talib libre.
  function annonce(pseudo) {
    var p = String(pseudo || "").trim() || "Talib";
    return {
      nom: "Ba Driss, depuis la porte",
      pages: [
        p + " ! Viens voir. La cour a de nouveaux jeux. Aucun ne donne de points : on y joue pour le plaisir — et pour la fontaine.",
        "Chaque jour, trois. Lkelma d'lyoum, au lawh du mur nord de la Madrasa : un mot, le même pour tous, six essais. Et l'Atay, sous les orangers du riad : trois verres, versés de haut.",
        "Le troisième, c'est Qlil w mfid, à l'établi du prompt, au coin de la Madrasa : faire dire au modèle exactement ce qu'on demande, avec le prompt le plus court.",
        "Chaque partie verse une goutte à la fontaine du Sahn. Si la cour la remplit dans la semaine, les lanternes restent allumées la semaine d'après — pour tout le monde.",
        "Et pour tes amis, sans compte : Chkoun Nsyan ?, pour trouver qui a oublié le mot, et Wach hadi IA ?, dix duels pour démasquer l'IA. Envoie-leur le lien.",
        "Et au fond de la Khizana, la porte du temps s'est ouverte : Bab ar-Rihla. Derrière, Fès t'attend — grise, et qui n'attend que toi.",
        "Tout est au Menu, sous « Jouer ». Et le Wird te dit chaque jour ce qui reste à jouer."
      ]
    };
  }

  // ---- Le Wird : les jeux du jour -----------------------------------------------------
  // f : ce que jeu.js sait — { kelma: { fait, numero }, atay: { fait, note },
  //     qlil: { fait }, khessa: { niveau, objectif } | null }.
  // Rend une ligne par jeu, dans l'ordre de JEUX : { cle, fait, texte, tuile }.
  function duJour(f) {
    f = f || {};
    var lignes = [];
    var k = f.kelma || {}, n = Math.max(0, Math.floor(Number(k.numero) || 0));
    lignes.push({ cle: "kelma", tuile: "K", fait: !!k.fait,
      texte: k.fait ? "Lkelma #" + n + " est écrite. La prochaine s'écrit à minuit." : "Lkelma #" + n + " t'attend au lawh du jour, au mur nord de la Madrasa." });
    var a = f.atay || {}, note = Math.max(0, Math.min(100, Math.floor(Number(a.note) || 0)));
    lignes.push({ cle: "atay", tuile: "T", fait: !!a.fait,
      texte: a.fait ? "Ton atay est servi : " + note + "/100 aujourd'hui." : "Trois verres t'attendent sous les orangers du riad." });
    var q = f.qlil || {};
    lignes.push({ cle: "qlil", tuile: "Y", fait: !!q.fait,
      texte: q.fait ? "Un trou joué aujourd'hui à l'établi du prompt." : "Un trou de golf du prompt t'attend, à l'établi du coin de la Madrasa." });
    var x = f.khessa;
    if (x && Number(x.objectif) > 0) {
      lignes.push({ cle: "khessa", tuile: "f", fait: false,
        texte: "La fontaine du Sahn : " + Math.max(0, Math.floor(Number(x.niveau) || 0)) + " gouttes sur " + Math.floor(Number(x.objectif)) + " cette semaine." });
    }
    return lignes;
  }
  // Combien des jeux du jour restent — pour le Wird et Ba Driss.
  function restants(lignes) { return (lignes || []).filter(function (l) { return l.cle !== "khessa" && !l.fait; }).length; }

  // ---- Le carnet : une page, toujours la même forme ------------------------------------
  // Une seule forme, pour que la version arabe la traduise d'un gabarit. Ce
  // que l'écran ne sait pas encore s'écrit « — ».
  function nombre(v) { return v === null || v === undefined || !Number.isFinite(Number(v)) ? "—" : String(Math.max(0, Math.floor(Number(v)))); }
  function carnet(f) {
    f = f || {};
    var k = f.kelma || {}, a = f.atay || {}, q = f.qlil || null;
    return "Les jeux de la zawia — aucun point, que du jeu.\n" +
      "Lkelma d'lyoum · jours joués " + nombre(k.jours) + " · série " + nombre(k.serie) + " · record " + nombre(k.record) + "\n" +
      "Atay · services " + nombre(a.s) + " · meilleure tasse " + nombre(a.m) + "/100\n" +
      "Qlil w mfid · trous réussis " + nombre(q ? q.faits : null) + " sur " + nombre(f.trous) + "\n" +
      "La fontaine · tes gouttes aujourd'hui " + nombre(f.gouttes);
  }

  return {
    EDITION: EDITION, JEUX: JEUX, jeu: jeu, duRythme: duRythme,
    normaliserEtat: normaliserEtat, aAnnoncer: aAnnoncer, marquer: marquer,
    annonce: annonce, duJour: duJour, restants: restants, carnet: carnet
  };
});
