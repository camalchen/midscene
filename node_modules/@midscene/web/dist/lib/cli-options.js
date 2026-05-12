"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
    parseWebCliOptions: ()=>parseWebCliOptions
});
const cli_namespaceObject = require("@midscene/shared/cli");
const viewport_js_namespaceObject = require("./common/viewport.js");
const viewportWidthFlag = '--viewport-width';
const viewportHeightFlag = '--viewport-height';
function isLikelyCdpEndpoint(value) {
    return !!value && /^(wss?):\/\//.test(value);
}
function parsePositiveIntegerOption(flag, rawValue) {
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value <= 0) throw new cli_namespaceObject.CLIError(`Invalid value for "${flag}": expected a positive integer, got "${rawValue}".`);
    return value;
}
function readRequiredOptionValue(args, index, flag) {
    const currentArg = args[index];
    const inlinePrefix = `${flag}=`;
    if (currentArg.startsWith(inlinePrefix)) return {
        value: currentArg.slice(inlinePrefix.length),
        nextIndex: index
    };
    const nextArg = args[index + 1];
    if (!nextArg || nextArg.startsWith('--')) throw new cli_namespaceObject.CLIError(`Option "${flag}" requires a value.`);
    return {
        value: nextArg,
        nextIndex: index + 1
    };
}
function readOptionalCdpEndpoint(args, index) {
    const currentArg = args[index];
    const inlinePrefix = '--cdp=';
    if (currentArg.startsWith(inlinePrefix)) return {
        value: currentArg.slice(inlinePrefix.length),
        nextIndex: index
    };
    const nextArg = args[index + 1];
    if (!isLikelyCdpEndpoint(nextArg)) return {
        nextIndex: index
    };
    return {
        value: nextArg,
        nextIndex: index + 1
    };
}
function parseWebCliOptions(rawArgs, env = process.env) {
    const argv = [];
    let isBridge = false;
    let isCdp = false;
    let viewportWidth;
    let viewportHeight;
    let cdpEndpoint;
    for(let index = 0; index < rawArgs.length; index += 1){
        const arg = rawArgs[index];
        if ('--bridge' === arg) {
            isBridge = true;
            continue;
        }
        if ('--cdp' === arg || arg.startsWith('--cdp=')) {
            isCdp = true;
            const parsed = readOptionalCdpEndpoint(rawArgs, index);
            cdpEndpoint = parsed.value ?? cdpEndpoint;
            index = parsed.nextIndex;
            continue;
        }
        if (arg === viewportWidthFlag || arg.startsWith(`${viewportWidthFlag}=`)) {
            const parsed = readRequiredOptionValue(rawArgs, index, viewportWidthFlag);
            viewportWidth = parsePositiveIntegerOption(viewportWidthFlag, parsed.value);
            index = parsed.nextIndex;
            continue;
        }
        if (arg === viewportHeightFlag || arg.startsWith(`${viewportHeightFlag}=`)) {
            const parsed = readRequiredOptionValue(rawArgs, index, viewportHeightFlag);
            viewportHeight = parsePositiveIntegerOption(viewportHeightFlag, parsed.value);
            index = parsed.nextIndex;
            continue;
        }
        argv.push(arg);
    }
    if (isBridge && isCdp) throw new cli_namespaceObject.CLIError('--bridge and --cdp are mutually exclusive. Please specify only one.');
    const mode = isBridge ? 'bridge' : isCdp ? 'cdp' : 'puppeteer';
    if ('puppeteer' !== mode) {
        if (void 0 !== viewportWidth || void 0 !== viewportHeight) throw new cli_namespaceObject.CLIError('Viewport options are only supported in the default Puppeteer mode.');
    }
    if ('cdp' === mode) {
        cdpEndpoint = cdpEndpoint ?? env.MIDSCENE_CDP_ENDPOINT;
        if (!cdpEndpoint) throw new cli_namespaceObject.CLIError('CDP endpoint is required. Provide it as: --cdp <ws-endpoint> or set MIDSCENE_CDP_ENDPOINT environment variable.');
    }
    const hasViewportOverride = void 0 !== viewportWidth || void 0 !== viewportHeight;
    return {
        argv,
        mode,
        cdpEndpoint,
        viewport: hasViewportOverride ? (0, viewport_js_namespaceObject.resolveViewportSize)({
            width: viewportWidth,
            height: viewportHeight
        }, viewport_js_namespaceObject.defaultPuppeteerWindowViewportSize) : void 0
    };
}
exports.parseWebCliOptions = __webpack_exports__.parseWebCliOptions;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "parseWebCliOptions"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=cli-options.js.map