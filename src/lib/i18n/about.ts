import { COMPANY } from '../constants'

export const en = {
  'about.hero.title': 'About Us',
  'about.hero.subtitle': `${COMPANY.nbfiraLicense} · Short-term relief for daily financial shortfalls across Botswana.`,
  'about.proudlyBotswana': 'Proudly Botswana',
  'about.who.title': COMPANY.name,
  'about.tree.eyebrow': "What's in a name",
  'about.tree.title': 'Rooted in meaning',
  'about.tree.text':
    'Our story grows from a single Setswana word — follow it from its roots to what we offer today.',
  'about.values.eyebrow': 'What we stand for',
  'about.values.title': 'Our core values',
  'about.vision.title': 'Our Vision',
  'about.mission.title': 'Our Mission',
  'about.team.eyebrow': 'The people behind Mosasana',
  'about.team.title': 'Leadership Team',
  'about.leadership.principalOfficer': 'Principal Officer',
  'about.leadership.complianceOfficer': 'Compliance Officer',
  'about.banner.title': 'Proudly Botswana',
  'about.banner.text': `${COMPANY.shortName} is a Botswana business built to serve Batswana — providing accessible, responsible financial support to the communities we call home.`,
} as const

export const tn: Record<keyof typeof en, string> = {
  'about.hero.title': 'Ka Rona',
  'about.hero.subtitle': `${COMPANY.nbfiraLicense} · Thuso ya nakwana ya madi bakeng sa dikgwetlho tsa letsatsi le letsatsi mo Botswana.`,
  'about.proudlyBotswana': 'Re Itlotle Botswana',
  'about.who.title': COMPANY.name,
  'about.tree.eyebrow': 'Leina le bolelang eng',
  'about.tree.title': 'Re mo metsing ya bokao',
  'about.tree.text':
    'Pale ya rona e tswa mo lentšeng le le tee la Setswana — e latela go tswa mo metsing go ya go se re se neelang jaanong.',
  'about.values.eyebrow': 'Se re emetseng go sona',
  'about.values.title': 'Ditlhogo tsa rona tsa motheo',
  'about.vision.title': 'Pono ya Rona',
  'about.mission.title': 'Maikemišetšo a Rona',
  'about.team.eyebrow': 'Batho ba morago ga Mosasana',
  'about.team.title': 'Sehlopha sa Batsamaisi',
  'about.leadership.principalOfficer': 'Molaodi wa Motheo',
  'about.leadership.complianceOfficer': 'Molaodi wa Boikanyego',
  'about.banner.title': 'Re Itlotle Botswana',
  'about.banner.text': `${COMPANY.shortName} ke kgwebo ya Botswana e e agilweng go direla Batswana — go neela thuso ya madi e e kgonegang le e e ikanyegang ditšhabeng tse re di bitsang gae.`,
}
