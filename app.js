var debug = false;
var debugLog = debug
    ? console.log.bind(console)
    : function () { };
var ColumnKind;
(function (ColumnKind) {
    ColumnKind[ColumnKind["IGNORE"] = 1] = "IGNORE";
    ColumnKind[ColumnKind["ITERATOR"] = 2] = "ITERATOR";
    ColumnKind[ColumnKind["RESULT"] = 3] = "RESULT";
})(ColumnKind || (ColumnKind = {}));
function columnKindFromName(columnName) {
    if (columnName == "#" ||
        columnName == "Duration (sec)" ||
        columnName == "Status") {
        return ColumnKind.IGNORE;
    }
    else if (/^Access Pattern/.test(columnName) ||
        /^File System - /.test(columnName) ||
        /^Reads - /.test(columnName) ||
        /^Writes - /.test(columnName) ||
        /^R\/W - /.test(columnName) ||
        /^Load - /.test(columnName) ||
        /^Data Reduction - /.test(columnName)) {
        return ColumnKind.ITERATOR;
    }
    else {
        return ColumnKind.RESULT;
    }
}
function extractLevels(dataset, column_name) {
    if (columnKindFromName(column_name) != ColumnKind.ITERATOR) {
        return undefined;
    }
    var values = dataset.map(function (e, i) { return e[column_name]; });
    var levels = values.filter(function (e, i, self) { return self.indexOf(e) === i; });
    debugLog("levels for:", column_name, levels);
    return levels;
}
function extractColumnSpec(dataset) {
    var column_names = Object.keys(dataset[0]);
    return column_names.map(function (e) { return ({
        name: e,
        kind: columnKindFromName(e),
        levels: extractLevels(dataset, e)
    }); });
}
var my;
(function (my) {
    var vm;
    (function (vm) {
        function init() {
            vm.dataset = d3.csv.parse($('#csvText').val());
            debugLog('dataset', vm.dataset);
            var columnSpec = extractColumnSpec(vm.dataset);
            debugLog("columnSpec:", columnSpec);
            vm.iteratorColumns = columnSpec.filter(function (e, i) { return e.kind == ColumnKind.ITERATOR; });
            var maxColumn = null;
            vm.iteratorColumns.forEach(function (e, i) {
                if (maxColumn == null || maxColumn.levels.length < e.levels.length) {
                    maxColumn = e;
                }
            });
            vm.maxLevels = Math.max.apply(null, vm.iteratorColumns.map(function (x) { return x.levels.length; }));
            debugLog('maxLevels:', vm.maxLevels);
            vm.resultColumns = columnSpec.filter(function (e, i) { return e.kind == ColumnKind.RESULT; });
            vm.levelsSelected = m.prop(vm.iteratorColumns.map(function (x) { return [x.levels[0]]; }));
            debugLog('levelsSelected()', vm.levelsSelected());
            vm.selectX = m.prop(maxColumn.name);
        }
        vm.init = init;
        function columnsSelected() {
            debugLog('iteratorColumns', vm.iteratorColumns);
            debugLog('levelsSelected()', vm.levelsSelected());
            var retval = vm.iteratorColumns.map(function (e, i) { return ({
                name: e.name,
                kind: e.kind,
                levels: vm.levelsSelected()[i]
            }); });
            return retval;
        }
        vm.columnsSelected = columnsSelected;
    })(vm = my.vm || (my.vm = {}));
    function controller() {
        vm.init();
    }
    my.controller = controller;
    function view(ctrl) {
        return [
            m("table.table", { style: { "table-layout": "fixed" } }, [
                m("thead", [
                    m("tr", [
                        vm.iteratorColumns.map(function (x) { return m("th", x.name); })
                    ])
                ]),
                m("tbody", [
                    m("tr", [
                        vm.iteratorColumns.map(function (x, i) { return m("td", [
                            m("select.form-control[multiple='true'][name='hogeratta']", {
                                id: 'selectColumnValue-' + i,
                                size: vm.maxLevels,
                                disabled: x.name == vm.selectX() ? true : false,
                                onchange: function (ev) {
                                    debugLog(ev);
                                    var arr = [];
                                    for (var _i = 0, _a = ev.target; _i < _a.length; _i++) {
                                        var x = _a[_i];
                                        if (x.selected) {
                                            arr.push(x.value);
                                        }
                                    }
                                    var result = vm.levelsSelected();
                                    result[i] = arr;
                                    vm.levelsSelected(result);
                                }
                            }, [
                                x.levels.map(function (x, j) { return m("option.hogeratta", {
                                    selected: vm.levelsSelected()[i].indexOf(x) != -1 ? 'selected' : ''
                                }, x); })
                            ])
                        ]); })
                    ]),
                    m("tr", [
                        vm.iteratorColumns.map(function (x, i) {
                            return m("td.selectXItems.col-xs-2", [
                                m(".radio", [
                                    m("label", [
                                        m("input[name='selectX'][type='radio']", {
                                            value: x.name,
                                            checked: x.name == vm.selectX() ? 'checked' : '',
                                            onchange: m.withAttr('value', vm.selectX)
                                        }),
                                        m("div", "Use as X-Axis")
                                    ])
                                ])
                            ]);
                        })
                    ])
                ])
            ]),
            vm.resultColumns.map(function (y, i) {
                return m("div.col-md-4", [
                    m("h4", { id: "title_" + y.name + "_" + i }, ynameToTitle(y.name)),
                    m.component(plotComponent, {
                        yname: y.name,
                    })
                ]);
            })
        ];
    }
    my.view = view;
    ;
})(my || (my = {}));
function csvTextEntered(e) {
    m.mount(document.getElementById('mroot'), my);
}
$("#csvText").on("keyup", csvTextEntered);
$("#parseButton").on("click", csvTextEntered);
$(csvTextEntered);
function arrayAppendDistributive(array_a, array_b) {
    var retval = [];
    array_a.forEach(function (a) {
        array_b.forEach(function (b) {
            retval.push(a.concat(b));
        });
    });
    return retval;
}
var loopspecs = [
    { name: "a", values: ["8"] },
    { name: "b", values: ["0", "50", "100"] },
    { name: "c", values: ["8", "16"] },
    { name: "d", values: ["0"] }
];
var flatternedLoopSpec = {
    "names": ["a", "b", "c", "d"],
    "value_arrays": [
        ["8", "0", "8", "0"],
        ["8", "0", "16", "0"],
        ["8", "50", "8", "0"],
        ["8", "50", "16", "0"],
        ["8", "100", "8", "0"],
        ["8", "100", "16", "0"]
    ]
};
function loopspecFlattern(loopspecs) {
    var indices = [];
    var iteratedValues = null;
    loopspecs.forEach(function (e, i) {
        indices.push(loopspecs[i].name);
        if (iteratedValues != null) {
            iteratedValues = arrayAppendDistributive(iteratedValues, loopspecs[i].values);
        }
        else {
            iteratedValues = loopspecs[i].values.map(function (e) { return [e]; });
        }
    });
    return { names: indices, value_arrays: iteratedValues };
}
function shortenColumnExpression(columnName) {
    switch (columnName) {
        case "Access Pattern - Read % = 100":
            return "READ";
        case "Access Pattern - Read % = 0":
            return "WRITE";
        case "R/W - Pattern - Random % = 100":
            return "RANDOM";
        case "R/W - Pattern - Random % = 0":
            return "SEQUENTIAL";
    }
    return columnName.replace(/.* - /, '');
}
function generateKeyname(loopspecs, iter, numOfIterations) {
    var subIterators = loopspecs.map(function (e) {
        debugLog('[loopspecs element]', e);
        return e.values.length > 1 ? e.name : null;
    });
    debugLog('subIterators:', subIterators);
    var keyname = subIterators.map(function (e, i) {
        if (e) {
            return shortenColumnExpression(e + ' = ' + iter[i]);
        }
        else {
            return null;
        }
    }).filter(function (e) { return e != null; }).join('; ');
    debugLog('keyname', keyname);
    return keyname;
}
function generateValues(loopspecs, dataset) {
    var flatspec = loopspecFlattern(loopspecs);
    debugLog('flatspec.names:', flatspec.names);
    debugLog('flatspec.value_arrays:', flatspec.value_arrays);
    if (flatspec.value_arrays == null) {
        return [{ key: 'selected', values: dataset }];
    }
    return flatspec.value_arrays.map(function (iter) {
        var datasetFiltered = dataset.filter(function (row) {
            for (var i = 0; i < flatspec.names.length; i++) {
                if (row[flatspec.names[i]] != iter[i]) {
                    return false;
                }
            }
            return true;
        });
        debugLog('datasetFiltered:', datasetFiltered);
        if (flatspec.value_arrays.length == 1) {
            var keyname = 'selected';
        }
        else {
            var keyname = generateKeyname(loopspecs, iter, flatspec.value_arrays.length);
        }
        return { key: keyname, values: datasetFiltered };
    });
}
function ynameToTitle(yname) {
    return yname;
}
var plotComponent;
(function (plotComponent) {
    var svgindex = 0;
    function genSvgSelector() {
        svgindex++;
        return "svg#svgGeneratedId-" + svgindex;
    }
    function controller(args) {
        debugLog("plotComponent.controller() args:", args);
        this.yname = args.yname;
        this.svgid = genSvgSelector();
    }
    plotComponent.controller = controller;
    function view(ctrl) {
        return m(ctrl.svgid, { config: config(ctrl), style: 'height: 400px' });
    }
    plotComponent.view = view;
    function config(ctrl) {
        debugLog("plotComponent.config() args:", ctrl);
        return function (element, isInitialized) {
            plotSvg(ctrl.svgid, ctrl.yname);
        };
    }
    plotComponent.config = config;
    function plotSvg(svgSelector, yname, dataset, columnsSelected, xname) {
        if (dataset === void 0) { dataset = my.vm.dataset; }
        if (columnsSelected === void 0) { columnsSelected = my.vm.columnsSelected(); }
        if (xname === void 0) { xname = my.vm.selectX(); }
        debugLog('columnsSelected:', columnsSelected);
        var loopspecs = columnsSelected.filter(function (e, i) {
            return e.name != xname;
        }).map(function (e, i) {
            return { name: e.name, values: e.levels };
        });
        debugLog('loopspecs:', loopspecs);
        var datum = generateValues(loopspecs, dataset);
        debugLog('datum:', datum);
        nv.addGraph(function () {
            var chart = nv.models.multiBarChart()
                .duration(100)
                .x(function (d) { return d[xname]; })
                .y(function (d) { return Number(d[yname]); })
                .reduceXTicks(false)
                .rotateLabels(-45)
                .showControls(false)
                .stacked(false)
                .showLegend(true);
            var defaultContentGenerator = chart.tooltip.contentGenerator();
            chart.tooltip.contentGenerator(function (d) {
                return defaultContentGenerator(d) +
                    ("<div class='footer'>(#" + d.data["#"] + ")</div>") +
                    (debug ? "<pre>" + JSON.stringify(d, null, "  ") + "</pre>" : "");
            });
            chart.xAxis
                .axisLabel(xname);
            chart.yAxis
                .showMaxMin(false)
                .tickFormat(d3.format(',1'))
                .axisLabel(yname);
            d3.select(svgSelector)
                .datum(datum)
                .call(chart);
            nv.utils.windowResize(chart.update);
            return chart;
        });
    }
})(plotComponent || (plotComponent = {}));
//# sourceMappingURL=app.js.map