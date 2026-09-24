// ZAW'IA — le jeu · LA KHARITA (الخريطة) : la carte du grand monde (pur).
//
// v4.0 — la carte des mots du site devient l'écran de voyage du jeu. Elle
// s'ouvre effacée : Nsyan a arraché les pages, il a aussi effacé les villes.
// Une ville REVIENT sur la carte quand le joueur retrouve une de ses pages au
// sandouq. Fès est là dès le premier jour : c'est la maison, on y est.
//
// Ce module ne dessine rien : il dit quelles villes sont revenues, ce que
// chacune tient (ses pages, ce qu'on y fait) et écrit la fiche d'une ville.
// Le dessin est celui du site (assets/js/zawia-kharita.js, window.ZWK), avec
// son option `brouillard` — une seule carte pour le site et le jeu.
//
// ⚠️ Cliquer une ville OUVRE SA FICHE, on n'y voyage pas encore. Seule Fès est
//    bâtie ; les autres disent ce qu'on y fera, sans date — la maison ne
//    promet pas ce qui n'est pas posé (« ce qui est promis porte une date » :
//    la page de Rabat le dit mieux que nous).
// ⚠️ Une ville revenue ne donne RIEN : ni M39ol, ni rang, ni Dhakira de plus.
//    La Dhakira se gagne à la page, pas à la ville — sinon on compte deux fois.
// ⚠️ Le voile vaut ici comme partout : la maison ne se nomme pas.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.kharita = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // La maison : revenue d'emblée, quoi que dise le sandouq.
  var MAISON = "fes";

  // Ce qu'on fait dans chaque ville — le tableau des villes du document de
  // conception du jeu, dit au joueur. `batie` : la ville est jouable. `deja` :
  // ce qui, de cette ville, existe déjà dans la maison (vrai aujourd'hui, à
  // tenir à jour quand une salle bouge).
  var VILLES = [
    { cle: "fes", batie: true,
      quoi: "La maison : le Bab, le Sahn, la Khizana, la Madrasa, la Qa3a — et le sandouq, où les pages reviennent." },
    { cle: "marrakech", batie: false,
      quoi: "Le Foundouk : les Ta7addi de la semaine et le tableau des blocages.",
      deja: "L'établi et le tableau t'attendent déjà dans la maison." },
    { cle: "meknes", batie: false,
      quoi: "La galerie : les notices des membres, et le mur des Athar." },
    { cle: "agadir", batie: false,
      quoi: "L'atelier des recommencements : ce qui a cassé, montré sans honte." },
    { cle: "rabat", batie: false,
      quoi: "Le Diwan : le registre, et ce que la maison garde de toi." },
    { cle: "casablanca", batie: false,
      quoi: "Le Souk, dehors des murs : chacun y étale ce qu'il a fait.",
      deja: "Le Souk est déjà ouvert, passé le Bab de la maison." },
    { cle: "dakhla", batie: false,
      quoi: "Le Mawsem : le grand rassemblement de la saison, là où un rang change." },
    { cle: "tanger", batie: false,
      quoi: "Le dehors : ce qui sort de la maison vers le monde." },
    { cle: "oujda", batie: false,
      quoi: "La voix : la maison à distance, pour que personne ne soit trop loin." }
  ];
  function ville(cle) {
    for (var i = 0; i < VILLES.length; i++) if (VILLES[i].cle === cle) return VILLES[i];
    return null;
  }

  // etat(liste) — `liste` est `P.etat(joueur.pages).liste` (pages.js) :
  // [{ cle, ville, titre, epoque, ouverte, retrouvee, ... }].
  // Rend, pour chaque ville : ses pages, combien sont retrouvées, et si elle
  // est revenue sur la carte. `brouillard` est l'objet que ZWK.svg attend.
  function etat(liste) {
    var pages = Array.isArray(liste) ? liste : [];
    var brouillard = {}, revenues = 0;
    var villes = VILLES.map(function (v) {
      var siennes = pages.filter(function (p) { return p && p.ville === v.cle; });
      var retrouvees = siennes.filter(function (p) { return p.retrouvee; }).length;
      var revenue = v.cle === MAISON || retrouvees > 0;
      if (revenue) { brouillard[v.cle] = true; revenues += 1; }
      return {
        cle: v.cle, batie: v.batie, quoi: v.quoi, deja: v.deja || null, maison: v.cle === MAISON,
        revenue: revenue, retrouvees: retrouvees, total: siennes.length,
        pages: siennes.map(function (p) {
          return { cle: p.cle, titre: p.titre, epoque: p.epoque, retrouvee: !!p.retrouvee, ouverte: p.ouverte !== false };
        })
      };
    });
    return { villes: villes, revenues: revenues, total: VILLES.length, brouillard: brouillard };
  }

  // Les villes que la dernière page a fait revenir : présentes dans `apres`,
  // absentes de `avant`. La maison n'est jamais « nouvelle ».
  function revenues(avant, apres) {
    var a = etat(avant).brouillard, b = etat(apres).brouillard;
    return Object.keys(b).filter(function (k) { return !a[k] && k !== MAISON; });
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  // La fiche d'une ville, dans le style des fiches de la carte (kh-fiche).
  //   v        : une entrée de etat(...).villes
  //   mourchid : l'entrée de recit.MOURCHIDINE ({ ville, ar, nom, role })
  //   extra    : { portrait: "chemin", mots: ["Taleb", ...] }
  function fiche(v, mourchid, extra) {
    if (!v || !mourchid) return "";
    extra = extra || {};
    var html = '<article class="kh-fiche kh-fiche--ville"><header>';
    if (extra.portrait) html += '<span class="kh-fiche-portrait"><img src="' + esc(extra.portrait) + '" alt="" width="56" height="56"></span>';
    html += '<div><p class="kh-fiche-fam">' + esc(mourchid.ville) + ' <span class="ar" dir="rtl" lang="ar">' + esc(mourchid.ar) + '</span></p>' +
      '<h3>' + esc(mourchid.nom) + '</h3><p class="kh-fiche-sous">' + esc(mourchid.role) + '</p></div></header>';

    if (!v.revenue) {
      html += '<p class="kh-fiche-txt">Nsyan a effacé la ville. Retrouve une de ses pages au sandouq, et elle revient sur la carte.</p>';
    } else {
      html += '<p class="kh-fiche-txt">' + esc(v.quoi) + '</p>';
      if (v.deja) html += '<p class="kh-fiche-txt">' + esc(v.deja) + '</p>';
      html += v.batie
        ? '<span class="kh-fiche-etat">Tu y es</span>'
        : '<span class="kh-fiche-etat kh-fiche-etat--a-batir">La ville n\'est pas encore bâtie</span>';
    }

    if (v.pages.length) {
      html += '<p class="kh-fiche-mots">Ses pages : ' + v.retrouvees + ' retrouvée' + (v.retrouvees > 1 ? 's' : '') + ' sur ' + v.total + '.</p>';
      html += '<ul class="kh-fiche-pages">' + v.pages.map(function (p) {
        var cls = p.retrouvee ? "est-retrouvee" : (p.ouverte ? "" : "est-a-venir");
        var suffixe = p.retrouvee ? "" : (p.ouverte ? " — chez Nsyan" : " — s'ouvre bientôt");
        return '<li class="' + cls + '">' + esc(p.titre) + ' · ' + esc(p.epoque) + suffixe + '</li>';
      }).join("") + '</ul>';
    }
    if (v.revenue && extra.mots && extra.mots.length) {
      html += '<p class="kh-fiche-mots">Les mots de la ville : ' + extra.mots.map(esc).join(", ") + '.</p>';
    }
    return html + "</article>";
  }

  return { MAISON: MAISON, VILLES: VILLES, ville: ville, etat: etat, revenues: revenues, fiche: fiche };
});
