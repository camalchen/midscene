import { assert } from "@midscene/shared/utils";
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
    assert(Number.isInteger(parsedValue), `${name} must be a positive integer, but got ${rawValue}`);
    assert(parsedValue > 0, `${name} must be greater than 0, but got ${rawValue}`);
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
export { defaultPuppeteerWindowViewportSize, defaultStaticPageViewportSize, defaultViewportHeight, defaultViewportSize, defaultViewportWidth, resolveViewportSize, resolveWebViewportSize };

//# sourceMappingURL=viewport.mjs.map