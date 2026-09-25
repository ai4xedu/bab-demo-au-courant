// Au Courant — la maison Nareva : la CONFIGURATION (24/09/2026).
//
// Lue par assets/js/zawia-jeu/maison.js, qui l'applique au moteur avant que
// jeu.js ne démarre. Le CONTENU (valeurs, sites, pages, défis, personnages,
// programme des 40 jours) vit à côté, dans contenu.js.
//
// Choix de Youssef, le 24/09/2026 : le produit s'appelle Bab (une création
// Ai4x) ; chez Nareva, le jeu s'appelle « Au Courant » ; l'histoire est celle de
// la lumière qui s'éteint, racontée par Ba Lahcen, un ancien de fiction ; les
// trois axes s'appellent Lumière (culture), Puissance (métier), Réseau
// (communauté) ; le décor est la base du désert (l'esquisse C) ; une seule langue
// pour la démo, le français.
(function (root) {
  "use strict";
  // La démo repart de zéro quand on l'ouvre avec ?neuf=1 (le lanceur « repartir de
  // zéro » le fait) : le navigateur oublie le compte et le personnage d'avant,
  // AVANT que le jeu ne les lise. L'adresse reprend ensuite sa forme normale.
  // ⚠️ Les réglages de la DRH (la page de paramétrage, clé bab.maison.nareva.contenu)
  // ne sont PAS au joueur : « repartir de zéro » les garde.
  try {
    if (root.location && /[?&]neuf=1\b/.test(root.location.search)) {
      var GARDER = "bab.maison.nareva.contenu", reglages = root.localStorage.getItem(GARDER);
      root.localStorage.clear(); root.sessionStorage.clear();
      if (reglages) root.localStorage.setItem(GARDER, reglages);
      root.history.replaceState(null, "", root.location.pathname);
    }
  } catch (e) { /* navigation privée : rien à oublier */ }
  root.ZWJ_MAISON = {
    cle: "nareva",
    nom: "Au Courant",
    prologueTitre: "Au Courant",
    pseudoParDefaut: "toi",
    // Les photos dessinées de l'intro racontent la Qarawiyine : si le film de
    // Nareva manque, on passe droit à l'écran d'accueil.
    sansPhotos: true,
    // Une seule langue pour la démo : les titres gardent leur seul nom français.
    sansArabe: true,

    chemins: {
      film: "assets/maisons/nareva/video/au-courant-intro-",
      // ⚠️ changer « base=N » quand le film, un portrait ou une carte est refait
      version: "?v=85&base=2",
      portraits: "assets/maisons/nareva/portraits/",
      cartes: "assets/maisons/nareva/cartes/page-",
      // la BASE DU DÉSERT (décor choisi par Youssef le 24/09/2026, esquisse C) :
      // modules blancs, atrium au cœur d'énergie, sable ocre, éolienne, arbres
      // solaires ; sources dans docs/maisons/nareva/tuiles-src (planche.py).
      // ⚠️ « ?base=N » : changer N à chaque planche repeinte (le navigateur garde l'ancienne)
      planche: "assets/maisons/nareva/jeu/tuiles.webp?base=2",
      atlas: "assets/maisons/nareva/jeu/tuiles.json?base=2"
    },
    // Qui a un visage dans les boîtes de dialogue (en plus des sites, par leur clé).
    // Le prologue porte le nom du jeu : c'est Ba Lahcen qui le raconte.
    portraits: [["^Ba Lahcen", "ancien"], ["^Au Courant$", "ancien"]],

    // Le PÉRIMÈTRE, décidé par Youssef le 24/09/2026 : on part de rien, et on
    // n'allume que ce qui est choisi. Le menu est une liste blanche ; tout le
    // reste du moteur se tait. Pas de classement individuel (le « tableau » de
    // Zawia en est un), pas de rendez-vous à mot de passe.
    menu: [
      "boucle", "raccourcis",
      "wird", "bibliotheque", "cartes", "kharita", "maharat", "imtihan", "khessa",
      "dire", "rasail",
      "carnet", "bitaqa", "perso", "prologue", "tutoriel", "rejouer", "sortir"
    ],
    // La carte de la cour : les portes de Zawia deviennent des murs (Fès, le
    // Majliss, la Rkhama, le Mechouar), le mot du jour redevient un tableau, et
    // le golf du prompt devient un second établi de défis.
    carte: { "R": "#", "X": "#", "P": "#", "C": "#", "K": "k", "Y": "E" },
    // Les salles : la jauge des sites ouverte dès le premier jour ; les salles de
    // Zawia muettes (leur case ne fait que parler, par son dialogue de maison).
    salles: {
      ouvertes: ["khessa"],
      muettes: {
        atay: "T", rahba: "G", riwaq: "h",
        rihla: null, kelma: null, qlil: null, mechouar: null, nsyan: null, wach: null, jeux: null,
        tableaux: null, tableau: null, souk: null, oumm: null, kounnach: null, masarat: null
      }
    },
    salleFermee: "Cette porte-là ne s'ouvre pas chez Nareva.",
    // le bloc « Les jeux du jour » du menu : chez Nareva, il ne porte que la jauge
    jeuxDuJour: "Aussi aujourd'hui",
    // la barre du haut compte la Lumière en POINTS, comme la Puissance et le Réseau : la carte
    // dit « +15 Lumière », le carnet « Lumière 15 » — « Lumière · 1 » (les cartes) se contredisait
    hudCulture: "points",

    // LE PERSONNAGE (Youssef, 24/09/2026 : « un style vestimentaire moderne :
    // costume, cravate, chemise, tenues corporate, tailleurs pour femmes »). Les
    // tenues sont les figures de la planche de la base, gardées sous les clés du
    // moteur ; les couleurs teignent la tenue (la palette « djellaba » du moteur).
    avatar: {
      couleurs: [
        { nom: "Bleu marine", hex: "#22335a" },
        { nom: "Anthracite", hex: "#3d434c" },
        { nom: "Gris perle", hex: "#a3acb6" },
        { nom: "Noir", hex: "#26282c" },
        { nom: "Beige", hex: "#c9b594" },
        { nom: "Bleu Nareva", hex: "#1766b5" },
        { nom: "Vert Nareva", hex: "#2f8f45" },
        { nom: "Blanc", hex: "#e9edf1" }
      ],
      tenues: {
        cheveux: { nom: "Costume", detail: "Veste, cravate, chemise blanche." },
        capuche: { nom: "Tailleur", detail: "Veste cintrée et jupe, chemisier blanc." },
        tarbouche: { nom: "Chemise", detail: "Chemise et pantalon, sans veste." },
        taqiya: { nom: "Tailleur-pantalon", detail: "Veste longue et pantalon, chemisier blanc." },
        hijab: { nom: "Foulard et tailleur", detail: "Le foulard, ton sur ton avec le tailleur." },
        turban: { nom: "Tenue de terrain", detail: "Casque, gilet et combinaison : prêt pour le parc." }
      },
      // sous le foulard et sous le casque, aucune coiffure ne se pose
      couvre: { hijab: true, turban: true },
      bijoux: {
        boucles: { nom: "Boucles", detail: "Aux oreilles." },
        tazerzit: { nom: "Épinglette", detail: "Au revers de la veste." },
        "les-deux": { nom: "Les deux", detail: "Boucles et épinglette." }
      },
      coiffures: { courte: { detail: "Coupe courte, nette." } },
      barbes: { pleine: { detail: "Fournie, bien taillée." } }
    },
    // LA CARTE DE COLLÈGUE : les mots d'une entreprise (vu en rejouant la démo le 25/09/2026 :
    // la carte proposait « un associé », « un financement », « tester vos produits », GitHub,
    // TikTok — le vocabulaire d'une communauté d'entrepreneurs). Des propositions de démo.
    bitaqa: {
      cherche: [
        { cle: "mentor", nom: "un mentor" },
        { cle: "metier", nom: "découvrir un autre métier" },
        { cle: "site", nom: "visiter un autre site" },
        { cle: "projet", nom: "des collègues pour un projet" },
        { cle: "outil", nom: "de l'aide sur un outil" },
        { cle: "trajet", nom: "partager un trajet" },
        { cle: "apprendre", nom: "apprendre" }
      ],
      offre: [
        { cle: "mentorat", nom: "du mentorat" },
        { cle: "visite", nom: "une visite de mon site" },
        { cle: "metier", nom: "faire découvrir mon métier" },
        { cle: "technique", nom: "un coup de main technique" },
        { cle: "relecture", nom: "une relecture" },
        { cle: "trajet", nom: "une place dans ma voiture" },
        { cle: "langue", nom: "des échanges de langue" }
      ],
      liens: [
        { cle: "linkedin", nom: "LinkedIn", domaines: ["linkedin.com"] },
        { cle: "site", nom: "Site", domaines: null }
      ]
    },
    // la chemise, le casque, les bandes du gilet et les cheveux de l'ancien restent blancs
    figures: { blancs: 0.62 },
    // La jauge des sites : les gestes qui la font monter, dans les mots de la maison.
    // Les compétences : quatre par domaine chez Nareva, un domaine est reconnu à
    // trois compétences prouvées (Zawia en demande cinq).
    maharat: { seuil: 3 },
    jauge: { gestes: {
      wird: "Tenir le programme du jour",
      page: "Retrouver un site dans les archives",
      tahaddi: "Réussir un défi de métier à l'établi",
      imtihan: "Répondre au quiz du jour, au pupitre de sécurité",
      salut: "Saluer un collègue dans la cour"
    } },
    // Les collègues de la cour portent, dans l'ordre, les métiers de « Métiers et
    // gens » (éditables dans l'admin) : ce que la DRH y écrit, la cour le dit.
    pnjMetiers: ["nour", "warraq", "yassine", "zhor", "omar"],
    // Les cartes du Dar, renommées pour la maison (même clé que le menu).
    entrees: {
      wird: { nom: "Le programme du jour", pourquoi: "Un pas par jour, vingt minutes au plus, quarante jours.", mots: ["programme", "jour", "aujourd'hui", "parcours", "40 jours"] },
      bibliotheque: { nom: "Les archives", pourquoi: "Le lexique de la maison, les documents, les formations.", mots: ["archives", "documents", "lexique", "formations"] },
      cartes: { nom: "Mes cartes de site", pourquoi: "Une carte par site retrouvé : Tarfaya, Safi, Dakhla…", mots: ["cartes", "sites", "collection", "parcs"] },
      maharat: { nom: "Mes compétences", pourquoi: "Ce que tu sais faire, prouvé devant un témoin.", mots: ["competences", "métier", "gpec", "attester", "preuve"] },
      kharita: { porte: "apprendre", nom: "La carte des sites", pourquoi: "Le Maroc de la maison : chaque site retrouvé s'y allume.", mots: ["carte", "sites", "maroc", "parcs"] },
      imtihan: { nom: "Le quiz du jour", pourquoi: "Quelques questions chaque jour, pour garder les bons réflexes.", mots: ["quiz", "questions", "réflexes", "sécurité"] },
      khessa: { nom: "La jauge des sites", pourquoi: "Chaque site remplit sa jauge avec ce que ses nouveaux font. Personne n'est classé.", mots: ["jauge", "sites", "collectif", "ensemble"] },
      rasail: { nom: "Mes messages", pourquoi: "Tes conversations avec les collègues.", mots: ["messages", "écrire", "collègue"] },
      carnet: { nom: "Mon carnet", pourquoi: "Ta Lumière, ta Puissance, ton Réseau, côte à côte.", mots: ["carnet", "lumière", "puissance", "réseau"] },
      bitaqa: { icone: "plaque", nom: "Ma carte de collègue", pourquoi: "Ce que tu sais, ce que tu cherches : que la maison te trouve.", mots: ["carte", "profil", "annuaire", "collègues"] },
      perso: { nom: "Mon personnage", pourquoi: "Ton visage, ta tenue, ta coiffure.", mots: ["personnage", "avatar", "tenue"] },
      tutoriel: { nom: "Le guide de Ba Lahcen", ar: "", pourquoi: "Ba Lahcen te reprend par l'épaule, pas à pas.", mots: ["guide", "aide", "tutoriel", "ba lahcen"] },
      prologue: { nom: "Relire l'histoire", ar: "", pourquoi: "La lumière qui s'éteint, racontée par Ba Lahcen.", mots: ["histoire", "prologue", "blackout"] },
      rejouer: { nom: "Repartir du jour 1", ar: "", pourquoi: "Le film, l'histoire, le guide et le programme recommencent.", mots: ["rejouer", "recommencer"] },
      sortir: { nom: "Sortir de la maison", pourquoi: "Quitter le jeu. Ta place t'attend.", mots: ["sortir", "quitter"] }
    },
    // Les lieux où « Aller » mène. Ceux de Zawia hors de la cour ne sont pas repris.
    lieux: {
      sahn: { icone: "lanterne", nom: "La cour", detail: "le cœur d'énergie et les sept plaques des valeurs" },
      khizana: { nom: "Les archives", detail: "le coffre des sites et les étagères de la maison" },
      madrasa: { nom: "L'atelier métier", detail: "l'établi des défis et le tableau" },
      qaa: { nom: "La salle de réunion", detail: "les rendez-vous de la maison" }
    },

    // Ce qui, dans Zawia, se déclenche seul et n'a rien à faire chez Nareva.
    taire: ["voile", "jeux", "sirr", "tariqa"],

    // La lumière qui s'éteint : la cour tombe à 42 % au prologue, et douze
    // savoirs repris la rallument entièrement.
    lumiere: {
      plancher: 0.42, cible: 12,
      rallume: "Une lumière se rallume dans la maison.",
      pleine: "La maison est entièrement rallumée. Ba Lahcen peut être fier."
    },

    // Posé sur la page une fois chargée : la signature de l'écran d'accueil.
    surPage: function (doc) {
      var porte = doc.getElementById("ecran-porte");
      if (!porte || doc.querySelector(".bab-signature")) return;
      var p = doc.createElement("p");
      p.className = "bab-signature";
      p.innerHTML = "<strong>Bab</strong> · une création Ai4x";
      var cible = porte.querySelector(".zj-porte__carte, .zj-carte, form") ? porte.querySelector(".zj-porte__carte, .zj-carte") || porte : porte;
      cible.appendChild(p);
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
