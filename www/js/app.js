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
    }, function(privateKey, json) {
        var data = JSON.parse(json);
        $('.iew_info__new_wallet_progress,#iew_button__new_wallet,#iew_input__new_wallet_password').hide();
        $('#iew_button__new_wallet_download')
            .attr('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(json))
            .attr('download', 'UTC--' + (new Date().toISOString().replace(/:/g, '-')) + '--' + data.address)
            .show();
        $('.iew_info__new_wallet_privatekey').html('<strong>PrivateKey:</strong> ' + privateKey).show();
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
$(document).on('click', '#iew_button__unlock', function(event) {
    event.preventDefault();

    iEtherWallet.unlockWallet(
        $('#iew_button__unlock_password').val(),
        function(wallet){
            console.log(wallet);
            $('.iew__view_unlock').hide();
            $('.iew__view_main').show();
        }, function(error) {
            e = error.replace('Error:', '<strong>Error:</strong>');
            if (!/Error/.test(e))
                e = '<strong>Error:</strong> ' + e;

            $('.iew_error__password').html(e).show()
                .delay(3000).queue(function() { $(this).hide(); });
        }
    );
});



/**
 *
 */
$(document).on('change', '#iew_input__upload_json', function(evt) {
    var files = evt.target.files;

    f = files[0];
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            $('#iew_button__upload_json').text(files[0].name);
            
            iEtherWallet.json = e.target.result;
        };
    })(f);

    reader.readAsText(f);
});



/**
 *
 */
var iEtherWallet = {
    animated: true,



    /**
     *
     */
    createNewWallet: function(password, callback_percent, callback_json) {
        var wallet = ethers.Wallet.createRandom({ extraEntropy: null });
        wallet.encrypt(password, function(percent) {
            if (callback_percent !== undefined)
                callback_percent(parseInt(percent * 100));
        }).then(function(json) {
            if (callback_json !== undefined)
                callback_json(wallet.privateKey, json);
        });
    },



    /**
     *
     */
    unlockWallet: function(password, callback_success, callback_fail) {
        ethers.Wallet.fromEncryptedWallet(this.json, password/*, function(a) { console.log(a) }*/).then(function(wallet) {
            if (callback_success !== undefined)
                callback_success(wallet);
        }).catch(function(response){
            if (callback_fail !== undefined)
                callback_fail((response + '').replace(/ at.*/, ''));
        });
    }
};
