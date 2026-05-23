# Règles de Gestion

## 1. Authentification et sécurité des comptes

RG01 – Tout accès au système nécessite une authentification par adresse e-mail et mot de passe.

RG02 – L'adresse e-mail est unique dans le système ; aucun doublon n'est toléré.

RG03 – Le mot de passe doit comporter au minimum six (6) caractères.

RG04 – Les mots de passe sont stockés sous forme de hachage bcrypt ; aucun mot de passe en clair n'est conservé en base de données.

RG05 – Un compte désactivé ne peut pas se connecter au système.

RG06 – Toute modification du profil utilisateur (nom, prénom, spécialité) requiert la saisie du mot de passe courant pour validation.

---

## 2. Gestion des rôles et habilitations

RG07 – Le système reconnaît trois (3) rôles : Médecin, Infirmier(e) et Administrateur.

RG08 – Seul l'administrateur peut créer, activer, désactiver ou supprimer un compte utilisateur.

RG09 – Un administrateur ne peut pas supprimer son propre compte.

RG10 – Seuls le médecin et l'administrateur peuvent supprimer un dossier patient.

RG11 – L'infirmier(e) est le seul rôle habilité à saisir les constantes vitales d'un patient.

---

## 3. Gestion des patients

RG12 – L'enregistrement d'un patient requiert obligatoirement : le nom, le prénom, la date de naissance et le sexe.

RG13 – Un code patient unique est généré automatiquement à la création, selon le format PAT-AAAAMMJJ-XXXX ; ce code est immuable.

RG14 – Le sexe ne peut prendre que les valeurs M (Masculin) ou F (Féminin).

RG15 – Le numéro de téléphone doit être saisi au format international E.164 (exemple : +2250102030405).

RG16 – La liste des patients est paginée avec un maximum de cent (100) enregistrements par page, et supporte la recherche par nom, prénom, e-mail ou code patient.

---

## 4. Moteur de diagnostic IA

RG17 – Le moteur de diagnostic s'appuie sur une base de référence de mille (1 000) maladies.

RG18 – Le moteur filtre d'abord les maladies selon l'âge et le sexe du patient. Si l'âge est inconnu (valeur 0), le filtre sur l'âge est désactivé.

RG19 – Le score de correspondance d'une maladie est calculé selon la pondération suivante : symptômes 70 %, compatibilité d'âge 10 %, compatibilité de sexe 5 %, analyses biologiques 15 %.

RG20 – Si un symptôme clé obligatoire d'une maladie (IDF > 4,5) est absent chez le patient, le score de cette maladie est multiplié par 0,1 (malus de 90 %).

RG21 – Des scores cliniques validés (Alvarado, Wells TVP, Wells EP, Mac Isaac) peuvent augmenter le score final d'une maladie cible d'un bonus allant de +7 à +20 points.

RG22 – Le score final est plafonné à cent (100) points.

RG23 – Dans le top 4 affiché, une seule variante par racine pathologique est conservée (règle d'anti-ancrage). Les variantes (Aiguë, Sévère, Chronique…) sont regroupées sous la maladie principale.

RG24 – Si le score du premier résultat est inférieur à 1,0, le diagnostic est jugé non fiable et aucun résultat n'est retourné.

---

## 5. Constantes vitales et feedback

RG25 – Les constantes vitales enregistrées sont : la température, la pression artérielle, le pouls, la saturation en oxygène (SpO2), le poids et la taille.

RG26 – Après présentation du diagnostic IA, le médecin peut valider ou corriger le diagnostic proposé. Le retour est enregistré et sert à l'amélioration continue du modèle.
