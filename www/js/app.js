/**
 *  Form: UnLockWallet
 */
$(document).on('submit', '.iew_form__unlock_wallet', function(event) {
    event.preventDefault();

    var form = $(this),
        password = form.find('[name="password"]').val();

    if (!formCheck(form, iEtherWallet.json, "Wrong Keystore File.") ||
        !formCheck(form, iEtherWallet.provider, "Please choose a network."))
        return;

    iEtherWallet.unlockWallet(
        password,
        function(wallet){
            form.hide();
            form = $('.iew_form__send_ether_tokens.generate');
            form.show();
            form.find('.balance').text(ethers.utils.formatEther(wallet.balance));
            form.find('.transaction_count').text(wallet.transactionCount);
        }, function(error) {
            e = error.replace('Error:', '<strong>Error:</strong>');
            if (!/Error/.test(e))
                e = '<strong>Error:</strong> ' + e;

            form.find('.alert').attr('class', 'alert alert-danger').html(e).show()
                .stop().delay(3000).queue(function() {
                    form.find('input,button,textarea').prop('disabled', false);
                    $(this).hide();
                });
        }
    );
});



/* Select JSON File */
$(document).on('click', '.iew_form__unlock_wallet [name="select-file"]', function(event) {
    event.preventDefault();

    $(this).closest('form').find('[type="file"]').click();
});



/* Event */
$(document).on('change', '.iew_form__unlock_wallet [type="file"]', function(event) {
    var files = event.target.files;

    f = files[0];
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            $('.iew_form__unlock_wallet [name="select-file"]').text(files[0].name);
            
            iEtherWallet.json = e.target.result;
        };
    })(f);

    reader.readAsText(f);
});



/**
 *  Form: Create New Wallet
 */
$(document).on('submit', '.iew_form__create_new_wallet', function(event) {
    event.preventDefault();

    var form = $(this),
        done = $('.iew_form__create_new_wallet_done'),
        password = form.find('[type="password"]').val();

    if (!formCheck(form, password, "<i>Password</i> can't be empty."))
        return;

    iEtherWallet.createNewWallet(password, function(percent) {
        form.find('.progress').show().find('.progress-bar').attr('aria-valuenow', percent)
            .css({ width: percent + '%' }).text(percent + '%');
    }, function(wallet, json) {
        var data = JSON.parse(json);
        form.hide();
        done.show().find('.private-key').text(wallet.privateKey);
        done.find('.download-json-file')
            .attr('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(json))
            .attr('download', 'UTC--' + (new Date().toISOString().replace(/:/g, '-')) + '--' + data.address)
            .show();
    });
});



/**
 *  Form: Send Ether & Tokens (Generate)
 */
$(document).on('submit', '.iew_form__send_ether_tokens.generate', function(event) {
    event.preventDefault();

    var form = $(this),
        to_address = $(this).find('[name="to_address"]').val(),
        amount = $(this).find('[name="amount"]').val(),
        gas_limit = $(this).find('[name="gas_limit"]').val();

    if (!formCheck(form, to_address, "<i>To Address</i> can't be empty.") ||
        !formCheck(form, amount, "<i>Amount</i> can't be empty.") ||
        !formCheck(form, gas_limit, "<i>Gas Limit</i> can't be empty."))
        return;

    var transaction = {
            nonce: iEtherWallet.wallet.transactionCount,
            gasPrice: iEtherWallet.wallet.gasPrice,
            gasLimit: ethers.utils.bigNumberify(gas_limit),
            from: iEtherWallet.wallet.address,
            to: to_address,
            value: ethers.utils.parseEther(isNaN(amount) ? 0 : amount),
            data: '0x',
        };

    iEtherWallet.signTransaction(transaction, function(gasEstimate, transaction, signedTransaction) {
        var confirm_transaction = $('.iew_modal__confirm_transaction'),
            form = $('.iew_form__send_ether_tokens.send');

        confirm_transaction.find('.from').text(transaction.from).val(transaction.from);
        confirm_transaction.find('.to').text(transaction.to).val(transaction.to);
        confirm_transaction.find('.amount').text(ethers.utils.formatEther(transaction.value));

        $('.iew_form__send_ether_tokens.generate')
            .find('input,button').prop('disabled', true);

        form.show();
        form.find('.raw_transaction').val(JSON.stringify(transaction));
        form.find('.signed_transaction').val(signedTransaction);
    }, function(error) {
        e = error.replace('Error:', '<strong>Error:</strong>');
        if (!/Error/.test(e))
            e = '<strong>Error:</strong> ' + e;

        form.find('.alert').attr('class', 'alert alert-danger').html(e).show().
            stop().delay(3000).queue(function() { $(this).hide(); });
    });
});



/**
 *  Form: Send Ether & Tokens (Send)
 */
$(document).on('submit', '.iew_form__send_ether_tokens.send', function(event) {
    event.preventDefault();

    $('.iew_modal__confirm_transaction').modal({ keyboard: false });
});



/**
 *  Modal: Confirm Transaction
 */
$(document).on('click', '.iew_modal__confirm_transaction .yes', function(event) {
    event.preventDefault();

    var form = $('.iew_form__send_ether_tokens.send');

    iEtherWallet.sendTransaction(form.find('.signed_transaction').val(),
        function(transactionHash) {
            form.find('textarea,button').prop('disabled', true);
            $('.iew_modal__confirm_transaction').modal('hide');
            $('.iew_form__send_ether_tokens.finish').show();
            $('.transaction_hash').text(transactionHash.toString());
        }
    );
});



/**
 *  Select Network
 */
$(document).on('click', '.select-network .dropdown-item', function(event) {
    event.preventDefault();

    var button = $(this).closest('.dropdown').find('button'),
        network = $(this).attr('href').replace('#', '');

    button.text($(this).text());
    iEtherWallet.useNetwork(network);
});



/**
 *
 */
function formCheck(form, value, error) {
    form.find('input,button,textarea').prop('disabled', true);

    if (value === '' || value === undefined || value === null) {
        form.find('.alert').attr('class', 'alert alert-danger')
            .html('<strong>Error!</strong> ' + error).show().stop()
            .delay(3000).queue(function() {
                form.find('input,button,textarea').prop('disabled', false);
                $(this).hide();
            });

        return false;
    }

    return true;
}



/**
 *
 */
var iEtherWallet = {
    wallet: null,
    provider: null,
    json: null,

    /**
     *
     */
    createNewWallet: function(password, callback_percent, callback_success, callback_fail) {
        var wallet;

        wallet = ethers.Wallet.createRandom({ extraEntropy: null });
        if (this.provider !== undefined)
            wallet.provider = this.provider;

        wallet.encrypt(password, function(percent) {
            if (callback_percent !== undefined)
                callback_percent(parseInt(percent * 100));
        }).then(function(json) {
            if (callback_success !== undefined)
                callback_success(wallet, json);
        }).catch(function(response){
            if (callback_fail !== undefined)
                callback_fail((response + '').replace(/ at.*/, ''));
        });

        this.wallet = wallet;
    },

    /**
     *
     */
    signTransaction: function(transaction, callback_success, callback_fail) {
        var signedTransaction;

        signedTransaction = this.wallet.sign(transaction);

        if (signedTransaction == null)
            return;

        // Estimate the gas cost for the transaction
        this.wallet.estimateGas(transaction).then(function(gasEstimate) {
            if (callback_success !== undefined)
                callback_success(gasEstimate, transaction, signedTransaction);
        }).catch(function(response){
            if (callback_fail !== undefined)
                callback_fail((response + '').replace(/ at.*/, ''));
        });
    },    

    /**
     *
     */
    sendTransaction: function(signedTransaction, callback_success, callback_fail) {
        this.wallet.provider.sendTransaction(signedTransaction).then(function(transactionHash) {
            if (callback_success !== undefined)
                callback_success(transactionHash);
        }).catch(function(response){
            if (callback_fail !== undefined)
                callback_fail((response + '').replace(/ at.*/, ''));
        });
    },

    /**
     *
     */
    useNetwork: function(network) {
        if (/etherscan/.test(network))
            this.provider = new ethers.providers.EtherscanProvider(network.replace(/.*::/, ''));
    },

    /**
     *
     */
    unlockWallet: function(password, callback_success, callback_fail) {
        var __this = this;

        ethers.Wallet.fromEncryptedWallet(this.json, password/*, function(a) { console.log(a) }*/).then(function(wallet) {
        	__this.wallet = wallet;

            if (__this.provider !== undefined)
                __this.wallet.provider = __this.provider;

            // Promises we are interested in
            var balancePromise = __this.provider.getBalance(wallet.address);
            var gasPricePromise = __this.provider.getGasPrice();
            var transactionCountPromise = __this.provider.getTransactionCount(wallet.address);

            var allPromise = Promise.all([ gasPricePromise, balancePromise, transactionCountPromise ]);

            var sendPromise = allPromise.then(function(results) {
                var gasPrice = results[0];
                var balance = results[1];
                var transactionCount = results[2];

                __this.wallet.gasPrice = gasPrice;
                __this.wallet.balance = balance;
                __this.wallet.transactionCount = transactionCount;

                if (callback_success !== undefined)
                    callback_success(__this.wallet);                
            });
        })
        .catch(function(response){
            if (callback_fail !== undefined)
                callback_fail((response + '').replace(/ at.*/, ''));
        });
    }
};


/*

Raw Transaction

{"nonce":"0x1e","gasPrice":"0x05f5e100","gasLimit":"0x5208","to":"0x17FA8bE13F87a3a625bAAdeE901844298074F91c","value":"0x0186cc6acd4b0000","data":"","chainId":4}

Signed Transaction

0xf86b1e8405f5e1008252089417fa8be13f87a3a625baadee901844298074f91c880186cc6acd4b0000802ca0d0816ca0bc9e4f70d4134410e3ef694a35f849e6affad732068a23aa34e7857ba03dace4b53145f78a58f8447b68dbcc3e2f222aa0e8acf6e243242d880ef191fa



Warning!

0x3309a55B6AfbECb56783d694aC541AA5B3d05A2E
-> 
0.11 RINKEBY ETH
0x17FA8bE13F87a3a625bAAdeE901844298074F91c

You are about to send 0.11 RINKEBY ETH 
to address 0x17FA8bE13F87a3a625bAAdeE901844298074F91c.
You are interacting with the RINKEBY ETH chain , provided by Etherscan.io .
Are you sure you want to do this?



Your 1234XXXXTX has been broadcast to the network. It is waiting to be mined & confirmed. During ICOs, it may take 3+ hours to confirm. Use the Verify & Check buttons below to see. TX Hash: 0xd36bfe7d1e08fda95c2d1ab9f9b6e3660755c93d1a7bc93c47221225ac5f6ee3



*/



/*

Save your Keystore File.
Download Keystore File (UTC / JSON)
Do not lose it! It cannot be recovered if you lose it.

Do not share it! Your funds will be stolen if you use this file on a malicious/phishing site.

Make a backup! Secure it like the millions of dollars it may one day be worth.

I understand. Continue.
Not Downloading a File?
Try using Google Chrome
Right click & save file as. Filename:

UTC--2017-11-28T01-12-59.464Z--78f6c428733e290098bd4a86f979231e023ecb10
Don't open this file on your computer
Use it to unlock your wallet via MyEtherWallet (or Mist, Geth, Parity and other wallet clients.)
Guides & FAQ
How to Back Up Your Keystore File
What are these Different Formats?

*/