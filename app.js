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
    console.log("levels for:", column_name, levels);
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
            console.log('dataset', vm.dataset);
            var columnSpec = extractColumnSpec(vm.dataset);
            console.log("columnSpec:", columnSpec);
            vm.iteratorColumns = columnSpec.filter(function (e, i) { return e.kind == ColumnKind.ITERATOR; });
            var maxColumn = null;
            vm.iteratorColumns.forEach(function (e, i) {
                if (maxColumn == null || maxColumn.levels.length < e.levels.length) {
                    maxColumn = e;
                }
            });
            vm.maxLevels = Math.max.apply(null, vm.iteratorColumns.map(function (x) { return x.levels.length; }));
            console.log('maxLevels:', vm.maxLevels);
            vm.resultColumns = columnSpec.filter(function (e, i) { return e.kind == ColumnKind.RESULT; });
            vm.levelsSelected = m.prop(vm.iteratorColumns.map(function (x) { return [x.levels[0]]; }));
            console.log('levelsSelected()', vm.levelsSelected());
            vm.selectX = m.prop(maxColumn.name);
        }
        vm.init = init;
        function columnsSelected() {
            console.log('iteratorColumns', vm.iteratorColumns);
            console.log('levelsSelected()', vm.levelsSelected());
            var retval = vm.iteratorColumns.map(function (e, i) { return ({
                name: e.name,
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
                                    console.log(ev);
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
function arrayMulti(array_a, array_b) {
    var retval = [];
    array_a.forEach(function (a) {
        array_b.forEach(function (b) {
            if (Array.isArray(a)) {
                retval.push(a.concat(b));
            }
            else {
                retval.push([a, b]);
            }
        });
    });
    return retval;
}
var loopspecs = [
    { name: "3", values: ["8"] },
    { name: "4", values: ["0", "50", "100"] },
    { name: "6", values: ["8", "16"] },
    { name: "7", values: ["0"] }
];
function loopspecFlattern(loopspecs) {
    var indices = [];
    var iteratedValues = null;
    loopspecs.forEach(function (e, i) {
        indices.push(loopspecs[i].name);
        if (iteratedValues != null) {
            iteratedValues = arrayMulti(iteratedValues, loopspecs[i].values);
        }
        else {
            iteratedValues = loopspecs[i].values;
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
        console.log('[loopspecs element]', e);
        return e.values.length > 1 ? e.name : null;
    });
    console.log('subIterators:', subIterators);
    var keyname = subIterators.map(function (e, i) {
        if (e) {
            return shortenColumnExpression(e + ' = ' + iter[i]);
        }
        else {
            return null;
        }
    }).filter(function (e) { return e != null; }).join('; ');
    console.log('keyname', keyname);
    return keyname;
}
function generateValues(loopspecs, dataset) {
    var flatspec = loopspecFlattern(loopspecs);
    var indices = flatspec.names;
    console.log('indices:', indices);
    var iterations = flatspec.value_arrays;
    console.log('iterations:', iterations);
    var numOfIterations = iterations.length;
    return iterations.map(function (iter) {
        var datasetFiltered = dataset.filter(function (row) {
            for (var i = 0; i < indices.length; i++) {
                if (row[indices[i]] != iter[i]) {
                    return false;
                }
            }
            return true;
        });
        console.log('datasetFiltered:', datasetFiltered);
        if (numOfIterations == 1) {
            var keyname = 'selected';
        }
        else {
            var keyname = generateKeyname(loopspecs, iter, numOfIterations);
        }
        return { key: keyname, values: datasetFiltered };
    });
}
function ynameToTitle(yname) {
    if (/Throughput/.test(yname)) {
        return 'Throughput';
    }
    else if (/Succeeded\/sec/.test(yname)) {
        return 'IOPS';
    }
    else if (/Latency/.test(yname)) {
        return 'Latency';
    }
    else {
        return yname;
    }
}
var plotComponent;
(function (plotComponent) {
    var svgindex = 0;
    function genSvgSelector() {
        svgindex++;
        return "svg#svgGeneratedId-" + svgindex;
    }
    function controller(args) {
        console.log("plotComponent.controller() args:", args);
        this.yname = args.yname;
        this.svgid = genSvgSelector();
    }
    plotComponent.controller = controller;
    function view(ctrl) {
        return m(ctrl.svgid, { config: config(ctrl), style: 'height: 400px' });
    }
    plotComponent.view = view;
    function config(ctrl) {
        console.log("plotComponent.config() args:", ctrl);
        return function (element, isInitialized) {
            plotSvg(ctrl.svgid, ctrl.yname);
        };
    }
    plotComponent.config = config;
    function plotSvg(svgSelector, yname, dataset, columnsSelected, xname) {
        if (dataset === void 0) { dataset = my.vm.dataset; }
        if (columnsSelected === void 0) { columnsSelected = my.vm.columnsSelected(); }
        if (xname === void 0) { xname = my.vm.selectX(); }
        console.log('columnsSelected:', columnsSelected);
        var loopspecs = columnsSelected.filter(function (e, i) {
            return e.name != xname;
        }).map(function (e, i) {
            return { name: e.name, values: e.levels };
        });
        console.log('loopspecs:', loopspecs);
        var datum = generateValues(loopspecs, dataset);
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
