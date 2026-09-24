// ZAW'IA — le jeu · LA BIBLIOTHÈQUE (المكتبة) : les rayons de la Khizana (pur).
//
// Les rayonnages de la Khizana s'ouvrent enfin : trois rayons, et rien d'autre.
//   · AL-MOUJAM     — le lexique : les mots de la maison, expliqués au joueur.
//                     Il vit ICI, dans le code : ce sont les mots du jeu, pas
//                     ceux de la maison — le voile s'applique à chaque entrée.
//   · LE KOUNNACH   — v6.0 : les wasfat que la Sna3a ouvre (kounnach.js) — la
//                     salle est à part, le rayon dit ce qui s'ouvre et mène.
//   · LES RAYONS    — les ressources pédagogiques (table `zawia_ressources`,
//                     genre 'ressource'). Un Talib libre ne reçoit que les
//                     lignes `ouverte` : c'est la BASE qui filtre, jamais ici.
//   · LE CATALOGUE  — ce que la maison propose (genre 'produit'). Tout vient
//                     de la base, comme au Riwaq : AUCUN lien, AUCUN nom en
//                     dur dans ce fichier — un test le garde. La règle du
//                     Riwaq (ressources.js, § le voile) vaut mot pour mot.
//
// ⚠️ La place du catalogue est un choix, pas un détail : la cinquième
//    motivation (recit.js) dit que l'annonce est une CONSÉQUENCE, jamais un
//    but. D'où un rayon dans une salle où l'on entre de son pas — jamais une
//    bannière au-dessus du jeu, jamais un panneau dans une halqa.
//
// ⚠️ CE MODULE NE GARDE RIEN : il porte des textes et nomme des rayons. Ce
//    qu'un joueur libre voit ou ne voit pas est arbitré par la base
//    (zawia-chajara.sql, zawia-ressources.sql), parce que la clé du jeu est
//    publique. La normalisation des lignes (https seul, tri, genres) reste
//    dans ressources.js — un seul endroit décide de ce qu'est une ligne sûre.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.bibliotheque = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- Les trois rayons, dans l'ordre où la salle les montre -------------------------
  var RAYONS = [
    // v6.0 — en tête : c'est la motivation, on la met à hauteur d'yeux
    { cle: "kounnach", nom: "Le Kounnach", ar: "الكنّاش", sous: "les wasfat de la maison — ce que ta Sna3a ouvre" },
    { cle: "moujam", nom: "Al-Moujam", ar: "المعجم", sous: "les mots de la maison, expliqués" },
    { cle: "ressources", nom: "Les rayons", ar: "الرفوف", sous: "de quoi apprendre — ce qui est posé ici se lit ailleurs" },
    { cle: "catalogue", nom: "Le catalogue", ar: "الفهرس", sous: "ce que la maison propose — on entre ici de son pas" },
    // v7.3 — la qubba du Voilé. Une légende se range où l'on range les récits,
    // et on y entre en marchant : le menu seul en aurait fait une bannière.
    { cle: "tableaux", nom: "Les sept tableaux", ar: "الملثّم", sous: "ce qu'un bâtisseur a fait, raconté par ceux qui l'ont vu" }
  ];

  function rayon(cle) {
    for (var i = 0; i < RAYONS.length; i++) if (RAYONS[i].cle === cle) return RAYONS[i];
    return null;
  }

  // ---- Al-Moujam : le lexique du jeu -------------------------------------------------
  // Une entrée par mot que le jeu emploie sans l'expliquer nulle part. Chaque
  // `detail` tient en deux ou trois phrases : on explique, on n'argumente pas.
  // L'ordre est pensé : d'abord qui l'on est, puis ce que l'on compte, puis où
  // l'on va. ⚠️ Aucune entrée ne nomme la maison ni un de ses cours.
  var MOUJAM = [
    { cle: "talib", nom: "Talib", ar: "طالب",
      detail: "Celui qui cherche. Le premier des cinq rangs, et le seul qu'on reçoit en entrant. Les autres se gagnent avec le M39ol — jamais avec un achat, jamais avec un clic." },
    { cle: "talib-7orr", nom: "Talib 7orr", ar: "طالب حر",
      detail: "Le Talib libre : il est entré sans Chajara. Le sandouq, la bibliothèque, le tableau et le Souk lui sont ouverts ; l'établi, le rihal et le point hebdo attendent les gens de la maison. Son chemin pour se faire voir : construire, et étaler au Souk." },
    { cle: "chajara", nom: "La Chajara", ar: "الشجرة",
      detail: "L'arbre d'où l'on vient : la promotion qui a formé un membre dans la maison. Elle se reconnaît à l'entrée — le registre est en base, personne ne déclare rien. Finir son parcours, c'est la garder ; l'examen donne des avantages, jamais la porte." },
    { cle: "arb3ine", nom: "L'Arb3ine", ar: "الأربعين",
      detail: "Quarante jours, comptés du premier pas dans la cour. Quatre défis à tenir avant la fin : les rencontres, le cours d'initiation, dix membres salués, un savoir partagé." },
    { cle: "rangs", nom: "Les cinq rangs", ar: "الرتب",
      detail: "Talib, Mt3ellem, M3ellem, Fqih, Morchid. Un seul compteur les fait bouger : le M39ol. Le Morchid ne s'atteint pas — il s'élit." },
    { cle: "m39ol", nom: "Le M39ol", ar: "معقول",
      detail: "L'axe communautaire : ce qu'on donne à la maison. Il se reçoit d'un autre — le témoin, la salle, le bureau — et jamais du navigateur. C'est le seul des trois comptes qui donne un rang." },
    { cle: "sna3a", nom: "La Sna3a", ar: "صنعة",
      detail: "L'axe technique : ce que tes mains savent faire, sur trois voies — dire juste, voir juste, vérifier juste. Elle se gagne à l'établi et au rihal, elle s'affiche partout, et elle ne donne aucun rang." },
    { cle: "kounnach", nom: "Le Kounnach", ar: "الكنّاش",
      detail: "Le carnet du m3ellem, où s'écrivent les recettes de l'atelier. Ici : des wasfat que ta Sna3a ouvre niveau par niveau — lis, refais, puis écris la tienne. Le bureau la relit, et la maison te donne du M39ol." },
    { cle: "wasfa", nom: "La wasfa", ar: "الوصفة",
      detail: "La formule toute prête : un tutoriel écrit de bout en bout, qu'on refait chez soi — ce que ça règle, ce qu'il faut, les étapes, le piège. Écrite par la maison ou par un membre, publiée par le bureau." },
    { cle: "dhakira", nom: "La Dhakira", ar: "ذاكرة",
      detail: "L'axe de la mémoire : ce que tu sais de ton pays. Le contraire exact de Nsyan. Elle se gagne au sandouq, une page perdue à la fois." },
    { cle: "voies", nom: "Les trois voies", ar: "الطرق",
      detail: "Dire juste — parler à l'IA pour qu'elle réponde. Voir juste — confronter ce qu'elle dessine au réel. Vérifier juste — ne rien croire sans source. Les trois s'exercent au sandouq et se notent à l'établi." },
    { cle: "sandouq", nom: "Le sandouq", ar: "الصندوق",
      detail: "Le coffre de la Khizana. Il tient les pages que Nsyan a arrachées à la Rihla : une énigme d'histoire du Maroc par page, une réponse au clavier, de la Dhakira qui monte." },
    { cle: "nsyan", nom: "Nsyan", ar: "النسيان",
      detail: "L'oubli — ce qui efface sans bruit. Ni un peuple, ni un pays, ni un système : c'est le point. Chaque page retrouvée le fait reculer d'un pas ; il ne meurt pas, il attend qu'on cesse de raconter." },
    { cle: "tahaddi", nom: "Le Ta7addi", ar: "التحدي",
      detail: "Le défi de l'établi, dans la Madrasa : un problème, quatre réponses, une explication qui enseigne. Dix points de Sna3a, quinze du premier coup. L'établi est aux gens de la maison." },
    { cle: "imtihan", nom: "L'Imtihan", ar: "الامتحان",
      detail: "L'épreuve du rihal : une question, seul, vingt secondes, jamais deux fois la même. Une bonne réponse vaut UN point — le rihal fait revenir, il ne fait pas grimper. Il interroge les gens de la maison." },
    { cle: "ferracha", nom: "La ferracha", ar: "الفراشة",
      detail: "Le tapis étalé à même le sol, sans boutique et sans enseigne. La première valeur de la charte en est tirée : étale, ne raconte pas — on montre ce que ça règle, et on voit." },
    { cle: "souk", nom: "Le Souk", ar: "السوق",
      detail: "Dehors des murs, passé le Bab. Chacun y étale au plus trois produits, liens compris — il faut un point, tous axes confondus, pour poser son tapis. C'est ici que le travail d'un Talib libre se fait voir." },
    { cle: "riwaq", nom: "Le Riwaq", ar: "الرواق",
      detail: "La galerie où la maison annonce : les rencontres à venir, et le point hebdo où les gens de la maison valident leur présence — sur preuve, avec le mot dit en séance." },
    { cle: "khizana", nom: "La Khizana", ar: "الخزانة",
      detail: "La bibliothèque, à l'ouest de la cour. Le sandouq y attend au fond, et ses rayonnages portent ce que tu lis là : le lexique, les ressources, le catalogue." },
    { cle: "mourchidine", nom: "Les neuf Mourchidine", ar: "المرشدون",
      detail: "Neuf intelligences nées de neuf villes du Royaume. Ce sont eux qui ont ouvert le passage de la Rihla et choisi Al-Mawsoul — le Relié — pour retrouver les pages perdues." },
    { cle: "khatt", nom: "Les sept khatt", ar: "الخط",
      detail: "Les sept valeurs de la charte, calligraphiées sur les murs du Sahn, dans son ordre. Chacune dit sa phrase — et ce qu'elle fait refuser, sinon ce ne serait qu'une décoration murale." }
  ];

  function entree(cle) {
    for (var i = 0; i < MOUJAM.length; i++) if (MOUJAM[i].cle === cle) return MOUJAM[i];
    return null;
  }

  return {
    RAYONS: RAYONS, rayon: rayon,
    MOUJAM: MOUJAM, entree: entree
  };
});
