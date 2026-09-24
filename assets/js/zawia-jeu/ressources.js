// ZAW'IA — le jeu · LE RIWAQ : ce que la maison annonce (pur : ni DOM, ni réseau).
//
// Le riwaq est la galerie couverte qui fait le tour de la cour d'une médersa —
// le passage où l'on attend la leçon, et où l'on affiche ce qui va se tenir.
// C'est la salle où le joueur trouve les RENDEZ-VOUS — les rencontres de la
// maison, avec le lien pour venir. Les deux autres genres que ce module
// normalise se lisent à la BIBLIOTHÈQUE de la Khizana (bibliotheque.js) :
//
//   · les RESSOURCES    — ce que la maison propose d'apprendre, ailleurs ;
//   · les PRODUITS      — le catalogue : ce que la maison propose, tout court.
//
// v1.9 — la Chajara : la colonne `ouverte` (zawia-ressources.sql) décide de ce
// qu'un Talib libre reçoit. Le filtrage est fait par la BASE (policy RLS) —
// ce module normalise ce qui arrive, il ne cache rien lui-même.
//
// ⚠️ AUCUN LIEN, AUCUN NOM N'EST ÉCRIT ICI. Tout vient de la table
//    `zawia_ressources` et se remplit à la main dans la base. Deux raisons, et
//    la seconde est la vraie :
//    1. un lien de visio change chaque semaine — le mettre dans le code
//       obligerait à redéployer le jeu pour une réunion ;
//    2. LE VOILE. Ces fichiers sont servis à tout le monde ; la maison ne s'y
//       nomme pas (ZAWIA-VOILE.md, et un test le vérifie). Le jour où des
//       liens qui la nomment sont posés en base, ce sont EUX qui la nomment,
//       devant les joueurs qui ouvrent cette salle — c'est une décision de la
//       maison, pas un effet de bord du code. Le code, lui, reste muet.
//
// ⚠️ Et la place de cette salle est un choix, pas un détail : la cinquième
//    motivation du jeu (recit.js) dit que l'annonce des formations est une
//    CONSÉQUENCE, jamais un but — « au Souk, dehors des murs, jamais au-dessus
//    d'une tête ni dans une halqa ». D'où une salle où l'on entre, et jamais
//    une bannière au-dessus du jeu.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.ressources = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // v7.3 — « defi » : l'énoncé du défi du Voilé. Il change à chaque saison,
  // donc il vit EN BASE comme les rencontres et le catalogue — jamais dans un
  // fichier servi, qui serait périmé en un mois et nommerait la maison.
  var GENRES = ["rendezvous", "ressource", "produit", "defi"];
  var FUSEAU = "Africa/Casablanca";   // l'heure de la maison, pas celle du joueur
  var AVANT = 15 * 60 * 1000;         // on ouvre le lien un quart d'heure avant
  var APRES = 2 * 60 * 60 * 1000;     // et une rencontre reste « en cours » deux heures

  // ---- Les liens -------------------------------------------------------------------
  // La table se remplit à la main : un copier-coller malheureux ne doit pas
  // devenir un lien cliquable. On n'accepte que https — ni javascript:, ni
  // data:, ni un chemin relatif qui pointerait ailleurs dans la page.
  function lienSur(url) {
    if (typeof url !== "string") return false;
    var u = url.trim();
    if (!/^https:\/\/[^\s<>"']+$/i.test(u)) return false;
    return u.length <= 500;
  }

  function nettoyer(t, max) {
    if (typeof t !== "string") return "";
    return t.replace(/\s+/g, " ").trim().slice(0, max || 160);
  }

  function normaliser(lignes) {
    if (!lignes || !lignes.length) return [];
    var out = [];
    for (var i = 0; i < lignes.length; i++) {
      var l = lignes[i] || {};
      if (l.visible === false) continue;
      var genre = GENRES.indexOf(l.genre) >= 0 ? l.genre : null;
      var titre = nettoyer(l.titre, 90);
      if (!genre || !titre) continue;          // sans genre ni titre, la ligne ne sert à rien
      var quand = null;
      if (l.quand) {
        var d = new Date(l.quand);
        if (!isNaN(d.getTime())) quand = d.toISOString();
      }
      out.push({
        id: typeof l.id === "string" ? l.id : String(i),
        genre: genre,
        titre: titre,
        detail: nettoyer(l.detail, 220),
        lien: lienSur(l.lien) ? l.lien.trim() : null,
        quand: quand,
        ordre: typeof l.ordre === "number" ? l.ordre : 0
      });
    }
    return out;
  }

  // ---- L'heure, dite en français ----------------------------------------------------
  function quandTexte(iso, maintenant) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var jour, heure;
    try {
      jour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSEAU }).format(d);
      heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU }).format(d);
    } catch (e) {
      jour = d.toISOString().slice(0, 10); heure = d.toISOString().slice(11, 16);
    }
    var texte = jour + ", " + heure;
    var m = maintenant ? new Date(maintenant) : new Date();
    var ecart = d.getTime() - m.getTime();
    if (ecart <= AVANT && ecart > -APRES) return "c'est maintenant — " + texte;
    var jours = Math.round(ecart / 86400000);
    if (ecart > 0 && jours <= 0) return "aujourd'hui, " + heure;
    if (jours === 1) return "demain, " + heure;
    if (jours > 1 && jours <= 14) return "dans " + jours + " jours — " + texte;
    return texte;
  }

  // Une rencontre est-elle ouverte ? (le bouton « Rejoindre » n'apparaît qu'alors)
  function ouverte(r, maintenant) {
    if (!r || !r.quand) return false;
    var t = new Date(r.quand).getTime();
    var m = (maintenant ? new Date(maintenant) : new Date()).getTime();
    return t - m <= AVANT && m - t <= APRES;
  }

  // ---- Ce que la salle montre --------------------------------------------------------
  function etat(lignes, maintenant) {
    var tout = normaliser(lignes);
    var m = (maintenant ? new Date(maintenant) : new Date()).getTime();

    var rdv = tout.filter(function (r) { return r.genre === "rendezvous"; })
      // une rencontre passée depuis plus de deux heures ne s'affiche plus :
      // une salle qui annonce ce qui est fini n'annonce plus rien
      .filter(function (r) { return !r.quand || new Date(r.quand).getTime() > m - APRES; })
      .sort(function (a, b) {
        if (!a.quand) return 1;
        if (!b.quand) return -1;
        return new Date(a.quand) - new Date(b.quand);
      });

    var parOrdre = function (a, b) { return (a.ordre - b.ordre) || a.titre.localeCompare(b.titre, "fr"); };
    var res = tout.filter(function (r) { return r.genre === "ressource"; }).sort(parOrdre);
    // le catalogue : même tri que les ressources — l'ordre est celui que la
    // maison a posé, jamais celui d'une popularité calculée ici
    var prod = tout.filter(function (r) { return r.genre === "produit"; }).sort(parOrdre);
    // Le défi ouvert : le plus récent posé. `detail` porte l'énoncé.
    var dfs = tout.filter(function (r) { return r.genre === "defi"; }).sort(parOrdre);

    return {
      rendezvous: rdv,
      prochain: rdv.length ? rdv[0] : null,
      ressources: res,
      produits: prod,
      defi: dfs.length ? { titre: dfs[0].titre, enonce: dfs[0].detail, saison: dfs[0].lien || null } : null,
      vide: rdv.length === 0 && res.length === 0 && prod.length === 0
    };
  }

  // ---- LES SÉANCES : le point hebdo, et le premier M39ol du jeu -----------------------
  // Une séance n'est pas un rendez-vous comme les autres : on y gagne un point,
  // et pour ça il faut prouver qu'on était là. La preuve est un mot de passe
  // dit PENDANT la rencontre, à saisir avant la limite (un quart d'heure après
  // la fin). Le mot ne transite jamais par ici : il reste en base, et c'est une
  // fonction serveur qui compare (zawia-seances.sql).
  //
  // Cinq états, et l'écran n'en montre qu'un à la fois :
  //   avenir    — pas encore commencée : la date et le lien
  //   ouverte   — en cours, ou dans le quart d'heure qui suit : le champ s'ouvre
  //   validee   — déjà validée par ce joueur : ☑, et plus de champ
  //   sans_mot  — commencée, mais aucun mot posé en base : on le dit
  //   fermee    — la limite est passée
  function etatSeance(s, maintenant) {
    if (!s || !s.debut) return { etat: "fermee" };
    var m = (maintenant ? new Date(maintenant) : new Date()).getTime();
    var d = new Date(s.debut).getTime();
    var lim = s.limite ? new Date(s.limite).getTime() : d + 2 * 60 * 60 * 1000 + 15 * 60 * 1000;
    if (s.validee) return { etat: "validee" };
    if (m < d) return { etat: "avenir" };
    if (m > lim) return { etat: "fermee" };
    if (!s.mot_pose) return { etat: "sans_mot" };
    return { etat: "ouverte" };
  }

  // Les séances qui méritent d'être affichées : celles à venir, celle en cours,
  // et celles qu'on vient de valider. Une séance passée et non validée ne sert
  // plus à rien — on ne montre pas à quelqu'un ce qu'il a manqué.
  function seancesUtiles(liste, maintenant) {
    var m = (maintenant ? new Date(maintenant) : new Date()).getTime();
    return (liste || []).filter(function (s) {
      if (!s || !s.debut) return false;
      var lim = s.limite ? new Date(s.limite).getTime() : new Date(s.debut).getTime();
      return lim >= m || s.validee;
    }).sort(function (a, b) { return new Date(a.debut) - new Date(b.debut); });
  }

  return {
    GENRES: GENRES, FUSEAU: FUSEAU,
    etatSeance: etatSeance, seancesUtiles: seancesUtiles,
    lienSur: lienSur, normaliser: normaliser,
    quandTexte: quandTexte, ouverte: ouverte, etat: etat
  };
});
