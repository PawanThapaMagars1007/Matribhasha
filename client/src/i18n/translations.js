export const interfaceLanguages = Object.freeze({ en: 'English', ne: 'नेपाली' });

const messages = {
  en: {
    'nav.Overview':'Overview','nav.My languages':'My languages','nav.Courses':'Courses','nav.Characters':'Characters','nav.Vocabulary':'Vocabulary','nav.Dictionary':'Dictionary','nav.Grammar':'Grammar','nav.Sentences':'Sentences','nav.Listening':'Listening','nav.Speaking':'Speaking','nav.Conversations':'Conversations','nav.Culture & stories':'Culture & stories','nav.Communities':'Communities','nav.Discussions':'Discussions','nav.Contribute':'Contribute','nav.My community':'My community','nav.AI tutor':'AI tutor','nav.Culture review':'Culture review','nav.Course admin':'Course admin','nav.Settings':'Settings','nav.Explore languages':'Explore languages','section.your-space':'YOUR SPACE','section.discover':'DISCOVER','section.overview':'Overview','action.sign-out':'Sign out','quote.text':'Every language carries a world within it.','quote.caption':'A thought to learn by','language.english':'English','language.nepali':'Nepali','pwa.update':'A Matribhasha update is ready.','pwa.action':'Update now','action.close':'Dismiss update notice','loading.app':'Opening your learning space…'
  },
  ne: {
    'nav.Overview':'अवलोकन','nav.My languages':'मेरा भाषाहरू','nav.Courses':'पाठ्यक्रम','nav.Characters':'अक्षरहरू','nav.Vocabulary':'शब्दभण्डार','nav.Dictionary':'शब्दकोश','nav.Grammar':'व्याकरण','nav.Sentences':'वाक्यहरू','nav.Listening':'सुन्ने अभ्यास','nav.Speaking':'बोल्ने अभ्यास','nav.Conversations':'कुराकानी','nav.Culture & stories':'संस्कृति र कथाहरू','nav.Communities':'समुदायहरू','nav.Discussions':'छलफल','nav.Contribute':'योगदान','nav.My community':'मेरो समुदाय','nav.AI tutor':'एआई शिक्षक','nav.Culture review':'संस्कृति समीक्षा','nav.Course admin':'पाठ्यक्रम व्यवस्थापन','nav.Settings':'सेटिङहरू','nav.Explore languages':'भाषाहरू खोज्नुहोस्','section.your-space':'तपाईंको ठाउँ','section.discover':'खोज्नुहोस्','section.overview':'अवलोकन','action.sign-out':'साइन आउट','quote.text':'हरेक भाषाभित्र एउटा संसार हुन्छ।','quote.caption':'सिकाइका लागि एउटा विचार','language.english':'अङ्ग्रेजी','language.nepali':'नेपाली','pwa.update':'मातृभाषाको नयाँ संस्करण उपलब्ध छ।','pwa.action':'अद्यावधिक गर्नुहोस्','action.close':'अद्यावधिक सूचना बन्द गर्नुहोस्','loading.app':'तपाईंको सिकाइ स्थान खोलिँदैछ…'
  }
};

export function translate(key, language = 'en') { return messages[language]?.[key] || messages.en[key] || key; }
export function translationCompleteness(language) {
  const source = Object.keys(messages.en);
  const translated = source.filter((key) => Boolean(messages[language]?.[key])).length;
  return { translated, total: source.length, complete: translated === source.length };
}
