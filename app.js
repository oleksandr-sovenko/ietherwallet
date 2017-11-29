var express    = require('express'),
	path       = require('path');

require('./conf/app.conf');

var app = express();

/* set the view engine to ejs */
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'www')));

app.get('/', function (req, res) {
	res.render('index');
});

app.get('/send-ether-tokens/', function (req, res) {
    res.render('send-ether-tokens');
});

app.get('/about/', function (req, res) {
    res.render('about');
});

var server = app.listen(conf.app.port, function () {
    console.log(conf.app);
});
