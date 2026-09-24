// Au Courant — la maison Nareva : LA CARTE DES SITES (24/09/2026).
//
// Dans Zawia, la carte du jeu (« la Kharita ») montre neuf villes, des mots, des
// figures et la route d'un voyage. Chez Nareva, elle devient la carte des huit
// sites de la maison et de son siège : un site s'allume quand sa page est
// retrouvée au coffre des sites ; le siège, à Casablanca, est la maison — il est
// allumé d'emblée.
//
// Chargé APRÈS interface.js (il complète le même vocabulaire) et AVANT
// assets/js/zawia-jeu/maison.js (qui pose ce vocabulaire sur le français). Comme
// maison.js, il agit EN PLACE sur ce que les deux modules de la carte exportent,
// sans toucher au moteur :
//   window.ZWK (assets/js/zawia-kharita.js, le dessin) — VILLES, FAMILLES
//     remplacés ; MOTS, FIGURES, GENS, ROUTE vidés ; RELIEFS renommés ; DECOR, les
//     textes fixes du dessin, complété ;
//   ZWJ.kharita (assets/js/zawia-jeu/kharita.js, le jeu) — VILLES et MAISON, et
//     trois fonctions : etat, revenues, fiche. Le module garde sa maison (« fes »)
//     dans une variable qu'on n'atteint pas du dehors, et sa fiche parle de villes
//     effacées : jeu.js les appelle par l'objet (Kh.etat, Kh.revenues, Kh.fiche),
//     il voit donc celles de la maison.
//
// ⚠️ Les coordonnées sont APPROXIMATIVES (au dixième de degré, relevées pour la démo
//    du 26/09/2026) : elles placent un site dans sa région, pas au pied d'une
//    éolienne. Quatre sites se serrent sur la côte du Sud : leur médaillon s'écarte
//    en mer (`decale`, en pixels), et un fil le relie au point du site.
// ⚠️ Les faits des fiches sont ceux des pages du coffre (contenu.js), donc de
//    nareva.ma : aucun chiffre qui n'y soit pas.
// ⚠️ Rien de l'univers de Zawia : ni ses villes, ni ses mots, ni ses figures, ni
//    sa route, ni ses personnages (tests/maison-nareva-carte.test.js).
(function (root) {
  "use strict";

  var SIEGE = "siege";
  var PORTRAITS = "assets/maisons/nareva/portraits/";

  // Ce qu'on fait sur un site : l'anneau du médaillon en prend la couleur, et la
  // légende de la carte les nomme (forme de FAMILLES, zawia-kharita.js).
  var FAMILLES = [
    { cle: "eolien", nom: "Parc éolien", ar: "", couleur: "#005baa", forme: "rond" },
    { cle: "thermique", nom: "Centrale thermique", ar: "", couleur: "#d0612e", forme: "rond" },
    { cle: "dessalement", nom: "Dessalement de l'eau de mer", ar: "", couleur: "#0b8a99", forme: "rond" },
    { cle: "irrigation", nom: "Eau d'irrigation", ar: "", couleur: "#3d9a2c", forme: "rond" },
    { cle: "siege", nom: "Le siège", ar: "", couleur: "#c99a06", forme: "rond" }
  ];

  // Les neuf lieux. `cle` = la clé des pages du coffre (leur champ `ville`) et des
  // portraits ; `ligne` = ce qu'on y fait, sous le nom ; `lieu` = où c'est ;
  // `quoi` = la fiche, quand le site est allumé.
  // Coordonnées approximatives (degrés décimaux, nord / est).
  var SITES = [
    { cle: SIEGE, nom: "Le siège", lat: 33.57, lon: -7.59, famille: "siege", ligne: "Casablanca",
      lieu: "Casablanca", image: "assets/maisons/nareva/marque.svg",
      quoi: "La maison est née en 2004, et c'est d'ici qu'elle veille sur ses sites. Le nouvel arrivant y est déjà : la carte commence avec lui." },
    { cle: "haouma", nom: "Haouma", lat: 35.72, lon: -5.55, famille: "eolien", ligne: "parc éolien",
      lieu: "au nord, près du détroit",
      quoi: "Le vent du Nord : 50 MW, à 50 km à l'est de Tanger, en exploitation depuis décembre 2013. L'un des premiers parcs de la maison sous la loi 13-09." },
    { cle: "safi", nom: "Safi", lat: 32.23, lon: -9.26, famille: "thermique", ligne: "centrale thermique",
      lieu: "sur la côte atlantique",
      quoi: "La centrale qui tient le réseau : 1 386 MW depuis 2018, près de 20 % de la demande électrique du pays. La seule centrale d'Afrique en technologie ultra-supercritique." },
    { cle: "sebt-el-guerdane", nom: "Sebt El Guerdane", lat: 30.37, lon: -8.98, famille: "irrigation", ligne: "eau d'irrigation",
      lieu: "dans la plaine du Souss",
      quoi: "L'eau avant le vent : depuis 2009, un ouvrage de 384 km amène l'eau du barrage d'Aoulouz jusqu'à 10 600 hectares d'agrumes. Le premier chantier de la maison." },
    { cle: "akhfennir", nom: "Akhfennir", lat: 28.09, lon: -12.05, famille: "eolien", ligne: "parc éolien",
      lieu: "à 100 km au nord-est de Tarfaya", decale: [121, -210], etiquette: "dessus",
      quoi: "Deux parcs, un seul souffle : Akhfennir 1 depuis 2013, Akhfennir 2 depuis 2016. Ensemble, 117 turbines et 200 MW." },
    { cle: "tarfaya", nom: "Tarfaya", lat: 27.94, lon: -12.92, famille: "eolien", ligne: "parc éolien",
      lieu: "près de la ville de Tarfaya", decale: [74, -215], etiquette: "dessus",
      quoi: "300 MW, entrés en exploitation en 2014 : ce jour-là, le plus grand parc éolien d'Afrique. Environ 1 100 GWh d'électricité verte par an." },
    { cle: "foum-el-oued", nom: "Foum El Oued", lat: 27.10, lon: -13.40, famille: "eolien", ligne: "parc éolien",
      lieu: "près de Laâyoune", decale: [-6, -240], etiquette: "dessus",
      quoi: "50 MW, à 20 km au sud-ouest de Laâyoune, en exploitation depuis septembre 2013 : l'un des tout premiers parcs de la maison sous la loi 13-09." },
    { cle: "aftissat", nom: "Aftissat", lat: 26.20, lon: -14.45, famille: "eolien", ligne: "parc éolien",
      lieu: "dans la région de Boujdour", decale: [-37, -267], etiquette: "dessus",
      quoi: "Un complexe bâti en quatre étapes, de 2018 à 2026 : 121 turbines et 550 MW, le second plus grand parc éolien d'Afrique." },
    { cle: "dakhla", nom: "Dakhla", lat: 23.72, lon: -15.93, famille: "dessalement", ligne: "dessalement",
      lieu: "sur la baie de Dakhla", decale: [-33, -341], etiquette: "dessus",
      quoi: "Le vent qui fait de l'eau : un parc éolien de 60 MW alimente une unité de dessalement de 37 millions de m³ par an, pour l'irrigation et l'eau potable de la région." }
  ];
  function site(cle) {
    for (var i = 0; i < SITES.length; i++) if (SITES[i].cle === cle) return SITES[i];
    return null;
  }
  function famille(cle) {
    for (var i = 0; i < FAMILLES.length; i++) if (FAMILLES[i].cle === cle) return FAMILLES[i];
    return null;
  }

  // Les textes fixes du dessin (forme de DECOR, zawia-kharita.js). Un texte vide
  // n'est pas dessiné.
  var DECOR = {
    titre: "La carte des sites — Au Courant",
    desc: "La carte des sites de Nareva : huit sites et le siège, du nord au sud du Maroc. Un site s'allume quand sa page est retrouvée au coffre des sites.",
    autreRive: "",
    ocean: "OCÉAN ATLANTIQUE",
    oceanOu: [32.35, -13.8, 0],
    mediterranee: "MER MÉDITERRANÉE",
    sahara: "",
    tropique: "",
    roseSous: "",
    ornements: false,
    effacee: "à rallumer",
    cartouche: { sur: "AU COURANT · NAREVA", titre: "La carte des sites", sous: "là où la maison fait la lumière et l'eau", ar: "" },
    echelle: null,
    legende: { titre: "Comment lire la carte", note: "Un site s'allume quand sa page est retrouvée." }
  };
  // Les reliefs gardent leur tracé ; leur nom est celui des cartes d'aujourd'hui.
  var RELIEFS = { "Ar-Rif": "Rif", "Al-Atlas al-Mutawassit": "Moyen Atlas", "Al-Atlas al-Kabir": "Haut Atlas", "Al-Atlas as-Saghir": "Anti-Atlas" };

  // ---- Le jeu : quels sites sont allumés, et leur fiche ---------------------------------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  // etat(liste) — même forme que kharita.js : `liste` est P.etat(joueur.pages).liste.
  // `revenues` et `total` ne comptent que les huit sites : le siège est la maison,
  // on ne le « retrouve » pas. `brouillard` dit au dessin ce qui est allumé.
  function etat(liste) {
    var pages = Array.isArray(liste) ? liste : [];
    var brouillard = {}, allumes = 0, total = 0;
    var villes = SITES.map(function (s) {
      var siennes = pages.filter(function (p) { return p && p.ville === s.cle; });
      var retrouvees = siennes.filter(function (p) { return p.retrouvee; }).length;
      var maison = s.cle === SIEGE, revenue = maison || retrouvees > 0;
      if (revenue) brouillard[s.cle] = true;
      if (!maison) { total += 1; if (revenue) allumes += 1; }
      return {
        cle: s.cle, batie: maison, quoi: s.quoi, deja: null, maison: maison,
        revenue: revenue, retrouvees: retrouvees, total: siennes.length,
        pages: siennes.map(function (p) {
          return { cle: p.cle, titre: p.titre, epoque: p.epoque, retrouvee: !!p.retrouvee, ouverte: p.ouverte !== false };
        })
      };
    });
    return { villes: villes, revenues: allumes, total: total, brouillard: brouillard };
  }
  // Les sites que la dernière page vient d'allumer (jamais le siège).
  function revenues(avant, apres) {
    var a = etat(avant).brouillard, b = etat(apres).brouillard;
    return Object.keys(b).filter(function (k) { return !a[k] && k !== SIEGE; });
  }
  // La fiche d'un site, dans le style des fiches de la carte (kh-fiche). Même
  // signature que kharita.js : (v, voix, extra) — `v` vient d'etat(), `voix` est
  // l'entrée du site dans le récit (contenu.js : « Le géant — le plus grand
  // d'Afrique… »), quand il y en a une ; `extra` n'est pas lu (le portrait est
  // celui du site, le même que sur la carte).
  function fiche(v, voix) {
    var s = v && site(v.cle);
    if (!s) return "";
    var f = famille(s.famille);
    var html = '<article class="kh-fiche kh-fiche--ville kh-fiche--site' + (v.revenue ? '' : ' kh-fiche--eteint') + '"><header>' +
      '<span class="kh-fiche-portrait"><img src="' + esc(s.image || PORTRAITS + s.cle + ".jpg") + '" alt="" width="56" height="56"></span>' +
      '<div><p class="kh-fiche-fam">' + esc(v.maison ? "La maison" : (f ? f.nom : "")) + ' · ' + esc(s.lieu) + '</p>' +
      '<h3>' + esc(s.nom) + '</h3>' +
      (voix && voix.nom && !v.maison ? '<p class="kh-fiche-sous">' + esc(voix.nom) + (voix.role ? ' — ' + esc(voix.role) : '') + '</p>' : '') +
      '</div></header>';
    if (!v.revenue) {
      html += '<p class="kh-fiche-txt">Ce site est encore dans le noir. Sa page attend au coffre des sites, dans les archives : retrouve-la, et il s\'allume ici.</p>';
    } else {
      html += '<p class="kh-fiche-txt">' + esc(s.quoi) + '</p>';
      html += '<span class="kh-fiche-etat">' + (v.maison ? 'La maison · tu y es' : 'Allumé') + '</span>';
    }
    if (v.pages && v.pages.length) {
      html += '<ul class="kh-fiche-pages">' + v.pages.map(function (p) {
        var cls = p.retrouvee ? "est-retrouvee" : (p.ouverte ? "" : "est-a-venir");
        var suffixe = p.retrouvee ? " — retrouvée" : (p.ouverte ? " — au coffre des sites" : " — s'ouvre bientôt");
        return '<li class="' + cls + '">Sa page : « ' + esc(p.titre) + ' » · ' + esc(p.epoque) + suffixe + '</li>';
      }).join("") + '</ul>';
    }
    return html + "</article>";
  }

  // ---- Le vocabulaire du panneau : le texte EXACT du moteur → celui de Nareva ---------
  // (espaces normalisés, comme langue.js ; un gabarit {1} capture ce que jeu.js écrit).
  var VOCABULAIRE = {
    // zawia-jeu.html : le bouton du menu, et l'en-tête du panneau
    "La Kharita": "La carte des sites",
    "La Kharita الخريطة": "La carte des sites",
    "Le grand monde": "Du nord au sud",
    "Nsyan n'a pas seulement arraché des pages : il a effacé les villes. Chaque page retrouvée au sandouq en fait revenir une sur la carte.":
      "Quand un savoir part sans être transmis, un site s'éteint sur la carte. Chaque page retrouvée au coffre des sites le rallume.",
    // jeu.js (rendreKharita) : le compte au-dessus de la carte, et la note dessous
    "{1} ville{2} sur {3} revenue{4} sur la carte. Les autres attendent leurs pages au sandouq.":
      "{1} site{2} allumé{2} sur {3} — le siège, lui, veille déjà.",
    "{1} ville{2} sur {3} revenue{4} sur la carte. Nsyan n'efface plus rien.":
      "Les {3} sites sont allumés : toute la maison est au courant.",
    "Touche une ville ou une enseigne pour la lire.": "Touche un site pour lire sa fiche.",
    // jeu.js (le coffre, « Carte gagnée ») : la ligne qui annonce le site allumé
    "Sur la Kharita, {1} revient. {2} t'y attend — Menu, puis La Kharita.":
      "Sur la carte des sites, {1} s'allume. {2} t'y attend — tu la trouves dans la maison (touche M)."
  };

  // ---- Appliquer, en place --------------------------------------------------------------
  function remplacer(cible, source) {
    if (!Array.isArray(cible)) return false;
    Array.prototype.splice.apply(cible, [0, cible.length].concat(source));
    return true;
  }
  var faits = [];
  var Z = root.ZWK;
  if (Z) {
    remplacer(Z.VILLES, SITES.map(function (s) {
      return {
        cle: s.cle, nom: s.nom, ar: "", lat: s.lat, lon: s.lon, famille: s.famille, sous: s.ligne,
        image: s.image || PORTRAITS + s.cle + ".jpg", decale: s.decale || null, etiquette: s.etiquette || null,
        aria: (famille(s.famille) || {}).nom + ", " + s.lieu,
        mourchid: s.ligne, role: s.lieu, terre: s.lieu
      };
    }));
    remplacer(Z.FAMILLES, FAMILLES);
    remplacer(Z.MOTS, []);
    remplacer(Z.FIGURES, []);
    remplacer(Z.GENS, []);
    remplacer(Z.ROUTE, []);
    (Z.RELIEFS || []).forEach(function (r) { if (RELIEFS[r.nom]) { r.nom = RELIEFS[r.nom]; r.ar = ""; } });
    if (Z.DECOR) Object.assign(Z.DECOR, DECOR);
    faits.push("dessin");
  }
  var Kh = root.ZWJ && root.ZWJ.kharita;
  if (Kh) {
    remplacer(Kh.VILLES, SITES.map(function (s) { return { cle: s.cle, batie: s.cle === SIEGE, quoi: s.quoi }; }));
    Kh.MAISON = SIEGE;
    Kh.etat = etat;
    Kh.revenues = revenues;
    Kh.fiche = fiche;
    faits.push("jeu");
  }
  var M = root.ZWJ_MAISON;
  if (M) {
    M.vocabulaire = Object.assign({}, M.vocabulaire || {}, VOCABULAIRE);
    faits.push("vocabulaire");
  }

  // Pour les tests et la console : ce que la carte de la maison a posé.
  root.ZWJ_MAISON_CARTE = { SIEGE: SIEGE, SITES: SITES, FAMILLES: FAMILLES, DECOR: DECOR, VOCABULAIRE: VOCABULAIRE, faits: faits, etat: etat, revenues: revenues, fiche: fiche };
})(typeof window !== "undefined" ? window : globalThis);
