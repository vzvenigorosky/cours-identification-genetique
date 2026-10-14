/* ============================================================
   Exam-style MCQ bank, bilingual (FR/EN).
   Each item: { topic, level:"m12"|"m2", q:{fr,en},
                answers:[ {text:{fr,en}, correct:bool} ] }
   level "m12" = examinable at M1 and M2; "m2" = M2 only.
   The M1 quiz draws from "m12"; the M2 quiz draws from both.
   Each question has exactly one correct answer.
   ============================================================ */
window.MCQ = [

  /* ---------- 1. Structure moléculaire de l’ADN ---------- */
  { topic: "adn", level: "m12",
    q: { fr: "Quel constituant distingue chimiquement un nucléotide d'ADN d'un nucléotide d'ARN ?", en: "Which component chemically distinguishes a DNA nucleotide from an RNA nucleotide?" },
    answers: [
      { text: { fr: "Le désoxyribose au lieu du ribose", en: "Deoxyribose instead of ribose" }, correct: true },
      { text: { fr: "Le ribose au lieu du désoxyribose", en: "Ribose instead of deoxyribose" }, correct: false },
      { text: { fr: "Une liaison peptidique au lieu d’une liaison phosphodiester", en: "A peptide bond instead of a phosphodiester bond" }, correct: false },
      { text: { fr: "L’absence de groupement phosphate", en: "Absence of a phosphate group" }, correct: false }
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
    q: { fr: "Par convention, dans quel sens écrit-on une séquence d'ADN ?", en: "By convention, in which direction is a DNA sequence written?" },
    answers: [
      { text: { fr: "De 5′ vers 3′", en: "From 5′ to 3′" }, correct: true },
      { text: { fr: "De 3′ vers 5′", en: "From 3′ to 5′" }, correct: false },
      { text: { fr: "Du phosphate vers la base à chaque nucléotide", en: "From phosphate to base at each nucleotide" }, correct: false },
      { text: { fr: "Toujours dans le sens du brin matrice de la polymérase", en: "Always in the direction of the polymerase template strand" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Quelle différence générale entre l'ARN et l'ADN est correcte ?", en: "Which general difference between RNA and DNA is correct?" },
    answers: [
      { text: { fr: "L'ARN est généralement simple brin et utilise l'uracile à la place de la thymine", en: "RNA is generally single-stranded and uses uracil instead of thymine" }, correct: true },
      { text: { fr: "L'ARN contient du désoxyribose et l'ADN du ribose", en: "RNA contains deoxyribose and DNA contains ribose" }, correct: false },
      { text: { fr: "L'ADN utilise l'uracile et l'ARN la thymine", en: "DNA uses uracil and RNA uses thymine" }, correct: false },
      { text: { fr: "L'ARN et l'ADN diffèrent uniquement par leur longueur", en: "RNA and DNA differ only in length" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Quel est le brin complémentaire de 5′-AGTC-3′, écrit de 5′ vers 3′ ?", en: "What is the complementary strand of 5′-AGTC-3′, written 5′ to 3′?" },
    answers: [
      { text: { fr: "5′-GACT-3′", en: "5′-GACT-3′" }, correct: true },
      { text: { fr: "5′-TCAG-3′", en: "5′-TCAG-3′" }, correct: false },
      { text: { fr: "5′-AGTC-3′", en: "5′-AGTC-3′" }, correct: false },
      { text: { fr: "5′-CTGA-3′", en: "5′-CTGA-3′" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Que signifie l'antiparallélisme des deux brins d'ADN ?", en: "What does antiparallel mean for the two DNA strands?" },
    answers: [
      { text: { fr: "Leurs orientations 5′→3′ sont opposées", en: "Their 5′→3′ orientations are opposite" }, correct: true },
      { text: { fr: "Ils ont la même orientation 5′→3′", en: "They have the same 5′→3′ orientation" }, correct: false },
      { text: { fr: "Ils ont des séquences identiques", en: "They have identical sequences" }, correct: false },
      { text: { fr: "Un brin contient du ribose et l'autre du désoxyribose", en: "One strand contains ribose and the other deoxyribose" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Quelle liaison relie les nucléotides successifs d'un brin d'ADN ?", en: "Which bond joins successive nucleotides within a DNA strand?" },
    answers: [
      { text: { fr: "Une liaison phosphodiester", en: "A phosphodiester bond" }, correct: true },
      { text: { fr: "Une liaison hydrogène entre bases complémentaires", en: "A hydrogen bond between complementary bases" }, correct: false },
      { text: { fr: "Une liaison peptidique", en: "A peptide bond" }, correct: false },
      { text: { fr: "Une liaison disulfure", en: "A disulfide bond" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Que se passe-t-il lors de la dénaturation thermique de l'ADN en PCR ?", en: "What happens during thermal DNA denaturation in PCR?" },
    answers: [
      { text: { fr: "Les deux brins se séparent sans découpe systématique du squelette", en: "The strands separate without systematic cleavage of the backbone" }, correct: true },
      { text: { fr: "Les liaisons phosphodiester sont toutes hydrolysées", en: "All phosphodiester bonds are hydrolysed" }, correct: false },
      { text: { fr: "Les bases sont retirées du squelette", en: "The bases are removed from the backbone" }, correct: false },
      { text: { fr: "La séquence d'un brin est inversée", en: "One strand's sequence is reversed" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Dans quel sens une ADN polymérase allonge-t-elle un nouveau brin ?", en: "In which direction does a DNA polymerase extend a new strand?" },
    answers: [
      { text: { fr: "5′→3′ en ajoutant au groupe 3′-OH", en: "5′→3′ by adding to the 3′-OH group" }, correct: true },
      { text: { fr: "3′→5′ en ajoutant au groupe 5′", en: "3′→5′ by adding to the 5′ group" }, correct: false },
      { text: { fr: "Dans les deux sens à partir d'une amorce", en: "In both directions from one primer" }, correct: false },
      { text: { fr: "En ajoutant uniquement au centre du brin", en: "By adding only at the centre of the strand" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Quelle paire comprend deux bases puriques ?", en: "Which pair contains two purine bases?" },
    answers: [
      { text: { fr: "Adénine et guanine", en: "Adenine and guanine" }, correct: true },
      { text: { fr: "Cytosine et thymine", en: "Cytosine and thymine" }, correct: false },
      { text: { fr: "Adénine et thymine", en: "Adenine and thymine" }, correct: false },
      { text: { fr: "Guanine et cytosine", en: "Guanine and cytosine" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Pourquoi une cassure entre les deux sites d'amorçage peut-elle empêcher une PCR ?", en: "Why can a break between the two primer sites prevent PCR?" },
    answers: [
      { text: { fr: "Il manque une matrice intacte couvrant la cible", en: "An intact template spanning the target is missing" }, correct: true },
      { text: { fr: "La cassure transforme toutes les thymines en uraciles", en: "The break converts all thymines to uracils" }, correct: false },
      { text: { fr: "La cassure augmente le nombre de répétitions STR", en: "The break increases the STR repeat number" }, correct: false },
      { text: { fr: "Les amorces deviennent des protéines", en: "The primers become proteins" }, correct: false }
    ] },
  { topic: "adn", level: "m12",
    q: { fr: "Quel sucre entre dans la composition de l'ADN ?", en: "Which sugar is a component of DNA?" },
    answers: [
      { text: { fr: "Le désoxyribose", en: "Deoxyribose" }, correct: true },
      { text: { fr: "Le ribose", en: "Ribose" }, correct: false },
      { text: { fr: "Le glucose", en: "Glucose" }, correct: false },
      { text: { fr: "Le lactose", en: "Lactose" }, correct: false }
    ] },

  /* ---------- 2. Structure du génome humain ---------- */
  { topic: "genome", level: "m12",
    q: { fr: "Combien de paires de chromosomes compte normalement une cellule somatique humaine diploïde ?", en: "How many chromosome pairs does a diploid human somatic cell normally contain?" },
    answers: [
      { text: { fr: "23 paires : 22 paires d’autosomes et une paire de chromosomes sexuels", en: "23 pairs: 22 autosome pairs and one sex-chromosome pair" }, correct: true },
      { text: { fr: "46 paires : 44 paires d’autosomes et deux paires sexuelles", en: "46 pairs: 44 autosome pairs and two sex-chromosome pairs" }, correct: false },
      { text: { fr: "22 paires au total, chromosomes sexuels compris", en: "22 pairs in total, including sex chromosomes" }, correct: false },
      { text: { fr: "23 chromosomes non appariés", en: "23 unpaired chromosomes" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Selon le mode habituel de transmission chez l'humain, de quel parent provient l'ADN mitochondrial ?", en: "Under the usual human inheritance pattern, which parent supplies mitochondrial DNA?" },
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
  { topic: "genome", level: "m12",
    q: { fr: "Combien de copies d'un locus autosomal non dupliqué possède normalement une cellule diploïde ?", en: "How many copies of an unduplicated autosomal locus does a diploid cell normally have?" },
    answers: [
      { text: { fr: "Deux, une de chaque parent", en: "Two, one from each parent" }, correct: true },
      { text: { fr: "Une, transmise par la mère", en: "One, inherited from the mother" }, correct: false },
      { text: { fr: "Une par mitochondrie", en: "One per mitochondrion" }, correct: false },
      { text: { fr: "Quatre, deux de chaque parent", en: "Four, two from each parent" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Que désigne un locus ?", en: "What is a locus?" },
    answers: [
      { text: { fr: "Une position définie dans le génome", en: "A defined position in the genome" }, correct: true },
      { text: { fr: "Une variante à cette position", en: "A variant at that position" }, correct: false },
      { text: { fr: "L'ensemble des allèles d'une personne", en: "All the alleles of a person" }, correct: false },
      { text: { fr: "La fréquence d'un génotype", en: "The frequency of a genotype" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Un individu porte les allèles 12 et 14 à un locus autosomal. Il est…", en: "An individual carries alleles 12 and 14 at an autosomal locus. They are…" },
    answers: [
      { text: { fr: "Hétérozygote à ce locus", en: "Heterozygous at this locus" }, correct: true },
      { text: { fr: "Homozygote à ce locus", en: "Homozygous at this locus" }, correct: false },
      { text: { fr: "Haploïde dans toutes ses cellules", en: "Haploid in all their cells" }, correct: false },
      { text: { fr: "Nécessairement issu d'un mélange", en: "Necessarily a mixture" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Quel échantillon contient normalement de l'ADN nucléaire humain utilisable ?", en: "Which sample normally contains usable human nuclear DNA?" },
    answers: [
      { text: { fr: "Des leucocytes du sang", en: "Blood leukocytes" }, correct: true },
      { text: { fr: "Des hématies humaines matures purifiées", en: "Purified mature human red blood cells" }, correct: false },
      { text: { fr: "Du plasma dépourvu de cellules et d'ADN libre", en: "Plasma devoid of cells and cell-free DNA" }, correct: false },
      { text: { fr: "Une solution de protéines purifiées sans ADN", en: "A solution of purified proteins without DNA" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Que distingue principalement un génotype d'une fréquence allélique ?", en: "What mainly distinguishes a genotype from an allele frequency?" },
    answers: [
      { text: { fr: "Le génotype décrit les allèles d'un individu; la fréquence décrit leur proportion dans une population", en: "A genotype describes an individual's alleles; a frequency describes their proportion in a population" }, correct: true },
      { text: { fr: "Le génotype est une proportion; la fréquence est une paire d'allèles", en: "A genotype is a proportion; a frequency is an allele pair" }, correct: false },
      { text: { fr: "Les deux désignent la hauteur d'un pic", en: "Both describe peak height" }, correct: false },
      { text: { fr: "Les deux désignent la position d'un locus", en: "Both describe a locus position" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Combien de copies d'un autosome possède normalement un spermatozoïde humain ?", en: "How many copies of an autosome does a human sperm cell normally have?" },
    answers: [
      { text: { fr: "Une", en: "One" }, correct: true },
      { text: { fr: "Deux", en: "Two" }, correct: false },
      { text: { fr: "Quatre", en: "Four" }, correct: false },
      { text: { fr: "Aucune", en: "None" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Pourquoi les profils STR autosomaux usuels ne distinguent-ils généralement pas les jumeaux monozygotes ?", en: "Why do routine autosomal STR profiles generally not distinguish monozygotic twins?" },
    answers: [
      { text: { fr: "Ils partagent généralement les mêmes génotypes aux loci testés", en: "They generally share the same genotypes at the tested loci" }, correct: true },
      { text: { fr: "Ils n'ont pas d'ADN nucléaire", en: "They have no nuclear DNA" }, correct: false },
      { text: { fr: "Ils ne portent que des loci homozygotes", en: "They carry only homozygous loci" }, correct: false },
      { text: { fr: "Leurs allèles sont toujours perdus en PCR", en: "Their alleles always drop out in PCR" }, correct: false }
    ] },
  { topic: "genome", level: "m12",
    q: { fr: "Quelle affirmation sur une région non codante est correcte ?", en: "Which statement about a non-coding region is correct?" },
    answers: [
      { text: { fr: "Elle peut être polymorphe et servir de marqueur d'identification", en: "It can be polymorphic and serve as an identification marker" }, correct: true },
      { text: { fr: "Elle est nécessairement identique chez tous les humains", en: "It is necessarily identical in all humans" }, correct: false },
      { text: { fr: "Elle ne peut pas être amplifiée par PCR", en: "It cannot be amplified by PCR" }, correct: false },
      { text: { fr: "Elle est nécessairement située dans une mitochondrie", en: "It is necessarily located in a mitochondrion" }, correct: false }
    ] },

  /* ---------- 3. Les STR ---------- */
  { topic: "str", level: "m12",
    q: { fr: "Quelle propriété rend un locus STR polymorphe utile pour l'identification ?", en: "Which property makes a polymorphic STR locus useful for identification?" },
    answers: [
      { text: { fr: "Le nombre de répétitions varie entre individus", en: "Repeat number varies between individuals" }, correct: true },
      { text: { fr: "Le nombre de chromosomes varie selon l’allèle", en: "Chromosome number varies with the allele" }, correct: false },
      { text: { fr: "Chaque allèle utilise un fluorochrome propre à un individu", en: "Each allele uses a dye specific to an individual" }, correct: false },
      { text: { fr: "Le locus est présent uniquement dans les traces judiciaires", en: "The locus exists only in forensic evidence" }, correct: false }
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
    q: { fr: "Quelle taille de motif est couramment utilisée dans les panels STR autosomaux médico-légaux ?", en: "Which repeat motif size is commonly used in forensic autosomal STR panels?" },
    answers: [
      { text: { fr: "Quatre nucléotides (motif tétranucléotidique)", en: "Four nucleotides (a tetranucleotide motif)" }, correct: true },
      { text: { fr: "Quarante nucléotides", en: "Forty nucleotides" }, correct: false },
      { text: { fr: "Quatre cents nucléotides", en: "Four hundred nucleotides" }, correct: false },
      { text: { fr: "La longueur totale de l’amplicon, amorces comprises", en: "The total amplicon length, including primers" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Quelles données caractérisent la variation d'un panel STR dans une population de référence ?", en: "Which data characterise STR panel variation in a reference population?" },
    answers: [
      { text: { fr: "Les fréquences alléliques à chaque locus", en: "Allele frequencies at each locus" }, correct: true },
      { text: { fr: "Les hauteurs des pics d’un seul individu", en: "Peak heights from a single individual" }, correct: false },
      { text: { fr: "Les couleurs des fluorochromes du kit", en: "The kit’s dye colours" }, correct: false },
      { text: { fr: "La concentration moyenne des extraits", en: "Mean extract concentration" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Deux allèles d'un STR tétranucléotidique simple diffèrent d'une répétition. Quel écart de longueur attend-on ?", en: "Two alleles of a simple tetranucleotide STR differ by one repeat. What length difference is expected?" },
    answers: [
      { text: { fr: "4 paires de bases", en: "4 base pairs" }, correct: true },
      { text: { fr: "1 paire de bases", en: "1 base pair" }, correct: false },
      { text: { fr: "2 paires de bases", en: "2 base pairs" }, correct: false },
      { text: { fr: "16 paires de bases", en: "16 base pairs" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Que signifie généralement la désignation d'un microvariant STR 9.3 ?", en: "What does the STR microvariant designation 9.3 generally mean?" },
    answers: [
      { text: { fr: "Neuf répétitions complètes et trois bases d'une répétition incomplète", en: "Nine complete repeats and three bases of an incomplete repeat" }, correct: true },
      { text: { fr: "Une longueur totale de 9,3 paires de bases", en: "A total length of 9.3 base pairs" }, correct: false },
      { text: { fr: "Neuf allèles et trois contributeurs", en: "Nine alleles and three contributors" }, correct: false },
      { text: { fr: "Un pic de 9,3 RFU", en: "A peak of 9.3 RFU" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Quel est le rôle d'une échelle allélique en analyse STR ?", en: "What is the role of an allelic ladder in STR analysis?" },
    answers: [
      { text: { fr: "Associer les fragments aux désignations alléliques de référence", en: "Associate fragments with reference allele designations" }, correct: true },
      { text: { fr: "Quantifier l'ADN avant PCR", en: "Quantify DNA before PCR" }, correct: false },
      { text: { fr: "Mesurer la fréquence allélique dans la population", en: "Measure allele frequency in the population" }, correct: false },
      { text: { fr: "Déterminer directement le nombre de contributeurs", en: "Directly determine the number of contributors" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Pourquoi utilise-t-on plusieurs loci STR pour identifier une personne ?", en: "Why are multiple STR loci used to identify a person?" },
    answers: [
      { text: { fr: "La combinaison des génotypes augmente le pouvoir de discrimination", en: "The genotype combination increases discrimination power" }, correct: true },
      { text: { fr: "Chaque locus correspond à un tissu différent", en: "Each locus corresponds to a different tissue" }, correct: false },
      { text: { fr: "Un locus suffit toujours mais les autres contrôlent le sexe", en: "One locus always suffices but the others check sex" }, correct: false },
      { text: { fr: "Tous les loci ont nécessairement les mêmes fréquences", en: "All loci necessarily have the same frequencies" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Deux personnes ont le même allèle de longueur STR. Que peut-on conclure ?", en: "Two people have the same STR length allele. What can be concluded?" },
    answers: [
      { text: { fr: "Elles partagent cet allèle, sans preuve suffisante d'identité ou de parenté", en: "They share this allele, without sufficient proof of identity or kinship" }, correct: true },
      { text: { fr: "Elles sont la même personne", en: "They are the same person" }, correct: false },
      { text: { fr: "Elles sont nécessairement frère et sœur", en: "They must be siblings" }, correct: false },
      { text: { fr: "Leurs génomes entiers sont identiques", en: "Their entire genomes are identical" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Pourquoi un miniSTR peut-il aider avec de l'ADN dégradé ?", en: "Why can a miniSTR help with degraded DNA?" },
    answers: [
      { text: { fr: "Son amplicon plus court a davantage de chances de rester intact", en: "Its shorter amplicon is more likely to remain intact" }, correct: true },
      { text: { fr: "Il répare les cassures avant amplification", en: "It repairs breaks before amplification" }, correct: false },
      { text: { fr: "Il supprime toutes les mutations STR", en: "It removes all STR mutations" }, correct: false },
      { text: { fr: "Il augmente la taille des fragments extraits", en: "It increases the size of extracted fragments" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Quel mécanisme peut modifier le nombre de répétitions d'un STR ?", en: "Which mechanism can change the number of STR repeats?" },
    answers: [
      { text: { fr: "Un glissement lors de la réplication", en: "Slippage during replication" }, correct: true },
      { text: { fr: "Un changement de fluorochrome à séquence constante", en: "A dye change with an unchanged sequence" }, correct: false },
      { text: { fr: "Une hausse du seuil analytique", en: "An increase in the analytical threshold" }, correct: false },
      { text: { fr: "La migration capillaire seule", en: "Capillary migration alone" }, correct: false }
    ] },
  { topic: "str", level: "m12",
    q: { fr: "Deux allèles ont la même longueur STR mais des séquences différentes. Quelle technique peut révéler cette différence ?", en: "Two alleles have the same STR length but different sequences. Which technique can reveal this difference?" },
    answers: [
      { text: { fr: "Le séquençage de la région STR", en: "Sequencing the STR region" }, correct: true },
      { text: { fr: "La seule mesure de taille par électrophorèse capillaire", en: "Size measurement alone by capillary electrophoresis" }, correct: false },
      { text: { fr: "La seule mesure de concentration par qPCR", en: "Concentration measurement alone by qPCR" }, correct: false },
      { text: { fr: "Le comptage du nombre de chromosomes", en: "Counting chromosomes" }, correct: false }
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
      { text: { fr: "Pour enrichir séparément les fractions épithéliale et spermatique d’un prélèvement mixte", en: "To separately enrich epithelial and sperm fractions from a mixed sample" }, correct: true },
      { text: { fr: "Pour séparer les allèles maternels des allèles paternels dans une cellule", en: "To separate maternal from paternal alleles within a cell" }, correct: false },
      { text: { fr: "Pour séparer les fragments selon leur longueur après PCR", en: "To separate fragments by length after PCR" }, correct: false },
      { text: { fr: "Pour séparer l’ADN de deux individus uniquement selon leurs génotypes", en: "To separate two individuals’ DNA solely by their genotypes" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "À quoi sert un blanc d'extraction ?", en: "What is an extraction blank used for?" },
    answers: [
      { text: { fr: "Détecter une contamination introduite par les réactifs ou le traitement", en: "Detect contamination introduced by reagents or processing" }, correct: true },
      { text: { fr: "Prouver que chaque échantillon contient assez d'ADN", en: "Prove each sample contains enough DNA" }, correct: false },
      { text: { fr: "Déterminer la fréquence du profil", en: "Determine profile frequency" }, correct: false },
      { text: { fr: "Calibrer la taille des allèles STR", en: "Calibrate STR allele sizes" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Pourquoi changer de gants entre deux prélèvements ?", en: "Why change gloves between two samples?" },
    answers: [
      { text: { fr: "Réduire le transfert d'ADN d'un prélèvement à l'autre", en: "Reduce DNA transfer from one sample to another" }, correct: true },
      { text: { fr: "Augmenter le rendement de la polymérase", en: "Increase polymerase yield" }, correct: false },
      { text: { fr: "Empêcher toute mutation germinale", en: "Prevent all germline mutations" }, correct: false },
      { text: { fr: "Égaliser les concentrations d'ADN", en: "Equalise DNA concentrations" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Quelle limite peut avoir une extraction différentielle ?", en: "What limitation can differential extraction have?" },
    answers: [
      { text: { fr: "Les fractions peuvent conserver de l'ADN des deux types cellulaires", en: "Fractions can retain DNA from both cell types" }, correct: true },
      { text: { fr: "La fraction spermatique ne peut contenir que de l'ADN mitochondrial", en: "The sperm fraction can contain only mitochondrial DNA" }, correct: false },
      { text: { fr: "Elle sépare les individus selon leurs allèles STR", en: "It separates individuals according to their STR alleles" }, correct: false },
      { text: { fr: "Elle garantit un profil complet même sans spermatozoïdes", en: "It guarantees a complete profile even without sperm cells" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Pourquoi éliminer les inhibiteurs pendant la purification ?", en: "Why remove inhibitors during purification?" },
    answers: [
      { text: { fr: "Ils peuvent perturber l'amplification de l'ADN", en: "They can interfere with DNA amplification" }, correct: true },
      { text: { fr: "Ils changent les fréquences alléliques de la population", en: "They change population allele frequencies" }, correct: false },
      { text: { fr: "Ils créent une troisième copie de chaque autosome", en: "They create a third copy of each autosome" }, correct: false },
      { text: { fr: "Ils changent systématiquement le nombre de répétitions", en: "They systematically change repeat number" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Un extrait contient de l'ADN mais la PCR est inhibée. Quelle démarche peut aider, après validation ?", en: "An extract contains DNA but PCR is inhibited. Which validated approach may help?" },
    answers: [
      { text: { fr: "Une purification supplémentaire ou une dilution adaptée", en: "Additional purification or an appropriate dilution" }, correct: true },
      { text: { fr: "Ajouter uniquement plus d'extrait à la réaction", en: "Only add more extract to the reaction" }, correct: false },
      { text: { fr: "Remplacer l'échelle allélique par un blanc", en: "Replace the allelic ladder with a blank" }, correct: false },
      { text: { fr: "Interpréter l'absence de pics comme une exclusion certaine", en: "Interpret absent peaks as a certain exclusion" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Quel compromis faut-il considérer en diluant un extrait inhibé ?", en: "What trade-off must be considered when diluting an inhibited extract?" },
    answers: [
      { text: { fr: "Réduire les inhibiteurs réduit aussi la quantité d'ADN par réaction", en: "Reducing inhibitors also reduces DNA input per reaction" }, correct: true },
      { text: { fr: "La dilution augmente la quantité totale d'ADN", en: "Dilution increases the total amount of DNA" }, correct: false },
      { text: { fr: "La dilution élimine uniquement l'ADN contaminant", en: "Dilution removes only contaminating DNA" }, correct: false },
      { text: { fr: "La dilution allonge tous les fragments", en: "Dilution lengthens all fragments" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Pourquoi documenter la chaîne de conservation d'un prélèvement ?", en: "Why document a sample's chain of custody?" },
    answers: [
      { text: { fr: "Assurer la traçabilité de son identité et de ses manipulations", en: "Ensure traceability of its identity and handling" }, correct: true },
      { text: { fr: "Calculer le LR sans données génétiques", en: "Calculate the LR without genetic data" }, correct: false },
      { text: { fr: "Garantir qu'il ne contient qu'un seul contributeur", en: "Guarantee it contains only one contributor" }, correct: false },
      { text: { fr: "Remplacer les contrôles de contamination", en: "Replace contamination controls" }, correct: false }
    ] },
  { topic: "extraction", level: "m12",
    q: { fr: "Pourquoi conserver une trace biologique dans des conditions limitant l'humidité, selon le protocole ?", en: "Why store biological evidence under conditions limiting moisture, according to protocol?" },
    answers: [
      { text: { fr: "Limiter l'activité microbienne et la dégradation de l'ADN", en: "Limit microbial activity and DNA degradation" }, correct: true },
      { text: { fr: "Augmenter le nombre de répétitions STR", en: "Increase STR repeat number" }, correct: false },
      { text: { fr: "Supprimer les allèles minoritaires", en: "Remove minor alleles" }, correct: false },
      { text: { fr: "Transformer l'ADN mitochondrial en ADN nucléaire", en: "Convert mitochondrial DNA into nuclear DNA" }, correct: false }
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
  { topic: "amplification", level: "m12",
    q: { fr: "À quoi sert la quantification de l'ADN humain avant une PCR STR ?", en: "What is human DNA quantification before STR PCR used for?" },
    answers: [
      { text: { fr: "Adapter la quantité d'ADN introduite à la plage validée", en: "Adjust DNA input to the validated range" }, correct: true },
      { text: { fr: "Déterminer tous les génotypes STR", en: "Determine all STR genotypes" }, correct: false },
      { text: { fr: "Éliminer l'ADN contaminant", en: "Remove contaminating DNA" }, correct: false },
      { text: { fr: "Mesurer directement le LR", en: "Directly measure the LR" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Que teste un contrôle PCR négatif sans matrice ?", en: "What does a no-template negative PCR control test?" },
    answers: [
      { text: { fr: "La présence éventuelle de contamination dans la préparation PCR", en: "Possible contamination in the PCR setup" }, correct: true },
      { text: { fr: "La réussite de l'extraction de chaque trace", en: "Successful extraction of every evidence sample" }, correct: false },
      { text: { fr: "La fréquence des allèles rares", en: "The frequency of rare alleles" }, correct: false },
      { text: { fr: "La transmission mendélienne", en: "Mendelian inheritance" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Quel est le rôle d'un contrôle PCR positif de génotype connu ?", en: "What is the role of a positive PCR control with a known genotype?" },
    answers: [
      { text: { fr: "Vérifier le fonctionnement de l'amplification et du typage", en: "Check that amplification and typing function correctly" }, correct: true },
      { text: { fr: "Prouver l'absence de contamination dans tous les échantillons", en: "Prove absence of contamination in every sample" }, correct: false },
      { text: { fr: "Mesurer la quantité de cellules sur la trace", en: "Measure cell quantity in the evidence" }, correct: false },
      { text: { fr: "Déterminer la population d'origine du suspect", en: "Determine the suspect's population of origin" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Quel effet est favorisé par une très faible quantité d'ADN en PCR ?", en: "Which effect is promoted by very low DNA input in PCR?" },
    answers: [
      { text: { fr: "Un déséquilibre aléatoire des allèles et du drop-out", en: "Random allelic imbalance and dropout" }, correct: true },
      { text: { fr: "Une amplification toujours identique entre répétitions", en: "Amplification that is always identical between replicates" }, correct: false },
      { text: { fr: "Une disparition sélective de l'ADN contaminant", en: "Selective disappearance of contaminating DNA" }, correct: false },
      { text: { fr: "Une augmentation du nombre de chromosomes", en: "An increase in chromosome number" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Pourquoi séparer les espaces pré-PCR et post-PCR ?", en: "Why separate pre-PCR and post-PCR areas?" },
    answers: [
      { text: { fr: "Éviter que des amplicons contaminent de nouvelles réactions", en: "Prevent amplicons from contaminating new reactions" }, correct: true },
      { text: { fr: "Empêcher les amorces de s'hybrider", en: "Prevent primers from annealing" }, correct: false },
      { text: { fr: "Séparer physiquement les allèles maternels et paternels", en: "Physically separate maternal and paternal alleles" }, correct: false },
      { text: { fr: "Éliminer la nécessité de contrôles négatifs", en: "Remove the need for negative controls" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Dans le modèle idéal de doublement à chaque cycle, quel facteur obtient-on après 10 cycles ?", en: "In an ideal model of doubling every cycle, what factor is obtained after 10 cycles?" },
    answers: [
      { text: { fr: "2¹⁰ = 1 024", en: "2¹⁰ = 1,024" }, correct: true },
      { text: { fr: "2 × 10 = 20", en: "2 × 10 = 20" }, correct: false },
      { text: { fr: "10² = 100", en: "10² = 100" }, correct: false },
      { text: { fr: "2⁵ = 32", en: "2⁵ = 32" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Quel risque accompagne une augmentation non validée du nombre de cycles PCR ?", en: "What risk accompanies an unvalidated increase in PCR cycle number?" },
    answers: [
      { text: { fr: "Accroître aussi la détection de contaminations et d'artefacts", en: "Also increase detection of contamination and artefacts" }, correct: true },
      { text: { fr: "Garantir la suppression du stutter", en: "Guarantee removal of stutter" }, correct: false },
      { text: { fr: "Réparer les matrices cassées", en: "Repair broken templates" }, correct: false },
      { text: { fr: "Rendre les pics indépendants de la quantité initiale", en: "Make peaks independent of initial DNA quantity" }, correct: false }
    ] },
  { topic: "amplification", level: "m12",
    q: { fr: "Une variation au site de fixation d'une amorce peut provoquer…", en: "A variant at a primer-binding site can cause…" },
    answers: [
      { text: { fr: "Une mauvaise amplification de l'allèle concerné", en: "Poor amplification of the affected allele" }, correct: true },
      { text: { fr: "Un changement de fréquence dans toute la population", en: "A frequency change throughout the population" }, correct: false },
      { text: { fr: "La conversion de tous les loci en haplotypes Y", en: "Conversion of all loci into Y haplotypes" }, correct: false },
      { text: { fr: "Un allongement systématique de quatre bases", en: "A systematic four-base increase" }, correct: false }
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
    q: { fr: "Quel indice soutient la présence d'un mélange à un locus STR autosomal, après examen des artefacts et des rares profils tri-alléliques ?", en: "Which observation supports a mixture at an autosomal STR locus, after considering artefacts and rare tri-allelic profiles?" },
    answers: [
      { text: { fr: "Plus de deux allèles authentiques détectés", en: "More than two genuine alleles detected" }, correct: true },
      { text: { fr: "Deux pics de hauteur légèrement différente", en: "Two peaks of slightly different height" }, correct: false },
      { text: { fr: "Un pic de stutter dans la plage attendue", en: "A stutter peak within the expected range" }, correct: false },
      { text: { fr: "Un seul allèle de grande taille", en: "One large allele" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Quel aspect est compatible avec une dégradation, lorsque l'axe horizontal indique une taille croissante des fragments ?", en: "Which pattern is consistent with degradation when the horizontal axis shows increasing fragment size?" },
    answers: [
      { text: { fr: "Une diminution préférentielle des pics des grands fragments", en: "Preferential reduction of large-fragment peaks" }, correct: true },
      { text: { fr: "Une diminution préférentielle des pics des petits fragments", en: "Preferential reduction of small-fragment peaks" }, correct: false },
      { text: { fr: "Un pic de même taille dans deux canaux de couleur", en: "A peak at the same size in two dye channels" }, correct: false },
      { text: { fr: "Un pic de stutter exactement une répétition plus court", en: "A stutter peak exactly one repeat shorter" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Combien d'allèles présente en général un locus STR-Y ?", en: "How many alleles does a Y-STR locus generally show?" },
    answers: [
      { text: { fr: "Un seul (sauf exceptions)", en: "Only one (with exceptions)" }, correct: true },
      { text: { fr: "Toujours exactement deux", en: "Always exactly two" }, correct: false },
      { text: { fr: "Au moins quatre", en: "At least four" }, correct: false },
      { text: { fr: "Aucun", en: "None" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "À un STR tétranucléotidique, où se situe souvent le stutter n−1 ?", en: "At a tetranucleotide STR, where is n−1 stutter often located?" },
    answers: [
      { text: { fr: "Quatre bases avant le pic allélique parent", en: "Four bases shorter than the parent allele peak" }, correct: true },
      { text: { fr: "Une base avant le pic parent", en: "One base shorter than the parent peak" }, correct: false },
      { text: { fr: "À la même taille mais uniquement dans un autre canal", en: "At the same size but only in another channel" }, correct: false },
      { text: { fr: "Quarante bases après le pic parent", en: "Forty bases longer than the parent peak" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Que désigne le drop-out allélique ?", en: "What is allelic dropout?" },
    answers: [
      { text: { fr: "La non-détection d'un allèle réellement présent dans la matrice", en: "Failure to detect an allele actually present in the template" }, correct: true },
      { text: { fr: "La détection d'un allèle contaminant supplémentaire", en: "Detection of an additional contaminating allele" }, correct: false },
      { text: { fr: "Un pic de stutter plus court d'une répétition", en: "A stutter peak one repeat shorter" }, correct: false },
      { text: { fr: "Le partage d'un allèle entre deux contributeurs", en: "Sharing an allele between two contributors" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Un seul pic est détecté à un locus dans une trace pauvre en ADN. Quelle prudence s'impose ?", en: "One peak is detected at a locus in low-template evidence. What caution is needed?" },
    answers: [
      { text: { fr: "Un hétérozygote avec drop-out reste possible", en: "A heterozygote with dropout remains possible" }, correct: true },
      { text: { fr: "L'homozygotie est certaine", en: "Homozygosity is certain" }, correct: false },
      { text: { fr: "Le locus est nécessairement porté par Y", en: "The locus must be on Y" }, correct: false },
      { text: { fr: "Le pic prouve la présence de deux contributeurs", en: "The peak proves two contributors are present" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Pourquoi deux allèles détectés à chaque locus n'excluent-ils pas un mélange ?", en: "Why do two detected alleles at every locus not exclude a mixture?" },
    answers: [
      { text: { fr: "Les contributeurs peuvent partager des allèles, et certains peuvent ne pas être détectés", en: "Contributors may share alleles, and some may go undetected" }, correct: true },
      { text: { fr: "Chaque contributeur apporte toujours quatre allèles par locus", en: "Each contributor always adds four alleles per locus" }, correct: false },
      { text: { fr: "La couleur d'un pic indique le nombre de contributeurs", en: "Peak colour indicates contributor number" }, correct: false },
      { text: { fr: "Un mélange contient uniquement des homozygotes", en: "A mixture contains only homozygotes" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Que représente principalement la hauteur d'un pic en RFU ?", en: "What does peak height in RFU primarily represent?" },
    answers: [
      { text: { fr: "L'intensité du signal fluorescent détecté", en: "The intensity of the detected fluorescence signal" }, correct: true },
      { text: { fr: "La longueur du fragment en bases", en: "Fragment length in bases" }, correct: false },
      { text: { fr: "La fréquence de l'allèle dans la population", en: "The allele frequency in the population" }, correct: false },
      { text: { fr: "Le nombre exact de cellules déposées", en: "The exact number of deposited cells" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Quel est le rôle de l'étalon interne de taille en électrophorèse capillaire ?", en: "What is the role of the internal size standard in capillary electrophoresis?" },
    answers: [
      { text: { fr: "Estimer la taille des fragments dans chaque injection", en: "Estimate fragment sizes in each injection" }, correct: true },
      { text: { fr: "Estimer les fréquences alléliques", en: "Estimate allele frequencies" }, correct: false },
      { text: { fr: "Identifier la personne ayant déposé l'ADN", en: "Identify the person who deposited the DNA" }, correct: false },
      { text: { fr: "Mesurer la concentration avant extraction", en: "Measure concentration before extraction" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Un pic faible est à une position de stutter possible. Quelle interprétation convient ?", en: "A low peak is at a possible stutter position. What interpretation is appropriate?" },
    answers: [
      { text: { fr: "Évaluer le stutter et une contribution allélique possible selon les critères validés", en: "Evaluate stutter and a possible allelic contribution using validated criteria" }, correct: true },
      { text: { fr: "Le supprimer uniquement parce qu'il est faible", en: "Remove it solely because it is low" }, correct: false },
      { text: { fr: "Le compter systématiquement comme un nouvel allèle", en: "Always count it as a new allele" }, correct: false },
      { text: { fr: "L'attribuer au suspect avant de regarder le reste du profil", en: "Assign it to the suspect before examining the rest of the profile" }, correct: false }
    ] },
  { topic: "lecture", level: "m12",
    q: { fr: "Cinq allèles authentiques sont détectés à un locus autosomal non dupliqué, sans artefact. Quel nombre minimal de contributeurs diploïdes faut-il ?", en: "Five genuine alleles are detected at an unduplicated autosomal locus, without artefacts. What minimum number of diploid contributors is needed?" },
    answers: [
      { text: { fr: "Trois", en: "Three" }, correct: true },
      { text: { fr: "Deux", en: "Two" }, correct: false },
      { text: { fr: "Cinq", en: "Five" }, correct: false },
      { text: { fr: "Un", en: "One" }, correct: false }
    ] },

  /* ---------- 7. Principes de l’identification ---------- */
  { topic: "identification", level: "m12",
    q: { fr: "Qu'est-ce que la correspondance fortuite ?", en: "What is a random (chance) match?" },
    answers: [
      { text: { fr: "Le risque qu'un autre individu ait par hasard le même profil", en: "The risk that another individual happens to have the same profile" }, correct: true },
      { text: { fr: "Une erreur de manipulation au laboratoire", en: "A handling error in the laboratory" }, correct: false },
      { text: { fr: "Une contamination par l'analyste", en: "Contamination by the analyst" }, correct: false },
      { text: { fr: "La perte d'un allèle par dégradation", en: "The loss of an allele through degradation" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Sous l'équilibre de Hardy-Weinberg, sans correction de structure de population, quelle est la fréquence du génotype hétérozygote a/b (a ≠ b) ?", en: "Under Hardy-Weinberg equilibrium, without a population-structure correction, what is the frequency of heterozygous genotype a/b (a ≠ b)?" },
    answers: [
      { text: { fr: "2·pa·pb", en: "2·pa·pb" }, correct: true },
      { text: { fr: "pa·pb", en: "pa·pb" }, correct: false },
      { text: { fr: "pa²", en: "pa²" }, correct: false },
      { text: { fr: "pa + pb", en: "pa + pb" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Sous l'équilibre de Hardy-Weinberg, sans correction de structure de population, quelle est la fréquence du génotype homozygote a/a ?", en: "Under Hardy-Weinberg equilibrium, without a population-structure correction, what is the frequency of homozygous genotype a/a?" },
    answers: [
      { text: { fr: "pa²", en: "pa²" }, correct: true },
      { text: { fr: "2·pa", en: "2·pa" }, correct: false },
      { text: { fr: "2·pa²", en: "2·pa²" }, correct: false },
      { text: { fr: "pa/2", en: "pa/2" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Pour des loci autosomaux indépendants, comment combine-t-on les fréquences génotypiques d'un profil ?", en: "For independent autosomal loci, how are genotype frequencies combined for a profile?" },
    answers: [
      { text: { fr: "En multipliant les probabilités des génotypes de tous les loci", en: "By multiplying the genotype probabilities across all loci" }, correct: true },
      { text: { fr: "En additionnant les probabilités des loci", en: "By adding the loci probabilities" }, correct: false },
      { text: { fr: "En prenant la plus grande probabilité", en: "By taking the largest probability" }, correct: false },
      { text: { fr: "En divisant par le nombre de loci", en: "By dividing by the number of loci" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Sous Hardy-Weinberg, pa = 0,10 et pb = 0,20. Quelle est la fréquence du génotype a/b ?", en: "Under Hardy-Weinberg, pa = 0.10 and pb = 0.20. What is the a/b genotype frequency?" },
    answers: [
      { text: { fr: "0,04", en: "0.04" }, correct: true },
      { text: { fr: "0,02", en: "0.02" }, correct: false },
      { text: { fr: "0,30", en: "0.30" }, correct: false },
      { text: { fr: "0,01", en: "0.01" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Sous Hardy-Weinberg, pa = 0,20. Quelle est la fréquence du génotype a/a ?", en: "Under Hardy-Weinberg, pa = 0.20. What is the a/a genotype frequency?" },
    answers: [
      { text: { fr: "0,04", en: "0.04" }, correct: true },
      { text: { fr: "0,40", en: "0.40" }, correct: false },
      { text: { fr: "0,20", en: "0.20" }, correct: false },
      { text: { fr: "0,08", en: "0.08" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Deux génotypes à des loci indépendants ont des fréquences 0,02 et 0,05. Quelle est la fréquence combinée ?", en: "Two genotypes at independent loci have frequencies 0.02 and 0.05. What is their combined frequency?" },
    answers: [
      { text: { fr: "0,001", en: "0.001" }, correct: true },
      { text: { fr: "0,07", en: "0.07" }, correct: false },
      { text: { fr: "0,035", en: "0.035" }, correct: false },
      { text: { fr: "0,40", en: "0.40" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Une probabilité de correspondance fortuite de 1 sur un million signifie…", en: "A random match probability of one in a million means…" },
    answers: [
      { text: { fr: "Qu'un individu non apparenté tiré au hasard dans la population de référence a cette probabilité de partager le profil", en: "A randomly selected unrelated individual from the reference population has this probability of sharing the profile" }, correct: true },
      { text: { fr: "Que le suspect a une probabilité de 1 sur un million d'être innocent", en: "The suspect has a one-in-a-million probability of being innocent" }, correct: false },
      { text: { fr: "Que le laboratoire a un taux d'erreur de 1 sur un million", en: "The laboratory has a one-in-a-million error rate" }, correct: false },
      { text: { fr: "Qu'exactement une personne dans chaque million possède le profil", en: "Exactly one person in every million has the profile" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Pourquoi le choix de la population de référence compte-t-il dans un calcul de fréquence ?", en: "Why does reference population choice matter in a frequency calculation?" },
    answers: [
      { text: { fr: "Les fréquences alléliques peuvent varier entre populations", en: "Allele frequencies may vary between populations" }, correct: true },
      { text: { fr: "La taille d'un allèle change selon la population choisie", en: "Allele size changes with the chosen population" }, correct: false },
      { text: { fr: "La PCR ne fonctionne que dans une population", en: "PCR works in only one population" }, correct: false },
      { text: { fr: "Le choix détermine la couleur des fluorochromes", en: "The choice determines dye colours" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Que permet à elle seule une concordance de profil entre une trace et une référence ?", en: "What does a profile match between evidence and a reference establish by itself?" },
    answers: [
      { text: { fr: "Une compatibilité génétique dont le poids doit être évalué", en: "Genetic compatibility whose evidential weight must be evaluated" }, correct: true },
      { text: { fr: "L'heure exacte du dépôt", en: "The exact time of deposition" }, correct: false },
      { text: { fr: "L'activité ayant causé le dépôt", en: "The activity that caused deposition" }, correct: false },
      { text: { fr: "La culpabilité certaine du donneur", en: "Certain guilt of the donor" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Pourquoi une probabilité de correspondance calculée pour des non-apparentés peut-elle être inadéquate pour un frère du suspect ?", en: "Why may a match probability calculated for unrelated people be unsuitable for the suspect's brother?" },
    answers: [
      { text: { fr: "Les apparentés partagent davantage d'allèles que des non-apparentés", en: "Relatives share more alleles than unrelated people" }, correct: true },
      { text: { fr: "Les frères ont toujours des profils identiques", en: "Brothers always have identical profiles" }, correct: false },
      { text: { fr: "Les frères ont toujours des profils sans allèle commun", en: "Brothers always have profiles with no shared alleles" }, correct: false },
      { text: { fr: "Les fréquences alléliques cessent d'exister chez les frères", en: "Allele frequencies cease to exist in brothers" }, correct: false }
    ] },
  { topic: "identification", level: "m12",
    q: { fr: "Quel résultat est généralement plus informatif pour discriminer des individus non apparentés ?", en: "Which result is generally more informative for distinguishing unrelated individuals?" },
    answers: [
      { text: { fr: "Un profil fiable couvrant de nombreux loci polymorphes indépendants", en: "A reliable profile covering many independent polymorphic loci" }, correct: true },
      { text: { fr: "Un seul allèle très fréquent", en: "One very common allele" }, correct: false },
      { text: { fr: "La seule intensité totale de fluorescence", en: "Total fluorescence intensity alone" }, correct: false },
      { text: { fr: "La seule concentration de l'extrait", en: "Extract concentration alone" }, correct: false }
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
  { topic: "marqueurs", level: "m12",
    q: { fr: "Pourquoi l'ADN mitochondrial peut-il être utile dans une tige pilaire sans racine ?", en: "Why can mitochondrial DNA be useful in a hair shaft without a root?" },
    answers: [
      { text: { fr: "Il peut subsister quand l'ADN nucléaire exploitable est très limité", en: "It can remain when usable nuclear DNA is very limited" }, correct: true },
      { text: { fr: "Il n'existe que dans les racines", en: "It exists only in roots" }, correct: false },
      { text: { fr: "Il identifie toujours une seule personne", en: "It always identifies a single person" }, correct: false },
      { text: { fr: "Il est transmis uniquement de père en fils", en: "It is inherited only from father to son" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Deux personnes partagent un haplotype mitochondrial. Que peut-on conclure ?", en: "Two people share a mitochondrial haplotype. What can be concluded?" },
    answers: [
      { text: { fr: "Elles sont compatibles à ce marqueur, sans preuve suffisante d'identité individuelle", en: "They are compatible at this marker, without sufficient proof of individual identity" }, correct: true },
      { text: { fr: "Elles sont nécessairement la même personne", en: "They must be the same person" }, correct: false },
      { text: { fr: "Elles sont nécessairement mère et fille", en: "They must be mother and daughter" }, correct: false },
      { text: { fr: "Elles ont nécessairement le même profil autosomal", en: "They must have the same autosomal profile" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Pourquoi ne multiplie-t-on pas simplement les fréquences des loci Y-STR comme celles de loci autosomaux indépendants ?", en: "Why are Y-STR locus frequencies not simply multiplied like those of independent autosomal loci?" },
    answers: [
      { text: { fr: "Les loci usuels de la région non recombinante du Y sont liés et transmis en haplotype", en: "Routine loci in the non-recombining Y region are linked and inherited as a haplotype" }, correct: true },
      { text: { fr: "Chaque locus Y contient deux allèles indépendants", en: "Each Y locus contains two independent alleles" }, correct: false },
      { text: { fr: "Tous les allèles Y ont une fréquence égale à 1", en: "Every Y allele has a frequency of 1" }, correct: false },
      { text: { fr: "Les loci Y ne sont pas polymorphes", en: "Y loci are not polymorphic" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Dans quel contexte les Y-STR peuvent-ils être particulièrement utiles ?", en: "In which setting can Y-STRs be particularly useful?" },
    answers: [
      { text: { fr: "Détecter une composante masculine dans un excès d'ADN féminin", en: "Detect a male component in an excess of female DNA" }, correct: true },
      { text: { fr: "Distinguer avec certitude tous les frères d'une même lignée paternelle", en: "Distinguish with certainty all brothers in one paternal lineage" }, correct: false },
      { text: { fr: "Identifier la lignée maternelle d'un homme", en: "Identify a man's maternal lineage" }, correct: false },
      { text: { fr: "Mesurer la date de dépôt d'une trace", en: "Measure the deposition date of evidence" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Que désigne l'hétéroplasmie mitochondriale ?", en: "What is mitochondrial heteroplasmy?" },
    answers: [
      { text: { fr: "La coexistence de plusieurs variants d'ADN mitochondrial chez un individu", en: "Coexistence of multiple mitochondrial DNA variants in an individual" }, correct: true },
      { text: { fr: "La présence d'un allèle sur X et d'un autre sur Y", en: "One allele on X and another on Y" }, correct: false },
      { text: { fr: "Un mélange certain de deux personnes", en: "A certain mixture of two people" }, correct: false },
      { text: { fr: "La présence de deux copies d'un autosome", en: "Two copies of an autosome" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Pourquoi un père et son fils peuvent-ils différer à un Y-STR ?", en: "Why can a father and son differ at a Y-STR?" },
    answers: [
      { text: { fr: "Une mutation peut survenir lors de la transmission", en: "A mutation may occur during transmission" }, correct: true },
      { text: { fr: "Le fils reçoit normalement son Y de sa mère", en: "The son normally receives his Y from his mother" }, correct: false },
      { text: { fr: "Le Y est remplacé par un autosome à chaque génération", en: "The Y is replaced by an autosome every generation" }, correct: false },
      { text: { fr: "La PCR change nécessairement tous les allèles Y", en: "PCR necessarily changes all Y alleles" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Qui peut partager un haplotype mitochondrial avec un homme, en l'absence de mutation ?", en: "Who can share a mitochondrial haplotype with a man, in the absence of mutation?" },
    answers: [
      { text: { fr: "Sa sœur ayant la même mère", en: "His sister with the same mother" }, correct: true },
      { text: { fr: "Tous ses enfants quel que soit leur mère", en: "All his children regardless of their mother" }, correct: false },
      { text: { fr: "Uniquement ses fils", en: "Only his sons" }, correct: false },
      { text: { fr: "Tous ses parents de la lignée paternelle uniquement", en: "All his relatives in the paternal lineage only" }, correct: false }
    ] },
  { topic: "marqueurs", level: "m12",
    q: { fr: "Pourquoi les marqueurs uniparentaux ont-ils une résolution individuelle limitée ?", en: "Why do uniparental markers have limited individual resolution?" },
    answers: [
      { text: { fr: "Plusieurs membres d'une même lignée peuvent partager le même haplotype", en: "Several members of one lineage may share the same haplotype" }, correct: true },
      { text: { fr: "Leur séquence est identique chez tous les humains", en: "Their sequence is identical in all humans" }, correct: false },
      { text: { fr: "Ils ne peuvent pas être comparés à une référence", en: "They cannot be compared with a reference" }, correct: false },
      { text: { fr: "Ils ne sont présents que dans les cellules sexuelles", en: "They are present only in sex cells" }, correct: false }
    ] },

  /* ---------- 9. La parenté (M2) ---------- */
  { topic: "parente", level: "m2",
    q: { fr: "Quels liens ne constituent pas, à eux seuls, une relation de parenté biologique ?", en: "Which ties do not, by themselves, constitute a biological kinship relationship?" },
    answers: [
      { text: { fr: "Les liens par alliance et l’adoption", en: "Marriage ties and adoption" }, correct: true },
      { text: { fr: "Les liens parent biologique-enfant", en: "Biological parent-child ties" }, correct: false },
      { text: { fr: "Les liens entre frères et sœurs germains", en: "Full-sibling ties" }, correct: false },
      { text: { fr: "Les liens grand-parent biologique-petit-enfant", en: "Biological grandparent-grandchild ties" }, correct: false }
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
    q: { fr: "Pourquoi une analyse de parenté sur des restes archéologiques peut-elle être moins informative ?", en: "Why can kinship analysis of archaeological remains be less informative?" },
    answers: [
      { text: { fr: "Les profils peuvent être incomplets et les références familiales manquer", en: "Profiles may be incomplete and family references unavailable" }, correct: true },
      { text: { fr: "La dégradation transforme les génotypes en fréquences alléliques", en: "Degradation converts genotypes into allele frequencies" }, correct: false },
      { text: { fr: "Les loci STR disparaissent de la population après plusieurs générations", en: "STR loci disappear from the population after several generations" }, correct: false },
      { text: { fr: "Les os ne contiennent jamais d’ADN nucléaire", en: "Bones never contain nuclear DNA" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Dans le modèle autosomal classique sans consanguinité, les relations demi-fratrie (HS), avunculaire (AV) et grand-parent/petit-enfant (GC) sont…", en: "In the classical autosomal model without inbreeding, half-sibling (HS), avuncular (AV) and grandparent/grandchild (GC) relationships are…" },
    answers: [
      { text: { fr: "De mêmes coefficients IBD à un locus, donc difficiles à distinguer avec des STR indépendants seuls", en: "Of the same single-locus IBD coefficients, so difficult to distinguish using independent STRs alone" }, correct: true },
      { text: { fr: "De mêmes coefficients IBD que parent-enfant", en: "Of the same IBD coefficients as parent-child" }, correct: false },
      { text: { fr: "Sans partage d’ADN par descendance", en: "Without DNA sharing by descent" }, correct: false },
      { text: { fr: "Toujours distinguables avec un seul locus STR", en: "Always distinguishable with a single STR locus" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Sans mutation ni erreur de typage, que doit partager un enfant avec chacun de ses parents à un locus autosomal ?", en: "Without mutation or typing error, what must a child share with each parent at an autosomal locus?" },
    answers: [
      { text: { fr: "Au moins un allèle", en: "At least one allele" }, correct: true },
      { text: { fr: "Les deux allèles", en: "Both alleles" }, correct: false },
      { text: { fr: "Aucun allèle", en: "No allele" }, correct: false },
      { text: { fr: "Uniquement l'allèle le plus fréquent", en: "Only the most common allele" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "La mère est 10/12 et l'enfant 12/14. Sans mutation, quel est l'allèle paternel obligatoire ?", en: "The mother is 10/12 and the child is 12/14. Without mutation, what is the obligate paternal allele?" },
    answers: [
      { text: { fr: "14", en: "14" }, correct: true },
      { text: { fr: "10", en: "10" }, correct: false },
      { text: { fr: "12", en: "12" }, correct: false },
      { text: { fr: "10 et 12 ensemble", en: "10 and 12 together" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Pour ce trio mère 10/12, enfant 12/14, quel père présumé est incompatible au locus sans mutation ni erreur ?", en: "For this trio, mother 10/12 and child 12/14, which alleged father is incompatible at this locus without mutation or error?" },
    answers: [
      { text: { fr: "10/12", en: "10/12" }, correct: true },
      { text: { fr: "10/14", en: "10/14" }, correct: false },
      { text: { fr: "12/14", en: "12/14" }, correct: false },
      { text: { fr: "14/14", en: "14/14" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Pourquoi un trio parent-parent-enfant est-il souvent plus informatif qu'un duo père présumé-enfant ?", en: "Why is a parent-parent-child trio often more informative than an alleged-father-child duo?" },
    answers: [
      { text: { fr: "Le génotype maternel aide à identifier l'allèle paternel transmis", en: "The maternal genotype helps identify the transmitted paternal allele" }, correct: true },
      { text: { fr: "Il garantit un LR infini", en: "It guarantees an infinite LR" }, correct: false },
      { text: { fr: "Il supprime la possibilité de mutation", en: "It removes the possibility of mutation" }, correct: false },
      { text: { fr: "Il rend les fréquences alléliques inutiles dans tout calcul", en: "It makes allele frequencies unnecessary in every calculation" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Un désaccord isolé dans une étude de parenté doit conduire à…", en: "An isolated mismatch in a kinship study should lead to…" },
    answers: [
      { text: { fr: "Examiner mutation, erreur et données aux autres loci", en: "Examine mutation, error and data at other loci" }, correct: true },
      { text: { fr: "Conclure automatiquement à une exclusion dans tout modèle", en: "Automatically conclude exclusion under every model" }, correct: false },
      { text: { fr: "Remplacer le génotype de l'enfant par celui du père", en: "Replace the child's genotype with the father's" }, correct: false },
      { text: { fr: "Ignorer systématiquement le locus sans justification", en: "Always ignore the locus without justification" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Quelle relation correspond à HS ?", en: "Which relationship does HS denote?" },
    answers: [
      { text: { fr: "Demi-frères ou demi-sœurs partageant un seul parent biologique", en: "Half-siblings sharing one biological parent" }, correct: true },
      { text: { fr: "Frères ou sœurs partageant leurs deux parents biologiques", en: "Full siblings sharing both biological parents" }, correct: false },
      { text: { fr: "Parent et enfant", en: "Parent and child" }, correct: false },
      { text: { fr: "Cousins germains", en: "First cousins" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Sous le modèle autosomal classique, qui partage en moyenne un quart de son ADN autosomal par descendance ?", en: "Under the classical autosomal model, who shares on average a quarter of their autosomal DNA by descent?" },
    answers: [
      { text: { fr: "Des demi-frères ou demi-sœurs", en: "Half-siblings" }, correct: true },
      { text: { fr: "Un parent et son enfant", en: "A parent and child" }, correct: false },
      { text: { fr: "Des jumeaux monozygotes", en: "Monozygotic twins" }, correct: false },
      { text: { fr: "Des cousins germains", en: "First cousins" }, correct: false }
    ] },
  { topic: "parente", level: "m2",
    q: { fr: "Deux personnes ont le même haplotype Y. Pourquoi cela ne suffit-il pas à établir une relation père-fils ?", en: "Two people have the same Y haplotype. Why is that insufficient to establish a father-son relationship?" },
    answers: [
      { text: { fr: "D'autres parents de la lignée paternelle peuvent partager ce haplotype", en: "Other paternal-line relatives may share this haplotype" }, correct: true },
      { text: { fr: "Le chromosome Y se transmet normalement par la mère", en: "The Y chromosome is normally maternally inherited" }, correct: false },
      { text: { fr: "Tout haplotype Y est unique à un individu", en: "Every Y haplotype is unique to one individual" }, correct: false },
      { text: { fr: "Un père et son fils ne partagent jamais de Y-STR", en: "A father and son never share Y-STRs" }, correct: false }
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
    q: { fr: "Si P(E|parenté) = 0 et P(E|non-apparentés) > 0 dans un modèle sans mutation ni erreur, que vaut LR = P(E|parenté)/P(E|non-apparentés) ?", en: "If P(E|kinship) = 0 and P(E|unrelated) > 0 in a model without mutation or error, what is LR = P(E|kinship)/P(E|unrelated)?" },
    answers: [
      { text: { fr: "0", en: "0" }, correct: true },
      { text: { fr: "1", en: "1" }, correct: false },
      { text: { fr: "Toujours supérieur à 10 000", en: "Always greater than 10,000" }, correct: false },
      { text: { fr: "Exactement 0,5", en: "Exactly 0.5" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Pourquoi les parentés éloignées sont-elles souvent difficiles à distinguer avec un panel limité de STR autosomaux ?", en: "Why are distant relationships often difficult to distinguish using a limited autosomal STR panel?" },
    answers: [
      { text: { fr: "Le partage attendu est plus faible et peut chevaucher celui d’autres relations", en: "Expected sharing is lower and can overlap that of other relationships" }, correct: true },
      { text: { fr: "Les apparentés éloignés ne partagent jamais d’allèles", en: "Distant relatives never share alleles" }, correct: false },
      { text: { fr: "Les fréquences alléliques sont remplacées par les hauteurs de pics", en: "Allele frequencies are replaced by peak heights" }, correct: false },
      { text: { fr: "Un LR ne peut comparer que parent-enfant à frères et sœurs", en: "An LR can only compare parent-child against siblings" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Si LR = P(E|H1)/P(E|H2) = 100, quelle lecture est correcte ?", en: "If LR = P(E|H1)/P(E|H2) = 100, which reading is correct?" },
    answers: [
      { text: { fr: "Les données sont 100 fois plus probables sous H1 que sous H2", en: "The data are 100 times more probable under H1 than under H2" }, correct: true },
      { text: { fr: "H1 a une probabilité de 100 %", en: "H1 has a probability of 100%" }, correct: false },
      { text: { fr: "H2 est impossible", en: "H2 is impossible" }, correct: false },
      { text: { fr: "La probabilité de H1 vaut exactement 0,99", en: "The probability of H1 is exactly 0.99" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Que signifie LR = 1 pour deux hypothèses données ?", en: "What does LR = 1 mean for two specified hypotheses?" },
    answers: [
      { text: { fr: "Les données ne favorisent aucune des deux hypothèses", en: "The data favour neither hypothesis" }, correct: true },
      { text: { fr: "Les deux personnes sont identiques", en: "The two people are identical" }, correct: false },
      { text: { fr: "La parenté est exclue", en: "Kinship is excluded" }, correct: false },
      { text: { fr: "Les deux hypothèses ont nécessairement la même probabilité a posteriori", en: "The two hypotheses necessarily have equal posterior probabilities" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Pour LR = P(E|H1)/P(E|H2), que signifie LR = 0,01 ?", en: "For LR = P(E|H1)/P(E|H2), what does LR = 0.01 mean?" },
    answers: [
      { text: { fr: "Les données favorisent H2 par un facteur 100", en: "The data favour H2 by a factor of 100" }, correct: true },
      { text: { fr: "Les données favorisent H1 par un facteur 100", en: "The data favour H1 by a factor of 100" }, correct: false },
      { text: { fr: "La probabilité de H1 est exactement 1 %", en: "The probability of H1 is exactly 1%" }, correct: false },
      { text: { fr: "Les données sont équiprobables sous H1 et H2", en: "The data are equally probable under H1 and H2" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Comment obtient-on les odds a posteriori à partir d'un LR ?", en: "How are posterior odds obtained from an LR?" },
    answers: [
      { text: { fr: "Odds a priori × LR", en: "Prior odds × LR" }, correct: true },
      { text: { fr: "Odds a priori + LR", en: "Prior odds + LR" }, correct: false },
      { text: { fr: "LR seul, quelles que soient les odds a priori", en: "LR alone, regardless of prior odds" }, correct: false },
      { text: { fr: "1 − LR", en: "1 − LR" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Avec des odds a priori H1:H2 de 1:9 et LR = 90, quelles sont les odds a posteriori ?", en: "With prior odds H1:H2 of 1:9 and LR = 90, what are the posterior odds?" },
    answers: [
      { text: { fr: "10:1", en: "10:1" }, correct: true },
      { text: { fr: "90:1", en: "90:1" }, correct: false },
      { text: { fr: "1:10", en: "1:10" }, correct: false },
      { text: { fr: "1:810", en: "1:810" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Dans un modèle sans consanguinité, quels sont les coefficients IBD (k0, k1, k2) de frères et sœurs germains ?", en: "In a model without inbreeding, what are the IBD coefficients (k0, k1, k2) for full siblings?" },
    answers: [
      { text: { fr: "(1/4, 1/2, 1/4)", en: "(1/4, 1/2, 1/4)" }, correct: true },
      { text: { fr: "(0, 1, 0)", en: "(0, 1, 0)" }, correct: false },
      { text: { fr: "(1/2, 1/2, 0)", en: "(1/2, 1/2, 0)" }, correct: false },
      { text: { fr: "(1, 0, 0)", en: "(1, 0, 0)" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Dans le modèle classique sans consanguinité, quels coefficients IBD (k0, k1, k2) décrivent parent-enfant ?", en: "In the classical model without inbreeding, which IBD coefficients (k0, k1, k2) describe parent-child?" },
    answers: [
      { text: { fr: "(0, 1, 0)", en: "(0, 1, 0)" }, correct: true },
      { text: { fr: "(1/4, 1/2, 1/4)", en: "(1/4, 1/2, 1/4)" }, correct: false },
      { text: { fr: "(1/2, 1/2, 0)", en: "(1/2, 1/2, 0)" }, correct: false },
      { text: { fr: "(0, 0, 1)", en: "(0, 0, 1)" }, correct: false }
    ] },
  { topic: "probabilites", level: "m2",
    q: { fr: "Pourquoi préciser l'hypothèse alternative dans un LR de parenté ?", en: "Why specify the alternative hypothesis in a kinship LR?" },
    answers: [
      { text: { fr: "Comparer à un non-apparenté ou à un autre apparenté peut donner des LR différents", en: "Comparison with an unrelated person or a different relative can give different LRs" }, correct: true },
      { text: { fr: "Le LR dépend seulement du nombre de loci", en: "The LR depends only on locus count" }, correct: false },
      { text: { fr: "L'alternative est toujours impossible par définition", en: "The alternative is always impossible by definition" }, correct: false },
      { text: { fr: "Préciser l'alternative transforme le LR en probabilité a priori", en: "Specifying the alternative turns the LR into a prior probability" }, correct: false }
    ] }
];
