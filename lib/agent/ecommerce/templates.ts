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
  askExtra: (field: string) => string
  recap: string
  recapConfirm: string
  confirmed: string
  cancelled: string
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
    askExtra: (field) => `Pouvez-vous me donner votre ${field} ?`,
    recap: '✅ Voici le récapitulatif de votre commande :',
    recapConfirm: 'Est-ce que tout est correct ? Répondez "oui" pour confirmer ou "non" pour annuler.',
    confirmed: '🎉 Merci ! Votre commande a bien été confirmée. Notre équipe vous contactera bientôt.',
    cancelled: "D'accord, votre commande a été annulée. N'hésitez pas à revenir ! 😊",
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
    askExtra: (field) => `هل يمكنك إعطائي ${field}؟`,
    recap: '✅ ملخص طلبك :',
    recapConfirm: 'هل كل شيء صحيح؟ أجب بـ "نعم" للتأكيد أو "لا" للإلغاء.',
    confirmed: '🎉 شكراً! تم تأكيد طلبك. سيتصل بك فريقنا قريباً.',
    cancelled: 'حسناً، تم إلغاء طلبك. لا تتردد في العودة! 😊',
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
    askExtra: (field) => `واش تقدر تعطيني ${field}؟`,
    recap: '✅ هاذا ملخص الطلب ديالك :',
    recapConfirm: 'كلشي صح؟ جاوب بـ "واه" باش تأكد ولا "لا" باش تلغي.',
    confirmed: '🎉 شكراً! الطلب ديالك تأكد. الفريق ديالنا غيتصل بيك قريب.',
    cancelled: 'واخا، الطلب ديالك تلغى. ما تتردد ترجع! 😊',
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
    askExtra: (field) => `Can you give me your ${field}?`,
    recap: '✅ Here is your order summary:',
    recapConfirm: 'Is everything correct? Reply "yes" to confirm or "no" to cancel.',
    confirmed: '🎉 Thank you! Your order has been confirmed. Our team will contact you soon.',
    cancelled: 'Okay, your order has been cancelled. Feel free to come back! 😊',
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
