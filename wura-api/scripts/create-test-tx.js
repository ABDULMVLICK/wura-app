const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sender = await prisma.sender.findFirst();
    const receiver = await prisma.receiver.findFirst({ where: { wuraId: 'User8298' } });

    console.log('sender:', sender?.id);
    console.log('receiver:', receiver?.id, receiver?.wuraId);

    if (!sender || !receiver) {
        console.log('PAS DE SENDER/RECEIVER trouvé');
        return;
    }

    // Transaction STANDARD → routingStrategy = 'MT_PELERIN'
    const txStandard = await prisma.transaction.create({
        data: {
            referenceId: 'TX-TEST-MTP-' + Date.now().toString(16).toUpperCase(),
            senderId: sender.id,
            receiverId: receiver.id,
            status: 'WAITING_USER_OFFRAMP',
            routingStrategy: 'MT_PELERIN',
            deliverySpeed: 'STANDARD',
            amountFiatIn: 50000,
            amountUsdtBridged: 0.5,
            amountFiatOutExpected: 0.41,
            clientExchangeRate: 689.9,
            actualUsdtCostRate: 655.96,
            kkiapayFeeCfa: 1000,
            wuraFee: 500,
        }
    });
    console.log('\n✅ Transaction STANDARD (Mt Pelerin) créée:', txStandard.referenceId);
    console.log('   routingStrategy:', txStandard.routingStrategy, '| status:', txStandard.status);

    // Transaction INSTANT → routingStrategy = 'TRANSAK'
    const txInstant = await prisma.transaction.create({
        data: {
            referenceId: 'TX-TEST-TRK-' + Date.now().toString(16).toUpperCase(),
            senderId: sender.id,
            receiverId: receiver.id,
            status: 'WAITING_USER_OFFRAMP',
            routingStrategy: 'TRANSAK',
            deliverySpeed: 'INSTANT',
            amountFiatIn: 50000,
            amountUsdtBridged: 0.5,
            amountFiatOutExpected: 0.41,
            clientExchangeRate: 719.9,
            actualUsdtCostRate: 655.96,
            kkiapayFeeCfa: 1097,
            wuraFee: 500,
        }
    });
    console.log('\n✅ Transaction INSTANT (Transak) créée:', txInstant.referenceId);
    console.log('   routingStrategy:', txInstant.routingStrategy, '| status:', txInstant.status);

    // Vérification : liste des transactions du receiver
    const receiverTxs = await prisma.transaction.findMany({
        where: { receiverId: receiver.id },
        select: { referenceId: true, status: true, routingStrategy: true, deliverySpeed: true },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('\n=== Transactions receiver User8298 (5 dernières) ===');
    receiverTxs.forEach(t => console.log(' ', t.referenceId, '|', t.status, '|', t.routingStrategy, '|', t.deliverySpeed));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
