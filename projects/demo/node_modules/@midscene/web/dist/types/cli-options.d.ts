import { type ViewportSize } from './common/viewport';
export interface ParsedWebCliOptions {
    argv: string[];
    mode: 'bridge' | 'cdp' | 'puppeteer';
    cdpEndpoint?: string;
    viewport?: ViewportSize;
}
export declare function parseWebCliOptions(rawArgs: string[], env?: NodeJS.ProcessEnv): ParsedWebCliOptions;
