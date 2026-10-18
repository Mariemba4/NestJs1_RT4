# Avancement du TP NestJS

Ce document décrit ce qui est déjà présent dans le projet et donne les repères nécessaires pour continuer le TP.

## 1. Module commun et injection de `uuid` — exercice 3

`src/common/common.module.ts` fournit la fonction `v4` de la bibliothèque `uuid` sous le nom de token `UUID`.

- Un **provider** est une valeur ou une classe que NestJS peut injecter dans d’autres classes.
- Le nom `UUID` est le **token d’injection** utilisé pour retrouver ce provider.
- `@Global()` rend le module commun global : les modules qui l’importent dans l’application peuvent utiliser son provider sans importer `CommonModule` individuellement.
- `useValue: v4` fournit la fonction elle-même. Elle est appelée dans `TestService` pour générer un identifiant.

Le module `Test` montre cette injection : `GET /test` appelle `TestService.generateId()`, qui renvoie un UUID.

## 2. Entité Todo et statut — exercice 4

`src/todo/entities/todo.entity.ts` décrit les données d’un Todo enregistrées en base. `@Entity()` indique à TypeORM qu’il s’agit d’une entité persistée.

- `id` est généré par la base via `@PrimaryGeneratedColumn()`.
- `name` et `description` sont des colonnes ordinaires.
- `status` est une colonne enum ; sa valeur par défaut est `TODO`.
- `StatusEnum`, dans `src/todo/enums/status.enum.ts`, définit `TODO`, `IN_PROGRESS` et `DONE`.

## 3. Connexion TypeORM à MySQL — exercice 5

`TypeOrmModule.forRoot()` dans `src/app.module.ts` configure la connexion globale à MySQL : serveur local, port 3306, utilisateur `root`, base `todo_db` et entité `TodoEntity`.

Le mot de passe est lu depuis `DB_PASSWORD`. Si un fichier `.env` existe à la racine, l’application le charge avant de configurer TypeORM. `.env.example` est un modèle à copier en `.env` et à compléter avec le mot de passe local. Le vrai `.env` est ignoré par Git : ne pas le publier.

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

## 6. Création d’un Todo par l’API

`POST /todo` est déclaré dans `src/todo/todo.controller.ts`. Le contrôleur reçoit le corps JSON avec `@Body()`, typé comme `CreateTodoDto`, puis délègue au service.

`TodoService`, dans `src/todo/todo.service.ts`, reçoit le repository TypeORM de `TodoEntity` :

1. `repository.create(dto)` prépare une entité à partir des champs validés.
2. `repository.save(entity)` l’enregistre dans MySQL et renvoie l’entité créée.

Un **repository** est l’objet TypeORM qui fournit les opérations de lecture et d’écriture pour une entité. `Repository<TodoEntity>` signifie qu’il travaille avec les Todo.

`TodoModule` relie ces éléments avec `TypeOrmModule.forFeature([TodoEntity])`, le contrôleur et le service.

Exemple de corps pour `POST http://localhost:3000/todo` :

```json
{
  "name": "Réviser",
  "description": "Terminer les exercices du TP NestJS"
}
```

Le client n’envoie pas `id`, les dates ou le statut par défaut.

## 7. DTO de mise à jour

`src/todo/dto/update-todo.dto.ts` définit les champs possibles pour une mise à jour. Ils sont tous facultatifs. Si `name` ou `description` est fourni, les règles de longueur correspondantes continuent de s’appliquer. Si `status` est fourni, il doit appartenir à `StatusEnum`.

**À continuer :** `UpdateTodoDto` n’est pas encore relié à une route ou à une méthode de service. Les routes de lecture, mise à jour et suppression des Todo restent également à réaliser si elles sont demandées par la suite du TP.

## Pour démarrer le projet

1. Installer les dépendances avec `npm install`.
2. Créer `.env` à partir de `.env.example`, puis renseigner `DB_PASSWORD`.
3. Vérifier que MySQL fonctionne et que la base `todo_db` existe.
4. Démarrer l’API avec `npm run start:dev`.

Les tests sont configurés avec Vitest, mais ils n’ont pas été exécutés dans le cadre de cette passation.
