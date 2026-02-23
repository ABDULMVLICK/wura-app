# Architecture Backend WURA (Remittance FinTech)

## 1. Vision et Stratégie
Wura est une application de transfert d'argent (Remittance) permettant d'envoyer des devises depuis l'Afrique de l'Ouest (Bénin, Togo, CI, Sénégal) vers l'Europe (SEPA) en utilisant la blockchain (Polygon/USDT) comme pont invisible pour éviter les lourdeurs des réseaux bancaires traditionnels (Swift) et maximiser la rentabilité.

Le "Hack" légal repose sur l'absence de manipulation directe d'Euros par Wura. L'application génère un wallet HD non-custodial pour le receveur via **Web3Auth**. Wura livre des USDT sur ce wallet. Le receveur vend lui-même ses USDT via un widget B2C off-ramp (Mt Pelerin / Ramp Network) qui exécute le virement SEPA final.

## 2. Stack Technique Backend
- **Framework :** Node.js avec NestJS (Typage fort, architecture modulaire, injection de dépendances).
- **Base de Données :** PostgreSQL avec Prisma ORM (Garantie ACID essentielle pour la FinTech, transactions fiables).
- **Blockchain RPC :** Alchemy ou Infura (Polygon Network).
- **Auth Mobile :** Firebase Auth (OTP & Google Sign-In) + Web3Auth (Génération de clés privées non-custodial liées au compte).
- **Third-Party APIs :**
  - **Pay-in :** Kkiapay (Mobile Money Afrique de l'Ouest).
  - **Off-Ramp :** Mt Pelerin (Routage Standard) & Ramp Network (Routage Éclair).

## 3. Modèle de Données (PostgreSQL)

### 3.1 Identité et Profils
- **`users`** : Table racine contenant `firebase_uid`, `role` (SENDER/RECEIVER), `phone`, `email`.
- **`senders`** : Profil Ouest-Africain. Contient le `kyc_level`, `country`, `first_name`, `last_name`.
- **`receivers`** : Profil SEPA. Contient le `wura_id` (identifiant unique pour le routage), `iban` (chiffré), `bic`, et surtout **`web3auth_wallet_address`** (Adresse Polygon).
- **`receiver_volumes`** : Agrége les volumes reçus annuellement par receveur pour appliquer la règle métier des 500€ gratuits de Mt Pelerin.

### 3.2 Gestion Financière
- **`exchange_rates`** : Oracle interne. Paires `XOF_USDT`, `USDT_EUR`. Contient le taux brut et notre marge (`markup`).
- **`transactions`** : L'épine dorsale.
  - Tracking : `reference_id`, `sender_id`, `receiver_id`, `routing_strategy`.
  - Montants : `amount_fiat_in` (XOF), `amount_usdt_bridged` (USDT), `amount_fiat_out_expected` (EUR), `wura_fee`, `absorption_fee_usdt` (si Mt Pelerin subventionné).
  - Preuves : `kkiapay_id`, `polygon_tx_hash`, `offramp_quote_id`.
  - Etat : `status` (Enum), `failure_reason`.

## 4. Machine à États d'une Transaction (State Machine)
Une transaction traverse un workflow strict et idempotent :
1. `INITIATED` : Création en DB.
2. `PAYIN_PENDING` : En attente du Webhook Kkiapay.
3. `PAYIN_SUCCESS` : Les XOF sont encaissés notre compte Kkiapay.
4. `BRIDGE_PROCESSING` : Le backend Node.js signe et envoie les USDT au wallet Web3Auth du receveur.
5. `BRIDGE_SUCCESS` : Confirmation blockchain. Notification push au receveur.
6. `WAITING_USER_OFFRAMP` : Le receveur doit ouvrir l'app pour ouvrir le widget Mt Pelerin/Ramp.
7. `OFFRAMP_PROCESSING` : Crypto vendue, virement SEPA en cours par le partenaire.
8. `COMPLETED` : Argent sur l'IBAN du receveur.

*États d'anomalie :* `PAYIN_FAILED`, `BRIDGE_FAILED`, `OFFRAMP_FAILED`.

## 5. Défis Techniques & Solutions
1. **Frais de Gas (MATIC) :** Le receveur n'ayant pas de MATIC pour payer le Gas de la transaction off-ramp, le backend devra utiliser l'Account Abstraction (ERC-4337 Biconomy Paymaster) ou envoyer automatiquement 0.1 MATIC vers le wallet Web3Auth avant le retrait.
2. **Idempotence des Webhooks :** Verrou de base de données (PostgreSQL `Advisory Locks` ou `FOR UPDATE`) à la réception des webhooks Kkiapay pour éviter tout "double-bridging" des USDT.
3. **Sécurité IBAN :** Chiffrement de la colonne `iban` dans PostgreSQL via AES-256 avec une Master Key stockée dans AWS KMS / Google Cloud KMS.
