# Avancement du TP NestJS

Ce document décrit ce qui est déjà présent dans le projet et donne les repères nécessaires pour continuer le TP.

## 1. Module commun et injection de `uuid` — exercice 3

`src/common/common.module.ts` fournit la fonction `v4` de la bibliothèque `uuid` sous le nom de token `UUID`.

- Un **provider** est une valeur ou une classe que NestJS peut injecter dans d’autres classes.
- Le nom `UUID` est le **token d’injection** utilisé pour retrouver ce provider.
- `@Global()` rend le module commun global : les modules de l’application peuvent utiliser son provider sans importer `CommonModule` individuellement.
- `useValue: v4` fournit la fonction elle-même. Elle est appelée dans `TestService` pour générer un identifiant.

Le module `Test` montre cette injection : `GET /test` appelle `TestService.generateId()`, qui renvoie un UUID.

## 2. Entité Todo et statut — exercice 4

`src/todo/entities/todo.entity.ts` décrit les données d’un Todo enregistrées en base. `@Entity()` indique à TypeORM qu’il s’agit d’une entité persistée.

- `id` est généré par la base via `@PrimaryGeneratedColumn()`.
- `name` et `description` sont des colonnes ordinaires.
- `status` est une colonne enum ; sa valeur par défaut est `TODO`.
- `StatusEnum`, dans `src/todo/enums/status.enum.ts`, définit `TODO`, `IN_PROGRESS` et `DONE`.

## 3. Connexion TypeORM à MySQL — exercice 5

`TypeOrmModule.forRoot()` dans `src/app.module.ts` configure la connexion à MySQL : serveur local, port 3306, utilisateur `root`, base `todo_db` et entité `TodoEntity`.

Le mot de passe est lu depuis `DB_PASSWORD`. Si un fichier `.env` existe à la racine, l’application le charge avant de configurer TypeORM. `.env.example` est un modèle à copier en `.env` et à compléter avec le mot de passe local. Le vrai `.env` doit être ignoré par Git : il ne faut pas le publier.

`synchronize: true` demande à TypeORM d’adapter automatiquement le schéma de la base aux entités au démarrage. C’est pratique pour le TP, mais à éviter en production.

## 4. Champs de date réutilisables

`src/common/entities/timestamped.entity.ts` contient la classe abstraite `TimestampedEntity`. Elle regroupe les dates communes que les entités peuvent hériter :

- `createdAt` utilise `@CreateDateColumn({ update: false })` : TypeORM la renseigne à la création et ne la met pas à jour ensuite. `readonly` empêche également sa réassignation dans le code TypeScript.
- `updatedAt` utilise `@UpdateDateColumn()` : TypeORM la met à jour lors des mises à jour de l’entité.
- `deletedAt` utilise `@DeleteDateColumn()` : TypeORM la renseigne lors d’une suppression logique avec `softDelete()` ou `softRemove()`. Une suppression ordinaire ne l’utilise pas.

Une **classe abstraite** sert de base à d’autres classes, sans être instanciée directement. `TodoEntity extends TimestampedEntity` hérite de ces colonnes. Une autre entité pourra hériter de la même classe pour réutiliser les dates.

## 5. Validation des données de création

`src/todo/dto/create-todo.dto.ts` définit les champs acceptés lors d’une création :

- `name` est obligatoire, doit être une chaîne de 3 à 10 caractères.
- `description` est obligatoire, doit être une chaîne d’au moins 10 caractères.

Un **DTO** (*Data Transfer Object*) décrit la forme des données échangées avec l’API. Les décorateurs de `class-validator` posent les règles de validation. Les messages personnalisés sont centralisés dans `src/common/validation-messages.ts` pour être réutilisables.

Le `ValidationPipe` global de `src/main.ts` applique ces règles aux requêtes. `whitelist: true` active le filtrage des champs inconnus et `forbidNonWhitelisted: true` fait rejeter une requête qui en contient.

## 6. Création d’un Todo — version 1

La route `POST /todo` est déclarée dans `src/todo/todo.controller.ts`. Le contrôleur reçoit le corps JSON avec `@Body()`, typé comme `CreateTodoDto`, puis délègue au service.

Dans `src/todo/todo.service.ts`, la méthode `create()` utilise le repository TypeORM de `TodoEntity` :

1. `repository.create(dto)` prépare une entité à partir des données reçues.
2. `repository.save(entity)` enregistre l’entité dans MySQL et renvoie l’entité créée.

Un **repository** est l’objet TypeORM qui fournit les opérations de lecture et d’écriture pour une entité. `Repository<TodoEntity>` signifie qu’il travaille avec les Todo.

`TodoModule` relie ces éléments avec `TypeOrmModule.forFeature([TodoEntity])`, le contrôleur et le service.

Exemple de corps JSON pour `POST http://localhost:3000/todo` :

```json
{
  "name": "Réviser",
  "description": "Terminer les exercices du TP NestJS"
}
```

Le client n’envoie pas `id` ni les dates générées automatiquement. Le statut utilise sa valeur par défaut si aucune autre valeur n’est définie par l’application.

## 7. Ajout d’un Todo — version 2, exercice 9

Une deuxième méthode, `addTodo()`, a été ajoutée dans `src/todo/todo.service.ts`, avec une route dédiée dans `src/todo/todo.controller.ts`.

Cette version utilise également le repository TypeORM :

```ts
addTodo(createTodoDto: CreateTodoDto): Promise<TodoEntity> {
  return this.todoRepository.save(
    this.todoRepository.create(createTodoDto),
  );
}
```

Le fonctionnement est similaire à celui de `create()`, mais les deux méthodes sont conservées pour présenter les deux versions demandées dans le TP.

La route correspondante est `POST /todo/add`.

Exemple de corps JSON :

```json
{
  "name": "Réviser",
  "description": "Terminer les exercices du TP NestJS"
}
```

Le contrôleur reçoit les données validées et appelle `this.todoService.addTodo(createTodoDto)`. Le service prépare ensuite l’entité et l’enregistre dans la base.

**Différence entre les deux versions :** `create()` stocke d’abord l’entité dans une variable avant de la sauvegarder. `addTodo()` enchaîne directement les deux opérations. Les deux utilisent `create()` et `save()` du repository TypeORM.

## 8. DTO de mise à jour

`src/todo/dto/update-todo.dto.ts` définit les champs possibles pour une mise à jour. Ils sont tous facultatifs.

- Si `name` est fourni, il doit être une chaîne de 3 à 10 caractères.
- Si `description` est fourni, il doit être une chaîne d’au moins 10 caractères.
- Si `status` est fourni, il doit appartenir à `StatusEnum`.

`@IsOptional()` permet de ne pas envoyer tous les champs à chaque mise à jour. Les validations continuent de s’appliquer aux champs effectivement fournis.

## 9. Mise à jour d’un Todo par son identifiant — exercice 10

La méthode `updateTodo()` a été ajoutée dans `src/todo/todo.service.ts`. Elle permet de modifier un Todo déjà enregistré en base.

Son fonctionnement est le suivant :

1. Elle reçoit l’identifiant du Todo et les données de mise à jour (`UpdateTodoDto`).
2. `findOne({ where: { id } })` recherche le Todo correspondant dans la base.
3. Si le Todo n’existe pas, le service renvoie une erreur `NotFoundException`, qui correspond à une réponse HTTP 404.
4. `Object.assign(todo, updateTodoDto)` applique les champs reçus à l’entité existante.
5. `repository.save(todo)` enregistre les changements dans la base.

La route ajoutée au contrôleur est `PATCH /todo/:id`. Le décorateur `@Param('id')` récupère l’identifiant depuis l’URL, tandis que `@Body()` récupère les données à modifier.

Exemple de requête :

`PATCH http://localhost:3000/todo/1`

Corps JSON :

```json
{
  "status": "DONE"
}
```

L’identifiant `1` est uniquement un exemple : il faut utiliser l’identifiant réel d’un Todo existant. La valeur `DONE` doit correspondre à une valeur définie dans `StatusEnum`.

Il est également possible de modifier uniquement le nom ou la description, ou plusieurs champs en même temps, à condition de respecter les validations du DTO.

La route `PATCH` est adaptée à une mise à jour partielle : les champs non envoyés restent inchangés.

## 10. Récapitulatif des routes

| Méthode HTTP | Route | Fonction |
|---|---|---|
| `GET` | `/test` | Générer un UUID |
| `POST` | `/todo` | Créer un Todo — version 1 |
| `POST` | `/todo/add` | Ajouter un Todo — version 2 |
| `PATCH` | `/todo/:id` | Mettre à jour un Todo existant |

Les deux versions de création sont conservées pour répondre à la demande du TP. La route de mise à jour utilise `UpdateTodoDto` et recherche d’abord l’entité existante.

## 11. Avancement de Yasmine — exercice 13 : statistiques par statut

La méthode `getStats()` a été ajoutée dans `src/todo/todo.service.ts`. Elle utilise le repository TypeORM pour compter les todos par statut en une seule requête SQL :



- `createQueryBuilder('todo')` prépare la requête avec l'alias `todo`.
- `select()` sélectionne le statut et `COUNT(todo.id)` compte les tâches de chaque groupe.
- `groupBy()` regroupe les tâches ayant le même statut.
- `getRawMany()` exécute la requête et renvoie les résultats bruts, sans construire des entités.

Dans `src/todo/todo.controller.ts`, `@Get('stats')` délègue à cette méthode.

Exemple de réponse :

```json
[
  { "status": "TODO", "count": "3" },
  { "status": "DONE", "count": "1" }
]
```

Dans cette implémentation, un statut sans tâche est absent du résultat, et une base sans tâche renvoie `[]`. MySQL peut renvoyer les compteurs sous forme de chaînes. Pour afficher systématiquement les trois statuts, il resterait à compléter les groupes absents avec zéro.


## 12. exercice 14 : récupérer tous les todos

La méthode `getAll()` dans le service utilise :

```ts
async getAll() {
  return this.todoRepository.find();
}
```

Le contrôleur expose cette opération avec `@Get()` sous le préfixe `todo` et appelle `this.todoService.getAll()`.
La réponse est un tableau des tâches, ou `[]` si aucune tâche n'est présente.

À expliquer à l'oral : « Le contrôleur reçoit la requête GET, puis le service utilise find() pour récupérer les todos dans MySQL. »

## 13. — exercice 15 : récupérer un todo par identifiant

Le contrôleur déclare `@Get(':id')` et récupère l'identifiant avec `@Param('id', ParseIntPipe)`. Ce pipe convertit le paramètre en entier et rejette un identifiant incorrect avec une erreur HTTP 400.

La méthode `getById(id)` du service effectue la recherche :


Si la tâche existe, elle est renvoyée. Sinon, `NotFoundException` produit une réponse HTTP 404.
La route fixe `stats` est déclarée avant `:id` pour éviter que le mot `stats` soit interprété comme un identifiant.



Pour tester les statistiques, créer des tâches avec `POST /v2/todo`, puis vérifier que le compteur `TODO` augmente. Pour la recherche par identifiant, utiliser l'identifiant renvoyé lors de la création et tester aussi un identifiant absent.
Les résultats des tests HTTP sur cette version ne sont pas consignés ici ; les étapes ci-dessus constituent les vérifications à effectuer.

## Pour démarrer et vérifier le projet

1. Installer les dépendances avec `npm install`.
2. Créer `.env` à partir de `.env.example`, puis renseigner `DB_PASSWORD` avec le mot de passe configuré pour MySQL.
3. Vérifier que le conteneur MySQL fonctionne et que la base `todo_db` existe.
4. Lancer `npm run build` pour vérifier la compilation TypeScript.
5. Démarrer l’API avec `npm run start:dev` lorsque la connexion à MySQL est configurée.
6. Tester les routes avec un client HTTP, par exemple Postman.

Les imports relatifs utilisent l’extension `.js` dans ce projet parce que `package.json` configure `"type": "module"` et que TypeScript utilise `"module": "nodenext"`. Le build a réussi après le rétablissement de ces extensions.

**État des vérifications :** la compilation a réussi. La connexion à MySQL a auparavant renvoyé `ER_ACCESS_DENIED_ERROR` parce que l’application utilisait un mot de passe vide. Il reste à configurer le mot de passe et à tester les routes avec la base de données. Les tests Vitest n’ont pas été exécutés dans le cadre de cette passation.

## TP2 — Seed de la base de données (pages 5 à 9)

Le script `src/commands/cv.seeder.ts` remplit la base avec des données fictives pour les entités User, Skill et CV. Il utilise `@ngneat/falso` pour générer des noms, prénoms, métiers et âges. Une graine fixe (`nestjs-tp2-cv-seed-v1`) rend ces valeurs aléatoires reproductibles.

Le seed démarre Nest sans serveur HTTP avec `NestFactory.createApplicationContext(AppModule)`, puis récupère `UserService`, `SkillService` et `CvService` via `app.get()`. Il réutilise ainsi les services et repositories déjà configurés par les modules, au lieu d’écrire directement du SQL.

Le script crée ou réutilise cinq utilisateurs, huit compétences et jusqu’à douze CV. L’ordre est important : les utilisateurs et compétences sont créés avant les CV, car un CV référence un utilisateur par `userId` et des compétences par `skillIds`. Les CIN et e-mails de seed utilisent des valeurs déterministes et uniques. Avant chaque insertion, le script vérifie si cet enregistrement existe déjà ; il peut donc être relancé sans recréer ces mêmes données.

Les CV générés utilisent des chemins fictifs sous `/seed/cvs/` ; aucun fichier PDF n’est créé. Le mot de passe enregistré pour les comptes de seed est un texte factice réservé aux données locales et ne doit pas servir à se connecter à un vrai compte.

Enfin, le script appelle `app.close()` dans un bloc `finally` pour fermer la connexion même si une insertion échoue. Le projet étant en ESM avec TypeScript `NodeNext`, la commande `seed:cvs` compile d’abord le projet puis exécute le fichier JavaScript généré. Il faut utiliser la version Node 24 déjà nécessaire au CLI Nest :

```bash
nvm use 24
npm run seed:cvs
```

À expliquer à l’oral : « Le seed est une petite application Nest autonome. Le conteneur d’injection nous donne les services existants ; on crée d’abord les entités référencées, puis les CV, et on ferme le contexte à la fin. »

La compilation a été vérifiée avec Node 24.22.0. L’exécution contre MySQL doit être faite avec la base `todo_db` en marche et le `DB_PASSWORD` local correctement configuré.

Pour ESM, les propriétés de relations des entités utilisent le type `Relation<T>` de TypeORM. Cela évite que les métadonnées TypeScript évaluent trop tôt les entités mutuellement liées pendant leur chargement. Le middleware d'authentification importe également `jsonwebtoken` comme export par défaut (`jwt.verify`), afin d'être compatible avec l'import ESM du paquet CommonJS.

**Vérification d'exécution :** avec Node 24.22.0, `npm run seed:cvs` a créé 5 utilisateurs, 8 compétences et 12 CV. Une seconde exécution a reconnu les données existantes et n'a créé aucun nouveau CV.
