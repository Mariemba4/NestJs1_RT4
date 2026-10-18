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

## Pour démarrer et vérifier le projet

1. Installer les dépendances avec `npm install`.
2. Créer `.env` à partir de `.env.example`, puis renseigner `DB_PASSWORD` avec le mot de passe configuré pour MySQL.
3. Vérifier que le conteneur MySQL fonctionne et que la base `todo_db` existe.
4. Lancer `npm run build` pour vérifier la compilation TypeScript.
5. Démarrer l’API avec `npm run start:dev` lorsque la connexion à MySQL est configurée.
6. Tester les routes avec un client HTTP, par exemple Postman.

Les imports relatifs utilisent l’extension `.js` dans ce projet parce que `package.json` configure `"type": "module"` et que TypeScript utilise `"module": "nodenext"`. Le build a réussi après le rétablissement de ces extensions.

**État des vérifications :** la compilation a réussi. La connexion à MySQL a auparavant renvoyé `ER_ACCESS_DENIED_ERROR` parce que l’application utilisait un mot de passe vide. Il reste à configurer le mot de passe et à tester les routes avec la base de données. Les tests Vitest n’ont pas été exécutés dans le cadre de cette passation.
