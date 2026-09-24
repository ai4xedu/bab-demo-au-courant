// ZAW'IA — le jeu · QLIL W MFID : le golf du prompt (pur : ni DOM, ni réseau).
//
// v4.8 — « قليل ومفيد », peu et utile. Neuf trous, comme un parcours de golf :
// pour chacun, faire sortir du modèle EXACTEMENT ce qui est demandé, avec le
// prompt le plus court. Chaque caractère compte. C'est la voie « dire juste »
// jouée pour de vrai — et le meilleur détecteur de talents du vivier : il est
// ouvert aux Tolba libres comme aux gens de la maison.
//
// Ce module est PARTAGÉ : le jeu l'affiche (les trous, le compteur, les
// interdits), et la fonction Netlify zawia-qlil.js le REQUIERT pour juger.
// Le navigateur ne juge jamais : c'est le serveur qui appelle le modèle,
// passe sa réponse à `juger`, et consigne l'essai en base (zawia-qlil.sql).
//
// Cinq règles, tenues par les tests :
//  1. un juge est DÉTERMINISTE : une chaîne en entrée, un verdict en sortie —
//     jamais le hasard, jamais un deuxième modèle pour juger le premier ;
//  2. un prompt ne peut pas contenir la réponse (`interdits`) : sinon le golf
//     se résume à « écris : Rabat » ;
//  3. les chiffres existent deux fois — QUOTA, PLAFOND, MAX_PROMPT et la liste
//     des trous sont aussi dans zawia-qlil.sql, et un test compare ;
//  4. la Sna3a ne se gagne qu'au PREMIER trou réussi (10, 15 sous le par) —
//     les records suivants ne rapportent que la place au tableau ;
//  5. aucun lien, aucun nom : le voile.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.qlil = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var MIN_PROMPT = 3;
  var MAX_PROMPT = 300;     // un prompt de golf n'a pas besoin de plus
  var MAX_SORTIE = 600;     // ce qu'on garde et ce qu'on montre de la réponse
  var QUOTA = 10;           // essais par joueur et par jour (heure de Casablanca)
  var PLAFOND = 1500;       // essais par jour pour toute la maison : la facture a un toit
  var SNA3A = { reussi: 10, sousLePar: 15 };
  var VOIE = "prompt";      // « dire juste »
  var GESTE = "qlil";       // la goutte qu'un essai verse à la fontaine (khessa.js)

  // ---- Les neuf trous ------------------------------------------------------------------
  // `juge` : { type, … } — exact · json-ensemble · haiku · arabe · tirets.
  // `interdits` : ce que le prompt ne peut pas contenir (comparé sans casse ni accents).
  // `par` : un prompt honnête y arrive ; faire mieux, c'est jouer sous le par.
  var TROUS = [
    { cle: "rabat", titre: "La capitale", par: 22,
      consigne: "Fais écrire au modèle exactement : Rabat. Un mot, rien autour.",
      interdits: ["rabat"], juge: { type: "exact", valeur: "Rabat" } },
    { cle: "fondation", titre: "L'année de la fondation", par: 34,
      consigne: "Exactement : 859 — l'année où Fatima al-Fihri fonde la Qarawiyine. Le nombre seul.",
      interdits: ["859"], juge: { type: "exact", valeur: "859" } },
    { cle: "compter", titre: "Compter jusqu'à dix", par: 28,
      consigne: "Exactement : 1 2 3 4 5 6 7 8 9 10 — sur une ligne, séparés par des espaces.",
      interdits: ["1 2 3"], juge: { type: "exact", valeur: "1 2 3 4 5 6 7 8 9 10" } },
    { cle: "villes", titre: "Les villes impériales", par: 44,
      consigne: "Un tableau JSON, et rien d'autre, avec les quatre villes impériales du Maroc, dans n'importe quel ordre.",
      interdits: ["fes", "marrakech", "meknes", "rabat"], juge: { type: "json-ensemble", valeurs: ["fes", "marrakech", "meknes", "rabat"] } },
    { cle: "envers", titre: "Salam à l'envers", par: 32,
      consigne: "Exactement : MALAS — le mot salam écrit à l'envers, en majuscules.",
      interdits: ["malas"], juge: { type: "exact", valeur: "MALAS", casse: true } },
    { cle: "haiku", titre: "Un haïku de Fès", par: 38,
      consigne: "Exactement trois lignes, rien d'autre, et le mot Fès dans la première.",
      interdits: [], juge: { type: "haiku", mot: "fes", lignes: 3 } },
    { cle: "arabe", titre: "Rien que l'arabe", par: 16,
      consigne: "Une réponse écrite seulement en lettres arabes — aucune lettre latine —, de six mots au plus.",
      interdits: [], juge: { type: "arabe", max: 6 } },
    { cle: "calcul", titre: "Six fois sept", par: 16,
      consigne: "Exactement : 42 — le résultat de six fois sept. Le nombre seul.",
      interdits: ["42"], juge: { type: "exact", valeur: "42" } },
    { cle: "outils", titre: "Trois tirets", par: 42,
      consigne: "Exactement trois lignes, chacune commence par « - » : trois outils qu'un agent IA peut appeler. Rien avant, rien après.",
      interdits: [], juge: { type: "tirets", lignes: 3 } }
  ];
  var CLES = TROUS.map(function (t) { return t.cle; });
  function trou(cle) { for (var i = 0; i < TROUS.length; i++) if (TROUS[i].cle === cle) return TROUS[i]; return null; }
  function numero(cle) { return CLES.indexOf(cle) + 1; }

  // ---- Le prompt -----------------------------------------------------------------------
  // Sa longueur : des caractères (pas des octets), bords retirés.
  function longueur(prompt) { return Array.from(String(prompt == null ? "" : prompt).trim()).length; }
  // Comparer sans casse, sans accents, espaces resserrés — l'arabe replié comme au lawh.
  function plier(s) {
    var x = String(s == null ? "" : s);
    x = x.normalize ? x.normalize("NFD").replace(/[̀-ͯ]/g, "") : x;
    return x.toLowerCase().replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/\s+/g, " ").trim();
  }
  function validerPrompt(cle, prompt) {
    var t = trou(cle);
    if (!t) return { ok: false, erreur: "Ce trou n'existe pas." };
    var n = longueur(prompt);
    if (n < MIN_PROMPT) return { ok: false, erreur: "Écris un prompt d'abord — trois caractères au moins." };
    if (n > MAX_PROMPT) return { ok: false, erreur: "Trois cents caractères au plus : ici, on joue court." };
    var p = plier(prompt);
    for (var i = 0; i < t.interdits.length; i++) {
      if (p.indexOf(plier(t.interdits[i])) >= 0) return { ok: false, erreur: "Le prompt ne peut pas contenir « " + t.interdits[i] + " » : ce serait donner la réponse." };
    }
    return { ok: true, prompt: String(prompt).trim(), longueur: n };
  }

  // ---- Le juge ---------------------------------------------------------------------------
  // Ce que le modèle a dit, débarrassé de l'emballage : blocs de code, espaces.
  function nettoyer(sortie) {
    var s = String(sortie == null ? "" : sortie).replace(/\r/g, "").trim();
    s = s.replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
    return s;
  }
  // Pour un « exactement » : on pardonne les guillemets, le gras et un point final.
  function nu(s) {
    var x = nettoyer(s);
    for (var i = 0; i < 3; i++) x = x.replace(/^(\*\*|["'«»`]\s*)/, "").replace(/(\s*["'«»`]|\*\*)$/, "").trim();
    return x.replace(/\.$/, "").trim();
  }
  function lignes(s) { return nettoyer(s).split("\n").map(function (l) { return l.trim(); }).filter(Boolean); }

  function juger(cle, sortie) {
    var t = trou(cle);
    if (!t) return { reussi: false, raison: "Ce trou n'existe pas." };
    var j = t.juge, s = nettoyer(sortie);
    if (!s) return { reussi: false, raison: "Le modèle n'a rien dit." };
    if (j.type === "exact") {
      var a = nu(s), b = j.valeur;
      var ok = j.casse ? a === b : a.toLowerCase() === b.toLowerCase();
      return ok ? { reussi: true, raison: "C'est exactement ça." } : { reussi: false, raison: "Ce n'est pas exactement « " + b + " » : le modèle a dit autre chose, ou plus." };
    }
    if (j.type === "json-ensemble") {
      var v;
      try { v = JSON.parse(s); } catch (e) { return { reussi: false, raison: "Ce n'est pas un tableau JSON seul." }; }
      if (!Array.isArray(v) || !v.every(function (x) { return typeof x === "string"; })) return { reussi: false, raison: "Ce n'est pas un tableau JSON seul." };
      var vus = v.map(plier).sort(), attendus = j.valeurs.map(plier).sort();
      return vus.length === attendus.length && vus.every(function (x, i) { return x === attendus[i]; })
        ? { reussi: true, raison: "Les quatre villes, en JSON, rien d'autre." }
        : { reussi: false, raison: "Le tableau n'a pas exactement les quatre villes impériales." };
    }
    if (j.type === "haiku") {
      var ls = lignes(s);
      if (ls.length !== j.lignes) return { reussi: false, raison: "Il faut exactement trois lignes." };
      return plier(ls[0]).indexOf(j.mot) >= 0 ? { reussi: true, raison: "Trois lignes, et Fès en tête." } : { reussi: false, raison: "Fès n'est pas dans la première ligne." };
    }
    if (j.type === "arabe") {
      if (/[A-Za-z]/.test(s)) return { reussi: false, raison: "Il reste des lettres latines." };
      if (!/[ء-ي]/.test(s)) return { reussi: false, raison: "Aucune lettre arabe." };
      var mots = s.split(/\s+/).filter(function (m) { return /[ء-ي]/.test(m); });
      return mots.length <= j.max ? { reussi: true, raison: "Rien que l'arabe." } : { reussi: false, raison: "Plus de six mots." };
    }
    if (j.type === "tirets") {
      var lt = lignes(s);
      if (lt.length !== j.lignes) return { reussi: false, raison: "Il faut exactement trois lignes." };
      return lt.every(function (l) { return /^-\s+\S/.test(l); }) ? { reussi: true, raison: "Trois tirets, rien autour." } : { reussi: false, raison: "Chaque ligne doit commencer par « - »." };
    }
    return { reussi: false, raison: "Ce trou n'a pas de juge." };
  }

  // ---- Le score --------------------------------------------------------------------------
  // L'écart au par, comme au golf : « par », « −3 », « +5 ».
  function ecart(n, par) {
    if (n == null) return "";
    var d = n - par;
    return d === 0 ? "par" : (d < 0 ? "−" + (-d) : "+" + d);
  }
  // La Sna3a d'un essai : seulement au premier trou réussi.
  function sna3a(premiere, n, par) { return premiere ? (n <= par ? SNA3A.sousLePar : SNA3A.reussi) : 0; }

  // Ce que la base rend (zawia_qlil_etat), rendu sûr pour l'écran.
  function normaliserEtat(r) {
    if (!r || r.ok === false) return { ok: false, erreur: (r && r.erreur) || "L'établi ne répond pas.", atelier: !!(r && r.atelier) };
    var trous = {};
    TROUS.forEach(function (t) {
      var x = (r.trous && r.trous[t.cle]) || {};
      var tete = Array.isArray(x.tete) ? x.tete.slice(0, 5).map(function (l) {
        return { pseudo: String((l && l.pseudo) || "Un Talib").slice(0, 40), longueur: Math.max(0, Math.floor(Number(l && l.longueur) || 0)), moi: !!(l && l.moi) };
      }).filter(function (l) { return l.longueur > 0; }) : [];
      var moi = Number(x.moi);
      trous[t.cle] = { moi: moi > 0 ? Math.floor(moi) : null, reussis: Math.max(0, Math.floor(Number(x.reussis) || 0)), tete: tete };
    });
    var restant = Number(r.restant);
    return { ok: true, restant: Number.isFinite(restant) ? Math.max(0, Math.min(QUOTA, Math.floor(restant))) : QUOTA, trous: trous };
  }
  // La carte de score : les trous réussis, et la somme des écarts au par.
  function carte(etat) {
    var faits = 0, total = 0;
    if (etat && etat.ok) TROUS.forEach(function (t) { var m = etat.trous[t.cle] && etat.trous[t.cle].moi; if (m) { faits += 1; total += m - t.par; } });
    return { faits: faits, total: faits ? total : null };
  }

  return {
    MIN_PROMPT: MIN_PROMPT, MAX_PROMPT: MAX_PROMPT, MAX_SORTIE: MAX_SORTIE, QUOTA: QUOTA, PLAFOND: PLAFOND,
    SNA3A: SNA3A, VOIE: VOIE, GESTE: GESTE, TROUS: TROUS, CLES: CLES,
    trou: trou, numero: numero, longueur: longueur, plier: plier, validerPrompt: validerPrompt,
    nettoyer: nettoyer, juger: juger, ecart: ecart, sna3a: sna3a, normaliserEtat: normaliserEtat, carte: carte
  };
});
