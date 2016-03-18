/// <reference path="typings/tsd.d.ts" />
// For nvd3:
declare var nv: any;
// declare function nv.addGraph(any): any;

enum ColumnKind {
    IGNORE = 1,
    ITERATOR = 2,
    RESULT = 3
}

function columnKindFromName(columnName): ColumnKind {
    if (columnName == "#" ||
        columnName == "Duration (sec)" ||
        columnName == "Status") {
        return ColumnKind.IGNORE;
    } else if (
        /^Access Pattern/.test(columnName) ||
        /^File System - /.test(columnName) ||
        /^Reads - /.test(columnName) ||
        /^Writes - /.test(columnName) ||
        /^R\/W - /.test(columnName) ||
        /^Load - /.test(columnName) ||
        /^Data Reduction - /.test(columnName) ) {
        return ColumnKind.ITERATOR;
    } else {
        return ColumnKind.RESULT;
    }
}

//
// methods for dataset
//

function extractLevels(dataset, column_name): string[] {
    if (columnKindFromName(column_name) != ColumnKind.ITERATOR) {
        return undefined;
    }

    var values = dataset.map(function(e, i){ return e[column_name]; });
    var levels = values.filter(function(e, i, self){ return self.indexOf(e) === i; });
    console.log("levels for:", column_name, levels);

    return levels;
}

interface ColumnSpec {
    name: string
    kind: ColumnKind
    levels: string[]
}

function extractColumnSpec(dataset): ColumnSpec[] {
    var column_names = Object.keys(dataset[0]);
    return column_names.map( e => (
        {
            name: e,
            kind: columnKindFromName(e),
            levels: extractLevels(dataset, e)
        }
    ));
}

//
// Mithril component
//

module my {
    export module vm {
        export var dataset: {[key: string]: string; }[];

        export var maxLevels: number;
        export var iteratorColumns: ColumnSpec[];
        export var resultColumns: ColumnSpec[];

        export var selectX: _mithril.MithrilBasicProperty<string>;
        export var levelsSelected;

        export function init() {
            dataset = d3.csv.parse($('#csvText').val());
            console.log('dataset', dataset);

            var columnSpec = extractColumnSpec(dataset);
            console.log("columnSpec:", columnSpec);

            iteratorColumns = columnSpec.filter((e, i) => e.kind == ColumnKind.ITERATOR);

            var maxColumn = null;
            iteratorColumns.forEach(function(e, i) {
                if (maxColumn == null || maxColumn.levels.length < e.levels.length) {
                    maxColumn = e;
                }
            });
            maxLevels = Math.max.apply(null, iteratorColumns.map(x => x.levels.length)) as number;
            console.log('maxLevels:', maxLevels);

            resultColumns = columnSpec.filter((e,i) => e.kind == ColumnKind.RESULT);

            levelsSelected = m.prop(iteratorColumns.map(x => [x.levels[0]]));
            console.log('levelsSelected()', levelsSelected());
            selectX = m.prop(maxColumn.name);
        }
        export function columnsSelected(): ColumnSpec[] {
            console.log('iteratorColumns', iteratorColumns);
            console.log('levelsSelected()', levelsSelected());
            var retval = iteratorColumns.map( (e, i) => ({
                name: e.name,
                kind: e.kind,
                levels: levelsSelected()[i]
            }));
            return retval;
        }

    }

    export function controller() {
        vm.init();
    }

    export function view(ctrl) {
        return [
            m("table.table", {style: {"table-layout": "fixed"}}, [
                m("thead", [
                    m("tr", [
                        vm.iteratorColumns.map((x) => m("th", x.name))
                    ])
                ]),
                m("tbody", [
                    m("tr", [
                        vm.iteratorColumns.map( (x, i) => m("td", [
                            m("select.form-control[multiple='true'][name='hogeratta']", {
                                    id: 'selectColumnValue-' + i,
                                    size: vm.maxLevels,
                                    disabled: x.name == vm.selectX() ? true : false,
                                    onchange: (ev) => {
                                        console.log(ev);
                                        var arr = [];
                                        for (var x of ev.target) {
                                            // console.log(x.value, x.selected);
                                            if (x.selected) {
                                                arr.push(x.value)
                                            }
                                        }
                                        var result = vm.levelsSelected();
                                        result[i] = arr;
                                        // console.log('result', result);
                                        vm.levelsSelected(result);
                                    }
                                }, [
                                x.levels.map( (x, j) => m("option.hogeratta", {
                                    selected: vm.levelsSelected()[i].indexOf(x) != -1 ? 'selected' : ''
                                }, x) )
                            ])
                        ]))
                    ]),
                    m("tr", [
                        vm.iteratorColumns.map( (x, i) =>
                            m("td.selectXItems.col-xs-2", [
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
                            ])
                        )
                    ])
                ])
            ]),
            // m("div", `X-Axis: ${vm.selectX()}`),
            vm.resultColumns.map( (y, i) =>
                m("div.col-md-4", [
                    m("h4", {id: `title_${y.name}_${i}`}, ynameToTitle(y.name)),
                    m.component(plotComponent as any, {
                        yname: y.name,
                        // xname: my.vm.selectX(),
                        // columnsSelected: my.vm.columnsSelected()
                    })
                ])
            )
        ];
    };
}

//
// Event Handlers
//

function csvTextEntered(e){
    // set up mithril component
    m.mount(document.getElementById('mroot'), my);
}

$("#csvText").on("keyup", csvTextEntered);
$("#parseButton").on("click", csvTextEntered);
$(csvTextEntered);

//
// Loop Utility
//

function arrayAppendDistributive(array_a: string[][], array_b: string[]): string[][] {
    var retval = [];
    array_a.forEach(function(a){
        array_b.forEach(function(b){
            retval.push(a.concat(b));
        });
    });
    return retval;
}

interface LoopSpec {
    name: string
    values: string[]
}

// example
var loopspecs: LoopSpec[] = [
    {name: "a", values: ["8"]},
    {name: "b", values: ["0", "50", "100"]},
    {name: "c", values: ["8", "16"]},
    {name: "d", values: ["0"]}
];

interface FlatternedLoopSpec {
    names: string[]
    value_arrays: string[][]
}

// example
var flatternedLoopSpec: FlatternedLoopSpec = {
    "names":["a","b","c","d"],
    "value_arrays":[
        ["8","0","8","0"],
        ["8","0","16","0"],
        ["8","50","8","0"],
        ["8","50","16","0"],
        ["8","100","8","0"],
        ["8","100","16","0"]
    ]
}

function loopspecFlattern(loopspecs: LoopSpec[]): FlatternedLoopSpec {
    var indices = [];
    var iteratedValues: any[] = null;
    loopspecs.forEach(function (e, i) {
        indices.push(loopspecs[i].name);
        if (iteratedValues != null) {
            iteratedValues = arrayAppendDistributive(iteratedValues, loopspecs[i].values);
        } else {
            iteratedValues = loopspecs[i].values.map( e => [e] );
        }
    });
    return {names: indices, value_arrays: iteratedValues};
}

// console.log(loopspecFlattern(loopspecs));

function shortenColumnExpression(columnName: string): string {
    switch(columnName) {
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

function generateKeyname(loopspecs: LoopSpec[], iter, numOfIterations): string {
    var subIterators = loopspecs.map(function(e) {
        console.log('[loopspecs element]', e);
        return e.values.length > 1 ? e.name : null;
    });
    console.log('subIterators:', subIterators);
    var keyname = subIterators.map(function (e, i) {
        if (e) {
            // return e + ' = ' + iter[i];
            return shortenColumnExpression(e + ' = ' + iter[i]);
        } else {
            return null;
        }
    }).filter(function(e) { return e != null; }).join('; ');
    console.log('keyname', keyname);

    return keyname;
}

function generateValues(loopspecs: LoopSpec[], dataset) {
    var flatspec = loopspecFlattern(loopspecs);
    console.log('flatspec.names:', flatspec.names);
    console.log('flatspec.value_arrays:', flatspec.value_arrays);

    if (flatspec.value_arrays == null) {
        return [{key: 'selected', values: dataset}]
    }

    return flatspec.value_arrays.map(function(iter) {
        var datasetFiltered = dataset.filter(function(row) {
            for (var i = 0; i < flatspec.names.length; i++) {
                if (row[flatspec.names[i]] != iter[i]) {
                    return false;
                }
            }
            return true;
        });
        console.log('datasetFiltered:', datasetFiltered);
        if (flatspec.value_arrays.length == 1) {
            var keyname = 'selected';
        } else {
            var keyname = generateKeyname(loopspecs, iter, flatspec.value_arrays.length);
        }

        return { key: keyname, values: datasetFiltered };
    })
}

//
//
//

function ynameToTitle(yname) {
    if (/Throughput/.test(yname)) {
        return 'Throughput';
    } else if (/Succeeded\/sec/.test(yname)) {
        return 'IOPS';
    } else if (/Latency/.test(yname)) {
        return 'Latency';
    } else {
        return yname;
    }
}

/**
 * Mithril Componet that wraps nvd3 plots
 */

module plotComponent {
    // Generates unique svg id
    var svgindex = 0;
    function genSvgSelector() {
        svgindex++;
        return `svg#svgGeneratedId-${svgindex}`;
    }

    // It's a constructor for ctrl object!
    export function controller(args) {
        console.log(`plotComponent.controller() args:`, args);
        this.yname = args.yname;
        // this.xname = args.xname;
        this.svgid = genSvgSelector();
        // this.columnsSelected = args.columnsSelected;
    }
    export function view(ctrl) {
        return m(ctrl.svgid, {config: config(ctrl), style: 'height: 400px'});
    }
    export function config(ctrl) {
        console.log(`plotComponent.config() args:`, ctrl);

        return function(element, isInitialized) {
            // console.log('config func() called. element:', element);
            // console.log('config func() called. isInitialized:', isInitialized);
            plotSvg(ctrl.svgid, ctrl.yname);

            // return ctrl;
        }
    }
    function plotSvg(svgSelector, yname, dataset = my.vm.dataset, columnsSelected = my.vm.columnsSelected(), xname = my.vm.selectX()) {

        console.log('columnsSelected:', columnsSelected);

        var loopspecs = columnsSelected.filter(function(e, i) {
            return e.name != xname;
        }).map(function(e, i) {
            return {name: e.name, values: e.levels};
        });
        console.log('loopspecs:', loopspecs);

        var datum = generateValues(loopspecs, dataset);
        console.log('datum:', datum);
        // var showLegend = datum.length > 1;

        nv.addGraph(function() {
            var chart = nv.models.multiBarChart()
                .duration(100)
                .x(function(d) { return d[xname]; })
                .y(function(d) { return Number(d[yname]); })
                .reduceXTicks(false)   //If 'false', every single x-axis tick label will be rendered.
                .rotateLabels(-45)      //Angle to rotate x-axis labels.
                .showControls(false)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
                // .groupSpacing(0.1)    //Distance between each group of bars.
                .stacked(false)
                .showLegend(true) // No a good idea to false Legend...
                // .staggerLabels(true)
                // .showValues(true) // Not implemented in nvd3.js 1.8.1
            ;
            chart.xAxis
                // .tickFormat(d3.format(',f'));
                .axisLabel(xname)
            ;
            chart.yAxis
                //.tickFormat(d3.format(',.1'))
                .showMaxMin(false)
                .tickFormat(d3.format(',1'))
                .axisLabel(yname)
            ;
            d3.select(svgSelector)
                .datum(datum)
                .call(chart)
            ;
            nv.utils.windowResize(chart.update);

            return chart;
        });
    }
}
