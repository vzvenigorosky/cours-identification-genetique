/* ============================================================
   Exam-style MCQ bank, bilingual (FR/EN).
   Each item: { topic, level:"m12"|"m2", q:{fr,en},
                answers:[ {text:{fr,en}, correct:bool} ] }
   level "m12" = examinable at M1 and M2; "m2" = M2 only.
   The M1 quiz draws from "m12"; the M2 quiz draws from both.
   Each question has exactly one correct answer.
   ============================================================ */
window.MCQ = [
  /* ---------- 1. Structure moléculaire de l'ADN ---------- */
  { topic: "adn", level: "m12",
    q: { fr: "Que signifie l'abréviation ADN ?", en: "What does the abbreviation DNA stand for?" },
    answers: [
      { text: { fr: "Acide désoxyribonucléique", en: "Deoxyribonucleic acid" }, correct: true },
      { text: { fr: "Acide diribonucléique", en: "Diribonucleic acid" }, correct: false },
      { text: { fr: "Acide dihydroxynucléaire", en: "Dihydroxynuclear acid" }, correct: false },
      { text: { fr: "Assemblage désoxyribonucléique", en: "Deoxyribonucleic assembly" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "De quoi est composé un nucléotide ?", en: "What is a nucleotide made of?" },
    answers: [
      { text: { fr: "Une base azotée, un sucre et un groupement phosphate", en: "A nitrogenous base, a sugar and a phosphate group" }, correct: true },
      { text: { fr: "Une base azotée, un acide aminé et un phosphate", en: "A nitrogenous base, an amino acid and a phosphate" }, correct: false },
      { text: { fr: "Un sucre, un acide gras et une base purique", en: "A sugar, a fatty acid and a purine base" }, correct: false },
      { text: { fr: "Deux bases azotées reliées par un pont hydrogène", en: "Two nitrogenous bases linked by a hydrogen bond" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Comment s'apparient les bases azotées de l'ADN ?", en: "How do the nitrogenous bases of DNA pair?" },
    answers: [
      { text: { fr: "A avec T, et G avec C", en: "A with T, and G with C" }, correct: true },
      { text: { fr: "A avec G, et T avec C", en: "A with G, and T with C" }, correct: false },
      { text: { fr: "A avec C, et G avec T", en: "A with C, and G with T" }, correct: false },
      { text: { fr: "A avec U, et G avec T", en: "A with U, and G with T" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Dans quel sens note-t-on l'orientation d'un brin d'ADN ?", en: "In which direction is the orientation of a DNA strand written?" },
    answers: [
      { text: { fr: "De 5' vers 3'", en: "From 5' to 3'" }, correct: true },
      { text: { fr: "De 3' vers 5'", en: "From 3' to 5'" }, correct: false },
      { text: { fr: "De gauche à droite", en: "From left to right" }, correct: false },
      { text: { fr: "Selon le gradient de concentration", en: "Along the concentration gradient" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Quelle est une différence correcte entre l'ARN et l'ADN ?", en: "Which is a correct difference between RNA and DNA?" },
    answers: [
      { text: { fr: "L'ARN est simple brin et l'uracile y remplace la thymine", en: "RNA is single-stranded and uracil replaces thymine" }, correct: true },
      { text: { fr: "L'ARN est double brin et plus stable que l'ADN", en: "RNA is double-stranded and more stable than DNA" }, correct: false },
      { text: { fr: "L'ADN utilise l'uracile, l'ARN utilise la thymine", en: "DNA uses uracil, RNA uses thymine" }, correct: false },
      { text: { fr: "L'ADN est simple brin, l'ARN est double brin", en: "DNA is single-stranded, RNA is double-stranded" }, correct: false }
    ] },

  /* ---------- 2. Structure du génome humain ---------- */
  { topic: "genome", level: "m12",
    q: { fr: "Combien de paires de chromosomes compte le génome nucléaire humain ?", en: "How many chromosome pairs does the human nuclear genome contain?" },
    answers: [
      { text: { fr: "23 paires (22 autosomes + 1 paire sexuelle)", en: "23 pairs (22 autosomes + 1 sex pair)" }, correct: true },
      { text: { fr: "46 paires", en: "46 pairs" }, correct: false },
      { text: { fr: "22 paires", en: "22 pairs" }, correct: false },
      { text: { fr: "24 paires", en: "24 pairs" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Comment l'ADN mitochondrial est-il transmis ?", en: "How is mitochondrial DNA transmitted?" },
    answers: [
      { text: { fr: "Uniquement par la mère", en: "Only from the mother" }, correct: true },
      { text: { fr: "Uniquement par le père", en: "Only from the father" }, correct: false },
      { text: { fr: "Par les deux parents à parts égales", en: "From both parents equally" }, correct: false },
      { text: { fr: "De père en fils uniquement", en: "From father to son only" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Qu'est-ce qu'un allèle ?", en: "What is an allele?" },
    answers: [
      { text: { fr: "Une variante de la séquence d'ADN à un locus donné", en: "A variant of the DNA sequence at a given locus" }, correct: true },
      { text: { fr: "Une position fixe sur un chromosome", en: "A fixed position on a chromosome" }, correct: false },
      { text: { fr: "Un chromosome entier", en: "A whole chromosome" }, correct: false },
      { text: { fr: "Une protéine codée par un gène", en: "A protein coded by a gene" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "La majorité du génome humain est composée de… ?", en: "Most of the human genome is made up of…?" },
    answers: [
      { text: { fr: "Régions non-codantes", en: "Non-coding regions" }, correct: true },
      { text: { fr: "Gènes codant des protéines", en: "Protein-coding genes" }, correct: false },
      { text: { fr: "ADN mitochondrial", en: "Mitochondrial DNA" }, correct: false },
      { text: { fr: "Séquences virales", en: "Viral sequences" }, correct: false }
    ] },

  /* ---------- 3. Les STR ---------- */
  { topic: "str", level: "m12",
    q: { fr: "Que signifie STR ?", en: "What does STR stand for?" },
    answers: [
      { text: { fr: "Short Tandem Repeat (fragment court répété en tandem)", en: "Short Tandem Repeat" }, correct: true },
      { text: { fr: "Single Terminal Region", en: "Single Terminal Region" }, correct: false },
      { text: { fr: "Sequence Tag Region", en: "Sequence Tag Region" }, correct: false },
      { text: { fr: "Standard Typing Reaction", en: "Standard Typing Reaction" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "À quoi correspond un allèle d'un locus STR ?", en: "What does an allele of an STR locus correspond to?" },
    answers: [
      { text: { fr: "À un nombre de répétitions du motif", en: "To a number of repeats of the motif" }, correct: true },
      { text: { fr: "À la couleur du fluorochrome", en: "To the colour of the fluorochrome" }, correct: false },
      { text: { fr: "À la taille totale du chromosome", en: "To the total size of the chromosome" }, correct: false },
      { text: { fr: "À une séquence codant une protéine", en: "To a protein-coding sequence" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Quelle est la taille d'un motif STR ?", en: "What is the size of an STR motif?" },
    answers: [
      { text: { fr: "De 1 à 6 nucléotides", en: "From 1 to 6 nucleotides" }, correct: true },
      { text: { fr: "De 10 à 20 nucléotides", en: "From 10 to 20 nucleotides" }, correct: false },
      { text: { fr: "Exactement 100 nucléotides", en: "Exactly 100 nucleotides" }, correct: false },
      { text: { fr: "Un seul chromosome", en: "A single chromosome" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Comment une population est-elle définie génétiquement ?", en: "How is a population defined genetically?" },
    answers: [
      { text: { fr: "Par les fréquences alléliques à chaque locus", en: "By the allele frequencies at each locus" }, correct: true },
      { text: { fr: "Par sa localisation géographique uniquement", en: "By its geographical location only" }, correct: false },
      { text: { fr: "Par le nombre de chromosomes de ses membres", en: "By the number of chromosomes of its members" }, correct: false },
      { text: { fr: "Par la longueur moyenne de son ADN", en: "By the average length of its DNA" }, correct: false }
    ] },

  /* ---------- 4. Extraction ---------- */
  { topic: "extraction", level: "m12",
    q: { fr: "Quelles sont les deux étapes essentielles de l'extraction de l'ADN ?", en: "What are the two essential steps of DNA extraction?" },
    answers: [
      { text: { fr: "La lyse cellulaire puis la séparation de l'ADN des autres composés", en: "Cell lysis then separation of the DNA from the other compounds" }, correct: true },
      { text: { fr: "L'amplification puis la migration", en: "Amplification then migration" }, correct: false },
      { text: { fr: "La dénaturation puis l'hybridation", en: "Denaturation then hybridisation" }, correct: false },
      { text: { fr: "Le marquage fluorescent puis la détection", en: "Fluorescent labelling then detection" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Quel est le rôle de la protéinase K ?", en: "What is the role of proteinase K?" },
    answers: [
      { text: { fr: "Dégrader les protéines de l'échantillon", en: "Degrade the proteins in the sample" }, correct: true },
      { text: { fr: "Amplifier l'ADN cible", en: "Amplify the target DNA" }, correct: false },
      { text: { fr: "Marquer les fragments par fluorescence", en: "Label the fragments by fluorescence" }, correct: false },
      { text: { fr: "Séparer les brins par la chaleur", en: "Separate the strands by heat" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Dans quel cas l'extraction différentielle est-elle utile ?", en: "In which case is differential extraction useful?" },
    answers: [
      { text: { fr: "Pour séparer les cellules d'une victime des spermatozoïdes d'un agresseur", en: "To separate a victim's cells from an assailant's sperm cells" }, correct: true },
      { text: { fr: "Pour amplifier plusieurs loci à la fois", en: "To amplify several loci at once" }, correct: false },
      { text: { fr: "Pour lire un électrophorégramme dégradé", en: "To read a degraded electropherogram" }, correct: false },
      { text: { fr: "Pour calculer une fréquence allélique", en: "To compute an allele frequency" }, correct: false }
    ] },

  /* ---------- 5. Amplification ---------- */
  { topic: "amplification", level: "m12",
    q: { fr: "Pourquoi amplifie-t-on l'ADN avant l'analyse ?", en: "Why is DNA amplified before analysis?" },
    answers: [
      { text: { fr: "Parce que les quantités extraites sont souvent trop faibles pour une analyse directe", en: "Because the extracted amounts are often too small for direct analysis" }, correct: true },
      { text: { fr: "Pour détruire l'ADN contaminant", en: "To destroy contaminating DNA" }, correct: false },
      { text: { fr: "Pour transformer l'ADN en ARN", en: "To convert the DNA into RNA" }, correct: false },
      { text: { fr: "Pour colorer les chromosomes", en: "To stain the chromosomes" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Quelles sont, dans l'ordre, les trois étapes d'un cycle de PCR ?", en: "What are the three steps of a PCR cycle, in order?" },
    answers: [
      { text: { fr: "Dénaturation, hybridation des amorces, polymérisation", en: "Denaturation, primer hybridisation, polymerisation" }, correct: true },
      { text: { fr: "Hybridation, dénaturation, polymérisation", en: "Hybridisation, denaturation, polymerisation" }, correct: false },
      { text: { fr: "Polymérisation, dénaturation, hybridation", en: "Polymerisation, denaturation, hybridisation" }, correct: false },
      { text: { fr: "Lyse, extraction, migration", en: "Lysis, extraction, migration" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Quel est le rôle d'une amorce en PCR ?", en: "What is the role of a primer in PCR?" },
    answers: [
      { text: { fr: "Cibler la région à amplifier en s'hybridant aux brins séparés", en: "Target the region to amplify by hybridising to the separated strands" }, correct: true },
      { text: { fr: "Dégrader les protéines résiduelles", en: "Degrade residual proteins" }, correct: false },
      { text: { fr: "Séparer les deux brins par la chaleur", en: "Separate the two strands by heat" }, correct: false },
      { text: { fr: "Colorer les allèles pour la détection", en: "Colour the alleles for detection" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Qu'est-ce qu'une PCR multiplexe ?", en: "What is a multiplex PCR?" },
    answers: [
      { text: { fr: "Une réaction qui amplifie plusieurs loci simultanément", en: "A reaction that amplifies several loci simultaneously" }, correct: true },
      { text: { fr: "Une PCR réalisée sur plusieurs individus à la fois", en: "A PCR run on several individuals at once" }, correct: false },
      { text: { fr: "Une PCR sans amorces", en: "A PCR without primers" }, correct: false },
      { text: { fr: "Une PCR à température constante", en: "A PCR at constant temperature" }, correct: false }
    ] },

  /* ---------- 6. Lecture et analyse des STR ---------- */
  { topic: "lecture", level: "m12",
    q: { fr: "Qu'est-ce qu'un électrophorégramme ?", en: "What is an electropherogram?" },
    answers: [
      { text: { fr: "La représentation graphique de la taille des fragments détectés à chaque locus", en: "The graphical representation of the size of the fragments detected at each locus" }, correct: true },
      { text: { fr: "Une photographie du chromosome Y", en: "A photograph of the Y chromosome" }, correct: false },
      { text: { fr: "La liste des amorces d'un kit", en: "The list of primers in a kit" }, correct: false },
      { text: { fr: "Le calcul de la fréquence d'un profil", en: "The computation of a profile's frequency" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Comment repère-t-on un mélange d'ADN sur un locus STR autosomal ?", en: "How do you spot a DNA mixture at an autosomal STR locus?" },
    answers: [
      { text: { fr: "Par la présence de plus de deux allèles au locus", en: "By the presence of more than two alleles at the locus" }, correct: true },
      { text: { fr: "Par l'absence totale d'allèles", en: "By the complete absence of alleles" }, correct: false },
      { text: { fr: "Par un seul allèle très intense", en: "By a single very intense allele" }, correct: false },
      { text: { fr: "Par la couleur bleue du pic", en: "By the blue colour of the peak" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Quel signe trahit la dégradation d'un échantillon sur l'électrophorégramme ?", en: "What sign reveals sample degradation on the electropherogram?" },
    answers: [
      { text: { fr: "Une baisse d'intensité du profil de gauche à droite", en: "A drop in profile intensity from left to right" }, correct: true },
      { text: { fr: "Une hausse d'intensité de gauche à droite", en: "A rise in intensity from left to right" }, correct: false },
      { text: { fr: "La présence d'un seul fluorochrome", en: "The presence of a single fluorochrome" }, correct: false },
      { text: { fr: "Des pics parfaitement égaux partout", en: "Perfectly equal peaks everywhere" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Combien d'allèles présente en général un locus STR-Y ?", en: "How many alleles does a Y-STR locus generally show?" },
    answers: [
      { text: { fr: "Un seul (sauf exceptions)", en: "Only one (with exceptions)" }, correct: true },
      { text: { fr: "Toujours exactement deux", en: "Always exactly two" }, correct: false },
      { text: { fr: "Au moins quatre", en: "At least four" }, correct: false },
      { text: { fr: "Aucun", en: "None" }, correct: false }
    ] },

  /* ---------- 7. Principes de l'identification ---------- */
  { topic: "identification", level: "m12",
    q: { fr: "Qu'est-ce que la correspondance fortuite ?", en: "What is a random (chance) match?" },
    answers: [
      { text: { fr: "Le risque qu'un autre individu ait par hasard le même profil", en: "The risk that another individual happens to have the same profile" }, correct: true },
      { text: { fr: "Une erreur de manipulation au laboratoire", en: "A handling error in the laboratory" }, correct: false },
      { text: { fr: "Une contamination par l'analyste", en: "Contamination by the analyst" }, correct: false },
      { text: { fr: "La perte d'un allèle par dégradation", en: "The loss of an allele through degradation" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Quelle est la probabilité d'un génotype hétérozygote a/b ?", en: "What is the probability of a heterozygous genotype a/b?" },
    answers: [
      { text: { fr: "2·pa·pb", en: "2·pa·pb" }, correct: true },
      { text: { fr: "pa·pb", en: "pa·pb" }, correct: false },
      { text: { fr: "pa²", en: "pa²" }, correct: false },
      { text: { fr: "pa + pb", en: "pa + pb" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Quelle est la probabilité d'un génotype homozygote a/a ?", en: "What is the probability of a homozygous genotype a/a?" },
    answers: [
      { text: { fr: "pa²", en: "pa²" }, correct: true },
      { text: { fr: "2·pa", en: "2·pa" }, correct: false },
      { text: { fr: "2·pa²", en: "2·pa²" }, correct: false },
      { text: { fr: "pa/2", en: "pa/2" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Comment obtient-on la fréquence d'un profil complet ?", en: "How is the frequency of a full profile obtained?" },
    answers: [
      { text: { fr: "En multipliant les probabilités des génotypes de tous les loci", en: "By multiplying the genotype probabilities across all loci" }, correct: true },
      { text: { fr: "En additionnant les probabilités des loci", en: "By adding the loci probabilities" }, correct: false },
      { text: { fr: "En prenant la plus grande probabilité", en: "By taking the largest probability" }, correct: false },
      { text: { fr: "En divisant par le nombre de loci", en: "By dividing by the number of loci" }, correct: false }
    ] },

  /* ---------- 8. Marqueurs des lignées uniparentales ---------- */
  { topic: "marqueurs", level: "m12",
    q: { fr: "Que permet de retracer l'ADN mitochondrial ?", en: "What does mitochondrial DNA allow you to trace?" },
    answers: [
      { text: { fr: "La lignée maternelle", en: "The maternal lineage" }, correct: true },
      { text: { fr: "La lignée paternelle", en: "The paternal lineage" }, correct: false },
      { text: { fr: "Les deux lignées à la fois", en: "Both lineages at once" }, correct: false },
      { text: { fr: "Aucune lignée", en: "No lineage" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Comment se transmet le chromosome Y ?", en: "How is the Y chromosome transmitted?" },
    answers: [
      { text: { fr: "De père en fils", en: "From father to son" }, correct: true },
      { text: { fr: "De mère en fille", en: "From mother to daughter" }, correct: false },
      { text: { fr: "Par les deux parents", en: "From both parents" }, correct: false },
      { text: { fr: "Uniquement par la mère", en: "Only from the mother" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Qu'est-ce qu'un haplotype ?", en: "What is a haplotype?" },
    answers: [
      { text: { fr: "Une combinaison d'allèles portés par une seule molécule d'ADN", en: "A combination of alleles carried by a single DNA molecule" }, correct: true },
      { text: { fr: "Les allèles portés par les deux chromosomes d'une paire", en: "The alleles carried by both chromosomes of a pair" }, correct: false },
      { text: { fr: "Une mutation privée à un individu", en: "A mutation private to one individual" }, correct: false },
      { text: { fr: "Le profil autosomal complet", en: "The complete autosomal profile" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Quelle est une limite des marqueurs uniparentaux ?", en: "What is a limitation of uniparental markers?" },
    answers: [
      { text: { fr: "Ils ne renseignent que sur une seule lignée à la fois", en: "They inform on only one lineage at a time" }, correct: true },
      { text: { fr: "Ils ne peuvent jamais être amplifiés par PCR", en: "They can never be amplified by PCR" }, correct: false },
      { text: { fr: "Ils sont hérités des deux parents de façon égale", en: "They are inherited equally from both parents" }, correct: false },
      { text: { fr: "Ils n'existent que chez les femmes", en: "They exist only in women" }, correct: false }
    ] },

  /* ---------- 9. La parenté (M2) ---------- */
  { topic: "parente", level: "m2",
    q: { fr: "Quelles relations n'ont pas de sens en génétique ?", en: "Which relationships have no meaning in genetics?" },
    answers: [
      { text: { fr: "Les liens par alliance et l'adoption", en: "Marriage ties and adoption" }, correct: true },
      { text: { fr: "Les relations parent/enfant", en: "Parent/child relationships" }, correct: false },
      { text: { fr: "Les relations entre frères et sœurs", en: "Sibling relationships" }, correct: false },
      { text: { fr: "Les relations grand-parent/petit-enfant", en: "Grandparent/grandchild relationships" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Que signifie l'abréviation PO en analyse de parenté ?", en: "What does the abbreviation PO mean in kinship analysis?" },
    answers: [
      { text: { fr: "Parent/Offspring (parent/enfant)", en: "Parent/Offspring" }, correct: true },
      { text: { fr: "Paternal Only", en: "Paternal Only" }, correct: false },
      { text: { fr: "Probability of Origin", en: "Probability of Origin" }, correct: false },
      { text: { fr: "Partial Overlap", en: "Partial Overlap" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Pourquoi la parenté est-elle plus difficile à établir en contexte archéologique ?", en: "Why is kinship harder to establish in an archaeological context?" },
    answers: [
      { text: { fr: "On ne peut généralement pas constituer de trios pour tester les hypothèses", en: "Trios usually cannot be formed to test the hypotheses" }, correct: true },
      { text: { fr: "L'ADN ancien n'a pas d'allèles", en: "Ancient DNA has no alleles" }, correct: false },
      { text: { fr: "Les fréquences alléliques y sont toujours nulles", en: "Allele frequencies there are always zero" }, correct: false },
      { text: { fr: "Les marqueurs STR n'existaient pas dans le passé", en: "STR markers did not exist in the past" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Les relations HS, AV et GC sont, en génétique… ?", en: "In genetics, the HS, AV and GC relationships are…?" },
    answers: [
      { text: { fr: "De même degré et souvent indistinguables", en: "Of the same degree and often indistinguishable" }, correct: true },
      { text: { fr: "Toujours parfaitement distinguables", en: "Always perfectly distinguishable" }, correct: false },
      { text: { fr: "Sans aucun partage d'allèles", en: "Without any shared alleles" }, correct: false },
      { text: { fr: "Équivalentes à une relation parent/enfant", en: "Equivalent to a parent/child relationship" }, correct: false }
    ] },

  /* ---------- 10. Calcul de probabilités de parenté (M2) ---------- */
  { topic: "probabilites", level: "m2",
    q: { fr: "Que désigne l'IBD (Identity-by-descent) ?", en: "What does IBD (Identity-by-descent) refer to?" },
    answers: [
      { text: { fr: "Des segments d'ADN identiques car hérités d'un ancêtre commun", en: "DNA segments that are identical because inherited from a common ancestor" }, correct: true },
      { text: { fr: "Des allèles identiques par pur hasard", en: "Alleles that are identical purely by chance" }, correct: false },
      { text: { fr: "Une méthode d'extraction de l'ADN", en: "A DNA extraction method" }, correct: false },
      { text: { fr: "Un type de fluorochrome", en: "A type of fluorochrome" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Qu'est-ce qu'un Likelihood Ratio (LR) ?", en: "What is a Likelihood Ratio (LR)?" },
    answers: [
      { text: { fr: "Un rapport comparant la probabilité des données sous deux hypothèses", en: "A ratio comparing the probability of the data under two hypotheses" }, correct: true },
      { text: { fr: "La fréquence d'un allèle dans une population", en: "The frequency of an allele in a population" }, correct: false },
      { text: { fr: "Le nombre de loci analysés", en: "The number of analysed loci" }, correct: false },
      { text: { fr: "La probabilité a priori d'une hypothèse", en: "The prior probability of a hypothesis" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Que vaut un LR en cas d'exclusion de la parenté testée ?", en: "What is the LR when the tested kinship is excluded?" },
    answers: [
      { text: { fr: "0", en: "0" }, correct: true },
      { text: { fr: "1", en: "1" }, correct: false },
      { text: { fr: "Toujours supérieur à 10 000", en: "Always greater than 10,000" }, correct: false },
      { text: { fr: "Exactement 0,5", en: "Exactly 0.5" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Quelle est une limite reconnue de la méthode des LR en parenté ?", en: "What is a recognised limitation of the LR method in kinship?" },
    answers: [
      { text: { fr: "La difficulté à confirmer une parenté au-delà du premier degré", en: "The difficulty of confirming kinship beyond the first degree" }, correct: true },
      { text: { fr: "Elle ne nécessite aucune fréquence allélique", en: "It requires no allele frequencies at all" }, correct: false },
      { text: { fr: "Elle donne toujours une certitude absolue", en: "It always gives absolute certainty" }, correct: false },
      { text: { fr: "Elle ne peut pas comparer deux hypothèses", en: "It cannot compare two hypotheses" }, correct: false }
    ] }
];
