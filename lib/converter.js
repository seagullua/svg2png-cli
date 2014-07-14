"use strict";
/*global phantom: false*/

var webpage = require("webpage");

function errorHanler(msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
        });
    }
    console.error(msgStack.join('\n'));
    phantom.exit();
};

phantom.onError = errorHanler;


if (phantom.args.length !== 4) {
    console.error("Usage: converter.js source dest scale");
    phantom.exit();
}
else {
    convert(phantom.args[0], phantom.args[1], phantom.args[2], phantom.args[3]);

}

function convert(sourceFile, dest, scale, quality) {
    var page = webpage.create();
	
    page.onError = errorHanler;
//    page.onResourceRequested = function(request) {
//        console.error('Request ' + JSON.stringify(request, undefined, 4));
//    };
//    page.onResourceReceived = function(response) {
//        console.error('Receive ' + JSON.stringify(response, undefined, 4));
//    };

    page.open("file:///"+sourceFile.replace(new RegExp('\\\\', 'g'),'/'), function(status){
        if (status !== "success") {
            console.error("Unable to load the source file.");
            phantom.exit();
            return;
        }

        var dimensions = getSvgDimensions(page);

        var ww = Math.round(scale);
        var ss = (ww / dimensions.width);
        page.viewportSize = {
            width: ww,
            height: Math.round(dimensions.height * ss)
        };

        page.zoomFactor = ss;




        setTimeout(function () {
            page.render(dest, {format: 'jpeg', quality: quality});
            phantom.exit();
        }, 0);

    });


}

function getSvgDimensions(page) {
    return page.evaluate(function () {
        /*global document: false*/

        var el = document.documentElement;
        var bbox = el.getBBox();

        var width = parseFloat(el.getAttribute("width"));
        var height = parseFloat(el.getAttribute("height"));
        var viewBoxWidth = el.viewBox.animVal.width;
        var viewBoxHeight = el.viewBox.animVal.height;
        var usesViewBox = viewBoxWidth && viewBoxHeight;

        if (usesViewBox) {
            if (width && !height) {
                height = width * viewBoxHeight / viewBoxWidth;
            }
            if (height && !width) {
                width = height * viewBoxWidth / viewBoxHeight;
            }
            if (!width && !height) {
                width = viewBoxWidth;
                height = viewBoxHeight;
            }
        }

        if (!width) {
            width = bbox.width + bbox.x;
        }
        if (!height) {
            height = bbox.height + bbox.y;
        }

        return { width: width, height: height, usesViewBox: usesViewBox };
    });
}
