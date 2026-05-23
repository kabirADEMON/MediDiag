Analyse descriptive du jeu de données

Le jeu de données utilisé dans le cadre de cette étude comporte un total de 1000 observations réparties sur 17 variables. Chaque observation représente une maladie accompagnée d’informations démographiques, de symptômes cliniques ainsi que d’examens biologiques et de leurs résultats attendus.

Le dataset est composé de variables numériques et qualitatives. Les variables numériques sont : N°, Age_Min, Age_Max et Age_Typique. Les autres variables sont de type qualitatif et concernent notamment le nom de la maladie, le sexe prédominant, les différents symptômes, les analyses biologiques et les résultats attendus.

L’analyse de la qualité des données montre qu’aucune valeur manquante n’est présente dans le dataset. En effet, chacune des 17 variables contient exactement 1000 valeurs non nulles, ce qui garantit une bonne cohérence des données et facilite leur exploitation dans les traitements statistiques et les modèles d’intelligence artificielle.

Concernant les variables numériques, la variable Age_Min présente une valeur minimale de 0 an et une valeur maximale de 62 ans, avec une moyenne de 19,60 ans et un écart-type de 8,31. Cela indique que certaines maladies peuvent apparaître dès la naissance ou durant l’enfance.

La variable Age_Max possède une moyenne de 79,53 ans, avec des valeurs comprises entre 73 ans et 100 ans. Cette distribution montre que plusieurs maladies du dataset concernent également les personnes âgées.

Pour la variable Age_Typique, la moyenne observée est de 49,28 ans avec une valeur minimale de 45 ans et une valeur maximale de 81 ans. Cela suggère que les maladies représentées dans le dataset touchent majoritairement les adultes d’âge moyen.

L’analyse des variables qualitatives montre que le dataset contient 601 maladies distinctes. La maladie la plus fréquente est « Leptospirose (Chronique) », présente à 4 reprises dans le jeu de données. Cette diversité importante des maladies constitue un avantage considérable pour la mise en place d’un système d’aide au diagnostic médical.

La variable Sexe_Predominant contient trois catégories : masculin, féminin et les deux sexes (« Both »). La catégorie « Both » est largement dominante avec 951 occurrences, ce qui montre que la majorité des maladies présentes dans le dataset peuvent affecter aussi bien les hommes que les femmes.

Le dataset contient également neuf variables représentant les symptômes associés aux maladies. Le nombre de symptômes distincts varie entre 97 et 104 selon les colonnes. Parmi les symptômes les plus fréquents figurent notamment : l’ictère cutanéo-muqueux, la fièvre modérée, l’hémoptysie, les nausées et vomissements, la tachycardie, la fatigue chronique, la fatigue intense et la dysphagie. Cette diversité symptomatique enrichit considérablement la capacité du système à établir des correspondances précises entre les symptômes et les maladies.

Les variables Analyses_biologiques_et_examens et Résultats_attendus comportent chacune 106 valeurs distinctes. Les examens biologiques les plus fréquents concernent principalement les analyses sanguines, les tests diagnostiques rapides et certains examens microbiologiques. L’examen le plus représenté dans le dataset est le frottis sanguin épais et mince associé au test de diagnostic rapide.

En conclusion, l’analyse descriptive montre que le jeu de données présente une structure cohérente, complète et riche en informations médicales. L’absence de valeurs manquantes, la diversité des maladies, la richesse des symptômes ainsi que la présence des analyses biologiques rendent ce dataset particulièrement adapté au développement d’un système intelligent d’aide au diagnostic médical basé sur l’intelligence artificielle.