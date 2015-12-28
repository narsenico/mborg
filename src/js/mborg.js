"use strict";

// template compilati
var linkItemTemplate;
var tagButtonTemplate;
// tutti i tag usati
var allTags = [];
// conteggio dei tag
var tagCounters = {};
// TODO: rivedere gestione classi .enabled e .filtered
$(function load() {
    // carico i template, li compilo e procedo con l'init
    $.when(
        $.get('templates/bookmark.hnb'),
        $.get('templates/tag.hnb')
    ).then(function(data1, data2) {
        // compilo i template
        linkItemTemplate = Handlebars.compile(data1[0]);
        tagButtonTemplate = Handlebars.compile(data2[0]);
        // inizalizzo
        init();
    })
    .fail(function() {
        // TODO: gestire errore caricamento template, nascondere #divimport
    });
}); // end load

function init() {
    // attivo gli effetti material
    $.material.init();
    // opzioni per i toast
    toastr.options.positionClass = 'toast-bottom-left';
    // // preparo i template
    // linkItemTemplate = Handlebars.compile($('#link-item-template').html());
    // tagButtonTemplate = Handlebars.compile($('#tag-button-template').html());
    // preparo il campo di ricerca
    prepareSearch();
    // gestisco l'upload del file
    $('#ctlfile').on('change', function(event) {
        var ff = event.target.files[0];
        if (ff) {
            // considero solo i file di tipo text/html
            if (!ff.type.match('html')) {
                toastr.error('<b>' + ff.name + '</b> is not a valid <a href="https://msdn.microsoft.com/en-us/library/aa753582(v=vs.85).aspx">NETSCAPE-Bookmark-file-1</a> file.');
            } else {
                $(this).parents('.input-group').find(':text').val(ff.name);
                var reader = new FileReader();
                reader.onload = $.proxy(loadFile, this, ff);
                // leggo il contenuto del file come stringa UTF-8
                reader.readAsText(ff);
            }
        }
    });
    // gestisco creazione nuovo link
    $('#btnadd').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        prepareNewLink();
    });
    // gestisco il pulsante per la pulizia del campo di ricerca
    $('#btnclearsearch').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        $('#txtsearch').val('');
        performSearch('');
    });
    // TODO: leggere dati dal server
    // TODO: nascondere #divimport se viene letto qualcosa
} // end init

function loadFile(file, event) {
    if (/^\<\!DOCTYPE NETSCAPE\-Bookmark\-file\-1\>/.test(event.target.result)) {
        var context = $.parseHTML(event.target.result);
        //creo i link
        $('#divimport').hide();
        _.delay(function() {
            makeLinks($('#links'), parseBookmarkFile(context));
            toastr.success('Import complete');
            $('#txtsearch').focus();
        }, 10);
    } else {
        toastr.error('<b>' + file.name + '</b> is not a valid <a href="https://msdn.microsoft.com/en-us/library/aa753582(v=vs.85).aspx">NETSCAPE-Bookmark-file-1</a> file.');
    }
}

function makeLinks(container, links) {
    // var tt = new Date().getTime();
    container.append(
            _.chain(links)
            .sortBy('text') //  ordino per il testo
            .map($.proxy(createLinkDom, this)) // creo l'elemento
            .value())
        .find('.bookmark').tap(fixLinkDom);
    // creo i filtri sui tag
    _.chain(tagCounters).keys().each(function(tag) {
        updateTagButton(tag, tagCounters[tag]);
    });
    // console.log('******', (new Date().getTime() - tt));
}

function createLinkDom(link) {
    return $(linkItemTemplate(link))
        .data('source', link)
        .find('.link-stars select') // gesisco rating
        .barrating({
            initialRating: link.rating,
            onSelect: ratingChanged
        })
        .end() // ritorno a .bookmark            
        .find('.link-tags :text')
        .on('itemAdded', function(event) { // evento di tagsinput
            allTags = _.union(allTags, event.item);
            link.tags.push(event.item);
            // incremento il contatore del tag e aggiorno i controlli dei filtri
            updateTagButton(event.item, incrementTag(event.item));
        })
        .on('itemRemoved', function(event) { // evento di tagsinput
            link.tags = _.without(link.tags, event.item);
            // decremento il contatore del tag e aggiorno i controlli dei filtri
            updateTagButton(event.item, decrementTag(event.item));
        })
        .end() // ritorno a .bookmark
        .find('.link-option-edit') // gestisco pulsante edit
        .click(function(event) {
            event.preventDefault();
            event.stopPropagation();
            beginEditMode(link, $(this).closest('.bookmark'));
        })
        .end() // ritorno a .bookmark
        .find('.link-option-edit-ok') // gestisco pulsante fine edit
        .click(function(event) {
            event.preventDefault();
            event.stopPropagation();
            endEditMode(link, $(this).closest('.bookmark'));
        })
        .end() // ritorno a .bookmark
        .find('.link-option-edit-cancel') // gestisco pulsante annulla edit
        .click(function(event) {
            event.preventDefault();
            event.stopPropagation();
            endEditMode(link, $(this).closest('.bookmark'), true);
        })
        .end() // ritorno a .bookmark             
        .find('.link-option-remove') // gestisco pulsante remove
        .click(function(event) {
            event.preventDefault();
            event.stopPropagation();
            removeLink($(this).closest('.bookmark'));
        })
        .end() // ritorno a .bookmark
        .find('[data-editable]') // gestisco tutti i campi editabili
        .on('keydown', function(event) {
            if (event.which == 13) { // enter (conferma)
                endEditMode(link, $(this).closest('.bookmark'));
            } else if (event.which == 27) { // esc (annulla)
                endEditMode(link, $(this).closest('.bookmark'), true);
                // } else if (event.which == 9) { // tab
                //     // TODO: non funziona -> $(this).closest('.bookmark').find('[data-editable]').gotoNext().focus();
            } else {
                return true;
            }
        })
        .end() // ritorno a .bookmark
        .find('[data-editable="href"]')
        .click(function(event) {
            // se in edit prevengo la selezione del link
            if ($(this).closest('.bookmark').is('.editable')) {
                event.preventDefault();
                event.stopPropagation();
            }
        })
        .end() // ritorno a .bookmark
    ;
}

function fixLinkDom() {
    // var tt = new Date().getTime();
    var elements = $('.link-tags :text', this);
    var max = elements.length - 1;
    var index = 0;
    // TODO: non mi piace molto usare setInterval ma non ho trovato una soluzione migliore
    // un loop con n chiamate di setTimeout non ha funzionato (la pagina si aggiorna solo al termine del loop !?!?!?)
    var hnd = setInterval(function() {
        var idx = index;
        if (idx > max) {
            clearInterval(hnd);
            // console.log('--fine--', (tt - new Date().getTime()));
        } else {
            index++;
            elements.eq(idx)
                .tagsinput({
                    trimValue: true,
                    typeaheadjs: [{
                        highlight: true
                    }, {
                        source: tagMatcher()
                    }]
                });
        }
    });
    return this;
}

function ratingChanged(value, text, event) {
    // TODO: event è valorizzato solo su interazione dell'utente
    //  il metodo 'set' produce event undefined
    //  per capire a quale link si fa riferimento accedere al padre di event.target
}

function beginEditMode(link, $bookmark) {
    $bookmark
        .addClass('editable')
        .find('[data-editable]')
        .attr('contenteditable', true)
        .first().focus(); // focus al primo elemento editabile
}

function endEditMode(link, $bookmark, cancel) {
    // se annullo l'edit di un link nuovo lo elimino direttamente
    if (cancel && $bookmark.is('.new')) {
        deleteLink($bookmark);
    } else {
        if (cancel) {
            $bookmark
                .find('[data-editable=text]').html(link.text).end()
                .find('[data-editable=href]').html(link.href);
        } else {
            // TODO: eseguire dei controlli formali sui dati modificati (es: text o href non possono essere vuoti)                
            $bookmark
                .removeClass('new')
                .find('[data-editable=text]').copyHtmlTo(link, 'text').end()
                .find('[data-editable=href]').copyHtmlTo(link, 'href').attr('href', link.href);
        }
        // esco dalla modalità di edit
        $bookmark
            .removeClass('editable')
            .find('[data-editable]')
            .attr('contenteditable', 'inherit')
            .blur(); // tolgo il focus
    }
}

function removeLink($bookmark) {
    // la rimozione è solo logica, i link rimossi non verranno mostrati
    // la rimozione fisica sarà effettuata solo durante il salvataggio dei dati sul server
    var link = $bookmark.data('source');
    $bookmark.removeClass('enabled').addClass('removed');
    link.removed = true;
    // il link verrà  ripristinato se viene cliccato il toast prima che scomapia
    var undoKey = undo.add($bookmark.get(0));
    toastr.warning('<b>' + link.text + '</b> removed (click to undo)').click(function() {
        var $undo = $(undo.undo(undoKey));
        if ($undo.length) {
            $undo.data('source').removed = false;
            $undo.addClass('enabled').removeClass('removed');
        }
    });
}

function deleteLink($bookmark) {
    // elimina definitivamente un link, senza possibilità di undo
    var link = $bookmark.data('source');
    $bookmark.remove();
}

function prepareNewLink() {
    var link = createLink('http://', '', 'Bookmark title');
    beginEditMode(link,
        fixLinkDom.bind(createLinkDom(link).addClass('new'))()
        .appendTo($('#links')).show());
}

function parseBookmarkFile(context) {
    var links = [];
    // TODO: rivedere, attualmente la prima cartealla "Barra dei preferiti" viene conteggiata solo se è l'unico tag
    parseDL($(context).find('dl').first(), $(context).find('dt:first>h3').html(), links);
    return links;
}

function parseDL(context, path, links) {
    context.children('dt').each(function() {
        var $self = $(this);
        if ($self.has('h3').length) { // folder
            parseDL($self.children('dl'), path + ',' + $self.find('h3').first().html(), links);
        } else { // node
            var link = $self.find('a').first();
            var tags = path.split(',');
            var lastTag = _.last(tags);
            incrementTag(lastTag);
            allTags = _.union(allTags, tags);
            links.push(createLink(link.attr('href'), link.attr('icon'), link.html(), tags));
        }
    });
}

function createLink(href, icon, text, tags) {
    return {
        "href": href,
        // NB: vedi http://jsfiddle.net/LPxrT/
        "icon": icon || 'data:image/gif;base64,R0lGODlhAQABAPAAAOvk8P///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==',
        "text": text,
        "rating": 1,
        "tags": tags || []
    };
}

function prepareSearch() {
    var $search = $('#txtsearch');
    //
    $search.typeahead({
        highlight: true
    }, {
        // TODO: la ricerca deve essere più complessa, ora mostra solo i tag che matchano con tutto il testo del campo di ricerca (invece dovrebbe estrarre tutti i tag che matchano tutte le parole)
        source: tagMatcher()
    });
    // enter: prevengo il refresh della pagina e rieseguo la ricerca
    // esc: annullo la ricerca
    $search.on('keydown keypress', function(event) {
        if (event.which == 13) {
            event.preventDefault();
            event.stopPropagation();
            performSearch(this.value);
        } else if (event.which == 27) {
            // se si pulisce la casella con .value o $().val() viene ripristinato il vecchio valore al blur
            $(this).typeahead('val', '');
        }
    });
    //        
    Rx.Observable.merge(
            Rx.Observable.fromEvent($search, 'keyup'),
            Rx.Observable.fromEvent($search, 'blur'),
            Rx.Observable.fromEvent($search, 'search'))
        .map(function(event) {
            return event.target.value.trim();
        })
        .filter(function(text) {
            return text.length === 0 || text.length >= 2;
        })
        .debounce(500) //se non succede più niente per 500ms prosegue
        .distinctUntilChanged() //solo quando cambia
        .subscribe(performSearch);
}

function performSearch(term) {
    // se il termine di ricerca è vuoto mostro tutto altrimenti solo i bookmark che lo soddisfano
    // considero solo i bookmark enabled (non rimossi) e filtered (filtri sui tag)
    if (_.isEmpty(term)) {
        $('.bookmark.enabled.filtered').show();
        $('#spcounter, #btnclearsearch').hide();
    } else {
        // ricerca su tutti i link
        var re = new RegExp(term, 'i');
        $('.bookmark.enabled.filtered')
            .hide()
            .filter(function(index, el) {
                // TODO: cercare anche in altre proprietà
                var link = $(el).data('source');
                return re.test([link.text, link.href, link.tags.join()].join(''));
            })
            .tap(function() {
                $('#spcounter').html(this.length + '/' + $('.bookmark.enabled.filtered').length).show();
                $('#btnclearsearch').show();
            })
            .show();
    }
}

function filterByTags() {
    // applica la classe filtered ai bookmark che hanno tutti i tag selezionati
    // quelli senza filtered sono nascosti via css
    var selectedTags = $('.btn-tag.selected').map(function() {
        return $(this).attr('data-tag');
    }).get();
    if (selectedTags.length) {
        $('.bookmark.enabled').each(function(index, el) {
            var $self = $(el);
            var link = $self.data('source');
            $self.toggleClass('filtered', !_.difference(selectedTags, link.tags).length);
        });
    } else {
        $('.bookmark.enabled').addClass('filtered');
    }
}

function incrementTag(tag) {
    return (tagCounters[tag] = (tagCounters[tag] || 0) + 1);
}

function decrementTag(tag) {
    // se arrivo a zero tolgo il tag dall'oggetto
    if (tagCounters[tag]) {
        if (--tagCounters[tag] <= 0) {
            delete tagCounters[tag];
            return 0;
        } else {
            return tagCounters[tag];
        }
    }
    return 0;
}

function updateTagButton(tag, count) {
    // se l'elemento non esiste lo creo, se count = 0 lo rimuovo
    var $tag = $('#tags .btn-tag[data-tag="' + tag + '"]');
    if ($tag.length) {
        if (count > 0) {
            $tag.find('.weight').html(count);
        } else {
            $tag.remove();
        }
    } else if (count > 0) {
        $(tagButtonTemplate({
                text: tag,
                weight: count
            }))
            .click(function(event) {
                event.preventDefault();
                event.stopPropagation();
                // aggiorno lo stato del pulsante/tag
                $(this).toggleClass('btn-danger selected');
                // filtro i link in base ai tag selezionati
                filterByTags();
                // rieseguo la ricerca che terrà conto dei tag selezionati
                performSearch($('#txtsearch').val());
            })
            .appendTo('#tags');
    }
}

// esegue una funziona all'interno della chain
$.fn.tap = function(func) {
    if (func) {
        func.apply(this);
    }
    return this;
};
// copia il contenuto di un tag in una proprietà di un oggetto
$.fn.copyHtmlTo = function(obj, property) {
    // TODO: copyHtmlTo, gestire each
    obj[property] = this.html();
    return this;
};
// TODO: gotoNext
$.fn.gotoNext = function() {
    debugger
    var $end = this.end();
    var index = this.index();
    if (index === $end.length - 1) index = 0;
    return $end.eq(this.index() + 1);
};
//
var undo = (function() {
    var map = {};
    // TODO: rendere key univoco
    var key = 0;
    return {
        add: function() {
            map[++key] = Array.prototype.slice.apply(arguments);
            return key;
        },
        undo: function(key) {
            var value = map[key];
            delete map[key];
            return value;
        }
    };
})();

var tagMatcher = function() {
    return function findMatches(query, cb) {
        var matches, rg;
        matches = [];
        rg = new RegExp(query, 'i');
        _.each(allTags, function(tag) {
            if (rg.test(tag)) {
                matches.push(tag);
            }
        });
        cb(matches);
    };
};
