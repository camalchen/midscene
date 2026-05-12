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
    defaultViewportSize: ()=>defaultViewportSize,
    defaultStaticPageViewportSize: ()=>defaultStaticPageViewportSize,
    defaultViewportWidth: ()=>defaultViewportWidth,
    resolveViewportSize: ()=>resolveViewportSize,
    resolveWebViewportSize: ()=>resolveWebViewportSize,
    defaultPuppeteerWindowViewportSize: ()=>defaultPuppeteerWindowViewportSize,
    defaultViewportHeight: ()=>defaultViewportHeight
});
const utils_namespaceObject = require("@midscene/shared/utils");
const defaultViewportWidth = 1440;
const defaultViewportHeight = 800;
const defaultViewportSize = {
    width: defaultViewportWidth,
    height: defaultViewportHeight
};
const defaultPuppeteerWindowViewportSize = {
    width: defaultViewportWidth,
    height: defaultViewportHeight
};
const defaultStaticPageViewportSize = {
    width: defaultViewportWidth,
    height: defaultViewportHeight
};
function parseViewportDimension(rawValue, name) {
    const parsedValue = 'number' == typeof rawValue ? rawValue : Number(rawValue);
    (0, utils_namespaceObject.assert)(Number.isInteger(parsedValue), `${name} must be a positive integer, but got ${rawValue}`);
    (0, utils_namespaceObject.assert)(parsedValue > 0, `${name} must be greater than 0, but got ${rawValue}`);
    return parsedValue;
}
function resolveViewportSize(viewport, fallback = defaultViewportSize) {
    const width = viewport?.width === void 0 || null === viewport.width ? fallback.width : parseViewportDimension(viewport.width, 'viewportWidth');
    const height = viewport?.height === void 0 || null === viewport.height ? fallback.height : parseViewportDimension(viewport.height, 'viewportHeight');
    return {
        width,
        height
    };
}
function resolveWebViewportSize(viewport, fallback = defaultViewportSize) {
    return resolveViewportSize({
        width: viewport?.viewportWidth,
        height: viewport?.viewportHeight
    }, fallback);
}
exports.defaultPuppeteerWindowViewportSize = __webpack_exports__.defaultPuppeteerWindowViewportSize;
exports.defaultStaticPageViewportSize = __webpack_exports__.defaultStaticPageViewportSize;
exports.defaultViewportHeight = __webpack_exports__.defaultViewportHeight;
exports.defaultViewportSize = __webpack_exports__.defaultViewportSize;
exports.defaultViewportWidth = __webpack_exports__.defaultViewportWidth;
exports.resolveViewportSize = __webpack_exports__.resolveViewportSize;
exports.resolveWebViewportSize = __webpack_exports__.resolveWebViewportSize;
for(var __rspack_i in __webpack_exports__)if (-1 === [
    "defaultPuppeteerWindowViewportSize",
    "defaultStaticPageViewportSize",
    "defaultViewportHeight",
    "defaultViewportSize",
    "defaultViewportWidth",
    "resolveViewportSize",
    "resolveWebViewportSize"
].indexOf(__rspack_i)) exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});

//# sourceMappingURL=viewport.js.map