import { COMPANY } from '../constants'

const regulatoryNotice = `${COMPANY.borrowingCaution} ${COMPANY.shortName} offers short-term loan products from ${COMPANY.loanAmountRangeLabel} with repayment terms from ${COMPANY.loanTermRange}, depending on customer eligibility. ${COMPANY.legalName} is a registered micro lender licensed and regulated by the ${COMPANY.regulator}. ${COMPANY.nbfiraLicense}. Incorporated in Botswana with the Companies & Intellectual Property Authority (registration ${COMPANY.companyRegistration}). Personal data is processed in accordance with Botswana's ${COMPANY.dataProtection.actReference} under the supervision of the ${COMPANY.dataProtection.regulator}.`

const regulatoryNoticeTn = `${COMPANY.borrowingCaution} ${COMPANY.shortName} e na le dikoloto tse kopana go tswa mo ${COMPANY.loanAmountRangeLabel} ka dinako tsa go busetsa madi go tswa mo ${COMPANY.loanTermRange}, go ya ka boikanyego jwa moreki. ${COMPANY.legalName} ke mokgweetsi wa dikoloto e o ngwaditsweng le o o laolwang ke ${COMPANY.regulator}. ${COMPANY.nbfiraLicense}. E ngwaditswe mo Botswana ke Companies & Intellectual Property Authority (ngwadišo ${COMPANY.companyRegistration}). Tshedimosetso ya motho e šomišwa go ya ka ${COMPANY.dataProtection.actReference} ya Botswana, e e laolwang ke ${COMPANY.dataProtection.regulator}.`

export const en = {
  'site.tagline': `${COMPANY.tagline}.`,
  'site.footer.license': COMPANY.nbfiraLicense,
  'site.regulatory.notice': regulatoryNotice,
} as const

export const tn: Record<keyof typeof en, string> = {
  'site.tagline': `${COMPANY.tagline} ya letsatsi le letsatsi.`,
  'site.footer.license': COMPANY.nbfiraLicense,
  'site.regulatory.notice': regulatoryNoticeTn,
}
