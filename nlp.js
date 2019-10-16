const ATTRIBUTE_RULES = {
    DIRECTION: 'buy|sell',
    QUANTITY: '\d+mm',
    TICKER: '[A-Z]+',
    COUPON: '\d+.?\d*',
    MATURITY: '\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})',
    ISIN: '[A-Z\d]{12}',
    PRICE: 'at|@\s+(\d+.?\d*)'
};

const INSTRUMENT_RULES = {
    BOND_RULE: `(${ATTRIBUTE_RULES.TICKER})\s+(${ATTRIBUTE_RULES.COUPON})\s+(${ATTRIBUTE_RULES.MATURITY})`,
    ISIN_RULE: `(${ATTRIBUTE_RULES.ISIN})`
}

export const nlp = (input) => {
    const parts = NLP_RULE.exec(input);
    if (!parts.length) return;

    return {
        direction: parts[1],
        quantity: parts[2],
        isin: parts[4],
        ticker: parts[5],
        coupon: parts[6],
        maturity: parts[7],
        price: parts[10]
    };
}

const NLP_RULE = new RegExp(".*" //start cound by any white space
    , `(${ATTRIBUTE_RULES.DIRECTION})\s+` // direction
    , `((${ATTRIBUTE_RULES.QUANTITY})\s+)?` // optional quantity
    , `(${INSTRUMENT_RULES.BOND_RULE}|${INSTRUMENT_RULES.ISIN_RULE})\s+` // either a bond or an ISIN
    , `(${ATTRIBUTE_RULES.PRICE})?`, 'g'); // Price
