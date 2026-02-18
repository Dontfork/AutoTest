export function stripAnsiEscapeCodes(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m|\[\d+(?:;\d+)*m/g, '');
}

export function matchPattern(text: string, pattern: string): boolean {
    try {
        return new RegExp(pattern, 'i').test(text);
    } catch {
        return text.toLowerCase().includes(pattern.toLowerCase());
    }
}

export function filterCommandOutput(
    output: string,
    includePatterns: string[] = [],
    excludePatterns: string[] = []
): string {
    if (!includePatterns.length && !excludePatterns.length) {
        return output;
    }

    const lines = output.split('\n');
    return lines.filter(line => {
        const matchesInclude = includePatterns.length === 0 || 
            includePatterns.some(p => matchPattern(line, p));
        const matchesExclude = excludePatterns.length > 0 && 
            excludePatterns.some(p => matchPattern(line, p));
        return matchesInclude && !matchesExclude;
    }).join('\n');
}
