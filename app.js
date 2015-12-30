var argv = require('yargs')
    .alias('p', 'port')
    .argv;
var chalk = require('chalk');
var dateFormat = require('dateformat');
var express = require('express');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'dist/data');
    },
    filename: function(req, file, cb) {
        if (file.fieldname === 'mborg_data') {
        	cb(null, 'mborg_data.json');
    	} else {
    		cb(null, file.fieldname + '-' + Date.now());
    	}
    }
});
var upload = multer({
    storage: storage
});
var app = express();
// parametri
var port = argv.port || 3001;
// log di tutte le richieste
app.use(function log(req, res, next) {
    console.log('[%s] %s %s', chalk.gray(dateFormat('HH:MM:ss.l')), chalk.magenta(req.method), chalk.cyan(req.originalUrl));
    next();
});
// serve tutte le risorse statiche in dist
app.use(express.static(__dirname + '/dist'));
// upload del file: il parametro che conterrà il file dovrà chiamarsi mborg_data
app.post('/save', upload.single('mborg_data'), function(req, res, next) {
	console.log(req.file);
    res.sendStatus(200);
});
// mi metto in ascolto
app.listen(port, function() {
    console.log('[%s] %s %s', chalk.gray(dateFormat('HH:MM:ss.l')), 'listening on port', chalk.cyan(port));
});
