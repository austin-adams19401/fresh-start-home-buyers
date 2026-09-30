export const site = {
  name: 'Fresh Start Home Buyers',
  legalName: 'Adams Real Estate Holdings, LLC',
  owner: 'Austin Adams',
  phoneDisplay: '(385) 244-0881',
  phoneTel: '+13852440881',
  email: 'austin@adamsfreshstart.com',
  domain: 'adamsfreshstart.com',
  url: 'https://adamsfreshstart.com',
  city: 'Kaysville',
  area: 'Davis & Weber County, Utah',
  cities: ['Kaysville', 'Layton', 'Farmington', 'Syracuse', 'Clearfield', 'Ogden', 'Roy', 'Bountiful'],
  tagline: 'A fair offer and a fresh start.',
};

export const nav = [
  { href: '/sell-your-house/', label: 'Cash offer' },
  { href: '/creative-financing/', label: 'Creative financing' },
  { href: '/list-with-an-agent/', label: 'List with an agent' },
  { href: '/landlords/', label: 'Landlords' },
  { href: '/how-it-works/', label: 'How it works' },
  { href: '/about/', label: 'About' },
  { href: '/faq/', label: 'FAQ' },
];

export const situationOptions = [
  'Inherited home',
  'Behind on payments',
  'Divorce or life change',
  'Tired landlord / rental',
  'Needs major repairs',
  'Relocating / downsizing',
  'Just exploring',
] as const;

export const timelineOptions = ['ASAP', 'Within 30 days', '1 to 3 months', 'Just researching'] as const;
