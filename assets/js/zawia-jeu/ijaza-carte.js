// ZAW'IA — le jeu · LA CARTE DE L'IJAZA DE LA ZAWIA (إجازة الزاوية) — v7.8.
//
// Une image 1080 × 1350 qu'un membre partage ou télécharge : le certificat de
// la maison. Elle dit ce que maharat.js compte — les ijazat de terrain, le
// diplôme, le nombre de maharat prouvées — et RIEN d'autre. Aucun point,
// aucun rang gagné ici : une carte se regarde, elle ne se crédite pas.
//
// ⚠️ QUATRE RÈGLES, tenues par les tests :
//  1. `contenu()` est PUR : aucun canvas, aucun DOM, aucun réseau. Tout le
//     texte et toute la troncature vivent là — `dessiner()` ne fait que poser.
//  2. UNE CARTE SE DESSINE AUSSI QUAND LE DIPLÔME N'EST PAS OBTENU. « En
//     chemin », avec les terrains déjà tenus : c'est ce qui donne envie de
//     finir. Une carte réservée aux diplômés ne serait vue par personne.
//  3. LE VOILE : le nom qui figure sur la carte est celui de la maison de
//     SAVOIR (Jami3at al Qarawiyine), jamais celui de la maison réelle ;
//     l'adresse n'entre que si l'appelant la donne, et il ne la donne que
//     depuis *.zawia.tech (adresseJeu, jeu.js). Aucune image à charger, aucun
//     lien en dur, jamais le hasard du navigateur.
//  4. Le module lit `ZWJ.maharat` et `ZWJ.regles` par un lookup TARDIF : sous
//     Node, un test charge maharat.js d'abord, et la page les charge avant lui.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.ijazaCarte = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var W = 1080, H = 1350;
  var MAX_TERRAINS = 6;          // au-delà, « + n autres » : une carte se lit d'un coup d'œil
  var OR = "#e6b13f", IVOIRE = "#f7f1e1", SABLE = "#e8dfc8";

  // Les seuls textes de la carte. Le catalogue (les cent onze noms) se rend
  // dans sa langue depuis maharat.js : ici, l'habillage seulement.
  var TXT = {
    fr: {
      maison: "Jami3at al Qarawiyine",
      titre: "L'Ijaza de la Zawia",
      obtenue: "Obtenue",
      enChemin: "En chemin",
      terrains: "Ijazat de terrain",
      sansTerrain: "Pas encore d'ijaza de terrain",
      autres: "+ {n} autres",
      autre: "+ 1 autre",
      compte1: "1 mahara prouvée sur {t}",
      compte: "{n} maharat prouvées sur {t}",
      depuis: "Dans la cour depuis le {d}",
      note: "Une mahara se prouve par un livrable qu'un témoin regarde. Aucun point, aucun rang."
    },
    ar: {
      maison: "جامعة القرويين",
      titre: "إجازة الزاوية",
      obtenue: "محصَّلة",
      enChemin: "في الطريق",
      terrains: "إجازات الميدان",
      sansTerrain: "ما زال بلا إجازة ميدان",
      autres: "و{n} أخرى",
      autre: "وواحدة أخرى",
      compte1: "مهارة واحدة مُثبَتة من {t}",
      compte: "{n} مهارات مُثبَتة من {t}",
      depuis: "في الساحة منذ {d}",
      note: "المهارة تُثبَت بمنجَز ينظر إليه شاهد. لا نقطة، ولا رتبة."
    }
  };

  function mod(nom) {
    var g = typeof window !== "undefined" ? window : globalThis;
    return (g.ZWJ && g.ZWJ[nom]) || null;
  }

  function t(ar, cle, vals) {
    var s = (ar ? TXT.ar : TXT.fr)[cle] || TXT.fr[cle] || "";
    if (vals) for (var k in vals) s = s.split("{" + k + "}").join(String(vals[k]));
    return s;
  }

  // L'adresse ne monte sur la carte que si l'appelant l'a donnée ET qu'elle est
  // bien celle du jeu : un second garde, après celui de jeu.js. Jamais un lien.
  function adresseSure(a) {
    var s = String(a == null ? "" : a).trim().replace(/^[a-z]+:\/\//i, "").replace(/[/?#].*$/, "").toLowerCase();
    return /(^|\.)zawia\.tech$/.test(s) ? s : "";
  }

  function pseudoSur(p) {
    return String(p == null ? "" : p).replace(/\s+/g, " ").trim().slice(0, 28);
  }

  function sceauDe(pseudo) {
    var s = pseudoSur(pseudo);
    return s ? s.charAt(0).toUpperCase() : "·";
  }

  // La date du jour, à l'heure de Casablanca — jamais celle du navigateur.
  function dateDuJour(maintenant, ar) {
    var d = maintenant instanceof Date && !isNaN(maintenant.getTime()) ? maintenant : new Date();
    try {
      return new Intl.DateTimeFormat(ar ? "ar-MA-u-nu-latn" : "fr-FR",
        { timeZone: "Africa/Casablanca", day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  function dateCourte(iso, ar) {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
    var p = iso.slice(0, 10).split("-");
    return dateDuJour(new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12), ar);
  }

  // ---- Ce que la carte dit (pur) -------------------------------------------------
  // donnees : { pseudo, maharat: [cles], rang, depuis, ar, adresse, maintenant }
  function contenu(donnees) {
    var d = donnees || {}, ar = !!d.ar;
    var Mh = mod("maharat"), R = mod("regles");
    var cles = Array.isArray(d.maharat) ? d.maharat : [];
    var b = Mh ? Mh.ijazatDe(cles) : { ijazat: [], diplome: false, prouvees: 0 };
    var total = Mh ? Mh.MAHARAT.length : 0;

    var noms = b.ijazat.map(function (c) {
      var dm = Mh ? Mh.domaine(c) : null;
      return dm ? (ar ? dm.ar : dm.nom) : c;
    });
    var terrains = noms.slice(0, MAX_TERRAINS);
    var reste = noms.length - terrains.length;
    if (reste > 0) terrains.push(reste === 1 ? t(ar, "autre") : t(ar, "autres", { n: reste }));

    var lignes = [];
    if (R && typeof d.rang === "string" && d.rang) {
      var r = R.rang(d.rang);
      if (r) lignes.push(ar ? r.ar : r.nom);
    }
    var dep = dateCourte(d.depuis, ar);
    if (dep) lignes.push(t(ar, "depuis", { d: dep }));

    return {
      maison: t(ar, "maison"),
      titre: t(ar, "titre"),
      pseudo: pseudoSur(d.pseudo),
      sceau: sceauDe(d.pseudo),
      etat: b.diplome ? "obtenue" : "en chemin",
      etatTexte: b.diplome ? t(ar, "obtenue") : t(ar, "enChemin"),
      terrainsTitre: noms.length ? t(ar, "terrains") : t(ar, "sansTerrain"),
      terrains: terrains,
      lignes: lignes,
      compte: b.prouvees === 1 ? t(ar, "compte1", { t: total }) : t(ar, "compte", { n: b.prouvees, t: total }),
      note: t(ar, "note"),
      date: dateDuJour(d.maintenant, ar),
      adresse: adresseSure(d.adresse),
      ar: ar
    };
  }

  // Un nom de fichier sûr : ni accent, ni espace, ni barre — un pseudo tout en
  // arabe ne laisse rien, d'où le repli.
  function nomFichier(pseudo) {
    var s = pseudoSur(pseudo);
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) { /* vieux navigateurs */ }
    s = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32).replace(/-+$/, "");
    return "ijaza-" + (s || "zawia") + ".png";
  }

  // ---- Le dessin ------------------------------------------------------------------
  function etoile8(c, x, y, r) {
    c.beginPath();
    for (var i = 0; i < 16; i++) {
      var a = Math.PI / 8 * i, rr = i % 2 ? r * 0.55 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath(); c.stroke();
  }

  // Le sceau : un médaillon d'or, l'étoile à huit branches, l'initiale au
  // centre. Dessiné en code — aucune image à charger, donc rien à attendre.
  function dessinerSceau(c, x, y, r, lettre, police) {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = "rgba(230, 177, 63, 0.10)"; c.fill();
    c.strokeStyle = OR; c.lineWidth = 6; c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(x, y, r - 16, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3; etoile8(c, x, y, r - 36);
    c.fillStyle = OR; c.font = "600 " + Math.round(r * 0.78) + "px " + police;
    c.textBaseline = "middle";
    c.fillText(lettre, x, y + 2, r * 1.2);
    c.textBaseline = "alphabetic";
  }

  // Un paragraphe court, coupé aux mots.
  function lignesDeTexte(c, texte, large) {
    var mots = String(texte || "").split(" "), out = [], ligne = "";
    for (var i = 0; i < mots.length; i++) {
      var essai = ligne ? ligne + " " + mots[i] : mots[i];
      if (ligne && c.measureText(essai).width > large) { out.push(ligne); ligne = mots[i]; }
      else ligne = essai;
    }
    if (ligne) out.push(ligne);
    return out;
  }

  function dessiner(canvas, donnees) {
    if (!canvas || typeof canvas.getContext !== "function") return null;
    var d = contenu(donnees), ar = d.ar, c = canvas.getContext("2d");
    if (!c) return null;
    canvas.width = W; canvas.height = H;

    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#123a2f"); g.addColorStop(1, "#07140f");
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // le semis d'étoiles, comme la carte du Rafiq
    c.strokeStyle = "rgba(230, 177, 63, 0.10)"; c.lineWidth = 2;
    for (var y = 60, k = 0; y < H; y += 120, k++) {
      for (var x = 60 + (k % 2) * 60; x < W; x += 120) etoile8(c, x, y, 34);
    }
    c.strokeStyle = OR; c.lineWidth = 6; c.strokeRect(30, 30, W - 60, H - 60);
    c.lineWidth = 2; c.strokeRect(44, 44, W - 88, H - 88);

    c.textAlign = "center";
    try { c.direction = ar ? "rtl" : "ltr"; } catch (err) { /* les vieux navigateurs */ }
    var caps = ar ? '"Amiri", serif' : '"Cinzel", serif';
    var serif = ar ? '"Amiri", serif' : '"Cormorant Garamond", Georgia, serif';
    var texte = ar ? '"Amiri", serif' : '"Inter", sans-serif';
    var large = W - 200;

    c.fillStyle = OR; c.font = "600 32px " + caps;
    c.fillText(d.maison, W / 2, 112, large);

    dessinerSceau(c, W / 2, 330, 132, d.sceau, caps);

    c.fillStyle = OR; c.font = "600 46px " + caps;
    c.fillText(d.titre, W / 2, 566, large);

    c.fillStyle = IVOIRE; c.font = "700 72px " + serif;
    c.fillText(d.pseudo, W / 2, 646, large);

    if (d.lignes.length) {
      c.fillStyle = SABLE; c.font = "400 30px " + texte;
      c.fillText(d.lignes.join(" · "), W / 2, 700, large);
    }

    c.fillStyle = d.etat === "obtenue" ? OR : SABLE;
    c.font = "600 42px " + serif;
    c.fillText(d.etatTexte, W / 2, 776, large);

    c.fillStyle = "rgba(232, 223, 200, 0.7)"; c.font = "400 28px " + texte;
    c.fillText(d.terrainsTitre, W / 2, 840, large);

    c.fillStyle = IVOIRE; c.font = "400 28px " + texte;
    var yy = 878;
    d.terrains.forEach(function (n) { c.fillText(n, W / 2, yy, large); yy += 34; });

    // ⚠️ le compte suit la liste, mais il ne descend jamais dans le pied :
    // à sept terrains il tombait SUR la note (vu à l'écran, pas dans un test).
    c.fillStyle = OR; c.font = "600 30px " + texte;
    c.fillText(d.compte, W / 2, Math.min(yy + 34, 1122), large);

    c.fillStyle = "rgba(232, 223, 200, 0.62)"; c.font = "400 22px " + texte;
    lignesDeTexte(c, d.note, large).slice(0, 2).forEach(function (l, i) {
      c.fillText(l, W / 2, 1168 + i * 28, large);
    });

    c.fillStyle = SABLE; c.font = "400 25px " + texte;
    c.fillText(d.date, W / 2, 1238, large);

    if (d.adresse) {
      c.fillStyle = OR; c.font = "600 28px " + caps;
      c.fillText(d.adresse, W / 2, 1290, large);
    }
    return d;
  }

  return {
    LARGEUR: W, HAUTEUR: H, MAX_TERRAINS: MAX_TERRAINS, TXT: TXT,
    contenu: contenu, dessiner: dessiner, nomFichier: nomFichier,
    adresseSure: adresseSure, sceauDe: sceauDe
  };
});
