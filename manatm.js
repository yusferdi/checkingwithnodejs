//Import all we need
const puppeteer      = require('puppeteer');
const yargs          = require('yargs');
const fs = require('fs');

(async() =>{
    //Constant variables for puppeteer
    const browser    = await puppeteer.launch();
    const page       = await browser.newPage();

    //Constant variables for URI
    const siteURI    = 'https://ibank.bankmandiri.co.id/retail3/';
    const loginPage  = siteURI + 'loginfo/loginRequest';
    const dashboard  = siteURI + 'secure/pcash/retail/account/portfolio/skeleton';
    const logout     = siteURI + 'loginfo/logout';

    //Constant variables for input login
    const userName   = 'yusferdi02';
    const passWord   = 'Acitya1001';

    //Constant variables for waiting timeout
    const longTimes  = 6000;
    const ShortTimes = 1000;

    //Constant variables for login page
    const mainFrame  = 'frame[name="mainFrame"]';
    const fieldUser  = '#userid_sebenarnya';
    const fieldPass  = '#pwd_sebenarnya';
    const btnSubmit  = '#btnSubmit';

    //Constant variables for dashboard page
    const btnMyCard  = '#currentId-1010010929253';
    const btnForDate = '#fromDate';
    const pickerDate = '#ui-datepicker-div table tbody tr:nth-child(1) td:nth-child(1) a';
    const btnSearch  = '#btnSearch';

    //Constant variables for screenshot
    const extforSS   = '.png';
    const pathSS1    = 'login' + extforSS;
    const pathSS2    = 'dashboard' + extforSS;
    const pathSS3    = 'dataTransaction' + extforSS;

    //Constant variables for argv
    const argv           = yargs
                     .command('*', 'A parser tool to parse bank Mandiri data transactions.', {
                         code: {
                             description: 'A unique code to sort transactions based on the last digit of the nominal in your transaction.',
                             alias: 'c',
                             type: 'string'
                         },
                         keyword: {
                             description: 'A keyword to sort transactions based on your transaction description.',
                             alias: 'w',
                             type: 'string'
                         },
                         account: {
                            description: 'Sort your transactions by credit or debit options (0 for kredit and 1 for debit).',
                            alias: 'a',
                            type: 'integer'
                         }
                     })
                     .version('0.1')
                     .alias('version', 'v')
                     .help()
                     .alias('help', 'h')
                     .argv;
    const uniqueCode  = argv.code;
    const keyword    = argv.keyword;
    const selectAccs = argv.account;

    //Function for store data to file
    function saveData( fileName, data ) {
        fs.writeFile( fileName, JSON.stringify( data ), ( error ) => {
            if( error ) console.log( 'Failed to store your data transaction.' );
            else console.log( 'Successfully store your data transaction.' );
        });
    }

    //Starting puppeteer
    await page.goto( dashboard );
    
    //This code for login
    if( await page.$( mainFrame ) !== null ) {
        await page.goto(  loginPage );
        await page.type(  fieldUser, userName );
        await page.type(  fieldPass, passWord );
        await page.click( btnSubmit );
    }

    //Screenshot after login
    await page.waitForTimeout( longTimes );
    await page.screenshot({ path : pathSS1 });

    //This code for parse
    if( await page.$( btnMyCard ) !== null ){
        console.log( 'Succesfully log into account.' )

        //This code for clicking into table transactions
        await page.click( btnMyCard );
        await page.waitForTimeout( longTimes );
        
        //This code for set Date which you want to parse
        await page.click( btnForDate );
        await page.waitForTimeout( ShortTimes );
        await page.screenshot({ path : pathSS2 });
        await page.click( pickerDate );
        await page.click( btnSearch );
        await page.waitForTimeout( longTimes );
        await page.screenshot({ path : pathSS3 });

        //This code for evaluate transactions
        const list      = await page.evaluate( ( uniqueCode, selectAccs, keyword ) => {
                            //Constant variables for table transactions
                            const selectorTr = '#globalTable tbody tr';
                            const selectDate = 'td.trxdate.upper';
                            const selectDesc = 'td.desc';
                            const selectDebt = 'td:nth-child(3)';
                            const selectKred = 'td:nth-child(4)';
                            let data         = [];
                            uniqueCode       = uniqueCode || '000';
                            uniqueCode      += '.00';

                            //Fetch all selectorTr
                            const list = document.querySelectorAll( selectorTr );

                            //Mapping tr
                            for ( const tr of list ) {
                                const date         = tr.querySelector( selectDate ).innerText.trim();
                                const transaction  = tr.querySelector( selectDesc ).innerText.trim();
                                const debit        = tr.querySelector( selectDebt ).innerText.trim();
                                const kredit       = tr.querySelector( selectKred ).innerText.trim();
                                const select       = ( selectAccs === 1 ) ? debit : kredit;
                                const selectSplit  = select.split(',');
                                const selectLength = selectSplit.length - 1;
                                const selected     = selectSplit[ selectLength ];
                                const UpTrans      = transaction.toUpperCase();
                                const UpWord       = ( keyword !== undefined ) ? keyword.toUpperCase() : undefined;

                                //Checking the contains of keyword
                                if ( keyword !== undefined && UpTrans.includes( UpWord ) === false ) continue;

                                //Checking the unique code
                                if ( select !== '-' && selected === uniqueCode ) {
                                    data.push({
                                        'Tanggal'   : date,
                                        'Transaksi' : transaction,
                                        'Debit'     : debit,
                                        'Kredit'    : kredit
                                    });
                                }
                            }

                            return data;
                        }, uniqueCode, selectAccs, keyword );

        console.log('\n');
        console.log('Printing your sorted transaction(s).');
        console.log( list );

        //This code for save JSON to file
        console.log( saveData( 'storedData.json', list ) );
    } else {
        console.log( 'Failed to log into account.' );
    }

    //This code for logout from Bank Mandiri
    await page.goto( logout );
    await page.waitForTimeout( longTimes );
    await browser.close();
    console.log( 'Execution complete.' );
})();
