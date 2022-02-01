const promoType = [
  {
    promoName: 'NO_PROMO',
    REG: {
      discount: 0,
    },
    BC: {
      discount: 0,
    },
  },
  {
    promoName: 'SOFT_LAUNCH',
    REG: {
      discount: 100,
    },
    BC: {
      discount: 0,
    },
  },
  {
    promoName: 'HALF_THE_PRICE',
    REG: {
      discount: 50,
    },
    BC: {
      discount: 50,
    },
  },
];

exports.promoType = promoType;
