// Supported languages for the robot avatar TTS
export interface RobotLanguage {
  code: string;
  name: string;
  nativeName: string;
  voicePattern: string; // Pattern to match speech synthesis voices
}

export const ROBOT_LANGUAGES: RobotLanguage[] = [
  { code: 'en-US', name: 'English', nativeName: 'English', voicePattern: 'en' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', voicePattern: 'hi' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', voicePattern: 'ta' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', voicePattern: 'es' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', voicePattern: 'fr' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', voicePattern: 'de' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', voicePattern: 'ja' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文', voicePattern: 'zh' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', voicePattern: 'ar' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', voicePattern: 'pt' },
];

export const DEFAULT_LANGUAGE = ROBOT_LANGUAGES[0];

// Feature explanation scripts in different languages
export const FEATURE_SCRIPTS: Record<string, Record<string, string>> = {
  'zynovexa-overview': {
    'en-US': `Welcome to Zynovexa! I'm your AI assistant. Zynovexa is an innovation platform that connects innovators, enterprises, and investors. You can submit your innovative solutions, discover problems that need solving, and connect with potential investors. Our platform features real-time messaging, comprehensive analytics, and a secure environment for collaboration. Let me know how I can help you get started!`,
    'hi-IN': `Zynovexa में आपका स्वागत है! मैं आपका AI सहायक हूं। Zynovexa एक इनोवेशन प्लेटफॉर्म है जो इनोवेटर्स, एंटरप्राइजेज और इन्वेस्टर्स को जोड़ता है। आप अपने इनोवेटिव सॉल्यूशंस सबमिट कर सकते हैं, समस्याओं की खोज कर सकते हैं, और संभावित निवेशकों से जुड़ सकते हैं।`,
    'es-ES': `¡Bienvenido a Zynovexa! Soy tu asistente de IA. Zynovexa es una plataforma de innovación que conecta innovadores, empresas e inversores. Puedes enviar tus soluciones innovadoras, descubrir problemas que necesitan solución y conectar con inversores potenciales.`,
    'ta-IN': `Zynovexa க்கு வரவேற்கிறோம்! நான் உங்கள் AI உதவியாளர். Zynovexa என்பது புத்தாக்கவாதிகள், நிறுவனங்கள் மற்றும் முதலீட்டாளர்களை இணைக்கும் ஒரு புத்தாக்க தளமாகும்.`,
  },
  'finops-automation': {
    'en-US': `Zynovexa FinOps Automation helps enterprises optimize their cloud spending and financial operations. Our AI-powered tools analyze your infrastructure costs, identify savings opportunities, and automate budget allocation. With real-time dashboards and predictive analytics, you can make data-driven decisions. We integrate with major cloud providers and provide actionable insights to reduce waste and maximize ROI.`,
    'hi-IN': `Zynovexa FinOps Automation एंटरप्राइजेज को उनके क्लाउड खर्च और वित्तीय संचालन को अनुकूलित करने में मदद करता है। हमारे AI-पावर्ड टूल्स आपकी इंफ्रास्ट्रक्चर लागत का विश्लेषण करते हैं और बचत के अवसर पहचानते हैं।`,
    'es-ES': `Zynovexa FinOps Automation ayuda a las empresas a optimizar sus gastos en la nube y operaciones financieras. Nuestras herramientas impulsadas por IA analizan los costos de infraestructura e identifican oportunidades de ahorro.`,
    'ta-IN': `Zynovexa FinOps Automation நிறுவனங்கள் தங்கள் கிளவுட் செலவுகளை மற்றும் நிதி செயல்பாடுகளை மேம்படுத்த உதவுகிறது.`,
  },
  'innovation-matching': {
    'en-US': `Our Innovation Matching feature uses advanced AI to connect problems with solutions. When enterprises post challenges, our algorithm analyzes requirements and matches them with relevant innovations in our database. Innovators get notified of opportunities that match their expertise. This smart matching reduces search time and increases successful collaborations by up to 60 percent.`,
    'hi-IN': `हमारी इनोवेशन मैचिंग फीचर उन्नत AI का उपयोग करके समस्याओं को समाधानों से जोड़ती है। जब एंटरप्राइजेज चुनौतियां पोस्ट करते हैं, हमारा एल्गोरिदम आवश्यकताओं का विश्लेषण करता है।`,
    'es-ES': `Nuestra función de Matching de Innovación utiliza IA avanzada para conectar problemas con soluciones. Cuando las empresas publican desafíos, nuestro algoritmo analiza los requisitos y los combina con innovaciones relevantes.`,
    'ta-IN': `எங்கள் புத்தாக்க பொருத்த அம்சம் மேம்பட்ட AI ஐப் பயன்படுத்தி பிரச்சனைகளை தீர்வுகளுடன் இணைக்கிறது.`,
  },
};

export const getFeatureScript = (featureId: string, languageCode: string): string => {
  const scripts = FEATURE_SCRIPTS[featureId];
  if (!scripts) {
    return FEATURE_SCRIPTS['zynovexa-overview']['en-US'];
  }
  
  // Return script in requested language or fallback to English
  return scripts[languageCode] || scripts['en-US'];
};
