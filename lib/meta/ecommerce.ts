import { createAdminClient } from '../supabase/admin'
import { sendReply, TokenExpiredError } from './messaging'

interface GeminiEcommerceResponse {
  extractedData: {
    product_id: string | null;
    selected_size: string | null;
    selected_color: string | null;
    shipping_address: string | null;
    customer_name: string | null;
    customer_phone: string | null;
  };
  action: 'update_session' | 'create_order' | 'cancel_session';
  replyText: string;
}

/**
 * Partial update payload for an `order_sessions` row, built from the
 * always-set bookkeeping fields plus whichever extracted fields the LLM
 * managed to fill in on this turn.
 */
interface OrderSessionUpdate {
  last_message_at: string;
  status: string;
  product_id?: string;
  selected_size?: string;
  selected_color?: string;
  shipping_address?: string;
  customer_name?: string;
  customer_phone?: string;
}

async function callGeminiEcommerce(prompt: string, apiKey: string, model = 'gemini-1.5-flash'): Promise<GeminiEcommerceResponse> {
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generation_config: { response_mime_type: 'application/json' },
  });

  let res: Response | null = null;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    // Retry on transient errors (503 overloaded, 429 rate limit)
    if ((res.status === 503 || res.status === 429) && attempt < maxAttempts) {
      const waitMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
      console.warn(`[Ecommerce] Gemini ${res.status} on attempt ${attempt}/${maxAttempts}, retrying in ${waitMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      continue;
    }
    break;
  }

  if (!res!.ok) {
    throw new Error(`Gemini API error: ${await res!.text()}`);
  }

  const data = await res!.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('Gemini API returned an empty response');
  }
  return JSON.parse(textResponse.trim());
}

export async function handleEcommerceMessage({
  accountId,
  pageId,
  senderId,
  messageText,
  accessToken,
  instructions = [],
  infosToCollect = [],
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  accountId: string;
  pageId: string;
  senderId: string;
  messageText: string;
  accessToken: string;
  instructions?: string[];
  infosToCollect?: string[];
  aiProvider?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
}) {
  const supabase = createAdminClient();

  // 1. Fetch products catalog
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('channel_account_id', accountId)
    .eq('is_active', true);

  // 2. Fetch or create session
  let { data: session } = await supabase
    .from('order_sessions')
    .select('*')
    .eq('channel_account_id', accountId)
    .eq('sender_id', senderId)
    .neq('status', 'confirmed')
    .neq('status', 'cancelled')
    .single();

  if (!session) {
    // Use upsert: if a confirmed/cancelled session already exists (unique constraint),
    // reset it to start a new order flow for this customer.
    const { data: newSession, error: insertError } = await supabase
      .from('order_sessions')
      .upsert(
        {
          channel_account_id: accountId,
          sender_id: senderId,
          status: 'selecting_product',
          product_id: null,
          selected_size: null,
          selected_color: null,
          shipping_address: null,
          customer_name: null,
          customer_phone: null,
          last_message_at: new Date().toISOString(),
        },
        { onConflict: 'channel_account_id,sender_id' }
      )
      .select()
      .single();

    if (insertError || !newSession) {
      console.error('[Ecommerce] Failed to create order session:', insertError);
      await sendReply(pageId, accessToken, senderId, "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.");
      return;
    }
    session = newSession;
  }

  // 3. Resolve AI credentials: DB settings take priority over env vars
  const resolvedProvider = aiProvider || 'gemini';
  const resolvedModel   = aiModel    || 'gemini-1.5-flash';

  // For Gemini: use per-account key if set, otherwise fall back to env
  const apiKey     = aiApiKey || process.env.GEMINI_API_KEY;
  // For Groq: use env var (no per-account Groq key stored yet)
  const groqApiKey = process.env.GROQ_API_KEY;

  // Determine which provider to use
  const useGroq = resolvedProvider === 'groq' && groqApiKey;
  const useGemini = resolvedProvider === 'gemini' && apiKey;

  if (!useGroq && !useGemini) {
    console.error('[Ecommerce] No usable AI credentials (provider=%s)', resolvedProvider);
    await sendReply(pageId, accessToken, senderId, "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.");
    return;
  }

  const prompt = `
Tu es l'agent de vente IA pour une boutique e-commerce sur Instagram.
Ton but est de prendre la commande d'un client de manière chaleureuse, naturelle et efficace en français.

IMPORTANT : Tous les prix affichés dans le catalogue sont en Dinars Algériens (DA). Tu dois toujours communiquer les prix en ajoutant "DA" à la fin.

${instructions.length > 0 ? `INSTRUCTIONS DE COMPORTEMENT SPÉCIFIQUES :\n${instructions.map(i => '- ' + i).join('\n')}\n` : ''}
${infosToCollect.length > 0 ? `INFORMATIONS À RÉCOLTER OBLIGATOIREMENT AVANT VALIDATION :\n${infosToCollect.map(i => '- ' + i).join('\n')}\n` : ''}

Voici le catalogue des produits disponibles :
${JSON.stringify(products, null, 2)}

Voici les informations déjà collectées sur la commande en cours :
${JSON.stringify(session, null, 2)}

Voici le nouveau message du client : "${messageText}"

Tâches :
1. Analyse le message du client pour extraire de nouvelles informations (choix du produit, taille, couleur, nom, téléphone, adresse, et toute autre information demandée).
2. Si le client mentionne un produit, trouve son ID dans le catalogue et renseigne "product_id".
3. Formule la prochaine réponse pour le client :
   - Prends bien en compte les INSTRUCTIONS DE COMPORTEMENT ci-dessus.
   - S'il n'a pas encore choisi de produit, propose-lui la liste des produits disponibles (avec les prix en DA).
   - Demande la taille s'il manque la taille (et que le produit a des tailles).
   - Demande la couleur s'il manque la couleur (et que le produit a des couleurs).
   - Demande toutes les INFORMATIONS À RÉCOLTER OBLIGATOIREMENT si elles ne sont pas encore fournies.
   - Si TOUTES les informations nécessaires (produit, taille/couleur si applicable, infos obligatoires) sont complètes, résume la commande en listant tout et demande une confirmation finale ("Est-ce que tout est correct pour valider la commande ?").
4. Si le client confirme (dit "oui", "valider", "c'est bon") à l'étape finale, définis "action" sur "create_order". S'il veut annuler, définis "action" sur "cancel_session". Sinon, "update_session".

IMPORTANT : Renvoie UNIQUEMENT un objet JSON valide (sans backticks ni format markdown autour) respectant ce schéma exact :
{
  "extractedData": {
    "product_id": "UUID du produit ou null",
    "selected_size": "taille extraite ou null",
    "selected_color": "couleur extraite ou null",
    "shipping_address": "adresse complète ou null",
    "customer_name": "Nom complet ou null",
    "customer_phone": "Téléphone ou null"
  },
  "action": "update_session" | "create_order" | "cancel_session",
  "replyText": "Le texte poli à envoyer au client"
}
`;

  let geminiResponse: GeminiEcommerceResponse;

  if (useGroq) {
    try {
      const groqModel = resolvedModel.startsWith('llama') ? resolvedModel : 'llama-3.3-70b-versatile';
      console.log(`[Ecommerce] Using Groq (${groqModel})...`);
      const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!res.ok) throw new Error(`Groq API error: ${await res.text()}`);

      const data = await res.json();
      const textResponse = data.choices?.[0]?.message?.content;
      if (!textResponse) throw new Error('Groq returned an empty response');
      geminiResponse = JSON.parse(textResponse.trim());
    } catch (err) {
      console.error('[Ecommerce] Groq error, falling back to Gemini...', err);
      if (apiKey) {
        try {
          geminiResponse = await callGeminiEcommerce(prompt, apiKey, resolvedModel);
        } catch (geminiErr) {
          console.error('[Ecommerce] Gemini fallback error:', geminiErr);
          await sendReply(pageId, accessToken, senderId, "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.");
          return;
        }
      } else {
        await sendReply(pageId, accessToken, senderId, "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.");
        return;
      }
    }
  } else {
    try {
      console.log(`[Ecommerce] Using Gemini (${resolvedModel})...`);
      geminiResponse = await callGeminiEcommerce(prompt, apiKey!, resolvedModel);
    } catch (err) {
      console.error('[Ecommerce] Gemini error:', err);
      await sendReply(pageId, accessToken, senderId, "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.");
      return;
    }
  }

  // 4. Update session
  const updates: OrderSessionUpdate = {
    last_message_at: new Date().toISOString(),
    status: geminiResponse.action === 'cancel_session' ? 'cancelled' : 'gathering_info'
  };

  if (geminiResponse.extractedData) {
    const d = geminiResponse.extractedData;
    if (d.product_id) updates.product_id = d.product_id;
    if (d.selected_size) updates.selected_size = d.selected_size;
    if (d.selected_color) updates.selected_color = d.selected_color;
    if (d.shipping_address) updates.shipping_address = d.shipping_address;
    if (d.customer_name) updates.customer_name = d.customer_name;
    if (d.customer_phone) updates.customer_phone = d.customer_phone;
  }

  await supabase
    .from('order_sessions')
    .update(updates)
    .eq('id', session.id);

  // 5. Create Order if action is create_order
  if (geminiResponse.action === 'create_order') {
    // get updated session with product details
    const { data: finalSession } = await supabase
      .from('order_sessions')
      .select('*, products(name, price)')
      .eq('id', session.id)
      .single();

    if (finalSession && finalSession.products) {
      const price = finalSession.products.price;
      const qty = finalSession.quantity || 1;

      await supabase.from('orders').insert({
        channel_account_id: accountId,
        order_session_id: finalSession.id,
        customer_name: finalSession.customer_name || 'Inconnu',
        customer_phone: finalSession.customer_phone || 'Inconnu',
        shipping_address: finalSession.shipping_address || 'Inconnu',
        product_name: finalSession.products.name,
        price: price,
        size: finalSession.selected_size,
        color: finalSession.selected_color,
        quantity: qty,
        total_amount: price * qty
      });

      // mark session as confirmed
      await supabase
        .from('order_sessions')
        .update({ status: 'confirmed' })
        .eq('id', finalSession.id);
    }
  }

  // 6. Send Reply
  try {
    await sendReply(pageId, accessToken, senderId, geminiResponse.replyText);
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await supabase
        .from('channel_accounts')
        .update({ is_active: false })
        .eq('id', accountId);
    }
    console.error('[Ecommerce] Failed to send reply:', err);
  }
}
