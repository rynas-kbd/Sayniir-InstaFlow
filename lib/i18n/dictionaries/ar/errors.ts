export const errors = {
  UNAUTHORIZED: 'المصادقة مطلوبة',
  FORBIDDEN: 'الوصول مرفوض',
  NOT_FOUND: 'العنصر المطلوب غير موجود',
  SERVER_ERROR: 'حدث خطأ ما',
  REQUIRED_FIELD: 'هذا الحقل مطلوب',
  FIELD_TOO_LONG: 'يتجاوز هذا الحقل الطول الأقصى المسموح به',
  FIELD_TOO_SHORT: 'هذا الحقل قصير جدًا',

  INTENT_REQUIRED: 'يرجى وصف نيتكم',
  INTENT_LENGTH_INVALID: 'يجب أن يتراوح طول النية بين حرف واحد و500 حرف',
  CHANNEL_ACCOUNT_ID_REQUIRED: 'الحساب مطلوب',
  RATE_LIMIT_SUGGESTIONS: 'عدد كبير جدًا من الاقتراحات، يرجى المحاولة بعد دقيقة',
  RULE_SUGGESTION_FAILED: 'تعذّر توليد اقتراح القاعدة',

  ACCOUNT_ID_REQUIRED: 'الحساب مطلوب',
  DISCOUNT_CODE_FIELDS_REQUIRED: 'الحساب والرمز مطلوبان',
  DISCOUNT_AMOUNT_REQUIRED: 'مطلوب تحديد نسبة خصم أو مبلغ خصم',
  DISCOUNT_CODE_CREATE_FAILED: 'تعذّر إنشاء رمز الخصم (قد يكون مستخدمًا بالفعل)',

  INVALID_BODY: 'محتوى الطلب غير صالح',
  NODES_EDGES_MUST_BE_ARRAYS: 'بنية سير العمل غير صالحة',
  TOO_MANY_NODES: 'يتجاوز سير العمل هذا العدد الأقصى المسموح به من العقد',
  TOO_MANY_EDGES: 'يتجاوز سير العمل هذا العدد الأقصى المسموح به من الروابط',
  TRIGGER_NODE_REQUIRED: 'يجب أن يحتوي سير العمل على عقدة تشغيل واحدة بالضبط',
  EXTERNAL_REQUEST_URL_INVALID: 'الرابط المُدخل لهذه العقدة غير صالح',
  FLOW_SAVE_FAILED: 'تعذّر حفظ سير العمل',

  INVALID_FROM_PARAM: 'المعامل "from" غير صالح',
  INVALID_TO_PARAM: 'المعامل "to" غير صالح',

  boundary: {
    title: 'تعذّر تحميل هذه الصفحة',
    description: 'حدث خطأ أثناء جلب بياناتك. يرجى إعادة المحاولة بعد قليل.',
    retry: 'إعادة المحاولة',
  },
}
