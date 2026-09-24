// ZAW'IA — le jeu · LA LANGUE : le jeu se joue en français ou en arabe.
//
// v3.1 — la version arabe (15/09/2026). Le français reste la LANGUE SOURCE
// de tout le code : les textes des modules (récit, pages, Ta7addi, PNJ,
// tutoriel…) et de jeu.js ne bougent pas. L'arabe est un DICTIONNAIRE,
// langue-ar.js, indexé par le texte français lui-même — et c'est le DOM qui
// est traduit : au chargement (traduireArbre), puis à chaque texte que le
// jeu écrit (un MutationObserver). Une boîte de dialogue est traduite AVANT
// d'être tapée lettre à lettre (jeu.js appelle `t` dans ouvrirDialogue), pour
// ne pas montrer le français puis l'arabe.
//
// Deux mécanismes, et c'est tout :
//  - une entrée EXACTE : "Entrer" → "دخول" ;
//  - une entrée GABARIT, avec des trous {1}…{9} : "Arb3ine · {1}" →
//    "الأربعين · {1}". Le trou capture ce que le jeu a interpolé (un nombre,
//    un pseudo, un titre) et le passe lui-même par `t` — un titre de page
//    français dans un gabarit ressort donc en arabe.
//
// Ce qui est PUR (testé sous Node) : `t`, les gabarits, la langue courante,
// la normalisation. Le DOM (traduireArbre, observer, activer) ne tourne qu'au
// navigateur.
//
// Trois règles :
//  - jamais une clé technique dans le dictionnaire (sélecteur, classe,
//    chemin) : le texte est la clé, et seul le texte visible est traduit ;
//  - le voile vaut en arabe comme en français — un test lit le dictionnaire ;
//  - une clé absente rend le français, jamais une chaîne vide : la page
//    reste lisible si une traduction manque.
(function (root, factory) {
  "use strict";
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.langue = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var LANGUES = [
    { cle: "fr", nom: "Français", dir: "ltr" },
    { cle: "ar", nom: "العربية", dir: "rtl" }
  ];
  var CLE = "zwj.langue";
  var DICOS = {};        // cle de langue → { exact: {}, gabarits: [ { re, valeur } ] }
  var forcee = null;     // pour les tests : `choisir` sans localStorage

  function normaliser(s) {
    return String(s == null ? "" : s).replace(/[ \t ]+/g, " ").replace(/ *\n */g, "\n").trim();
  }

  function langueValide(l) {
    for (var i = 0; i < LANGUES.length; i++) if (LANGUES[i].cle === l) return true;
    return false;
  }
  function courante() {
    if (forcee) return forcee;
    var l = null;
    try { if (typeof localStorage !== "undefined") l = localStorage.getItem(CLE); } catch (e) { l = null; }
    return langueValide(l) ? l : "fr";
  }
  function choisir(l) {
    if (!langueValide(l)) return false;
    forcee = l;
    try { if (typeof localStorage !== "undefined") localStorage.setItem(CLE, l); } catch (e) { /* navigation privée : la langue tient le temps de la page */ }
    return true;
  }
  function estAr() { return courante() === "ar"; }
  // Bab — y a-t-il quelque chose à traduire dans la langue courante ? L'arabe, ou le
  // vocabulaire d'une maison posé sur le français (dictionnaire « fr »).
  function traduit() { return courante() !== "fr" || !!DICOS.fr; }
  function infos(l) {
    for (var i = 0; i < LANGUES.length; i++) if (LANGUES[i].cle === (l || courante())) return LANGUES[i];
    return LANGUES[0];
  }

  // ---- Le dictionnaire ----------------------------------------------------------------
  function echapper(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function definir(langue, entrees) {
    var d = DICOS[langue] || (DICOS[langue] = { exact: {}, gabarits: [] });
    Object.keys(entrees).forEach(function (cle) {
      var k = normaliser(cle), v = String(entrees[cle]);
      if (/\{\d\}/.test(k)) {
        var src = "^" + echapper(k).replace(/\\\{(\d)\\\}/g, "([\\s\\S]*?)") + "$";   // un trou peut être vide (« présence » + s ou rien)
        d.gabarits.push({ cle: k, re: new RegExp(src), valeur: v, n: (k.match(/\{\d\}/g) || []).length });
      } else {
        d.exact[k] = v;
      }
    });
    // les gabarits les plus longs d'abord : le plus précis gagne
    d.gabarits.sort(function (a, b) { return b.cle.length - a.cle.length; });
  }
  function taille(langue) {
    var d = DICOS[langue];
    return d ? Object.keys(d.exact).length + d.gabarits.length : 0;
  }
  function cles(langue) {
    var d = DICOS[langue];
    if (!d) return [];
    return Object.keys(d.exact).concat(d.gabarits.map(function (g) { return g.cle; }));
  }

  // Traduit un texte dans la langue courante (ou `langue`). Rend le texte
  // tel quel s'il n'y a rien à traduire.
  function t(texte, langue, profondeur) {
    var l = langue || courante();
    if (texte == null) return texte;
    // HRizon — une maison cliente pose son VOCABULAIRE sur le français (dictionnaire
    // « fr », défini par assets/js/zawia-jeu/maison.js) : « Talib » y devient
    // « Nouvel arrivant ». Sans maison, aucun dictionnaire « fr » : le français
    // source passe tel quel, comme toujours.
    if (l === "fr" && !DICOS.fr) return texte;
    var d = DICOS[l];
    if (!d) return texte;
    var k = normaliser(texte);
    if (!k) return texte;
    if (Object.prototype.hasOwnProperty.call(d.exact, k)) return d.exact[k];
    if ((profondeur || 0) > 3) return texte;
    for (var i = 0; i < d.gabarits.length; i++) {
      var g = d.gabarits[i], m = g.re.exec(k);
      if (!m) continue;
      var out = g.valeur;
      for (var j = 1; j <= g.n; j++) {
        var cap = m[j] == null ? "" : m[j];
        out = out.split("{" + j + "}").join(t(cap, l, (profondeur || 0) + 1));
      }
      return out;
    }
    return texte;
  }
  // Un texte est-il traduit (ou traduisible) ? Pour les tests de couverture.
  function couvre(texte, langue) {
    var l = langue || "ar";
    var k = normaliser(texte);
    if (!k) return true;
    return t(k, l) !== k;
  }

  // ---- Le DOM ---------------------------------------------------------------------------
  var INLINE = { STRONG: 1, EM: 1, SPAN: 1, A: 1, CODE: 1, B: 1, I: 1, SMALL: 1, ABBR: 1, KBD: 1, BR: 1, SUP: 1, SUB: 1, MARK: 1 };
  var SAUTER = { SCRIPT: 1, STYLE: 1, CANVAS: 1, SVG: 1, VIDEO: 1, TEMPLATE: 1, NOSCRIPT: 1, TEXTAREA: 1 };
  var ATTRIBUTS = ["placeholder", "title", "aria-label", "alt"];
  var observateur = null, enCours = false;

  // v8.5 — translate="no" (l'attribut du HTML fait pour ça) : ce qu'un MEMBRE a écrit —
  // un pseudo, un message du Kalam, une lettre des Rasa'il — ne se traduit jamais, ni son
  // texte ni ses attributs. Sans lui, un « Merci à toi. Reviens quand tu veux. » tapé par
  // un joueur ressortait en arabe chez l'autre, avec les mots du dictionnaire.
  function protege(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentNode) if (n.getAttribute && n.getAttribute("translate") === "no") return true;
    return false;
  }
  // Un élément « feuille » : que du texte et des balises en ligne. Sa clé est
  // son texte entier — c'est ainsi qu'un paragraphe avec un mot en gras se
  // traduit d'un bloc, dans l'ordre des mots de l'arabe.
  function feuille(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.getAttribute && el.getAttribute("lang") === "ar" && !el.hasAttribute("data-zwj-fr")) return false;   // déjà de l'arabe (les calligraphies)
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 1 && !INLINE[n.tagName]) return false;
      if (n.nodeType === 1 && n.getAttribute("lang") === "ar") return false;   // « Jami3at al Qarawiyine جامعة القرويين » : ligne mixte, mot à mot
      if (n.nodeType === 1 && n.getAttribute("translate") === "no") return false;   // v8.5 — les mots d'un membre : le reste se traduit à part
    }
    return true;
  }
  function traduireAttributs(el) {
    if (protege(el)) return;
    for (var i = 0; i < ATTRIBUTS.length; i++) {
      var a = ATTRIBUTS[i];
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      var v = el.getAttribute(a), tv = t(v);
      if (tv !== v) el.setAttribute(a, tv);
    }
  }
  function traduireTexte(noeud) {
    var v = noeud.nodeValue;
    if (!v || !/\S/.test(v)) return;
    if (noeud.parentNode && protege(noeud.parentNode)) return;
    var k = normaliser(v), tv = t(k);
    if (tv === k) return;
    // on garde les blancs de bord (« Talib », entre deux mots en gras)
    var m = /^(\s*)[\s\S]*?(\s*)$/.exec(v);
    noeud.nodeValue = (m ? m[1] : "") + tv + (m ? m[2] : "");
  }
  function traduireArbre(racine) {
    if (!racine) return;
    if (racine.nodeType === 3) { traduireTexte(racine); return; }
    if (racine.nodeType !== 1) return;
    if (protege(racine)) return;   // v8.5 — les mots d'un membre
    // ⚠️ Un élément « sauté » garde ses ATTRIBUTS traduits : on ne descend pas
    //    dans un <textarea> (son contenu est celui du joueur), mais son
    //    placeholder est de NOUS. Trouvé le 20/09/2026 en posant le fil d'une
    //    affaire : six placeholders du jeu — le daftar du Wird, le prompt du
    //    golf, le Majliss, les deux champs du Souk — n'avaient jamais été
    //    traduits depuis la v3.1, parce que la branche s'arrêtait une ligne trop tôt.
    if (SAUTER[racine.tagName]) { traduireAttributs(racine); return; }
    traduireAttributs(racine);
    if (racine.tagName === "INPUT" && (racine.type === "submit" || racine.type === "button") && racine.value) {
      var tv0 = t(racine.value); if (tv0 !== racine.value) racine.value = tv0;
    }
    if (feuille(racine)) {
      var texte = normaliser(racine.textContent);
      if (!texte || !/[A-Za-zÀ-ÿ]/.test(texte)) return;   // rien de français ici (chiffres, arabe)
      var tv = t(texte);
      if (tv !== texte) {
        if (/<[a-z]/i.test(tv)) racine.innerHTML = tv;      // la valeur porte ses propres balises en ligne
        else if (racine.children.length) racine.textContent = tv;
        else racine.textContent = tv;
        return;
      }
      // pas d'entrée pour le bloc : mot à mot, morceau par morceau
      for (var n = racine.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) traduireTexte(n);
        else if (n.nodeType === 1) { traduireAttributs(n); traduireArbre(n); }
      }
      return;
    }
    for (var c = racine.firstChild; c; c = c.nextSibling) traduireArbre(c);
  }

  function observer(racine) {
    if (typeof MutationObserver === "undefined" || observateur || !racine) return;
    observateur = new MutationObserver(function (mutations) {
      if (enCours) return;
      enCours = true;
      try {
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === "characterData") { var p = m.target.parentNode; if (p && feuille(p)) traduireArbre(p); else traduireTexte(m.target); }
          else if (m.type === "attributes") traduireAttributs(m.target);
          else for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType === 3) { var pp = n.parentNode; if (pp && feuille(pp)) traduireArbre(pp); else traduireTexte(n); }
            else traduireArbre(n);
          }
        }
      } finally { enCours = false; }
    });
    observateur.observe(racine, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRIBUTS });
  }

  // À appeler une fois, au chargement, avant que le jeu n'écrive dans la page.
  function activer(doc) {
    var d = doc || (typeof document !== "undefined" ? document : null);
    if (!d || !d.documentElement) return false;
    var l = courante(), i = infos(l);
    d.documentElement.setAttribute("lang", l);
    d.documentElement.setAttribute("dir", i.dir);
    if (l === "fr" && !DICOS.fr) return false;
    enCours = true;
    try { traduireArbre(d.body); } finally { enCours = false; }
    observer(d.body);
    return true;
  }

  return {
    LANGUES: LANGUES, CLE: CLE,
    courante: courante, choisir: choisir, estAr: estAr, traduit: traduit, infos: infos,
    definir: definir, taille: taille, cles: cles, t: t, couvre: couvre, normaliser: normaliser,
    traduireArbre: traduireArbre, activer: activer, feuille: feuille, protege: protege
  };
});
