// ZAW'IA — le jeu · LA FERRACHA ET LE SOUK (السوق) : pur, ni DOM ni réseau.
//
// Le ferrach est celui qui étale ses biens à même le sol, sans boutique et
// sans enseigne. Il ne raconte pas : il pose, et on voit. C'est la première
// valeur de la charte, et c'est pour ça que ce module demande « ce que ça
// règle » plutôt que « décris ton produit » — on répond par un service rendu.
//
// ⚠️ LA PLACE DU SOUK EST UNE DÉCISION, PAS UN DÉTAIL. La cinquième motivation
//    du jeu (recit.js) dit que l'annonce est une CONSÉQUENCE, jamais un but :
//    « au Souk, dehors des murs, jamais au-dessus d'une tête ni dans une
//    halqa ». D'où l'entrée dans le jeu : on SORT par le Bab. Le Souk n'est
//    pas une bannière au-dessus de la cour, c'est un endroit où l'on va.
//
// ⚠️ UNE SEULE FERRACHA (v3.7, 15/09/2026, décision de Youssef). Ce que le
//    Souk montre est LA TABLE DES FERRACHAS DU SITE, lue et écrite par la
//    fonction Netlify zawia-souk.js sur la même origine. Poser ici = poser
//    sur sa ferracha du site ; retirer ici = retirer là-bas. La table
//    zawia_ferracha du projet du jeu ne sert plus.
//
// ⚠️ CE MODULE NE GARDE RIEN. C'est la fonction qui décide : un dossier
//    accepté a SA ferracha du site ; v4.3 (17/09/2026, demande de Youssef),
//    un joueur sans dossier étale aussi — son tapis vit dans la même table
//    du CRM, rattaché à son compte de jeu (`voie: "joueur"`), et devient sa
//    ferracha du site le jour où un dossier accepté porte le même e-mail. Ici on ne
//    fait que DIRE pourquoi une porte est fermée, et vérifier avant d'envoyer
//    ce que la fonction revérifiera. Les chiffres (coupes, plafond) sont ceux
//    de la ferracha du site — un test compare avec zawia-ferracha.js.
//
// v8.7 — LE DERB T-TADAMOUN (24/09/2026) : une ligne de la ferracha peut être un
//    PROJET SOLIDAIRE plutôt qu'un produit (`derb = 'tadamoun'` — tadamoun.js dit
//    ses formes, ses stades, ses besoins). `etat()` range ces projets À PART
//    (`derb` sur chaque tapis) : tout ce qui lit `produits` — la vitrine, la
//    Safqa, les paquets de la Rahba — ne voit que le Souk, comme avant.
(function (root, factory) {
  "use strict";
  var Tm = (typeof module === "object" && module.exports) ? require("./tadamoun.js") : (root.ZWJ && root.ZWJ.tadamoun);
  var api = factory(Tm);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.souk = api;
})(typeof window !== "undefined" ? window : globalThis, function (Tm) {
  "use strict";
  if (!Tm || typeof Tm.ligne !== "function") throw new Error("souk.js : charger tadamoun.js avant.");

  // Les MÊMES chiffres que la ferracha du site (zawia-ferracha.js).
  var MAX_PROJETS = 40;
  var NOM_MAX = 48;
  var RESOUT_MAX = 110;
  var LIEN_MAX = 300;
  // v4.4 — la fiche. Les MÊMES coupes que zawia-souk.js (un test compare).
  var ACCROCHE_MAX = 80;
  var POUR_QUI_MAX = 110;
  var DESCRIPTION_MAX = 600;
  // LA FICHE SE SUFFIT (20/09/2026, Youssef : « tout doit rester dans la zawia
  // pour que la transaction se passe dans la zawia »). Le corps est du markdown,
  // rendu par kounnach.js — le rendu SÛR : tout échappé d'abord, liens https
  // seuls, aucune balise de l'auteur ne passe. Les MÊMES coupes que
  // zawia-souk.js (un test compare).
  var CORPS_MAX = 3000;
  var LIVRE_MAX = 200;
  var DELAI_MAX = 60;
  var FAQ_MAX = 5;
  // LA GALERIE (20/09/2026, tranche B) : des images que le MARCHAND pose
  // lui-même, dans le seau `zawia-souk` du projet du jeu. On ne garde que le
  // CHEMIN — l'adresse se compose dans la page, avec l'URL que la page connaît
  // déjà : aucun domaine n'entre dans ce module (le voile, et la règle du
  // Riwaq). Forme : `<compte de jeu>/<uuid>.<ext>` ; ⚠️ c'est zawia-souk.js
  // qui refuse un chemin dont le premier dossier n'est pas le compte VÉRIFIÉ
  // de l'envoyeur, et la policy du seau qui le refuse une deuxième fois.
  var GALERIE_MAX = 6;
  var FAQ_Q_MAX = 120;
  var FAQ_R_MAX = 400;
  // Une image de la vitrine est servie par la maison, et seulement elle.
  var IMAGE = /^\/assets\/img\/zawia\/souk\/[a-z0-9-]{1,60}\.(webp|jpg|png)(\?v=\d{1,4})?$/;
  function imageSure(chemin) { return typeof chemin === "string" && IMAGE.test(chemin); }
  // Un chemin de galerie : deux identifiants et une extension, rien d'autre —
  // ni « .. », ni barre de tête, ni requête, ni domaine.
  var CHEMIN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpe?g|png)$/i;
  function cheminSur(c) { return typeof c === "string" && CHEMIN.test(c); }
  // Six au plus, sans doublon, l'ordre du marchand respecté.
  function galerie(v) {
    var out = [];
    (Array.isArray(v) ? v : []).forEach(function (c) {
      if (out.length >= GALERIE_MAX || !cheminSur(c) || out.indexOf(c) >= 0) return;
      out.push(c);
    });
    return out;
  }

  // ---- L'affiche d'un produit sans image --------------------------------------------------
  // Une teinte et une lettre tirées du NOM, toujours les mêmes (jamais le hasard :
  // deux joueurs voient le même Souk). Les couleurs sont celles de la maison.
  var TEINTES = [
    ["#1f4d45", "#d9b45b"], ["#7a3b24", "#f1d7a8"], ["#2c3d6b", "#e6c47a"], ["#5b2e4f", "#f0c9a0"],
    ["#3d5a2a", "#e9d38c"], ["#8a5a1c", "#fbe7bd"], ["#244a5f", "#9fd3c7"], ["#4a2a1f", "#e0a458"]
  ];
  function hache(t) {
    var h = 2166136261;
    t = String(t || "");
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function affiche(nom) {
    var n = nettoyer(nom, NOM_MAX);
    var lettre = (n.match(/[\p{L}\p{N}]/u) || ["·"])[0].toUpperCase();
    var t = TEINTES[hache(n) % TEINTES.length];
    return { lettre: lettre, fond: t[0], encre: t[1] };
  }

  // ---- Les liens ---------------------------------------------------------------------
  // Écrits par les joueurs, donc traités comme tels : https seul à l'écran.
  // Ni javascript:, ni data:, ni un chemin relatif qui pointerait ailleurs.
  function lienSur(url) {
    if (typeof url !== "string") return false;
    var u = url.trim();
    if (!/^https:\/\/[^\s<>"']+$/i.test(u)) return false;
    return u.length <= LIEN_MAX;
  }

  function nettoyer(t, max) {
    if (typeof t !== "string") return "";
    return t.replace(/\s+/g, " ").trim().slice(0, max || 160);
  }

  // ---- Le droit d'étaler --------------------------------------------------------------
  // `moi` vient de la fonction : { membre, projets, max, raison }. Membre =
  // dossier accepté. Le refus DIT POURQUOI et ORIENTE — c'est la troisième
  // porte de la maison : la fiche, sur le site.
  var FERME = {
    "atelier": "En mode atelier, le Souk est fermé.",
    "pas-de-dossier": "Ta ferracha est celle de ta fiche de membre. Dépose-la sur le site de la maison : ton tapis s'étalera ici comme là-bas.",
    "pas-fondateur": "Ta fiche est bien arrivée. Quand la maison l'aura acceptée, ton tapis s'ouvrira ici.",
    "pas-de-personnage": "Le Souk ne trouve pas ton personnage. Entre à nouveau dans la cour, puis reviens.",
    "jeton": "Le Souk ne t'a pas reconnu. Entre à nouveau, puis reviens.",
    "jeu-non-configure": "Le Souk n'est pas encore branché sur la maison.",
    "panne": "Le Souk n'a pas répondu. Réessaie dans un instant."
  };
  function ferme(raison) {
    var r = FERME[raison] ? raison : "panne";
    return { raison: r, texte: FERME[r], fiche: r === "pas-de-dossier" };
  }

  function peutEtaler(moi, combien) {
    if (!moi || !moi.membre) {
      var f = ferme(moi && moi.raison);
      return { oui: false, raison: f.raison, texte: f.texte, fiche: f.fiche };
    }
    var max = Number(moi.max) > 0 ? Math.floor(Number(moi.max)) : MAX_PROJETS;
    if ((combien || 0) >= max) {
      return { oui: false, raison: "plein", texte: "Ta ferracha est pleine. Retire un produit pour en poser un autre." };
    }
    return { oui: true, raison: null, texte: "" };
  }

  // La FAQ : au plus cinq paires, chacune une question ET une réponse. Une
  // paire boiteuse est jetée en silence — on ne montre pas une question sans
  // réponse sur un tapis.
  function faq(v) {
    var out = [];
    (Array.isArray(v) ? v : []).forEach(function (e) {
      if (out.length >= FAQ_MAX || !e || typeof e !== "object") return;
      var q = nettoyer(e.q, FAQ_Q_MAX), r = nettoyer(e.r, FAQ_R_MAX);
      if (q && r) out.push({ q: q, r: r });
    });
    return out;
  }
  // Le corps garde ses retours à la ligne (c'est du markdown) : on normalise
  // les fins de ligne et on borne, rien d'autre.
  function corpsPropre(v) {
    return typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim().slice(0, CORPS_MAX) : "";
  }

  // ---- Ce qu'on envoie ----------------------------------------------------------------
  function valider(champs) {
    champs = champs || {};
    var nom = nettoyer(champs.nom, NOM_MAX);
    var resout = nettoyer(champs.resout, RESOUT_MAX);
    var lien = typeof champs.lien === "string" ? champs.lien.trim() : "";
    // Un domaine nu (« mon-outil.ma ») veut dire le site en https : on pose le
    // préfixe « https:// » devant ce qui n'a pas de schéma et ressemble à un
    // domaine. Un http:// explicite reste refusé — on ne promet pas à sa
    // place qu'un site répond en https.
    if (lien && !/^[a-z][a-z0-9+.-]*:/i.test(lien) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(lien)) lien = "https://" + lien;
    if (!nom) return { ok: false, texte: Tm.derbDe(champs.derb) === "tadamoun" ? "Un projet a un nom." : "Un produit a un nom." };
    if (lien && !lienSur(lien)) {
      return { ok: false, texte: "Un lien commence par https:// et ne contient pas d'espace." };
    }
    var valeur = { nom: nom, resout: resout || null, lien: lien || null };
    // v4.4 — la fiche, facultative. Une description garde ses retours à la ligne.
    if (typeof champs.accroche === "string") valeur.accroche = nettoyer(champs.accroche, ACCROCHE_MAX);
    if (typeof champs.pourQui === "string") valeur.pourQui = nettoyer(champs.pourQui, POUR_QUI_MAX);
    if (typeof champs.description === "string") {
      valeur.description = champs.description.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, DESCRIPTION_MAX);
    }
    // La fiche qui se suffit — chacun facultatif, aucun ne bloque un envoi.
    if (typeof champs.corps === "string") valeur.corps = corpsPropre(champs.corps);
    if (typeof champs.livre === "string") valeur.livre = nettoyer(champs.livre, LIVRE_MAX);
    if (typeof champs.delai === "string") valeur.delai = nettoyer(champs.delai, DELAI_MAX);
    if (champs.faq !== undefined) valeur.faq = faq(champs.faq);
    if (champs.galerie !== undefined) valeur.galerie = galerie(champs.galerie);
    // v8.7 — le Derb : un projet solidaire dit sa forme (tadamoun.js le vérifie)
    if (champs.derb !== undefined) {
      var d = Tm.valider(champs);
      if (!d.ok) return { ok: false, texte: d.texte };
      valeur.derb = d.valeur.derb; valeur.forme = d.valeur.forme; valeur.stade = d.valeur.stade;
      valeur.impact = d.valeur.impact; valeur.besoins = d.valeur.besoins;
    }
    return { ok: true, valeur: valeur };
  }

  // ---- Ce que la salle montre ----------------------------------------------------------
  // Un produit tel qu'il s'affiche : renettoyé, images et lien revérifiés.
  function produit(p) {
    p = p || {};
    var out = {
      nom: nettoyer(p.nom, NOM_MAX),
      resout: nettoyer(p.resout, RESOUT_MAX),
      accroche: nettoyer(p.accroche, ACCROCHE_MAX),
      pourQui: nettoyer(p.pourQui, POUR_QUI_MAX),
      description: typeof p.description === "string" ? p.description.trim().slice(0, DESCRIPTION_MAX) : "",
      corps: corpsPropre(p.corps),
      livre: nettoyer(p.livre, LIVRE_MAX),
      delai: nettoyer(p.delai, DELAI_MAX),
      faq: faq(p.faq),
      galerie: galerie(p.galerie),
      type: nettoyer(p.type, 40),
      maturite: nettoyer(p.maturite, 40),
      affiche: imageSure(p.affiche) ? p.affiche : null,
      capture: imageSure(p.capture) ? p.capture : null,
      lien: lienSur(p.lien) ? p.lien.trim() : null
    };
    // v8.7 — le Derb : sa forme, où il en est, ce qu'il change, ce dont il a besoin
    var d = Tm.projet(p);
    out.derb = d.derb;
    if (d.derb === "tadamoun") { out.forme = d.forme; out.stade = d.stade; out.impact = d.impact; out.besoins = d.besoins; }
    if (p.id != null) out.id = String(p.id);
    if (p.visible === false) out.visible = false;
    return out;
  }

  // La fonction rend les tapis déjà rangés par membre : { nom, rang, slug,
  // projets[] }. On renettoie ce qui s'affiche — les liens surtout : un lien
  // en http posé sur le site ne devient pas cliquable ici par surprise.
  function etat(tapis) {
    var propres = [];
    (Array.isArray(tapis) ? tapis : []).forEach(function (t) {
      if (!t || !t.nom || !Array.isArray(t.projets)) return;
      var tous = t.projets.filter(function (p) { return p && p.nom; }).map(produit);
      // v8.7 — les projets du Derb à part : la vitrine, la Safqa et les paquets ne voient que le Souk
      var produits = tous.filter(function (p) { return p.derb !== "tadamoun"; });
      var derb = tous.filter(function (p) { return p.derb === "tadamoun"; });
      // v5.7b — un tapis VIDE reste sur la place : un fondateur a sa place même sans
      // produit (Youssef, 19/09/2026 : « tout le monde qui a apply y soit »). La place
      // le dit (« Rien d'étalé encore »). `discret` : sans la case du mur — dans le jeu
      // seulement, la fonction ne le rend qu'aux joueurs identifiés.
      propres.push({
        vide: produits.length === 0 && derb.length === 0,
        discret: t.discret === true,
        moi: t.moi === true,
        nom: nettoyer(t.nom, 60),
        rang: typeof t.rang === "string" ? t.rang : "",
        slug: typeof t.slug === "string" && /^[a-z0-9-]{1,48}$/.test(t.slug) ? t.slug : null,
        // v5.7 — le compte de JEU du marchand (un id Auth, déjà public dans la cour par
        // le Sahn ouvert) : la Rahba lui propose une affaire. Absent, le tapis se
        // regarde, il ne se marchande pas dans le jeu.
        joueur: typeof t.joueur === "string" && /^[0-9a-z-]{1,64}$/i.test(t.joueur) ? t.joueur : null,
        produits: produits,
        derb: derb
      });
    });
    var combien = 0, projets = 0;
    propres.forEach(function (t) { combien += t.produits.length; projets += t.derb.length; });
    return { tapis: propres, marchands: propres.length, produits: combien, projets: projets, vide: propres.length === 0 };
  }

  // 23/09/2026 — L'ORDRE DE LA VITRINE (le panneau du Souk, pas la place). La liste
  // suivait les numéros du mur : le tapis le plus garni du Souk — le seul avec des
  // affiches, le soir de l'ouverture — venait EN DERNIER, dix-septième, après huit
  // tapis vides. Règle neutre, la même pour tous : les tapis garnis d'abord (ceux
  // dont les produits se montrent en image, puis ceux qui ont le plus de produits),
  // à égalité l'ordre du mur ; les tapis vides ensuite. Rend des INDICES dans
  // `etat(...).tapis` : chaque case garde son numéro, les clics ne bougent pas.
  // ⚠️ La Rahba, elle, garde ses places (le nº k à la place k, pour tous).
  function aUneImage(p) { return !!(p && (p.affiche || p.capture || (p.galerie && p.galerie.length))); }
  // v8.7 — un tapis sans produit mais avec un projet au Derb vient entre les deux : il n'est
  // pas vide (son projet est dans la ruelle), il n'a rien à montrer ici.
  function ordreVitrine(tapis) {
    var liste = Array.isArray(tapis) ? tapis : [];
    var cles = liste.map(function (t, i) {
      var prods = (t && t.produits) || [], derb = (t && t.derb) || [];
      return { i: i, rang: prods.length ? 0 : derb.length ? 1 : 2, images: prods.filter(aUneImage).length, n: prods.length };
    });
    cles.sort(function (a, b) {
      if (a.rang !== b.rang) return a.rang - b.rang;
      return (b.images - a.images) || (b.n - a.n) || (a.i - b.i);
    });
    return cles.map(function (c) { return c.i; });
  }

  return {
    MAX_PROJETS: MAX_PROJETS, NOM_MAX: NOM_MAX, RESOUT_MAX: RESOUT_MAX, LIEN_MAX: LIEN_MAX,
    ACCROCHE_MAX: ACCROCHE_MAX, POUR_QUI_MAX: POUR_QUI_MAX, DESCRIPTION_MAX: DESCRIPTION_MAX,
    CORPS_MAX: CORPS_MAX, LIVRE_MAX: LIVRE_MAX, DELAI_MAX: DELAI_MAX,
    FAQ_MAX: FAQ_MAX, FAQ_Q_MAX: FAQ_Q_MAX, FAQ_R_MAX: FAQ_R_MAX, faq: faq,
    GALERIE_MAX: GALERIE_MAX, cheminSur: cheminSur, galerie: galerie,
    imageSure: imageSure, affiche: affiche, produit: produit,
    FERME: FERME,
    lienSur: lienSur, nettoyer: nettoyer, ferme: ferme, peutEtaler: peutEtaler, valider: valider, etat: etat,
    ordreVitrine: ordreVitrine
  };
});
