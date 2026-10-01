/**
 * Dados da empresa. Fonte: docs/copy.md (rodapé) e PROJETO.md.
 * `null` = ainda não confirmado com o dono; a página mostra o placeholder entre colchetes.
 */
export const SITE = {
  name: "Rapé Xingu",
  slogan: "O rapé do índio",
  legalName: "Fumopil Indústria e Comércio LTDA",
  cnpj: "34.565.939/0001-15",
  address: {
    street: "Rua 5-A, Qd. 322, Lt. 16, Morada Nova",
    city: "Alexânia",
    region: "GO",
    postalCode: "72930-000",
    country: "BR",
  },
  /** O formulário de revenda e os botões de WhatsApp abrem o número principal. */
  whatsapp: {
    main: { e164: "5562994775811", label: "(62) 99477-5811" },
    alt: { e164: "5561981304906", label: "(61) 98130-4906" },
  },
  email: "tabacosxingu@gmail.com",
  social: {
    instagram: null as string | null,
    facebook: null as string | null,
  },
} as const;

export const ADDRESS_LINE = `${SITE.address.street}, ${SITE.address.city} – ${SITE.address.region}, ${SITE.address.postalCode}`;
