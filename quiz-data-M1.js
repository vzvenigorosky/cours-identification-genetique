const quizData = [
    {
        question: "Que signifie l'abréviation ADN ?",
        answers: [
            { text: "Acide DésoxyriboNucléique", correct: true },
            { text: "Acide DériboNucléique", correct: false }, // Close
            { text: "Agent de Défense Nucléaire", correct: false },
            { text: "Acide Dihydroxy Nucléaire", correct: false },
            { text: "Assemblage Désoxyribonucléique", correct: false }, // Close
            { text: "Acide de Nucléotide Diversifié", correct: false },
            { text: "Agencement Désoxyribo Nucléaire", correct: false },
            { text: "Articulation des Nucléons Dynamiques", correct: false },
        ]
    },
    {
        question: "Comment se nomment les quatre bases azotées ?",
        answers: [
            { text: "Adénine, Thymine, Guanine, Cytosine", correct: true },
            { text: "Adénine, Thymine, Guanosine, Cytosine", correct: false }, // Close
            { text: "Alanine, Tyrosine, Guanine, Cystéine", correct: false },
            { text: "Adénosine, Thymidine, Guanine, Cytidine", correct: false }, // Close
            { text: "Adénine, Thiamine, Glucose, Cycline", correct: false },
            { text: "Adénine, Triphosphate, Guanine, Cytosine", correct: false },
            { text: "Acide, Thymine, Guanine, Cytosine", correct: false },
            { text: "Adénine, Thymine, Guanine, Chlorophylle", correct: false },
        ]
    },
    {
        question: "Qu'est-ce qu'un nucléotide ?",
        answers: [
            { text: "Un nucléotide est la sous-unité de la molécule d'ADN", correct: true },
            { text: "Une séquence spécifique de bases azotées", correct: false }, // Close
            { text: "Un type de sucre présent dans l'ADN", correct: false },
            { text: "Un composant clé des membranes cellulaires", correct: false },
            { text: "Une forme de nucléase utilisée dans la réplication", correct: false },
            { text: "La base de la structure secondaire de l'ARN", correct: false }, // Close
            { text: "Un catalyseur dans la synthèse protéique", correct: false },
            { text: "Une unité énergétique cellulaire", correct: false },
        ]
    },
    {
        question: "De quoi est composé un nucléotide ?",
        answers: [
            { text: "Il est composé d'une base azotée, d'un sucre (ribose ou désoxyribose) et d'un groupement phosphate", correct: true },
            { text: "D'une base azotée, d'un acide aminé, et d'un groupement phosphate", correct: false }, // Close
            { text: "D'un sucre, d'une base purique, et d'un acide gras", correct: false },
            { text: "D'une base azotée, d'un sucre, et d'une base sulfurique", correct: false }, // Close
            { text: "D'un acide aminé, d'un sucre complexe, et d'un groupement hydroxyle", correct: false },
            { text: "De trois phosphates, d'un sucre ribose, et d'une base azotée", correct: false },
            { text: "D'une base pyrimidique, d'un sucre, et d'un groupement carboxyle", correct: false },
            { text: "D'une base azotée, d'un groupement phosphate, et d'une chaîne latérale variable", correct: false },
        ]
    },
{
    question: "Qu'est-ce qu'une séquence d'ADN ?",
    answers: [
        { text: "Une suite ordonnée de nucléotides sur un brin d'ADN", correct: true },
        { text: "Une collection de chromosomes dans le noyau cellulaire", correct: false },
        { text: "Un ensemble de gènes responsables d'une caractéristique spécifique", correct: false },
        { text: "La structure tridimensionnelle de la protéine", correct: false },
        { text: "Une série de réactions chimiques dans la respiration cellulaire", correct: false },
        { text: "Un type de RNA messager nécessaire pour la synthèse protéique", correct: false },
        { text: "La division cellulaire conduisant à la création de deux cellules filles", correct: false },
        { text: "Un processus par lequel l'information génétique est copiée", correct: false },
    ]
},
{
    question: "Quelles sont les trois différences entre l'ARN et l'ADN ?",
    answers: [
        { text: "Les trois différences entre l'ARN et l'ADN sont : l'ARN est simple brin, l'ARN a des fonctions au-delà du stockage d'informations, et l'uracile remplace la thymine dans l'ARN", correct: true },
        { text: "L'ADN est présent uniquement dans le noyau, tandis que l'ARN est présent uniquement dans le cytoplasme", correct: false },
        { text: "L'ADN est impliqué dans la synthèse des protéines, tandis que l'ARN sert de matériel génétique pour les virus", correct: false },
        { text: "L'ARN est double-brin et stable, tandis que l'ADN est simple-brin et moins stable", correct: false },
        { text: "L'ADN utilise l'uracile, et l'ARN utilise la thymine", correct: false },
        { text: "L'ARN peut sortir du noyau cellulaire, tandis que l'ADN reste toujours à l'intérieur du noyau", correct: false }, // Slightly true but simplified
        { text: "L'ADN est capable de s'autorépliquer sans aide, tandis que l'ARN nécessite des enzymes spécifiques", correct: false },
        { text: "L'ADN participe directement à la synthèse des protéines, tandis que l'ARN joue un rôle indirect", correct: false },
    ]
},
{
    question: "Comment s'apparient les bases azotées de l'ADN ?",
    answers: [
        { text: "Les bases azotées de l'ADN s'apparient de manière spécifique : adénine (A) est toujours appariée avec thymine (T), et guanine (G) est toujours appariée avec cytosine (C)", correct: true },
        { text: "Adénine avec Guanine et Thymine avec Cytosine", correct: false },
        { text: "Adénine avec Cytosine et Guanine avec Thymine", correct: false },
        { text: "Les bases s'apparient de manière aléatoire pour favoriser la diversité génétique", correct: false },
        { text: "Adénine avec Uracile et Thymine avec Guanine, dans le cas de l'ADN viral", correct: false },
        { text: "Chaque base azotée s'apparie avec elle-même pour former une structure stable", correct: false },
        { text: "Les bases azotées ne s'apparient pas mais interagissent avec des protéines spécifiques", correct: false },
        { text: "L'appariement des bases dépend du type de cellule et peut changer avec le temps", correct: false },
    ]
},
{
    question: "Comment est généralement notée l'orientation de la molécule d'ADN ?",
    answers: [
        { text: "de 5' vers 3'", correct: true },
        { text: "de A vers Z", correct: false },
        { text: "de 3' vers 5'", correct: false },
        { text: "de gauche à droite", correct: false },
        { text: "de bas en haut", correct: false },
        { text: "selon le gradient de concentration", correct: false },
        { text: "de l'extérieur vers l'intérieur de la cellule", correct: false },
        { text: "de 5 vers 3 unités", correct: false },
    ]
},
{
    question: "Qu'est qui permet l'orientation de la molécule d'ADN ?",
    answers: [
        { text: "Chaque nucléotide est numéroté à partir de l'atome d'oxygène en position 5'", correct: true },
        { text: "La présence de liaisons hydrogène entre les bases", correct: false },
        { text: "La séquence spécifique des bases azotées", correct: false },
        { text: "L'interaction avec l'ARN messager", correct: false },
        { text: "Les modifications post-traductionnelles", correct: false },
        { text: "La concentration de ions dans le cytoplasme", correct: false },
        { text: "La polarité de la molécule d'eau", correct: false },
        { text: "L'activité enzymatique spécifique", correct: false },
    ]
},
{
    question: "Pourquoi dit-on que les brins de la molécule d'ADN sont antiparallèles ?",
    answers: [
        { text: "Le brin 5' → 3' est orienté dans le sens inverse du brin 3' → 5'.", correct: true },
        { text: "Ils se repoussent mutuellement en raison de charges similaires", correct: false },
        { text: "Ils s'alignent dans des directions opposées pour faciliter la réplication", correct: false },
        { text: "Cette orientation facilite la transcription en ARN", correct: false },
        { text: "Pour permettre un emballage plus dense dans le noyau", correct: false },
        { text: "Afin d'optimiser les interactions avec les protéines de liaison", correct: false },
        { text: "Pour augmenter la stabilité thermique de la molécule", correct: false },
        { text: "Cela permet une meilleure reconnaissance par les ribosomes", correct: false },
    ]
},
{
    question: "Qu'est-ce que la complémentarité des brins de la molécule d'ADN ?",
    answers: [
        { text: "L'adénine (A) est toujours appariée avec la thymine (T), et la guanine (G) est toujours appariée avec la cytosine (C).", correct: true },
        { text: "Chaque base s'apparie avec sa copie exacte pour former un brin double", correct: false },
        { text: "Les bases s'apparient de manière aléatoire, permettant diversité génétique", correct: false },
        { text: "L'appariement est régi par les lois de Mendel sur la ségrégation indépendante", correct: false },
        { text: "Les séquences complémentaires permettent la création de l'ARN double-brin", correct: false },
        { text: "Cette complémentarité est essentielle pour la synthèse des lipides", correct: false },
        { text: "Elle est déterminée par l'ordre des acides aminés dans les protéines", correct: false },
        { text: "L'appariement des bases est influencé par la température ambiante", correct: false },
    ]
},
	    {
        question: "Question 12 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 13 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 14 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 15 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 16 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 17 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 18 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 19 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 20 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 21 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 22 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 23 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 24 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 25 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 26 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 27 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 28 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 29 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
	    {
        question: "Question 30 ?",
        answers: [
            { text: "Bonne réponse", correct: true },
            { text: "Mauvaise réponse 1", correct: false },
            { text: "Mauvaise réponse 2", correct: false },
            { text: "Mauvaise réponse 3", correct: false },
            { text: "Mauvaise réponse 4", correct: false },
			{ text: "Mauvaise réponse 5", correct: false },
			{ text: "Mauvaise réponse 6", correct: false },
			{ text: "Mauvaise réponse 7", correct: false },
        ]
    },
];
