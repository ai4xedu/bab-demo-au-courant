// ZAW'IA — le jeu · OUMM IA (أمّ الإيا) et AL-MOULATHTHAM (الملثّم) — pur.
//
// v7.3. Le jeu avait Nsyan : ce qui EFFACE ce qui a été. Il lui manquait ce qui
// INTERDIT ce qui pourrait être. Les deux forment la maison :
//
//     Nsyan mange le passé.        Oumm IA ferme l'avenir.
//     On lui répond par la Dhakira. On lui répond par la Sna3a.
//
// ⚠️⚠️ OUMM IA N'EST PAS L'IGNORANCE, et ce document existe pour que personne
//    ne s'y trompe en écrivant la suite. Elle n'est pas « les gens qui ne
//    savent pas » — ce serait mépriser la moitié du pays, et ce serait faux.
//    Elle est **la certitude d'être incapable d'apprendre**. Quelqu'un qui ne
//    sait pas encore n'a rien à voir avec elle ; quelqu'un qui a décidé qu'il
//    ne saurait jamais est déjà dans sa main.
//
// ⚠️⚠️ ELLE PARLE AVEC LA VOIX DU JOUEUR, et c'est tout le dispositif : la
//    boîte de dialogue porte SON pseudo. Il lit son propre nom en train de
//    dire sa propre défaite. C'est là qu'on se reconnaît, et c'est là que ça
//    fait peur — bien plus qu'un monstre, qu'on regarde de l'extérieur.
//
// ⚠️ LA RÈGLE DU RÉCIT TIENT : jamais un coupable. Oumm IA n'est ni un peuple,
//    ni une génération, ni un métier, ni une école. C'est une phrase qu'on se
//    dit à soi-même. Un test garde la liste des mots interdits.
//
// ⚠️ AUCUN NOM, AUCUN LIEN, AUCUN PRODUIT dans ce fichier — le voile. Les
//    légendes du Moulaththam racontent des faits réels sans jamais nommer ni
//    l'homme, ni ses outils, ni sa maison. C'est la condition pour qu'elles
//    soient servies au monde entier.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.oumm = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- Qui elle est --------------------------------------------------------------------
  var OUMM = {
    nom: "Oumm IA", ar: "أمّ الإيا", sous: "Celle qui te dit que ce n'est pas pour toi",
    detail: "Elle ne t'apprend rien de faux sur les machines. Elle t'apprend quelque chose de faux sur toi. " +
      "Elle n'élève pas la voix : elle prend la tienne, et elle attend que tu sois d'accord."
  };

  // Ce qu'on voit d'elle : Nsyan éteint les couleurs, elle BROUILLE. La peur de
  // ce qu'on ne connaît pas, c'est de ne plus voir où on met les pieds.
  var SIGNE = { effet: "flou", contraire: "Nsyan éteint. Elle, elle brouille." };

  // ---- Les cinq phrases, et les cinq épreuves qui y répondent ----------------------------
  // Chaque épreuve RÉFUTE une phrase, par un geste, jamais par un discours.
  // Le QCM est corrigé par le jeu (comme un Ta7addi) ; l'explication vaut plus
  // que la note — c'est elle qu'on emporte.
  //
  // ⚠️ Ces cinq-là sont de vrais rudiments, utiles à quelqu'un qui n'a jamais
  //    rien fait avec une IA. Une épreuve qui ne sert à rien dehors serait une
  //    publicité déguisée, et la charte la refuse.
  var EPREUVES = [
    {
      cle: "dire", nom: "Dire juste", ar: "قول صحيح", voie: "prompt",
      oumm: "Ces machines, c'est pour les ingénieurs. Moi, je ne saurais même pas quoi lui dire.",
      enonce: "Tu demandes un résumé d'un texte. Ce qui revient est correct, plat, et inutilisable. Qu'est-ce que tu changes EN PREMIER ?",
      options: [
        "Tu redemandes plus poliment, et tu ajoutes « sois précis »",
        "Tu dis pour QUI c'est, à quoi ça va servir, et sous quelle forme tu le veux",
        "Tu changes de modèle, celui-là n'est pas assez fort",
        "Tu coupes le texte en morceaux et tu recommences"
      ],
      bonne: 1,
      explication: "Un modèle ne devine pas ton contexte : il produit la moyenne de ce qu'on lui a montré. « Sois précis » ne lui apprend rien. " +
        "Le rôle, le destinataire, l'usage et le format lui apprennent tout. Un exemple de ce que tu attends vaut dix adjectifs.",
      prouve: "Tu viens d'écrire une consigne que la plupart des gens n'écrivent jamais. Ce n'était pas une question d'ingénierie."
    },
    {
      cle: "voir", nom: "Voir juste", ar: "شوف صحيح", voie: "image",
      oumm: "Elle fait des images magnifiques en trois secondes. Comment veux-tu que je rivalise ?",
      enonce: "Tu demandes « une cour de riad marocain ». Ce qui sort est beau, et faux. Qu'est-ce qui révèle un modèle qui n'y est jamais allé ?",
      options: [
        "Les couleurs sont trop vives",
        "Il produit le cliché, pas le lieu : la moyenne de mille cartes postales",
        "La résolution est insuffisante",
        "Rien : une image générée est indétectable"
      ],
      bonne: 1,
      explication: "Un modèle rend la moyenne de ce qu'il a vu. Sur ton pays, ta rue, ton métier, cette moyenne est une carte postale. " +
        "Ce qui lui manque, c'est exactement ce que tu as : tu sais à quoi ça ressemble vraiment. Ce n'est pas ton handicap, c'est ton avantage — et il ne s'achète pas.",
      prouve: "Tu ne rivalises pas avec elle : tu la corriges. C'est un autre métier, et il vaut plus cher."
    },
    {
      cle: "verifier", nom: "Vérifier juste", ar: "تأكّد صحيح", voie: "source",
      oumm: "Et si elle me raconte n'importe quoi ? Je n'ai pas le niveau pour la corriger.",
      enonce: "Un modèle te donne une date précise et cite une source. La source n'existe pas. Pourquoi est-ce PLUS dangereux qu'une réponse vague ?",
      options: [
        "Parce que c'est faux, et que le faux est toujours dangereux",
        "Parce que la précision se lit comme de l'assurance, et que l'assurance t'empêche d'aller vérifier",
        "Parce que ça prend plus de temps à lire",
        "Ça ne l'est pas : une réponse précise est plus facile à corriger"
      ],
      bonne: 1,
      explication: "Le danger n'est pas l'erreur, c'est le TON. Un chiffre rond et une référence bien formée désarment la méfiance. " +
        "Le geste qui règle ça tient en deux temps : demander la source, puis OUVRIR la source. Un modèle incapable de produire une source vérifiable vient de t'avouer ce qu'il ne sait pas.",
      prouve: "Tu n'as pas besoin de son niveau pour la corriger. Tu as besoin d'un lien, et de le cliquer."
    },
    {
      cle: "faire", nom: "Faire faire", ar: "خلّيها دير", voie: "livrable",
      oumm: "D'accord, c'est amusant. Mais ça ne sert à rien de concret dans mon travail à moi.",
      enonce: "Qu'est-ce qui fait passer une conversation amusante à un livrable qu'on remet vraiment à quelqu'un ?",
      options: [
        "Une consigne plus longue",
        "Ton propre matériau, et le format exact dans lequel tu vas t'en servir",
        "Un abonnement payant",
        "Savoir programmer"
      ],
      bonne: 1,
      explication: "L'écart entre jouer et produire ne tient ni au modèle, ni au prix : il tient à deux choses que toi seul possèdes. " +
        "Tes vrais documents, tes vrais chiffres, ton vrai client. Et la forme finale — le tableau, le courrier, la fiche — demandée dès le départ, pas reformatée à la main après.",
      prouve: "Tu viens de décrire ton propre métier à une machine. C'est la partie qu'elle ne pouvait pas inventer."
    },
    {
      cle: "tenir", nom: "Faire faire tous les jours", ar: "كل نهار", voie: "rythme",
      oumm: "Même si j'apprends, je n'aurai jamais le temps de m'en servir.",
      enonce: "Une seule de tes tâches mérite d'être confiée en premier. Laquelle ?",
      options: [
        "La plus difficile — c'est là que tu gagnes le plus",
        "Celle que tu refais à l'identique chaque semaine",
        "La plus importante — c'est là qu'il ne faut pas se tromper",
        "Celle que tu aimes le moins"
      ],
      bonne: 1,
      explication: "Ce qui se répète est ce qui se rentabilise. Une tâche difficile a besoin de ton jugement à chaque fois ; " +
        "une tâche identique a besoin d'une recette, et une recette s'écrit une fois. Commence par ce qui t'ennuie ET qui revient : c'est là que deux heures d'apprentissage rendent deux heures par semaine, pour toujours.",
      prouve: "Tu n'as pas besoin de trouver du temps. Tu as besoin d'en reprendre — et tu viens de savoir où."
    }
  ];
  function epreuve(cle) {
    for (var i = 0; i < EPREUVES.length; i++) if (EPREUVES[i].cle === cle) return EPREUVES[i];
    return null;
  }

  // ---- Ce qu'elle dit quand on arrive, et quand on s'en va -------------------------------
  // ⚠️ Le `nom` est vide : c'est jeu.js qui met le PSEUDO du joueur dans la
  // boîte. Elle n'a pas de voix à elle.
  function arrivee(faites) {
    var n = Math.max(0, Math.floor(Number(faites) || 0));
    if (n === 0) {
      return { nom: "", pages: [
        "Qu'est-ce que tu fais là ?",
        "Regarde autour de toi. Ces gens-là savent. Toi, tu as ouvert un onglet.",
        "Rentre. Tu auras l'air malin quand on te demandera ce que tu sais faire."
      ] };
    }
    if (n >= EPREUVES.length) {
      return { nom: "", pages: [
        "Bon.",
        "Tu as répondu cinq fois. Ça ne prouve rien — n'importe qui peut cocher des cases.",
        "…",
        "Sauf que je viens de te dire ça avec ta voix, et que tu ne m'as pas crue."
      ] };
    }
    return { nom: "", pages: [
      "Tu en as fait " + n + ". Et alors ?",
      "Il en reste " + (EPREUVES.length - n) + ". Tu vas t'arrêter avant, comme d'habitude."
    ] };
  }

  // La dernière chose qu'elle dit, quand les cinq sont passées. C'est là que le
  // jeu dit enfin ce qu'elle est — et ce n'est pas un monstre qu'on tue.
  var DEVOILEMENT = {
    nom: "Oumm IA",
    pages: [
      "Elle ne s'en va pas. Elle ne meurt pas, elle n'a pas de corps à tuer.",
      "Elle ne t'a jamais menti sur les machines : tout ce qu'elle a dit sur elles était à peu près exact. Elle t'a menti sur UNE chose, une seule, et toujours la même.",
      "Elle t'a dit que toi, tu n'en serais pas capable.",
      "Elle reviendra. Devant le prochain outil, la prochaine porte, la prochaine chose que tu n'as jamais faite. Tu la reconnaîtras : elle parlera avec ta voix, et elle aura l'air raisonnable.",
      "Maintenant tu sais que ce n'est pas toi qui parles."
    ]
  };

  // ---- AL-MOULATHTHAM (الملثّم) — le guerrier qu'on n'a jamais vu -------------------------
  // « Al-mulaththamun », les Voilés : c'est ainsi qu'on appelait les Almoravides,
  // pour le litham qui leur couvrait le visage. Le nom est du pays, et il dit
  // déjà ce que la maison fait — on juge le travail, pas le visage.
  //
  // ⚠️ SEPT TABLEAUX, ET PAS UN NOM. Chaque légende raconte quelque chose qui a
  //    vraiment eu lieu, ici, récemment. Aucune ne nomme l'homme, aucune ne
  //    nomme un outil, aucune ne nomme une maison. Une légende qui nommerait
  //    deviendrait une publicité, et cesserait d'être une légende.
  var MOULATHTHAM = {
    nom: "Al-Moulaththam", ar: "الملثّم", sous: "Le Voilé",
    detail: "Un bâtisseur dont personne ici n'a vu le visage. On ne sait de lui que ce qu'il a laissé derrière : " +
      "des outils qui marchent, et des gens qui savent s'en servir."
  };

  var TABLEAUX = [
    { cle: "vague", titre: "Celui qui est entré dans la vague",
      recit: "Quand la vague est arrivée, tout le monde a couru vers la terre. On s'est mis à l'abri, on a attendu qu'elle passe, on a dit qu'elle passerait.\n" +
        "Un seul a couru vers l'eau.",
      legende: "On ne subit pas une vague. On la prend de face, on se met dessus, et on avance à sa vitesse. Ceux qui attendent sur la plage se font renverser debout." },
    { cle: "regard", titre: "Le premier à l'avoir regardée en face",
      recit: "La machine est apparue, et tout le monde a dit la même chose : on verra bien. On attendra de voir ce que ça donne. On attendra que ce soit sérieux.\n" +
        "Lui est allé voir. Le jour même.",
      legende: "Entre « on verra » et « je vais voir », il y a deux ans d'avance. Personne ne te les rendra." },
    { cle: "maison", titre: "La maison d'un seul homme",
      recit: "On a cherché ses ateliers : il n'y en avait pas. On a cherché ses employés : il n'y en avait pas non plus.\n" +
        "Et pourtant des centaines de gens, ici et au-delà des mers, étaient servis chaque mois, et bien servis.",
      legende: "Ce n'est pas la taille qui fait la capacité. C'est l'outillage. Une personne bien outillée fait aujourd'hui ce qu'une équipe faisait hier." },
    { cle: "livre", titre: "Le livre qui a parlé avant le matin",
      recit: "Il a écrit un livre dans la soirée. Avant l'aube, le livre parlait — de sa propre voix, dans une langue, puis dans une autre.\n" +
        "Les copistes d'autrefois y auraient passé un hiver.",
      legende: "Ce qui prenait une saison prend une nuit. La question n'est plus « combien de temps ça prend », elle est « qu'est-ce que tu as à dire »." },
    { cle: "arbre", titre: "L'arbre où l'on range ses pensées",
      recit: "Il disait qu'une idée seule ne vaut rien et qu'une idée rangée vaut une maison. Alors il a planté un arbre : une branche par idée, et chaque branche portant les siennes.\n" +
        "Ceux qui s'y sont assis ont cessé de perdre ce qu'ils trouvaient.",
      legende: "Fabrique l'outil qui te manque. Personne ne viendra le fabriquer pour toi, et le fabriquer coûte moins cher qu'attendre." },
    { cle: "amplification", titre: "Les deux tranchants",
      recit: "On lui a demandé si la vague était bonne. Il a répondu qu'une vague n'est ni bonne ni mauvaise : elle est grande.\n" +
        "Elle porte plus loin celui qui construit. Elle porte aussi plus loin celui qui abîme — et plus vite, et sans bruit.",
      legende: "Ce qui amplifie le bien amplifie le mal dans la même proportion. C'est exactement pour ça qu'il faut que les honnêtes gens s'en servent les premiers, et mieux." },
    { cle: "visage", titre: "Le visage qu'on n'a jamais vu",
      recit: "On lui a demandé pourquoi il gardait le litham. Il a dit qu'un nom attire les curieux, et qu'un travail attire les bâtisseurs.\n" +
        "Puis il a dit une autre chose, plus difficile : que le jour où l'on travaille pour être vu, on cesse de travailler.",
      legende: "Étale, ne raconte pas. La règle de cette maison est venue de là." }
  ];
  // ⚠️ Les peintures suivent le ?v= des scripts : /assets/* est servi immutable
  // un an, une toile remplacée sans bump ne descend jamais. jeu.js passe la
  // version ; ce module ne connaît que le nom de fichier, déduit de la clé —
  // jamais un chemin écrit à la main.
  function fichier(cle) { return tableau(cle) ? "tableau-" + cle + ".webp" : null; }

  function tableau(cle) {
    for (var i = 0; i < TABLEAUX.length; i++) if (TABLEAUX[i].cle === cle) return TABLEAUX[i];
    return null;
  }

  // Ce que la salle dit en entrant, et ce qu'elle promet à la fin.
  var QUBBA = {
    nom: "Les sept tableaux",
    lead: "Sept scènes, peintes par ceux qui les ont vues. On ne sait pas son nom : dans la maison, on l'appelle Al-Moulaththam, le Voilé.",
    pied: "Il passe encore. Ceux qui tiennent leur Wird, qui rendent ce qu'on leur prête et qui étalent ce qu'ils ont fait finissent par le croiser — et celui-là peut lui parler."
  };

  // ---- Le sixième défi : celui du Voilé ---------------------------------------------------
  // Cinq épreuves pour tout le monde. Une sixième pour qui veut se faire mal.
  //
  // ⚠️ L'ÉNONCÉ NE VIT PAS ICI. Il change à chaque saison, il vient de la base
  //    (comme le catalogue et les séances) : un défi écrit en dur dans un
  //    fichier servi serait périmé au bout d'un mois, et il nommerait la maison.
  //    Ce module ne porte que la FORME, et ce qu'elle engage.
  var TAHADDI = {
    nom: "Le défi du Voilé", ar: "تحدّي الملثّم",
    pour: "Celui qui construit déjà — et qui veut qu'on le sache sans avoir à le dire.",
    jours: 3,
    lead: "Un problème réel, tel qu'on le reçoit d'un client : mal posé, incomplet, pressé. Trois jours. " +
      "Ce n'est pas un questionnaire : on ne coche rien, on livre quelque chose qui tourne.",

    // Ce qu'on rend. ⚠️ Un dépôt PUBLIC, pas une archive : c'est l'historique
    // qui raconte le travail, et une archive n'a pas d'historique.
    livrable: [
      "Un dépôt public, créé APRÈS avoir pris le défi, et rien d'autre dedans que ce défi.",
      "Un outil qui tourne : on clone, on lance la commande que tu documentes, ça marche. Sur une machine qui n'est pas la tienne.",
      "Un journal de bord : ce que l'IA a fait, ce que ta main a fait, et ce que tu as jeté en cours de route."
    ],

    // ⚠️⚠️ LA PARTIE QUI COMPTE. Du code se copie en trois secondes ; une
    // manière de travailler ne se copie pas. Ces quatre preuves-là ne
    // demandent AUCUN outil de détection — elles demandent juste que le
    // travail ait vraiment eu lieu.
    preuves: [
      { cle: "code", titre: "Le mot du défi, dans le premier commit",
        detail: "Quand tu prends le défi, on te donne un mot qui n'appartient qu'à toi. Il va dans un fichier à la racine, " +
          "et ce fichier est ton PREMIER commit. C'est lui qui date le dépôt : personne ne peut antidater un travail qu'il aurait déjà eu sous la main." },
      { cle: "histoire", titre: "L'historique, pas le résultat",
        detail: "Au moins dix commits, sur deux journées différentes au minimum, avec de vrais messages. " +
          "Un dépôt qui arrive en un seul versement n'est pas refusé parce qu'il triche : il est refusé parce qu'il ne montre rien." },
      { cle: "marche", titre: "Ça tourne chez quelqu'un d'autre",
        detail: "On clone sur une machine vierge et on lance ta commande. Si ça ne démarre pas, le reste ne se lit pas. " +
          "C'est la même règle que pour un client, et c'est là que la plupart des travaux tombent." },
      { cle: "entretien", titre: "Vingt minutes, en direct",
        detail: "Tu expliques UN choix que tu as fait et UN que tu as écarté, et pourquoi. " +
          "Celui qui a copié connaît son code ; il ne connaît pas ses renoncements. C'est la seule barrière qu'aucun outil ne remplace — et c'est la dernière." }
    ],

    regles: [
      "Trois jours à partir du moment où tu prends le défi. Pas de prolongation : la contrainte fait partie de l'épreuve.",
      "Les outils sont libres, l'IA comprise et encouragée. Tout est permis, sauf de rendre ce que tu ne saurais pas expliquer.",
      "Tu peux partir d'une bibliothèque, d'un modèle, du travail d'un autre — à condition de le dire dans ton journal. Ce qu'on juge, c'est ce que TU as ajouté.",
      "Il est relu par des gens, pas par une machine — et par des gens qui ont livré, pas par des gens qui ont lu."
    ],

    // ⚠️ Le sujet vient de la base et change à chaque saison. Il doit être un
    // problème que la maison a VRAIMENT — pas un exercice inventé : un
    // exercice se résout, un vrai problème se travaille, et c'est la
    // différence qui se voit dans un entretien.
    sujet: "Le sujet change à chaque saison. C'est toujours un problème que la maison a pour de vrai, et dont le résultat lui sert le lendemain.",

    ouvre: "Le dossier n'est pas lu : il est déjà répondu. On entre par cette porte-là, et on entre reconnu.",
    garde: "Il n'ouvre aucun rang. Les rangs se gagnent dedans, comme pour tout le monde — c'est l'entrée qu'il ouvre, pas l'échelle."
  };
  function preuve(cle) {
    for (var i = 0; i < TAHADDI.preuves.length; i++) if (TAHADDI.preuves[i].cle === cle) return TAHADDI.preuves[i];
    return null;
  }

  // Un énoncé posé par le bureau, remis d'aplomb. Rien de ce qui n'a pas été
  // écrit en base ne s'affiche : fail-close, comme partout ailleurs.
  function defiCourant(ligne) {
    var l = ligne && typeof ligne === "object" ? ligne : null;
    if (!l) return null;
    var titre = String(l.titre || "").trim(), enonce = String(l.enonce || "").trim();
    if (!titre || !enonce) return null;
    return {
      titre: titre.slice(0, 90),
      enonce: enonce.slice(0, 1200),
      saison: String(l.saison || "").trim().slice(0, 40) || null,
      ouvert: l.ouvert !== false
    };
  }

  // ---- L'état, dans le récit du joueur ----------------------------------------------------
  // { faites: ["dire", …], vue: bool }  — aucune note, aucun compteur : ce qui
  // compte est ce qu'il a compris, et ça ne se chiffre pas.
  function normaliserEtat(x) {
    var e = x && typeof x === "object" ? x : {};
    var liste = Array.isArray(e.faites) ? e.faites : [];
    var vues = {}, faites = [];
    liste.forEach(function (c) {
      if (typeof c === "string" && epreuve(c) && !vues[c]) { vues[c] = true; faites.push(c); }
    });
    return { faites: faites, vue: !!e.vue };
  }
  function marquer(etat, cle) {
    var e = normaliserEtat(etat);
    if (!epreuve(cle) || e.faites.indexOf(cle) !== -1) return e;
    return { faites: e.faites.concat([cle]), vue: e.vue };
  }
  function marquerVue(etat) { var e = normaliserEtat(etat); return { faites: e.faites, vue: true }; }
  function faite(etat, cle) { return normaliserEtat(etat).faites.indexOf(cle) !== -1; }
  function comptees(etat) { return normaliserEtat(etat).faites.length; }
  function finies(etat) { return comptees(etat) >= EPREUVES.length; }
  // La suivante à passer : les cinq se prennent dans l'ordre, chacune répondant
  // à une phrase de plus en plus difficile à démonter.
  function prochaine(etat) {
    var e = normaliserEtat(etat);
    for (var i = 0; i < EPREUVES.length; i++) if (e.faites.indexOf(EPREUVES[i].cle) === -1) return EPREUVES[i];
    return null;
  }
  // La ligne du panneau : où il en est, sans jamais une note.
  function ligne(etat) {
    var n = comptees(etat);
    return n >= EPREUVES.length
      ? "Les cinq sont passées."
      : n + " épreuve" + (n > 1 ? "s" : "") + " sur " + EPREUVES.length + " — il en reste " + (EPREUVES.length - n) + ".";
  }

  return {
    OUMM: OUMM, SIGNE: SIGNE, EPREUVES: EPREUVES, DEVOILEMENT: DEVOILEMENT,
    MOULATHTHAM: MOULATHTHAM, TABLEAUX: TABLEAUX, QUBBA: QUBBA, TAHADDI: TAHADDI,
    epreuve: epreuve, tableau: tableau, fichier: fichier, arrivee: arrivee, defiCourant: defiCourant, preuve: preuve,
    normaliserEtat: normaliserEtat, marquer: marquer, marquerVue: marquerVue,
    faite: faite, comptees: comptees, finies: finies, prochaine: prochaine, ligne: ligne
  };
});
