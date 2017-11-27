var express    = require('express'),
	bodyParser = require('body-parser'),
	path       = require('path');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'www')));

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: path.join(__dirname, 'www') });
});

app.get('/send-ether-tokens/', function (req, res) {
    console.log(path.join(__dirname, 'www'));
    
    res.sendFile('send-ether-tokens.html', { root: path.join(__dirname, 'www') });
});

app.get('/about/', function (req, res) {
    res.sendFile('about.html', { root: path.join(__dirname, 'www') });
});








app.post('/submit-data', function (req, res) {
    res.send('POST Request');
});

app.put('/update-data', function (req, res) {
    res.send('PUT Request');
});

app.post('/submit-student-data', function (req, res) {
    var name = req.body.firstName + ' ' + req.body.lastName;
    
    res.send(name + ' Submitted Successfully!');
});

app.delete('/delete-data', function (req, res) {
    res.send('DELETE Request');
});

var server = app.listen(5000, function () {
    console.log('Node server is running..');
});
