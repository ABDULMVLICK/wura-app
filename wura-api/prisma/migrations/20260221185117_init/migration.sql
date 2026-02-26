-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SENDER', 'RECEIVER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('INITIATED', 'PAYIN_PENDING', 'PAYIN_SUCCESS', 'BRIDGE_PROCESSING', 'BRIDGE_SUCCESS', 'WAITING_USER_OFFRAMP', 'OFFRAMP_PROCESSING', 'COMPLETED', 'PAYIN_FAILED', 'BRIDGE_FAILED', 'OFFRAMP_FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "kyc_level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "senders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wura_id" TEXT NOT NULL,
    "iban_encrypted" TEXT,
    "bic" TEXT,
    "web3auth_wallet_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receiver_volumes" (
    "id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "total_volume_eur" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "receiver_volumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "pair" TEXT NOT NULL,
    "base_rate" DOUBLE PRECISION NOT NULL,
    "markup_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("pair")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "routing_strategy" TEXT NOT NULL,
    "amount_fiat_in" DOUBLE PRECISION NOT NULL,
    "amount_usdt_bridged" DOUBLE PRECISION NOT NULL,
    "amount_fiat_out_expected" DOUBLE PRECISION NOT NULL,
    "wura_fee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "absorption_fee_usdt" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "kkiapay_id" TEXT,
    "polygon_tx_hash" TEXT,
    "offramp_quote_id" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "senders_user_id_key" ON "senders"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "receivers_user_id_key" ON "receivers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "receivers_wura_id_key" ON "receivers"("wura_id");

-- CreateIndex
CREATE UNIQUE INDEX "receiver_volumes_receiver_id_key" ON "receiver_volumes"("receiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "receiver_volumes_receiver_id_year_key" ON "receiver_volumes"("receiver_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_id_key" ON "transactions"("reference_id");

-- AddForeignKey
ALTER TABLE "senders" ADD CONSTRAINT "senders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivers" ADD CONSTRAINT "receivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiver_volumes" ADD CONSTRAINT "receiver_volumes_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "senders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
