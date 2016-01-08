var argv = require('yargs')
    .alias('p', 'port')
    .argv;
var chalk = require('chalk');
var dateFormat = require('dateformat');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'dist/data');
    },
    filename: function(req, file, cb) {
        if (file.fieldname === 'mborg_data') {
            cb (null, getUserDataFileName(req.session.user.username));
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

function loginRequired(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.sendStatus(403);
    }
}

function getUserDataFileName(username) {
    // TODO: normalizzare username
    return username + '_data.json';
}

function getUserDataFilePath(username) {
    // TODO: normalizzare username
    return 'dist/data/' + username + '_data.json';
}

// { username: string, existsData: bool }
function createRespUser(user, cb) {
    fs.exists(getUserDataFilePath(user.username), function(exists) {
        var ru = _.pick(user, 'username');
        ru.dataExists = exists;
        cb(ru);
    });
}

// sessione
app.use(session({
    secret: 'abcdefg 12345'
}));

// log di tutte le richieste
app.use(function log(req, res, next) {
    console.log('[%s] %s %s',
        chalk.gray(dateFormat('HH:MM:ss.l')),
        chalk.magenta(req.method),
        chalk.cyan(req.originalUrl));
    next();
});

// parsing del body
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// TODO: implementare
// POST /auth/user { username, password } -> 400 bad request { error: <descrizione errore> }, 200 ok
// POST /auth/user/<username>/update { password, nickname } -> 403 forbidden, 404 not found, 200 ok
// POST /auth/user/<username>/delete -> 403 forbidden, 404 not found, 200 ok

var authRouter = express.Router();
// { username, password } -> 401 unauthorized, 200 ok { username }
authRouter.post('/login', function(req, res) {
    // TODO: autenticazione
    req.session.user = {
        username: req.body.username
    };
    createRespUser(req.session.user, function(ru) {
        res.json(ru);
    });
});
// 200 ok
authRouter.get('/logout', function(req, res) {
    req.session.destroy();
    res.sendStatus(200);
});
// 200 { username }, 403 forbidden
authRouter.get('/user', function(req, res) {
    if (req.session.user) {
        createRespUser(req.session.user, function(ru) {
            res.json(ru);
        });
    } else {
        res.sendStatus(403);
    }
});

var dataRouter = express.Router();
// 200 { data }, 403 forbidden, 404 not found
dataRouter.get('/bookmarks', loginRequired, function(req, res) {
    var filePath = getUserDataFilePath(req.session.user.username);
    var options = {
        root: __dirname + '/',
        headers: {
            'content-type': 'application/json'
        }
    };
    res.sendFile(filePath, options, function(err) {
        if (err) {
            console.log(err);
            res.sendStatus(err.status);
        } else {
            console.log('sent', filePath);
        }
    });
});
// upload del file: il parametro che conterrà il file dovrà chiamarsi mborg_data
// 200 ok, 403 forbidden
dataRouter.post('/bookmarks', loginRequired, upload.single('mborg_data'), function(req, res) {
    console.log('save', req.file);
    res.sendStatus(200);
});
// 200 ok, 403 forbidden
dataRouter.post('/bookmarks/delete', loginRequired, function(req, res) {
    var filePath = getUserDataFilePath(req.session.user.username);
    fs.unlink(filePath, function(err) {
        if (err) {
            console.log(err);
            res.status(500).send(err.message);
        } else {
            console.log('unlink', filePath);
            res.sendStatus(200);
        }
    });
});

// router per l'autenicazione
app.use('/auth', authRouter);

// router per i dati
app.use('/data', dataRouter);

// serve tutte le risorse statiche in dist
app.use(express.static(__dirname + '/dist'));

// mi metto in ascolto
app.listen(port, function() {
    console.log('[%s] %s %s', chalk.gray(dateFormat('HH:MM:ss.l')), 'listening on port', chalk.cyan(port));
});
