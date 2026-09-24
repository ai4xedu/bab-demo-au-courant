// ZAW'IA — le jeu · LE SIRR (السرّ) : les sept traces, le huitième cadre, la Khalwa (v7.6, 21/09/2026) — pur.
//
// ⚠️⚠️ LA SEULE IDÉE À NE PAS PERDRE, et tout le reste en découle :
//
//        ON NE TROUVE PAS LE VOILÉ. ON DEVIENT QUELQU'UN CHEZ QUI IL DESCEND.
//
//    Ce n'est pas une chasse au trésor. Il n'y a aucune énigme à résoudre,
//    aucun indice à décoder, aucune liste à cocher. Les sept traces sont des
//    choses qu'un membre dévoué fait DE TOUTE FAÇON — vendre ce qu'il a étalé,
//    verser à la fontaine, écrire une wasfa, recevoir son M39ol, faire attester
//    un livrable, se mesurer au rihal, rencontrer dix personnes. Le joueur ne
//    les poursuit pas : il les accomplit, et il découvre après coup qu'elles
//    comptaient. C'est le renversement, et c'est la charte prise au mot :
//    « Étale, ne raconte pas. »
//
//    Corollaire, à tenir contre toute tentation : LA LISTE NE S'AFFICHE JAMAIS.
//    Pas de « 3 / 7 », pas de barre, pas d'entrée de menu à son nom, pas un
//    seul point. Un compteur transformerait une révélation en corvée.
//
// LES TROIS COUCHES
//   1. LE HUITIÈME CADRE. Dans la qubba il y a sept toiles — et un cadre vide,
//      qui a toujours été là. Chaque trace accomplie y allume une région de la
//      peinture, comme une lanterne qu'on promène dessus. La huitième toile est
//      LA COUR VUE DU MINARET, DE NUIT : son point de vue à lui. La dernière
//      région allumée est celle du bas, où l'on distingue une silhouette seule
//      près de la fontaine. C'est le joueur. Il a été regardé depuis le début.
//   2. LES INDICES. Ils CONFIRMENT sans expliquer. Ba Driss note qu'on a changé
//      de pas ; Lalla Zhor doute qu'il y ait toujours eu un cadre vide ; le
//      Rafiq s'arrête et regarde le minaret. Aucun ne dit quoi faire.
//   3. LA KHALWA (خلوة), la retraite où le cheikh reçoit seul. Quand la toile
//      se referme, la silhouette du minaret SE TOURNE — pour ce joueur seul.
//      Il n'y a pas de bouton : une question, et c'est LA SIENNE, pas celle de
//      la maison. Le bureau reçoit la demande et fixe la nuit.
//
// ⚠️ LES SEPT SONT PROUVÉES PAR LE SERVEUR (zawia-sirr.sql), jamais par le
//    navigateur : au bout de la piste il y a le temps d'une personne réelle,
//    et une piste qu'on forge le lui volerait. Ce module ne SAIT rien ; il dit
//    quoi montrer de ce que la base a répondu.
// ⚠️ AUCUN POINT, AUCUN RANG : la khalwa n'ouvre rien au barème. Elle donne du
//    temps et une phrase. La charte tient.
// ⚠️ PAS UN NOM, PAS UN LIEN : le voile, comme oumm.js et voile.js.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.sirr = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- Les sept traces : la charte, marchée -----------------------------------------------
  // Une par valeur de zawia-valeurs.html, dans l'ordre des sept murs du Sahn.
  // `preuve` est ce que la base vérifie (zawia-sirr.sql, un test compare les clés).
  // `mot` est le mot que la trace ajoute à la plaque, mais ⚠️ LES MOTS SORTENT
  // DANS L'ORDRE DE LA PHRASE, jamais dans l'ordre où les traces tombent : la
  // phrase se lit de gauche à droite quoi qu'on fasse d'abord (voir `plaque`).
  var TRACES = [
    { cle: "ferracha", valeur: "Ferracha", ar: "فرّاشة",
      quoi: "Une affaire conclue sur ton tapis — quelqu'un a voulu ce que tu as étalé." },
    { cle: "twiza", valeur: "Twiza", ar: "تويزة",
      quoi: "La fontaine pleine une semaine où tu as versé ta goutte." },
    { cle: "silsila", valeur: "Silsila", ar: "سلسلة",
      quoi: "Une wasfa de toi, publiée au Kounnach — ce que tu sais, écrit pour être refait." },
    { cle: "m39ol", valeur: "M39ol", ar: "معقول",
      quoi: "Cent M39ol reçus des autres. Le rang de Mt3ellem." },
    { cle: "nia", valeur: "Nia w Amana", ar: "نية وأمانة",
      quoi: "Un livrable attesté par le bureau — tu as dit vrai sur ce que tu avais fait." },
    { cle: "hchouma", valeur: "Bla hchouma", ar: "بلا حشومة",
      quoi: "Vingt bonnes réponses au rihal, seul et chronométré." },
    { cle: "darija", valeur: "B darija", ar: "بالدارجة",
      quoi: "Dix rencontres au Sahn — dix fois où tu as salué quelqu'un, et qu'on t'a rendu le salam." }
  ];
  function trace(cle) {
    for (var i = 0; i < TRACES.length; i++) if (TRACES[i].cle === cle) return TRACES[i];
    return null;
  }

  // ---- La plaque sous le cadre : sept mots, une phrase -------------------------------------
  // ⚠️ C'est LUI qui parle, et c'est tout ce qu'on saura de ce qu'il cherche.
  // Les mots apparaissent dans l'ordre de la phrase : la n-ième trace, quelle
  // qu'elle soit, allume le n-ième mot. Sans quoi la plaque serait un charabia
  // à trous, et l'ordre de découverte deviendrait un puzzle — ce qu'elle n'est pas.
  var MOTS = ["Je", "regarde", "ce", "qui", "reste", "après", "toi."];
  var MANQUE = "—";
  function plaque(n) {
    var k = Math.max(0, Math.min(MOTS.length, Math.floor(Number(n) || 0)));
    if (k === 0) return "";                      // rien : la plaque est nue, et c'est ce qui intrigue
    var out = [];
    for (var i = 0; i < MOTS.length; i++) out.push(i < k ? MOTS[i] : MANQUE);
    return out.join(" ");
  }
  function phrase() { return MOTS.join(" "); }

  // ---- Le huitième cadre : la lanterne qu'on promène sur la toile --------------------------
  // Sept régions, en fractions de la toile (x, y, rayon). Chaque trace en allume
  // une, dans CET ordre — la dernière est en bas au centre, là où l'on distingue
  // une silhouette seule près de la fontaine. Le joueur se reconnaît en dernier.
  // ⚠️ L'ordre est fixe : ce n'est pas « la trace ferracha allume la région
  //    ferracha », c'est « la n-ième trace allume la n-ième région ».
  // Mesurés sur la toile peinte, pas devinés : chaque halo tombe sur quelque
  // chose qu'on reconnaît, et le dernier sur la fontaine.
  var HALOS = [
    { x: 0.50, y: 0.09, r: 0.30 },   // 1 — le ciel d'indigo et la ligne des toits
    { x: 0.17, y: 0.38, r: 0.30 },   // 2 — la galerie de gauche, ses lanternes
    { x: 0.86, y: 0.40, r: 0.30 },   // 3 — la galerie de droite
    { x: 0.55, y: 0.42, r: 0.28 },   // 4 — les arcades du fond, et la porte éclairée
    { x: 0.10, y: 0.73, r: 0.30 },   // 5 — le parapet, et la lanterne de laiton posée dessus
    { x: 0.85, y: 0.76, r: 0.30 },   // 6 — les orangers du coin
    { x: 0.53, y: 0.70, r: 0.28 }    // 7 — la fontaine, et ce qui se tient à côté
  ];
  var TOILE = "tableau-huitieme.webp";
  // Ce que la carte du cadre dit, selon l'avancement. Trois états, pas plus :
  // on n'annonce jamais un nombre.
  function cartouche(n) {
    var k = Math.max(0, Math.floor(Number(n) || 0));
    if (k === 0) return "Un cadre vide. Il a toujours été là. Personne dans la maison ne sait ce qu'il portait.";
    if (k >= TRACES.length) return "La toile est entière. C'est la cour, vue du minaret, la nuit. Près de la fontaine, quelqu'un est seul.";
    return "Le cadre n'est plus tout à fait vide.";
  }

  // ---- Les indices : ils confirment, ils n'expliquent pas -----------------------------------
  // ⚠️ Aucun ne dit quoi faire, aucun ne compte à voix haute. Un indice qui
  //    expliquerait remplacerait le mystère par une consigne.
  var INDICES = [
    { des: 3, qui: "bawwab", texte: "Je te regarde passer depuis des semaines. Tu as changé de pas. Je ne saurais pas dire en quoi." },
    { des: 4, qui: "zhor", texte: "Il y a un cadre vide à la qubba, tu sais. Depuis toujours. Ces derniers temps, je n'en suis plus si sûre." },
    { des: 5, qui: "omar", texte: "Ne le prends pas mal : je ne t'aurais pas parié dessus au début. Je me suis trompé, et ça me fait plaisir." },
    { des: 6, qui: "warraq", texte: "Quarante ans que je copie. On reconnaît une main à trois lignes. La tienne a pris son pli." }
  ];
  function indice(cle, n) {
    var k = Math.max(0, Math.floor(Number(n) || 0));
    var meilleur = null;
    for (var i = 0; i < INDICES.length; i++) {
      var x = INDICES[i];
      if (x.qui === cle && k >= x.des && (!meilleur || x.des > meilleur.des)) meilleur = x;
    }
    return meilleur ? meilleur.texte : null;
  }
  // À six traces, le Rafiq s'arrête au milieu de la cour et regarde le minaret.
  // Il ne dit rien : c'est un animal, et c'est justement pour ça qu'on le croit.
  var RAFIQ_DES = 6;
  function rafiqRegarde(n) { return (Math.floor(Number(n) || 0)) >= RAFIQ_DES; }

  // ---- La toile se referme ------------------------------------------------------------------
  // Le moment où la septième région s'allume. Une seule fois (recit.sirr.vu).
  var ENTIERE = {
    nom: "",   // personne ne parle : on regarde
    pages: [
      "La dernière lanterne passe sur la toile, et la cour apparaît en entier.",
      "C'est ici. Vue de haut, de nuit, depuis la galerie du minaret. Le zellige, la fontaine, les arcades, les lanternes.",
      "Près de la fontaine, une silhouette seule. De dos. On ne voit pas son visage.",
      "C'est toi.",
      "Quelqu'un était là-haut pendant que tu marchais, et il a peint ce qu'il voyait."
    ]
  };

  // ---- La Khalwa : il se tourne ---------------------------------------------------------------
  // ⚠️ Pas de bouton, pas de menu, pas d'annonce. À son heure, dans la cour, la
  //    silhouette du minaret se tourne — et elle ne se tourne que pour celui-là.
  var APPEL = {
    nom: "",
    pages: [
      "Là-haut, sur la galerie du minaret, la silhouette ne regarde plus la ville.",
      "Elle s'est tournée. Vers la cour. Vers l'endroit exact où tu te tiens.",
      "خلوة.",
      "Viens seul."
    ]
  };
  // Et la question est LA SIENNE. Pas « qu'est-ce que tu veux me demander » —
  // il ne se raconte pas. Ce qu'il veut savoir, c'est où tu bloques.
  var QUESTION = {
    nom: "Le Voilé", titre: "خلوة — la khalwa",
    lead: "Quinze minutes, une nuit, toi et lui. Il ne se montre pas et tu ne verras pas son visage. Avant de fixer la nuit, il pose une question, et c'est la seule.",
    question: "Qu'est-ce que tu ne sais pas faire, et que tu veux savoir faire ?",
    aide: "Réponds en une ou deux phrases, dans la langue que tu veux. Ce n'est pas un formulaire : c'est ce sur quoi les quinze minutes vont porter.",
    envoyer: "Envoyer ma réponse",
    posee: "Ta réponse est partie. La maison te dira la nuit.",
    attente: "Ta demande est posée. La maison te dira la nuit.",
    fixee: "La khalwa est fixée :",
    passee: "Tu as eu ta khalwa. Ce qui s'y est dit ne regarde que vous deux."
  };
  var REPONSE_MIN = 12, REPONSE_MAX = 600;
  function reponseValide(texte) {
    var t = String(texte == null ? "" : texte).trim().replace(/\s+/g, " ");
    if (t.length < REPONSE_MIN) return { ok: false, erreur: "Deux mots ne suffisent pas. Dis où tu bloques." };
    if (t.length > REPONSE_MAX) return { ok: false, erreur: "Plus court : " + REPONSE_MAX + " caractères au plus." };
    return { ok: true, texte: t.slice(0, REPONSE_MAX) };
  }

  // ---- Ce que la base répond, remis d'aplomb -------------------------------------------------
  // { n, traces: ["ferracha", …], khalwa: { etat, quand, note } | null }
  // ⚠️ fail-close : une réponse qu'on ne comprend pas vaut zéro trace, jamais sept.
  var ETATS_KHALWA = ["demandee", "fixee", "tenue"];
  function normaliser(x) {
    var d = x && typeof x === "object" ? x : {};
    var liste = Array.isArray(d.traces) ? d.traces : [];
    var vues = {}, propres = [];
    liste.forEach(function (c) { if (typeof c === "string" && trace(c) && !vues[c]) { vues[c] = true; propres.push(c); } });
    var k = d.khalwa && typeof d.khalwa === "object" && ETATS_KHALWA.indexOf(d.khalwa.etat) !== -1
      ? { etat: d.khalwa.etat, quand: d.khalwa.quand ? String(d.khalwa.quand) : null, note: d.khalwa.note ? String(d.khalwa.note).slice(0, 400) : null }
      : null;
    return { n: propres.length, traces: propres, khalwa: k };
  }
  function entiere(etat) { return normaliser(etat).n >= TRACES.length; }
  // Peut-il demander la khalwa ? La toile entière, et pas de demande en cours.
  function peutDemander(etat) {
    var e = normaliser(etat);
    return e.n >= TRACES.length && !e.khalwa;
  }

  // ---- L'état retenu dans le récit du joueur ---------------------------------------------------
  // { vu: n } — combien de régions le joueur a DÉJÀ vues s'allumer. Sert à savoir
  // quand une trace vient de tomber (pour la lanterne qui passe) et à ne jouer
  // « la toile est entière » qu'une fois. Rien d'autre : la vérité est en base.
  function normaliserEtat(x) {
    var e = x && typeof x === "object" ? x : {};
    var vu = Math.max(0, Math.min(TRACES.length, Math.floor(Number(e.vu) || 0)));
    return { vu: vu };
  }
  // Ce qui vient de s'allumer depuis la dernière visite : [index, …] (0-based).
  function nouvelles(etat, n) {
    var vu = normaliserEtat(etat).vu;
    var k = Math.max(0, Math.min(TRACES.length, Math.floor(Number(n) || 0)));
    var out = [];
    for (var i = vu; i < k; i++) out.push(i);
    return out;
  }
  function marquerVu(etat, n) {
    var k = Math.max(0, Math.min(TRACES.length, Math.floor(Number(n) || 0)));
    return { vu: Math.max(normaliserEtat(etat).vu, k) };
  }

  // La page du carnet — et elle ne compte pas. Elle dit ce qu'on a vu, pas ce qui reste.
  function carnet(etat) {
    var e = normaliser(etat);
    if (e.khalwa && e.khalwa.etat === "tenue") return "Le huitième cadre\n" + phrase() + "\n" + QUESTION.passee;
    if (e.khalwa) return "Le huitième cadre\n" + phrase() + "\n" + (e.khalwa.etat === "fixee" && e.khalwa.quand ? QUESTION.fixee + " " + e.khalwa.quand : QUESTION.attente);
    if (e.n >= TRACES.length) return "Le huitième cadre\n" + phrase() + "\nLa toile est entière.";
    if (e.n === 0) return null;
    return "Le huitième cadre\n" + plaque(e.n);
  }

  return {
    TRACES: TRACES, MOTS: MOTS, MANQUE: MANQUE, HALOS: HALOS, TOILE: TOILE,
    INDICES: INDICES, RAFIQ_DES: RAFIQ_DES, ENTIERE: ENTIERE, APPEL: APPEL, QUESTION: QUESTION,
    ETATS_KHALWA: ETATS_KHALWA, REPONSE_MIN: REPONSE_MIN, REPONSE_MAX: REPONSE_MAX,
    trace: trace, plaque: plaque, phrase: phrase, cartouche: cartouche,
    indice: indice, rafiqRegarde: rafiqRegarde, reponseValide: reponseValide,
    normaliser: normaliser, entiere: entiere, peutDemander: peutDemander,
    normaliserEtat: normaliserEtat, nouvelles: nouvelles, marquerVu: marquerVu, carnet: carnet
  };
});
