import * as assert from 'assert';
import { describe, it } from 'mocha';

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

    describe('Integration - 集成测试', () => {
        it('完整过滤流程', () => {
            const output = `[INFO] Starting...
[ERROR] Failed to connect
[DEBUG] Retrying...
[INFO] Connected
[ERROR] Test failed`;
            
            const filtered = filterCommandOutput(output, ['ERROR', 'INFO'], ['DEBUG']);
            const lines = filtered.split('\n').filter((l: string) => l.trim());
            
            assert.strictEqual(lines.length, 4);
            
            for (const line of lines) {
                assert.ok(line.includes('ERROR') || line.includes('INFO'));
                assert.ok(!line.includes('DEBUG'));
            }
        });
    });
});
