// Au Courant — la maison Nareva : LA VIE DE LA MAISON (25/09/2026).
//
// Ce que Nareva donne aux trois fonctions de assets/js/zawia-jeu/vie.js :
//   1. le Fil de la maison : ses mots, et des nouvelles de DÉMONSTRATION (la RH écrit
//      les vraies dans la page de paramétrage, onglet « Le Fil ») ;
//   2. Bab Discovery : les écoles, ce qu'un étudiant peut chercher, les métiers, et ce
//      que Ba Lahcen dit au visiteur pendant ses trois jours ;
//   3. la mémoire des anciens : ses mots, et trois pages d'EXEMPLE écrites par des
//      anciens de fiction (la RH publie les vraies depuis sa console).
//
// ⚠️ Rien de ce qui est daté ou signé ici n'est un fait de Nareva : ce sont des exemples
//    pour la démo, écrits avec des prénoms de fiction. Les nouvelles ne parlent que de la
//    vie de la maison (accueil, rituels, sécurité), jamais d'un contrat ou d'un chiffre.
// Chargé APRÈS interface.js et AVANT le moteur (vie.js puis maison.js).
(function (root) {
  "use strict";
  var M = root.ZWJ_MAISON = root.ZWJ_MAISON || {};
  var C = root.ZWJ_MAISON_CONTENU = root.ZWJ_MAISON_CONTENU || {};

  // Les commandes de la vie de la maison entrent dans la liste blanche du menu.
  if (Array.isArray(M.menu)) ["fil", "memoire", "etonnement", "candidater", "dyaf"].forEach(function (k) { if (M.menu.indexOf(k) < 0) M.menu.push(k); });

  M.vie = {
    fil: {
      nom: "Le Fil de la maison",
      kicker: "Ce que la maison annonce",
      lead: "Les nouvelles de Nareva : un accueil, un rituel, un site. Écrites par la RH, lues ici.",
      pourquoi: "Les nouvelles de la maison, écrites par la RH.",
      vide: "Rien au Fil pour l'instant : la RH y écrit les nouvelles de la maison.",
      porte: "apprendre", icone: "lawh"
    },
    memoire: {
      nom: "La mémoire des anciens",
      kicker: "Ce qu'aucune procédure ne dit",
      lead: "Quand un ancien part, un peu de ce qu'il savait s'éteint avec lui. Ces pages, ils les ont écrites avant. Réponds à leur question : la page se rallume.",
      pourquoi: "Ce que les anciens savent, écrit avant qu'ils partent.",
      lecon: "Ce qu'aucune procédure ne dit",
      transmettreTitre: "Transmettre une page",
      transmettreSous: "Tu sais quelque chose qu'aucune procédure ne dit : un bruit, un geste, une erreur qu'on ne refait pas ? Écris-le. La RH relit, puis ta page entre aux archives.",
      porte: "apprendre", icone: "sablier"
    },
    // 4. Le rapport d'étonnement (l'idée nº 4, 17/20) : au 30ᵉ jour, le nouveau dit ce
    //    qui l'a surpris. Anonyme s'il le veut — et alors vraiment anonyme.
    etonnement: {
      nom: "Mon rapport d'étonnement",
      kicker: "Tes yeux sont encore neufs",
      lead: "Au bout d'un mois, tu vois encore ce que les anciens ne voient plus. Dis-le : ce qui t'a plu, ce qui t'a étonné, ce que tu ferais autrement. La RH lit chaque rapport, et te répond ici.",
      pourquoi: "Ce qui t'étonne chez Nareva, dit à la RH, avec ou sans ton nom.",
      q1: "Ce qui m'a plu",
      a1: "Un accueil, un geste, une manière de travailler : ce qui t'a fait te dire « ici, c'est bien ».",
      q2: "Ce qui m'a étonné",
      a2: "Ce que tu ne comprends pas encore, ce qui t'a surpris, ce qui t'a manqué à l'arrivée. Les anciens ne le voient plus : toi, si.",
      q3: "Ce que je ferais autrement",
      a3: "Une idée pour mieux accueillir ceux qui arriveront après toi, même petite. Tu peux laisser vide.",
      site: "Ton site",
      aSite: "Aftissat, Safi, le siège… Pour que la RH sache où regarder. Tu peux laisser vide.",
      anonyme: "Envoyer sans mon nom : la RH lira mon rapport sans savoir qui l'a écrit. Je garde un reçu pour lire sa réponse.",
      note: "Personne ne te note sur ce que tu écris ici, et ton rapport n'entre jamais dans une évaluation.",
      porte: "partager", icone: "loupe"
    },
    discovery: {
      menu: "Postuler, ou être recontacté",
      kicker: "Bab Discovery",
      titreCandidater: "Postuler chez Nareva",
      titreRecontact: "Être recontacté",
      leadCandidater: "Dis-le à ceux qui recrutent : ton école, ta filière, ce que tu cherches. Trois lignes suffisent, elles sont lues par des gens.",
      leadRecontact: "Pas maintenant ? Laisse une adresse et ton école : l'équipe te fera signe quand un stage ou un poste s'ouvrira dans ton domaine. Rien d'autre.",
      merciCandidater: "Ta candidature est partie.",
      merciCandidaterTexte: "L'équipe recrutement la lit, puis te répond à l'adresse que tu as donnée. En attendant, la maison reste ouverte : le Fil dit ce qui s'y passe.",
      merciRecontact: "C'est noté.",
      merciRecontactTexte: "On te fera signe quand une porte s'ouvrira dans ton domaine. Tu peux demander à tout moment qu'on efface ton adresse.",
      consentement: "J'accepte que Nareva garde ces informations pour me recontacter au sujet d'un stage ou d'un emploi. Conformément à la loi 09-08, je peux en demander l'accès, la rectification ou l'effacement à tout moment.",
      // Les grandes écoles d'où viennent les lauréats de l'énergie (liste modifiable).
      ecoles: [
        "École Mohammadia d'ingénieurs (EMI)",
        "École Hassania des travaux publics (EHTP)",
        "École nationale supérieure des mines de Rabat (ENSMR)",
        "École nationale supérieure d'électricité et de mécanique (ENSEM)",
        "ENSAM Casablanca", "ENSAM Meknès", "ENSAM Rabat",
        "Institut national des postes et télécommunications (INPT)",
        "ENSIAS",
        "École Centrale Casablanca",
        "Université Mohammed VI Polytechnique (UM6P)",
        "École nationale des sciences appliquées (ENSA)",
        "École nationale de commerce et de gestion (ENCG)",
        "ISCAE",
        "Une autre école"
      ],
      cherche: [
        { cle: "pfe", nom: "Un stage de fin d'études (PFE)" },
        { cle: "ete", nom: "Un stage d'été ou d'initiation" },
        { cle: "emploi", nom: "Un premier emploi" }
      ],
      domaines: [
        { cle: "exploitation", nom: "Exploitation et maintenance" },
        { cle: "hse", nom: "Santé, sécurité, environnement" },
        { cle: "eau", nom: "Eau et dessalement" },
        { cle: "projets", nom: "Développement de projets" },
        { cle: "ingenierie", nom: "Ingénierie et études" },
        { cle: "finance", nom: "Finance et achats" },
        { cle: "support", nom: "RH, juridique, systèmes d'information" }
      ],
      // La question du troisième jour, en titre du panneau des portes.
      question: "Qu'est-ce qui t'amène ?",
      // L'écran d'accueil : l'entrée du visiteur devient celle des étudiants.
      porte: {
        mot: "Étudiant·e ou jeune diplômé·e ?",
        legende: "Découvre Nareva de l'intérieur : trois jours de visite, sans compte ni CV. Ba Lahcen te reçoit ; au bout, une porte pour postuler.",
        bouton: "Découvrir Nareva"
      },
      // Ce que Ba Lahcen dit au visiteur. Les champs absents gardent ceux du moteur.
      visiteur: {
        nom: "Visiteur Discovery",
        pseudo: "toi",
        apparition: { nom: "", pages: [
          "…",
          "Les lumières de la maison baissent d'un coup. Le cœur d'énergie, au milieu de la cour, ne bat plus qu'à moitié.",
          "Rien n'est en panne. Quelqu'un est parti à la retraite ce matin, et un peu de ce qu'il savait s'est éteint avec lui."
        ] },
        accueil: { nom: "Ba Lahcen", pages: [
          "Tu as vu ça, {pseudo}. Les anciens l'appellent le Blackout : chaque fois que quelqu'un part, un peu de la maison s'éteint.",
          "Moi, c'est Ba Lahcen. J'ai vu les premiers parcs sortir du sable. Et toi, tu viens d'une école qui forme ceux qui rallumeront la suite.",
          "Alors voilà l'accord : trois jours de visite. On ne te demande rien — ni ton nom, ni ton CV.",
          "Aujourd'hui, marche dans la cour : sept plaques portent nos valeurs, notre mission et notre vision. Et aux archives, un coffre garde une page par site. Ouvre-le.",
          "Demain, l'atelier métier t'ouvre ses défis. Le troisième jour, je te poserai une seule question."
        ] },
        retours: {
          2: { nom: "Ba Lahcen", pages: [
            "Te revoilà. Aujourd'hui, l'atelier métier est à toi : l'établi porte les défis qu'on pose à nos nouveaux — la sécurité, l'exploitation, l'eau.",
            "Passe aussi aux archives : l'histoire de la maison, ses codes, et la mémoire des anciens — ce qu'ils ont écrit avant de partir."
          ] },
          3: { nom: "Ba Lahcen", pages: [
            "Troisième jour. Tu connais la maison mieux que beaucoup de gens qui passent devant chaque matin.",
            "Viens me voir quand tu veux : j'ai une question, une seule."
          ] }
        },
        question: { nom: "Ba Lahcen", pages: [
          "Trois jours, {pseudo}. Tu as eu le temps de voir la maison : ses murs, ses sites, son métier.",
          "Alors je te pose la question qu'on ne pose pas avant : qu'est-ce qui t'amène ?",
          "Réponds ce qui est vrai. Les trois réponses sont bonnes, et aucune ne ferme la porte."
        ] },
        portes: [
          { cle: "candidater", nom: "Je postule", sous: "un stage de fin d'études, un stage d'été, un premier emploi", voix: "Ba Lahcen", geste: "candidater",
            pages: ["Bien. Alors dis-le à ceux qui recrutent : ton école, ta filière, ce que tu cherches.",
              "Trois lignes suffisent — elles sont lues par des gens, pas par une machine. Et si tu le veux, ta visite part avec : ce que tu as lu, retrouvé et réussi ici."] },
          { cle: "recontact", nom: "Recontactez-moi", sous: "pas maintenant — quand une porte s'ouvrira", voix: "Ba Lahcen", geste: "recontact",
            pages: ["C'est une réponse honnête, et elle compte : les meilleurs choisissent leur moment.",
              "Laisse une adresse et ton école : on te fera signe quand un stage ou un poste s'ouvrira dans ton domaine. Rien d'autre."] },
          { cle: "passer", nom: "Je découvrais", sous: "je voulais voir, c'est tout", voix: "Ba Lahcen",
            pages: ["Alors tu as bien fait, et tu n'as rien à justifier.",
              "La porte reste ouverte : le Fil de la maison dit ce qui s'y passe, et tu peux revenir quand tu veux."] }
        ],
        // Jour 1 : la cour, les murs, une page du coffre. Jour 2 : les archives et l'atelier métier.
        salles: { etabli: 2, khizana: 2, rayons: 2, sandouq: 1, qlil: null, rahba: null, atay: null, kelma: null },
        refus: {
          etabli: { nom: "L'atelier métier", pages: [
            "L'établi s'ouvre demain. Aujourd'hui, on fait connaissance : la cour, les sept plaques, et le coffre des archives.",
            "Demain, tu verras les défis qu'on pose à nos nouveaux : ce qu'on fait vraiment dans un parc."
          ] },
          khizana: { nom: "Les archives", pages: [
            "Les étagères s'ouvrent demain : l'histoire de la maison, ses codes, la mémoire des anciens.",
            "Aujourd'hui, le coffre du fond t'attend : une page par site. Ouvre-le."
          ] },
          sandouq: { nom: "Le coffre des sites", pages: ["Le coffre est au fond des archives. Approche-toi : il garde une page par site."] },
          rihal: { nom: "Le pupitre du quiz", pages: [
            "Le quiz du jour est celui des équipes : il suit leurs rituels de la semaine.",
            "Toi, tu as mieux : l'atelier métier t'ouvre ses défis dès demain."
          ] },
          imtihan: { nom: "Le quiz du jour", pages: ["Le quiz du jour est celui des équipes. Dès demain, l'atelier métier t'ouvre ses défis."] },
          khessa: { nom: "La jauge des sites", pages: [
            "La jauge se remplit avec ce que font les nouveaux de chaque site.",
            "Un visiteur ne la remplit pas — mais le jour où tu rejoins la maison, ton site comptera sur toi."
          ] },
          riwaq: { nom: "La salle de réunion", pages: ["La salle de réunion est celle des équipes. Ce que la maison annonce, tu le lis au Fil."] },
          majliss: { nom: "Cette porte", pages: ["Cette porte-là ne s'ouvre pas pendant une visite."] },
          rihla: { nom: "Cette porte", pages: ["Cette porte-là ne s'ouvre pas pendant une visite."] },
          rahba: { nom: "Cette porte", pages: ["Cette porte-là ne s'ouvre pas pendant une visite."] },
          qlil: { nom: "L'atelier métier", pages: ["L'établi s'ouvre demain."] }
        },
        sandouq: { nom: "Le coffre des sites", pages: [
          "Le coffre ne s'ouvre plus pour toi : une page, c'est ce qu'on donne à un visiteur — et c'est déjà beaucoup.",
          "Les autres sites attendent ceux qui rejoignent la maison : chaque nouvel arrivant les retrouve, un par un, pendant ses quarante jours."
        ] },
        carte: function (titre, reponse) {
          return { nom: "Une lumière se rallume", pages: [
            "« " + String(titre || "") + " » — " + String(reponse || "") + ".",
            "Regarde la cour : une lumière vient de se rallumer. C'est exactement ce que font nos nouveaux pendant leurs quarante jours.",
            "La carte du site est à toi : elle est dans « Mes cartes de site », à côté de celles que tu ne peux pas encore ouvrir."
          ] };
        },
        collection: function (gagnees, total) {
          var g = Math.max(0, Math.floor(Number(gagnees) || 0)), t = Math.max(0, Math.floor(Number(total) || 0));
          return g === 0 ? "Une page par site attend aux archives. Tu n'en as retrouvé aucune : le coffre t'attend."
            : "Tu en as " + g + " sur " + t + ". Les autres attendent ceux qui rejoignent la maison.";
        },
        murEfface: null,
        carnet: function (etat, aujourdhui) {
          var Dy = root.ZWJ && root.ZWJ.dayf, j = Dy ? Dy.jour(etat, aujourdhui) : 1;
          return (j > 3 ? "Ta visite est finie, et la porte reste ouverte.\n" : "Jour " + j + " sur 3 de ta visite. On ne te demande rien.\n") +
            "Ce que tu as fait ici ne part nulle part sans toi. Le troisième jour, Ba Lahcen te pose une question — et si tu veux postuler, c'est toi qui décides d'y joindre ta visite.";
        }
      }
    }
  };

  // Les mots de l'écran pour le visiteur (le texte exact du moteur → celui de Nareva).
  M.vocabulaire = Object.assign({}, M.vocabulaire || {}, {
    "Dayf": "Visiteur",
    "Dayf — l'invité": "Ta visite",
    "Ach jabek ? — les trois portes": "La question de Ba Lahcen",
    "Le mou'allim": "Ba Lahcen",
    "Qu'est-ce qui t'amène ? Réponds ce qui est vrai : les trois réponses ouvrent une porte, et aucune ne ferme celle-ci.":
      "Qu'est-ce qui t'amène ? Réponds ce qui est vrai : les trois réponses sont bonnes, et aucune ne ferme la porte."
  });

  // ---- Le Fil : des nouvelles de DÉMONSTRATION (la vie de la maison, jamais un chiffre) ----
  if (!Array.isArray(C.fil)) C.fil = [
    { cle: "bienvenue-rentree", titre: "Bienvenue à la promotion de la rentrée",
      texte: "Douze nouveaux arrivants rejoignent la maison ce mois-ci, au siège et sur les sites. Si tu en croises un dans la cour, salue-le : c'est son premier Réseau.",
      date: "2026-09-22", site: "maison", epingle: "oui" },
    { cle: "moment-securite-hauteur", titre: "Moment sécurité de lundi : le travail en hauteur",
      texte: "Cette semaine, chaque équipe ouvre sa réunion sur le travail en hauteur : le harnais, le point d'ancrage, et la règle qui ne se discute pas — on ne monte jamais seul.",
      date: "2026-09-21", site: "maison", epingle: "non" },
    { cle: "parrains-recherches", titre: "On cherche des parrains et des marraines d'intégration",
      texte: "Tu es dans la maison depuis plus d'un an ? Accompagne un nouveau pendant ses quarante jours : un café par semaine, et les réponses aux questions qu'il n'ose pas poser. Dis-le à ton contact RH.",
      date: "2026-09-15", site: "maison", epingle: "non" },
    { cle: "tarfaya-accueil-securite", titre: "Tarfaya : l'accueil sécurité passe au jeudi",
      texte: "À partir de ce mois-ci, l'accueil sécurité des nouveaux du parc se tient le jeudi matin. Présente-toi à la base vie avec tes protections.",
      date: "2026-09-10", site: "Tarfaya", epingle: "non" },
    { cle: "journee-sites", titre: "Bientôt : la journée des sites",
      texte: "Une journée pour que chacun découvre un site qu'il ne connaît pas. Le programme arrive au Fil.",
      date: "2026-10-06", site: "maison", epingle: "non" }
  ];

  // ---- La mémoire des anciens : trois pages d'EXEMPLE (anciens de fiction) ----
  if (!Array.isArray(C.memoires)) C.memoires = [
    { cle: "la-limite-de-vent", titre: "La limite de vent est une limite, pas un objectif",
      auteur: "Brahim", metier: "Technicien de maintenance éolienne", site: "Tarfaya", annees: "16 ans de maison",
      recit: "Un matin de printemps, le vent était juste sous la limite qui autorise à monter dans la nacelle. Toute l'équipe voulait finir l'intervention avant le week-end. J'ai regardé la prévision de l'après-midi : le vent devait forcir. On est descendus, on a attendu le lundi. Le vent a dépassé la limite une heure après.",
      lecon: "Une limite dit quand il est interdit de monter, pas quand c'est une bonne idée. Regarde la tendance, pas seulement le chiffre du moment.",
      question: "Le vent est juste sous la limite, mais la prévision annonce qu'il forcit dans l'heure. Que fait-on ?",
      options: ["On monte vite pour finir avant", "On attend et on replanifie", "On monte avec un collègue de plus", "On demande au collègue de la salle de contrôle de surveiller"],
      bonne: 1,
      explication: "On replanifie. La limite est un plafond : quand la tendance va vers elle, on ne s'en approche pas." },
    { cle: "une-valeur-qui-monte", titre: "Une valeur dans la norme qui monte vaut plus qu'une valeur haute qui ne bouge pas",
      auteur: "Fatima-Zahra", metier: "Ingénieure d'exploitation", site: "Safi", annees: "11 ans de maison",
      recit: "Sur une pompe, la vibration était dans la norme depuis des mois. Personne ne s'inquiétait. En relisant la courbe d'un trimestre, j'ai vu qu'elle montait un peu chaque semaine. On a ouvert : un roulement commençait à fatiguer. Changé à l'arrêt programmé, sans casse et sans perte de production.",
      lecon: "Lis les courbes, pas seulement les seuils. Ce qui dérive lentement se voit sur trois mois, jamais sur une journée.",
      question: "Une mesure reste dans la norme, mais monte un peu chaque semaine depuis trois mois. C'est…",
      options: ["Sans importance tant qu'elle est dans la norme", "Un signal à suivre et à comprendre", "Une erreur du capteur, forcément", "Un sujet pour l'arrêt de l'an prochain"],
      bonne: 1,
      explication: "Une dérive régulière est un signal : elle dit que quelque chose change. On la comprend avant qu'elle n'atteigne le seuil." },
    { cle: "le-cahier-de-quart", titre: "Ce qu'on écrit au cahier de quart, c'est pour celui qui arrive",
      auteur: "Hassan", metier: "Chef de quart, dessalement", site: "Dakhla", annees: "9 ans de maison",
      recit: "Sur une unité de dessalement, la pression à travers les membranes monte doucement quand elles s'encrassent. Un quart seul ne le voit presque pas. J'ai pris l'habitude de noter chaque petite dérive au cahier, même quand tout va bien. C'est le quart suivant, en lisant, qui a vu la tendance, et le nettoyage a été lancé à temps.",
      lecon: "Le cahier de quart n'est pas un rapport pour le chef : c'est une lettre à celui qui te relève. Une petite dérive notée aujourd'hui, c'est une panne évitée demain.",
      question: "Pour qui écrit-on d'abord le cahier de quart ?",
      options: ["Pour le chef de site", "Pour l'audit", "Pour l'équipe qui prend la relève", "Pour soi-même"],
      bonne: 2,
      explication: "Pour celui qui arrive : c'est lui qui verra la tendance que ton quart seul ne voyait pas." }
  ];
})(typeof window !== "undefined" ? window : globalThis);
