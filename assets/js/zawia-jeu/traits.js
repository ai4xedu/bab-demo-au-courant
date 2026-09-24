// ZAW'IA — le jeu · LES TRAITS DU VISAGE ET DES CHEVEUX
//
// L'Atelier ne proposait que trois axes : peau, djellaba, couvre-chef. Six
// teintes, huit couleurs, six têtes — et la même chevelure pour tout le monde,
// d'une couleur écrite en dur dans le rendu. Demande de Youssef (20/09/2026) :
// « ajoute plus d'éléments — la moustache, la barbe, la coiffure… et les
// femmes aussi ».
//
// ── CE QUI A DÉCIDÉ LA FORME DE CE MODULE ───────────────────────────────────
// Les personnages sont PEINTS (v3.0) : une planche de sprites en couleurs-
// témoins — gris = djellaba, vert = peau, MAGENTA = cheveux — recolorée pixel
// par pixel à l'affichage (`atlas.teinter`). Deux conséquences :
//
//   1. La chevelure existe DÉJÀ comme zone teintable, et sa couleur était une
//      constante. La rendre choisissable ne coûte pas un pixel de dessin, et
//      c'est le seul trait qui se voie à TOUTES les échelles : dans la cour,
//      une tête fait ~9 px de large, la masse des cheveux en occupe la moitié.
//   2. Tout le reste — barbe, moustache, tresse, chignon, boucles d'oreilles —
//      se dessine PAR-DESSUS la cellule teintée. On n'ajoute aucune image :
//      une planche de plus par trait × 8 figures × 4 directions × 2 pas, c'est
//      une explosion combinatoire, et `/assets/*` est immutable un an.
//
// ⚠️ CE MODULE NE DESSINE PAS. Il rend une LISTE DE MARQUES — des rectangles
//    et des ellipses en coordonnées de cellule — que `rendu.js` pose sur le
//    canvas. C'est ce qui le rend pur, testable sous Node, et indépendant du
//    canvas : la même liste sert l'aperçu de l'Atelier (grand) et la cour
//    (minuscule).
//
// ⚠️ LES ANCRAGES SONT MESURÉS, JAMAIS ÉCRITS EN DUR. `rendu.js` relève la
//    boîte des pixels magenta (les cheveux) et celle des pixels verts (la peau)
//    pendant la passe de teinture — elle parcourt déjà tous les pixels, le
//    relevé est gratuit. Une planche repeinte déplace les traits toute seule.
//    C'est la leçon de `habits.py` (Lebsa) : mesurer sur l'alpha, pas deviner.
//
// ⚠️ UNE TÊTE COUVERTE NE MONTRE PAS SA COIFFURE. Sous le hijab, la rezza, la
//    taqiya, le tarbouche ou le qob, la planche ne peint aucune chevelure :
//    y coller une tresse ferait flotter des cheveux sur un foulard. `COUVRE`
//    dit lesquelles couvrent, et `marques()` s'y tient.
//
// ⚠️ DE DOS, PAS DE VISAGE. En direction « haut » on voit la nuque : barbe,
//    moustache et boucles d'oreilles disparaissent, la tresse et le chignon
//    restent (ils se voient MIEUX de dos). Un test parcourt les quatre
//    directions.
// Script classique (pas de `type="module"`) : la page doit s'ouvrir aussi en
// file://. Sous Node, `module.exports` porte la même API. Chargé AVANT
// regles.js, qui délègue ici la validation des cinq axes.
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.traits = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // ---- Les couleurs de cheveux ---------------------------------------------
  // Huit teintes, du noir au blanc. Les VALEURS enregistrées sont des index —
  // jamais des couleurs : la palette se retouche sans toucher aux joueurs,
  // comme PEAUX et DJELLABAS.
  // Le henné n'est pas une coquetterie : c'est la teinture du pays, et une
  // femme qui se reconnaît dans la cour vaut mieux qu'un nuancier neutre.
  var CHEVEUX = [
    { cle: "noir",     nom: "Noir",        hex: "#1e1a18" },
    { cle: "brun",     nom: "Brun",        hex: "#3b2a20" },
    { cle: "chatain",  nom: "Châtain",     hex: "#5d4030" },
    { cle: "henne",    nom: "Henné",       hex: "#8c3f24" },
    { cle: "cuivre",   nom: "Cuivré",      hex: "#a85a2a" },
    { cle: "blond",    nom: "Blond",       hex: "#c8a061" },
    { cle: "gris",     nom: "Gris",        hex: "#8e8b86" },
    { cle: "blanc",    nom: "Blanc",       hex: "#ddd8d0" }
  ];

  // ---- Les coiffures --------------------------------------------------------
  // Ce que la planche peint est une masse de cheveux courte. Une coiffure
  // AJOUTE à cette masse — elle ne la retire pas : on ne peut pas effacer du
  // peint sans laisser un trou. « Courte » est donc le défaut, et c'est la
  // planche telle quelle ; les autres posent ce qui dépasse.
  var COIFFURES = [
    { cle: "courte",  nom: "Courts",     detail: "Comme la planche les peint." },
    { cle: "longue",  nom: "Longs",      detail: "Ils tombent sur les épaules." },
    { cle: "tresse",  nom: "Tresse",     detail: "Une natte dans le dos." },
    { cle: "nattes",  nom: "Deux nattes", detail: "Une de chaque côté." },
    { cle: "chignon", nom: "Chignon",    detail: "Noué haut sur la nuque." },
    { cle: "rasee",   nom: "Rasés",      detail: "Presque rien — la ligne du crâne." }
  ];

  // ---- La barbe et la moustache --------------------------------------------
  var BARBES = [
    { cle: "aucune",    nom: "Aucune",      detail: "Le menton nu." },
    { cle: "naissante", nom: "Naissante",   detail: "Trois jours." },
    { cle: "courte",    nom: "Courte",      detail: "Taillée près." },
    { cle: "collier",   nom: "Collier",     detail: "La ligne de la mâchoire." },
    { cle: "bouc",      nom: "Bouc",        detail: "Au menton seulement." },
    { cle: "pleine",    nom: "Pleine",      detail: "Celle du Fqih." }
  ];

  var MOUSTACHES = [
    { cle: "aucune",  nom: "Aucune",   detail: "La lèvre nue." },
    { cle: "fine",    nom: "Fine",     detail: "Un trait." },
    { cle: "epaisse", nom: "Épaisse",  detail: "Elle déborde." }
  ];

  // ---- Les bijoux -----------------------------------------------------------
  // Deux marques d'or, et pas plus : à cette taille, un bijou est trois pixels.
  // La tazerzit (la fibule berbère) se porte à l'épaule, pas à l'oreille —
  // elle se voit donc même de dos.
  var BIJOUX = [
    { cle: "aucun",    nom: "Aucun",        detail: "Rien." },
    { cle: "boucles",  nom: "Boucles",      detail: "Aux oreilles." },
    { cle: "tazerzit", nom: "Tazerzit",     detail: "La fibule, à l'épaule." },
    { cle: "les-deux", nom: "Les deux",     detail: "Boucles et fibule." }
  ];

  var OR = "#d8ae4a";

  // Les couvre-chefs qui cachent la chevelure : sous eux, aucune coiffure ne
  // se pose. (`cheveux` est la tête nue ; les cinq autres couvrent.)
  var COUVRE = { capuche: true, tarbouche: true, taqiya: true, hijab: true, turban: true };

  function cleValide(liste, v, defaut) {
    for (var i = 0; i < liste.length; i++) if (liste[i].cle === v) return v;
    return defaut;
  }
  function indexValide(v, max, defaut) {
    var n = typeof v === "number" ? v : parseInt(v, 10);
    if (isNaN(n) || n < 0 || n >= max) return defaut;
    return n;
  }

  function parDefaut() {
    return { cheveux: 0, coiffure: "courte", barbe: "aucune", moustache: "aucune", bijou: "aucun" };
  }

  // Champ par champ, jamais une erreur : un personnage doit toujours pouvoir se
  // dessiner, même si sa ligne en base date d'avant ces axes.
  function normaliser(t) {
    var d = parDefaut();
    t = t && typeof t === "object" ? t : {};
    return {
      cheveux: indexValide(t.cheveux, CHEVEUX.length, d.cheveux),
      coiffure: cleValide(COIFFURES, t.coiffure, d.coiffure),
      barbe: cleValide(BARBES, t.barbe, d.barbe),
      moustache: cleValide(MOUSTACHES, t.moustache, d.moustache),
      bijou: cleValide(BIJOUX, t.bijou, d.bijou)
    };
  }

  function couleur(t) { return CHEVEUX[normaliser(t).cheveux].hex; }

  // Une marque plus sombre que les cheveux : la barbe d'un blond n'est pas de
  // la même valeur que ses cheveux, et un aplat à la couleur exacte fait autocollant.
  function assombrir(hex, k) {
    var n = parseInt(String(hex).slice(1), 16);
    var r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Les marques à poser sur une cellule déjà teintée.
   *
   * @param avatar  l'avatar complet (tete + les axes de ce module)
   * @param boite   { cheveux: {x,y,w,h}|null, peau: {x,y,w,h}|null } — MESURÉ
   *                par rendu.js sur la cellule, en pixels de cellule.
   * @param dir     "bas" | "haut" | "gauche" | "droite"
   * @return        [{ forme: "rect"|"ellipse", x, y, w, h, hex, alpha }]
   *
   * Rend toujours un tableau (vide au besoin) : le dessinateur n'a rien à
   * vérifier.
   */
  function marques(avatar, boite, dir) {
    var out = [];
    var a = avatar && typeof avatar === "object" ? avatar : {};
    var t = normaliser(a);
    var ch = boite && boite.cheveux, pe = boite && boite.peau;
    var d = dir === "haut" || dir === "gauche" || dir === "droite" ? dir : "bas";
    var deDos = d === "haut";
    var deProfil = d === "gauche" || d === "droite";
    var couvert = !!COUVRE[a.tete];
    var hex = CHEVEUX[t.cheveux].hex;
    var sombre = assombrir(hex, 0.78);

    // ---- la coiffure : seulement si la tête est nue et qu'on a mesuré -------
    if (ch && ch.w > 0 && ch.h > 0 && !couvert) {
      var cx = ch.x + ch.w / 2;
      var bas = ch.y + ch.h;              // le bas de la masse peinte
      var e = Math.max(1, Math.round(ch.w * 0.16));   // l'épaisseur d'une mèche

      if (t.coiffure === "longue") {
        // Elle tombe : deux pans le long du cou, plus larges de dos.
        var lg = deDos ? ch.w * 0.92 : ch.w * 0.34;
        var ht = ch.h * (deDos ? 1.15 : 0.95);
        if (deDos) {
          out.push({ forme: "rect", x: cx - lg / 2, y: bas - ch.h * 0.15, w: lg, h: ht, hex: hex, alpha: 1 });
        } else {
          out.push({ forme: "rect", x: ch.x - e * 0.2, y: bas - ch.h * 0.18, w: lg, h: ht, hex: hex, alpha: 1 });
          out.push({ forme: "rect", x: ch.x + ch.w - lg + e * 0.2, y: bas - ch.h * 0.18, w: lg, h: ht, hex: hex, alpha: 1 });
        }
      } else if (t.coiffure === "tresse") {
        // Une natte : elle part de la nuque. De face on n'en voit qu'un bout.
        var largeur = e * (deDos ? 1.5 : 0.9);
        var longueur = ch.h * (deDos ? 1.5 : 0.7);
        out.push({ forme: "rect", x: cx - largeur / 2, y: bas - ch.h * 0.1, w: largeur, h: longueur, hex: hex, alpha: 1 });
        // Les liens de la natte, deux traits plus sombres.
        out.push({ forme: "rect", x: cx - largeur / 2, y: bas + longueur * 0.45, w: largeur, h: Math.max(1, e * 0.35), hex: sombre, alpha: 1 });
      } else if (t.coiffure === "nattes") {
        var ln = e * 1.1, hn = ch.h * (deDos ? 1.2 : 0.85);
        out.push({ forme: "rect", x: ch.x - ln * 0.3, y: bas - ch.h * 0.18, w: ln, h: hn, hex: hex, alpha: 1 });
        out.push({ forme: "rect", x: ch.x + ch.w - ln * 0.7, y: bas - ch.h * 0.18, w: ln, h: hn, hex: hex, alpha: 1 });
      } else if (t.coiffure === "chignon") {
        // ⚠️ Premier essai : la boule au-dessus du crâne (`y` négatif). Le
        //    sprite est détouré RAS — tout ce qui dépasse par le haut sort de
        //    la cellule et n'est jamais dessiné. Le chignon était invisible.
        //    Il se pose donc SUR le haut de la masse, pas au-dessus, et se
        //    signe par un lien plus sombre qui le détache.
        out.push({ forme: "ellipse", x: cx - ch.w * 0.24, y: ch.y, w: ch.w * 0.48, h: ch.h * 0.34, hex: hex, alpha: 1 });
        out.push({ forme: "rect", x: cx - ch.w * 0.22, y: ch.y + ch.h * 0.30, w: ch.w * 0.44, h: Math.max(1, ch.h * 0.07), hex: sombre, alpha: 1 });
      } else if (t.coiffure === "rasee") {
        // On ne peut pas effacer du peint : on le RABAISSE en posant la peau
        // par-dessus le haut du crâne — il reste la ligne des cheveux.
        // ⚠️ `y` est BORNÉ À ZÉRO : le sprite est détouré ras, et le crâne
        //    touche le haut de la cellule. Un y négatif sort du canvas et la
        //    coiffure n'est jamais dessinée (le chignon l'a payé).
        if (pe) out.push({ forme: "ellipse", x: ch.x + ch.w * 0.08, y: Math.max(0, ch.y - ch.h * 0.04), w: ch.w * 0.84, h: ch.h * 0.72, hex: "@peau", alpha: 1 });
      }
    }

    // ---- le visage : plus rien à peindre ici --------------------------------
    // La barbe et la moustache NE SONT PAS des marques posées par-dessus.
    // Essayées ainsi (20/09/2026), elles faisaient des blobs : à cette taille
    // le visage tient en ~14 px de haut, et une ellipse pleine sur une peau
    // peinte se lit comme un cache-cou ou une mentonnière. Elles se TEIGNENT :
    // `zonePoils()` dit quels pixels de peau prennent la couleur des cheveux,
    // et le modelé peint du visage reste dessous. Voir rendu.js.
    // ---- les bijoux ----------------------------------------------------------
    if (t.bijou === "boucles" || t.bijou === "les-deux") {
      // Aux oreilles : de face les deux, de profil celle qu'on voit. Jamais de dos.
      if (pe && !deDos) {
        var r = Math.max(1, pe.w * 0.11);
        var yo = pe.y + pe.h * 0.56;
        if (deProfil) out.push({ forme: "ellipse", x: pe.x + (d === "droite" ? pe.w * 0.06 : pe.w * 0.94 - r), y: yo, w: r, h: r, hex: OR, alpha: 1 });
        else {
          out.push({ forme: "ellipse", x: pe.x - r * 0.35, y: yo, w: r, h: r, hex: OR, alpha: 1 });
          out.push({ forme: "ellipse", x: pe.x + pe.w - r * 0.65, y: yo, w: r, h: r, hex: OR, alpha: 1 });
        }
      }
    }
    if (t.bijou === "tazerzit" || t.bijou === "les-deux") {
      // À l'épaule : elle se mesure sur la tête faute de mieux (la djellaba
      // occupe tout le reste), et se voit de tous les côtés — c'est une fibule,
      // pas un bijou de visage.
      if (ch) {
        var tz = Math.max(1, ch.w * 0.16);
        var ex = d === "gauche" ? ch.x - ch.w * 0.22 : ch.x + ch.w * (d === "droite" ? 1.06 : 0.86);
        out.push({ forme: "ellipse", x: ex, y: ch.y + ch.h * 1.35, w: tz, h: tz, hex: OR, alpha: 1 });
      }
    }

    return out;
  }

  /**
   * La barbe et la moustache, en ZONES À TEINDRE — pas en marques à peindre.
   *
   * rendu.js parcourt déjà chaque pixel pour le recolorer ; un pixel de PEAU
   * qui tombe dans une de ces zones prend la couleur des CHEVEUX au lieu de
   * celle de la peau. Le modelé peint du visage passe dessous intact : c'est
   * ce qui fait la différence entre une barbe et une tache.
   *
   * `force` mélange : 1 = pleine couleur, 0,45 = la barbe de trois jours.
   * Rien de dos, rien sans visage mesuré.
   *
   * @return [{ x, y, w, h, force }] — des ellipses, en pixels de cellule.
   */
  function zonePoils(avatar, boite, dir) {
    var out = [];
    var a = avatar && typeof avatar === "object" ? avatar : {};
    var t = normaliser(a);
    var pe = boite && boite.peau;
    var d = dir === "haut" || dir === "gauche" || dir === "droite" ? dir : "bas";
    if (!pe || !(pe.w > 0) || !(pe.h > 0) || d === "haut") return out;
    if (t.barbe === "aucune" && t.moustache === "aucune") return out;

    var fw = pe.w, fh = pe.h, mx = pe.x + fw / 2, fy = pe.y;
    var profil = d === "gauche" || d === "droite";
    // De profil on ne voit qu'une joue : la zone se resserre et se décale vers
    // l'avant du visage.
    var k = profil ? 0.72 : 1;
    var dx = profil ? fw * (d === "droite" ? 0.16 : -0.16) : 0;

    if (t.moustache !== "aucune") {
      var mw = fw * (t.moustache === "epaisse" ? 0.50 : 0.38) * k;
      var mh = fh * (t.moustache === "epaisse" ? 0.16 : 0.11);
      out.push({ x: mx - mw / 2 + dx, y: fy + fh * 0.58, w: mw, h: mh, force: 1 });
    }

    if (t.barbe !== "aucune") {
      var force = t.barbe === "naissante" ? 0.45 : 1;
      if (t.barbe === "bouc") {
        out.push({ x: mx - fw * 0.13 * k + dx, y: fy + fh * 0.74, w: fw * 0.26 * k, h: fh * 0.26, force: force });
      } else if (t.barbe === "collier") {
        // Le tour du visage : une grande zone, moins une plus petite au centre.
        // La soustraction se fait par `creux` — rendu.js l'exclut.
        out.push({ x: mx - fw * 0.52 * k + dx, y: fy + fh * 0.50, w: fw * 1.04 * k, h: fh * 0.56, force: force,
                   creux: { x: mx - fw * 0.36 * k + dx, y: fy + fh * 0.50, w: fw * 0.72 * k, h: fh * 0.42 } });
      } else {
        // naissante · courte · pleine : du bas des joues au menton.
        var ampleur = t.barbe === "pleine" ? 1 : 0.7;
        var bw = fw * (0.74 + 0.22 * ampleur) * k;
        var bh = fh * (0.34 + 0.16 * ampleur);
        out.push({ x: mx - bw / 2 + dx, y: fy + fh * (0.66 - 0.06 * ampleur), w: bw, h: bh, force: force });
      }
    }
    return out;
  }

  return {
    CHEVEUX: CHEVEUX, COIFFURES: COIFFURES, BARBES: BARBES, MOUSTACHES: MOUSTACHES,
    zonePoils: zonePoils,
    BIJOUX: BIJOUX, COUVRE: COUVRE, OR: OR,
    parDefaut: parDefaut, normaliser: normaliser, couleur: couleur,
    assombrir: assombrir, marques: marques
  };
});
