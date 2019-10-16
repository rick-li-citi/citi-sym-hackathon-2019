const ATTRIBUTE_RULES = {
    DIRECTION: 'buy|sell',
    QUANTITY: '\\d+mm',
    TICKER: '[A-Z]+',
    COUPON: '\\d+.?\\d*',
    MATURITY: '\\d{1,2}\\/\\d{1,2}\\/(\\d{4}|\\d{2})',
    ISIN: '[A-Z\\d]{12}',
    PRICE: '(at|@)\\s+(\\d+.?\\d*)'
};

const INSTRUMENT_RULES = {
    BOND_RULE: `(${ATTRIBUTE_RULES.TICKER})\\s+(${ATTRIBUTE_RULES.COUPON})\\s+(${ATTRIBUTE_RULES.MATURITY})`,
    ISIN_RULE: `(${ATTRIBUTE_RULES.ISIN})`
}

const getQuantityValue = (quantityString) => {
    const suffixMultiplierMapping = {
        k: 1e3,
        m: 1e6,
        mm: 1e6,
        b: 1e9,
    }
    const regexResult = /(\d+\.?\d*)(mm|m|k|b)/g.exec(quantityString);

    return Number.parseFloat(regexResult[1]) * suffixMultiplierMapping[regexResult[2]];
}

const nlp = (input) => {
    const parts = createNLPRule().exec(input);
    if (!parts || !parts.length) return;

    return {
        clientDirection: parts[1],
        quantity: getQuantityValue(parts[2]),
        isin: parts[9],
        ticker: parts[5],
        coupon: parts[6],
        maturity: parts[7],
        price: parts[12]
    };
}

const createNLPRule = () => new RegExp(".*" //start cound by any white space
    + `(${ATTRIBUTE_RULES.DIRECTION})\\s+` // direction
    + `((${ATTRIBUTE_RULES.QUANTITY})\\s+)?` // optional quantity
    + `(${INSTRUMENT_RULES.BOND_RULE}|${INSTRUMENT_RULES.ISIN_RULE})` // either a bond or an ISIN
    + `(\\s+${ATTRIBUTE_RULES.PRICE})?.*`, 'g'); // Price

module.exports = nlp;