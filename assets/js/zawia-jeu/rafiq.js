// ZAW'IA — le jeu · LE RAFIQ : ton IA, à la forme d'un animal du pays (pur : ni DOM, ni horloge).
//
// v5.3 — étape B de la Rihla (docs/superpowers/specs/2026-09-19-jeu-rihla-open-world-fes.md, § 3).
// Le récit dit « Al-Mawsoul, avec l'IA pour compagnon » : le compagnon, c'est
// le Rafiq. On le choisit une fois, parmi trois, à la porte du temps — c'est
// l'identité du joueur (« team Fakroun »). Il porte une VOIE de l'IA et en
// connaît d'abord les deux techniques ; les autres s'apprennent auprès des
// maîtres de la médina (fes.js) — et Isnad à la bibliothèque de la zawia.
//
// Règles tenues par les tests :
//  1. son niveau, c'est la Sna3a du joueur — l'axe technique existant : il
//     grandit à l'établi, au rihal, au golf du prompt. Ce module ne l'écrit JAMAIS ;
//  2. trois formes : la deuxième à Sani3 (30 de Sna3a) ; la troisième (v5.4) à
//     7adeq (70) ET avec une ijaza — sa branche, Rawi, Muhandis ou Mawsoul, est
//     celle de l'axe le jour où il évolue, et ne change plus ;
//  3. l'axe Naql ↔ 3aql (la transmission, la raison) penche à chaque technique
//     réussie : trois de chaque côté, pour que personne n'y soit poussé ;
//  4. aucun point de M39ol, aucun hasard du navigateur.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.rafiq = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // voie : celle de regles.js (prompt · image · savoir) — dire, voir, vérifier juste.
  var STARTERS = [
    { cle: "hudhud", nom: "Hudhud", ar: "الهدهد", animal: "la huppe", voie: "prompt", techniques: ["tafsil", "mithal"],
      formes: ["Hudhud", "Hudhud al-Qalam"], dit: "Il pose les questions que personne n'ose poser." },
    { cle: "fennec", nom: "Fennec", ar: "الفنك", animal: "le renard du désert", voie: "image", techniques: ["sura", "muqarana"],
      formes: ["Fennec", "Fennec al-Mraya"], dit: "Il voit ce qui cloche dans une image." },
    { cle: "fakroun", nom: "Fakroun", ar: "الفكرون", animal: "la tortue", voie: "savoir", techniques: ["isnad", "tathabbut"],
      formes: ["Fakroun", "Fakroun al-Isnad"], dit: "Il ne croit rien sans l'avoir recoupé." }
  ];

  // Six techniques : de vraies méthodes, qu'on refera au travail. `maitre` : le
  // lieu ou l'habitant qui l'enseigne (fes.js), ou « bibliotheque » (la zawia).
  var TECHNIQUES = [
    { cle: "tafsil", nom: "Tafsil", ar: "التفصيل", voie: "prompt", axe: "3aql", maitre: "m3allem",
      sens: "Préciser : le contexte, le format, la contrainte." },
    { cle: "mithal", nom: "Mithal", ar: "المثال", voie: "prompt", axe: "naql", maitre: "menuisier",
      sens: "Donner un exemple à suivre." },
    { cle: "sura", nom: "Sura", ar: "الصورة", voie: "image", axe: "3aql", maitre: "teinturier",
      sens: "Générer une image, puis la confronter au réel." },
    { cle: "muqarana", nom: "Muqarana", ar: "المقارنة", voie: "image", axe: "3aql", maitre: "magana",
      sens: "Comparer deux versions, repérer l'écart." },
    { cle: "isnad", nom: "Isnad", ar: "الإسناد", voie: "savoir", axe: "naql", maitre: "bibliotheque",
      sens: "Remonter à la source, et la citer." },
    { cle: "tathabbut", nom: "Tathabbut", ar: "التثبت", voie: "savoir", axe: "naql", maitre: "conteuse",
      sens: "Recouper par une deuxième source." }
  ];

  var SEUIL_FORME_2 = 30;   // Sani3, dans regles.js : « il fabrique »
  var SEUIL_FORME_3 = 70;   // 7adeq : « il a la main » — et une ijaza (v5.4)
  // La troisième forme, selon l'axe : le conteur, l'ingénieur, ou celui qui tient les deux.
  var BRANCHES = { naql: { cle: "naql", nom: "ar-Rawi" }, "3aql": { cle: "3aql", nom: "al-Muhandis" }, mawsoul: { cle: "mawsoul", nom: "al-Mawsoul" } };
  var AXE_MAX = 30;         // l'axe va de −30 (Naql) à +30 (3aql)
  var DOSSIER = "assets/img/zawia/jeu/rafiq-";

  function starter(cle) { for (var i = 0; i < STARTERS.length; i++) if (STARTERS[i].cle === cle) return STARTERS[i]; return null; }
  function technique(cle) { for (var i = 0; i < TECHNIQUES.length; i++) if (TECHNIQUES[i].cle === cle) return TECHNIQUES[i]; return null; }
  function techniqueDe(maitre) { for (var i = 0; i < TECHNIQUES.length; i++) if (TECHNIQUES[i].maitre === maitre) return TECHNIQUES[i]; return null; }

  // ---- Ce que la Rihla garde (recit.rihla : rf, t, ax) ------------------------------
  function choisir(e, cle) {
    var s = starter(cle);
    var x = Object.assign({}, e || {});
    if (!s || x.rf) return x;
    x.rf = s.cle;
    x.t = (x.t || []).filter(function (t) { return s.techniques.indexOf(t) < 0; }).concat(s.techniques);
    return x;
  }
  function connait(e, cleTech) { return !!(e && e.t && e.t.indexOf(cleTech) >= 0); }
  function apprendre(e, cleTech) {
    var x = Object.assign({}, e || {});
    if (!technique(cleTech) || !x.rf || connait(x, cleTech)) return { e: x, nouveau: false };
    x.t = (x.t || []).concat([cleTech]);
    return { e: x, nouveau: true, technique: technique(cleTech) };
  }
  function techniques(e) { return TECHNIQUES.filter(function (t) { return connait(e, t.cle); }); }
  // Une technique réussie incline l'axe d'un cran, vers sa famille.
  function incliner(e, cleTech) {
    var x = Object.assign({}, e || {}), t = technique(cleTech);
    if (!t) return x;
    var a = Math.floor(Number(x.ax) || 0) + (t.axe === "3aql" ? 1 : -1);
    x.ax = Math.max(-AXE_MAX, Math.min(AXE_MAX, a));
    return x;
  }
  function axe(e) {
    var a = Math.floor(Number(e && e.ax) || 0);
    if (a <= -5) return { cle: "naql", nom: "Naql — la transmission", valeur: a };
    if (a >= 5) return { cle: "3aql", nom: "3aql — la raison", valeur: a };
    return { cle: "mawsoul", nom: "Mawsoul — les deux tiennent", valeur: a };
  }

  // ---- La forme et la force : lues dans la Sna3a -------------------------------------
  // `sna3a` : l'objet de regles.js ({ prompt, image, savoir }) — jamais modifié ici.
  function total(sna3a) {
    if (!sna3a || typeof sna3a !== "object") return 0;
    return ["prompt", "image", "savoir"].reduce(function (s, k) { return s + Math.max(0, Math.floor(Number(sna3a[k]) || 0)); }, 0);
  }
  // `e` (recit.rihla) : la troisième forme demande une ijaza (e.ij).
  function forme(sna3a, e) {
    var t = total(sna3a);
    if (t >= SEUIL_FORME_3 && e && e.ij && e.ij.length) return 3;
    return t >= SEUIL_FORME_2 ? 2 : 1;
  }
  // La branche : celle qu'on a fixée en évoluant (e.br), sinon celle de l'axe du moment.
  function branche(e) { return BRANCHES[e && e.br] ? e.br : axe(e).cle; }
  // Fixer la branche au moment où le Rafiq atteint sa troisième forme — une fois.
  function evoluer(e, sna3a) {
    var x = Object.assign({}, e || {});
    if (forme(sna3a, x) !== 3 || BRANCHES[x.br]) return { e: x, nouveau: false };
    x.br = axe(x).cle;
    return { e: x, nouveau: true, branche: BRANCHES[x.br] };
  }
  // La force d'une technique : +1 % par point de Sna3a dans SA voie, jusqu'à +50 %.
  function puissance(sna3a, voie) {
    var v = sna3a && typeof sna3a === "object" ? Math.max(0, Math.floor(Number(sna3a[voie]) || 0)) : 0;
    return 1 + Math.min(50, v) / 100;
  }
  function nomForme(cle, sna3a, e) {
    var s = starter(cle), f = forme(sna3a, e);
    if (!s) return "";
    return f === 3 ? s.nom + " " + BRANCHES[branche(e)].nom : s.formes[f - 1];
  }
  function image(cle, f, br) {
    if (f === 3) return DOSSIER + cle + "-3-" + (BRANCHES[br] ? br : "mawsoul") + ".webp";
    return DOSSIER + cle + "-" + (f === 2 ? 2 : 1) + ".webp";
  }

  // Ce que dit le mou'allim quand le Rafiq est choisi.
  function accueil(cle) {
    var s = starter(cle);
    if (!s) return null;
    return {
      nom: "Le mou'allim, à la porte du temps",
      pages: [
        s.nom + " te suivra partout, dans Fès comme dans la zawia.",
        "Son niveau, c'est ta Sna3a : ce que tu apprends à l'établi, au rihal, au golf du prompt, il le sait aussi. Les maîtres de la médina lui apprendront le reste.",
        "Face à une ombre, choisis une technique, puis réussis l'épreuve. Dire juste dissipe le brouillard, voir juste la poussière, vérifier juste le mélange."
      ]
    };
  }
  // Ce que dit un maître qui enseigne.
  function lecon(maitreNom, cleTech) {
    var t = technique(cleTech);
    return t ? maitreNom + " t'apprend " + t.nom + ". " + t.sens : "";
  }

  return {
    STARTERS: STARTERS, TECHNIQUES: TECHNIQUES, SEUIL_FORME_2: SEUIL_FORME_2, SEUIL_FORME_3: SEUIL_FORME_3, BRANCHES: BRANCHES, AXE_MAX: AXE_MAX, DOSSIER: DOSSIER,
    branche: branche, evoluer: evoluer,
    starter: starter, technique: technique, techniqueDe: techniqueDe,
    choisir: choisir, connait: connait, apprendre: apprendre, techniques: techniques, incliner: incliner, axe: axe,
    total: total, forme: forme, puissance: puissance, nomForme: nomForme, image: image, accueil: accueil, lecon: lecon
  };
});
