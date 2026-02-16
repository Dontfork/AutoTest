import * as assert from 'assert';
import { describe, it } from 'mocha';

interface OutputColorRule {
    pattern: string;
    color: 'red' | 'green' | 'yellow' | 'blue' | 'cyan' | 'magenta' | 'white' | 'gray';
}

const ANSI_COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    reset: '\x1b[0m'
};

const BUILTIN_COLOR_RULES: OutputColorRule[] = [
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

function matchPattern(text: string, pattern: string): boolean {
    try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(text);
    } catch {
        return text.toLowerCase().includes(pattern.toLowerCase());
    }
}

function filterCommandOutput(
    output: string,
    includePatterns: string[] = [],
    excludePatterns: string[] = []
): string {
    if (!includePatterns.length && !excludePatterns.length) {
        return output;
    }

    const lines = output.split('\n');
    const filteredLines: string[] = [];

    for (const line of lines) {
        const matchesInclude = includePatterns.length === 0 || 
            includePatterns.some(p => matchPattern(line, p));
        
        const matchesExclude = excludePatterns.length > 0 && 
            excludePatterns.some(p => matchPattern(line, p));

        if (matchesInclude && !matchesExclude) {
            filteredLines.push(line);
        }
    }

    return filteredLines.join('\n');
}

function getColorRules(customRules?: OutputColorRule[]): OutputColorRule[] {
    if (!customRules || customRules.length === 0) {
        return BUILTIN_COLOR_RULES;
    }
    return [...customRules, ...BUILTIN_COLOR_RULES];
}

function applyColorRules(line: string, colorRules: OutputColorRule[] = []): string {
    const rules = getColorRules(colorRules);
    for (const rule of rules) {
        if (matchPattern(line, rule.pattern)) {
            const colorCode = ANSI_COLORS[rule.color] || ANSI_COLORS.white;
            return `${colorCode}${line}${ANSI_COLORS.reset}`;
        }
    }
    return line;
}

describe('Output Filtering Module - 输出过滤模块测试', () => {
    describe('matchPattern - 模式匹配', () => {
        it('简单字符串匹配 - 包含指定字符串', () => {
            assert.strictEqual(matchPattern('This is an error message', 'error'), true);
            assert.strictEqual(matchPattern('Test FAILED', 'failed'), true);
            assert.strictEqual(matchPattern('No issues found', 'error'), false);
        });

        it('正则表达式匹配 - 使用正则模式', () => {
            assert.strictEqual(matchPattern('[ERROR] Something went wrong', '\\[ERROR\\]'), true);
            assert.strictEqual(matchPattern('Test case passed', 'PASSED|FAILED'), true);
            assert.strictEqual(matchPattern('Test case failed', 'PASSED|FAILED'), true);
            assert.strictEqual(matchPattern('Running tests', 'PASSED|FAILED'), false);
        });

        it('大小写不敏感匹配 - 忽略大小写', () => {
            assert.strictEqual(matchPattern('ERROR: test failed', 'error'), true);
            assert.strictEqual(matchPattern('Error: test failed', 'ERROR'), true);
            assert.strictEqual(matchPattern('error: test failed', 'Error'), true);
        });

        it('无效正则表达式回退到字符串匹配', () => {
            assert.strictEqual(matchPattern('Test [invalid', '[invalid'), true);
        });
    });

    describe('filterCommandOutput - 命令输出过滤', () => {
        const sampleOutput = `Running tests...
[INFO] Starting test suite
[ERROR] Connection failed
[DEBUG] Loading config
[INFO] Test 1 passed
[ERROR] Test 2 failed
[DEBUG] Cleaning up
All tests completed`;

        it('无过滤规则时返回原始输出', () => {
            const result = filterCommandOutput(sampleOutput, [], []);
            assert.strictEqual(result, sampleOutput);
        });

        it('includePatterns - 只保留匹配的行', () => {
            const result = filterCommandOutput(sampleOutput, ['ERROR'], []);
            const lines = result.split('\n').filter((l: string) => l.trim());
            
            assert.strictEqual(lines.length, 2);
            assert.ok(lines[0].includes('[ERROR]'));
            assert.ok(lines[1].includes('[ERROR]'));
        });

        it('excludePatterns - 排除匹配的行', () => {
            const result = filterCommandOutput(sampleOutput, [], ['DEBUG']);
            const lines = result.split('\n').filter((l: string) => l.trim());
            
            assert.strictEqual(lines.length, 6);
            for (const line of lines) {
                assert.ok(!line.includes('[DEBUG]'));
            }
        });

        it('同时使用include和exclude - 先include后exclude', () => {
            const result = filterCommandOutput(
                sampleOutput, 
                ['ERROR', 'INFO'], 
                ['Test 2']
            );
            const lines = result.split('\n').filter((l: string) => l.trim());
            
            assert.strictEqual(lines.length, 3);
            assert.ok(lines.some((l: string) => l.includes('[INFO]')));
            assert.ok(lines.some((l: string) => l.includes('[ERROR] Connection')));
            assert.ok(!lines.some((l: string) => l.includes('Test 2')));
        });

        it('includePatterns为空时匹配所有行', () => {
            const result = filterCommandOutput(sampleOutput, [], ['DEBUG']);
            const lines = result.split('\n').filter((l: string) => l.trim());
            
            assert.ok(lines.length > 0);
            for (const line of lines) {
                assert.ok(!line.includes('DEBUG'));
            }
        });

        it('多行输出正确处理换行符', () => {
            const output = 'line1\nline2\nline3';
            const result = filterCommandOutput(output, [], []);
            
            assert.strictEqual(result, output);
        });
    });

    describe('applyColorRules - 颜色规则应用', () => {
        it('匹配规则时应用颜色', () => {
            const rules: OutputColorRule[] = [
                { pattern: 'error', color: 'red' }
            ];
            
            const result = applyColorRules('This is an error', rules);
            
            assert.ok(result.includes('\x1b[31m'));
            assert.ok(result.includes('\x1b[0m'));
        });

        it('不匹配任何规则时返回原始行', () => {
            const rules: OutputColorRule[] = [
                { pattern: 'error', color: 'red' }
            ];
            
            const result = applyColorRules('This is a normal line', rules);
            
            assert.strictEqual(result, 'This is a normal line');
            assert.ok(!result.includes('\x1b['));
        });

        it('多个规则时使用第一个匹配的规则', () => {
            const rules: OutputColorRule[] = [
                { pattern: 'error', color: 'red' },
                { pattern: 'error', color: 'green' }
            ];
            
            const result = applyColorRules('An error occurred', rules);
            
            assert.ok(result.includes('\x1b[31m'));
            assert.ok(!result.includes('\x1b[32m'));
        });

        it('空规则数组时使用内置规则', () => {
            const result = applyColorRules('[ERROR] test', []);
            assert.ok(result.includes('\x1b[31m'));
        });

        it('支持所有预定义颜色', () => {
            const colors: Array<'red' | 'green' | 'yellow' | 'blue' | 'cyan' | 'magenta' | 'white' | 'gray'> = 
                ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta', 'white', 'gray'];
            
            for (const color of colors) {
                const rules: OutputColorRule[] = [{ pattern: 'test', color }];
                const result = applyColorRules('test line', rules);
                assert.ok(result.includes('\x1b['), `Color ${color} should be applied`);
            }
        });
    });

    describe('BUILTIN_COLOR_RULES - 内置颜色规则', () => {
        it('返回非空规则数组', () => {
            const rules = BUILTIN_COLOR_RULES;
            
            assert.ok(Array.isArray(rules));
            assert.ok(rules.length > 0);
        });

        it('包含INFO规则 - 绿色', () => {
            const infoRule = BUILTIN_COLOR_RULES.find((r: OutputColorRule) => r.pattern.includes('INFO'));
            
            assert.ok(infoRule);
            assert.strictEqual(infoRule?.color, 'green');
        });

        it('包含ERROR规则 - 红色', () => {
            const errorRule = BUILTIN_COLOR_RULES.find((r: OutputColorRule) => r.pattern.includes('ERROR'));
            
            assert.ok(errorRule);
            assert.strictEqual(errorRule?.color, 'red');
        });

        it('包含WARNING规则 - 黄色', () => {
            const warnRule = BUILTIN_COLOR_RULES.find((r: OutputColorRule) => r.pattern.includes('WARN'));
            
            assert.ok(warnRule);
            assert.strictEqual(warnRule?.color, 'yellow');
        });

        it('包含FAIL规则 - 红色', () => {
            const failRule = BUILTIN_COLOR_RULES.find((r: OutputColorRule) => r.pattern.includes('FAIL'));
            
            assert.ok(failRule);
            assert.strictEqual(failRule?.color, 'red');
        });

        it('包含SUCCESS规则 - 绿色', () => {
            const successRule = BUILTIN_COLOR_RULES.find((r: OutputColorRule) => r.pattern.includes('SUCCESS'));
            
            assert.ok(successRule);
            assert.strictEqual(successRule?.color, 'green');
        });
    });

    describe('getColorRules - 获取颜色规则', () => {
        it('无自定义规则时返回内置规则', () => {
            const rules = getColorRules();
            assert.strictEqual(rules.length, BUILTIN_COLOR_RULES.length);
        });

        it('空数组时返回内置规则', () => {
            const rules = getColorRules([]);
            assert.strictEqual(rules.length, BUILTIN_COLOR_RULES.length);
        });

        it('有自定义规则时合并规则', () => {
            const customRules: OutputColorRule[] = [
                { pattern: 'custom', color: 'blue' }
            ];
            const rules = getColorRules(customRules);
            
            assert.strictEqual(rules.length, BUILTIN_COLOR_RULES.length + 1);
            assert.strictEqual(rules[0].pattern, 'custom');
            assert.strictEqual(rules[0].color, 'blue');
        });

        it('自定义规则优先于内置规则', () => {
            const customRules: OutputColorRule[] = [
                { pattern: 'ERROR', color: 'blue' }
            ];
            const rules = getColorRules(customRules);
            
            assert.strictEqual(rules[0].pattern, 'ERROR');
            assert.strictEqual(rules[0].color, 'blue');
        });
    });

    describe('ANSI_COLORS - ANSI颜色代码', () => {
        it('包含所有必要的颜色代码', () => {
            assert.ok(ANSI_COLORS.red);
            assert.ok(ANSI_COLORS.green);
            assert.ok(ANSI_COLORS.yellow);
            assert.ok(ANSI_COLORS.blue);
            assert.ok(ANSI_COLORS.cyan);
            assert.ok(ANSI_COLORS.magenta);
            assert.ok(ANSI_COLORS.white);
            assert.ok(ANSI_COLORS.gray);
            assert.ok(ANSI_COLORS.reset);
        });

        it('reset代码正确', () => {
            assert.strictEqual(ANSI_COLORS.reset, '\x1b[0m');
        });
    });

    describe('Integration - 集成测试', () => {
        it('完整过滤和颜色流程', () => {
            const output = `[INFO] Starting...
[ERROR] Failed to connect
[DEBUG] Retrying...
[INFO] Connected
[ERROR] Test failed`;
            
            const filtered = filterCommandOutput(output, ['ERROR', 'INFO'], ['DEBUG']);
            const lines = filtered.split('\n').filter((l: string) => l.trim());
            
            assert.strictEqual(lines.length, 4);
            
            const rules: OutputColorRule[] = [
                { pattern: 'ERROR', color: 'red' },
                { pattern: 'INFO', color: 'green' }
            ];
            
            for (const line of lines) {
                const colored = applyColorRules(line, rules);
                if (line.includes('ERROR')) {
                    assert.ok(colored.includes('\x1b[31m'));
                } else if (line.includes('INFO')) {
                    assert.ok(colored.includes('\x1b[32m'));
                }
            }
        });

        it('使用内置颜色规则处理实际输出', () => {
            const output = `[INFO] Starting application
[ERROR] Connection timeout
[WARNING] Memory usage high
[DEBUG] Loading config
PASSED: Test case 1
FAILED: Test case 2`;
            
            const lines = output.split('\n');
            
            for (const line of lines) {
                const colored = applyColorRules(line);
                
                if (line.includes('[INFO]') || line.includes('PASSED')) {
                    assert.ok(colored.includes(ANSI_COLORS.green), `INFO/PASSED should be green: ${line}`);
                } else if (line.includes('[ERROR]') || line.includes('FAILED')) {
                    assert.ok(colored.includes(ANSI_COLORS.red), `ERROR/FAILED should be red: ${line}`);
                } else if (line.includes('[WARNING]')) {
                    assert.ok(colored.includes(ANSI_COLORS.yellow), `WARNING should be yellow: ${line}`);
                } else if (line.includes('[DEBUG]')) {
                    assert.ok(colored.includes(ANSI_COLORS.cyan), `DEBUG should be cyan: ${line}`);
                }
            }
        });
    });
});
