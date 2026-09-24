// ZAW'IA — le jeu · LES TARIQAT (الطُّرُق) ET LES MAYADIN (الميادين) : le rôle et le terrain (pur).
//
// v7.0 (19/09/2026, décisions D1–D8 de Youssef). La TARIQA dit COMMENT un membre
// sert la maison — il bâtit, il transmet, il vérifie, il vend, il écrit ; le
// MAYDAN dit OÙ sa sna3a sert — finance, ventes, RH… Les deux se choisissent
// après le prologue (le mou'allim demande), se lisent au carnet, au Lawh et sur
// le tapis. Ce qu'une zawia a toujours abrité : une tariqa.
//
// L'ARTICULATION AVEC LES CINQ DEGRÉS (spec § 3 bis) : l'échelle est verticale
// et unique — Talib · Mt3ellem · M3ellem · Fqih · Morchid, au M39ol, pour tous ;
// la tariqa est horizontale : elle dit de quoi est faite la marche que chaque
// degré demande (la ferracha d'un Mt3ellem, le Talib qu'un M3ellem forme). Les
// degrés du haut — Fqih, Morchid — servent toute la maison. Le titre se lit
// rang d'abord : « Mt3ellem · Bannay », comme « maître tanneur ».
//
// ⚠️ TROIS RÈGLES, tenues par les tests :
//  1. AUCUN POINT : ni compteur, ni bonus sur un axe. La tariqa est un rôle
//     (l'équipe de la Twiza), pas un quatrième axe. Ce module n'écrit jamais
//     un compteur ; regles.js ne le lit pas.
//  2. LES RANGS RESTENT UNIVERSELS : aucune clé d'ici n'est une clé de RANGS,
//     de SNA3A_NIVEAUX, de DHAKIRA_NIVEAUX ni de VOIES (« Sani3 » est un niveau
//     de Sna3a — d'où Bannay ; « voie » est pris — d'où Tariqa).
//  3. RIEN NE SE FERME PAR LA TARIQA : elle nomme, elle oriente, elle trie.
//
// Le délai (DELAI_JOURS entre deux changements, libre pendant l'Arb3ine) est
// le même dans zawia-joueurs.sql (la garde) — un test compare. `tariqaDepuis`
// est écrit par le SERVEUR (now()), jamais ici : ce module ne fait que le lire.
// Le patron de chaque tariqa est un Mourchid de recit.js (`ville`) : son
// portrait existe déjà, la page le montre.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.tariqa = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var DELAI_JOURS = 90;      // une saison : le Mawsem est trimestriel
  var ARB3INE_JOURS = 40;    // regles.js le porte aussi (un test compare)
  var JOUR_MS = 24 * 60 * 60 * 1000;

  // ---- Les cinq tariqat ----------------------------------------------------------
  // `ville` : le Mourchid patron (une clé de MOURCHIDINE) — jamais un nom réel.
  var TARIQAT = [
    { cle: "bannay", nom: "Bannay", ar: "البنّاي", ville: "marrakech",
      geste: "Celui qui bâtit.",
      rpg: "Dans un RPG : le guerrier.",
      vie: "Dans la vraie vie : dev, data, no-code, produit, automatisations — ceux qui outillent.",
      ferracha: "Mt3ellem, ta ferracha est un outil qui tourne — vibe codé ou écrit à la main, pourvu qu'un autre s'en serve.",
      silsila: "M3ellem, tu prends un Talib de ta tariqa et tu lui apprends le geste : c'est la silsila.",
      premier: { maison: "Ton premier geste : un Ta7addi à l'établi de la Madrasa, puis le premier Masar.",
                 libre: "Ton premier geste : une page du sandouq, puis ton étal au Souk." } },
    { cle: "mourabbi", nom: "Mourabbi", ar: "المربّي", ville: "fes",
      geste: "Celui qui transmet, et qui porte.",
      rpg: "Dans un RPG : le soigneur.",
      vie: "Dans la vraie vie : formateurs, enseignants, mentors, coachs, RH-formation, animateurs de communauté.",
      ferracha: "Mt3ellem, ta ferracha est un Talib accompagné pendant son Arb3ine, ou une halqa que tu as animée.",
      silsila: "M3ellem, tu mènes un Talib jusqu'à Mt3ellem — la ligne à +300 de la charte, et c'est ton métier.",
      premier: { maison: "Ton premier geste : salue trois personnes au Sahn, et note le mercredi de la maison au Riwaq.",
                 libre: "Ton premier geste : salue trois personnes au Sahn, et pose une question au cercle." } },
    { cle: "amin", nom: "Amin", ar: "الأمين", ville: "rabat",
      geste: "Celui qui vérifie, et qui garde.",
      rpg: "Dans un RPG : le mage-gardien, celui qui sait ce qui est vrai.",
      vie: "Dans la vraie vie : juristes, comptables, auditeurs, sécurité, conformité, chercheurs, historiens, qualité.",
      ferracha: "Mt3ellem, ta ferracha est une relecture : un livrable ou une page relus, avec ce qui casse dit à voix haute.",
      silsila: "M3ellem, tu apprends à un Talib à lire une source avant de croire un modèle.",
      premier: { maison: "Ton premier geste : une page du sandouq, sa source lue ; puis cinq questions au rihal.",
                 libre: "Ton premier geste : une page du sandouq, avec sa source lue jusqu'au bout." } },
    { cle: "tajir", nom: "Tajir", ar: "التاجر", ville: "casablanca",
      geste: "Celui qui vend sa sna3a, et ouvre les portes.",
      rpg: "Dans un RPG : le marchand.",
      vie: "Dans la vraie vie : fondateurs, commerciaux, business developers, partenariats, acheteurs.",
      ferracha: "Mt3ellem, ta ferracha est une affaire conclue à la Rahba, ou un partenaire amené à la maison.",
      silsila: "M3ellem, tu apprends à un Talib à vendre sans hchouma — et jamais dans la halqa.",
      premier: { maison: "Ton premier geste : sors par le Bab et pose ton étal sur la Rahba.",
                 libre: "Ton premier geste : sors par le Bab et pose ton étal sur la Rahba." } },
    { cle: "warraq", nom: "Warraq", ar: "الورّاق", ville: "oujda",
      geste: "Celui qui écrit, et qui raconte.",
      rpg: "Dans un RPG : le barde.",
      vie: "Dans la vraie vie : contenu, communication, médias, design, vidéo, documentation.",
      ferracha: "Mt3ellem, ta ferracha est une notice qu'un autre peut suivre — une wasfa, un tuto, un post-mortem.",
      silsila: "M3ellem, tu apprends à un Talib à écrire pour sa mère : si elle ne comprend pas, ce n'est pas écrit.",
      premier: { maison: "Ton premier geste : cinq lignes dans ton daftar, puis propose une wasfa au Kounnach.",
                 libre: "Ton premier geste : cinq lignes dans ton daftar, puis propose une wasfa au Kounnach." } }
  ];

  // Ce que les degrés du haut doivent à tous — la même phrase pour les cinq.
  var TRANSVERSAL = "Fqih, tu valides les ijazat de toutes les tariqat ; Morchid, tu gardes la culture. Les degrés du haut servent toute la maison.";
  // La phrase du quarantième jour (le carnet, le panneau).
  var RAPPEL = "On ne te demande rien pendant l'Arb3ine. Le quarantième jour, on pose sa première ferracha — et on dit d'où l'on sert.";

  // ---- Les douze mayadin ---------------------------------------------------------
  // Des FONCTIONS, pas des industries (la fiche du site porte le secteur d'un
  // projet). Jamais le nom d'un cours : « Finance & comptabilité », rien d'autre.
  var MAYADIN = [
    { cle: "finance",    nom: "Finance & comptabilité",             ar: "المالية والمحاسبة" },
    { cle: "ventes",     nom: "Ventes & commerce",                  ar: "المبيعات والتجارة" },
    { cle: "marketing",  nom: "Marketing & marque",                 ar: "التسويق والعلامة" },
    { cle: "rh",         nom: "RH, formation & recrutement",        ar: "الموارد البشرية والتكوين" },
    { cle: "juridique",  nom: "Juridique & conformité",             ar: "القانون والامتثال" },
    { cle: "tech",       nom: "Tech, data & IA",                    ar: "التقنية والبيانات والذكاء الاصطناعي" },
    { cle: "operations", nom: "Opérations, industrie & logistique", ar: "العمليات والصناعة واللوجستيك" },
    { cle: "direction",  nom: "Direction & stratégie",              ar: "القيادة والاستراتيجية" },
    { cle: "education",  nom: "Éducation & recherche",              ar: "التعليم والبحث" },
    { cle: "sante",      nom: "Santé & social",                     ar: "الصحة والعمل الاجتماعي" },
    { cle: "creation",   nom: "Création, design & médias",          ar: "الإبداع والتصميم والإعلام" },
    { cle: "public",     nom: "Service public & territoires",       ar: "الشأن العام والجماعات" }
  ];
  var SANS_MAYDAN = { nom: "Plusieurs terrains, ou pas encore", ar: "عدة ميادين، أو ليس بعد" };

  function tariqa(cle) {
    for (var i = 0; i < TARIQAT.length; i++) if (TARIQAT[i].cle === cle) return TARIQAT[i];
    return null;
  }
  function maydan(cle) {
    for (var i = 0; i < MAYADIN.length; i++) if (MAYADIN[i].cle === cle) return MAYADIN[i];
    return null;
  }
  function patron(cle) { var q = tariqa(cle); return q ? q.ville : null; }

  // ---- Ce que porte un joueur, remis d'aplomb ---------------------------------------
  // Une clé inconnue retombe à null — jamais une chaîne vide. `depuis` ne vaut
  // qu'avec une tariqa (une date orpheline ne dit rien).
  function dateValide(s) { return typeof s === "string" && !isNaN(Date.parse(s)); }
  function normaliser(j) {
    var t = j && tariqa(j.tariqa) ? j.tariqa : null;
    var m = j && maydan(j.maydan) ? j.maydan : null;
    var d = j && dateValide(j.tariqaDepuis) ? j.tariqaDepuis : null;
    return { tariqa: t, maydan: m, depuis: t ? d : null };
  }

  // Le laqab : « Bannay · Finance & comptabilité » — le rang se lit AVANT, ailleurs.
  function laqab(j, ar) {
    var n = normaliser(j), q = tariqa(n.tariqa), m = maydan(n.maydan);
    if (!q) return "";
    var base = ar ? q.ar : q.nom;
    return m ? base + " · " + (ar ? m.ar : m.nom) : base;
  }

  function attentes(cle) {
    var q = tariqa(cle);
    return q ? [q.ferracha, q.silsila, TRANSVERSAL] : [];
  }
  function premierGeste(cle, maison) {
    var q = tariqa(cle);
    return q ? (maison ? q.premier.maison : q.premier.libre) : "";
  }

  // ---- Changer : libre pendant l'Arb3ine, puis une fois par saison --------------------
  // Le Morchid passe toujours (il teste les cinq) ; sans tariqa, ou sans date
  // (une ligne d'avant la colonne), on choisit librement. La garde SQL tient la
  // même règle ; ici on refuse AVANT, avec un mot.
  function peutChanger(j, maintenant, morchid) {
    var n = normaliser(j);
    if (morchid || !n.tariqa || !n.depuis) return { ok: true };
    var now = dateValide(maintenant) ? Date.parse(maintenant) : Date.now();
    var debut = j && dateValide(j.arb3ineDebut) ? Date.parse(j.arb3ineDebut) : NaN;
    if (!isNaN(debut) && now < debut + ARB3INE_JOURS * JOUR_MS) return { ok: true };
    var restants = Math.ceil((Date.parse(n.depuis) + DELAI_JOURS * JOUR_MS - now) / JOUR_MS);
    if (restants <= 0) return { ok: true };
    return { ok: false, jours: restants,
      texte: "Tu as pris cette tariqa il y a moins d'une saison : encore " + restants + " jour" + (restants > 1 ? "s" : "") + " avant d'en changer." };
  }
  // Ce que le joueur devient — `tariqaDepuis` ici n'est qu'un AFFICHAGE en attendant
  // la valeur de la base (la garde pose la sienne, qui gagne à la session suivante).
  function changer(j, cle, maintenant) {
    var n = normaliser(j);
    if (!tariqa(cle)) return { tariqa: n.tariqa, tariqaDepuis: n.depuis };
    if (cle === n.tariqa) return { tariqa: n.tariqa, tariqaDepuis: n.depuis };
    return { tariqa: cle, tariqaDepuis: dateValide(maintenant) ? maintenant : new Date().toISOString() };
  }

  // ---- Le panneau unique des anciens (recit.tariqa.vu) -----------------------------------
  function aDemander(j) {
    if (normaliser(j).tariqa) return false;
    var r = j && j.recit && j.recit.tariqa;
    return !(r && typeof r === "object" && typeof r.vu === "string" && r.vu);
  }
  function marquerVu(recit, quand) {
    var r = recit && typeof recit === "object" ? Object.assign({}, recit) : {};
    r.tariqa = { vu: dateValide(quand) ? quand : new Date().toISOString() };
    return r;
  }

  // ---- Ce que dit le mou'allim, et le carnet ----------------------------------------------
  function demande() {
    return {
      nom: "Le mou'allim · Fès",
      pages: [
        "Les Mourchidine t'ont choisi. Reste une chose qu'eux ne peuvent pas décider à ta place : par quel geste tu sers la maison — ta Tariqa.",
        "On ne te demande rien pendant l'Arb3ine. Mais dis-moi déjà vers où tu penches : tu pourras changer. Le rang, lui, est le même pour tous — on entre Talib, et l'on monte au M39ol."
      ]
    };
  }
  function carnet(j) {
    var n = normaliser(j), q = tariqa(n.tariqa), m = maydan(n.maydan);
    if (!q) return ["Pas encore de tariqa : Menu › Ma tariqa.", RAPPEL];
    return [
      "Ta Tariqa : " + q.nom + " — " + q.geste,
      m ? "Ton maydan : " + m.nom + "." : "Ton maydan : pas encore dit.",
      "Le rang est le même pour tous ; la tariqa dit de quoi ta marche est faite."
    ];
  }

  return {
    TARIQAT: TARIQAT, MAYADIN: MAYADIN, SANS_MAYDAN: SANS_MAYDAN, TRANSVERSAL: TRANSVERSAL, RAPPEL: RAPPEL,
    DELAI_JOURS: DELAI_JOURS, ARB3INE_JOURS: ARB3INE_JOURS,
    tariqa: tariqa, maydan: maydan, patron: patron, normaliser: normaliser, laqab: laqab,
    attentes: attentes, premierGeste: premierGeste, peutChanger: peutChanger, changer: changer,
    aDemander: aDemander, marquerVu: marquerVu, demande: demande, carnet: carnet
  };
});
