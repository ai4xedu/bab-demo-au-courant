// ZAW'IA — le jeu · LE KOUNNACH (الكنّاش) : ce que la Sna3a ouvre (pur).
//
// Le kounnach est le carnet du m3ellem — le registre où s'écrivent les
// recettes de l'atelier. Ici il tient des WASFAT (وصفة, la formule toute
// prête) : des tutoriels écrits de bout en bout, qu'on refait chez soi, et que
// la Sna3a ouvre niveau par niveau — Mbtadi, Sani3, 7adeq, Mtqen. C'est la
// boucle du jeu dite en une phrase : plus tes mains savent faire, plus la
// maison te montre. Et le membre qui écrit une wasfa reçoit du M39ol — la
// ligne de la charte (« écrire une notice réutilisable »), donnée par le
// bureau, jamais par lui-même.
//
// CE MODULE NE GARDE RIEN. La clé du jeu est publique : le corps d'une wasfa
// ne descend vers le navigateur que si la BASE le rend (zawia_wasfa, qui
// compte le niveau elle-même). Ici : les niveaux, la forme d'une ligne, ce
// qu'on dit à l'établi, la validation d'une proposition, et le rendu du
// markdown — SÛR : tout est échappé, seul https fait un lien, aucune balise
// de l'auteur ne passe. Testable sous Node tel quel.
//
// ⚠️ AUCUNE WASFA, AUCUN LIEN, AUCUN NOM ICI (le voile) : les wasfat vivent en
//    base, posées par la console — jamais dans un fichier servi.
// ⚠️ Les seuils sont ceux de regles.js (SNA3A_NIVEAUX) et du SQL
//    (zawia-kounnach.sql) : un test compare les trois.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.kounnach = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- Les niveaux — copie de regles.js, un test l'exige égale ---------------------
  var NIVEAUX = [
    { cle: "mbtadi", nom: "Mbtadi", ar: "مبتدي", sous: "Il commence",    seuil: 0 },
    { cle: "sani3",  nom: "Sani3",  ar: "صانع",  sous: "Il fabrique",    seuil: 30 },
    { cle: "hadeq",  nom: "7adeq",  ar: "حاذق",  sous: "Il a la main",   seuil: 70 },
    { cle: "mtqen",  nom: "Mtqen",  ar: "متقن",  sous: "Le geste juste", seuil: 160 }
  ];
  var VOIES = ["prompt", "image", "savoir"];
  var ETATS = ["proposee", "publiee", "refusee"];
  // Les mêmes nombres dans zawia-kounnach.sql — un test compare.
  var LIMITES = { titre: 120, resume: 220, corps: 30000, lien: 500, enAttente: 5 };
  // La ligne de la charte : « Écrire une notice réutilisable : tuto, jeu de
  // données darija, post-mortem d'échec — +80 ». Crédité par le bureau à la
  // publication, une fois. Un test la lit dans zawia-valeurs.html.
  var M39OL_WASFA = 80;

  function niveau(cle) {
    for (var i = 0; i < NIVEAUX.length; i++) if (NIVEAUX[i].cle === cle) return NIVEAUX[i];
    return null;
  }
  function rangNiveau(cle) {
    for (var i = 0; i < NIVEAUX.length; i++) if (NIVEAUX[i].cle === cle) return i;
    return -1;
  }
  function entier(n) {
    var v = typeof n === "number" ? n : parseInt(n, 10);
    return isNaN(v) || v < 0 ? 0 : Math.floor(v);
  }
  function niveauPour(total) {
    var n = entier(total), niv = NIVEAUX[0];
    for (var i = 0; i < NIVEAUX.length; i++) if (n >= NIVEAUX[i].seuil) niv = NIVEAUX[i];
    return niv;
  }
  // Ce qui manque de Sna3a pour lire une wasfa — 0 si le niveau y est.
  function manque(w, total) {
    var niv = niveau(w && w.niveau);
    if (!niv) return 0;
    return Math.max(0, niv.seuil - entier(total));
  }

  // ---- Les liens et les textes -------------------------------------------------------
  function lienSur(url) {
    if (typeof url !== "string") return false;
    var u = url.trim();
    if (!/^https:\/\/[^\s<>"']+$/i.test(u)) return false;
    return u.length <= LIMITES.lien;
  }
  function nettoyer(t, max) {
    if (typeof t !== "string") return "";
    return t.replace(/\s+/g, " ").trim().slice(0, max || 160);
  }

  // ---- Les lignes que la base rend (zawia_kounnach) ----------------------------------
  // Jamais un corps ici : la liste dit ce qui existe et ce qui est ouvert ; le
  // corps se demande à part, et c'est la base qui décide de le rendre.
  function normaliser(lignes) {
    if (!Array.isArray(lignes)) return [];
    var out = [];
    lignes.forEach(function (l, i) {
      if (!l || typeof l !== "object") return;
      var titre = nettoyer(l.titre, LIMITES.titre);
      var niv = niveau(l.niveau);
      if (!titre || !niv) return;
      var plTitre = nettoyer(l.plus_loin_titre, 90);
      out.push({
        id: typeof l.id === "string" && l.id ? l.id : String(i),
        titre: titre,
        resume: nettoyer(l.resume, LIMITES.resume),
        voie: VOIES.indexOf(l.voie) >= 0 ? l.voie : "prompt",
        niveau: niv.cle,
        auteur: nettoyer(l.auteur, 40) || null,
        mienne: !!l.mienne,
        etat: ETATS.indexOf(l.etat) >= 0 ? l.etat : "publiee",
        note: nettoyer(l.note_bureau != null ? l.note_bureau : l.note, 400) || null,
        servi: entier(l.servi),
        accessible: !!l.accessible,
        plusLoin: (plTitre && lienSur(l.plus_loin_lien)) ? { titre: plTitre, lien: l.plus_loin_lien.trim() } : null,
        ordre: typeof l.ordre === "number" ? l.ordre : 0,
        langue: l.langue === "ar" ? "ar" : "fr"
      });
    });
    out.sort(function (a, b) {
      return (rangNiveau(a.niveau) - rangNiveau(b.niveau)) || (a.ordre - b.ordre) || a.titre.localeCompare(b.titre, "fr");
    });
    return out;
  }

  // Ce que la salle montre. `total` : la Sna3a du joueur ; `lues` : les ids déjà
  // lus (recit.kounnach.lues) — pour dire laquelle attend.
  function etat(lignes, total, lues) {
    var wasfat = normaliser(lignes), vu = lues && typeof lues === "object" ? lues : {};
    // Le drapeau du serveur date de la dernière lecture de la liste ; le
    // niveau, lui, vient d'être gagné à l'établi. Une wasfa listée n'a plus
    // que le niveau à franchir (un libre ne reçoit que les lignes ouvertes).
    wasfat.forEach(function (w) { if (!w.accessible && w.etat === "publiee" && manque(w, total) === 0) w.accessible = true; });
    var publiees = wasfat.filter(function (w) { return w.etat === "publiee"; });
    var ouvertes = publiees.filter(function (w) { return w.accessible; });
    var prochaine = null, aLire = null;
    for (var i = 0; i < publiees.length; i++) {
      var w = publiees[i];
      if (!w.accessible && !prochaine) prochaine = { id: w.id, titre: w.titre, niveau: w.niveau, manque: manque(w, total) };
      if (w.accessible && !aLire && vu[w.id] !== true) aLire = w;
    }
    return {
      wasfat: wasfat,
      publiees: publiees.length,
      ouvertes: ouvertes.length,
      total: publiees.length,
      prochaine: prochaine,
      aLire: aLire,
      miennes: wasfat.filter(function (w) { return w.mienne; })
    };
  }

  // ---- L'annonce à l'établi ------------------------------------------------------------
  // Après un Ta7addi : le niveau franchi dit ce qui s'ouvre ; sinon ce qui
  // manque pour la prochaine. C'est la boucle demandée : le point mène à la
  // wasfa. Rien à dire tant que le Kounnach est vide.
  function annonce(avant, apres, lignes) {
    var e = etat(lignes, apres, {});
    if (!e.publiees) return "";
    var na = niveauPour(avant), np = niveauPour(apres);
    var ra = rangNiveau(na.cle), rp = rangNiveau(np.cle);
    var suite = e.prochaine
      ? "Encore " + e.prochaine.manque + " pour " + niveau(e.prochaine.niveau).nom + ", qui ouvre « " + e.prochaine.titre + " »."
      : "Le Kounnach t'est ouvert en entier.";
    if (rp <= ra) return suite;
    var ouvertes = e.wasfat.filter(function (w) {
      var r = rangNiveau(w.niveau);
      return w.etat === "publiee" && r > ra && r <= rp;
    });
    var tete = "Ta Sna3a passe " + np.nom + ".";
    if (!ouvertes.length) return tete + " " + suite;
    var titres = ouvertes.map(function (w) { return "« " + w.titre + " »"; });
    return tete + " " + (titres.length === 1 ? titres[0] + " s'ouvre au Kounnach." : titres.join(", ") + " s'ouvrent au Kounnach.");
  }

  // ---- Proposer une wasfa ------------------------------------------------------------
  // La base redit la même règle (zawia_wasfa_proposer) ; ici on refuse avant
  // l'aller-retour, avec la phrase que le joueur lira.
  function validerProposition(v) {
    v = v || {};
    var titre = nettoyer(v.titre, LIMITES.titre);
    if (!titre) return { ok: false, erreur: "Un titre, d'abord." };
    var resume = nettoyer(v.resume, LIMITES.resume);
    if (!resume) return { ok: false, erreur: "Un résumé d'une phrase : ce que ça règle." };
    if (VOIES.indexOf(v.voie) < 0) return { ok: false, erreur: "La voie : dire juste, voir juste ou vérifier juste." };
    var corps = typeof v.corps === "string" ? v.corps.replace(/\r\n?/g, "\n").trim() : "";
    if (!corps) return { ok: false, erreur: "Le corps de la wasfa — c'est elle qu'on lit." };
    if (corps.length > LIMITES.corps) return { ok: false, erreur: "Trente mille caractères au plus." };
    var lien = typeof v.lien === "string" ? v.lien.trim() : "";
    if (lien && !lienSur(lien)) return { ok: false, erreur: "Un lien commence par https:// — ou reste vide." };
    return { ok: true, valeurs: { titre: titre, resume: resume, voie: v.voie, corps: corps, lien: lien || null } };
  }

  // ---- Le rendu du markdown, sûr -------------------------------------------------------
  // Un sous-ensemble, et rien d'autre : titres (# ## ###), paragraphes, listes
  // (- et 1.), blocs ``` avec leur langue, `code`, **gras**, *italique*,
  // > citation, [texte](https://…). Tout est échappé AVANT d'être lu ; un lien
  // qui n'est pas https reste du texte ; un bloc de code n'est jamais relu.
  function echapper(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c];
    });
  }
  function enLigne(t) {
    var parts = t.split("`");
    if (parts.length % 2 === 0) {            // un accent grave orphelin : du texte
      var dernier = parts.pop();
      parts[parts.length - 1] += "`" + dernier;
    }
    return parts.map(function (p, k) {
      if (k % 2 === 1) return "<code>" + p + "</code>";
      return p
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>")
        .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, txt, url) {
          if (!lienSur(url) || url.indexOf("&quot;") >= 0) return txt;
          return '<a href="' + url + '" rel="noopener noreferrer" target="_blank">' + txt + '</a>';
        });
    }).join("");
  }
  function rendre(md) {
    if (typeof md !== "string" || !md.trim()) return "";
    var lignes = echapper(md.replace(/\r\n?/g, "\n")).split("\n");
    var html = [], para = [], liste = null, cite = [], code = null, langue = "";

    function viderPara() { if (para.length) { html.push("<p>" + enLigne(para.join(" ")) + "</p>"); para = []; } }
    function viderListe() { if (liste) { html.push("<" + liste.type + ">" + liste.items.map(function (i) { return "<li>" + enLigne(i) + "</li>"; }).join("") + "</" + liste.type + ">"); liste = null; } }
    function viderCite() { if (cite.length) { html.push("<blockquote><p>" + enLigne(cite.join(" ")) + "</p></blockquote>"); cite = []; } }
    function viderCode() { if (code !== null) { html.push('<pre class="zj-wasfa__code" data-langue="' + langue + '"><code>' + code.join("\n") + "</code></pre>"); code = null; langue = ""; } }
    function toutVider() { viderPara(); viderListe(); viderCite(); }

    for (var i = 0; i < lignes.length; i++) {
      var l = lignes[i], m;
      if (code !== null) {
        if (/^```\s*$/.test(l)) viderCode(); else code.push(l);
        continue;
      }
      if ((m = l.match(/^```\s*([a-z0-9-]{0,16})\s*$/i))) { toutVider(); code = []; langue = (m[1] || "").toLowerCase(); continue; }
      if ((m = l.match(/^(#{1,3})\s+(.+?)\s*$/))) { toutVider(); var h = m[1].length + 2; html.push("<h" + h + ">" + enLigne(m[2]) + "</h" + h + ">"); continue; }
      if ((m = l.match(/^&gt;\s?(.*)$/))) { viderPara(); viderListe(); if (m[1].trim()) cite.push(m[1].trim()); continue; }
      if ((m = l.match(/^\s*[-*]\s+(.+)$/))) { viderPara(); viderCite(); if (!liste || liste.type !== "ul") { viderListe(); liste = { type: "ul", items: [] }; } liste.items.push(m[1].trim()); continue; }
      if ((m = l.match(/^\s*\d+[.)]\s+(.+)$/))) { viderPara(); viderCite(); if (!liste || liste.type !== "ol") { viderListe(); liste = { type: "ol", items: [] }; } liste.items.push(m[1].trim()); continue; }
      if (!l.trim()) { toutVider(); continue; }
      viderListe(); viderCite();
      para.push(l.trim());
    }
    toutVider(); viderCode();   // un bloc jamais fermé se ferme tout seul
    return html.join("");
  }

  return {
    NIVEAUX: NIVEAUX, VOIES: VOIES, ETATS: ETATS, LIMITES: LIMITES, M39OL_WASFA: M39OL_WASFA,
    niveau: niveau, rangNiveau: rangNiveau, niveauPour: niveauPour, manque: manque,
    lienSur: lienSur, normaliser: normaliser, etat: etat, annonce: annonce,
    validerProposition: validerProposition, rendre: rendre
  };
});
