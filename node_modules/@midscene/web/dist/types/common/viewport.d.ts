export interface ViewportSize {
    width: number;
    height: number;
}
export declare const defaultViewportWidth = 1440;
export declare const defaultViewportHeight = 800;
export declare const defaultViewportSize: ViewportSize;
export declare const defaultPuppeteerWindowViewportSize: ViewportSize;
export declare const defaultStaticPageViewportSize: ViewportSize;
export declare function resolveViewportSize(viewport?: {
    width?: number | string | null;
    height?: number | string | null;
}, fallback?: ViewportSize): ViewportSize;
export declare function resolveWebViewportSize(viewport?: {
    viewportWidth?: number | string | null;
    viewportHeight?: number | string | null;
}, fallback?: ViewportSize): ViewportSize;
