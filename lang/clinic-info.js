/* Extra facts the AI assistant knows about the clinic (it also reads every text on the site automatically:
   services, offers, hours, FAQ, doctor, certificates, reviews, implant steps).
   Add anything else here, in plain sentences. The assistant will NOT invent prices or facts that are not written
   on the site or here, so the more you add, the smarter it gets. Keep each language in its own list. */
window.CLINIC_INFO = {
  en: [
    'The clinic is run by Dr. Ahmed El-Sayed, dental specialist, in Mansoura, Dakahlia, Egypt.',
    'Sterilization: instruments are sterilized between patients and single-use items are thrown away after each visit.',
    'Payment: ask the reception about payment methods and instalments.'
    // 'Example: Whitening session costs ...   (add real prices only if the clinic wants them shown)',
    // 'Example: We accept Visa and Instapay.',
  ],
  ar: [
    'العيادة بيديرها د. أحمد السيد، أخصائي أسنان، في المنصورة، الدقهلية، مصر.',
    'التعقيم: الأدوات بتتعقم بين كل مريض، والأدوات اللي بتُستخدم مرة واحدة بتترمي بعد كل زيارة.',
    'الدفع: اسأل الاستقبال عن طرق الدفع والتقسيط.'
    // 'مثال: جلسة التبييض سعرها ...   (ضيف أسعار حقيقية فقط لو العيادة عايزة تظهرها)',
    // 'مثال: بنقبل فيزا وإنستا باي.',
  ]
};
