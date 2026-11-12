# TP NestJS — Exercice 1 : Simulation d'Authentification avec Middleware JWT

---

## A. Objectif de l'exercice

L'objectif de cet exercice est de mettre en place une **simulation d'authentification par token JWT** sur les opérations d'écriture et de suppression du module `Todo` existant, sans créer d'entité `User` complète pour le moment.

### Résultats attendus
1. Intercepter les requêtes HTTP ciblées via un middleware NestJS (`AuthMiddleware`).
2. Vérifier la présence et la validité d'un JWT passé dans le header personnalisé `auth-user`.
3. Extraire le champ `userId` contenu dans le payload du token et l'injecter dans l'objet `req` d'Express.
4. Lier chaque `Todo` à son créateur (`userId`) dans la base de données.
5. S'assurer que seul le créateur d'un `Todo` peut le modifier, le supprimer ou le restaurer (contrôle de propriété / *ownership*).
6. Laisser les routes de consultation (`GET`) et la création V1 non persistée libres d'accès.

---

## B. Architecture du fonctionnement

Le flux d'une requête protégée suit le cheminement suivant :

```
Client (Postman / Frontend)
   │
   │  Requête HTTP (ex: POST /v2/todo ou PATCH /todo/1)
   │  Header: auth-user: <jwt_token>
   ▼
[ AuthMiddleware ]
   │
   ├── 1. Header absent ? ─────────────► Erreur 401 JSON
   ├── 2. JWT_SECRET absent ? ─────────► Erreur 401 JSON
   ├── 3. verify() échoue ? ───────────► Erreur 401 JSON (token falsifié/expiré)
   ├── 4. Pas de userId dans payload ? ─► Erreur 401 JSON
   │
   │  Token valide : req.userId = payload.userId
   │  next()
   ▼
[ TodoController ]
   │  Récupère req.userId via @Req() req: AuthenticatedRequest
   │  Transmet les données et userId au service
   ▼
[ TodoService ]
   │  Exécute les opérations TypeORM en filtrant simultanément
   │  par { id, userId }
   ▼
[ Base de données MySQL ]
   Table `todo_entity` (colonnes: id, name, description, status, userId, createdAt, updatedAt, deletedAt)
```

---

## C. Fichiers créés et modifiés

| Fichier | Statut | Rôle et modifications |
|---|---|---|
| `src/common/interfaces/authenticated-request.interface.ts` | **Créé** | Étend l'interface `Request` d'Express pour ajouter la propriété optionnelle `userId?: string \| number`. |
| `src/common/middleware/auth.middleware.ts` | **Créé** | Middleware NestJS qui extrait `auth-user`, vérifie le JWT avec `verify()`, contrôle `userId` et l'injecte dans `req.userId`. |
| `src/common/middleware/auth.middleware.spec.ts` | **Créé** | Tests unitaires isolés pour tester les 4 cas du middleware (token manquant, invalide, sans userId, valide). |
| `src/todo/entities/todo.entity.ts` | **Modifié** | Ajout de la colonne `@Column({ nullable: true }) userId: string;` pour persister l'identifiant du propriétaire. |
| `src/todo/todo.module.ts` | **Modifié** | Implémentation de l'interface `NestModule` et configuration de `MiddlewareConsumer` pour protéger uniquement les routes d'écriture ciblées. |
| `src/todo/todo.controller.ts` | **Modifié** | Injection de `@Req() req: AuthenticatedRequest` sur `POST v2`, `PATCH :id`, `DELETE :id`, `DELETE soft/:id` et `PATCH restore/:id`, et passage de `req.userId` au service. |
| `src/todo/todo.service.ts` | **Modifié** | Association de `userId` à la création V2 et vérification simultanée de l'`id` et du `userId` dans les requêtes TypeORM pour toute modification/suppression. |
| `src/todo/todo.service.spec.ts` | **Créé** | Tests unitaires du service vérifiant l'enregistrement du créateur et le blocage des actions pour un utilisateur tiers. |
| `package.json` / `package-lock.json` | **Modifié** | Ajout des dépendances `jsonwebtoken` et `@types/jsonwebtoken`. |

---

## D. Explication technique des mécanismes

### 1. Le Middleware `AuthMiddleware`
Contrairement à un Guard qui intervient plus tard dans le cycle de vie NestJS, un Middleware s'exécute dès la réception de la requête HTTP Express brute.

```typescript
// src/common/middleware/auth.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface.js';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['auth-user'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Header auth-user manquant ou invalide',
        error: 'Unauthorized',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Clé secrète JWT non configurée',
        error: 'Unauthorized',
      });
    }

    try {
      const decoded = verify(authHeader, secret);
      // Contrôle de la présence de userId
      if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Token invalide ou userId manquant',
          error: 'Unauthorized',
        });
      }

      req.userId = decoded.userId;
      next(); // On passe au contrôleur
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Token JWT invalide ou expiré',
        error: 'Unauthorized',
      });
    }
  }
}
```

#### Différence essentielle : `verify()` vs `decode()`
- `decode()` : Lit simplement la charge utile en base64 **sans vérifier la signature**. N'importe qui pourrait modifier le `userId` dans le token sans être détecté.
- `verify()` : Décode le token **ET** recalcule la signature cryptographique à l'aide de la clé secrète. Si le token a été altéré ou s'il est expiré, une exception est immédiatement levée.

### 2. Typage TypeScript de `Request`
Par défaut, le type `Request` d'Express ne possède pas de champ `userId`. Pour éviter d'utiliser `any` ou d'ignorer TypeScript (`ts-ignore`), nous avons créé une interface dédiée :

```typescript
// src/common/interfaces/authenticated-request.interface.ts
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string | number;
}
```

### 3. Persistance du propriétaire dans `TodoEntity`
Un champ simple `userId` est ajouté à l'entité. Grâce à `synchronize: true` dans TypeORM, la colonne est automatiquement ajoutée dans MySQL lors du démarrage :

```typescript
// src/todo/entities/todo.entity.ts
@Column({ nullable: true })
userId: string;
```

### 4. Enregistrement du middleware dans `TodoModule`
L'enregistrement se fait avec `NestModule` et la méthode `configure()` :

```typescript
// src/todo/todo.module.ts
export class TodoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'v2/todo', method: RequestMethod.POST },
        { path: 'todo/:id', method: RequestMethod.PATCH },
        { path: 'todo/:id', method: RequestMethod.DELETE },
        { path: 'todo/soft/:id', method: RequestMethod.DELETE },
        { path: 'todo/restore/:id', method: RequestMethod.PATCH },
      );
  }
}
```
> **Attention au Versioning NestJS :** Le projet utilise `VersioningType.URI` dans `main.ts`. Les routes décorées avec `@Version('2')` reçoivent le préfixe d'URL `/v2/`. C'est pourquoi le chemin configuré est `'v2/todo'` pour le POST V2, alors que le contrôleur V1 (`POST /v1/todo`) reste libre d'accès.

### 5. Contrôle d'accès et d'ownership dans `TodoService`
Pour empêcher qu'un utilisateur modifie le Todo d'un autre en devinant simplement son ID, les requêtes TypeORM vérifient **à la fois `id` et `userId`** :

```typescript
// Exemple pour la suppression définitive :
async deleteTodo(id: number, userId: string | number): Promise<DeleteResult> {
  const result = await this.todoRepository.delete({
    id,
    userId: String(userId),
  });

  if (result.affected === 0) {
    throw new NotFoundException(
      `Todo avec l'id ${id} introuvable ou vous n'en êtes pas le propriétaire`,
    );
  }
  return result;
}
```
Le même contrôle strict s'applique à :
- `updateTodo` (recherche préalable avec `{ id, userId: String(userId) }`).
- `softdeleteTodo` (soft-delete avec la condition `{ id, userId }`).
- `restoreTodo` (recherche avec `withDeleted: true` et `{ id, userId }`).

---

## E. Tests et validation

Les tests ont été exécutés avec **Vitest** (`npx vitest run`) :

### 1. Tests validés avec succès (12 tests passés)
- `src/common/middleware/auth.middleware.spec.ts` (4 tests) :
  - Rejet si le header `auth-user` est absent (401).
  - Rejet si le token est falsifié ou invalide (401).
  - Rejet si le payload ne contient pas `userId` (401).
  - Validation et injection de `req.userId` lorsque le token est valide.
- `src/todo/todo.service.spec.ts` (7 tests) :
  - Création V2 persistant le `userId`.
  - Modification, suppression, soft-delete et restauration autorisées pour le propriétaire.
  - Refus (NotFoundException) pour un utilisateur non propriétaire.
- `src/app.controller.spec.ts` (1 test) : Test d'origine de l'application.

### 2. Tests préexistants en échec
- `src/test/test.controller.spec.ts` et `src/test/test.service.spec.ts` échouent.
- **Cause :** Ces fichiers proviennent d'un module d'exemple `test/` généré automatiquement au début du projet et ne disposent pas des mocks nécessaires pour le provider `UUID` et `TestService`. Ils n'ont pas de lien avec notre module `Todo`.

---

## F. Guide de configuration et test avec Postman

### 1. Configuration de l'environnement
Dans le fichier `.env` situé à la racine du projet (créez-le s'il n'existe pas) :

```env
DB_PASSWORD=votre_mot_de_passe_mysql
JWT_SECRET=ma_cle_secrete_super_securisee_123456
```

### 2. Générer un token de test
Vous pouvez utiliser le site [jwt.io](https://jwt.io) ou exécuter une ligne Node.js dans un terminal :

```bash
node -e "console.log(require('jsonwebtoken').sign({ userId: 'user-1' }, 'ma_cle_secrete_super_securisee_123456'))"
```

### 3. Utilisation dans Postman

#### Requête 1 : Créer un Todo en V2 (Protégé)
- **Méthode** : `POST`
- **URL** : `http://localhost:3000/v2/todo`
- **Headers** :
  - `Content-Type`: `application/json`
  - `auth-user`: `<VOTRE_TOKEN_JWT>`
- **Body (JSON)** :
  ```json
  {
    "name": "TP NestJS",
    "description": "Terminer l'exercice 1 et tester avec Postman"
  }
  ```
- **Résultat attendu** : HTTP 201 avec le todo retourné contenant `"userId": "user-1"`.

#### Requête 2 : Tester le rejet (Header manquant)
- Répéter la requête ci-dessus en désactivant le header `auth-user`.
- **Résultat attendu** : HTTP 401 `{"statusCode": 401, "message": "Header auth-user manquant ou invalide", "error": "Unauthorized"}`.

#### Requête 3 : Modifier le Todo (Protégé)
- **Méthode** : `PATCH`
- **URL** : `http://localhost:3000/todo/1`
- **Headers** :
  - `auth-user`: `<TOKEN_DE_USER_1>` (Succès 200)
  - `auth-user`: `<TOKEN_DE_USER_2>` (Erreur 404 : Todo introuvable ou non propriétaire).

---

## G. Comment reprendre le projet pour les exercices suivants

Si vous devez implémenter les prochains exercices (ex: Exercice 2 avec Passport et JWT officiel) :

1. **Ne pas casser les imports ESM** : Le projet compile avec TypeScript sous le mode `nodenext`. Tous les imports relatifs de fichiers locaux doivent obligatoirement se terminer par `.js` (ex: `import { TodoEntity } from './entities/todo.entity.js';`).
2. **Ne pas supprimer V1** : La version non persistée `POST /v1/todo` est requise pour l'évaluation du TP initial.
3. **Transition vers Passport / Guards** :
   - Lorsque vous implémenterez un vrai `AuthGuard` NestJS (`@UseGuards(JwtAuthGuard)`), ce middleware `AuthMiddleware` pourra soit être retiré de `TodoModule.configure()`, soit conservé temporairement.
   - Le champ `userId` ajouté sur `TodoEntity` est déjà prêt et pourra être réutilisé pour lier les todos à la future entité `UserEntity`.

---

## H. Limites de cette première implémentation

- **Simulation sans base User** : L'existence réelle de l'utilisateur n'est pas vérifiée en base de données, seul le token cryptographique fait foi.
- **Header non conventionnel** : Nous utilisons `auth-user: <token>` selon la consigne de l'exercice au lieu du standard HTTP `Authorization: Bearer <token>`.
- **Pas de Guards NestJS** : L'authentification repose sur un middleware Express. Dans un projet NestJS de production, on préfère généralement les `Guards` (`CanActivate`) et `Passport` qui s'intègrent mieux avec les décorateurs de métadonnées (`@UseGuards()`, `@Public()`, etc.).

