/**
 * Configuration for Indian IT companies to scrape
 */

export interface CompanyConfig {
  name: string;
  moneyControlSlug: string;
  moneyControlUrl: string;
}

export const COMPANIES: CompanyConfig[] = [
  {
    name: 'TCS',
    moneyControlSlug: 'tataconsultancyservices',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/tataconsultancyservices-TCS/'
  },
  {
    name: 'Persistent',
    moneyControlSlug: 'persistentsystems',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/persistentsystems-PS01/'
  },
  {
    name: 'Tech Mahindra',
    moneyControlSlug: 'techmahindra',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/techmahindra-TM4/'
  },
  {
    name: 'Cyient',
    moneyControlSlug: 'cyient',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/cyient-C/'
  },
  {
    name: 'Infosys',
    moneyControlSlug: 'infosys',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/infosys-IT/'
  },
  {
    name: 'LTIMindtree',
    moneyControlSlug: 'ltimindtree',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/ltimindtree-LTI01/'
  },
  {
    name: 'Wipro',
    moneyControlSlug: 'wipro',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/wipro-W/'
  },
  {
    name: 'L&T Technology Services',
    moneyControlSlug: 'lttechnologyservices',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/lttechnologyservices-LTS/'
  },
  {
    name: 'Coforge',
    moneyControlSlug: 'coforge',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/coforge-NI3/'
  },
  {
    name: 'Mphasis',
    moneyControlSlug: 'mphasis',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/mphasis-M02/'
  },
  {
    name: 'Zensar',
    moneyControlSlug: 'zensartechnologies',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/zensartechnologies-ZT/'
  },
  {
    name: 'Hexaware',
    moneyControlSlug: 'hexawaretechnologies',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/hexawaretechnologies-HT06/'
  },
  {
    name: 'Birlasoft',
    moneyControlSlug: 'birlasoft',
    moneyControlUrl: 'https://www.moneycontrol.com/markets/financials/quarterly-results/birlasoft-BS15/'
  }
];

export const COMPANY_NAMES = COMPANIES.map(c => c.name);
