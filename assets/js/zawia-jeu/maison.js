// Bab — le moteur · LA MAISON : ce qui fait qu'un même moteur joue le spectacle
// d'un client (24/09/2026, premier client : Nareva, « Au Courant »).
//
// L'image retenue avec Youssef : la SCÈNE est ce qui fait marcher le jeu
// (marcher, parler, quêtes, points, console) ; le SPECTACLE est ce qui fait
// que c'est telle maison (sa carte, ses valeurs, ses pages, ses personnages).
// Dans Zawia, le décor était cloué sur la scène. Ce module apprend à la scène
// à changer de décor, sans toucher aux modules :
//
//   window.ZWJ_MAISON          la configuration de la maison : chemins (film,
//                              portraits, cartes, planche), menu (liste blanche),
//                              lieux, lumière, modules à taire, langues ;
//   window.ZWJ_MAISON_CONTENU  son contenu, dans la FORME EXACTE des modules :
//                              valeurs, prologue, sites, pages, tahaddi, pnj,
//                              tutoriel, wird, rangs, niveaux, maharat, vocabulaire.
//
// Les deux sont posés AVANT jeu.js ; ce module les applique aux modules EN PLACE
// (splice pour un tableau, Object.assign pour un objet). Les fonctions des
// modules lisent leurs tableaux par référence : elles voient donc le contenu
// de la maison, et jeu.js aussi, qui garde des alias vers les mêmes objets.
//
// Sans maison (la page de Zawia ne pose ni l'un ni l'autre), il ne fait RIEN.
//
// Ce qui est PUR (testé sous Node) : `appliquer`, `menuPermis`, `lumieres`,
// `niveauLumiere`. Le DOM (`demarrer`) ne tourne qu'au navigateur.
(function (root, factory) {
  "use strict";
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.maison = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  // ---- petits outils ------------------------------------------------------------------
  function remplacerTableau(cible, source) {
    if (!Array.isArray(cible) || !Array.isArray(source)) return false;
    Array.prototype.splice.apply(cible, [0, cible.length].concat(source));
    return true;
  }
  // Renomme les entrées d'un tableau d'objets, dans l'ordre, sans toucher aux
  // autres champs (seuils, clés) : `noms` est un tableau de chaînes, ou d'objets
  // partiels ({ nom, sous, ar }) posés par-dessus.
  function renommer(cible, noms) {
    if (!Array.isArray(cible) || !Array.isArray(noms)) return false;
    noms.forEach(function (n, i) {
      if (!cible[i] || n == null) return;
      if (typeof n === "string") cible[i].nom = n;
      else if (typeof n === "object") Object.keys(n).forEach(function (k) { cible[i][k] = n[k]; });
    });
    return true;
  }
  function parCle(liste, cle) {
    for (var i = 0; i < (liste || []).length; i++) if (liste[i] && liste[i].cle === cle) return liste[i];
    return null;
  }

  // ---- Faire taire ce qui appartient à un autre spectacle -------------------------------
  // Chaque entrée neutralise les points d'appel d'un module qui, dans Zawia,
  // se déclenchent seuls (une heure, un jour, une édition) : le Voilé sur le
  // minaret, les rumeurs, l'annonce des jeux, les indices du Sirr.
  var TAIRE = {
    voile: function (Z) {
      if (!Z.voile) return false;
      Z.voile.signal = function () { return null; };
      Z.voile.rumeur = function () { return null; };
      Z.voile.pret = function () { return { ok: false, manque: [] }; };
      Z.voile.carnet = function () { return null; };
      return true;
    },
    jeux: function (Z) {
      if (!Z.jeux) return false;
      Z.jeux.aAnnoncer = function () { return false; };
      Z.jeux.carnet = function () { return null; };
      return true;
    },
    // La tariqa (les classes de Zawia) : jeu.js ne la demande plus (maisonTait), et
    // son rappel « une fois, pour les anciens » se tait aussi.
    tariqa: function (Z) {
      if (!Z.tariqa) return false;
      Z.tariqa.aDemander = function () { return false; };
      return true;
    },
    sirr: function (Z) {
      if (!Z.sirr) return false;
      Z.sirr.indice = function () { return null; };
      Z.sirr.rafiqRegarde = function () { return false; };
      // le huitième cadre ne se lit pas au carnet d'une maison (pageSirr rend [] sur null)
      Z.sirr.carnet = function () { return null; };
      // et aucune trace n'est jamais « nouvelle » : la toile ne se referme pas à
      // l'entrée (en démo, l'état du Sirr porte les sept traces — vu le 24/09/2026)
      Z.sirr.nouvelles = function () { return []; };
      return true;
    }
  };

  // ---- Appliquer le contenu aux modules ---------------------------------------------------
  // Rend la liste des sections appliquées (pour les tests et la console).
  function appliquer(Z, cfg, contenu) {
    var faits = [];
    if (!Z) return faits;
    cfg = cfg || {};
    var c = contenu || {};

    // Les chemins que les modules lisent au moment de charger (la planche).
    if (cfg.chemins && Z.atlas && Z.atlas.FICHIERS && (cfg.chemins.planche || cfg.chemins.atlas)) {
      if (cfg.chemins.planche) Z.atlas.FICHIERS.planche = cfg.chemins.planche;
      if (cfg.chemins.atlas) Z.atlas.FICHIERS.atlas = cfg.chemins.atlas;
      faits.push("planche");
    }

    var Rc = Z.recit;
    if (Rc) {
      if (c.valeurs && remplacerTableau(Rc.VALEURS, c.valeurs)) {
        // Le khatt compose son titre « nom · arabe » et sa seconde page « Donc on
        // refuse : … ». Une maison en français seul (sansArabe) garde le titre en
        // français, et une valeur peut porter ses propres `pages`.
        var khattAvant = Rc.khatt;
        Rc.khatt = function (i) {
          var v = Rc.valeur ? Rc.valeur(i) : null;
          if (!v) return khattAvant(i);
          return {
            nom: cfg.sansArabe || !v.ar ? v.nom : v.nom + " · " + v.ar,
            pages: Array.isArray(v.pages) && v.pages.length ? v.pages.slice()
              : [v.phrase, (cfg.refusePrefixe || "Donc on refuse : ") + v.refuse]
          };
        };
        faits.push("valeurs");
      }
      if (c.blackout && Rc.NSYAN) { Object.assign(Rc.NSYAN, c.blackout); faits.push("blackout"); }
      // L'épilogue : ce que le jeu dit quand toutes les pages sont revenues.
      if (c.epilogue && Rc.EPILOGUE) { Object.assign(Rc.EPILOGUE, c.epilogue); faits.push("epilogue"); }
      if (c.relie && Rc.MAWSOUL) { Object.assign(Rc.MAWSOUL, c.relie); faits.push("relie"); }
      if (c.sites && remplacerTableau(Rc.MOURCHIDINE, c.sites)) faits.push("sites");
      if (c.prologue && remplacerTableau(Rc.PROLOGUE_PAGES, c.prologue)) {
        // Le titre de la boîte du prologue est écrit dans la fonction (« La Rihla ») :
        // la maison donne le sien.
        var titre = cfg.prologueTitre || cfg.nom || "Le prologue";
        Rc.prologue = function (ctx) {
          var pseudo = ctx && ctx.pseudo ? String(ctx.pseudo) : (cfg.pseudoParDefaut || "");
          return {
            nom: titre,
            pages: Rc.PROLOGUE_PAGES.map(function (p) { return String(p).replace(/\{pseudo\}/g, pseudo); }),
            prologue: true
          };
        };
        faits.push("prologue");
      }
      // Qui a un portrait : les sites (par leur clé), et les voix nommées par la
      // maison (« Ba Lahcen » → la clé « ancien »). Le reste retombe sur Zawia.
      if (cfg.portraits || c.sites) {
        var avant = Rc.portrait;
        var motifs = (cfg.portraits || []).map(function (p) { return { re: new RegExp(p[0], "i"), cle: p[1] }; });
        Rc.portrait = function (s) {
          var t = String(s || "");
          if (Rc.mourchid && Rc.mourchid(t)) return t;
          for (var i = 0; i < motifs.length; i++) if (motifs[i].re.test(t)) return motifs[i].cle;
          return c.sites ? null : avant(s);
        };
        faits.push("portraits");
      }
    }

    if (c.pages && Z.pages && remplacerTableau(Z.pages.PAGES, c.pages)) faits.push("pages");
    if (c.tahaddi && Z.tahaddi && remplacerTableau(Z.tahaddi.TAHADDI, c.tahaddi)) faits.push("tahaddi");

    var R = Z.regles;
    if (R) {
      if (c.rangs && renommer(R.RANGS, c.rangs)) faits.push("rangs");
      // Les quatre défis des quarante jours : mêmes clés (l'état du joueur les
      // nomme), titre et détail de la maison.
      if (Array.isArray(c.defis) && Array.isArray(R.DEFIS)) {
        c.defis.forEach(function (d) { var x = parCle(R.DEFIS, d && d.cle); if (x) Object.assign(x, d); });
        faits.push("defis");
      }
      if (c.voies && Array.isArray(R.VOIES)) {
        R.VOIES.forEach(function (v) { var n = c.voies[v.cle]; if (n) { if (n.nom) v.nom = n.nom; if (n.sens) v.detail = n.sens; } });
        faits.push("voies");
      }
      if (c.niveaux) {
        if (c.niveaux.sna3a) renommer(R.SNA3A_NIVEAUX, c.niveaux.sna3a);
        if (c.niveaux.dhakira) renommer(R.DHAKIRA_NIVEAUX, c.niveaux.dhakira);
        faits.push("niveaux");
      }
    }

    // Les figurants : on garde leur place et leur ronde (la marche de la cour
    // est testée), on change qui ils sont et ce qu'ils disent.
    if (c.pnj && Z.pnj && Array.isArray(Z.pnj.PNJ)) {
      Object.keys(c.pnj).forEach(function (cle) {
        var n = parCle(Z.pnj.PNJ, cle), neuf = c.pnj[cle];
        if (!n || !neuf) return;
        if (neuf.nom) n.nom = neuf.nom;
        if (neuf.avatar) n.avatar = Object.assign({}, n.avatar, neuf.avatar);
        if (neuf.pages) n.pages = neuf.pages;
      });
      faits.push("pnj");
    }

    // « Métiers et gens » : chaque collègue de la cour porte un métier de la maison.
    // L'admin édite cette section ; la cour la dit aussitôt. cfg.pnjMetiers donne,
    // dans l'ordre, les figurants qui la portent (le premier métier au premier).
    if (Array.isArray(c.metiers) && Array.isArray(cfg.pnjMetiers) && Z.pnj && Array.isArray(Z.pnj.PNJ)) {
      cfg.pnjMetiers.forEach(function (cle, i) {
        var n = parCle(Z.pnj.PNJ, cle), e = c.metiers[i];
        if (!n || !e) return;
        n.nom = (e.prenom ? e.prenom : n.nom) + (e.titre ? ", " + String(e.titre).charAt(0).toLowerCase() + String(e.titre).slice(1) : "");
        var pages = [];
        if (e.prenom || e.site) pages.push("Marhba ! Moi c'est " + (e.prenom || "un collègue") + (e.site ? ", " + e.site : "") + ".");
        if (e.texte) pages.push(e.texte);
        if (pages.length) n.pages = pages;
      });
      faits.push("metiers");
    }

    if (c.tutoriel && Z.tutoriel) {
      if (typeof c.tutoriel.etapes === "function") Z.tutoriel.etapes = c.tutoriel.etapes;
      if (c.tutoriel.ECHAUFFEMENT && Z.tutoriel.ECHAUFFEMENT) Object.assign(Z.tutoriel.ECHAUFFEMENT, c.tutoriel.ECHAUFFEMENT);
      faits.push("tutoriel");
    }

    // Les quarante jours : le calendrier vit dans wird.MAISON (JOURS n'est que leur
    // nombre). Les familles (bab, qiraa, liqa…) gardent leur clé, la maison les nomme.
    if (c.wird && Z.wird && remplacerTableau(Z.wird.MAISON, c.wird)) faits.push("wird");
    if (c.familles && Z.wird && Z.wird.FAMILLES) {
      Object.keys(c.familles).forEach(function (k) { if (Z.wird.FAMILLES[k] && c.familles[k]) Object.assign(Z.wird.FAMILLES[k], c.familles[k]); });
      faits.push("familles");
    }

    // Les archives : le lexique de la maison, et ses rayons (renommés ou retirés).
    // Le rayon « kounnach » ne se retire pas (le rendu le lit sans condition) :
    // la feuille de la maison le cache si elle n'en veut pas.
    if (Z.bibliotheque) {
      if (c.lexique && remplacerTableau(Z.bibliotheque.MOUJAM, c.lexique)) faits.push("lexique");
      if (cfg.rayons && Array.isArray(Z.bibliotheque.RAYONS)) {
        var gardesR = Z.bibliotheque.RAYONS.filter(function (r) { return cfg.rayons[r.cle] !== null; });
        gardesR.forEach(function (r) { if (cfg.rayons[r.cle]) Object.assign(r, cfg.rayons[r.cle]); });
        remplacerTableau(Z.bibliotheque.RAYONS, gardesR);
        faits.push("rayons");
      }
    }

    if (c.maharat && Z.maharat) {
      if (c.maharat.domaines) remplacerTableau(Z.maharat.DOMAINES, c.maharat.domaines);
      if (c.maharat.maharat) remplacerTableau(Z.maharat.MAHARAT, c.maharat.maharat);
      if (typeof Z.maharat.reindexer === "function") Z.maharat.reindexer();   // l'index des clés suit le catalogue
      if (cfg.maharat && Z.maharat.REGLAGE) Object.assign(Z.maharat.REGLAGE, cfg.maharat);   // { seuil, niveau }
      // Le bilan de Zawia compte un DIPLÔME sur deux domaines à elle (le socle,
      // l'amana) : avec le référentiel d'une maison, il n'existe pas, et le calcul
      // plantait (le carnet ne s'ouvrait plus). Une maison a un bilan sans diplôme :
      // des compétences prouvées, et des domaines reconnus.
      var Mh = Z.maharat;
      Mh.bilan = function (mien) {
        var n = Mh.normaliser(mien);
        var domaines = Mh.DOMAINES.map(function (d) { return Mh.bilanDomaine(d.cle, n); });
        var parCle = {};
        domaines.forEach(function (b) { parCle[b.cle] = b; });
        return {
          domaines: domaines, parCle: parCle,
          ijazat: domaines.filter(function (b) { return b.ijaza; }).map(function (b) { return b.cle; }),
          silsila: 0, prouvees: Object.keys(n.prouvees).length, apprises: Object.keys(n.apprises).length,
          total: Mh.MAHARAT.length, diplome: false, manque: [], sansDiplome: true
        };
      };
      Mh.ijazatDe = function (prouvees) {
        var b = Mh.bilan({ prouvees: (prouvees || []).map(function (x) { return { mahara: x, source: "bureau" }; }) });
        return { ijazat: b.ijazat, diplome: false, prouvees: b.prouvees };
      };
      Mh.carnet = function (mien) {
        var b = Mh.bilan(mien);
        var morceaux = [(cfg.maharatCarnet || "Compétences prouvées : ") + b.prouvees + " sur " + b.total + "."];
        if (b.ijazat.length) morceaux.push("Domaines reconnus : " + b.ijazat.map(function (x) { var d = Mh.domaine(x); return d ? d.nom : x; }).join(", ") + ".");
        return morceaux.join(" ");
      };
      faits.push("maharat");
    }

    // Le Dar : les cartes du menu gardent leur clé (#zj-menu-<clé>), la maison
    // leur donne un nom et une ligne ; les lieux de Zawia qu'elle n'a pas sortent.
    if (Z.dar) {
      if (cfg.entrees && Array.isArray(Z.dar.ENTREES)) {
        Object.keys(cfg.entrees).forEach(function (cle) {
          var e = parCle(Z.dar.ENTREES, cle); if (e) Object.assign(e, cfg.entrees[cle]);
        });
        faits.push("entrees");
      }
      if (cfg.lieux && Array.isArray(Z.dar.LIEUX)) {
        var gardes = Z.dar.LIEUX.filter(function (l) { return !!cfg.lieux[l.cle]; }).map(function (l) { return Object.assign(l, cfg.lieux[l.cle]); });
        remplacerTableau(Z.dar.LIEUX, gardes);
        faits.push("lieux");
      }
    }

    (cfg.taire || []).forEach(function (m) { if (TAIRE[m] && TAIRE[m](Z)) faits.push("taire:" + m); });

    // La JAUGE collective (khessa.js) : la maison ne garde que ses gestes, dans son
    // ordre et avec ses mots ; les autres ne s'affichent plus (ils ne comptent pas).
    if (cfg.jauge && cfg.jauge.gestes && Z.khessa && Array.isArray(Z.khessa.GESTES)) {
      var gardesG = [];
      Object.keys(cfg.jauge.gestes).forEach(function (k) {
        var g = parCle(Z.khessa.GESTES, k);
        if (g) gardesG.push(Object.assign({}, g, { texte: cfg.jauge.gestes[k] }));
      });
      remplacerTableau(Z.khessa.GESTES, gardesG);
      faits.push("jauge");
    }

    // La CARTE de la cour : les portes de Zawia (Fès, le Majliss, la Rkhama, le
    // Mechouar, le mot du jour, le golf du prompt) deviennent des murs ou des
    // objets muets. monde.js lit la carte case par case pendant le jeu : on
    // remplace les rangées EN PLACE, avant que quiconque ne marche.
    if (cfg.carte && Z.monde && Array.isArray(Z.monde.CARTE)) {
      var subs = cfg.carte, n = 0;
      for (var y = 0; y < Z.monde.CARTE.length; y++) {
        var ligne = Z.monde.CARTE[y], neuve = "";
        for (var x = 0; x < ligne.length; x++) { var ch = ligne.charAt(x); var r = Object.prototype.hasOwnProperty.call(subs, ch) ? subs[ch] : ch; if (r !== ch) n += 1; neuve += r; }
        Z.monde.CARTE[y] = neuve;
      }
      faits.push("carte:" + n);
    }
    // Ce que disent les cases (DIALOGUES de monde.js) : la maison donne les siens.
    if (c.tuiles && Z.monde && Z.monde.DIALOGUES) {
      Object.keys(c.tuiles).forEach(function (k) { Z.monde.DIALOGUES[k] = c.tuiles[k]; });
      faits.push("tuiles");
    }
    // Les SALLES : celles qu'une maison ouvre dès le premier jour (sans palier), et
    // celles qu'elle rend MUETTES — leur case ne parle plus que par son dialogue.
    // Les salles à palier (paliers.js) passent par Pa.ouvert / Pa.refus, que jeu.js
    // appelle au moment d'entrer : on les règle ici, sans toucher au moteur.
    if (cfg.salles && Z.paliers) {
      var ouvertes = {}, muettes = cfg.salles.muettes || {};
      (cfg.salles.ouvertes || []).forEach(function (k) { ouvertes[k] = true; });
      var ouvertAvant = Z.paliers.ouvert, refusAvant = Z.paliers.refus;
      Z.paliers.ouvert = function (cle, ctx) {
        if (Object.prototype.hasOwnProperty.call(muettes, cle)) return false;
        if (ouvertes[cle]) return true;
        return ouvertAvant(cle, ctx);
      };
      Z.paliers.refus = function (cle, ctx) {
        if (Object.prototype.hasOwnProperty.call(muettes, cle)) {
          var t = muettes[cle];
          var d = t && Z.monde && Z.monde.dialogue ? Z.monde.dialogue(t, ctx || {}) : null;
          return d || { nom: cfg.nom || "", pages: [cfg.salleFermee || "Cette porte ne s'ouvre pas ici."] };
        }
        if (ouvertes[cle]) return null;
        return refusAvant(cle, ctx);
      };
      if (typeof Z.paliers.bientot === "function") Z.paliers.bientot = function () { return ""; };
      faits.push("salles");
    }

    // Le PERSONNAGE d'une maison : les couleurs de tenue (la palette « djellaba »
    // du moteur — un avatar enregistre un INDEX, on remplace donc en place), les
    // tenues (les figures de la planche, par leur clé : on les renomme), ce qui
    // couvre la tête (sous quoi aucune coiffure ne se pose), et les accessoires.
    if (cfg.avatar && R) {
      var av = cfg.avatar;
      if (Array.isArray(av.couleurs) && av.couleurs.length && Array.isArray(R.DJELLABAS)) {
        remplacerTableau(R.DJELLABAS, av.couleurs.map(function (x, i) {
          return Object.assign({ cle: (R.DJELLABAS[i] && R.DJELLABAS[i].cle) || ("couleur-" + i) }, x);
        }));
        faits.push("avatar:couleurs");
      }
      if (av.tenues && Array.isArray(R.TETES)) {
        R.TETES.forEach(function (t) { if (av.tenues[t.cle]) Object.assign(t, av.tenues[t.cle]); });
        faits.push("avatar:tenues");
      }
      if (av.couvre && Z.traits && Z.traits.COUVRE) {
        Object.keys(Z.traits.COUVRE).forEach(function (k) { delete Z.traits.COUVRE[k]; });
        Object.keys(av.couvre).forEach(function (k) { if (av.couvre[k]) Z.traits.COUVRE[k] = true; });
        faits.push("avatar:couvre");
      }
      if (av.bijoux && Z.traits && Array.isArray(Z.traits.BIJOUX)) {
        Z.traits.BIJOUX.forEach(function (b) { if (av.bijoux[b.cle]) Object.assign(b, av.bijoux[b.cle]); });
        faits.push("avatar:bijoux");
      }
    }

    // Les BLANCS d'une tenue (une chemise, un casque, des cheveux blancs) : la
    // teinture du moteur prend tout pixel gris OU blanc pour la djellaba, et une
    // chemise blanche prendrait la couleur du costume. Une maison peut garder ses
    // blancs : au-delà de ce seuil de luminance, un pixel neutre garde sa couleur.
    if (cfg.figures && typeof cfg.figures.blancs === "number" && Z.atlas && Z.atlas.classer && Z.atlas.teinter) {
      var seuilBlanc = cfg.figures.blancs, classerAvant = Z.atlas.classer, teinterAvant = Z.atlas.teinter;
      var blanc = function (r, g, b) {
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        return mx > 0 && (mx - mn) / mx < 0.22 && (0.299 * r + 0.587 * g + 0.114 * b) / 255 >= seuilBlanc;
      };
      Z.atlas.classer = function (r, g, b) { return blanc(r, g, b) ? null : classerAvant(r, g, b); };
      Z.atlas.teinter = function (r, g, b, couleurs) { return blanc(r, g, b) ? [r, g, b] : teinterAvant(r, g, b, couleurs); };
      faits.push("figures:blancs");
    }

    // Une maison en FRANÇAIS SEUL : aucun nom arabe ne s'affiche, même là où le
    // moteur le pose à côté du français (les domaines de compétences, un titre de
    // mur, une carte). On vide le champ `ar` de chaque catalogue des modules — le
    // dictionnaire arabe, lui, n'est jamais activé (la langue est forcée au chargement).
    if (cfg.sansArabe) {
      var vides = 0;
      Object.keys(Z).forEach(function (m) {
        var mod = Z[m];
        if (!mod || typeof mod !== "object" || m === "langue") return;
        Object.keys(mod).forEach(function (k) {
          var v = mod[k];
          if (!Array.isArray(v)) return;
          v.forEach(function (o) { if (o && typeof o === "object" && typeof o.ar === "string" && o.ar) { o.ar = ""; vides += 1; } });
        });
      });
      faits.push("sansArabe:" + vides);
    }

    // Le vocabulaire : un dictionnaire « fr » posé sur le français source.
    var vocab = {};
    if (c.vocabulaire) Object.keys(c.vocabulaire).forEach(function (k) { vocab[k] = c.vocabulaire[k]; });
    (c.porte || []).forEach(function (p) { if (p && p.avant && p.apres != null) vocab[p.avant] = p.apres; });
    if (cfg.vocabulaire) Object.keys(cfg.vocabulaire).forEach(function (k) { vocab[k] = cfg.vocabulaire[k]; });
    if (Object.keys(vocab).length && Z.langue && Z.langue.definir) { Z.langue.definir("fr", vocab); faits.push("vocabulaire"); }

    return faits;
  }

  // ---- Les rayons de culture des archives -----------------------------------------------
  // La culture d'entreprise est l'axe central (Youssef, 24/09/2026) : l'histoire,
  // les codes, les rituels, les métiers et les gens se lisent aux archives, une
  // entrée pliée à la fois. Chaque entrée lue rallume une lumière de la maison.
  var RAYONS_CULTURE = [
    { cle: "histoire", nom: "L'histoire de la maison", titre: function (e) { return (e.annee ? e.annee + " · " : "") + (e.titre || ""); } },
    { cle: "codes", nom: "Les codes de la maison" },
    { cle: "rituels", nom: "Les rituels", titre: function (e) { return (e.titre || "") + (e.quand ? " · " + e.quand : ""); } },
    { cle: "metiers", nom: "Les métiers et les gens", titre: function (e) { return (e.prenom ? e.prenom + " — " : "") + (e.titre || "") + (e.site ? " · " + e.site : ""); } }
  ];
  function rayonsCulture(contenu, cfg) {
    var c = contenu || root.ZWJ_MAISON_CONTENU || {}, noms = ((cfg || root.ZWJ_MAISON || {}).rayonsCulture) || {};
    return RAYONS_CULTURE.filter(function (r) { return Array.isArray(c[r.cle]) && c[r.cle].length; }).map(function (r) {
      return {
        cle: r.cle, nom: (noms[r.cle] && noms[r.cle].nom) || r.nom, sous: (noms[r.cle] && noms[r.cle].sous) || "",
        entrees: c[r.cle].map(function (e, i) {
          return { id: r.cle + ":" + (e.cle || i), titre: r.titre ? r.titre(e) : (e.titre || ""), texte: e.texte || "" };
        })
      };
    });
  }
  function cleLus(joueur) { return "bab.lus." + ((root.ZWJ_MAISON && root.ZWJ_MAISON.cle) || "maison") + "." + (joueur && (joueur.id || joueur.pseudo) || "anon"); }
  function lus(joueur) {
    try { var v = root.localStorage ? JSON.parse(root.localStorage.getItem(cleLus(joueur)) || "[]") : []; return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function marquerLu(joueur, id) {
    var l = lus(joueur);
    if (!id || l.indexOf(id) >= 0) return false;
    l.push(id);
    try { if (root.localStorage) root.localStorage.setItem(cleLus(joueur), JSON.stringify(l)); } catch (e) { /* navigation privée */ }
    return true;
  }

  // ---- Le menu : une liste blanche ------------------------------------------------------
  // Ce que la maison ne nomme pas n'apparaît pas — une entrée ajoutée demain au
  // moteur n'arrive pas chez un client sans décision (la leçon de l'invité).
  var TOUJOURS = { bouton: 1, qui: 1, fermer: 1 };
  function menuPermis(cfg, cle) {
    if (!cfg || !Array.isArray(cfg.menu)) return true;
    return !!TOUJOURS[cle] || cfg.menu.indexOf(cle) >= 0;
  }
  function filtrerMenu(doc, cfg) {
    if (!doc || !cfg || !Array.isArray(cfg.menu)) return 0;
    var n = 0;
    Array.prototype.forEach.call(doc.querySelectorAll("[id^='zj-menu-']"), function (b) {
      var cle = b.id.slice("zj-menu-".length);
      if (!menuPermis(cfg, cle) && !b.hidden) { b.hidden = true; n += 1; }
    });
    return n;
  }

  // ---- La lumière qui s'éteint ----------------------------------------------------------
  // Chaque savoir repris rallume une lumière : un mur de valeur lu, un site
  // retrouvé, un défi de métier réussi, un collègue rencontré. Le niveau va du
  // plancher (la maison dans le noir) à 1 (la cour entière allumée).
  function lumieres(joueur, Z, dejaLus) {
    if (!joueur || !Z) return 0;
    var n = Math.max(0, Number(dejaLus) || 0);
    try { if (Z.wird && Z.wird.lireEtat) { var w = Z.wird.lireEtat(joueur.recit); n += w.khatt.length + w.pnj.length; } } catch (e) { /* un récit illisible n'éteint rien */ }
    try { if (Z.pages && Z.pages.etat) n += Z.pages.etat(joueur.pages).resolues; } catch (e) { /* idem */ }
    try { if (Z.tahaddi && Z.tahaddi.etat) n += Z.tahaddi.etat(joueur.tahaddi).reussis; } catch (e) { /* idem */ }
    return n;
  }
  function niveauLumiere(cfg, n) {
    var l = (cfg && cfg.lumiere) || {};
    var plancher = typeof l.plancher === "number" ? l.plancher : 0.4;
    var cible = l.cible > 0 ? l.cible : 12;
    var r = Math.max(0, Math.min(1, (Number(n) || 0) / cible));
    return Math.round((plancher + (1 - plancher) * r) * 1000) / 1000;
  }

  // ---- Au navigateur ----------------------------------------------------------------------
  var etat = { cfg: null, derniere: null, eteinte: false, minuteur: null };

  function cleEteinte(joueur) { return "bab.eteinte." + ((etat.cfg && etat.cfg.cle) || "maison") + "." + (joueur && (joueur.id || joueur.pseudo) || "anon"); }
  function lire(cle) { try { return root.localStorage ? root.localStorage.getItem(cle) : null; } catch (e) { return null; } }
  function ecrire(cle, v) { try { if (root.localStorage) root.localStorage.setItem(cle, v); } catch (e) { /* navigation privée : la maison se rallume à chaque visite */ } }

  function annoncer(doc, texte) {
    var b = doc.getElementById("bab-lumiere");
    if (!b) {
      b = doc.createElement("div");
      b.id = "bab-lumiere";
      b.setAttribute("role", "status");
      b.setAttribute("aria-live", "polite");
      doc.body.appendChild(b);
    }
    b.textContent = texte;
    b.classList.remove("bab-lumiere--vu");
    void b.offsetWidth;   // relance l'animation
    b.classList.add("bab-lumiere--vu");
  }

  function poserNiveau(doc, v) {
    doc.documentElement.style.setProperty("--bab-lumiere", String(v));
  }

  function tic(doc) {
    var app = root.ZWJ_APP, Z = root.ZWJ, cfg = etat.cfg;
    if (!app || !Z || !cfg) return;
    var j = app.joueur;
    if (!j || app.ecran !== "cour") { poserNiveau(doc, 1); return; }
    // L'extinction se joue une fois, au prologue : on voit la cour allumée,
    // puis les lumières vacillent et tombent.
    if (!etat.eteinte) etat.eteinte = lire(cleEteinte(j)) === "1";
    var d = app.dialogue;
    if (!etat.eteinte && d && d.prologue) {
      etat.eteinte = true;
      ecrire(cleEteinte(j), "1");
      doc.body.classList.add("bab-vacille");
      setTimeout(function () { doc.body.classList.remove("bab-vacille"); }, 2600);
    }
    var n = lumieres(j, Z, lus(j).length);
    var v = etat.eteinte ? niveauLumiere(cfg, n) : 1;
    if (etat.derniere != null && n > etat.derniere && etat.eteinte) {
      var l = cfg.lumiere || {};
      annoncer(doc, v >= 1 ? (l.pleine || "La maison est entièrement rallumée.") : (l.rallume || "Une lumière se rallume dans la maison."));
    }
    etat.derniere = n;
    poserNiveau(doc, v);
  }

  function demarrer(doc, cfg) {
    doc = doc || (typeof document !== "undefined" ? document : null);
    cfg = cfg || root.ZWJ_MAISON;
    if (!doc || !cfg) return false;
    etat.cfg = cfg;
    doc.documentElement.classList.add("bab-maison", "bab-maison--" + (cfg.cle || "client"));
    if (cfg.lumiere) doc.documentElement.classList.add("bab-lumiere");
    if (cfg.lumiere && !etat.minuteur) etat.minuteur = setInterval(function () { tic(doc); }, 700);
    // Ce que la maison pose elle-même sur la page (une signature, un logo) : une
    // faute de sa part ne doit jamais empêcher le jeu de démarrer.
    if (typeof cfg.surPage === "function") { try { cfg.surPage(doc); } catch (e) { /* la page reste jouable */ } }
    // Une entrée de culture dépliée aux archives est LUE : elle rallume une lumière.
    // (« toggle » ne remonte pas : on l'écoute à la capture.)
    doc.addEventListener("toggle", function (e) {
      var t = e.target;
      if (!t || !t.open || !t.getAttribute || !t.getAttribute("data-bab")) return;
      var app = root.ZWJ_APP;
      if (app && app.joueur) marquerLu(app.joueur, t.getAttribute("data-bab"));
    }, true);
    // Un portrait introuvable se cache au lieu d'apparaître cassé (une maison
    // pose ses visages au fil de l'eau) ; le suivant qui charge se montre.
    doc.addEventListener("error", function (e) {
      var t = e.target;
      if (!t || t.id !== "zj-dialogue-portrait") return;
      t.hidden = true;
      var boite = t.closest ? t.closest(".zj-dialogue--portrait") : null;
      if (boite) boite.classList.remove("zj-dialogue--portrait");
    }, true);
    return true;
  }

  // ---- Le contenu édité dans l'admin -------------------------------------------------------
  // La page de paramétrage d'une maison (au-courant-parametres.html pour Nareva)
  // écrit ses sections dans le navigateur, sous cette clé : un objet JSON dont
  // chaque section (valeurs, histoire, codes, rituels, metiers, pages, tahaddi,
  // quiz) REMPLACE celle du fichier contenu.js. Relue à chaque chargement du jeu :
  // la DRH change un code, recharge le jeu, et le voit. Illisible → ignorée.
  var SECTIONS_EDITABLES = ["valeurs", "histoire", "codes", "rituels", "metiers", "pages", "tahaddi", "quiz"];
  function cleContenu(cle) { return "bab.maison." + (cle || "maison") + ".contenu"; }
  function contenuEdite(cle) {
    try {
      var brut = root.localStorage ? root.localStorage.getItem(cleContenu(cle)) : null;
      if (!brut) return null;
      var o = JSON.parse(brut);
      return o && typeof o === "object" ? o : null;
    } catch (e) { return null; }
  }
  function fusionner(contenu, edite) {
    var c = contenu || {};
    if (!edite) return c;
    SECTIONS_EDITABLES.forEach(function (k) { if (Array.isArray(edite[k]) && edite[k].length) c[k] = edite[k]; });
    return c;
  }

  // ---- Au chargement : appliquer, si une maison est déclarée ---------------------------------
  var applique = [];
  if (root.ZWJ_MAISON) {
    // Une maison en français seul ne se rouvre jamais en arabe, même si ce
    // navigateur a joué Zawia en arabe (la même clé de langue, la même origine).
    if (root.ZWJ_MAISON.sansArabe) { try { if (root.localStorage) root.localStorage.setItem("zwj.langue", "fr"); } catch (e) { /* navigation privée */ } }
    root.ZWJ_MAISON_CONTENU = fusionner(root.ZWJ_MAISON_CONTENU || {}, contenuEdite(root.ZWJ_MAISON.cle));
    applique = appliquer(root.ZWJ, root.ZWJ_MAISON, root.ZWJ_MAISON_CONTENU);
    if (typeof document !== "undefined") {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { demarrer(document); });
      else demarrer(document);
    }
  }

  // Une salle muette ? Rend la case dont le dialogue la remplace (ou true), sinon false.
  function salleMuette(cle) {
    var cfg = root.ZWJ_MAISON;
    var m = cfg && cfg.salles && cfg.salles.muettes;
    if (!m || !Object.prototype.hasOwnProperty.call(m, cle)) return false;
    return m[cle] || true;
  }

  return {
    appliquer: appliquer, menuPermis: menuPermis, filtrerMenu: filtrerMenu,
    salleMuette: salleMuette,
    rayonsCulture: rayonsCulture, lus: lus, marquerLu: marquerLu,
    SECTIONS_EDITABLES: SECTIONS_EDITABLES, cleContenu: cleContenu, contenuEdite: contenuEdite, fusionner: fusionner,
    lumieres: lumieres, niveauLumiere: niveauLumiere, demarrer: demarrer,
    actif: function () { return !!root.ZWJ_MAISON; },
    config: function () { return root.ZWJ_MAISON || null; },
    applique: function () { return applique.slice(); },
    TAIRE: TAIRE
  };
});
