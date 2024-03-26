const quizData = [
    {
        question: "Que signifie l'abréviation ADN ?",
        answers: [
            { text: "Acide DésoxyriboNucléique", correct: true },
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
        question: "Comment se nomment les quatre bases azotées ?",
        answers: [
            { text: "Adénine, Thymine, Guanine, Cytosine", correct: true },
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
        question: "Qu'est-ce qu'un nucléotide ?",
        answers: [
            { text: "Un nucléotide est la sous-unité de la molécule d'ADN", correct: true },
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
        question: "De quoi est composé un nucléotide ?",
        answers: [
            { text: "Il est composé d'une base azotée, d'un sucre (ribose ou désoxyribose) et d'un groupement phosphate", correct: true },
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
        question: "Qu'est-ce qu'une séquence d'ADN ?",
        answers: [
            { text: "Une suite ordonnée de nucléotides sur un brin d'ADN", correct: true },
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
        question: "Quelles sont les trois différences entre l'ARN et l'ADN ?",
        answers: [
            { text: "Les trois différences entre l'ARN et l'ADN sont : l'ARN est simple brin, l'ARN a des fonctions au-delà du stockage d'informations, et l'uracile remplace la thymine dans l'ARN", correct: true },
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
        question: "Comment s'apparient les bases azotées de l'ADN ?",
        answers: [
            { text: "Les bases azotées de l'ADN s'apparient de manière spécifique : adénine (A) est toujours appariée avec thymine (T), et guanine (G) est toujours appariée avec cytosine (C)", correct: true },
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
        question: "Comment est généralement notée l'orientation de la molécule d'ADN ?",
        answers: [
            { text: "de 5' vers 3'", correct: true },
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
        question: "Qu'est qui permet l'orientation de la molécule d'ADN ?",
        answers: [
            { text: "Chaque nucléotide est numéroté à partir de l'atome d'oxygène en position 5'", correct: true },
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
        question: "Pourquoi dit-on que les brins de la molécule d'ADN sont antiparallèles ?",
        answers: [
            { text: "Le brin 5' → 3' est orienté dans le sens inverse du brin 3' → 5'.", correct: true },
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
        question: "Qu'est-ce que la complémentarité des brins de la molécule d'ADN ?",
        answers: [
            { text: "L'adénine (A) est toujours appariée avec la thymine (T), et la guanine (G) est toujours appariée avec la cytosine (C).", correct: true },
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
