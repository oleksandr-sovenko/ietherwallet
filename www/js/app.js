/**
 *  Form: UnLockWallet
 */
$(document).on('submit', '.iew_form__unlock_wallet', function() {
    event.preventDefault();

    var form = $(this),
        password = form.find('[name="password"]').val();

    iEtherWallet.unlockWallet(
        password,
        function(wallet){
            form.hide();
            $('.iew_form__send_ether_tokens').show();

console.log(wallet.provider);

var transaction = {
    nonce: 0,
    gasLimit: 21000,
    gasPrice: ethers.utils.bigNumberify("20000000000"),
    from: wallet.address,
    to: "0x3309a55B6AfbECb56783d694aC541AA5B3d05A2E",
    value: ethers.utils.parseEther("0.21"),
    data: "0x",
    // This ensures the transaction cannot be replayed on different networks
    chainId: wallet.provider.chainId
};

console.log(transaction);

var signedTransaction = wallet.sign(transaction);

console.log(signedTransaction);

// This can now be sent to the Ethereum network
wallet.provider.sendTransaction(signedTransaction).then(function(hash) {
    console.log('Hash: ' + hash);
    // Hash:
});



            //console.log(ethers.utils.getAddress(wallet.address));
            //wallet.getBalance(ethers.utils.getAddress(wallet.address)).then(function(balance) {
            //    console.log(balance);
            //});

            //wallet.getTransactionCount(ethers.utils.getAddress(wallet.address)).then(function(transactionCount) {
            //    console.log(transactionCount);
            //});
        }, function(error) {
            console.log(error);

            if (/encseed/.test(error))
                return;

            e = error.replace('Error:', '<strong>Error:</strong>');
            if (!/Error/.test(e))
                e = '<strong>Error:</strong> ' + e;

            form.find('.alert').attr('class', 'alert alert-danger').html(e).show().
                stop().delay(3000).queue(function() { $(this).hide(); });
        }
    );
});

/* Select JSON File */
$(document).on('click', '.iew_form__unlock_wallet [name="select-file"]', function() {
    $(this).closest('form').find('[type="file"]').click();
});

/* Event */
$(document).on('change', '.iew_form__unlock_wallet [type="file"]', function(evt) {
    var files = evt.target.files;

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
$(document).on('submit', '.iew_form__create_new_wallet', function() {
    event.preventDefault();

    var form = $(this),
        done = $('.iew_form__create_new_wallet_done'),
        password = form.find('[type="password"]').val();

    form.find('input,button').prop('disabled', true);

    if (password == '') {
        form.find('.alert').attr('class', 'alert alert-danger')
            .html('<strong>Sorry!</strong> Password can\'t be empty.').show().stop()
            .delay(3000).queue(function() {
                $(this).hide();
                form.find('input,button').prop('disabled', false);
            });

        return;
    }

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
 *  Form: Send Ether & Tokens
 */
$(document).on('submit', '.iew_form__send_ether_tokens', function() {
    event.preventDefault();

    var to_address = $(this).find('[name="to_address"]').val(),
        amount = $(this).find('[name="amount"]').val(),
        gas_limit = $(this).find('[name="amount"]').val(),

        /*
        transaction = {
            gasLimit: gas_limit,
            to: to_address,
            //data: "0x",
            value: ethers.utils.parseEther(amount),
        };
        */

        transaction = {
            nonce: 0,
            gasLimit: gas_limit,
            gasPrice: ethers.utils.bigNumberify("20000000000"),

            to: to_address,

            value: ethers.utils.parseEther(amount),
            data: "0x",

            // This ensures the transaction cannot be replayed on different networks
            chainId: ethers.providers.Provider.chainId.homestead
        };

    iEtherWallet.sendTransaction(transaction);
});



/**
 *
 */
$(document).on('click', '#iew_button__new_wallet', function(event) {
    event.preventDefault();

    var password = $('#iew_input__new_wallet_password').val();

    if (password == '') {
        $('.iew_error__password_empty').show()
            .delay(1000).queue(function() { $('.iew_error__password_empty').hide(); });

        return;
    }

    $('#iew_button__new_wallet,#iew_input__new_wallet_password').prop('disabled', true);

    $('.iew_info__new_wallet_progress').show();
    iEtherWallet.createNewWallet(password, function(percent) {
        $('#iew_info__new_wallet_progress .progress-bar').attr('aria-valuenow', percent).css({ width: percent + '%' }).text(percent + '%');
    }, function(wallet, json) {
        var data = JSON.parse(json);
        $('.iew_info__new_wallet_progress,#iew_button__new_wallet,#iew_input__new_wallet_password').hide();
        $('#iew_button__new_wallet_download')
            .attr('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(json))
            .attr('download', 'UTC--' + (new Date().toISOString().replace(/:/g, '-')) + '--' + data.address)
            .show();
        $('.iew_info__new_wallet_privatekey').html('<strong>PrivateKey:</strong> ' + wallet.privateKey).show();
    });    
});



/**
 *
 */
$(document).on('click', '#iew_button__upload_json', function(event) {
    event.preventDefault();

    $('#iew_input__upload_json').click();
});



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
    createNewWallet: function(password, callback_percent, callback_json) {
        var wallet;

        wallet = ethers.Wallet.createRandom({ extraEntropy: null });
        if (this.provider !== undefined)
            wallet.provider = this.provider;

        wallet.encrypt(password, function(percent) {
            if (callback_percent !== undefined)
                callback_percent(parseInt(percent * 100));
        }).then(function(json) {
            if (callback_json !== undefined)
                callback_json(wallet, json);
        });

        this.wallet = wallet;
    },



    /**
     *
     */
     sendTransaction: function(transaction) {
		// Estimate the gas cost for the transaction
		//this.wallet.estimateGas(transaction).then(function(gasEstimate) {
		//    console.log(gasEstimate);
		//});

        var signedTransaction = this.wallet.sign(transaction);

        console.log(signedTransaction);

		// Send the transaction
		this.wallet.sendTransaction(signedTransaction).then(function(transactionHash) {
    		console.log(transactionHash);
		});
    },



    /**
     *
     */
    useNetwork: function(network) {
    	// https://mainnet.infura.io
    	// https://ropsten.infura.io
    	// https://rinkeby.infura.io
    	// http://127.0.0.1:8545

    	this.provider = new ethers.providers.JsonRpcProvider(network);
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

            wallet.provider.getBalance(wallet.address).then(function(balance) {
                console.log(ethers.utils.formatEther(balance));
            });            

            if (callback_success !== undefined)
                callback_success(wallet);
        }).catch(function(response){
            console.log(response);

            if (callback_fail !== undefined)
                callback_fail((response + '').replace(/ at.*/, ''));
        });
    }
};

iEtherWallet.useNetwork('https://rinkeby.infura.io');


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