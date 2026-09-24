// ZAW'IA — le jeu · LES MAHARAT (المهارات) ET L'IJAZA DE LA ZAWIA (إجازة الزاوية) — pur.
//
// v7.8 (22/09/2026, décision du Morchid : « couvrir toutes les compétences — finance, RH,
// marketing, ventes, produit, IA engineering… — pour valider le niveau des
// membres : le diplôme de la zawia, le certificat de compétences IA »).
//
// Une MAHARA est un geste qu'on sait faire avec l'IA, nommé par un verbe, dans
// un terrain (les douze mayadin de tariqa.js) ou dans l'un des deux terrains
// transversaux : le SOCLE (faire faire — la sna3a elle-même) et l'AMANA
// (protéger — ce qui ne sort jamais). Chaque mahara dit ce qui la PROUVE : un
// livrable qu'un témoin peut regarder. La Qarawiyine a inventé le diplôme,
// l'ijaza : la licence de transmettre, donnée par un maître qui a vu.
//
// ⚠️ TROIS RÈGLES, tenues par les tests :
//  1. ON NE SE DÉCLARE PAS UNE MAHARA. Trois états, et le navigateur n'en
//     écrit aucun : « à acquérir » (rien), « apprise » (la base la déduit d'une
//     formation suivie), « prouvée » (un livrable attesté par le bureau — une
//     étape de masar attestée la prouve toute seule). La liste des prouvées
//     vit en base ; ce module ne fait que LIRE et COMPTER.
//  2. AUCUN POINT, AUCUN RANG : une mahara ne crédite ni M39ol, ni Sna3a, ni
//     Dhakira ; l'Ijaza de la Zawia n'est pas un rang de la charte. Elle se
//     lit au carnet, au Lawh et sur le tapis — jamais au HUD.
//  3. AUCUN NOM, AUCUN LIEN : ce qui enseigne une mahara (une formation, une
//     étape) vit en base, posé par le bureau. Le voile tient.
//
// L'IJAZA D'UN MAYDAN : SEUIL_IJAZA maharat prouvées dans ce terrain, dont une
// au moins de niveau 7adeq. L'IJAZA DE LA ZAWIA (le diplôme) : le socle, l'amana,
// deux ijazat de maydan, et une mahara de SILSILA prouvée — on n'est pas diplômé
// de cette maison sans avoir transmis. Les mêmes seuils sont commentés dans
// zawia-maharat.sql (la base ne les applique pas : c'est la page qui lit).
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ZWJ = root.ZWJ || {};
  root.ZWJ.maharat = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var SEUIL_IJAZA = 5;            // maharat prouvées pour l'ijaza d'un maydan
  var NIVEAU_IJAZA = "hadeq";     // … dont une au moins de ce niveau
  var DIPLOME = { socle: 8, amana: 4, ijazat: 2, silsila: 1 };

  // Les niveaux sont CEUX de la Sna3a (regles.js : SNA3A_NIVEAUX) — un test compare.
  var NIVEAUX = [
    { cle: "mbtadi", nom: "Mbtadi", ar: "مبتدي", rang: 1 },
    { cle: "sani3",  nom: "Sani3",  ar: "صانع",  rang: 2 },
    { cle: "hadeq",  nom: "7adeq",  ar: "حاذق",  rang: 3 },
    { cle: "mtqen",  nom: "Mtqen",  ar: "متقن",  rang: 4 }
  ];

  // Les cinq gestes : les cinq réponses à Oumm IA (oumm.js), dans son ordre.
  var GESTES = [
    { cle: "dire",     nom: "Dire juste",     ar: "قُل الصواب" },
    { cle: "voir",     nom: "Voir juste",     ar: "انظر بصدق" },
    { cle: "verifier", nom: "Vérifier juste", ar: "تحقّق" },
    { cle: "faire",    nom: "Faire faire",    ar: "دع الآلة تعمل" },
    { cle: "tenir",    nom: "Tenir",          ar: "اثبت" }
  ];

  var ETATS = { a_acquerir: "À acquérir", apprise: "Apprise", prouvee: "Prouvée" };
  var ETATS_AR = { a_acquerir: "لم تُكتسب بعد", apprise: "مُتعلَّمة", prouvee: "مُثبَتة" };
  var SOURCES = ["etape", "bureau", "fondateur"];

  // Les deux terrains transversaux, puis les douze mayadin (mêmes clés, mêmes
  // noms que tariqa.js — un test compare).
  var DOMAINES = [
    { cle: "socle",      nom: "Le socle — faire faire",             ar: "الأساس — أن تُحسن الطلب",      transversal: true },
    { cle: "amana",      nom: "L'amana — protéger",                 ar: "الأمانة — أن تحمي",            transversal: true },
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

  // ---- LE CATALOGUE ----------------------------------------------------------------
  // { cle, dom, geste, niveau, nom, ar, preuve, ar_preuve, silsila? }
  // `preuve` : ce qu'un témoin regarde pour l'attester — un livrable, jamais un
  // récit. `silsila` : une mahara de transmission (le diplôme en exige une).
  function m(cle, dom, geste, niveau, nom, ar, preuve, ar_preuve, extra) {
    var o = { cle: cle, dom: dom, geste: geste, niveau: niveau, nom: nom, ar: ar, preuve: preuve, ar_preuve: ar_preuve };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }

  var MAHARAT = [
    // ── LE SOCLE : faire faire ────────────────────────────────────────────────
    m("socle-llm", "socle", "tenir", "mbtadi",
      "Expliquer ce qu'est un modèle de langage et pourquoi il invente",
      "أن تشرح ما هو النموذج اللغوي ولماذا يختلق",
      "Une explication d'une page, sans jargon, qu'un non-technicien relit et comprend.",
      "شرح في صفحة واحدة، بلا مصطلحات، يقرأه غير المختص ويفهمه."),
    m("socle-contexte", "socle", "tenir", "mbtadi",
      "Compter en jetons et tenir la fenêtre de contexte",
      "أن تحسب بالرموز وتضبط نافذة السياق",
      "Une conversation par sujet, des fichiers lus plutôt que collés, la jauge lue avant de continuer.",
      "محادثة لكل موضوع، ملفات تُقرأ بدل أن تُلصق، والمؤشر يُقرأ قبل المتابعة."),
    m("socle-prompt", "socle", "dire", "mbtadi",
      "Structurer une demande : rôle, contexte, tâche, format",
      "أن تبني الطلب: الدور، السياق، المهمة، الشكل",
      "Trois demandes réutilisables, chacune avec son contexte collé et son format imposé.",
      "ثلاثة طلبات قابلة لإعادة الاستعمال، لكل واحد سياقه الملصق وشكله المفروض."),
    m("socle-iterer", "socle", "dire", "mbtadi",
      "Corriger une sortie par retours successifs sans recommencer",
      "أن تصحّح النتيجة بملاحظات متتابعة دون البدء من جديد",
      "Le fil d'une conversation où la sortie s'améliore en trois tours, montré tel quel.",
      "خيط محادثة تتحسّن فيه النتيجة في ثلاث جولات، يُعرض كما هو."),
    m("socle-format", "socle", "dire", "mbtadi",
      "Imposer le format de sortie : tableau, sections, CSV, budget de mots",
      "أن تفرض شكل النتيجة: جدول، فقرات، CSV، حدّ للكلمات",
      "Une même question posée avec trois formats, les trois sorties conformes.",
      "السؤال نفسه بثلاثة أشكال، والنتائج الثلاث مطابقة."),
    m("socle-garde-fous", "socle", "verifier", "sani3",
      "Poser des garde-fous contre l'invention : « n'invente rien, écris À VÉRIFIER »",
      "أن تضع حواجز ضد الاختلاق: «لا تخترع، اكتب: للتحقق»",
      "Une demande où toute valeur illisible ressort marquée, aucune référence non fournie.",
      "طلب تخرج فيه كل قيمة غير مقروءة معلَّمة، ولا مرجع لم يُقدَّم."),
    m("socle-modele", "socle", "tenir", "sani3",
      "Choisir le modèle selon la tâche : léger pour le routinier, lourd pour le difficile",
      "أن تختار النموذج بحسب المهمة: خفيف للروتين، ثقيل للصعب",
      "Dix tâches de sa semaine classées par modèle, avec le coût estimé de chacune.",
      "عشر مهام من أسبوعك مصنَّفة بحسب النموذج، مع الكلفة المقدَّرة لكل واحدة."),
    m("socle-evaluer", "socle", "verifier", "sani3",
      "Évaluer une sortie avant de s'en servir : chiffres, dates, noms, sources",
      "أن تقيّم النتيجة قبل استعمالها: الأرقام، التواريخ، الأسماء، المصادر",
      "Une sortie annotée ligne à ligne : ce qui a été vérifié, où, et ce qui a été corrigé.",
      "نتيجة معلَّقة سطراً سطراً: ما تم التحقق منه، وأين، وما تم تصحيحه."),
    m("socle-espace", "socle", "faire", "sani3",
      "Monter un espace de travail avec instructions et documents permanents",
      "أن تُنشئ مساحة عمل بتعليمات ووثائق دائمة",
      "Un espace partagé avec ses instructions, ses documents de référence et un exemple de sortie.",
      "مساحة مشتركة بتعليماتها ووثائقها المرجعية ومثال على النتيجة."),
    m("socle-bibliotheque", "socle", "dire", "sani3",
      "Tenir une bibliothèque de demandes métier réutilisables",
      "أن تحتفظ بمكتبة طلبات مهنية قابلة لإعادة الاستعمال",
      "Dix demandes nommées, datées, avec leur « pourquoi ça marche », partagées à une équipe.",
      "عشرة طلبات مسمّاة ومؤرَّخة مع «لماذا ينجح»، مشتركة مع فريق."),
    m("socle-qlil", "socle", "dire", "hadeq",
      "Écrire la demande la plus courte qui donne exactement la sortie voulue",
      "أن تكتب أقصر طلب يعطي بالضبط النتيجة المطلوبة",
      "Trois trous du golf du prompt réussis sous le par.",
      "ثلاث حفر من غولف الطلب ناجحة تحت الحدّ."),
    m("socle-deleguer", "socle", "faire", "hadeq",
      "Déléguer un travail entier avec des boucles de relecture",
      "أن تفوّض عملاً كاملاً مع حلقات مراجعة",
      "Un travail de plusieurs fichiers confié de bout en bout, avec le compte rendu de ce qui a été relu.",
      "عمل من عدة ملفات فُوِّض من أوله إلى آخره، مع تقرير عمّا تمت مراجعته."),

    // ── L'AMANA : protéger ────────────────────────────────────────────────────
    m("amana-tri", "amana", "tenir", "mbtadi",
      "Trier ce qui sort, ce qui ne sort jamais, ce qui demande prudence",
      "أن تفرز ما يخرج، وما لا يخرج أبداً، وما يستدعي الحذر",
      "Sa règle de tri écrite en trois colonnes, appliquée à un vrai dossier.",
      "قاعدة الفرز مكتوبة في ثلاثة أعمدة، مطبَّقة على ملف حقيقي."),
    m("amana-pseudonymiser", "amana", "faire", "sani3",
      "Pseudonymiser un fichier avant de le confier, et le rendre lisible après",
      "أن تُخفي هوية الملف قبل تسليمه، وتُعيدها بعد ذلك",
      "Un fichier codé (NOM-001, CIN-002…), la clé restée sur le poste, la réponse décodée.",
      "ملف مرمَّز (NOM-001, CIN-002…)، والمفتاح بقي على الجهاز، والجواب مفكوك."),
    m("amana-fuites", "amana", "verifier", "sani3",
      "Détecter les fuites cachées : un e-mail dans un commentaire, un numéro dans une note",
      "أن تكشف التسريبات الخفية: بريد في تعليق، رقم في ملاحظة",
      "Un contrôle de fuite passé sur un fichier réel, avec la liste de ce qu'il a trouvé.",
      "فحص تسريب أُجري على ملف حقيقي، مع قائمة ما وجده."),
    m("amana-porte", "amana", "tenir", "sani3",
      "Choisir la porte d'entrée : compte grand public, compte pro, ou rien ne sort",
      "أن تختار باب الدخول: حساب عام، حساب مهني، أو لا يخرج شيء",
      "Le compte de son équipe réglé (entraînement, rétention), la date de vérification notée.",
      "حساب فريقك مضبوط (التدريب، الاحتفاظ)، وتاريخ التحقق مدوَّن."),
    m("amana-loi", "amana", "tenir", "sani3",
      "Appliquer la loi sur les données personnelles à un usage d'IA",
      "أن تطبّق قانون المعطيات الشخصية على استعمال الذكاء الاصطناعي",
      "Une fiche par traitement : base légale, finalité, information des personnes, durée.",
      "بطاقة لكل معالجة: الأساس القانوني، الغاية، إعلام الأشخاص، المدة."),
    m("amana-local", "amana", "tenir", "hadeq",
      "Choisir entre local et cloud selon la donnée, sans croire au serveur privé",
      "أن تختار بين المحلي والسحابة بحسب المعطيات، دون الإيمان بالخادم الخاص",
      "Ses trois niveaux de données nommés, et pour chacun où le traitement tourne.",
      "مستويات معطياتك الثلاثة مسمّاة، ولكل واحد أين تجري المعالجة."),
    m("amana-reduire", "amana", "faire", "mtqen",
      "Réduire un message avant sortie et réinjecter en local",
      "أن تختزل الرسالة قبل خروجها وتُعيد الحقن محلياً",
      "Une chaîne où le numéro, l'adresse et l'historique deviennent des jetons, puis reviennent.",
      "سلسلة يصبح فيها الرقم والعنوان والسجل رموزاً، ثم تعود."),
    m("amana-registre", "amana", "verifier", "hadeq",
      "Tenir le registre de ce qui a été anonymisé et de qui a utilisé quoi",
      "أن تمسك سجلّ ما أُخفيت هويته ومن استعمل ماذا",
      "Un registre daté, présentable à un client, tenu sur un mois.",
      "سجلّ مؤرَّخ، يُعرض على زبون، مُمسَك على مدى شهر."),

    // ── FINANCE & COMPTABILITÉ ───────────────────────────────────────────────
    m("finance-factures-scan", "finance", "voir", "sani3",
      "Transformer des factures scannées en écritures prêtes à saisir",
      "أن تحوّل فواتير ممسوحة إلى قيود جاهزة للإدخال",
      "Vingt factures → un tableau date, fournisseur, HT, TVA, TTC, compte proposé, doutes marqués.",
      "عشرون فاتورة ← جدول: التاريخ، المورّد، الصافي، الضريبة، الإجمالي، الحساب المقترح، والشكوك معلَّمة."),
    m("finance-releve", "finance", "faire", "sani3",
      "Pré-imputer un relevé bancaire au plan comptable",
      "أن تُعدّ ترحيل كشف بنكي إلى المخطط المحاسبي",
      "Un relevé d'un mois imputé par règles réutilisées, les lignes ambiguës laissées en question.",
      "كشف شهر مرحَّل بقواعد معادة الاستعمال، والسطور الملتبسة متروكة كأسئلة."),
    m("finance-rapprochement", "finance", "verifier", "hadeq",
      "Rapprocher un relevé et un registre de factures : les règles d'abord, le modèle pour les exceptions",
      "أن تُطابق كشفاً بنكياً وسجلّ فواتير: القواعد أولاً، والنموذج للاستثناءات",
      "Un rapprochement d'un mois : les lettrés par règle, les exceptions expliquées, aucune écriture sans validation.",
      "مطابقة شهر: ما طابقته القاعدة، والاستثناءات مشروحة، ولا قيد بلا موافقة."),
    m("finance-facture-conforme", "finance", "faire", "hadeq",
      "Générer factures et avoirs conformes au droit marocain en une phrase",
      "أن تُصدر فواتير وإشعارات دائنة مطابقة للقانون المغربي بجملة واحدة",
      "Une facture avec ICE, IF, RC, TVA, montant en lettres, numéro lu dans le registre — jamais deviné.",
      "فاتورة بـ ICE وIF وRC والضريبة والمبلغ بالحروف، والرقم مقروء من السجل — لا مُخمَّن أبداً."),
    m("finance-balance", "finance", "verifier", "sani3",
      "Détecter les anomalies d'une balance avant clôture",
      "أن تكشف شذوذ ميزان المراجعة قبل الإقفال",
      "Une balance réelle passée au crible : soldes en sens inverse, comptes d'attente, variations, questions.",
      "ميزان حقيقي مُمحَّص: أرصدة معكوسة، حسابات انتظار، تغيّرات، وأسئلة."),
    m("finance-tva", "finance", "verifier", "sani3",
      "Rapprocher le chiffre d'affaires comptabilisé et le chiffre déclaré",
      "أن تُطابق رقم المعاملات المحاسب والمصرَّح",
      "Un tableau mois par mois avec les écarts et leurs causes probables, à vérifier.",
      "جدول شهراً بشهر بالفروق وأسبابها المحتملة، للتحقق."),
    m("finance-relances", "finance", "dire", "mbtadi",
      "Rédiger une séquence de relances d'impayés graduée",
      "أن تكتب سلسلة تذكيرات متدرّجة بالمستحقات",
      "Trois lettres — courtoise, ferme, mise en demeure — sans menace disproportionnée, envoyées par une main.",
      "ثلاث رسائل — لطيفة، حازمة، إنذار — بلا تهديد مبالغ فيه، تُرسلها يد بشرية."),
    m("finance-bilan-clair", "finance", "dire", "mbtadi",
      "Traduire un bilan en langage clair pour le dirigeant",
      "أن تترجم الحصيلة إلى لغة واضحة للمسيّر",
      "Une note de deux pages : rentabilité, trésorerie, trois recommandations, zéro jargon.",
      "مذكرة من صفحتين: الربحية، الخزينة، ثلاث توصيات، بلا مصطلحات."),
    m("finance-fiscal", "finance", "verifier", "sani3",
      "Décoder un texte fiscal et en tirer les impacts par profil, article à l'appui",
      "أن تفكّ نصاً ضريبياً وتستخرج أثره بحسب كل حالة، بالمادة",
      "Un tableau avant/après par impôt, chaque ligne avec son article source.",
      "جدول قبل/بعد لكل ضريبة، وكل سطر بمادته المرجعية."),
    m("finance-reporting", "finance", "faire", "mtqen",
      "Automatiser un reporting mensuel commenté, de la balance au document envoyé",
      "أن تؤتمت تقريراً شهرياً معلَّقاً، من الميزان إلى الوثيقة المرسلة",
      "Une chaîne qui tourne deux mois de suite : balance → indicateurs → document commenté.",
      "سلسلة تعمل شهرين متتاليين: ميزان ← مؤشرات ← وثيقة معلَّقة."),

    // ── JURIDIQUE & CONFORMITÉ ───────────────────────────────────────────────
    m("juridique-synthese", "juridique", "voir", "sani3",
      "Synthétiser un dossier volumineux : chronologie, pièces, incohérences",
      "أن تلخّص ملفاً ضخماً: التسلسل الزمني، المستندات، التناقضات",
      "Une synthèse où chaque fait renvoie à sa pièce, sur un dossier anonymisé.",
      "تلخيص يُحيل فيه كل واقع إلى مستنده، على ملف مُخفى الهوية."),
    m("juridique-clauses", "juridique", "verifier", "sani3",
      "Repérer les clauses à risque d'un contrat, clause par clause",
      "أن ترصد البنود الخطرة في عقد، بنداً بنداً",
      "Un tableau bloquant / à renégocier / acceptable, avec la raison de chaque ligne.",
      "جدول: مانع / يُعاد التفاوض / مقبول، مع سبب كل سطر."),
    m("juridique-sources", "juridique", "verifier", "sani3",
      "Exploiter la jurisprudence fournie sans jamais citer de mémoire",
      "أن تستثمر الاجتهاد القضائي المقدَّم دون الاستشهاد من الذاكرة",
      "Une note de recherche fondée sur les seuls textes collés, incertitudes listées.",
      "مذكرة بحث قائمة على النصوص الملصقة وحدها، والشكوك مدرجة."),
    m("juridique-premier-jet", "juridique", "dire", "sani3",
      "Produire un premier jet d'acte au style de la maison, sans référence non fournie",
      "أن تُنتج مسودة أولى لعقد بأسلوب المكتب، بلا مرجع لم يُقدَّم",
      "Un premier jet de conclusions ou de mise en demeure, relu et annoté par un professionnel.",
      "مسودة أولى لمذكرة أو إنذار، راجعها وعلّق عليها مهني."),
    m("juridique-clausier", "juridique", "faire", "hadeq",
      "Tenir un clausier vivant dans un espace de travail",
      "أن تمسك بنكاً حياً للبنود في مساحة عمل",
      "Un espace avec modèles anonymisés, charte de style et check-lists, utilisé sur un vrai dossier.",
      "مساحة بنماذج مُخفاة الهوية وميثاق أسلوب وقوائم تحقق، مستعملة في ملف حقيقي."),
    m("juridique-traduction", "juridique", "dire", "sani3",
      "Traduire un projet d'acte entre l'arabe et le français au registre juridique",
      "أن تترجم مشروع عقد بين العربية والفرنسية بالسجل القانوني",
      "Une traduction avec sa liste de termes à vérifier, la structure conservée.",
      "ترجمة مع قائمة مصطلحاتها للتحقق، والبنية محفوظة."),
    m("juridique-charte", "juridique", "tenir", "sani3",
      "Rédiger la charte d'usage de l'IA de sa structure",
      "أن تكتب ميثاق استعمال الذكاء الاصطناعي في مؤسستك",
      "Une charte d'une page, prête à signer : quoi partager, quoi protéger, qui décide.",
      "ميثاق من صفحة، جاهز للتوقيع: ما يُشارك، ما يُحمى، من يقرّر."),
    m("juridique-veille", "juridique", "faire", "hadeq",
      "Automatiser la veille des textes officiels",
      "أن تؤتمت رصد النصوص الرسمية",
      "Une synthèse hebdomadaire par domaine, avec entrée en vigueur et dossiers touchés, sur quatre semaines.",
      "خلاصة أسبوعية بحسب المجال، مع تاريخ السريان والملفات المعنية، على أربعة أسابيع."),

    // ── RH, FORMATION & RECRUTEMENT ──────────────────────────────────────────
    m("rh-grille", "rh", "tenir", "sani3",
      "Écrire la grille de critères avant d'ouvrir la première candidature",
      "أن تكتب شبكة المعايير قبل فتح أول ترشيح",
      "Une grille pondérée, avec les critères interdits, écrite avant la campagne.",
      "شبكة موزونة، بالمعايير الممنوعة، مكتوبة قبل الحملة."),
    m("rh-tri-cv", "rh", "verifier", "hadeq",
      "Trier des candidatures anonymisées contre une fiche de poste, la décision restant humaine",
      "أن تفرز ترشيحات مُخفاة الهوية مقابل بطاقة منصب، والقرار للإنسان",
      "Dix candidatures notées critère par critère avec le passage cité, puis le choix signé d'un recruteur.",
      "عشرة ترشيحات مقيَّمة معياراً معياراً مع المقطع المستشهَد، ثم اختيار موقَّع من مسؤول توظيف."),
    m("rh-onboarding", "rh", "dire", "mbtadi",
      "Rédiger offres, contrats types et supports d'accueil",
      "أن تكتب عروض العمل والعقود النموذجية ووثائق الاستقبال",
      "Un kit d'accueil complet pour un poste réel, relu par la personne qui recrute.",
      "عدة استقبال كاملة لمنصب حقيقي، راجعها من يوظّف."),
    m("rh-entretiens", "rh", "dire", "mbtadi",
      "Synthétiser des entretiens et en tirer un plan de formation",
      "أن تلخّص المقابلات وتستخرج منها مخطط تكوين",
      "Cinq entretiens dictés → une synthèse et un plan daté par personne.",
      "خمس مقابلات مُملاة ← خلاصة ومخطط مؤرَّخ لكل شخص."),
    m("rh-faq", "rh", "faire", "sani3",
      "Monter une FAQ interne qui répond depuis des réponses validées",
      "أن تُنشئ أسئلة شائعة داخلية تجيب من أجوبة معتمدة",
      "Une base de vingt réponses validées et l'assistant qui ne répond que depuis elle.",
      "قاعدة من عشرين جواباً معتمداً والمساعد الذي لا يجيب إلا منها."),
    m("rh-paie", "rh", "verifier", "sani3",
      "Vérifier un journal de paie anonymisé avant la déclaration",
      "أن تراجع سجلّ أجور مُخفى الهوية قبل التصريح",
      "Un journal par matricules contrôlé : écarts de brut, sorties non déclarées, bases.",
      "سجلّ بأرقام التسجيل مُراجَع: فروق الأجر الخام، الخروج غير المصرَّح، الأوعية."),
    m("rh-candidat", "rh", "faire", "hadeq",
      "Accompagner un candidat jusqu'à l'entretien : CV lisible par les robots, lettre, offres, entraînement",
      "أن ترافق مرشحاً حتى المقابلة: سيرة تقرأها الآلات، رسالة، عروض، تدريب",
      "Un candidat réel accompagné, son dossier avant/après, l'entretien obtenu.",
      "مرشح حقيقي مُرافَق، ملفه قبل/بعد، والمقابلة محصَّلة.", { silsila: true }),

    // ── MARKETING & MARQUE ───────────────────────────────────────────────────
    m("marketing-voix", "marketing", "dire", "sani3",
      "Écrire son fichier de voix : ton, mots interdits, échantillons",
      "أن تكتب ملف صوتك: النبرة، الكلمات الممنوعة، العيّنات",
      "Un fichier de voix, et trois textes générés qu'un lecteur ne distingue pas des siens.",
      "ملف صوت، وثلاثة نصوص مولَّدة لا يميّزها القارئ عن نصوصك."),
    m("marketing-calendrier", "marketing", "dire", "mbtadi",
      "Bâtir un calendrier éditorial chiffré, aux angles variés",
      "أن تبني رزنامة تحريرية مرقَّمة، متنوّعة الزوايا",
      "Quatre semaines de contenu, canal par canal, sans généralités.",
      "أربعة أسابيع من المحتوى، قناة قناة، بلا عموميات."),
    m("marketing-campagne", "marketing", "dire", "sani3",
      "Décliner une campagne sur plusieurs canaux dans la voix de la marque",
      "أن تُفرّع حملة على عدة قنوات بصوت العلامة",
      "Posts, e-mails et script vidéo d'une même campagne, cohérents, publiés.",
      "منشورات ورسائل ونص فيديو لحملة واحدة، متناسقة، منشورة."),
    m("marketing-etude", "marketing", "verifier", "sani3",
      "Réaliser une étude de marché accélérée, sources à l'appui",
      "أن تُنجز دراسة سوق مُسرَّعة، بمصادرها",
      "Une étude où chaque chiffre porte sa source, et où l'inconnu est dit inconnu.",
      "دراسة يحمل فيها كل رقم مصدره، ويُقال فيها للمجهول: مجهول."),
    m("marketing-capture", "marketing", "faire", "hadeq",
      "Construire une page de capture branchée sur ses demandes entrantes",
      "أن تبني صفحة التقاط موصولة بطلباتك الواردة",
      "Une page en ligne dont le formulaire écrit dans une base et route la demande.",
      "صفحة على الإنترنت يكتب نموذجها في قاعدة ويوجّه الطلب."),
    m("marketing-sequences", "marketing", "faire", "mtqen",
      "Déclencher des séquences par la donnée, sans main",
      "أن تُطلق سلاسل رسائل بحسب المعطيات، بلا يد",
      "Une séquence déclenchée par un événement réel, tournée sur un mois, mesurée.",
      "سلسلة أُطلقت بحدث حقيقي، عملت شهراً، وقيست."),
    m("marketing-reporting", "marketing", "faire", "hadeq",
      "Automatiser le reporting de performance",
      "أن تؤتمت تقرير الأداء",
      "Un tableau de bord qui se met à jour seul, lu deux mois de suite.",
      "لوحة قيادة تتحدّث وحدها، تُقرأ شهرين متتاليين."),
    m("marketing-marque-perso", "marketing", "tenir", "sani3",
      "Construire une marque personnelle qui vend avant le premier appel",
      "أن تبني علامة شخصية تبيع قبل المكالمة الأولى",
      "Trois mois de publication, et les prises de contact entrantes comptées.",
      "ثلاثة أشهر من النشر، والتواصلات الواردة محسوبة."),

    // ── VENTES & COMMERCE ────────────────────────────────────────────────────
    m("ventes-devis", "ventes", "dire", "sani3",
      "Rédiger un devis ou une proposition depuis sa mémoire, prix lus jamais approximés",
      "أن تكتب عرض ثمن أو اقتراحاً من ذاكرتك، والأسعار مقروءة لا مقدَّرة",
      "Un devis produit en trois minutes, chaque prix tracé jusqu'à sa source.",
      "عرض ثمن أُنتج في ثلاث دقائق، وكل سعر متتبَّع إلى مصدره."),
    m("ventes-fiche", "ventes", "voir", "mbtadi",
      "Préparer un rendez-vous : la fiche prospect en deux minutes",
      "أن تُحضّر موعداً: بطاقة العميل المحتمل في دقيقتين",
      "Cinq fiches de prospects réels, chacune avec ses trois questions à poser.",
      "خمس بطاقات لعملاء محتملين حقيقيين، ولكل واحدة أسئلتها الثلاثة."),
    m("ventes-liste", "ventes", "voir", "hadeq",
      "Constituer une liste de prospects qualifiés depuis une source publique",
      "أن تبني قائمة عملاء محتملين مؤهَّلين من مصدر عمومي",
      "Une liste tirée d'une source publique, dédoublonnée, chaque ligne vérifiée avant d'être approchée.",
      "قائمة مستخرَجة من مصدر عمومي، بلا تكرار، كل سطر مُتحقَّق منه قبل التواصل."),
    m("ventes-prospection", "ventes", "dire", "sani3",
      "Personnaliser des messages de prospection, envoyés par une main",
      "أن تُخصّص رسائل استكشاف، تُرسلها يد بشرية",
      "Vingt messages personnalisés, aucun robot, les réponses comptées.",
      "عشرون رسالة مخصَّصة، بلا روبوت، والأجوبة محسوبة."),
    m("ventes-delicat", "ventes", "dire", "mbtadi",
      "Répondre à un client mécontent avec le bon ton",
      "أن تردّ على زبون غاضب بالنبرة الصحيحة",
      "Trois réponses réelles — courtoises, fermes, courtes — et ce qu'elles ont donné.",
      "ثلاثة ردود حقيقية — لطيفة، حازمة، قصيرة — وما أثمرت."),
    m("ventes-crm", "ventes", "faire", "hadeq",
      "Piloter son pipeline dans un CRM construit soi-même",
      "أن تُدير مسار مبيعاتك في CRM بنيته بنفسك",
      "Un CRM avec contacts, affaires et montants, tenu un mois, sans abonnement.",
      "CRM بجهات الاتصال والصفقات والمبالغ، مُمسَك شهراً، بلا اشتراك."),
    m("ventes-acquisition", "ventes", "faire", "hadeq",
      "Monter un système d'acquisition : aimant, formulaire, qualification, suivi",
      "أن تُقيم منظومة استقطاب: مغناطيس، نموذج، تأهيل، متابعة",
      "Un système qui a produit ses premières demandes entrantes, montré de bout en bout.",
      "منظومة أنتجت أولى طلباتها الواردة، تُعرض من أولها إلى آخرها."),
    m("ventes-comptes", "ventes", "tenir", "hadeq",
      "Tenir cinquante comptes sans équipe : relances, signaux faibles",
      "أن تتابع خمسين حساباً بلا فريق: تذكيرات وإشارات ضعيفة",
      "Un portefeuille suivi trois mois, les relances proposées par la machine et envoyées par une main.",
      "محفظة مُتابَعة ثلاثة أشهر، تذكيرات تقترحها الآلة وترسلها يد."),
    m("ventes-ferracha", "ventes", "tenir", "mbtadi",
      "Étaler sa ferracha : montrer ce qui tourne, et ce qui casse",
      "أن تفرش فرّاشتك: أن تُري ما يعمل، وما يتعطّل",
      "Un tapis posé au Souk avec un produit, sa fiche complète et sa première affaire.",
      "بساط مفروش في السوق بمنتج، وبطاقته الكاملة، وأول صفقة."),

    // ── TECH, DATA & IA ──────────────────────────────────────────────────────
    m("tech-skill", "tech", "faire", "hadeq",
      "Écrire un skill : une procédure encodée une fois, qui tourne à chaque fois",
      "أن تكتب مهارة برمجية: إجراء مُرمَّز مرة، يعمل كل مرة",
      "Un skill à soi, dans un dossier, avec sa consigne et son exemple — et il tourne.",
      "مهارة خاصة بك، في مجلد، بتعليمتها ومثالها — وهي تعمل."),
    m("tech-plugin", "tech", "faire", "mtqen",
      "Packager skills et scripts en un plugin pour l'équipe",
      "أن تُغلّف المهارات والنصوص البرمجية في إضافة للفريق",
      "Un plugin installé chez deux collègues, qui travaillent aux mêmes normes.",
      "إضافة مُثبَّتة عند زميلين، يعملان بالمعايير نفسها."),
    m("tech-mcp-brancher", "tech", "faire", "hadeq",
      "Brancher un connecteur MCP, en lecture seule d'abord",
      "أن توصل موصّل MCP، بالقراءة فقط أولاً",
      "Un outil de son métier branché, avec la liste de ce que le connecteur peut et ne peut pas faire.",
      "أداة من مهنتك موصولة، مع قائمة ما يستطيع الموصّل وما لا يستطيع."),
    m("tech-mcp-construire", "tech", "faire", "mtqen",
      "Construire son propre serveur MCP autour d'un outil métier",
      "أن تبني خادم MCP خاصاً بك حول أداة مهنية",
      "Un serveur avec des gestes nommés — jamais de requête libre —, ses tests, son manifeste.",
      "خادم بأفعال مسمّاة — لا استعلام حرّاً أبداً — باختباراته وبيانه."),
    m("tech-agent", "tech", "faire", "hadeq",
      "Construire un premier agent : consigne durable, outils, limites, et « je ne sais pas »",
      "أن تبني أول وكيل: تعليمة دائمة، أدوات، حدود، و«لا أعرف»",
      "Un agent sur la tâche la plus répétitive de sa semaine, avec sa fiche de poste en huit rubriques.",
      "وكيل على أكثر مهام أسبوعك تكراراً، مع بطاقة منصبه في ثماني فقرات."),
    m("tech-equipe-agents", "tech", "faire", "mtqen",
      "Monter une équipe d'agents en boucle : propose, vérifie, exécute",
      "أن تُشكّل فريق وكلاء في حلقة: يقترح، يتحقق، ينفّذ",
      "Trois agents qui se rattrapent et livrent un rapport chaque matin, sur une semaine.",
      "ثلاثة وكلاء يتدارك بعضهم بعضاً ويسلّمون تقريراً كل صباح، على مدى أسبوع."),
    m("tech-production", "tech", "tenir", "mtqen",
      "Mettre un agent en production : interrupteur, budget, coût lu dans les journaux",
      "أن تضع وكيلاً في الإنتاج: مفتاح إيقاف، ميزانية، كلفة تُقرأ في السجلات",
      "Un agent qui tourne seul depuis un mois, son interrupteur, et son coût réel au centime.",
      "وكيل يعمل وحده منذ شهر، مفتاحه، وكلفته الحقيقية بالسنتيم."),
    m("tech-rag", "tech", "verifier", "hadeq",
      "Faire répondre un assistant depuis une base de connaissances, sources citées",
      "أن تجعل مساعداً يجيب من قاعدة معارف، بمصادر مُستشهَدة",
      "Un assistant qui cite le passage, et dit « je ne sais pas » hors de sa base — vingt questions testées.",
      "مساعد يستشهد بالمقطع، ويقول «لا أعرف» خارج قاعدته — عشرون سؤالاً مُختبَراً."),
    m("tech-vibe", "tech", "faire", "hadeq",
      "Décrire, laisser faire, relire, corriger — et savoir quand la machine se trompe",
      "أن تصف، وتترك الآلة تعمل، وتراجع، وتصحّح — وتعرف متى تخطئ",
      "Une page en ligne à son adresse, construite sans écrire une ligne, avec le journal des corrections.",
      "صفحة على عنوانك، بُنيت دون كتابة سطر، مع سجل التصحيحات."),
    m("tech-app", "tech", "faire", "mtqen",
      "Construire une application avec base de données et accès protégé",
      "أن تبني تطبيقاً بقاعدة بيانات ودخول محمي",
      "Une application utilisée par quelqu'un d'autre que soi, avec ses tables pensées avant ses écrans.",
      "تطبيق يستعمله شخص غيرك، بجداوله المفكَّر فيها قبل شاشاته."),
    m("tech-une-couche", "tech", "tenir", "mtqen",
      "Architecturer « une seule couche parle à un modèle » : calculer le calculable, sortir le minimum",
      "أن تصمّم «طبقة واحدة تخاطب النموذج»: احسب ما يُحسب، وأخرج الأدنى",
      "Un schéma d'architecture et le journal proposition/décision d'un cas réel.",
      "مخطط معماري وسجلّ اقتراح/قرار لحالة حقيقية."),
    m("tech-documents", "tech", "faire", "mtqen",
      "Monter une chaîne de traitement de documents scriptée",
      "أن تُقيم سلسلة معالجة وثائق مبرمجة",
      "Cent documents → extraction → fichier d'import avec colonne de confiance et rapport des douteux.",
      "مئة وثيقة ← استخراج ← ملف استيراد بعمود ثقة وتقرير بالمشكوك فيه."),
    m("tech-navigateur", "tech", "faire", "mtqen",
      "Piloter un navigateur sans écran pour capturer, filmer ou éprouver un produit réel",
      "أن تقود متصفّحاً بلا شاشة لتصوير منتج حقيقي أو اختباره",
      "Des captures ou un film du vrai produit, la mesure et la base neutralisées — aucune ligne écrite.",
      "صور أو فيلم للمنتج الحقيقي، والقياس وقاعدة البيانات معطَّلان — دون كتابة أي سطر."),

    // ── OPÉRATIONS, INDUSTRIE & LOGISTIQUE ───────────────────────────────────
    m("operations-second-cerveau", "operations", "faire", "hadeq",
      "Construire un second cerveau en trois couches : faits, leçons, pointeurs",
      "أن تبني دماغاً ثانياً في ثلاث طبقات: وقائع، دروس، مؤشرات",
      "Un dossier à soi, versionné, que l'IA lit avant de travailler et écrit après — un mois de rituel.",
      "مجلد خاص بك، مُتحكَّم في نسخه، تقرأه الآلة قبل العمل وتكتب فيه بعده — شهر من الطقس."),
    m("operations-memoire", "operations", "dire", "sani3",
      "Remplir une mémoire d'entreprise par interview, jamais par corvée",
      "أن تملأ ذاكرة المقاولة بالمقابلة، لا بالسخرة",
      "Offres, prix, clients clés et décisions datées, remplis en entretien avec l'IA.",
      "العروض والأسعار والزبائن الأساسيون والقرارات المؤرَّخة، مملوءة في مقابلة مع الآلة."),
    m("operations-extraction", "operations", "voir", "sani3",
      "Extraire proprement d'un PDF, d'un scan ou d'un export bancal",
      "أن تستخرج بنظافة من PDF أو مسح أو تصدير رديء",
      "Un export sale transformé en tableau propre, doublons et totaux qui ne bouclent pas listés.",
      "تصدير قذر حُوِّل إلى جدول نظيف، والمكررات والمجاميع التي لا تنطبق مدرجة."),
    m("operations-cr", "operations", "dire", "mbtadi",
      "Transformer des notes brutes en compte rendu et plan d'action",
      "أن تحوّل ملاحظات خاماً إلى محضر ومخطط عمل",
      "Un compte rendu réel : décisions, tableau tâche / responsable / échéance, envoyé le jour même.",
      "محضر حقيقي: قرارات، جدول مهمة/مسؤول/أجل، أُرسل في اليوم نفسه."),
    m("operations-taches", "operations", "faire", "hadeq",
      "Planifier des tâches qui tournent sans soi",
      "أن تُبرمج مهام تعمل من دونك",
      "Une tâche planifiée qui a tourné quatre fois, avec ce qu'elle a produit.",
      "مهمة مبرمجة عملت أربع مرات، مع ما أنتجته."),
    m("operations-indicateurs", "operations", "faire", "hadeq",
      "Tenir cinq indicateurs à jour tout seuls",
      "أن تُبقي خمسة مؤشرات محدَّثة وحدها",
      "Un tableau de cinq chiffres qui se remplit sans main, et une décision prise dessus.",
      "جدول من خمسة أرقام يمتلئ بلا يد، وقرار اتُّخذ عليه."),
    m("operations-canal", "operations", "faire", "hadeq",
      "Monter un canal entrant qui crée la fiche et prépare la réponse",
      "أن تُنشئ قناة واردة تُنشئ البطاقة وتُحضّر الجواب",
      "Un message entrant réel → une fiche → un brouillon relu, sur deux semaines.",
      "رسالة واردة حقيقية ← بطاقة ← مسودة مُراجَعة، على مدى أسبوعين."),
    m("operations-automatiser", "operations", "tenir", "sani3",
      "Identifier ce qui s'automatise, et ce qui ne doit jamais l'être",
      "أن تحدّد ما يُؤتمت، وما لا يجب أن يُؤتمت أبداً",
      "Sa semaine cartographiée : le répétitif, le temps gagné estimé, les tâches gardées à la main.",
      "أسبوعك مُخطَّط: المتكرّر، الوقت المكسوب المقدَّر، والمهام المحتفَظ بها لليد."),
    m("operations-production", "operations", "faire", "hadeq",
      "Lancer une production et la suivre : ordres de fabrication, réceptions, dépôts, ventes",
      "أن تُطلق إنتاجاً وتتابعه: أوامر التصنيع، الاستلام، الإيداع، البيع",
      "Un lot suivi de l'ordre de fabrication à la vente, avec ce qui reste en dépôt à chaque étape.",
      "دفعة مُتابَعة من أمر التصنيع إلى البيع، مع ما بقي في الإيداع في كل مرحلة."),
    m("operations-classeur", "operations", "faire", "sani3",
      "Alimenter un classeur qui sert déjà, sans casser ce qu'il contient",
      "أن تُغذّي دفتراً قيد الاستعمال دون أن تُفسد ما فيه",
      "Un document ajouté à un classeur vivant, les formules intactes, le format d'une source nouvelle calibré une fois.",
      "وثيقة مضافة إلى دفتر حيّ، والمعادلات سليمة، وشكل المصدر الجديد مُعاير مرة واحدة."),
    m("operations-carte", "operations", "voir", "mbtadi",
      "Cartographier un travail ou un processus en carte mentale",
      "أن تُخطّط عملاً أو مسلسلاً في خريطة ذهنية",
      "La carte d'un processus réel, faite d'un compte rendu, relue par celui qui le fait.",
      "خريطة مسلسل حقيقي، صُنعت من محضر، وراجعها من يقوم به."),

    // ── DIRECTION & STRATÉGIE ────────────────────────────────────────────────
    m("direction-feuille-de-route", "direction", "tenir", "sani3",
      "Bâtir la feuille de route IA de son organisation : quoi, dans quel ordre, en 90 jours",
      "أن تبني خارطة طريق الذكاء الاصطناعي لمؤسستك: ماذا، بأي ترتيب، في 90 يوماً",
      "Une feuille de route à trente et quatre-vingt-dix jours, avec ce qui n'y est pas et pourquoi.",
      "خارطة طريق لثلاثين وتسعين يوماً، مع ما ليس فيها ولماذا."),
    m("direction-atelier", "direction", "dire", "hadeq",
      "Animer un atelier de direction et en sortir des objectifs qu'une équipe tient",
      "أن تُنشّط ورشة قيادة وتخرج منها بأهداف يحملها الفريق",
      "Le compte rendu d'un atelier réel : ce qui a été décidé, par qui, et les objectifs repris trois mois après.",
      "محضر ورشة حقيقية: ما تقرّر، ومن قرّره، والأهداف مُراجَعة بعد ثلاثة أشهر."),
    m("direction-gouvernance", "direction", "tenir", "hadeq",
      "Poser un cadre de gouvernance : qui propose, qui décide, qui coupe",
      "أن تضع إطار حوكمة: من يقترح، من يقرّر، من يوقف",
      "Un cadre écrit : rôles, circuit d'approbation, interrupteurs, indicateurs — signé par la direction.",
      "إطار مكتوب: أدوار، مسار موافقة، مفاتيح إيقاف، مؤشرات — موقَّع من الإدارة."),
    m("direction-roi", "direction", "verifier", "hadeq",
      "Mesurer l'adoption et le retour, en séparant le mesuré de l'hypothèse",
      "أن تقيس التبنّي والعائد، بفصل المقيس عن الافتراض",
      "Un tableau où chaque gain porte sa colonne « mesuré » ou « estimé », avec sa décote.",
      "جدول يحمل فيه كل مكسب عموده «مقيس» أو «مقدَّر»، مع خصم الحذر."),
    m("direction-business-case", "direction", "dire", "sani3",
      "Construire un business case interne pour un premier chantier",
      "أن تبني ملف جدوى داخلياً لأول ورش",
      "Un business case d'une page, avec coût, gain, risque, et la décision qu'il a obtenue.",
      "ملف جدوى من صفحة: الكلفة، المكسب، الخطر، والقرار الذي حصّله."),
    m("direction-adoption", "direction", "tenir", "sani3",
      "Ancrer l'usage dans la durée : rituels, référents, convertir un sceptique",
      "أن تُرسّخ الاستعمال في الزمن: طقوس، مرجعيات، وإقناع متشكّك",
      "Un rituel d'équipe tenu huit semaines, et un sceptique qui s'en sert.",
      "طقس فريق مُمسَك ثمانية أسابيع، ومتشكّك صار يستعمله."),
    m("direction-cellule", "direction", "faire", "mtqen",
      "Structurer une cellule IA et son plan de charge",
      "أن تُهيكل خلية ذكاء اصطناعي ومخطط أعبائها",
      "L'organigramme d'une cellule, ses trois premiers chantiers, son budget — présentés à une direction.",
      "هيكل خلية، وأوراشها الثلاثة الأولى، وميزانيتها — مُقدَّمة لإدارة."),
    m("direction-chiffres", "direction", "verifier", "hadeq",
      "Publier des chiffres datés et honnêtes : inscrit n'est pas formé",
      "أن تنشر أرقاماً مؤرَّخة وصادقة: المسجَّل ليس مكوَّناً",
      "Une publication avec sa règle de comptage écrite avant, et sa date.",
      "منشور بقاعدة عدّه المكتوبة قبله، وبتاريخه."),
    m("direction-changement", "direction", "dire", "sani3",
      "Lever les résistances et conduire le changement",
      "أن ترفع المقاومات وتقود التغيير",
      "Trois objections réelles, la réponse donnée à chacune, et ce qui a bougé.",
      "ثلاثة اعتراضات حقيقية، الجواب على كل واحد، وما تغيّر."),

    // ── ÉDUCATION & RECHERCHE ────────────────────────────────────────────────
    m("education-programme", "education", "dire", "sani3",
      "Passer d'un brief flou à un programme complet",
      "أن تنتقل من طلب غامض إلى برنامج كامل",
      "Un programme : objectifs, découpage, durées, prérequis — validé par le commanditaire.",
      "برنامج: أهداف، تقسيم، مدد، مكتسبات قبلية — صادق عليه الطالب."),
    m("education-kit", "education", "faire", "sani3",
      "Produire le kit d'une séance à sa charte : support, livret, exercices, cas",
      "أن تُنتج عدة حصة بميثاقك: عرض، كتيّب، تمارين، حالات",
      "Le kit complet d'une séance réelle, donné en salle.",
      "عدة كاملة لحصة حقيقية، أُعطيت في القاعة."),
    m("education-evaluation", "education", "verifier", "hadeq",
      "Concevoir une évaluation assistée : grille critériée, correction, attestation",
      "أن تصمّم تقييماً مُساعَداً: شبكة معايير، تصحيح، شهادة",
      "Un paquet de copies corrigé avec grille et barème, les notes justifiées une à une.",
      "حزمة أوراق مصحَّحة بشبكة وسلّم، والنقط مبرَّرة واحدة واحدة."),
    m("education-animer", "education", "tenir", "sani3",
      "Animer avec l'IA dans la salle : des démonstrations qui ne plantent pas",
      "أن تُنشّط بالذكاء الاصطناعي في القاعة: عروض لا تتعطّل",
      "Une séance animée avec l'IA devant des apprenants qui s'en sont servis, et ses garde-fous écrits.",
      "حصة نُشِّطت بالآلة أمام متعلّمين استعملوها، وحواجزها مكتوبة."),
    m("education-limites", "education", "tenir", "sani3",
      "Dire honnêtement les limites de l'IA à ceux qu'on forme",
      "أن تقول بصدق حدود الذكاء الاصطناعي لمن تكوّنهم",
      "Une séance-test de vingt minutes où les limites sont dites — le critère éliminatoire.",
      "حصة اختبار من عشرين دقيقة تُقال فيها الحدود — المعيار الإقصائي."),
    m("education-expliquer", "education", "dire", "mbtadi",
      "Expliquer l'IA à un non-technicien, b darija s'il le faut",
      "أن تشرح الذكاء الاصطناعي لغير المختص، بالدارجة إن لزم",
      "Une explication de cinq minutes, enregistrée ou donnée, que quelqu'un a comprise.",
      "شرح من خمس دقائق، مسجَّل أو مُلقى، فهمه أحدهم."),
    m("education-wasfa", "education", "dire", "sani3",
      "Écrire une wasfa : une notice qu'un autre peut suivre sans toi",
      "أن تكتب وصفة: دليلاً يتبعه غيرك من دونك",
      "Une wasfa publiée au Kounnach, et quelqu'un qui dit « ça m'a servi ».",
      "وصفة منشورة في الكنّاش، وشخص يقول «نفعتني».", { silsila: true }),
    m("education-talib", "education", "tenir", "hadeq",
      "Prendre un Talib et le mener jusqu'à son premier livrable",
      "أن تأخذ طالباً وتقوده إلى أول منجَز له",
      "Un Talib nommé, son premier livrable attesté, et sa Silsila qui commence.",
      "طالب مسمّى، وأول منجَز له مُثبَت، وسلسلته تبدأ.", { silsila: true }),
    m("education-tutoriel", "education", "voir", "hadeq",
      "Produire un tutoriel pas à pas dont les illustrations sont fabriquées, pas bricolées",
      "أن تُنتج دليلاً خطوة بخطوة صوره مصنوعة، لا مُلفَّقة",
      "Un tutoriel suivi de bout en bout par quelqu'un d'autre, sans t'appeler.",
      "دليل اتّبعه غيرك من أوله إلى آخره، دون أن يتصل بك.", { silsila: true }),
    m("education-fabrique", "education", "dire", "sani3",
      "Écrire le mode d'emploi de sa propre fabrique : les gestes exacts pour refaire l'objet",
      "أن تكتب دليل مصنعك: الأفعال الدقيقة لإعادة صنع الشيء",
      "Les commandes exactes, les pièges payés, et ce qui n'a pas été fait — dit franchement.",
      "الأوامر بدقة، والمزالق التي دُفع ثمنها، وما لم يُنجَز — يُقال بصراحة."),

    // ── SANTÉ & SOCIAL ───────────────────────────────────────────────────────
    m("sante-dossier", "sante", "tenir", "sani3",
      "Préparer un dossier de soin ou d'accompagnement sans qu'aucune identité ne sorte",
      "أن تُحضّر ملف رعاية أو مواكبة دون أن تخرج أي هوية",
      "Un dossier anonymisé, la règle de tri appliquée, la synthèse produite et relue par le praticien.",
      "ملف مُخفى الهوية، قاعدة الفرز مطبَّقة، والخلاصة مُنتَجة وراجعها الممارس."),
    m("sante-information", "sante", "dire", "mbtadi",
      "Rédiger une information patient ou bénéficiaire en langage clair, validée par un professionnel",
      "أن تكتب معلومة للمريض أو المستفيد بلغة واضحة، يصادق عليها مهني",
      "Trois fiches en français et en arabe, validées et signées par le professionnel responsable.",
      "ثلاث بطاقات بالفرنسية والعربية، صادق عليها المهني المسؤول ووقّعها."),
    m("sante-suivi", "sante", "faire", "hadeq",
      "Monter un suivi de cohorte ou d'activité qui se met à jour seul, sans donnée nominative",
      "أن تُقيم متابعة فوج أو نشاط تتحدّث وحدها، بلا معطيات اسمية",
      "Un tableau de suivi agrégé, tenu un mois, sans un seul nom dedans.",
      "جدول متابعة مُجمَّع، مُمسَك شهراً، بلا اسم واحد فيه."),

    // ── CRÉATION, DESIGN & MÉDIAS ────────────────────────────────────────────
    m("creation-trame", "creation", "dire", "mbtadi",
      "Construire la trame d'une présentation avant d'ouvrir l'outil",
      "أن تبني هيكل عرض قبل فتح الأداة",
      "Une trame : titre, trois points, phrase orale par écran — puis la présentation donnée.",
      "هيكل: عنوان، ثلاث نقاط، جملة شفوية لكل شاشة — ثم العرض المُلقى."),
    m("creation-visuels", "creation", "voir", "sani3",
      "Générer des visuels de marque cohérents, et les confronter au réel",
      "أن تولّد صوراً متناسقة للعلامة، وتقارنها بالواقع",
      "Cinq visuels d'une même identité, chacun avec ce qui a été corrigé après regard.",
      "خمس صور لهوية واحدة، ولكل واحدة ما صُحّح بعد النظر."),
    m("creation-video", "creation", "faire", "sani3",
      "Produire une vidéo courte : images-clés, animation, montage",
      "أن تُنتج فيديو قصيراً: صور مفتاحية، تحريك، مونتاج",
      "Une vidéo d'une minute publiée, avec la liste des outils et des étapes.",
      "فيديو من دقيقة منشور، مع قائمة الأدوات والخطوات."),
    m("creation-voix", "creation", "faire", "sani3",
      "Produire une voix off ou une narration, la sienne ou une voix de synthèse déclarée",
      "أن تُنتج تعليقاً صوتياً أو سرداً، بصوتك أو بصوت اصطناعي مُصرَّح",
      "Une narration d'une minute, montée sur une image, la voix de synthèse dite comme telle.",
      "سرد من دقيقة، مركَّب على صورة، والصوت الاصطناعي مُعلَن كذلك."),
    m("creation-gabarit", "creation", "faire", "sani3",
      "Industrialiser un visuel récurrent à sa charte : une photo, une phrase, et l'image sort",
      "أن تُصنّع صورة متكرّرة بميثاقك: صورة وجملة، وتخرج اللوحة",
      "Dix visuels d'une même série produits par le même gabarit, aux bonnes dimensions, sans retouche.",
      "عشر صور من سلسلة واحدة أنتجها القالب نفسه، بالمقاسات الصحيحة، بلا تنقيح."),
    m("creation-infographie", "creation", "voir", "mbtadi",
      "Transformer un texte en schéma ou infographie",
      "أن تحوّل نصاً إلى مخطط أو رسم معلوماتي",
      "Trois schémas publiés, faits d'un texte, relus pour ce qu'ils simplifient trop.",
      "ثلاثة مخططات منشورة، صُنعت من نص، رُوجعت لما تبسّطه أكثر من اللازم."),
    m("creation-son", "creation", "faire", "hadeq",
      "Composer ou monter une bande son qui boucle sans couture",
      "أن تؤلّف أو تركّب شريطاً صوتياً يدور بلا فاصل",
      "Une boucle de moins d'une minute qui se referme sans trou, mesurée au raccord.",
      "حلقة أقل من دقيقة تنغلق بلا فجوة، مقيسة عند الوصل."),
    m("creation-jeu", "creation", "faire", "mtqen",
      "Concevoir un jeu ou une expérience interactive qui enseigne un geste",
      "أن تصمّم لعبة أو تجربة تفاعلية تُعلّم فعلاً",
      "Un jeu jouable en ligne, sans compte, que dix personnes ont fini.",
      "لعبة تُلعب على الإنترنت، بلا حساب، أنهاها عشرة أشخاص."),
    m("creation-recit", "creation", "dire", "hadeq",
      "Écrire un récit court : ce qu'on montre, ce qu'on tait, où ça bascule",
      "أن تكتب حكاية قصيرة: ما تُريه، وما تسكت عنه، وأين ينقلب الأمر",
      "Un script plan par plan, avec la durée visée de chaque réplique, et le film qui le suit.",
      "نص مشهداً مشهداً، بمدة كل جملة، والفيلم يتبعه."),
    m("creation-cles", "creation", "voir", "hadeq",
      "Générer les images-clés d'un film en tenant le même style d'un plan à l'autre",
      "أن تولّد الصور المفتاحية لفيلم مع ثبات الأسلوب من مشهد لآخر",
      "Les images-clés d'un même film, cohérentes, et le prompt qui a tenu la contrainte de style.",
      "الصور المفتاحية لفيلم واحد، متناسقة، والطلب الذي حفظ قيد الأسلوب."),
    m("creation-animer", "creation", "faire", "hadeq",
      "Animer une image fixe sans la dénaturer, et relire chaque plan avant de le garder",
      "أن تُحرّك صورة ثابتة دون أن تُفسدها، وتراجع كل مشهد قبل الاحتفاظ به",
      "Des plans animés depuis des images fixes, et la liste de ceux qui ont été refaits, avec la raison.",
      "مشاهد محرَّكة من صور ثابتة، وقائمة ما أُعيد منها، مع السبب."),
    m("creation-montage", "creation", "faire", "mtqen",
      "Monter un film dont la durée des voix commande la timeline",
      "أن تركّب فيلماً تتحكّم مدة الأصوات في زمنه",
      "Un montage qui se recale tout seul quand on change les voix — montré sur deux versions.",
      "تركيب يعيد ضبط نفسه عند تغيير الأصوات — معروضاً في نسختين."),
    m("creation-mixage", "creation", "tenir", "mtqen",
      "Mixer : la musique qui s'efface sous la voix, un niveau mesuré et non deviné",
      "أن تمزج الصوت: موسيقى تنسحب تحت الكلام، ومستوى مقيس لا مُخمَّن",
      "Un film dont le niveau est mesuré et écrit, et la voix lisible du début à la fin.",
      "فيلم مستواه مقيس ومكتوب، والصوت مفهوم من أوله إلى آخره."),
    m("creation-sorties", "creation", "faire", "sani3",
      "Livrer un même film en plusieurs formats, dont une verticale et une piste sans voix",
      "أن تُسلّم الفيلم نفسه بعدة صيغ، منها العمودية وشريط بلا صوت",
      "Le même film en horizontal, en vertical, sous-titré, et sans voix pour qu'un autre le double.",
      "الفيلم نفسه أفقياً وعمودياً ومترجَماً وبلا صوت ليدبلجه غيرك."),
    m("creation-vignette", "creation", "faire", "sani3",
      "Fabriquer la vignette qu'un réseau affichera, rendue par un navigateur",
      "أن تصنع الصورة المصغّرة التي يعرضها الموقع الاجتماعي، مرسومة بمتصفّح",
      "Une vignette rendue depuis une page, aux bonnes dimensions, vérifiées avant de la déclarer bonne.",
      "صورة مصغّرة مرسومة من صفحة، بالمقاسات الصحيحة، مُتحقَّق منها قبل اعتمادها."),
    m("creation-imprime", "creation", "faire", "sani3",
      "Rendre un document imprimable depuis une page web",
      "أن تُخرج وثيقة صالحة للطبع من صفحة ويب",
      "Un document au format papier, ses polices embarquées, ses couleurs tenues à l'impression.",
      "وثيقة بمقاس الورق، بخطوطها مدمجة، وألوانها ثابتة عند الطبع."),

    // ── SERVICE PUBLIC & TERRITOIRES ─────────────────────────────────────────
    m("public-usager", "public", "dire", "mbtadi",
      "Expliquer une procédure à un usager en langage simple, en français et en arabe",
      "أن تشرح مسطرة لمرتفق بلغة بسيطة، بالفرنسية والعربية",
      "Trois fiches de procédure bilingues, validées par le service qui les applique.",
      "ثلاث بطاقات مساطر بلغتين، صادقت عليها المصلحة التي تطبّقها."),
    m("public-donnees", "public", "voir", "sani3",
      "Lire des données ouvertes d'un territoire et en tirer un constat sourcé",
      "أن تقرأ معطيات مفتوحة لتراب ما وتستخرج منها ملاحظة مُوثَّقة",
      "Un constat d'une page sur un territoire réel, chaque chiffre avec sa source publique.",
      "ملاحظة من صفحة عن تراب حقيقي، وكل رقم بمصدره العمومي."),
    m("public-courrier", "public", "faire", "hadeq",
      "Trier et router un courrier entrant avec une trace de qui a décidé",
      "أن تفرز وتوجّه بريداً وارداً مع أثر لمن قرّر",
      "Un mois de courrier routé, chaque décision signée d'une personne, le journal montré.",
      "شهر من البريد المُوجَّه، كل قرار موقَّع من شخص، والسجل معروض.")
  ];

  // ---- Lectures -----------------------------------------------------------------
  var PAR_CLE = {};
  MAHARAT.forEach(function (x) { PAR_CLE[x.cle] = x; });
  // Bab — une maison cliente remplace le catalogue EN PLACE (assets/js/zawia-jeu/maison.js) :
  // l'index des clés se refait alors, sinon ses compétences ne seraient reconnues nulle part.
  function reindexer() { PAR_CLE = {}; MAHARAT.forEach(function (x) { PAR_CLE[x.cle] = x; }); return MAHARAT.length; }
  // Le seuil de reconnaissance d'un domaine : celui de Zawia par défaut (SEUIL_IJAZA,
  // NIVEAU_IJAZA ne changent pas), réglable par une maison dont les domaines sont plus courts.
  var REGLAGE = { seuil: SEUIL_IJAZA, niveau: NIVEAU_IJAZA };
  function mahara(cle) { return PAR_CLE[cle] || null; }
  function domaine(cle) {
    for (var i = 0; i < DOMAINES.length; i++) if (DOMAINES[i].cle === cle) return DOMAINES[i];
    return null;
  }
  function niveau(cle) {
    for (var i = 0; i < NIVEAUX.length; i++) if (NIVEAUX[i].cle === cle) return NIVEAUX[i];
    return null;
  }
  function geste(cle) {
    for (var i = 0; i < GESTES.length; i++) if (GESTES[i].cle === cle) return GESTES[i];
    return null;
  }
  function parDomaine(cle) { return MAHARAT.filter(function (x) { return x.dom === cle; }); }
  function rangNiveau(cle) { var n = niveau(cle); return n ? n.rang : 0; }

  // ---- Ce que porte un joueur, remis d'aplomb -------------------------------------
  // La base rend { prouvees: [{ mahara, source, le, preuve, note }], apprises: [cle] }.
  // Une clé inconnue est ignorée (le catalogue a pu changer) ; une source
  // inconnue devient "bureau". `apprises` ne garde que ce qui n'est pas prouvé.
  function normaliser(mien) {
    var out = { prouvees: {}, apprises: {} };
    var p = mien && Array.isArray(mien.prouvees) ? mien.prouvees : [];
    p.forEach(function (r) {
      if (!r || !PAR_CLE[r.mahara]) return;
      out.prouvees[r.mahara] = {
        source: SOURCES.indexOf(r.source) >= 0 ? r.source : "bureau",
        le: typeof r.le === "string" ? r.le : null,
        preuve: typeof r.preuve === "string" && /^https:\/\//.test(r.preuve) ? r.preuve : null,
        note: typeof r.note === "string" ? r.note : null
      };
    });
    var a = mien && Array.isArray(mien.apprises) ? mien.apprises : [];
    a.forEach(function (cle) { if (PAR_CLE[cle] && !out.prouvees[cle]) out.apprises[cle] = true; });
    return out;
  }

  function etat(cle, mien) {
    var n = mien && mien.prouvees ? mien : normaliser(mien);
    if (n.prouvees[cle]) return "prouvee";
    if (n.apprises[cle]) return "apprise";
    return "a_acquerir";
  }

  // ---- L'ijaza d'un maydan, et le diplôme ---------------------------------------------
  function bilanDomaine(cle, n) {
    var liste = parDomaine(cle), prouvees = 0, apprises = 0, haut = false;
    liste.forEach(function (x) {
      var e = etat(x.cle, n);
      if (e === "prouvee") { prouvees++; if (rangNiveau(x.niveau) >= rangNiveau(REGLAGE.niveau)) haut = true; }
      else if (e === "apprise") apprises++;
    });
    var d = domaine(cle);
    var ijaza = !d.transversal && prouvees >= REGLAGE.seuil && haut;
    return {
      cle: cle, total: liste.length, prouvees: prouvees, apprises: apprises,
      ijaza: ijaza,
      manque: d.transversal ? 0 : Math.max(0, REGLAGE.seuil - prouvees),
      manqueHaut: d.transversal ? false : (prouvees >= REGLAGE.seuil && !haut)
    };
  }

  function bilan(mien) {
    var n = normaliser(mien);
    var domaines = DOMAINES.map(function (d) { return bilanDomaine(d.cle, n); });
    var parCle = {};
    domaines.forEach(function (b) { parCle[b.cle] = b; });
    var ijazat = domaines.filter(function (b) { return b.ijaza; }).map(function (b) { return b.cle; });
    var silsila = MAHARAT.filter(function (x) { return x.silsila && etat(x.cle, n) === "prouvee"; }).length;
    var totalProuvees = Object.keys(n.prouvees).length;
    var manque = [];
    if (parCle.socle.prouvees < DIPLOME.socle) manque.push({ quoi: "socle", n: DIPLOME.socle - parCle.socle.prouvees });
    if (parCle.amana.prouvees < DIPLOME.amana) manque.push({ quoi: "amana", n: DIPLOME.amana - parCle.amana.prouvees });
    if (ijazat.length < DIPLOME.ijazat) manque.push({ quoi: "ijazat", n: DIPLOME.ijazat - ijazat.length });
    if (silsila < DIPLOME.silsila) manque.push({ quoi: "silsila", n: DIPLOME.silsila - silsila });
    return {
      domaines: domaines, parCle: parCle, ijazat: ijazat, silsila: silsila,
      prouvees: totalProuvees, apprises: Object.keys(n.apprises).length, total: MAHARAT.length,
      diplome: manque.length === 0, manque: manque
    };
  }

  // Les ijazat depuis une liste plate de clés prouvées (ce que le Lawh reçoit).
  function ijazatDe(prouvees) {
    var b = bilan({ prouvees: (prouvees || []).map(function (c) { return { mahara: c, source: "bureau" }; }) });
    return { ijazat: b.ijazat, diplome: b.diplome, prouvees: b.prouvees };
  }

  // La prochaine mahara à viser : dans le terrain le plus près de son ijaza, la
  // moins haute non prouvée — le fil d'or vers ce qui ouvre le plus vite.
  function prochaine(mien, dom) {
    var n = normaliser(mien);
    var candidats = DOMAINES.filter(function (d) { return !dom || d.cle === dom; });
    var meilleur = null, meilleurScore = -1;
    candidats.forEach(function (d) {
      var b = bilanDomaine(d.cle, n);
      var restantes = parDomaine(d.cle).filter(function (x) { return etat(x.cle, n) !== "prouvee"; });
      if (!restantes.length) return;
      restantes.sort(function (a, c) {
        var ea = etat(a.cle, n) === "apprise" ? 0 : 1, ec = etat(c.cle, n) === "apprise" ? 0 : 1;
        return ea - ec || rangNiveau(a.niveau) - rangNiveau(c.niveau) || (a.cle < c.cle ? -1 : 1);
      });
      var score = d.transversal ? 100 + b.prouvees : b.prouvees * 10 - b.manque;
      if (score > meilleurScore) { meilleurScore = score; meilleur = restantes[0]; }
    });
    return meilleur;
  }

  // Une ligne pour le carnet.
  function carnet(mien) {
    var b = bilan(mien);
    var morceaux = ["Maharat prouvées : " + b.prouvees + " sur " + b.total + "."];
    if (b.ijazat.length) morceaux.push("Ijazat : " + b.ijazat.map(function (c) { return domaine(c).nom; }).join(", ") + ".");
    morceaux.push(b.diplome ? "Ijaza de la Zawia : obtenue." : "Ijaza de la Zawia : pas encore.");
    return morceaux.join(" ");
  }

  return {
    SEUIL_IJAZA: SEUIL_IJAZA, NIVEAU_IJAZA: NIVEAU_IJAZA, DIPLOME: DIPLOME,
    NIVEAUX: NIVEAUX, GESTES: GESTES, ETATS: ETATS, ETATS_AR: ETATS_AR, SOURCES: SOURCES,
    DOMAINES: DOMAINES, MAHARAT: MAHARAT,
    mahara: mahara, domaine: domaine, niveau: niveau, geste: geste, parDomaine: parDomaine,
    normaliser: normaliser, etat: etat, bilan: bilan, bilanDomaine: bilanDomaine, ijazatDe: ijazatDe,
    prochaine: prochaine, carnet: carnet,
    reindexer: reindexer, REGLAGE: REGLAGE
  };
});
