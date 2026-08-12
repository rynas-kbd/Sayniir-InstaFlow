/** Multilingual reply templates — ported verbatim from the live Deno ecommerce.ts. */

export interface Template {
  welcome: string
  askProduct: (list: string) => string
  askProductShort: string
  askSize: (opts: string) => string
  askColor: (opts: string) => string
  askName: string
  askPhone: string
  askWilaya: string
  askDelivery: string
  askAddressHome: string
  askAddressRelay: string
  askSlot: string
  askSeats: (remaining?: number) => string
  askExtra: (field: string) => string
  recap: string
  recapConfirm: string
  confirmed: string
  cancelled: string
  /** Sent when a customer asks to talk to a human — see lib/agent/ecommerce/intent.ts's 'human' intent. */
  humanHandoff: string
  /** Sent when the atomic stock re-check at confirmation time fails — see the stockReserved guard in handleEcommerceMessage. */
  outOfStock: (productName: string) => string
  /** Abandoned-cart recovery nudge — see lib/agent/ecommerce/cart-recovery.ts. productName is null when the session was abandoned before a product was even picked. */
  cartReminder: (productName: string | null) => string
  /** Vérification de disponibilité — see lib/agent/ecommerce/availability.ts. Never LLM-generated: these six cover every AvailabilityResolution kind. */
  availableYes: (name: string, price: number, currency: string) => string
  availableNo: (name: string) => string
  availabilityAmbiguous: (names: string[]) => string
  availabilityNotFound: string
  availabilityNeedsProduct: string
  availabilityLookupFailed: string
  labelProduct: string
  labelSize: string
  labelColor: string
  labelPrice: string
  labelName: string
  labelPhone: string
  labelWilaya: string
  labelDelivery: string
  labelAddress: string
  deliveryHome: string
  deliveryRelay: string
}

export const TEMPLATES: Record<string, Template> = {
  fr: {
    welcome: 'Bonjour ! 😊 Je suis là pour vous aider à passer votre commande.',
    askProduct: (list) => `Voici nos produits disponibles :\n${list}\n\nLequel vous intéresse ?`,
    askProductShort: 'Lequel de nos produits vous intéresse ?',
    askSize: (opts) => `Quelle taille souhaitez-vous ? Options : ${opts}`,
    askColor: (opts) => `Quelle couleur souhaitez-vous ? Options : ${opts}`,
    askName: 'Quel est votre nom complet ?',
    askPhone: 'Quel est votre numéro de téléphone ?',
    askWilaya: 'Dans quelle wilaya êtes-vous ?',
    askDelivery: 'Vous préférez la livraison à domicile ou en point de retrait ?',
    askAddressHome: 'Parfait ! Quelle est votre adresse complète ? (rue, quartier et commune)',
    askAddressRelay: "D'accord ! Quelle est la ville et la commune de votre bureau de retrait ?",
    askSlot: 'Quel créneau vous conviendrait ? (ex : lundi matin, jeudi 14h...)',
    askSeats: (remaining) =>
      remaining != null ? `Combien de places souhaitez-vous ? (${remaining} restantes)` : 'Combien de places souhaitez-vous ?',
    askExtra: (field) => `Pouvez-vous me donner votre ${field} ?`,
    recap: '✅ Voici le récapitulatif de votre commande :',
    recapConfirm: 'Est-ce que tout est correct ? Répondez "oui" pour confirmer ou "non" pour annuler.',
    confirmed: '🎉 Merci ! Votre commande a bien été confirmée. Notre équipe vous contactera bientôt.',
    cancelled: "D'accord, votre commande a été annulée. N'hésitez pas à revenir ! 😊",
    humanHandoff: "D'accord, je vous mets en relation avec un membre de notre équipe. Un instant svp 🙏",
    outOfStock: (name) => `Désolé, "${name}" vient de se retrouver en rupture de stock 😔 Souhaitez-vous choisir un autre produit ?`,
    cartReminder: (name) =>
      name
        ? `Vous avez laissé une commande en cours pour "${name}" 🛍️ Elle vous intéresse toujours ? Répondez "oui" pour continuer, ou dites-le-moi si vous avez changé d'avis.`
        : `Vous aviez commencé une commande chez nous 🛍️ Ça vous intéresse toujours ? Répondez "oui" pour reprendre là où on s'était arrêtés.`,
    availableYes: (name, price, currency) => `Oui, "${name}" est disponible ✅ (${price} ${currency}). Vous souhaitez le commander ?`,
    availableNo: (name) => `Désolé, "${name}" est en rupture de stock pour le moment 😔`,
    availabilityAmbiguous: (names) => `Plusieurs produits pourraient correspondre : ${names.join(', ')}. Lequel voulez-vous dire ?`,
    availabilityNotFound: "Désolé, je n'ai pas trouvé ce produit dans notre catalogue. Pouvez-vous préciser son nom ?",
    availabilityNeedsProduct: 'Quel produit voulez-vous que je vérifie ?',
    availabilityLookupFailed: "Désolé, je n'arrive pas à identifier ce produit pour le moment. Pouvez-vous m'indiquer son nom ?",
    labelProduct: 'Produit',
    labelSize: 'Taille',
    labelColor: 'Couleur',
    labelPrice: 'Prix',
    labelName: 'Nom',
    labelPhone: 'Téléphone',
    labelWilaya: 'Wilaya',
    labelDelivery: 'Livraison',
    labelAddress: 'Adresse',
    deliveryHome: 'Domicile',
    deliveryRelay: 'Point de retrait',
  },
  ar: {
    welcome: 'مرحباً ! 😊 أنا هنا لمساعدتك في تقديم طلبك.',
    askProduct: (list) => `إليك منتجاتنا المتاحة :\n${list}\n\nأيها يعجبك؟`,
    askProductShort: 'أي من منتجاتنا يعجبك؟',
    askSize: (opts) => `ما المقاس الذي تريده؟ الخيارات : ${opts}`,
    askColor: (opts) => `ما اللون الذي تريده؟ الخيارات : ${opts}`,
    askName: 'ما اسمك الكامل؟',
    askPhone: 'ما رقم هاتفك؟',
    askWilaya: 'في أي ولاية أنت؟',
    askDelivery: 'هل تفضل التوصيل للمنزل أم نقطة الاستلام؟',
    askAddressHome: 'ممتاز! ما عنوانك الكامل؟ (الشارع، الحي والبلدية)',
    askAddressRelay: 'حسناً! ما هي مدينة وبلدية مكتب الاستلام؟',
    askSlot: 'ما هو الموعد الذي يناسبك؟ (مثلاً: الاثنين صباحاً)',
    askSeats: (remaining) => (remaining != null ? `كم عدد الأماكن التي تريدها؟ (متبقي ${remaining})` : 'كم عدد الأماكن التي تريدها؟'),
    askExtra: (field) => `هل يمكنك إعطائي ${field}؟`,
    recap: '✅ ملخص طلبك :',
    recapConfirm: 'هل كل شيء صحيح؟ أجب بـ "نعم" للتأكيد أو "لا" للإلغاء.',
    confirmed: '🎉 شكراً! تم تأكيد طلبك. سيتصل بك فريقنا قريباً.',
    cancelled: 'حسناً، تم إلغاء طلبك. لا تتردد في العودة! 😊',
    humanHandoff: 'حسناً، سأحولك إلى أحد أعضاء فريقنا. لحظة من فضلك 🙏',
    outOfStock: (name) => `عذراً، "${name}" نفدت كميته للتو من المخزون 😔 هل تريد اختيار منتج آخر؟`,
    cartReminder: (name) =>
      name
        ? `تركت طلبية لم تكتمل بخصوص "${name}" 🛍️ ما زلت مهتماً؟ أجب بـ "نعم" للمتابعة، أو أخبرني إذا غيرت رأيك.`
        : `كنت قد بدأت طلبية عندنا 🛍️ ما زلت مهتماً؟ أجب بـ "نعم" لمتابعة من حيث توقفنا.`,
    availableYes: (name, price, currency) => `نعم، "${name}" متوفر ✅ (${price} ${currency}). هل تريد طلبه؟`,
    availableNo: (name) => `عذراً، "${name}" غير متوفر حالياً 😔`,
    availabilityAmbiguous: (names) => `عدة منتجات قد تتطابق : ${names.join('، ')}. أيها تريد؟`,
    availabilityNotFound: 'عذراً، لم أجد هذا المنتج في كتالوجنا. هل يمكنك تحديد اسمه؟',
    availabilityNeedsProduct: 'أي منتج تريد أن أتحقق منه؟',
    availabilityLookupFailed: 'عذراً، لا أستطيع تحديد هذا المنتج الآن. هل يمكنك إعطائي اسمه؟',
    labelProduct: 'المنتج',
    labelSize: 'المقاس',
    labelColor: 'اللون',
    labelPrice: 'السعر',
    labelName: 'الاسم',
    labelPhone: 'الهاتف',
    labelWilaya: 'الولاية',
    labelDelivery: 'التوصيل',
    labelAddress: 'العنوان',
    deliveryHome: 'المنزل',
    deliveryRelay: 'نقطة الاستلام',
  },
  darija: {
    welcome: 'مرحبا ! 😊 أنا هنا باش نعاونك تدير الطلب ديالك.',
    askProduct: (list) => `هاذو هوما المنتجات المتاحين :\n${list}\n\nواش يعجبك؟`,
    askProductShort: 'أشمن منتج عجبك؟',
    askSize: (opts) => `شحال تحب القياس؟ الخيارات : ${opts}`,
    askColor: (opts) => `شحال تحب اللون؟ الخيارات : ${opts}`,
    askName: 'شنو اسمك الكامل؟',
    askPhone: 'شنو رقم تيليفونك؟',
    askWilaya: 'فين أنت؟ قول الولاية.',
    askDelivery: 'تحب التوصيل للدار ولا نقطة استلام؟',
    askAddressHome: 'واخا! شنو عنوانك الكامل؟ (الزنقة، الحومة والبلدية)',
    askAddressRelay: 'واخا! شنو هي المدينة والبلدية ديال نقطة الاستلام؟',
    askSlot: 'أشمن وقت يناسبك؟ (مثلاً: الاثنين الصباح)',
    askSeats: (remaining) => (remaining != null ? `شحال بغيتي بلاصة؟ (باقي ${remaining})` : 'شحال بغيتي بلاصة؟'),
    askExtra: (field) => `واش تقدر تعطيني ${field}؟`,
    recap: '✅ هاذا ملخص الطلب ديالك :',
    recapConfirm: 'كلشي صح؟ جاوب بـ "واه" باش تأكد ولا "لا" باش تلغي.',
    confirmed: '🎉 شكراً! الطلب ديالك تأكد. الفريق ديالنا غيتصل بيك قريب.',
    cancelled: 'واخا، الطلب ديالك تلغى. ما تتردد ترجع! 😊',
    humanHandoff: 'واخا، غادي نحولك لواحد من الفريق ديالنا. لحظة عافاك 🙏',
    outOfStock: (name) => `سماح ليا، "${name}" سالات الكمية ديالو دابا 😔 واش تحب تختار منتج آخر؟`,
    cartReminder: (name) =>
      name
        ? `خليتي طلبية ماكملتيهاش على "${name}" 🛍️ مازال معجبك؟ جاوب بـ "واه" باش تكمل، ولا قوليها إذا بدلتي رايك.`
        : `كنتي بديتي طلبية عندنا 🛍️ مازال معجباك؟ جاوب بـ "واه" باش تكمل من فين وقفنا.`,
    availableYes: (name, price, currency) => `واه، "${name}" كاين ✅ (${price} ${currency}). واش تحب تطلبو؟`,
    availableNo: (name) => `سماح ليا، "${name}" ماكانش دابا 😔`,
    availabilityAmbiguous: (names) => `كاين بزاف منتجات يمكن يتوافقو : ${names.join('، ')}. أشمن واحد بغيتي؟`,
    availabilityNotFound: 'سماح ليا، ماكاينش هاد المنتج فالكاطالوغ ديالنا. واش تقدر تعطيني سميتو؟',
    availabilityNeedsProduct: 'أشمن منتج بغيتي نتأكد منو؟',
    availabilityLookupFailed: 'سماح ليا، مانقدرش نتأكد من هاد المنتج دابا. واش تقدر تعطيني سميتو؟',
    labelProduct: 'المنتج',
    labelSize: 'القياس',
    labelColor: 'اللون',
    labelPrice: 'الثمن',
    labelName: 'الاسم',
    labelPhone: 'التيليفون',
    labelWilaya: 'الولاية',
    labelDelivery: 'التوصيل',
    labelAddress: 'العنوان',
    deliveryHome: 'الدار',
    deliveryRelay: 'نقطة الاستلام',
  },
  en: {
    welcome: "Hello! 😊 I'm here to help you place your order.",
    askProduct: (list) => `Here are our available products:\n${list}\n\nWhich one interests you?`,
    askProductShort: 'Which of our products interests you?',
    askSize: (opts) => `Which size would you like? Options: ${opts}`,
    askColor: (opts) => `Which color would you like? Options: ${opts}`,
    askName: 'What is your full name?',
    askPhone: 'What is your phone number?',
    askWilaya: 'Which wilaya are you in?',
    askDelivery: 'Do you prefer home delivery or pickup point?',
    askAddressHome: 'Great! What is your full address? (street, neighborhood and municipality)',
    askAddressRelay: 'Got it! What is the city and municipality of your pickup point?',
    askSlot: 'What time slot works for you? (e.g. Monday morning, Thursday 2pm...)',
    askSeats: (remaining) => (remaining != null ? `How many seats would you like? (${remaining} remaining)` : 'How many seats would you like?'),
    askExtra: (field) => `Can you give me your ${field}?`,
    recap: '✅ Here is your order summary:',
    recapConfirm: 'Is everything correct? Reply "yes" to confirm or "no" to cancel.',
    confirmed: '🎉 Thank you! Your order has been confirmed. Our team will contact you soon.',
    cancelled: 'Okay, your order has been cancelled. Feel free to come back! 😊',
    humanHandoff: "Sure, I'll connect you with a member of our team. One moment please 🙏",
    outOfStock: (name) => `Sorry, "${name}" just went out of stock 😔 Would you like to choose another product?`,
    cartReminder: (name) =>
      name
        ? `You left an order in progress for "${name}" 🛍️ Still interested? Reply "yes" to continue, or let me know if you changed your mind.`
        : `You started an order with us earlier 🛍️ Still interested? Reply "yes" to pick up where we left off.`,
    availableYes: (name, price, currency) => `Yes, "${name}" is available ✅ (${price} ${currency}). Would you like to order it?`,
    availableNo: (name) => `Sorry, "${name}" is currently out of stock 😔`,
    availabilityAmbiguous: (names) => `A few products could match: ${names.join(', ')}. Which one did you mean?`,
    availabilityNotFound: "Sorry, I couldn't find that product in our catalog. Could you tell me its name?",
    availabilityNeedsProduct: 'Which product would you like me to check?',
    availabilityLookupFailed: "Sorry, I can't identify that product right now. Could you give me its name?",
    labelProduct: 'Product',
    labelSize: 'Size',
    labelColor: 'Color',
    labelPrice: 'Price',
    labelName: 'Name',
    labelPhone: 'Phone',
    labelWilaya: 'Wilaya',
    labelDelivery: 'Delivery',
    labelAddress: 'Address',
    deliveryHome: 'Home',
    deliveryRelay: 'Pickup point',
  },
}

export function getTemplate(lang: string): Template {
  return TEMPLATES[lang] ?? TEMPLATES['fr']
}
