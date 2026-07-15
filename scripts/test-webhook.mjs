import crypto from 'crypto';

// Configuration - Vérifiez que ces valeurs correspondent à votre .env.local
const APP_SECRET = '30e95006ee11b183d4b08890154e90e6'; // META_APP_SECRET
const VERIFY_TOKEN = 'instaflow_super_secret_token_123'; // META_WEBHOOK_VERIFY_TOKEN
const PAGE_ID = '17841441738471901'; // L'ID que vous avez mis dans Supabase
const WEBHOOK_URL = 'http://localhost:3000/api/webhook/instagram';

/**
 * Simule un payload de message Instagram venant de Meta
 */
const payload = {
  object: 'instagram',
  entry: [
    {
      id: PAGE_ID,
      time: Date.now(),
      messaging: [
        {
          sender: { id: 'sender_test_123' },
          recipient: { id: PAGE_ID },
          timestamp: Date.now(),
          message: {
            mid: 'm_' + Math.random().toString(36).substr(2, 9),
            text: 'Bonjour, quel est le PRIX ?'
          }
        }
      ]
    }
  ]
};

const body = JSON.stringify(payload);

// Calcul de la signature HMAC SHA256 (comme le fait Meta)
const signature = 'sha256=' + crypto
  .createHmac('sha256', APP_SECRET)
  .update(body, 'utf8')
  .digest('hex');

/**
 * Étape 1 : simule le handshake de vérification de webhook que Meta effectue
 * (requête GET avec hub.mode / hub.verify_token / hub.challenge).
 */
async function testVerificationHandshake() {
  const challenge = 'test_challenge_' + Math.random().toString(36).substr(2, 9);
  const verifyUrl = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(VERIFY_TOKEN)}&hub.challenge=${challenge}`;

  console.log('🔑 Vérification du handshake webhook (GET)...');
  try {
    const res = await fetch(verifyUrl);
    const text = await res.text();

    if (res.status === 200 && text === challenge) {
      console.log('✅ Handshake de vérification réussi.\n');
    } else {
      console.log(`❌ Handshake de vérification échoué (statut ${res.status}). Vérifiez META_WEBHOOK_VERIFY_TOKEN.\n`);
    }
  } catch (err) {
    console.error('❌ Impossible de contacter le serveur pour le handshake de vérification.');
    console.error(err.message);
  }
}

async function testMessageDelivery() {
  console.log('🚀 Envoi du webhook de test vers', WEBHOOK_URL);
  console.log('📦 Payload:', body);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
      },
      body: body
    });
    const text = await res.text();
    console.log(`\n✅ Statut: ${res.status} ${res.statusText}`);
    console.log(`📄 Réponse du serveur: ${text}`);

    if (res.status === 200) {
      console.log('\n✨ Succès ! Votre serveur a accepté le webhook.');
      console.log('Regardez maintenant votre terminal Next.js pour voir les logs du handleAutoReply.');
    } else if (res.status === 401) {
      console.log('\n❌ Erreur 401: Signature invalide. Vérifiez votre META_APP_SECRET.');
    } else {
      console.log('\n❌ Une erreur est survenue. Vérifiez vos logs serveur.');
    }
  } catch (err) {
    console.error('\n❌ Impossible de contacter le serveur. Assurez-vous que "npm run dev" tourne sur le port 3000.');
    console.error(err.message);
  }
}

await testVerificationHandshake();
await testMessageDelivery();
