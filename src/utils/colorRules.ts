import { OutputColorRule } from '../types';

export const BUILTIN_COLOR_RULES: OutputColorRule[] = [
    { pattern: '\\[info\\]|\\[INFO\\]|^INFO\\s', color: 'green' },
    { pattern: '\\[error\\]|\\[ERROR\\]|^ERROR\\s|\\berror\\b|\\bError\\b|\\bERROR\\b', color: 'red' },
    { pattern: '\\[warn\\]|\\[WARNING\\]|^WARN\\s|^WARNING\\s|\\bwarn\\b|\\bWarn\\b|\\bWARNING\\b', color: 'yellow' },
    { pattern: '\\[debug\\]|\\[DEBUG\\]|^DEBUG\\s|\\bdebug\\b|\\bDebug\\b', color: 'cyan' },
    { pattern: '\\[fail\\]|\\[FAIL\\]|FAILED|\\bfailed\\b|\\bFailed\\b|\\bFAIL\\b', color: 'red' },
    { pattern: '\\[success\\]|\\[SUCCESS\\]|PASSED|\\bpassed\\b|\\bSuccess\\b|\\bSUCCESS\\b', color: 'green' },
    { pattern: 'Exception|Traceback|Error:', color: 'red' },
    { pattern: '✓|✔|OK|ok', color: 'green' },
    { pattern: '✗|✕|FAIL|KO', color: 'red' }
];

export function getColorRules(customRules?: OutputColorRule[]): OutputColorRule[] {
    if (!customRules || customRules.length === 0) {
        return BUILTIN_COLOR_RULES;
    }
    return [...customRules, ...BUILTIN_COLOR_RULES];
}
