// ZAW'IA — le jeu · LE COMBAT : une énigme contre une ombre de Nsyan (pur : ni DOM, ni horloge).
//
// v5.3 — étape B de la Rihla (docs/superpowers/specs/2026-09-19-jeu-rihla-open-world-fes.md, § 2 et § 4).
// On ne tue pas l'oubli : on le REMPLIT. Un combat oppose ton Rafiq à une ombre,
// au tour par tour, en deux gestes : choisir une technique (le type compte), puis
// la RÉUSSIR vraiment — une épreuve courte de sa voie. Réussie, elle dissipe une
// part du brouillard de l'ombre ; ratée, elle coûte du souffle (Nfs).
//
// Règles tenues par les tests :
//  1. jamais un coupable : les ombres sont l'oubli, le flou, le faux — ni un
//     peuple, ni une époque, ni un métier ;
//  2. le triangle des types : dire bat Dbaba, voir bat Ghobra, vérifier bat
//     Tekhlat ; et chacune résiste à une voie (×½) ;
//  3. l'épreuve est jugée par le CODE (un choix parmi trois) : pas de modèle, pas
//     de coût ; tirée d'un hachage — deux joueurs vivent le même combat ;
//  4. chaque fait donné comme vrai vient des pages sourcées du jeu, ou se relit
//     par le Fqih de l'histoire avant d'entrer ;
//  5. aucun point : ni M39ol, ni Sna3a, ni Dhakira. Une ombre battue rend des
//     mouzounat (rihla.js) et recule — c'est tout.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.combat = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var OMBRES = {
    dbaba: { cle: "dbaba", nom: "Dbaba", ar: "الضبابة", sous: "le brouillard", faible: "prompt", resiste: "image", couleur: "#9aa8bc",
      entree: "Le brouillard s'épaissit : les enseignes, les questions, tout se brouille. On ne sait plus quoi demander.",
      sortie: "Le brouillard se lève. Les enseignes se lisent à nouveau." },
    ghobra: { cle: "ghobra", nom: "Ghobra", ar: "الغبرة", sous: "la poussière", faible: "image", resiste: "savoir", couleur: "#bfa27a",
      entree: "La poussière tourne sur elle-même. Là où elle passe, les couleurs et les noms s'effacent.",
      sortie: "La poussière retombe. Ce qu'elle cachait est encore là." },
    tekhlat: { cle: "tekhlat", nom: "Tekhlat", ar: "التخلاط", sous: "le mélange", faible: "savoir", resiste: "prompt", couleur: "#9a7ab8",
      entree: "Tout se mêle : le vrai, l'inventé, la rumeur. Elle parle avec assurance — c'est son arme.",
      sortie: "Le mélange se démêle. Le vrai reprend sa place, l'inventé la sienne." }
  };

  var BROUILLARD = 30;     // ce qu'une ombre de la médina a à dissiper
  var BASE = 10;           // ce que dissipe une technique réussie, avant le type et la Sna3a
  var COUT_TOUR = 2;       // le souffle d'un tour
  var COUT_RATE = 6;       // le souffle d'une épreuve ratée, en plus
  var MZ_VICTOIRE = 8;     // les mouzounat qu'une ombre avait avalées

  function efficacite(voie, type) {
    var o = OMBRES[type];
    if (!o) return 1;
    if (o.faible === voie) return 2;
    if (o.resiste === voie) return 0.5;
    return 1;
  }

  // ---- Les épreuves : un choix parmi trois, et pourquoi -----------------------------
  // `bonne` : l'indice de la bonne réponse dans `choix` (l'ordre affiché est mêlé
  // par le hachage). Le vrai de « vérifier » vient de pages.js (fes-fondatrice,
  // fes-seconde-soeur, la page d'Idris II) et de la médina (Bab Boujloud).
  var EPREUVES = {
    prompt: [
      { q: "Tu veux une recette de msemmen pour quatre personnes. Quel prompt donne la réponse la plus utile ?",
        choix: ["« Msemmen ? »", "« Donne-moi la recette du msemmen pour 4 personnes : les ingrédients en grammes, puis les étapes numérotées. »", "« Parle-moi de la cuisine marocaine. »"], bonne: 1,
        pourquoi: "Le contexte (quatre personnes) et le format (grammes, étapes) : le modèle n'a plus rien à deviner." },
      { q: "Tu prépares un entretien d'embauche. Quelle demande est la plus précise ?",
        choix: ["« Aide-moi pour mon entretien. »", "« Qu'est-ce qu'un entretien ? »", "« Je passe un entretien de comptable junior à Casablanca jeudi. Pose-moi 5 questions probables, une à la fois, et corrige mes réponses. »"], bonne: 2,
        pourquoi: "Le poste, la ville, la date, et la façon de travailler ensemble : c'est tout ça, préciser." },
      { q: "Tu veux le résumé d'un long texte pour ton grand-père. Quel prompt ?",
        choix: ["« Résume ce texte en 5 phrases simples, en darija, pour quelqu'un qui n'a pas lu l'original. »", "« Résume. »", "« Traduis tout en anglais. »"], bonne: 0,
        pourquoi: "La longueur, la langue et le lecteur : trois contraintes, et le résumé est pour lui." },
      { q: "Tu donnes un exemple au modèle avant ta demande (Mithal). À quoi ça sert ?",
        choix: ["À ce qu'il copie l'exemple mot pour mot.", "À ce qu'il imite la forme de ce que tu veux.", "À rien : il l'ignore."], bonne: 1,
        pourquoi: "Un exemple montre la forme attendue mieux qu'une longue explication." },
      { q: "Le modèle répond beaucoup trop long. Que changes-tu dans le prompt ?",
        choix: ["Je répète la question.", "J'écris en majuscules.", "J'ajoute une contrainte : « en trois phrases au plus »."], bonne: 2,
        pourquoi: "Une contrainte claire vaut mieux que l'insistance." },
      { q: "Une cliente a dix jours de retard de paiement. Quel prompt pour lui écrire ?",
        choix: ["« Écris un message poli et bref à une cliente qui a 10 jours de retard ; propose deux dates ; ton chaleureux. »", "« Écris un message. »", "« Dis-lui qu'elle est en retard. »"], bonne: 0,
        pourquoi: "La situation, le but et le ton : le message sera juste du premier coup." },
      { q: "Tu cherches un nom pour ton atelier de poterie à Safi. Quel prompt ?",
        choix: ["« Donne des noms. »", "« Propose 3 noms courts pour un atelier de poterie à Safi, faciles à dire en darija et en anglais, avec une phrase d'explication chacun. »", "« Quel est le meilleur nom du monde ? »"], bonne: 1,
        pourquoi: "Le nombre, le lieu, les langues et une justification : de quoi choisir." },
      { q: "Qu'apporte « Tu es un professeur de maths patient » au début d'un prompt ?",
        choix: ["Le modèle devient professeur pour de vrai.", "Rien : il l'ignore.", "Un rôle : le ton et le niveau de la réponse le suivent."], bonne: 2,
        pourquoi: "Donner un rôle, c'est régler le ton et le niveau d'un coup." },
      // v5.6 — douze de plus : le combat ne se répète plus
      { q: "Tu écris une demande de stage à une administration. Quel prompt donne la bonne lettre ?",
        choix: ["« Écris une lettre. »", "« Écris une demande de stage pour la direction régionale de l'agriculture de Meknès : ton formel, une page, mes études en deux lignes, et une phrase sur mes disponibilités. »", "« Écris la lettre la plus longue possible. »"], bonne: 1,
        pourquoi: "Le destinataire, le ton, la longueur et le contenu : une lettre qu'on peut envoyer telle quelle." },
      { q: "Tu ne sais pas encore ce que tu veux exactement. Quelle demande t'aide le plus ?",
        choix: ["« Avant de répondre, pose-moi trois questions pour comprendre mon besoin. »", "« Devine ce que je veux. »", "« Réponds vite. »"], bonne: 0,
        pourquoi: "Laisser le modèle poser ses questions d'abord, c'est préciser à deux." },
      { q: "Tu colles un long texte et une consigne dans le même message. Comment éviter que le modèle les mélange ?",
        choix: ["J'écris la consigne en majuscules.", "Je mets le texte entre guillemets ou entre balises, et je dis : « Voici le texte à traiter ».", "Je colle le texte deux fois."], bonne: 1,
        pourquoi: "Séparer les données de la consigne : le modèle sait ce qu'il doit lire et ce qu'il doit faire." },
      { q: "La première réponse est presque bonne. Que fais-tu ?",
        choix: ["Je recommence tout dans une nouvelle conversation.", "J'abandonne.", "Je dis précisément ce qu'il faut changer : « garde tout, mais raccourcis le deuxième paragraphe »."], bonne: 2,
        pourquoi: "On améliore une réponse en disant l'écart, comme on corrige un brouillon." },
      { q: "Tu compares trois offres de téléphone. Quel format demander ?",
        choix: ["« Un tableau : prix, batterie, appareil photo, garantie — une ligne par offre. »", "« Un poème. »", "« Ton avis en un mot. »"], bonne: 0,
        pourquoi: "Le format sert la décision : un tableau se compare d'un coup d'œil." },
      { q: "Tu veux une explication pour ta petite sœur de dix ans. Que précises-tu ?",
        choix: ["Rien : le modèle s'adapte tout seul.", "Son âge, et « avec un exemple de la vie de tous les jours, sans mots techniques ».", "« Explique le plus scientifiquement possible. »"], bonne: 1,
        pourquoi: "Dire à qui l'on parle règle le niveau, les mots et les exemples." },
      { q: "Tu vas coller le dossier médical de ton père dans une IA pour le comprendre. Que fais-tu d'abord ?",
        choix: ["J'enlève son nom, son numéro de CIN et tout ce qui l'identifie.", "Rien : c'est privé de toute façon.", "J'ajoute son adresse pour être précis."], bonne: 0,
        pourquoi: "Ce que tu donnes à un outil peut sortir du cercle : on n'y met que ce qui est nécessaire." },
      { q: "Tu cherches des idées de sujet de mémoire. Quel prompt ouvre le plus de pistes ?",
        choix: ["« Donne-moi un sujet. »", "« Quel est LE meilleur sujet ? »", "« Propose 8 sujets de mémoire en gestion, liés au tourisme à Fès, du plus simple au plus ambitieux, avec une phrase chacun. »"], bonne: 2,
        pourquoi: "Demander plusieurs options, triées, avec une justification : c'est toi qui choisis ensuite." },
      { q: "Tu veux que la réponse soit en darija, écrite en lettres latines. Comment l'obtenir ?",
        choix: ["Je le dis, et je donne une phrase d'exemple : « Salam, kidayer ? »", "J'espère qu'il comprendra.", "J'écris ma question en anglais."], bonne: 0,
        pourquoi: "La langue et l'écriture se précisent — et un exemple (Mithal) vaut mieux qu'une règle." },
      { q: "Le compte rendu d'une réunion fait trois pages. Que demandes-tu ?",
        choix: ["« Traduis-le. »", "« Tire-en la liste des décisions et des tâches : qui fait quoi, et pour quand. »", "« Fais-le plus long. »"], bonne: 1,
        pourquoi: "Une demande précise extrait l'utile : décisions, responsables, échéances." },
      { q: "Pourquoi ajouter « si tu n'es pas sûr, dis-le » à la fin d'un prompt ?",
        choix: ["Pour qu'il réponde plus vite.", "Ça ne sert à rien.", "Pour qu'il signale ses doutes au lieu d'inventer avec assurance."], bonne: 2,
        pourquoi: "On invite le modèle à marquer ses incertitudes — c'est là qu'on vérifie ensuite." },
      { q: "Tu prépares une affiche pour la halqa du mercredi. Quel prompt donne le meilleur texte ?",
        choix: ["« Un texte pour une affiche. »", "« Un titre de cinq mots au plus, une phrase d'invitation, le jour et l'heure, un ton chaleureux : c'est pour une rencontre de quartier, le mercredi à 19 h. »", "« Le texte le plus drôle possible. »"], bonne: 1,
        pourquoi: "La forme (un titre court, une phrase), le contenu (le jour, l'heure) et le ton : l'affiche est prête." }
    ],
    image: [
      { q: "Une IA a dessiné « la place Seffarine » : des chaudronniers, des plateaux de cuivre… et un gratte-ciel de verre au fond. Qu'est-ce qui cloche ?",
        choix: ["Les chaudronniers.", "Le gratte-ciel de verre, dans la médina.", "Les plateaux de cuivre."], bonne: 1,
        pourquoi: "L'IA mêle le plausible et l'impossible avec la même assurance : il faut regarder chaque détail." },
      { q: "Une image générée de « Bab Boujloud » montre une porte toute rouge. Que fais-tu ?",
        choix: ["Je la compare à une vraie photo : Bab Boujloud est bleue du côté de la route, verte du côté de la médina.", "Je la publie telle quelle.", "Je demande une porte encore plus rouge."], bonne: 0,
        pourquoi: "Voir juste, c'est confronter l'image au réel avant de la croire." },
      { q: "Deux images de Dar Dbagh : l'une avec des cuves de couleur en nid d'abeilles, l'autre avec des piscines turquoise et des transats. Laquelle ressemble au réel ?",
        choix: ["Les piscines turquoise.", "Aucune des deux.", "Les cuves de couleur en nid d'abeilles."], bonne: 2,
        pourquoi: "Les tanneries de Fès sont des cuves de teinture, pas des piscines." },
      { q: "Sur une image générée, une main tient un verre d'atay… avec six doigts. Que t'apprend ce détail ?",
        choix: ["Que l'IA peut inventer des détails : il faut regarder de près avant de croire.", "Que l'image est parfaite.", "Que l'atay est trop chaud."], bonne: 0,
        pourquoi: "Les mains, le texte, les petits détails : c'est là que les images générées se trompent le plus." },
      { q: "Pour obtenir l'image fidèle d'un zellige de Fès, que mets-tu dans le prompt ?",
        choix: ["« Joli carrelage. »", "« Zellige », et rien d'autre.", "La forme (une étoile à huit branches), les couleurs (vert, blanc, bleu) et « zellige de Fès, vu de face »."], bonne: 2,
        pourquoi: "Plus la description est précise, moins l'image a à inventer." },
      { q: "Tu compares deux versions d'une affiche générée (Muqarana). L'une écrit « Fès » en lettres arabes déformées. Que fais-tu ?",
        choix: ["Je garde l'autre, ou j'ajoute le texte moi-même : les IA d'images écrivent mal les lettres.", "Je garde celle-là : c'est plus joli.", "Je jette les deux."], bonne: 0,
        pourquoi: "Comparer, c'est repérer l'écart — et savoir ce que l'outil fait mal." },
      { q: "Une IA dessine « le minaret de la Koutoubia » avec une coupole dorée en forme d'oignon. Qu'est-ce qui cloche ?",
        choix: ["La couleur du ciel.", "La coupole en oignon : la Koutoubia est une tour carrée, surmontée d'un lanternon.", "Rien."], bonne: 1,
        pourquoi: "Un monument connu se vérifie en un regard : il suffit de le comparer au vrai." },
      { q: "Pourquoi confronter une image générée au réel avant de la montrer ?",
        choix: ["Parce qu'elle est toujours fausse.", "Parce que c'est interdit.", "Parce qu'elle peut mêler du vrai et de l'inventé, avec la même assurance."], bonne: 2,
        pourquoi: "Une image générée n'est ni vraie ni fausse d'avance : elle se vérifie." },
      // v5.6 — douze de plus : le combat ne se répète plus
      { q: "Une photo « prise hier à Tanger » circule : une tempête de neige sur la corniche. Premier réflexe ?",
        choix: ["La partager vite, c'est spectaculaire.", "Chercher l'image à l'envers (recherche par image) : d'où vient-elle, et de quand ?", "Lui ajouter un filtre."], bonne: 1,
        pourquoi: "Une photo virale est souvent vieille, ou prise ailleurs : la recherche par image retrouve sa première apparition." },
      { q: "Sur un portrait généré, la boucle d'oreille gauche est en or, la droite en argent, et le col change de forme d'un côté à l'autre. Que t'apprennent ces détails ?",
        choix: ["Que les deux côtés d'une image générée ne s'accordent pas toujours : c'est un indice.", "Que c'est la mode.", "Rien du tout."], bonne: 0,
        pourquoi: "La symétrie ratée — boucles d'oreilles, lunettes, cols — signale souvent une image générée." },
      { q: "Une image générée montre des ombres qui partent dans deux directions, sous un seul soleil. Qu'en penses-tu ?",
        choix: ["C'est normal l'après-midi.", "C'est un signe d'image générée : un seul soleil, une seule direction d'ombre.", "C'est une photo de nuit."], bonne: 1,
        pourquoi: "La lumière obéit à des règles simples ; l'IA les oublie parfois." },
      { q: "Tu veux une image de la médina de Chefchaouen. L'IA te rend des murs rouges. Que fais-tu ?",
        choix: ["J'accepte : c'est joli.", "Je dis que c'est Marrakech.", "Je précise « murs bleus passés à la chaux, ruelles en escalier » et je compare au réel."], bonne: 2,
        pourquoi: "Un lieu réel se décrit par ce qui le rend reconnaissable — puis on vérifie." },
      { q: "Une vidéo montre une personnalité qui dit des choses étonnantes, mais ses lèvres ne suivent pas les mots et elle ne cligne jamais des yeux. Que penser ?",
        choix: ["Que c'est peut-être un montage fabriqué par IA : on cherche la source avant d'y croire.", "Que la personne est fatiguée.", "Que la vidéo est forcément vraie : on la voit."], bonne: 0,
        pourquoi: "Voir n'est plus une preuve : la source et les détails comptent." },
      { q: "Tu veux une affiche verticale pour WhatsApp. Que précises-tu dans le prompt d'image ?",
        choix: ["Rien : le format ne compte pas.", "Le format vertical (9:16), la place du texte en haut, et un fond simple.", "« Fais-la jolie. »"], bonne: 1,
        pourquoi: "Le format dépend de l'endroit où l'image sera vue : on le dit d'abord." },
      { q: "Sur une image générée d'un souk, les étiquettes de prix sont pleines de lettres qui ne veulent rien dire. Que fais-tu ?",
        choix: ["Je laisse : personne ne lira.", "J'ajoute encore plus de texte dans le prompt.", "J'enlève le texte de l'image et je l'ajoute moi-même avec un outil de mise en page."], bonne: 2,
        pourquoi: "Les IA d'images écrivent mal : le texte se pose après, à la main." },
      { q: "Tu veux utiliser la photo d'une voisine dans une image générée pour une affiche. Que faut-il d'abord ?",
        choix: ["Son accord.", "Rien, si l'image est belle.", "Flouter l'arrière-plan."], bonne: 0,
        pourquoi: "Le visage de quelqu'un lui appartient : on demande avant." },
      { q: "Tu compares deux images générées d'un plat de couscous (Muqarana). L'une a des baguettes posées à côté. Laquelle gardes-tu ?",
        choix: ["Celle avec les baguettes : c'est original.", "Celle sans baguettes : le détail étranger fausse l'image.", "Les deux, au hasard."], bonne: 1,
        pourquoi: "Comparer, c'est repérer le détail qui ne va pas avec le reste." },
      { q: "Une IA dessine un zellige dont le motif se répète, avec des étoiles déformées au milieu. Que regardes-tu pour juger ?",
        choix: ["La couleur du cadre.", "Le prix du zellige.", "La géométrie : un vrai zellige garde ses étoiles régulières d'un bout à l'autre."], bonne: 2,
        pourquoi: "Un motif géométrique ne pardonne pas : chaque irrégularité se voit." },
      { q: "Pour que l'IA dessine un atay servi comme chez nous, qu'ajoutes-tu au prompt ?",
        choix: ["« Une théière berrad argentée, versée de haut, des verres décorés, de la mousse. »", "« Du thé. »", "« Une tasse de thé à l'anglaise. »"], bonne: 0,
        pourquoi: "Les détails culturels ne se devinent pas : on les nomme." },
      { q: "Une image montre « le port d'Essaouira », mais on y voit des gratte-ciel de verre et un métro aérien. Que fais-tu ?",
        choix: ["Je la crois : c'est l'avenir.", "Je la compare à de vraies photos du port avant de la partager.", "Je la partage avec « vrai » en légende."], bonne: 1,
        pourquoi: "Une image qui prétend montrer un lieu réel se vérifie contre le lieu." }
    ],
    savoir: [
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["La Qarawiyine a été fondée à Fès en 859 par Fatima al-Fihriya.", "La Qarawiyine a été fondée en 1859.", "La Qarawiyine a été fondée à Marrakech."], bonne: 0,
        pourquoi: "859, Fatima al-Fihriya : c'est la page de la fondatrice, au sandouq de la Khizana." },
      { q: "Une IA t'affirme une date, avec beaucoup d'assurance. Ton premier réflexe ?",
        choix: ["La croire : elle a l'air sûre d'elle.", "Lui demander d'où elle la tient, puis vérifier la source.", "Reposer la question jusqu'à ce qu'elle change d'avis."], bonne: 1,
        pourquoi: "L'assurance n'est pas une preuve. La source, oui." },
      { q: "Pour une date d'histoire, qu'est-ce qu'une bonne source (Isnad) ?",
        choix: ["« Tout le monde le dit. »", "Un message transféré sur WhatsApp.", "Un livre ou un site sérieux, qu'on peut retrouver et citer."], bonne: 2,
        pourquoi: "Une source se retrouve et se cite : c'est ce qui la distingue d'une rumeur." },
      { q: "Deux sources se contredisent sur une date (Tathabbut). Que fais-tu ?",
        choix: ["J'en cherche une troisième, et je dis qu'il y a un doute.", "Je prends la première.", "Je fais la moyenne des deux."], bonne: 0,
        pourquoi: "Recouper, et dire le doute quand il reste : c'est ça, vérifier juste." },
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["La mosquée des Andalous a été construite au XXᵉ siècle.", "La tradition attribue la mosquée des Andalous à Mariam al-Fihriya, sœur de la fondatrice de la Qarawiyine.", "Mariam et Fatima al-Fihriya étaient rivales."], bonne: 1,
        pourquoi: "Deux sœurs, deux rives : c'est la page de l'autre sœur, au sandouq." },
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["Fès a été fondée par les Almohades, au XIIᵉ siècle.", "Fès n'a été fondée qu'au XIXᵉ siècle.", "Idris II a fondé en 809 une ville sur la rive opposée à celle de son père : les deux rives deviendront Fès."], bonne: 2,
        pourquoi: "C'est la page d'Idris II : deux établissements, deux rives, une ville." },
      { q: "Une IA te cite un livre que tu ne retrouves nulle part. Que faut-il en penser ?",
        choix: ["Qu'elle l'a peut-être inventé : un titre qu'on ne retrouve pas ne sert pas de source.", "Qu'il est très rare.", "Qu'il faut l'acheter."], bonne: 0,
        pourquoi: "Les modèles inventent parfois des références plausibles : on ne cite que ce qu'on a retrouvé." },
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["Bab Boujloud est toute rouge.", "Bab Boujloud est bleue du côté de la route, verte du côté de la médina.", "Bab Boujloud date de 2010."], bonne: 1,
        pourquoi: "Tu es peut-être passé dessous : la porte le dit elle-même." },
      // v5.6 — douze de plus : le combat ne se répète plus
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["Ibn Battuta est né à Tanger en 1304.", "Ibn Battuta est né à Tanger en 1904.", "Ibn Battuta n'a jamais quitté le Maroc."], bonne: 0,
        pourquoi: "C'est la page du voyageur, au sandouq : né à Tanger en 1304, parti à vingt et un ans, près de trente ans de route." },
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["Casablanca porte son nom depuis sa fondation, en 1950.", "Casa Branca pour les Portugais, Dar el-Beida en arabe : le même nom, « la maison blanche ».", "Casablanca a reçu son nom de voyageurs anglais."], bonne: 1,
        pourquoi: "C'est la page « Trois langues, un seul nom » : Anfa, Casa Branca, Dar el-Beida." },
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["Agadir n'a jamais connu de séisme.", "Agadir a été détruite par un séisme en 1860.", "Un séisme a détruit Agadir le 29 février 1960, et la ville a été reconstruite."], bonne: 2,
        pourquoi: "C'est la page de la ville qui a recommencé : le 29 février 1960, puis la reconstruction." },
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["La tour Hassan de Rabat devait dépasser 80 mètres ; le chantier s'est arrêté à 44.", "La tour Hassan mesure 200 mètres.", "La tour Hassan a été achevée en 2001."], bonne: 0,
        pourquoi: "C'est la page de la tour qui s'est arrêtée : promise à plus de 80 mètres, elle s'arrête à 44 en 1199." },
      { q: "Une IA te donne un chiffre précis — « 73 % des jeunes… » — sans source. Que fais-tu ?",
        choix: ["Je le cite tel quel : il est précis.", "Je lui demande sa source, et je ne le cite que si je la retrouve.", "J'arrondis à 70 %."], bonne: 1,
        pourquoi: "Un chiffre précis n'est pas un chiffre vrai : sans source retrouvée, il ne sort pas." },
      { q: "Une citation « d'Ibn Khaldoun » circule sur les réseaux, sans livre ni page. Que fais-tu ?",
        choix: ["Je cherche dans quel ouvrage elle apparaît vraiment avant de la partager.", "Je la partage : elle est belle.", "Je change le nom de l'auteur."], bonne: 0,
        pourquoi: "Les fausses citations d'auteurs célèbres sont partout : une citation se retrouve dans son livre, ou elle ne se cite pas." },
      { q: "Tu demandes à une IA un résumé du Code du travail. Que vérifies-tu ?",
        choix: ["Rien : c'est une loi.", "La couleur du texte.", "Le texte officiel et sa date : les lois changent, et le modèle peut être en retard."], bonne: 2,
        pourquoi: "Un modèle a une date de connaissance : pour ce qui change, on remonte au texte officiel." },
      { q: "Deux sites donnent la même information, mot pour mot. Est-ce deux sources ?",
        choix: ["Oui : deux sites valent deux preuves.", "Pas forcément : l'un a peut-être copié l'autre. On cherche d'où vient l'information au départ.", "Non : internet ne sert à rien."], bonne: 1,
        pourquoi: "Recouper, c'est trouver des sources indépendantes — pas la même phrase copiée deux fois." },
      { q: "Un modèle te répond sur l'actualité de ce matin. Quelle prudence ?",
        choix: ["Aucune : il sait tout.", "Aucune, s'il répond en arabe.", "Vérifier : sans accès au web, un modèle ne connaît pas ce qui s'est passé après son entraînement."], bonne: 2,
        pourquoi: "Ce qui est récent se vérifie à la source d'aujourd'hui, pas dans la mémoire d'un modèle." },
      { q: "Tu demandes « Qui a fondé Oujda ? » et l'IA répond sans hésiter un nom que tu ne retrouves nulle part. Que fais-tu ?",
        choix: ["Je vérifie dans une source sérieuse : la page d'Oujda, au sandouq, dit Ziri ibn Atiyya, en 994.", "Je la crois : elle n'a pas hésité.", "Je choisis un autre nom au hasard."], bonne: 0,
        pourquoi: "L'assurance d'une réponse ne dit rien de sa justesse. La source, si." },
      { q: "Une IA traduit un contrat vers l'arabe. Que fais-tu avant de signer ?",
        choix: ["Je signe : la traduction est automatique.", "Je fais relire les passages importants par quelqu'un de compétent, et je compare avec l'original.", "Je le traduis encore une fois, vers l'anglais."], bonne: 1,
        pourquoi: "Une traduction peut changer le sens d'un mot qui engage : ce qui compte se relit." },
      { q: "Laquelle de ces phrases est vraie ?",
        choix: ["La Koutoubia n'a aucune tour sœur.", "La Koutoubia date du XXᵉ siècle.", "La Koutoubia a servi de modèle à la Giralda de Séville et à la tour Hassan de Rabat."], bonne: 2,
        pourquoi: "C'est la page des trois sœurs : la Koutoubia est l'aînée, la Giralda et la tour Hassan ses cadettes." }
    ]
  };

  // ---- v5.4 — GHOBRA LA GRANDE : l'arène de Dar Dbagh ----------------------------------
  // Trois visages, un par voie : chaque visage ne cède qu'à SA voie (×2) et
  // résiste aux deux autres (×½). Il faut donc les trois voies — les maîtres de
  // la médina les enseignent. Ses épreuves parlent des recettes des teinturiers,
  // sans rien affirmer d'histoire : on y apprend à demander, à voir, à vérifier.
  var GRANDE = {
    cle: "ghobra-kabira", nom: "Ghobra la grande", ar: "الغبرة الكبيرة", sous: "la poussière qui avale les couleurs", couleur: "#c9a46a",
    phases: ["prompt", "image", "savoir"],
    entree: "Les cuves grisent d'un coup. Ghobra la grande se lève de la poussière : elle a mangé les couleurs, les recettes, et les noms.",
    visages: [
      "Premier visage : le brouillard. Il faut la bonne question.",
      "Deuxième visage : la poussière. Il faut voir juste.",
      "Troisième visage : le mélange. Il faut vérifier."
    ],
    sortie: "Ghobra la grande retombe en poussière d'or. Les cuves reprennent leurs couleurs."
  };
  var EPREUVES_GRANDE = {
    prompt: [
      { q: "Si Ahmed a oublié la recette du rouge. Quelle question l'aide le mieux à s'en souvenir ?",
        choix: ["« Tu te souviens ? »", "« Pour le rouge, ton maître mettait quelle plante dans la cuve, et combien de temps y laissait-il les peaux ? »", "« Les couleurs, c'est important ? »"], bonne: 1,
        pourquoi: "Une question précise — la plante, la durée — réveille une mémoire précise." },
      { q: "Tu veux que le modèle t'aide à écrire la recette du teinturier, étape par étape. Quel prompt ?",
        choix: ["« Écris une recette. »", "« Invente une recette de teinture marocaine. »", "« Voici ce que Si Ahmed m'a dit, en vrac. Range-le en étapes numérotées, sans rien ajouter qu'il n'a pas dit, et signale ce qui manque. »"], bonne: 2,
        pourquoi: "Donner la matière, fixer la forme, interdire l'invention : le modèle range, il n'invente pas." },
      { q: "Pour transmettre la recette aux apprentis, quel exemple donnes-tu au modèle (Mithal) ?",
        choix: ["Une vraie fiche déjà écrite par un maître, pour qu'il en suive la forme.", "Aucun : il sait déjà tout.", "Une recette de cuisine prise au hasard."], bonne: 0,
        pourquoi: "Un bon exemple, c'est la forme exacte qu'on attend." }
    ],
    image: [
      { q: "Une vieille photo des cuves montre une cuve rouge ; une image générée la montre violette. Laquelle crois-tu ?",
        choix: ["La générée : elle est plus nette.", "La vieille photo, confrontée à d'autres : une image générée peut changer les couleurs.", "Aucune des deux."], bonne: 1,
        pourquoi: "La netteté n'est pas la vérité : on confronte, on ne choisit pas au plus joli." },
      { q: "Tu génères l'image d'une cuve de safran. Qu'est-ce qui doit t'alerter ?",
        choix: ["Un jaune doré.", "Des peaux qui sèchent autour.", "Une cuve d'un bleu électrique."], bonne: 2,
        pourquoi: "Le safran teint en jaune : un bleu électrique signe l'invention." },
      { q: "Comparer deux photos des cuves prises à des années d'écart (Muqarana), cela permet…",
        choix: ["de voir ce qui a changé, et ce qui a tenu.", "de choisir la plus jolie.", "rien du tout."], bonne: 0,
        pourquoi: "La comparaison montre ce que le temps — et l'oubli — ont fait." }
    ],
    savoir: [
      { q: "Deux vieux teinturiers ne citent pas la même plante pour le rouge. Que fais-tu ?",
        choix: ["Je garde celle du plus âgé.", "Je note les deux, je cherche une troisième source, et je dis qu'il y a un doute.", "J'invente un mélange des deux."], bonne: 1,
        pourquoi: "Recouper, et dire le doute : la recette reste honnête." },
      { q: "Une IA t'affirme que les cuves de Dar Dbagh datent de 1990. Que fais-tu ?",
        choix: ["Je lui demande sa source, et je vérifie dans un ouvrage sérieux sur la médina de Fès.", "Je la crois.", "Je le répète à tout le monde."], bonne: 0,
        pourquoi: "Une date sans source n'est qu'une phrase qui a l'air sûre d'elle." },
      { q: "Pourquoi écrire la recette avec le nom de celui qui l'a transmise ?",
        choix: ["Pour faire joli.", "Ce n'est pas utile.", "Parce qu'une recette dont on connaît la chaîne (l'isnad) se vérifie, et se transmet."], bonne: 2,
        pourquoi: "C'est la leçon de la Qarawiyine : un savoir porte le nom de qui l'a transmis." }
    ]
  };

  // ---- Le hachage : jamais le hasard du navigateur ------------------------------------
  function hache(s) {
    var h = 2166136261;
    s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }

  // ---- Un combat ------------------------------------------------------------------
  function nouveau(cleOmbre, type) {
    return { ombre: String(cleOmbre), type: OMBRES[type] ? type : "dbaba", brouillard: BROUILLARD, max: BROUILLARD, tour: 0, vues: [], fini: false, gagne: false };
  }
  // v5.4 — Ghobra la grande : trois phases de brouillard, une par voie.
  function nouveauGrande() {
    return { ombre: GRANDE.cle, type: "kabira", grande: true, phase: 0, brouillard: BROUILLARD, max: BROUILLARD, tour: 0, vues: [], fini: false, gagne: false };
  }
  // La voie qui fait céder le visage présent (la grande), ou la faiblesse de l'ombre.
  function faible(c) { return c.grande ? GRANDE.phases[c.phase] : (OMBRES[c.type] || {}).faible; }
  // L'épreuve de ce tour, pour une voie : jamais deux fois la même dans un combat.
  // Les choix sont mêlés par le hachage ; `bonne` suit la bonne réponse.
  // v5.6 — `deja` : ce que le joueur a déjà vu, de combat en combat (recit.rihla.ev) —
  // on tire d'abord parmi le neuf ; tout vu, on repart du hachage.
  function epreuve(c, voie, deja) {
    // la grande tire d'abord dans ses propres épreuves ; épuisées, dans celles de la médina
    var propres = c.grande ? (EPREUVES_GRANDE[voie] || []).filter(function (e, i) { return c.vues.indexOf("g" + voie + ":" + i) < 0; }) : [];
    if (propres.length) {
      var hg = hache(c.ombre + ":" + c.tour + ":" + voie), eg = propres[hg % propres.length], ig = EPREUVES_GRANDE[voie].indexOf(eg);
      var pg = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]][hg % 6];
      return { voie: voie, index: ig, grande: true, q: eg.q, choix: pg.map(function (k) { return eg.choix[k]; }), bonne: pg.indexOf(eg.bonne), pourquoi: eg.pourquoi };
    }
    var liste = EPREUVES[voie] || [];
    if (!liste.length) return null;
    var h = hache(c.ombre + ":" + c.tour + ":" + voie), i = h % liste.length, essais = 0;
    var vu = function (k) { return c.vues.indexOf(voie + ":" + k) >= 0; };
    var connu = function (k) { return !!(deja && deja.indexOf(voie + ":" + k) >= 0); };
    var neuf = -1;
    for (var n = 0; n < liste.length && neuf < 0; n++) { var k = (i + n) % liste.length; if (!vu(k) && !connu(k)) neuf = k; }
    if (neuf >= 0) i = neuf;
    else while (vu(i) && essais < liste.length) { i = (i + 1) % liste.length; essais++; }
    var e = liste[i], ordre = [0, 1, 2];
    var d = h % 6, perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    ordre = perms[d];
    return { voie: voie, index: i, q: e.q, choix: ordre.map(function (k) { return e.choix[k]; }), bonne: ordre.indexOf(e.bonne), pourquoi: e.pourquoi };
  }
  // Jouer un tour : `tech` { cle, voie }, `juste` la réponse, `force` la puissance du Rafiq.
  function jouer(c, tech, ep, juste, force) {
    var x = Object.assign({}, c, { vues: c.vues.slice() });
    if (x.fini) return { c: x, degats: 0, cout: 0, eff: 1 };
    x.tour += 1;
    if (ep) x.vues.push((ep.grande ? "g" : "") + ep.voie + ":" + ep.index);
    var eff = x.grande ? (tech.voie === GRANDE.phases[x.phase] ? 2 : 0.5) : efficacite(tech.voie, x.type), degats = 0, visage = false;
    if (juste) {
      degats = Math.max(1, Math.round(BASE * eff * (force || 1)));
      x.brouillard = Math.max(0, x.brouillard - degats);
      if (x.brouillard === 0) {
        // la grande change de visage tant qu'il lui en reste
        if (x.grande && x.phase < GRANDE.phases.length - 1) { x.phase += 1; x.brouillard = x.max; visage = true; }
        else { x.fini = true; x.gagne = true; }
      }
    }
    return { c: x, degats: degats, eff: eff, cout: COUT_TOUR + (juste ? 0 : COUT_RATE), visage: visage };
  }
  // v5.6 — retenir une épreuve vue (hors épreuves de la grande), bornée aux RETENUES dernières.
  var RETENUES = 120;
  function retenir(deja, ep) {
    var l = Array.isArray(deja) ? deja.slice() : [];
    if (!ep || ep.grande) return l;
    var cle = ep.voie + ":" + ep.index;
    if (l.indexOf(cle) >= 0) return l;
    l.push(cle);
    return l.slice(-RETENUES);
  }
  // v5.4 — LE DUEL PAR LIEN : cinq épreuves, les mêmes pour qui reçoit la même graine.
  var DUEL = 5;
  function graineValide(g) { return typeof g === "string" && /^[a-z0-9]{4,12}$/.test(g); }
  function duel(graine) {
    var c = { ombre: "duel-" + graine, tour: 0, vues: [] }, liste = [];
    for (var i = 0; i < DUEL; i++) {
      var voie = ["prompt", "image", "savoir"][(hache(graine) + i) % 3];
      c.tour = i;
      var ep = epreuve(c, voie);
      c.vues.push(ep.voie + ":" + ep.index);
      liste.push(ep);
    }
    return liste;
  }
  function motEfficacite(eff) {
    return eff >= 2 ? "C'est très efficace !" : eff < 1 ? "Ce n'est pas très efficace…" : "";
  }

  return {
    OMBRES: OMBRES, EPREUVES: EPREUVES, GRANDE: GRANDE, EPREUVES_GRANDE: EPREUVES_GRANDE, DUEL: DUEL,
    nouveauGrande: nouveauGrande, faible: faible, graineValide: graineValide, duel: duel, BROUILLARD: BROUILLARD, BASE: BASE, COUT_TOUR: COUT_TOUR, COUT_RATE: COUT_RATE, MZ_VICTOIRE: MZ_VICTOIRE,
    efficacite: efficacite, hache: hache, nouveau: nouveau, epreuve: epreuve, jouer: jouer, motEfficacite: motEfficacite,
    RETENUES: RETENUES, retenir: retenir
  };
});
