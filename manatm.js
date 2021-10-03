const puppeteer = require('puppeteer');
const fs = require('fs');
const yargs = require('yargs');

(async() =>{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const argv = yargs
    .command('*', 'A tool to parsing your Mandiri Account Bank!', {
        kode: {
            description: 'the unique kode in the back of your transactions',
            alias: 'k',
            type: 'string',
        }
    })
    .version('0.1')
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    .argv;

    await page.goto('https://ibank.bankmandiri.co.id/retail3/secure/pcash/retail/account/portfolio/skeleton');
    
    if(await page.$('frame[name="mainFrame"]') !== null){
        await page.goto('https://ibank.bankmandiri.co.id/retail3/loginfo/loginRequest');
        await page.type('#userid_sebenarnya', 'yusferdi02');
        await page.type('#pwd_sebenarnya', 'Acitya1001');
        await page.click('#btnSubmit');
    }

    await page.waitForTimeout(6000);
    await page.screenshot({ path : 'tes2.png'});

    if(await page.$('#currentId-1010010929253') !== null){
        await page.click('#currentId-1010010929253');
        await page.waitForTimeout(5000);
        await page.click('#fromDate');
        await page.waitForTimeout(1000);
        await page.screenshot({ path : 'tes3.png'});
        await page.click('#ui-datepicker-div table tbody tr:nth-child(1) td:nth-child(1) a');
        await page.click('#btnSearch');
        await page.waitForTimeout(5000);
        await page.screenshot({ path : 'tes.png'});
        const kode_unik = argv.kode || '000';

        const list = await page.evaluate((kode_unik) => {
            kode_unik = kode_unik + '.00';
            let data = [];

            const list = document.querySelectorAll('#globalTable tbody tr');
            for(const tr of list) {
                const tanggal = tr.querySelector('td.trxdate.upper').innerText.trim();
                const transaksi = tr.querySelector('td.desc').innerText.trim();
                const debit = tr.querySelector('td:nth-child(3)').innerText.trim();
                const kredit = tr.querySelector('td:nth-child(4)').innerText.trim();
                const kredit2 = kredit.split(',');

                if(kredit !== '-'){
                    if(kredit2[kredit2.length - 1] == kode_unik) {
                        data.push({
                            'Tanggal': tanggal,
                            'Transaksi': transaksi,
                            'Debit': debit,
                            'Kredit': kredit
                        });
                    }
                };
            };

            return data;
        }, kode_unik);

        console.log(list);
        fs.writeFile('dataJson.json', JSON.stringify(list), function(err){
            if(err){
                console.log('Creating data transactions failed!');
            } else {
                console.log('Data transactions saved!');
            }
        });
    };

    await page.goto('https://ibank.bankmandiri.co.id/retail3/loginfo/logout');
    await page.waitForTimeout(5000);
    await browser.close();
})()
