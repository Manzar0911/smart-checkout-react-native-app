const https = require('https');

const items = {
    'lays-potato-chips-indias-magic-masala': 'https://www.bigbasket.com/pd/266579/lays-potato-chips-indias-magic-masala-25-g/',
    'haldirams-namkeen-aloo-bhujia': 'https://www.bigbasket.com/pd/10000109/haldirams-namkeen-aloo-bhujia-400-g-pouch/',
    'kurkure-namkeen-masala-munch': 'https://www.bigbasket.com/pd/266580/kurkure-namkeen-masala-munch-20-g/',
    'britannia-nutrichoice-digestive-high-fibre-biscuits': 'https://www.bigbasket.com/pd/10002127/britannia-nutrichoice-digestive-high-fibre-biscuits-250-g/',
    'bingo-mad-angles-achaari-masti': 'https://www.bigbasket.com/pd/40073236/bingo-mad-angles-achaari-masti-130-g/',
    'bikaji-diet-mixture': 'https://www.bigbasket.com/pd/1205391/bikaji-diet-mixture-500-g-pouch/',
    'karachi-bakery-khara-biscuit': 'https://www.bigbasket.com/pd/40103233/karachi-bakery-khara-biscuit-400-g-box/',
    'makhana': 'https://www.bigbasket.com/pd/40110304/mr-makhana-roasted-makhana-pudina-pudina-100-g-pouch/'
};

Object.entries(items).forEach(([key, url]) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
            const match = raw.match(/<meta property="og:image" content="([^"]+)"/);
            if (match) {
                console.log(key + ': ' + match[1]);
            } else {
                console.log(key + ': NO IMAGE');
            }
        });
    });
});
