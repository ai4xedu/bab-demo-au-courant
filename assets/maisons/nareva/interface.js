// Au Courant — la maison Nareva : L'INTERFACE (24/09/2026).
//
// Ce que le contenu rédigé (contenu.js) ne couvre pas, et que la démo montre :
//   1. le VOCABULAIRE de l'écran — le texte exact du moteur → celui de Nareva.
//      assets/js/zawia-jeu/maison.js le pose sur le français au chargement ;
//      une clé doit être le texte EXACT du moteur (espaces normalisés), sinon
//      elle ne prend pas (un gabarit {1} capture ce que le jeu interpole) ;
//   2. les ARCHIVES — le lexique de la maison, le nom des rayons ;
//   3. les données de DÉMONSTRATION de l'atelier — trois collègues fictifs, les
//      collègues en direct simulés, les documents, les formations. Le moment
//      sécurité n'est pas une preuve de présence dans ce périmètre (arbitrage du
//      24/09/2026) : c'est un rituel présenté aux archives.
// Chargé APRÈS contenu.js et maison.js : il complète les deux objets.
(function (root) {
  "use strict";
  var M = root.ZWJ_MAISON = root.ZWJ_MAISON || {};
  var C = root.ZWJ_MAISON_CONTENU = root.ZWJ_MAISON_CONTENU || {};

  M.refusePrefixe = "Au quotidien, on refuse : ";
  // Le lien « Revoir l'intro » : ni la rédaction ni l'interface ne le traduisent — un
  // lien seul dans son paragraphe disparaîtrait avec lui (langue.js le traite comme
  // une feuille). Le générateur de page change son texte dans le HTML.
  if (Array.isArray(C.porte)) C.porte = C.porte.filter(function (p) { return !p || !/Revoir l'intro/.test(String(p.avant)); });

  M.vocabulaire = Object.assign({}, M.vocabulaire || {}, {
    // ---- L'écran d'accueil et l'atelier du personnage
    "Mode atelier — les comptes et ton personnage vivent dans ce navigateur, rien ne part sur le réseau.":
      "Démo — ton compte et ton personnage vivent dans ce navigateur : rien ne part sur le réseau.",
    "Pseudo — le nom qu'on verra dans la cour": "Ton prénom — celui que tes collègues verront",
    "On coud la djellaba…": "On ajuste la tenue…",
    "Djellaba {1}": "Tenue {1}",
    "Entrer dans la Qarawiyine": "Entrer dans la maison",

    // ---- L'affichage de jeu : les trois axes, jamais additionnés
    "M39ol · {1}": "⌁ Réseau · {1}",
    "Sna3a · {1}": "⚡ Puissance · {1}",
    "Cartes · {1}": "☀ Lumière · {1}",
    "Dhakira · {1}": "☀ Lumière · {1}",   // la barre en points (hudCulture), comme la carte et le carnet
    // les messages (vu en rejouant la démo le 25/09/2026 : « on ne prospecte pas » est un mot de communauté)
    "Tes conversations privées. Deux messages au plus tant que l'autre n'a pas répondu : ici, on ne prospecte pas.":
      "Tes conversations privées avec tes collègues. Deux messages au plus tant que l'autre n'a pas répondu : chacun répond quand il peut.",
    // la carte de collègue (vu en rejouant la démo le 25/09/2026)
    "Maharat": "Compétences",
    "Fermée, personne ne la lit. Ouverte, seuls les membres admis la voient — jamais un invité, jamais le Lawh public. Ni téléphone ni e-mail : on te joint par les messages de la maison.":
      "Fermée, personne ne la lit. Ouverte, seuls tes collègues de la maison la voient — jamais un visiteur. Ni téléphone ni e-mail : on te joint par les messages de la maison.",
    "Wird · jour {1} · {2}": "Jour {1}/40 · {2}",
    "Wird · 40/40": "Quarante jours tenus",
    "atelier": "démo",

    // ---- Le menu
    "Apprendre dans la zawia · le prouver à Fès · le partager à la halqa.": "Découvrir la maison · prouver son métier · faire sa place.",
    "Apprendre — dans la zawia": "Découvrir — la maison",
    "Jouer — à Fès et dans la cour": "S'exercer — le métier",
    "Partager — à la halqa": "Partager — avec les collègues",
    "Le Wird du jour": "Le programme du jour",
    "La bibliothèque": "Les archives",
    "Mes cartes": "Mes cartes de site",
    "Mes maharat — l'Ijaza de la Zawia": "Mes compétences",
    "Le Riwaq": "Les rendez-vous",
    "Ma carte de membre": "Ma carte de collègue",
    "Relire le prologue": "Relire l'histoire",
    "Le tutoriel": "Le guide de Ba Lahcen",

    // ---- La barre d'icônes et le Dar
    "Le Dar": "La maison",
    "Chercher dans le Dar": "Chercher dans la maison",
    "Apprendre": "Découvrir",
    "Jouer": "S'exercer",
    "Rien ne répond à ce mot. Essaie « thé », « tapis », « parcours » ou « classement ».":
      "Rien ne répond à ce mot. Essaie « programme », « sites », « compétences » ou « messages ».",
    "Y aujourd'hui · F ma ferracha · G les gens · C aller · M le Dar · / chercher": "Y aujourd'hui · G les gens · C aller · M la maison · / chercher",
    "Le Kalam": "La discussion",

    // ---- Le bandeau du guide pas à pas
    "Le mou'allim · {1}/{2} — {3}": "Ba Lahcen · {1}/{2} — {3}",

    // ---- Le programme du jour
    "L'Arb3ine": "Tes quarante jours",
    "Le Wird": "Le programme du jour",
    "Le Wird الورد": "Le programme du jour",
    "Un défi par jour, quarante jours, vingt minutes au plus. La portion du jour — ni plus, ni moins. La veille se rattrape.":
      "Un pas par jour, quarante jours, vingt minutes au plus. Ni plus, ni moins. La veille se rattrape.",

    // ---- La jauge des sites
    "La fontaine du Sahn": "La jauge des sites",
    "La fontaine du Sahn الخصّة": "La jauge des sites",
    "Lkhessa ta3mer — la fontaine se remplit": "La jauge des sites — elle monte avec chacun",
    "L'eau vient d'en haut, coule vers tous, et personne ne la garde pour lui. Cette semaine, elle monte avec ce que chacun fait. Pleine avant dimanche soir : la semaine d'après, les lanternes de la cour restent allumées — pour tout le monde.":
      "La jauge de ton site monte avec ce que chaque nouveau fait cette semaine. Pleine avant dimanche soir : la semaine d'après, les lumières de la base restent allumées pour tout le site.",
    "Ce qui verse une goutte": "Ce qui fait monter la jauge",
    "Une goutte par geste, par jour et par personne : c'est la base qui compte, pas l'écran. La fontaine ne donne aucun point — elle est à tous.":
      "Une goutte par geste, par jour et par personne. La jauge ne donne aucun point, et personne n'y est classé : elle est à tout le site.",
    "En atelier, elle n'est qu'à toi : {1} gouttes la remplissent.": "Dans cette démo, elle n'est qu'à toi : {1} gouttes la remplissent.",

    // ---- L'établi : les défis de métier
    "Ta7addi {1} sur {2} — « {3} ».\nVoie « {4} » : {5}\n(Les Ta7addi d'entreprise, eux, ne se corrigent pas ici : ils se livrent. Aucun n'est ouvert pour l'instant.)":
      "Défi de métier {1} sur {2} — « {3} ».\nFamille « {4} » : {5}",
    "Ta7addi {1} sur {2} — « {3} ».\nVoie « {4} » : {5}": "Défi de métier {1} sur {2} — « {3} ».\nFamille « {4} » : {5}",
    "Ta7addi passé": "Défi réussi",
    "☑ « {1} » — {2}\n+{3} Sna3a, voie « {4} » — du premier coup.": "☑ « {1} » — {2}\n+{3} Puissance, famille « {4} » — du premier coup.",
    "☑ « {1} » — {2}\n+{3} Sna3a, voie « {4} ».": "☑ « {1} » — {2}\n+{3} Puissance, famille « {4} ».",
    "Les {1} Ta7addi de la maison sont passés. Les suivants viendront des entreprises : un vrai problème, un livrable, un jury — et des points qui s'attestent, pas qui se cliquent.":
      "Les {1} défis de métier sont passés. Les suivants se prouvent sur le terrain : un vrai livrable, que ton manager atteste.",
    "Il reste {1} Ta7addi à l'établi. La Sna3a dit ce que tu sais faire ; elle ne dit pas ta place dans la maison.":
      "Il reste {1} défis de métier à l'établi. La Puissance dit ce que tu sais faire ; elle ne dit pas ta place dans la maison.",

    // ---- Le carnet : les trois axes
    "M39ol {1} — {2} · {3} présence{4}\nCe que tu as donné à la maison : ta présence aux sessions, ce que tu portes, ce que tu tiens.\nIl se reçoit d'un autre — le témoin, la salle, le bureau. Jamais d'ici.":
      "Réseau {1} — {2}\nCe que tu apportes aux autres : les collègues rencontrés, les rituels vécus, l'aide donnée.\nIl vient des autres — ton parrain, tes collègues, ton manager. Jamais de toi seul.",
    "M39ol {1} — {2} · {3} présence{4}\nCe que tu as donné à la maison : ta présence aux sessions, ce que tu portes, ce que tu tiens.\nEncore {5} pour devenir {6}.":
      "Réseau {1} — {2}\nCe que tu apportes aux autres : les collègues rencontrés, les rituels vécus, l'aide donnée.\nEncore {5} pour devenir {6}.",
    "Sna3a {1} — {2}, {3}\nCe que tu sais faire : {4} Ta7addi sur {5} à l'établi{6}.\n{7}":
      "Puissance {1} — {2}, {3}\nCe que tu sais faire : {4} défis de métier sur {5} à l'établi{6}.\n{7}",
    "Sna3a {1} — {2}, {3}\nCe que tu sais faire : {4} Ta7addi sur {5} à l'établi{6}.":
      "Puissance {1} — {2}, {3}\nCe que tu sais faire : {4} défis de métier sur {5} à l'établi{6}.",
    ", et {1} bonne{2} réponse{3} au rihal": ", et {1} bonne{2} réponse{3} au quiz du jour",
    "Dhakira {1} — {2}, {3}\nCe que tu sais de ton pays : {4} page{5} de la Rihla sur {6}, au sandouq de la Khizana.":
      "Lumière {1} — {2}, {3}\nCe que tu sais de la maison : {4} site{5} retrouvé{5} sur {6}, au coffre des archives.",
    "Les trois ne se changent pas l'un en l'autre. La technique et la mémoire se gagnent seul ; le rang, lui, ne se gagne qu'ensemble.":
      "Les trois ne se changent pas l'un en l'autre. La Puissance et la Lumière se gagnent seul ; le Réseau, lui, ne se gagne qu'ensemble.",

    // ---- Les cartes de site
    "Dhakira {1} — {2}, {3}": "Lumière {1} — {2}, {3}",
    // le message du coffre quand un site est retrouvé (vu en rejouant la démo le 25/09/2026 :
    // « +15 Dhakira » et « Dhakira : Curieux, Il découvre la maison » passaient tels quels)
    "☑ « {1} » — {2}.\n+{3} Dhakira{4}\nLa voie exercée : « {5} ». Elle s'entraîne ici, elle se note à l'établi.\nDhakira : {6}, {7}.":
      "☑ « {1} » — {2}.\n+{3} Lumière{4}\nLa famille exercée : « {5} ». Elle s'exerce ici ; elle se prouve à l'établi.\nTa Lumière : {6}. {7}.",
    "chez Nsyan": "encore dans le noir",
    "Une ville retrouvée ouvre ses habits dans ta lebsa. Voir ma garde-robe": "",

    // ---- Le quiz du jour
    "Le rihal": "Le pupitre de sécurité",
    "L'Imtihan": "Le quiz du jour",
    "L'Imtihan الامتحان": "Le quiz du jour",
    "Juste. +{1} Sna3a.": "Juste. +{1} Puissance.",
    "Cinq questions par jour, c'est la règle. Reviens demain — le rihal ne se vide pas d'un coup.": "Cinq questions par jour, c'est la règle. Reviens demain : le quiz ne se vide pas d'un coup.",
    "Tu as vu toutes les questions du rihal. D'autres viendront.": "Tu as vu toutes les questions du quiz. D'autres viendront.",
    "Le rihal ne répond pas.": "Le quiz ne répond pas.",

    // ---- Le coffre des sites
    "Le sandouq · {1}": "Le coffre des sites · {1}",

    // ---- Le programme du jour : les trois gestes
    "1 · Apprendre — dans la zawia": "1 · Découvrir — la maison",
    "2 · Jouer — à Fès et dans la cour": "2 · S'exercer — le métier",
    "3 · Partager — à la halqa": "3 · Partager — avec les collègues",
    "Une page ouverte t'attend au sandouq : « {1} ».": "Un site t'attend au coffre des archives : « {1} ».",
    "Le rihal pose cinq questions par jour — le seul compteur qui se remet chaque matin.": "Le quiz du jour pose cinq questions, au pupitre de sécurité — le seul compteur qui se remet chaque matin.",
    "La fontaine du Sahn : {1} gouttes sur {2} cette semaine.": "La jauge des sites : {1} gouttes sur {2} cette semaine.",
    "Salue quelqu'un au Sahn — une rencontre vraie compte pour le défi des dix : {1} sur 10.": "Salue un collègue dans la cour — une rencontre vraie compte pour le défi des dix : {1} sur 10.",
    "Les quatre défis de l'Arb3ine": "Les quatre défis de tes quarante jours",
    "Le Wird ne donne aucun point : la Sna3a et la Dhakira viennent des gestes, le M39ol vient des autres. Il compte des jours. La veille se rattrape ; un jour manqué reste manqué, et n'efface rien.":
      "Le programme du jour ne donne aucun point : la Puissance et la Lumière viennent des gestes, le Réseau vient des autres. Il compte des jours. La veille se rattrape ; un jour manqué reste manqué, et n'efface rien.",

    // ---- Les infobulles et la barre d'icônes
    "Technique — {1}, {2} · {3}/{4} Ta7addi · encore {5} pour {6}": "Puissance — {1}, {2} · {3}/{4} défis de métier · encore {5} pour {6}",
    "Technique — {1}, {2} · {3}/{4} Ta7addi": "Puissance — {1}, {2} · {3}/{4} défis de métier",
    "La Dhakira — culture marocaine : {1} ({2}). Une carte par page retrouvée au sandouq : {3} sur {4}. Encore {5} pour {6}.":
      "La Lumière — ce que tu sais de la maison : {1} ({2}). Une carte par site retrouvé : {3} sur {4}. Encore {5} pour {6}.",
    "La Dhakira — culture marocaine : {1} ({2}). Une carte par page retrouvée au sandouq : {3} sur {4}.":
      "La Lumière — ce que tu sais de la maison : {1} ({2}). Une carte par site retrouvé : {3} sur {4}.",
    "Aujourd'hui : le Wird et les jeux du jour (Y)": "Aujourd'hui : le programme du jour (Y)",
    "Le Dar : tout le reste, rangé et cherchable (M)": "La maison : tout, rangé et cherchable (M)",
    "Les portes du Dar": "Les portes de la maison",
    "Laisser le mou'allim — le tutoriel reste au Menu": "Laisser Ba Lahcen — le guide reste dans la maison",
    "Le compte d'essai du Morchid seul : intro, prologue, tutoriel et Wird repartent du jour 1": "Repartir du jour 1 : le film, l'histoire, le guide et le programme",

    // ---- Les archives
    "La Khizana": "Les archives",
    "La bibliothèque المكتبة": "Les archives",
    "Reposer le livre": "Ranger le dossier",
    "Quatre rayons : le Kounnach — ce que ta Sna3a ouvre —, al-Moujam — les mots de la maison —, de quoi apprendre, et le catalogue. Les rayonnages ont quelques siècles d'avance sur toi ; rattrape-les.":
      "Les rayonnages de la maison : le lexique de l'énergie et de l'eau, les documents d'accueil, et les formations que Nareva ouvre à ses collaborateurs.",
    "On entre ici de son pas — rien ne s'affiche au-dessus d'une tête. C'est la règle de la maison.":
      "Ici, chacun vient chercher ce dont il a besoin, à son rythme.",

    // ---- Les cartes de site
    "La Dhakira": "La Lumière",
    "Mes cartes بطاقاتي": "Mes cartes de site",
    "Une carte par page retrouvée au sandouq — dorée quand tu l'as trouvée sans indice. Une page nouvelle s'ouvre chaque jeudi. Douze cartes, et tu es Rawi : celui qui peut raconter.":
      "Une carte par site retrouvé dans les archives — dorée quand tu l'as trouvé sans indice. Huit sites, et tu peux raconter la maison à ton tour.",

    // ---- Les compétences
    "Le diplôme de la zawia": "Le référentiel de la maison",
    "Mes maharat": "Mes compétences",
    "Mes maharat المهارات": "Mes compétences",
    "Une mahara est un geste qu'on sait faire avec l'IA, et ce qui le prouve. Trois états : à acquérir, apprise dans une formation, prouvée par un livrable relu. Cinq prouvées dans un terrain font son ijaza ; le socle, l'amana, deux ijazat et une mahara transmise font l'Ijaza de la Zawia. Aucun point, aucun rang.":
      "Une compétence est un geste du métier, et ce qui le prouve. Trois états : à acquérir, apprise dans une formation, prouvée par un livrable qu'un manager a regardé. Aucun point, aucun rang : ce registre t'appartient.",

    // ---- Les compétences, domaine par domaine
    "{1} de plus pour l'ijaza": "{1} de plus pour que le domaine soit reconnu",
    "Une mahara ne se déclare pas : elle se prouve par un livrable qu'un témoin regarde — une étape attestée, ou le bureau. Aucun point, aucun rang : l'Ijaza de la Zawia n'est pas un rang de la charte.":
      "Une compétence ne se déclare pas : elle se prouve par un livrable qu'un manager regarde et atteste. Aucun point, aucun rang : ce registre t'appartient.",
    "On relit tes maharat…": "On relit tes compétences…",
    // ---- Le programme du jour : le rituel de la semaine, présenté sans preuve
    "Le point de la maison, le mercredi soir : le seul M39ol de la semaine, sur preuve. Le Riwaq dit l'heure.":
      "Le moment sécurité du lundi : un rituel de la maison, où l'on apprend des autres. Les archives disent pourquoi il compte.",

    // ---- Les rendez-vous
    "La galerie": "La salle de réunion",
    "Le Riwaq الرواق": "Les rendez-vous",
    "Ce que la maison annonce : les rencontres à venir. De quoi apprendre ? Les rayonnages de la Khizana.":
      "Ce que la maison annonce : les réunions à venir. Un document à lire ? Les archives.",
    "Écris le mot de passe dit pendant la séance.": "Écris le mot dit pendant la réunion.",
    "Présence validée. +{1} M39ol.": "Présence prouvée. +{1} Réseau.",

    // ---- Les infobulles des trois axes
    "Le rang — il vient des autres : la halqa du mercredi, le témoin, le bureau.":
      "Le Réseau — il vient des autres : les rituels tenus, les collègues aidés, les témoins.",
    "Le rang — il vient des autres : la halqa du mercredi, le témoin, le bureau. Encore {1} pour {2}.":
      "Le Réseau — il vient des autres : les rituels tenus, les collègues aidés, les témoins. Encore {1} pour {2}."
  });

  // Les rayons des archives : renommés, ou retirés (null).
  M.rayons = {
    tableaux: null,
    moujam: { nom: "Le lexique de la maison", sous: "les mots de l'énergie et de l'eau, expliqués" },
    ressources: { nom: "Les documents", sous: "ce qu'un nouveau lit dans ses premiers jours" },
    catalogue: { nom: "Les formations", sous: "ce que Nareva ouvre à ses collaborateurs" }
  };

  // Ce que disent les cases de la cour (forme de DIALOGUES, monde.js). Le moteur
  // ouvre lui-même les archives (S, B), l'établi (E), le pupitre du quiz (r) et la
  // jauge (f) : leur dialogue n'est qu'un repli.
  var COCHE = { a_faire: "☐", en_cours: "◐", valide: "☑" };
  C.tuiles = {
    "M": { nom: "L'éolienne de la base", pages: [
      "Une éolienne, plantée contre la base, dans le sable. Elle rappelle à chacun d'où vient la lumière.",
      "Trois pales, et un vent qui ne demande rien à personne. Ici, on apprend à le lire."
    ] },
    "T": { nom: "L'arbre solaire", pages: [
      "Un arbre solaire : ses feuilles boivent le soleil du Maroc le jour, et il éclaire l'entrée la nuit."
    ] },
    "L": { nom: "Une borne lumineuse", pages: [
      "Une borne lumineuse. Quand un ancien part sans transmettre, c'est elle qui s'éteint la première.",
      "Chaque savoir que tu reprends en rallume une."
    ] },
    "~": { nom: "Le bassin de refroidissement", pages: [
      "Le bassin de refroidissement. À Dakhla, cette eau-là viendrait de la mer, rendue douce par le vent."
    ] },
    "f": { nom: "Le cœur d'énergie", pages: [
      "Le cœur d'énergie de la base : la jauge des sites. Chaque nouveau y verse ce qu'il a fait, et la jauge de son site monte avec celle des autres."
    ] },
    "2": { nom: "Les archives", pages: [
      "Les archives de la maison : les sites, l'histoire, les codes, les rituels, le lexique.",
      "Au fond, le coffre des sites : une énigme par site, et une carte à gagner."
    ] },
    "B": { nom: "Les archives", pages: [
      "Les étagères des archives. Tout ce que la maison sait, rangé pour toi."
    ] },
    "r": { nom: "Le pupitre de sécurité", pages: [
      "Le pupitre du quiz du jour : quelques questions, chaque jour, pour garder les bons réflexes."
    ] },
    "3": { nom: "L'atelier métier", pages: [
      "L'atelier métier. On y prouve ce qu'on sait faire — pas ce qu'on sait dire.",
      "Au fond, le tableau tient les quatre défis de tes quarante jours."
    ] },
    "k": { nom: "Le tableau des défis", pages: function (ctx) {
      ctx = ctx || {};
      var a = ctx.arb3ine, d = ctx.defis || {}, defs = ctx.DEFIS || [];
      var titre = a ? (a.ecoule ? "Tes quarante jours sont passés." : "Tes quarante jours — jour " + a.jour + " sur " + a.total + ".") : "Tes quarante jours.";
      var lignes = defs.map(function (x) { return (COCHE[d[x.cle]] || COCHE.a_faire) + " " + x.titre; });
      return [titre, lignes.join("\n"),
        "Aucun défi ne se coche seul : c'est ton parrain d'intégration ou ton manager qui le reconnaît."];
    } },
    "E": { nom: "L'établi", pages: function (ctx) {
      var e = ctx && ctx.tahaddi;
      if (!e) return ["L'établi des défis de métier. On y mesure ce qu'on sait faire."];
      if (e.complet) return ["Les " + e.total + " défis de métier sont passés. Les suivants se prouvent sur le terrain, devant ton manager."];
      return ["Les défis de métier — " + e.reussis + " sur " + e.total + ". Le prochain : « " + e.prochain.titre + " »."];
    } },
    "S": { nom: "Le coffre des sites", pages: function (ctx) {
      var e = ctx && ctx.pages;
      if (!e) return ["Le coffre des sites : une énigme par site de la maison, et une carte à gagner."];
      if (e.complet) return ["Les " + e.total + " sites sont retrouvés. Tu peux raconter la maison à ton tour."];
      return ["Le coffre des sites — " + e.resolues + " sur " + e.total + " retrouvé" + (e.resolues > 1 ? "s" : "") + "."];
    } },
    "4": { nom: "La salle de réunion", pages: [
      "La salle de réunion. C'est ici que se tiennent le moment sécurité du lundi et les réunions d'équipe."
    ] },
    "h": { nom: "La table de réunion", pages: [
      "La table de réunion. Chaque lundi, le moment sécurité : quelques minutes pour parler d'un risque, d'un geste, d'un retour d'expérience.",
      "Personne ne se présente par son titre ici. On se présente par ce qu'on fait. Les rituels de la maison sont aux archives."
    ] },
    "Q": { nom: "L'écran de contrôle", pages: [
      "L'écran de contrôle. De Tarfaya à Safi, tout ce qui produit de la lumière se lit ici.",
      "Quand un voyant passe au rouge, on ne cherche pas un coupable : on cherche la cause."
    ] },
    "G": { nom: "Le sas d'entrée", pages: [
      "Le sas d'entrée. C'est par là que tu es entré, et par là que tu repartiras ce soir. La maison, elle, reste allumée."
    ] }
  };
  C.tuiles["F"] = C.tuiles["f"];

  // Le GUIDE PAS À PAS de Ba Lahcen (forme de tutoriel.etapes) : six pas, sur les
  // événements que le moteur émet déjà. Il remplace celui du contenu rédigé : le
  // périmètre de Nareva n'a ni tableau de classement, ni Souk, ni établi de Zawia.
  var BA = "Ba Lahcen · l'ancien";
  var ECHAUFFEMENT_REDIGE = C.tutoriel && C.tutoriel.ECHAUFFEMENT;   // celui de la rédaction, gardé
  C.tutoriel = {
    ECHAUFFEMENT: ECHAUFFEMENT_REDIGE,
    etapes: function () {
      return [
        { cle: "khatt", evenement: "tuile:V", tuile: "V",
          consigne: "Lis un mur des valeurs — approche-toi, puis Espace ou A",
          debut: { nom: BA, pages: [
            "Viens, je te montre la maison en six pas. En 2004, il n'y avait pas encore une seule éolienne ici ; aujourd'hui, tout ce qui compte tient dans cette cour. Suis le fil d'or au sol.",
            "D'abord, les jambes : les flèches, ou la croix sous ton pouce. Sur les murs de la cour, sept plaques portent nos valeurs, notre mission et notre vision. Va en lire une : approche-toi, et appuie sur Espace (ou A)."
          ] } },
        { cle: "page", evenement: "page", tuile: "S",
          consigne: "Ouvre le coffre des sites, aux archives, et retrouve un site",
          debut: { nom: BA, pages: [
            "☑ Une valeur lue, et une lumière qui revient. Tu as vu ? La cour s'éclaire un peu.",
            "Maintenant, nos sites. Aux archives, à l'ouest, le coffre des sites tient une énigme par site de la maison. Trouve-en un : tu gagneras sa carte."
          ] } },
        { cle: "defi", evenement: "defi", tuile: "E",
          consigne: "Passe un défi de métier à l'établi de l'atelier",
          debut: { nom: BA, pages: [
            "☑ Un site retrouvé : ta Lumière monte. C'est ce que tu sais de la maison.",
            "Deuxième axe : la Puissance, ce que tu sais faire. À l'établi de l'atelier métier, un défi t'attend : une situation du terrain, et la bonne réponse expliquée."
          ] } },
        { cle: "biblio", evenement: "biblio", tuile: "B",
          consigne: "Va aux rayonnages des archives : l'histoire, les codes, les rituels",
          debut: { nom: BA, pages: [
            "☑ C'est ça, la Puissance : elle se prouve, elle ne se déclare pas. Plus tard, ton manager attestera tes compétences sur ce que tu as vraiment fait.",
            "Le plus important maintenant : la culture de la maison. Aux rayonnages des archives, tu trouveras notre histoire, nos codes, nos rituels, et les métiers de ceux qui t'entourent. Chaque page lue rallume une lumière."
          ] } },
        { cle: "carnet", evenement: "carnet", salle: "carnet",
          consigne: "Ouvre la maison (M), puis ton carnet",
          debut: { nom: BA, pages: [
            "☑ Tu connais maintenant le chemin des archives. Reviens-y quand tu veux : rien ne s'y efface.",
            "Ouvre ton carnet, dans la maison (touche M). Regarde tes trois axes côte à côte : la Lumière, la Puissance, le Réseau. Ils ne s'additionnent jamais."
          ] } },
        { cle: "fin", evenement: null, fin: true, consigne: "",
          debut: { nom: BA, pages: [
            "☑ Trois axes, et aucun ne se change en l'autre. Le Réseau, lui, est encore à zéro, et c'est normal : il vient des autres, jamais de toi seul.",
            "Tu n'es pas seul. Ghita, ta marraine d'intégration, t'a déjà écrit : ouvre tes messages (touche G). Chaque jour, le programme du jour te propose un pas de vingt minutes. Tu as quarante jours pour rallumer ce qui s'éteint. Yallah."
          ] } }
      ];
    }
  };

  // Les quatre défis des quarante jours (forme de DEFIS, regles.js : mêmes clés).
  C.defis = [
    { cle: "meetups", titre: "Vivre les rituels de la maison", detail: "Le moment sécurité du lundi et la réunion d'équipe, six semaines de suite. Ton parrain d'intégration le reconnaît." },
    { cle: "cours", titre: "Finir le parcours d'accueil", detail: "Les modules d'accueil de la maison, en entier." },
    { cle: "reseau", titre: "Rencontrer dix collègues", detail: "Dix conversations vraies, sur au moins deux sites — pas dix cartes de visite." },
    { cle: "savoir", titre: "Partager un savoir utile", detail: "Une chose que tu sais et qu'un autre ne savait pas, dite au moment sécurité ou en réunion d'équipe." }
  ];

  // Le lexique de la maison (forme de MOUJAM, bibliotheque.js).
  C.lexique = [
    { cle: "lumiere", nom: "La Lumière", ar: "",
      detail: "Ce que tu sais de la maison : ses valeurs, ses sites, son histoire. Elle se rallume chaque fois que tu reprends un savoir. Elle ne s'additionne jamais aux deux autres." },
    { cle: "puissance", nom: "La Puissance", ar: "",
      detail: "Ce que tu sais faire, prouvé : un défi de métier réussi, une compétence attestée par un manager qui a vu ton travail. On ne se la déclare pas." },
    { cle: "reseau", nom: "Le Réseau", ar: "",
      detail: "Ce que tu apportes aux autres : les rituels tenus, les collègues rencontrés et aidés. Il vient des autres, jamais de toi seul." },
    { cle: "blackout", nom: "Le Blackout", ar: "",
      detail: "Dans le jeu, ce qui éteint la maison : un savoir qui part avec quelqu'un et que personne n'a repris. Ce n'est jamais une personne ni un service. C'est ce qui arrive quand on ne transmet pas." },
    { cle: "quarante", nom: "Les quarante jours", ar: "",
      detail: "Ton programme d'accueil : un pas par jour, vingt minutes au plus. La veille se rattrape ; un jour manqué n'efface rien." },
    { cle: "mw", nom: "Le mégawatt (MW)", ar: "",
      detail: "La puissance d'une installation, ce qu'elle peut fournir à un instant. On parle de la puissance installée d'un parc éolien ou d'une centrale." },
    { cle: "twh", nom: "Le térawattheure (TWh)", ar: "",
      detail: "Une quantité d'énergie produite dans le temps, souvent sur une année. La puissance dit ce qu'une installation peut faire ; l'énergie dit ce qu'elle a fait." },
    { cle: "producteur", nom: "Le producteur indépendant", ar: "",
      detail: "Une entreprise qui produit de l'électricité sans être le gestionnaire du réseau, et qui la vend à ses clients. C'est le métier de Nareva." },
    { cle: "parc", nom: "Le parc éolien", ar: "",
      detail: "Un ensemble d'éoliennes installées sur un même site et raccordées au réseau. Chaque éolienne transforme le vent en électricité." },
    { cle: "dessalement", nom: "Le dessalement", ar: "",
      detail: "Transformer l'eau de mer en eau douce. À Dakhla, l'installation est alimentée par l'énergie du vent." },
    { cle: "consignation", nom: "La consignation", ar: "",
      detail: "Mettre une installation hors énergie, la verrouiller et vérifier l'absence d'énergie avant d'intervenir. Le geste qui protège celui qui travaille." },
    { cle: "presque", nom: "Le presque-accident", ar: "",
      detail: "Un événement qui aurait pu blesser et qui ne l'a pas fait. Le déclarer n'accuse personne : c'est ce qui évite le suivant." },
    { cle: "moment", nom: "Le moment sécurité", ar: "",
      detail: "Le rituel qui ouvre la semaine : quelques minutes pour parler d'un risque, d'un geste, d'un retour d'expérience. On y vient pour apprendre des autres, pas pour être compté." },
    { cle: "parrain", nom: "Le parrain d'intégration", ar: "",
      detail: "Le collègue qui t'accompagne pendant tes premières semaines. On peut tout lui demander, même ce qui semble évident." }
  ];

  // Ghita, la marraine : son premier message le dit.
  if (C.collegues && C.collegues.rasail && C.collegues.rasail["demo-yassine"]) {
    C.collegues.rasail["demo-yassine"].premier = "Marhba ! Moi, c'est Ghita, du développement de projets, au siège. Je suis ta marraine d'intégration pour tes quarante jours : pose-moi toutes tes questions, même celles qui te semblent évidentes. Tu arrives dans quelle équipe ?";
  }
  if (C.collegues && C.collegues.cartes && C.collegues.cartes["demo-yassine"] && C.collegues.cartes["demo-yassine"].carte) {
    C.collegues.cartes["demo-yassine"].carte.offreMot = "Je suis ta marraine d'intégration : je réponds à tout, même aux questions évidentes.";
  }

  // Les données de démonstration de l'atelier (lues par compte.js au moment de répondre).
  // Les identifiants « demo-yassine », « demo-nour », « demo-omar » restent : la logique
  // de l'atelier les nomme. Seuls les gens changent.
  C.atelier = {
    // Les voisins de l'atelier (messages et annuaire) sont les collègues de la cour,
    // rédigés dans contenu.js (section `collegues`) : Ghita, Kawtar, Reda. Ghita est
    // la marraine d'intégration du nouveau : c'est elle qui lui écrit la première.
    rasail: (C.collegues && C.collegues.rasail) || {},
    cartes: (C.collegues && C.collegues.cartes) || {},
    wasfat: [],
    ressources: [
      { id: "doc-livret", genre: "ressource", titre: "Le livret d'accueil", detail: "Ce qu'un nouveau reçoit le premier jour : l'histoire, l'organisation, les règles de la maison.", lien: null, ordre: 10 },
      { id: "doc-securite", genre: "ressource", titre: "Les règles d'or de la sécurité", detail: "Ce qu'on vérifie avant chaque intervention, sur chaque site.", lien: null, ordre: 20 },
      { id: "doc-sites", genre: "ressource", titre: "La carte des sites", detail: "Où tourne le vent de la maison, où l'eau se fabrique, où la lumière se produit.", lien: null, ordre: 30 },
      { id: "form-hauteur", genre: "produit", titre: "Travailler en hauteur sur une éolienne", detail: "Avant de monter dans une nacelle : le geste, l'équipement, les règles.", lien: null, ordre: 40 },
      { id: "form-consignation", genre: "produit", titre: "Consigner une installation", detail: "Mettre hors énergie, verrouiller, vérifier : le geste qui protège.", lien: null, ordre: 50 },
      { id: "form-ia", genre: "produit", titre: "L'IA au travail — le parcours Ai4x", detail: "Faire gagner du temps à son équipe avec l'IA, sans jamais lui confier une décision de sécurité.", lien: null, ordre: 60 }
    ],
    // Les collègues EN DIRECT, simulés pour la démo : ils marchent dans la cour (des
    // routes en cases, sur les galeries et autour de la fontaine), rendent le salut
    // et répondent quand on dit un mot. Le vrai direct viendra avec la base de Nareva.
    enDirect: [
      { id: "demo-sim-imane", pseudo: "Imane", avatar: { peau: 2, djellaba: 3, tete: "hijab" }, route: [[18, 14], [27, 14], [27, 21], [18, 21]] },
      { id: "demo-sim-hamid", pseudo: "Hamid", avatar: { peau: 3, djellaba: 1, tete: "cheveux" }, route: [[11, 12], [34, 12]] },
      { id: "demo-sim-leila", pseudo: "Leïla", avatar: { peau: 1, djellaba: 6, tete: "cheveux" }, route: [[34, 23], [11, 23]] }
    ],
    repliques: [
      "Marhba ! Bienvenue dans la maison.",
      "Salam ! Tu es dans quelle équipe ?",
      "Bienvenue ! Si tu passes par Safi, fais-moi signe.",
      "Tu as vu les archives ? L'histoire de 2004 vaut le détour.",
      "Bon courage pour ton premier jour !"
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);
