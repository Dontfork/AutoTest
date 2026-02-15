export function renderMarkdown(text: string): string {
    if (!text) {
        return '<p></p>';
    }
    
    let html = escapeHtml(text);
    
    const backtick = String.fromCharCode(96);
    const codeBlockRegex = new RegExp(backtick + backtick + backtick + '(\\w*)\\n([\\s\\S]*?)' + backtick + backtick + backtick, 'g');
    html = html.replace(codeBlockRegex, function(match, lang, code) {
        return '<pre><code class="language-' + lang + '">' + code.trim() + '</code></pre>';
    });
    
    const inlineCodeRegex = new RegExp(backtick + '([^' + backtick + ']*)' + backtick, 'g');
    html = html.replace(inlineCodeRegex, '<code>$1</code>');
    
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    
    html = html.replace(/^[-] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^[*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    html = html.replace(/\*([^\*\n]+?)\*/g, function(match, content) {
        if (content.startsWith(' ') || content.endsWith(' ')) {
            return match;
        }
        return '<em>' + content + '</em>';
    });
    
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    html = html.replace(/^---$/gm, '<hr>');
    
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    
    return html;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
