export const billingYear = new Date().getFullYear() - 1;

export const propertyData = {
  name: "E2E Musterobjekt",
  street: "Musterstraße 12",
  zip: "12345",
  city: "Beispielstadt",
};

export const landlordData = {
  name: "Anna Beispiel",
  street: "Musterstraße 12",
  zip: "12345",
  city: "Beispielstadt",
  email: "e2e@example.invalid",
};

export const tenantData = {
  anna: {
    unit: "EG links",
    name: "Anna Beispiel",
    from: `${billingYear}-01-01`,
    to: `${billingYear}-12-31`,
    persons: "1",
    prepayment: "100,00",
    street: "Musterweg 1",
    zip: "12345",
    city: "Beispielstadt",
  },
  bernd: {
    unit: "OG rechts",
    name: "Bernd Muster",
    from: `${billingYear}-01-01`,
    to: `${billingYear}-12-31`,
    persons: "2",
    prepayment: "50,00",
    street: "Musterweg 2",
    zip: "12345",
    city: "Beispielstadt",
  },
} as const;
