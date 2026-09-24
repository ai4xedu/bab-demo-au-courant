// ZAW'IA — le jeu · LES TA7ADDI (purs : ni DOM, ni réseau, ni canvas).
//
// L'axe TECHNIQUE de la notation : ce que le joueur sait faire avec l'IA.
// Deux familles, et elles ne se notent pas de la même façon :
//
//   maison  — les défis de la maison, écrits ici, corrigés par le jeu. Une
//             bonne réponse est une bonne réponse : personne n'a besoin d'être
//             là pour l'attester. C'est ce qui rend l'axe jouable seul, le soir.
//   sponsor — les Ta7addi d'entreprise : un vrai problème apporté par un
//             client, un livrable, un jury. Le jeu ne les corrige PAS et n'en
//             invente aucun : il les affiche quand la maison en ouvre un, et
//             les points viennent d'une ATTESTATION (le bureau, sur le
//             livrable remis), comme le M39ol vient du témoin.
//
// ⚠️ Un Ta7addi ne donne JAMAIS de M39ol ni de rang : la technique n'achète
//    pas la place dans la maison. Elle se lit sur le carnet, à côté.
// ⚠️ Le voile (ZAWIA-VOILE.md) s'applique : la maison ne se nomme pas.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.tahaddi = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var SNA3A_DEFI = 10;          // un défi de la maison
  var BONUS_PREMIER_COUP = 5;   // …et cinq de plus si la première réponse est la bonne

  // ---- Les défis de la maison ------------------------------------------------------
  // Trois par voie. Chacun a une bonne réponse et une explication qui enseigne
  // — c'est l'explication qui fait le travail, la note ne fait que la révéler.
  // Tous les énoncés sont des situations de travail réelles, pas des devinettes.
  var TAHADDI = [
    /* ---------------- dire juste : le prompt ---------------- */
    {
      cle: "format-oublie", voie: "prompt", titre: "Le format qu'on oublie",
      enonce: "Tu dois sortir, de 200 e-mails de clients, une liste exploitable dans un tableur. Quel prompt te la donne du premier coup ?",
      options: [
        "« Analyse ces e-mails et dis-moi ce qui en ressort. »",
        "« Pour chaque e-mail : nom, société, demande en 10 mots, urgence (haute/moyenne/basse). Réponds en CSV, une ligne par e-mail, sans autre texte. »",
        "« Fais-moi un résumé détaillé et professionnel de ces e-mails, sois exhaustif. »",
        "« Tu es un expert en relation client avec 20 ans d'expérience. Analyse ces e-mails. »"
      ],
      bonne: 1,
      explication: "Le format de sortie est la moitié du prompt. Dire les colonnes, la longueur et « sans autre texte » transforme une réponse à relire en un fichier à ouvrir. Le rôle d'expert, lui, ne change presque rien quand la tâche est précise."
    },
    {
      cle: "resume-pour-qui", voie: "prompt", titre: "Un résumé, pour qui ?",
      enonce: "« Résume ce contrat. » La réponse est correcte et inutilisable. Qu'est-ce qui manque au prompt ?",
      options: [
        "Le mot « s'il te plaît » et un ton plus poli",
        "Un modèle plus puissant",
        "Le destinataire, la décision à prendre, et la longueur",
        "Le contrat en entier plutôt qu'un extrait"
      ],
      bonne: 2,
      explication: "Un résumé n'existe pas dans l'absolu : il existe pour quelqu'un qui doit décider quelque chose. « En 5 puces, pour un dirigeant qui doit dire oui ou non à la signature, avec les risques et les engagements de durée » donne un autre texte — le bon."
    },
    {
      cle: "un-exemple", voie: "prompt", titre: "Un exemple vaut dix consignes",
      enonce: "Tu veux que le modèle écrive tes descriptions produit dans TON style. Tu as déjà essayé six lignes de consignes, sans succès. Que fais-tu ?",
      options: [
        "Tu ajoutes six consignes de plus",
        "Tu colles deux ou trois descriptions que tu as écrites toi-même, et tu demandes la suivante dans le même esprit",
        "Tu écris « sois créatif et original »",
        "Tu répètes la consigne en majuscules"
      ],
      bonne: 1,
      explication: "Montrer bat décrire. Deux ou trois exemples réels — ce qu'on appelle le few-shot — portent le rythme, la longueur et le vocabulaire mieux que n'importe quelle liste d'adjectifs. C'est la Ferracha appliquée au prompt : on étale, on ne raconte pas."
    },

    /* ---------------- voir juste : l'image ---------------- */
    {
      cle: "cadrage", voie: "image", titre: "Le cadrage avant le style",
      enonce: "Tu veux une photo d'illustration : un artisan dans son atelier, pour la page d'accueil d'un site. Quel prompt d'image te rapproche le plus du résultat utilisable ?",
      options: [
        "« Un artisan magnifique, ultra réaliste, 8k, chef-d'œuvre, incroyable »",
        "« Artisan »",
        "« Un artisan de cinquantaine d'années travaille le cuir, plan moyen de trois quarts, lumière douce venant d'une fenêtre à gauche, atelier encombré en arrière-plan flou, photographie documentaire »",
        "« Fais-moi quelque chose de beau pour un site web »"
      ],
      bonne: 2,
      explication: "Sujet, cadrage, lumière, arrière-plan, intention : une image se commande comme on commande une photo à un photographe. Les mots « 8k » et « chef-d'œuvre » ne décrivent rien — ils remplissent le prompt sans le diriger."
    },
    {
      cle: "ce-que-limage-invente", voie: "image", titre: "Ce que l'image invente",
      enonce: "Un modèle te rend une belle image d'une devanture de boutique marocaine, avec une enseigne en arabe. Qu'est-ce que tu vérifies EN PREMIER avant de la publier ?",
      options: [
        "La résolution du fichier",
        "Le texte de l'enseigne, lettre par lettre",
        "Le nom du modèle utilisé",
        "Que l'image ne ressemble à aucune photo existante"
      ],
      bonne: 1,
      explication: "Le texte est ce que les modèles d'image ratent le plus, et l'arabe encore plus que le latin : lettres inventées, mots sans sens, ligatures cassées. Une enseigne illisible transforme une jolie image en faute publique. On lit toujours le texte d'une image générée avant de la publier."
    },
    {
      cle: "meme-personnage", voie: "image", titre: "Le même personnage, deux fois",
      enonce: "Tu as besoin de six visuels avec le MÊME personnage. Le premier est parfait, les cinq suivants ne lui ressemblent pas. Quelle est la bonne façon de t'en sortir ?",
      options: [
        "Écrire « même personnage que tout à l'heure » — le modèle se souvient",
        "Générer cent images et garder les six qui se ressemblent le plus",
        "Figer une description précise et réutilisable du personnage, et repartir de l'image retenue comme référence",
        "Augmenter la résolution à chaque essai"
      ],
      bonne: 2,
      explication: "Un modèle d'image ne se souvient de rien entre deux demandes. La cohérence se fabrique : une fiche de personnage écrite une fois — âge, visage, vêtement, couleurs — plus l'image validée donnée en référence. Le hasard, lui, ne tient pas six visuels."
    },

    /* ---------------- vérifier juste : la source ---------------- */
    {
      cle: "citation-trop-belle", voie: "savoir", titre: "La citation trop belle",
      enonce: "Un modèle appuie sa réponse sur « une étude de 2023 publiée dans une grande revue » avec un titre, des auteurs et un chiffre précis. Quel est le signal qui doit t'alerter en premier ?",
      options: [
        "Le chiffre est trop rond",
        "La réponse est trop longue",
        "La référence est parfaitement formatée mais tu n'arrives pas à la retrouver",
        "Le modèle a répondu trop vite"
      ],
      bonne: 2,
      explication: "Une référence inventée ressemble exactement à une vraie : c'est même sa définition. Le seul test est de la retrouver. Tant que tu n'as pas ouvert la source, tu n'as pas une source — tu as une phrase qui a la forme d'une source."
    },
    {
      cle: "date-sans-source", voie: "savoir", titre: "Une date sans source",
      enonce: "Tu demandes une date historique. Le modèle répond avec assurance, sans citer d'où ça vient. Que fais-tu avant de l'écrire dans un document qui sortira de chez toi ?",
      options: [
        "Tu reposes la même question dans une autre conversation ; si la réponse est identique, c'est bon",
        "Tu la vérifies dans une source que tu peux ouvrir et citer",
        "Tu demandes au modèle s'il est sûr — s'il dit oui, c'est bon",
        "Tu l'écris avec « environ » devant"
      ],
      bonne: 1,
      explication: "Deux réponses identiques d'un même modèle ne font pas deux témoins : c'est la même mémoire, deux fois. Et un modèle à qui l'on demande « tu es sûr ? » change souvent d'avis sans raison. Seule une source qu'on peut ouvrir tranche — c'est Nia w Amana : un chiffre qu'on n'a pas vérifié, on ne l'écrit pas."
    },
    {
      cle: "ce-qui-sort", voie: "savoir", titre: "Ce qui sort de la maison",
      enonce: "Tu dois faire résumer par une IA un dossier client qui porte des noms, des numéros de pièce d'identité et des montants. Quelle est la bonne façon de faire ?",
      options: [
        "Coller le dossier tel quel : la conversation est privée",
        "Remplacer noms et identifiants par des codes avant d'envoyer, garder la table de correspondance chez toi, et remettre les vrais noms à la fin",
        "Ne jamais utiliser d'IA sur un dossier client",
        "Coller le dossier, puis demander au modèle d'oublier"
      ],
      bonne: 1,
      explication: "Un modèle n'oublie pas sur commande, et « privé » décrit un réglage, pas une garantie que tu peux montrer à un client. La vraie question n'est pas cloud ou local : c'est QU'EST-CE QUI SORT du cabinet. Anonymiser avant, garder la clé de correspondance sur ta machine, remettre les noms après : tu gardes l'outil et tu ne confies rien. Refuser l'IA sur les dossiers, c'est se priver — et ça pousse les équipes à le faire en cachette, ce qui est pire."
    },
    {
      cle: "rag-faux", voie: "savoir", titre: "Le document était là, la réponse est fausse",
      enonce: "Tu as branché un assistant sur les 300 documents de ton entreprise. Il répond à côté sur une question dont la réponse EST dans un document. La cause la plus fréquente ?",
      options: [
        "Le modèle est trop petit",
        "Le document est trop récent",
        "Le passage utile n'a pas été retrouvé : découpage, vocabulaire différent de la question, ou document mal converti",
        "Il faut lui redemander plus poliment"
      ],
      bonne: 2,
      explication: "Dans ce genre de montage, la partie qui se trompe est presque toujours la RECHERCHE, pas la rédaction : un PDF scanné sans texte, un tableau aplati, un découpage qui coupe la phrase en deux, ou l'utilisateur qui dit « congés » là où le document dit « absences ». On débogue ce qui a été retrouvé avant d'accuser le modèle."
    },

    /* ---------------- v3.6 — les Ta7addi du Wird : un exercice RÉEL, puis la question ----------------
       Six de plus, deux par voie, posés par le Wird (wird.js) au fil des quarante jours.
       `exercice` : quinze minutes avec une IA, AVANT de répondre — l'établi
       l'affiche en premier. La question vérifie ce que l'exercice a fait voir. */
    {
      cle: "trois-lecteurs", voie: "prompt", titre: "Le même texte, trois lecteurs",
      exercice: "Prends un article ou un long e-mail. Demande à une IA de le résumer trois fois : pour ta mère, pour ton patron, pour un enfant de dix ans. Lis les trois côte à côte.",
      enonce: "Tu as fait résumer le même texte pour trois lecteurs différents. Qu'est-ce qui a le plus changé entre les trois versions ?",
      options: [
        "La longueur seulement — le reste est identique",
        "Le vocabulaire, ce qui est gardé et ce qui est laissé de côté",
        "Rien : le modèle a réécrit la même chose trois fois",
        "La langue, le modèle a traduit"
      ],
      bonne: 1,
      explication: "Un résumé choisit. Dire POUR QUI, c'est dire ce qui compte et ce qui peut tomber : le patron veut la décision et le risque, l'enfant veut l'histoire, ta mère veut savoir si ça va. Le même « résume » sans destinataire donne un texte moyen pour personne — c'est la leçon de « Un résumé, pour qui ? », vue de tes yeux."
    },
    {
      cle: "deuxieme-demande", voie: "prompt", titre: "La deuxième demande",
      exercice: "Demande quelque chose à une IA — un e-mail, un plan, un texte. La réponse n'est pas bonne du premier coup, elle ne l'est jamais. Au lieu de recommencer, dis-lui PRÉCISÉMENT ce qui ne va pas et ce que tu veux à la place. Deux fois de suite.",
      enonce: "La première réponse d'une IA n'est pas bonne. Quel est le geste le plus efficace, celui que tu viens d'essayer ?",
      options: [
        "Recommencer dans une conversation vide, avec un prompt plus long",
        "Dire précisément ce qui ne va pas, et ce que tu veux à la place",
        "Ajouter « sois plus précis » et relancer",
        "Changer de modèle"
      ],
      bonne: 1,
      explication: "Une conversation avec une IA est une conversation : la deuxième demande vaut plus que la première, parce qu'elle part d'un texte qui existe. « Trop long, garde les deux premiers points, et vouvoie » corrige en dix mots ce qu'un nouveau prompt de dix lignes n'obtiendrait pas. Recommencer à blanc, c'est jeter ce qu'on a déjà appris de la réponse."
    },
    {
      cle: "porte-inventee", voie: "image", titre: "La porte vraie et la porte inventée",
      exercice: "Fais générer par un modèle d'image « Bab Boujloud, la porte bleue de Fès ». Puis ouvre une vraie photo de la porte. Note trois différences — les arcs, les couleurs, ce qu'il y a autour.",
      enonce: "Tu as comparé une porte générée et la porte réelle. Une image générée d'un monument qui existe, qu'est-ce qu'elle te donne à coup sûr ?",
      options: [
        "Un document fidèle, si le prompt était précis",
        "Une impression plausible — jamais un document",
        "Une image libre de droits, donc publiable telle quelle",
        "Une meilleure résolution que la photo"
      ],
      bonne: 1,
      explication: "Le modèle a une idée d'une porte marocaine, pas de CETTE porte : il mélange cent portes vues, et le résultat ressemble à toutes et à aucune. Ça fait une illustration, une ambiance, un croquis — jamais une preuve, jamais un document. Pour montrer Bab Boujloud, on prend une photo de Bab Boujloud. La Dhakira aussi se vérifie : c'est la voie « voir juste »."
    },
    {
      cle: "decrire-avant", voie: "image", titre: "Décrire avant de demander",
      exercice: "Prends une photo que tu aimes. Décris-la en cinq lignes — le sujet, le cadrage, la lumière, les couleurs, l'ambiance — et fais générer une image à partir de TA description. Compare.",
      enonce: "Tu as décrit une photo, puis fait générer à partir de ta description. Qu'est-ce qui a le plus rapproché l'image générée de la photo d'origine ?",
      options: [
        "Le nom du photographe dans le prompt",
        "Des mots comme « magnifique », « 4k », « chef-d'œuvre »",
        "La description du cadrage et de la lumière",
        "Demander dix fois la même chose"
      ],
      bonne: 2,
      explication: "Ce que tu sais NOMMER, tu sais le demander. Plan moyen, lumière de fin d'après-midi venant de la gauche, fond flou, couleurs chaudes : chaque mot de cadrage ou de lumière déplace l'image ; les adjectifs d'enthousiasme ne déplacent rien. L'exercice inverse — décrire avant de demander — apprend le vocabulaire qui commande une image."
    },
    {
      cle: "cinq-faits", voie: "savoir", titre: "Cinq faits, deux faux",
      exercice: "Demande à une IA cinq faits précis sur ta ville — dates, noms, chiffres. Puis vérifie CHACUN dans une source que tu peux ouvrir. Compte ceux qui tiennent.",
      enonce: "Sur les cinq faits rendus par le modèle, certains étaient faux. À la lecture, AVANT de vérifier, qu'est-ce qui les distinguait des vrais ?",
      options: [
        "Ils étaient écrits avec moins d'assurance",
        "Ils étaient plus courts",
        "Rien — ils avaient exactement la même assurance",
        "Ils portaient une faute de frappe"
      ],
      bonne: 2,
      explication: "Un modèle n'a pas deux tons, un pour ce qu'il sait et un pour ce qu'il invente : il n'en a qu'un. Le faux est écrit avec la même phrase, le même aplomb, le même chiffre précis que le vrai. C'est pour ça que la vérification n'est pas une option pour les cas douteux — il n'y a pas de cas douteux à l'œil. On vérifie ce qui sort, ou on ne l'écrit pas."
    },
    {
      cle: "source-ouverte", voie: "savoir", titre: "La source qu'on peut ouvrir",
      exercice: "Pose à une IA une question qui compte pour toi, en exigeant ses sources — des liens. Ouvre CHAQUE lien. Pour chacun : la page existe-t-elle, et dit-elle ce que le modèle lui fait dire ?",
      enonce: "Le modèle a donné trois liens pour appuyer sa réponse. Lequel compte vraiment ?",
      options: [
        "Les trois : il les a cités, donc ils existent",
        "Celui dont la page existe ET dit ce que le modèle lui fait dire",
        "Le premier — il est toujours le plus solide",
        "Celui du site le plus connu"
      ],
      bonne: 1,
      explication: "Un lien peut ne pas exister, exister et parler d'autre chose, ou exister et dire le CONTRAIRE — les trois arrivent, souvent dans la même réponse. Une source n'est pas une adresse : c'est une page ouverte, lue, et qui dit la chose. Le site connu ne garantit rien si la page ne dit pas ce qu'on lui prête. C'est Nia w Amana appliqué à la citation."
    }
  ];

  function defi(cle) {
    for (var i = 0; i < TAHADDI.length; i++) if (TAHADDI[i].cle === cle) return TAHADDI[i];
    return null;
  }

  // ---- Les Ta7addi d'entreprise ------------------------------------------------------
  // Vide, et c'est voulu : le jeu n'invente pas de client. La maison en ouvre
  // un en ajoutant une entrée ici, et les points ne se prennent pas — ils
  // s'attestent. Forme d'une entrée :
  //
  //   { cle, sponsor, titre, enonce, livrable, ouvert_le, ferme_le,
  //     sna3a: <points>, attestation: "bureau" }
  //
  // ⚠️ Aucune entrée ne doit porter `bonne` ni `options` : un Ta7addi
  //    d'entreprise ne se corrige pas au clavier, il se livre.
  var SPONSORS = [];

  function sponsorsOuverts() { return SPONSORS.slice(); }

  // ---- Répondre -----------------------------------------------------------------------
  function verifier(d, choix) {
    d = typeof d === "string" ? defi(d) : d;
    if (!d) return { ok: false, bonne: -1 };
    var n = typeof choix === "number" ? choix : parseInt(choix, 10);
    return { ok: !isNaN(n) && n === d.bonne, bonne: d.bonne };
  }

  // Dix, quinze si la première réponse était la bonne.
  function recompense(d, essais) {
    d = typeof d === "string" ? defi(d) : d;
    if (!d) return 0;
    var e = Number(essais) || 0;
    return SNA3A_DEFI + (e <= 1 ? BONUS_PREMIER_COUP : 0);
  }

  // ---- L'état d'un joueur --------------------------------------------------------------
  // joueur.tahaddi = { "<cle>": "<date ISO>" }. Une clé inconnue ne compte pas.
  function normaliserTahaddi(t) {
    var propre = {};
    if (t && typeof t === "object") {
      TAHADDI.forEach(function (d) {
        var v = t[d.cle];
        if (typeof v === "string" && v) propre[d.cle] = v;
      });
    }
    return propre;
  }

  function etat(t) {
    var faits = normaliserTahaddi(t);
    var reussis = 0, prochain = null;
    var liste = TAHADDI.map(function (d) {
      var ok = !!faits[d.cle];
      if (ok) reussis += 1; else if (!prochain) prochain = d;
      return { cle: d.cle, voie: d.voie, titre: d.titre, reussi: ok, le: faits[d.cle] || null };
    });
    return {
      total: TAHADDI.length, reussis: reussis, restants: TAHADDI.length - reussis,
      complet: reussis === TAHADDI.length, prochain: prochain, liste: liste,
      sponsors: SPONSORS.length
    };
  }

  function reussir(t, cle, quand) {
    var faits = normaliserTahaddi(t);
    if (!defi(cle)) return faits;
    faits[cle] = (quand ? new Date(quand) : new Date()).toISOString();
    return faits;
  }

  return {
    TAHADDI: TAHADDI, defi: defi, SPONSORS: SPONSORS, sponsorsOuverts: sponsorsOuverts,
    SNA3A_DEFI: SNA3A_DEFI, BONUS_PREMIER_COUP: BONUS_PREMIER_COUP,
    verifier: verifier, recompense: recompense,
    normaliserTahaddi: normaliserTahaddi, etat: etat, reussir: reussir
  };
});
