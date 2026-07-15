import { createAdminClient } from "../supabaseClient.ts";
import { sendReply, TokenExpiredError } from "./api.ts";
import { transcribeVoiceForEcommerce } from "./voice.ts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtractedFields {
  product_id?: string | null;
  selected_size?: string | null;
  selected_color?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  wilaya?: string | null;
  delivery_mode?: string | null;
  shipping_address?: string | null;
  extra_data?: Record<string, string>;
}

interface LlmExtractionResult {
  extractedData: ExtractedFields;
  // LLM répond aux questions uniquement
  isQuestion: boolean;
  questionReply: string | null;
  detectedLanguage: string;
}

/** Minimal shape of a `products` row as read by the e-commerce flow. */
interface Product {
  id: string;
  name: string;
  price: number;
  sizes?: string[];
  colors?: string[];
}

/** Fields read/written on an `order_sessions` row by the matching helpers below. */
interface OrderSessionFields {
  product_id?: string | null;
  selected_size?: string | null;
  selected_color?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  wilaya?: string | null;
  delivery_mode?: string | null;
  shipping_address?: string | null;
  extra_data?: Record<string, string> | null;
}

// ─── Templates multilingues ──────────────────────────────────────────────────

type Template = {
  welcome: string;
  askProduct: (list: string) => string;
  askProductShort: string;
  askSize: (opts: string) => string;
  askColor: (opts: string) => string;
  askName: string;
  askPhone: string;
  askWilaya: string;
  askDelivery: string;
  askAddressHome: string;
  askAddressRelay: string;
  askExtra: (field: string) => string;
  recap: string;
  recapConfirm: string;
  confirmed: string;
  cancelled: string;
  labelProduct: string;
  labelSize: string;
  labelColor: string;
  labelPrice: string;
  labelName: string;
  labelPhone: string;
  labelWilaya: string;
  labelDelivery: string;
  labelAddress: string;
  deliveryHome: string;
  deliveryRelay: string;
};

const TEMPLATES: Record<string, Template> = {
  fr: {
    welcome: "Bonjour ! 😊 Je suis là pour vous aider à passer votre commande.",
    askProduct: (list) => `Voici nos produits disponibles :\n${list}\n\nLequel vous intéresse ?`,
    askProductShort: "Lequel de nos produits vous intéresse ?",
    askSize: (opts) => `Quelle taille souhaitez-vous ? Options : ${opts}`,
    askColor: (opts) => `Quelle couleur souhaitez-vous ? Options : ${opts}`,
    askName: "Quel est votre nom complet ?",
    askPhone: "Quel est votre numéro de téléphone ?",
    askWilaya: "Dans quelle wilaya êtes-vous ?",
    askDelivery: "Vous préférez la livraison à domicile ou en point de retrait ?",
    askAddressHome: "Parfait ! Quelle est votre adresse complète ? (rue, quartier et commune)",
    askAddressRelay: "D'accord ! Quelle est la ville et la commune de votre bureau de retrait ?",
    askExtra: (field) => `Pouvez-vous me donner votre ${field} ?`,
    recap: "✅ Voici le récapitulatif de votre commande :",
    recapConfirm: 'Est-ce que tout est correct ? Répondez "oui" pour confirmer ou "non" pour annuler.',
    confirmed: "🎉 Merci ! Votre commande a bien été confirmée. Notre équipe vous contactera bientôt.",
    cancelled: "D'accord, votre commande a été annulée. N'hésitez pas à revenir ! 😊",
    labelProduct: "Produit",
    labelSize: "Taille",
    labelColor: "Couleur",
    labelPrice: "Prix",
    labelName: "Nom",
    labelPhone: "Téléphone",
    labelWilaya: "Wilaya",
    labelDelivery: "Livraison",
    labelAddress: "Adresse",
    deliveryHome: "Domicile",
    deliveryRelay: "Point de retrait",
  },
  ar: {
    welcome: "مرحباً ! 😊 أنا هنا لمساعدتك في تقديم طلبك.",
    askProduct: (list) => `إليك منتجاتنا المتاحة :\n${list}\n\nأيها يعجبك؟`,
    askProductShort: "أي من منتجاتنا يعجبك؟",
    askSize: (opts) => `ما المقاس الذي تريده؟ الخيارات : ${opts}`,
    askColor: (opts) => `ما اللون الذي تريده؟ الخيارات : ${opts}`,
    askName: "ما اسمك الكامل؟",
    askPhone: "ما رقم هاتفك؟",
    askWilaya: "في أي ولاية أنت؟",
    askDelivery: "هل تفضل التوصيل للمنزل أم نقطة الاستلام؟",
    askAddressHome: "ممتاز! ما عنوانك الكامل؟ (الشارع، الحي والبلدية)",
    askAddressRelay: "حسناً! ما هي مدينة وبلدية مكتب الاستلام؟",
    askExtra: (field) => `هل يمكنك إعطائي ${field}؟`,
    recap: "✅ ملخص طلبك :",
    recapConfirm: 'هل كل شيء صحيح؟ أجب بـ "نعم" للتأكيد أو "لا" للإلغاء.',
    confirmed: "🎉 شكراً! تم تأكيد طلبك. سيتصل بك فريقنا قريباً.",
    cancelled: "حسناً، تم إلغاء طلبك. لا تتردد في العودة! 😊",
    labelProduct: "المنتج",
    labelSize: "المقاس",
    labelColor: "اللون",
    labelPrice: "السعر",
    labelName: "الاسم",
    labelPhone: "الهاتف",
    labelWilaya: "الولاية",
    labelDelivery: "التوصيل",
    labelAddress: "العنوان",
    deliveryHome: "المنزل",
    deliveryRelay: "نقطة الاستلام",
  },
  darija: {
    welcome: "مرحبا ! 😊 أنا هنا باش نعاونك تدير الطلب ديالك.",
    askProduct: (list) => `هاذو هوما المنتجات المتاحين :\n${list}\n\nواش يعجبك؟`,
    askProductShort: "أشمن منتج عجبك؟",
    askSize: (opts) => `شحال تحب القياس؟ الخيارات : ${opts}`,
    askColor: (opts) => `شحال تحب اللون؟ الخيارات : ${opts}`,
    askName: "شنو اسمك الكامل؟",
    askPhone: "شنو رقم تيليفونك؟",
    askWilaya: "فين أنت؟ قول الولاية.",
    askDelivery: "تحب التوصيل للدار ولا نقطة استلام؟",
    askAddressHome: "واخا! شنو عنوانك الكامل؟ (الزنقة، الحومة والبلدية)",
    askAddressRelay: "واخا! شنو هي المدينة والبلدية ديال نقطة الاستلام؟",
    askExtra: (field) => `واش تقدر تعطيني ${field}؟`,
    recap: "✅ هاذا ملخص الطلب ديالك :",
    recapConfirm: 'كلشي صح؟ جاوب بـ "واه" باش تأكد ولا "لا" باش تلغي.',
    confirmed: "🎉 شكراً! الطلب ديالك تأكد. الفريق ديالنا غيتصل بيك قريب.",
    cancelled: "واخا، الطلب ديالك تلغى. ما تتردد ترجع! 😊",
    labelProduct: "المنتج",
    labelSize: "القياس",
    labelColor: "اللون",
    labelPrice: "الثمن",
    labelName: "الاسم",
    labelPhone: "التيليفون",
    labelWilaya: "الولاية",
    labelDelivery: "التوصيل",
    labelAddress: "العنوان",
    deliveryHome: "الدار",
    deliveryRelay: "نقطة الاستلام",
  },
  en: {
    welcome: "Hello! 😊 I'm here to help you place your order.",
    askProduct: (list) => `Here are our available products:\n${list}\n\nWhich one interests you?`,
    askProductShort: "Which of our products interests you?",
    askSize: (opts) => `Which size would you like? Options: ${opts}`,
    askColor: (opts) => `Which color would you like? Options: ${opts}`,
    askName: "What is your full name?",
    askPhone: "What is your phone number?",
    askWilaya: "Which wilaya are you in?",
    askDelivery: "Do you prefer home delivery or pickup point?",
    askAddressHome: "Great! What is your full address? (street, neighborhood and municipality)",
    askAddressRelay: "Got it! What is the city and municipality of your pickup point?",
    askExtra: (field) => `Can you give me your ${field}?`,
    recap: "✅ Here is your order summary:",
    recapConfirm: 'Is everything correct? Reply "yes" to confirm or "no" to cancel.',
    confirmed: "🎉 Thank you! Your order has been confirmed. Our team will contact you soon.",
    cancelled: "Okay, your order has been cancelled. Feel free to come back! 😊",
    labelProduct: "Product",
    labelSize: "Size",
    labelColor: "Color",
    labelPrice: "Price",
    labelName: "Name",
    labelPhone: "Phone",
    labelWilaya: "Wilaya",
    labelDelivery: "Delivery",
    labelAddress: "Address",
    deliveryHome: "Home",
    deliveryRelay: "Pickup point",
  },
};

function getTemplate(lang: string): Template {
  return TEMPLATES[lang] ?? TEMPLATES["fr"];
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function normalizeAlgerianPhone(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (/^0[5-7]\d{8}$/.test(cleaned)) return cleaned;
  if (/^\+213[5-7]\d{8}$/.test(cleaned)) return "0" + cleaned.slice(4);
  if (/^213[5-7]\d{8}$/.test(cleaned)) return "0" + cleaned.slice(3);
  return phone;
}

function normalizeDeliveryMode(raw: string | null | undefined, messageText: string): string | null {
  const sources = [raw?.toLowerCase() ?? "", messageText.toLowerCase()];
  for (const src of sources) {
    if (!src) continue;
    if (/retrait|relais|bureau|stop|استلام|نقطة/.test(src)) return "point_retrait";
    if (/domicile|maison|chez moi|الدار|المنزل|البيت/.test(src)) return "domicile";
  }
  return raw && ["domicile", "point_retrait"].includes(raw) ? raw : null;
}

function isConfirmationMessage(text: string): boolean {
  return /^(oui|ok|ouais|wah|c'?est bon|valider?|confirme?|correct|parfait|nickel|go|yes|نعم|واه|أكيد|تمام|صح)$/i
    .test(text.trim());
}

function isCancellationMessage(text: string): boolean {
  return /^(non|annuler?|laisser? tomber|stop|nope|لا|إلغاء|يلغي)$/i
    .test(text.trim());
}

// ─── Appel LLM (Groq premier, fallback Gemini) ───────────────────────────────

// ─── Appel LLM (Multi-fournisseur avec fallback système) ──────────────────────

async function callLLMWithGemini<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generation_config: { response_mime_type: "application/json" },
        }),
      },
    );
    if ((res.status === 503 || res.status === 429) && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      continue;
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini: empty response");
    return JSON.parse(text.trim()) as T;
  }
  throw new Error("Gemini: all retries failed");
}

async function callLLMWithGroq<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq: empty response");
  return JSON.parse(text) as T;
}

async function callLLMWithOpenAI<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI: empty response");
  return JSON.parse(text) as T;
}

async function callLLMWithAnthropic<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Anthropic: empty response");
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7, cleanText.length - 3).trim();
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3, cleanText.length - 3).trim();
  }
  return JSON.parse(cleanText) as T;
}

async function callLLMWithOpenRouter<T>(prompt: string, apiKey: string, model: string): Promise<T> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://instaflow.io",
      "X-Title": "Instaflow"
    },
    body: JSON.stringify({
      model: model || "meta-llama/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter: empty response");
  return JSON.parse(text) as T;
}

async function callLLM<T>(
  prompt: string,
  aiProvider?: string | null,
  aiApiKey?: string | null,
  aiModel?: string | null
): Promise<T> {
  const provider = aiProvider || 'gemini';
  const apiKey = aiApiKey || (provider === 'gemini' ? Deno.env.get("GEMINI_API_KEY") : provider === 'groq' ? Deno.env.get("GROQ_API_KEY") : null);
  const model = aiModel || (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'groq' ? 'llama-3.3-70b-versatile' : '');

  if (!apiKey) {
    if (provider === 'gemini' && Deno.env.get("GEMINI_API_KEY")) {
      return callLLMWithGemini<T>(prompt, Deno.env.get("GEMINI_API_KEY")!, model || 'gemini-1.5-flash');
    }
    if (provider === 'groq' && Deno.env.get("GROQ_API_KEY")) {
      return callLLMWithGroq<T>(prompt, Deno.env.get("GROQ_API_KEY")!, model || 'llama-3.3-70b-versatile');
    }
    const systemGemini = Deno.env.get("GEMINI_API_KEY");
    if (systemGemini) {
      return callLLMWithGemini<T>(prompt, systemGemini, 'gemini-1.5-flash');
    }
    throw new Error(`Aucune clé API disponible pour le fournisseur: ${provider}`);
  }

  switch (provider) {
    case 'gemini':
      return callLLMWithGemini<T>(prompt, apiKey, model || 'gemini-1.5-flash');
    case 'groq':
      return callLLMWithGroq<T>(prompt, apiKey, model || 'llama-3.3-70b-versatile');
    case 'openai':
      return callLLMWithOpenAI<T>(prompt, apiKey, model || 'gpt-4o-mini');
    case 'anthropic':
      return callLLMWithAnthropic<T>(prompt, apiKey, model || 'claude-3-5-sonnet-20241022');
    case 'openrouter':
      return callLLMWithOpenRouter<T>(prompt, apiKey, model || 'meta-llama/llama-3.3-70b-instruct');
    default:
      throw new Error(`Fournisseur d'IA non supporté: ${provider}`);
  }
}

// ─── Logique de champs manquants ──────────────────────────────────────────────
//
// Retourne dans l'ordre les champs qui manquent encore dans la session.
// L'adresse n'est ajoutée que si le delivery_mode est déjà connu.

function getMissingFields(session: OrderSessionFields, products: Product[], customInfos: string[]): string[] {
  const product = products.find((p) => p.id === session.product_id);
  const missing: string[] = [];

  if (!session.product_id) missing.push("produit");
  if (product?.sizes?.length && !session.selected_size) missing.push("taille");
  if (product?.colors?.length && !session.selected_color) missing.push("couleur");
  if (!session.customer_name) missing.push("nom complet");
  if (!session.customer_phone) missing.push("téléphone");
  if (!session.wilaya) missing.push("wilaya");
  if (!session.delivery_mode) missing.push("mode de livraison");
  if (session.delivery_mode && !session.shipping_address) missing.push("adresse complète");

  for (const info of customInfos) {
    const key = info.toLowerCase().trim();
    if (!session.extra_data?.[key]) missing.push(key);
  }

  return missing;
}

// ─── Génération de la prochaine question ─────────────────────────────────────

function getNextQuestion(
  missingField: string,
  session: OrderSessionFields,
  products: Product[],
  t: Template,
  isNewSession: boolean,
): { text: string; quickReplies?: Array<{ title: string; payload: string }> } {
  const product = products.find((p) => p.id === session.product_id);

  switch (missingField) {
    case "produit":
      if (isNewSession) {
        const list = products
          .map((p) => {
            const details = [p.price + " DA", ...(p.sizes?.length ? ["tailles: " + p.sizes.join("/")] : [])].join(" — ");
            return `• ${p.name} (${details})`;
          })
          .join("\n");
        return { text: t.askProduct(list) };
      }
      return { text: t.askProductShort };

    case "taille":
      const sizeOptions = product?.sizes?.map((s: string) => ({ title: s, payload: s })) || [];
      return { 
        text: t.askSize(product?.sizes?.join(", ") ?? ""),
        quickReplies: sizeOptions.length > 0 ? sizeOptions : undefined
      };

    case "couleur":
      const colorOptions = product?.colors?.map((c: string) => ({ title: c, payload: c })) || [];
      return { 
        text: t.askColor(product?.colors?.join(", ") ?? ""),
        quickReplies: colorOptions.length > 0 ? colorOptions : undefined
      };

    case "nom complet": return { text: t.askName };
    case "téléphone": return { text: t.askPhone };
    case "wilaya": return { text: t.askWilaya };
    case "mode de livraison": 
      return { 
        text: t.askDelivery,
        quickReplies: [
          { title: t.deliveryHome, payload: "domicile" },
          { title: t.deliveryRelay, payload: "point_retrait" }
        ]
      };
    case "adresse complète":
      return { text: session.delivery_mode === "point_retrait" ? t.askAddressRelay : t.askAddressHome };

    default:
      return { text: t.askExtra(missingField) };
  }
}

// ─── Système Q&A ─────────────────────────────────────────────────────────────

export async function handleQaMessage({
  pageId,
  senderId,
  messageText,
  accessToken,
  products,
  customInstructions = [],
  isOrderTakingActive = false,
  skipReplyOnPurchaseIntent = false,
  aiProvider,
  aiApiKey,
  aiModel,
}: {
  pageId: string;
  senderId: string;
  messageText: string;
  accessToken: string;
  products: Product[];
  customInstructions?: string[];
  isOrderTakingActive?: boolean;
  skipReplyOnPurchaseIntent?: boolean;
  aiProvider?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
}): Promise<{ hasPurchaseIntent: boolean }> {
  const productList = products
    .map((p) => {
      const extras = [
        `${p.price} DA`,
        ...(p.sizes?.length ? [`tailles: ${p.sizes.join("/")}`] : []),
        ...(p.colors?.length ? [`couleurs: ${p.colors.join("/")}`] : []),
      ].join(" — ");
      return `• ${p.name} (${extras})`;
    })
    .join("\n");

  const orderHint = isOrderTakingActive
    ? `Si le client veut commander (ex: "je veux commander", "comment commander"), mets hasPurchaseIntent = true.`
    : `hasPurchaseIntent doit toujours être false.`;

  const prompt = `
Tu es un assistant e-commerce pour une boutique Instagram algérienne.
Tu réponds aux questions des clients sur le catalogue, les prix, les tailles, la livraison.
Tu ne prends pas de commandes.

${customInstructions.length ? `=== INSTRUCTIONS ===\n${customInstructions.map((i) => "- " + i).join("\n")}\n` : ""}

=== CATALOGUE ===
${productList || "Aucun produit actif."}

=== MESSAGE ===
"${messageText}"

=== TÂCHES ===
1. Détecte la langue : "fr", "ar", "darija", ou "en".
2. Réponds de manière chaleureuse et précise dans la langue du client.
3. ${orderHint}

JSON uniquement (sans backticks) :
{
  "reply": "ta réponse",
  "detectedLanguage": "fr | ar | darija | en",
  "hasPurchaseIntent": true | false
}`;

  try {
    const llm = await callLLM<{ reply: string; detectedLanguage: string; hasPurchaseIntent: boolean }>(
      prompt,
      aiProvider,
      aiApiKey,
      aiModel
    );
    if (!(skipReplyOnPurchaseIntent && llm.hasPurchaseIntent)) {
      await sendReply(pageId, accessToken, senderId, llm.reply);
    }
    return { hasPurchaseIntent: llm.hasPurchaseIntent ?? false };
  } catch (err) {
    console.error("[QA] LLM error:", err);
    await sendReply(pageId, accessToken, senderId,
      "Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.");
    return { hasPurchaseIntent: false };
  }
}

// ─── Handler principal e-commerce ────────────────────────────────────────────

export async function handleEcommerceMessage({
  accountId,
  pageId,
  senderId,
  messageText,
  accessToken,
  customInstructions = [],
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
  customInstructions?: string[];
  infosToCollect?: string[];
  aiProvider?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
}) {
  // Filtre les infos custom qui ne doublonnent pas les champs natifs
  const BUILTIN_KEYWORDS = ["produit", "taille", "couleur", "nom", "téléphone", "telephone",
    "numéro", "numero", "wilaya", "livraison", "quartier", "cité", "adresse"];
  const customInfos = infosToCollect.filter((info) =>
    !BUILTIN_KEYWORDS.some((kw) => info.toLowerCase().includes(kw))
  );

  const supabase = createAdminClient();

  // ── 1. Catalogue ──────────────────────────────────────────────────────────
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("channel_account_id", accountId)
    .eq("is_active", true);

  // ── 2. Session ────────────────────────────────────────────────────────────
  let { data: session } = await supabase
    .from("order_sessions")
    .select("*")
    .eq("channel_account_id", accountId)
    .eq("sender_id", senderId)
    .neq("status", "confirmed")
    .neq("status", "cancelled")
    .single();

  let isNewSession = false;

  if (!session) {
    isNewSession = true;
    const { data: newSession, error } = await supabase
      .from("order_sessions")
      .insert({
        channel_account_id: accountId,
        sender_id: senderId,
        status: "selecting_product",
        product_id: null, selected_size: null, selected_color: null,
        shipping_address: null, wilaya: null, delivery_mode: null,
        customer_name: null, customer_phone: null,
        extra_data: {}, last_message_at: new Date().toISOString(),
      })
      .select().single();

    if (error?.code === "23505") {
      // Conflict : session confirmed/cancelled existante → reset
      const { data: existing } = await supabase
        .from("order_sessions").select("*")
        .eq("channel_account_id", accountId).eq("sender_id", senderId)
        .order("created_at", { ascending: false }).limit(1).single();

      if (!existing) {
        await sendReply(pageId, accessToken, senderId, "Désolé, problème technique. Réessayez dans quelques instants.");
        return;
      }

      const { data: resetSession, error: resetError } = await supabase
        .from("order_sessions")
        .update({
          status: "selecting_product",
          product_id: null, selected_size: null, selected_color: null,
          shipping_address: null, wilaya: null, delivery_mode: null,
          customer_name: null, customer_phone: null,
          extra_data: {}, last_message_at: new Date().toISOString(),
        })
        .eq("id", existing.id).select().single();

      if (resetError || !resetSession) {
        await sendReply(pageId, accessToken, senderId, "Désolé, problème technique. Réessayez dans quelques instants.");
        return;
      }
      session = resetSession;
    } else if (error) {
      console.error("[Ecommerce] Session creation failed:", error);
      await sendReply(pageId, accessToken, senderId, "Désolé, problème technique. Réessayez dans quelques instants.");
      return;
    } else {
      session = newSession;
    }
  }

  // ── 3. Détection confirmation / annulation (regex — pas besoin du LLM) ───
  const isConfirmation = isConfirmationMessage(messageText);
  const isCancellation = isCancellationMessage(messageText);

  // ── 4. Langue : verrouillée dès le 1er message ───────────────────────────
  // On résoudra la langue après l'appel LLM si c'est une nouvelle session,
  // sinon on utilise la langue persistée.
  const persistedLang = session.detected_language as string | null;

  // ── 5. Prompt LLM — extraction pure + réponse aux vraies questions ────────
  const extraDataKeys = customInfos.map((i) => i.toLowerCase().trim());
  const sessionContext = isNewSession
    ? "C'est le PREMIER message du client. Si c'est une salutation, note-le dans isQuestion."
    : `La session est EN COURS. État actuel :\n${JSON.stringify({
      product_id: session.product_id,
      selected_size: session.selected_size,
      selected_color: session.selected_color,
      customer_name: session.customer_name,
      customer_phone: session.customer_phone,
      wilaya: session.wilaya,
      delivery_mode: session.delivery_mode,
      shipping_address: session.shipping_address,
      extra_data: session.extra_data,
    }, null, 2)}`;

  const prompt = `
Tu es l'agent de vente d'une boutique e-commerce algérienne.

=== CONTEXTE SESSION ===
${sessionContext}

${customInstructions.length ? `=== INSTRUCTIONS ===\n${customInstructions.map((i) => "- " + i).join("\n")}\n` : ""}

=== CATALOGUE ===
${JSON.stringify(products, null, 2)}

=== MESSAGE CLIENT ===
"${messageText}"

=== TES TÂCHES ===
1. Langue du client : "fr", "ar", "darija", "en". Si incertain → "fr".
2. Extrais toutes les données de commande présentes dans le message.
3. Détermine isQuestion :
   - true UNIQUEMENT si : (a) salutation sur nouvelle session, (b) vraie question sur produits/prix/tailles/livraison
   - false si : le client donne une info de commande (nom, téléphone, adresse, taille, couleur, wilaya, etc.)
   - RÈGLE : session en cours + message interprétable comme donnée → isQuestion = false
4. Si isQuestion = true → questionReply = réponse dans la langue du client. Sinon null.

=== RÈGLES D'EXTRACTION ===
- Téléphone algérien : 07/06/05xxxxxxxx ou +213xxxxxxxxx
- delivery_mode : "domicile" ou "point_retrait" (ou null si non mentionné)
- extra_data clés attendues : ${extraDataKeys.length ? extraDataKeys.map((k) => `"${k}"`).join(", ") : "aucune"}

JSON uniquement (sans backticks) :
{
  "extractedData": {
    "product_id": "UUID ou null",
    "selected_size": "taille ou null",
    "selected_color": "couleur ou null",
    "wilaya": "wilaya ou null",
    "delivery_mode": "domicile | point_retrait | null",
    "shipping_address": "adresse ou null",
    "customer_name": "nom ou null",
    "customer_phone": "téléphone ou null",
    "extra_data": { ${extraDataKeys.map((k) => `"${k}": "valeur ou null"`).join(", ")} }
  },
  "isQuestion": true | false,
  "questionReply": "réponse ou null",
  "detectedLanguage": "fr | ar | darija | en"
}`;

  let llmResult: LlmExtractionResult;
  try {
    llmResult = await callLLM<LlmExtractionResult>(prompt, aiProvider, aiApiKey, aiModel);
  } catch (err) {
    console.error("[Ecommerce] LLM error:", err);
    await sendReply(pageId, accessToken, senderId, "Désolé, problème technique. Réessayez dans quelques instants.");
    return;
  }

  // ── 6. Langue finale ──────────────────────────────────────────────────────
  const lang = persistedLang ?? llmResult.detectedLanguage ?? "fr";
  const t = getTemplate(lang);

  // ── 7. Merge des données extraites dans la session ────────────────────────
  const d: ExtractedFields = llmResult.extractedData ?? {};

  // Normalisation delivery_mode (LLM + fallback regex sur le message brut)
  d.delivery_mode = normalizeDeliveryMode(d.delivery_mode, messageText);

  // Normalisation téléphone
  if (d.customer_phone) d.customer_phone = normalizeAlgerianPhone(d.customer_phone);

  // Merge extra_data
  const mergedExtra: Record<string, string> = { ...(session.extra_data ?? {}) };
  if (d.extra_data && typeof d.extra_data === "object") {
    for (const [key, val] of Object.entries(d.extra_data)) {
      if (val && val !== "null") mergedExtra[key.toLowerCase().trim()] = val as string;
    }
  }

  // Session mise à jour (en mémoire, pas encore persistée)
  const updated = { ...session };
  if (d.product_id) updated.product_id = d.product_id;
  if (d.selected_size) updated.selected_size = d.selected_size;
  if (d.selected_color) updated.selected_color = d.selected_color;
  if (d.wilaya) updated.wilaya = d.wilaya;
  if (d.delivery_mode) updated.delivery_mode = d.delivery_mode;
  if (d.shipping_address) updated.shipping_address = d.shipping_address;
  if (d.customer_name) updated.customer_name = d.customer_name;
  if (d.customer_phone) updated.customer_phone = d.customer_phone;
  updated.extra_data = mergedExtra;

  // Fallback adresse : si le prochain champ attendu est l'adresse et que le message
  // ressemble à une adresse (pas un choix de mode de livraison, longueur suffisante)
  const looksLikeDeliveryChoice = /^(domicile|maison|chez moi|point.?retrait|retrait|relais|bureau|stop|الدار|المنزل|البيت|نقطة|استلام)$/i
    .test(messageText.trim());

  if (
    !updated.shipping_address &&
    !isConfirmation && !isCancellation && !looksLikeDeliveryChoice &&
    updated.delivery_mode && // delivery_mode connu
    messageText.trim().length >= 10
  ) {
    const missing = getMissingFields(updated, products ?? [], customInfos);
    if (missing[0] === "adresse complète") {
      updated.shipping_address = messageText.trim();
    }
  }

  // ── 8. Décision algo ──────────────────────────────────────────────────────
  const missing = getMissingFields(updated, products ?? [], customInfos);
  const allDone = missing.length === 0;

  // ── 9. Génération de la réponse ───────────────────────────────────────────
  let replyText: string;
  let newStatus: string;
  let quickReplies: Array<{ title: string; payload: string }> | undefined;

  if (isCancellation) {
    replyText = t.cancelled;
    newStatus = "cancelled";

  } else if (isConfirmation && allDone) {
    replyText = t.confirmed;
    newStatus = "confirmed";

  } else if (allDone) {
    // Toutes les infos sont là → récap et attente confirmation
    const product = (products ?? []).find((p) => p.id === updated.product_id);
    const deliveryLabel = updated.delivery_mode === "point_retrait" ? t.deliveryRelay : t.deliveryHome;
    const extraLines = Object.entries(updated.extra_data ?? {})
      .map(([k, v]) => `• ${k} : ${v}`)
      .join("\n");

    replyText = [
      t.recap, "",
      `• ${t.labelProduct} : ${product?.name ?? updated.product_id}`,
      updated.selected_size ? `• ${t.labelSize} : ${updated.selected_size}` : null,
      updated.selected_color ? `• ${t.labelColor} : ${updated.selected_color}` : null,
      `• ${t.labelPrice} : ${product?.price ?? "?"} DA`,
      `• ${t.labelName} : ${updated.customer_name}`,
      `• ${t.labelPhone} : ${updated.customer_phone}`,
      `• ${t.labelWilaya} : ${updated.wilaya}`,
      `• ${t.labelDelivery} : ${deliveryLabel}`,
      `• ${t.labelAddress} : ${updated.shipping_address}`,
      extraLines || null,
      "", t.recapConfirm,
    ].filter((l) => l !== null).join("\n");
    newStatus = "gathering_info";
    
    // Quick Replies for final confirmation
    quickReplies = [
      { title: lang === "fr" ? "Oui" : lang === "en" ? "Yes" : lang === "darija" ? "واه" : "نعم", payload: "oui" },
      { title: lang === "fr" ? "Non" : lang === "en" ? "No" : "لا", payload: "non" }
    ];

  } else {
    // Il manque des infos → prochaine question
    newStatus = "gathering_info";
    const nextQuestion = getNextQuestion(missing[0], updated, products ?? [], t, isNewSession);
    quickReplies = nextQuestion.quickReplies;

    if (llmResult.isQuestion && llmResult.questionReply) {
      // LLM répond à la question ET l'algo enchaîne avec la prochaine info
      replyText = isNewSession
        ? `${llmResult.questionReply}\n\n${nextQuestion.text}` // salutation → accueil + 1ère question
        : `${llmResult.questionReply}\n\n${nextQuestion.text}`; // vraie question → réponse + suite
    } else {
      replyText = nextQuestion.text;
    }
  }

  // ── 10. Persistance ───────────────────────────────────────────────────────
  const updates: Record<string, unknown> = {
    status: newStatus,
    detected_language: lang,
    last_message_at: new Date().toISOString(),
    extra_data: mergedExtra,
  };
  if (d.product_id) updates.product_id = d.product_id;
  if (d.selected_size) updates.selected_size = d.selected_size;
  if (d.selected_color) updates.selected_color = d.selected_color;
  if (d.wilaya) updates.wilaya = d.wilaya;
  if (d.delivery_mode) updates.delivery_mode = d.delivery_mode;
  if (d.customer_name) updates.customer_name = d.customer_name;
  if (d.customer_phone) updates.customer_phone = d.customer_phone;
  if (updated.shipping_address) updates.shipping_address = updated.shipping_address;

  await supabase.from("order_sessions").update(updates).eq("id", session.id);

  // ── 11. Création commande ─────────────────────────────────────────────────
  if (newStatus === "confirmed") {
    const { data: finalSession } = await supabase
      .from("order_sessions")
      .select("*, products(name, price)")
      .eq("id", session.id)
      .single();

    if (finalSession?.products) {
      const qty = finalSession.quantity || 1;
      const { error: insertError } = await supabase.from("orders").insert({
        channel_account_id: finalSession.channel_account_id,
        order_session_id: finalSession.id,
        customer_name: finalSession.customer_name ?? "Inconnu",
        customer_phone: finalSession.customer_phone ?? "Inconnu",
        wilaya: finalSession.wilaya ?? "Inconnue",
        delivery_mode: finalSession.delivery_mode ?? "Inconnu",
        shipping_address: finalSession.shipping_address ?? "",
        product_name: finalSession.products.name,
        price: finalSession.products.price,
        size: finalSession.selected_size,
        color: finalSession.selected_color,
        quantity: qty,
        total_amount: finalSession.products.price * qty,
        extra_data: finalSession.extra_data ?? {},
      });

      if (insertError) {
        console.error("[Ecommerce] Order creation failed:", insertError);
      } else {
        console.log(`[Ecommerce] Order created for session ${finalSession.id}`);
        await supabase.from("order_sessions").update({ status: "confirmed" }).eq("id", finalSession.id);
      }
    }
  }

  // ── 12. Envoi de la réponse ───────────────────────────────────────────────
  try {
    await sendReply(pageId, accessToken, senderId, replyText, quickReplies);
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      await supabase.from("channel_accounts").update({ is_active: false }).eq("id", accountId);
    }
    console.error("[Ecommerce] sendReply failed:", err);
  }
}

// ─── Wrapper vocal ────────────────────────────────────────────────────────────

export async function handleEcommerceVoice({
  accountId, pageId, senderId, audioBuffer, mimeType,
  accessToken, customInstructions = [], infosToCollect = [],
  aiProvider, aiApiKey, aiModel,
}: {
  accountId: string;
  pageId: string;
  senderId: string;
  audioBuffer: Uint8Array;
  mimeType: string;
  accessToken: string;
  customInstructions?: string[];
  infosToCollect?: string[];
  aiProvider?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
}): Promise<string | null> {
  const transcription = await transcribeVoiceForEcommerce(audioBuffer, mimeType, aiProvider, aiApiKey, aiModel);

  if (!transcription.trim()) {
    await sendReply(pageId, accessToken, senderId,
      "Désolé, je n'ai pas bien compris votre message vocal 😅 Pouvez-vous réécrire en texte ?");
    return null;
  }

  console.log(`[Ecommerce/Voice] Transcription : "${transcription}"`);
  await handleEcommerceMessage({
    accountId, pageId, senderId, messageText: transcription,
    accessToken, customInstructions, infosToCollect,
    aiProvider, aiApiKey, aiModel
  });
  return transcription;
}