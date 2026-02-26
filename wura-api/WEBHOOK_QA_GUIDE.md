# Guide de Test Manuel Kkiapay (Webhook en Local)

En tant que QA, voici comment simuler vous-même un appel de Kkiapay sur votre serveur local NestJS pour vérifier que la base de données réagit correctement, comme dans le monde réel.

### Prérequis
1. Votre serveur NestJS tourne (`npm run start:dev`) sur `http://localhost:3000`
2. Vous avez au moins une transaction avec le statut `INITIATED` dans votre base Supabase, et vous connaissez son `referenceId` (ex: `TX-WURA-C8B9`).

---

### Étape 1 : Obtenir un "Vrai Faux" Transaction Kkiapay

Notre backend refuse les requêtes forgées de A à Z par sécurité. Il va vraiment vérifier sur les serveurs Kkiapay. Vous devez donc créer une **vraie fausse transaction** via le widget Kkiapay Sandbox ou en utiliser une existante depuis votre Dashboard Kkiapay (Sandbox).
- Notez le `transactionId` fourni par Kkiapay (ex: `tRx_iN_SAndBoX_123`).

### Étape 2 : Lancer la requête de Simulation (cURL)
Ouvrez votre terminal et exécutez cette commande. Elle simule le fait que les serveurs Kkiapay tapent sur la route `/webhooks/kkiapay` de votre serveur Wura.

```bash
curl -X POST http://localhost:3000/webhooks/kkiapay \
     -H "Content-Type: application/json" \
     -d '{
           "transactionId": "REMPLACEZ_PAR_VOTRE_TRANSACTION_ID_KKIAPAY",
           "is_trx_success": true
         }'
```

### Étape 3 : Que va-t-il se passer dans vos logs NestJS ?

Votre console NestJS locale va afficher :
```
[KkiapayController] Webhook Kkiapay reçu : {"transactionId":"...","is_trx_success":true}
[KkiapayService] Vérification stricte de la transaction Kkiapay ...
```
- Puis le serveur va interroger l'API officielle Kkiapay en tâche de fond.

**Si votre clé `KKIAPAY_PRIVATE_KEY` est bone, et que le paiement est validé chez eux :**
```
[KkiapayService] ✅ Transaction Wura [TX-WURA-C8B9] mise à jour avec succès (PAYIN_SUCCESS). L'argent est sécurisé.
```

### Étape 4 : Vérification Finale (Supabase)
Allez dans votre interface Supabase > Table Editor > `transactions`.
- Localisez votre transaction (`TX-WURA-C8B9`)
- Son `status` doit être passé de `INITIATED` à `PAYIN_SUCCESS` (ou `PAYIN_FAILED`).
- Son `amountFiatIn` s'est mis à jour avec la valeur *réelle* reçue de Kkiapay.
- Son `kkiapayId` a été renseigné.
