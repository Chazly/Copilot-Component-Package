import React from "react";
import { clsx } from "clsx";
export function cn(...inputs) {
    return clsx(inputs);
}
// Simple markdown processor for basic formatting
export function processMarkdown(text) {
    if (!text)
        return text;
    // Convert markdown to HTML - ORDER MATTERS!
    let processed = text
        // Code: `text` (do this first to avoid conflicts)
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
        // Bold: **text** or __text__ (must come before single asterisks)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_ (single asterisks/underscores only)
        .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
        .replace(/_([^_]+?)_/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n/g, '<br>');
    return processed;
}
// Parse custom [choices] markup into a structured array
export function parseChoicesFromText(text) {
    if (!text)
        return { remainingText: text, choices: null };
    const choicesBlockRegex = /\[choices\]([\s\S]*?)\[choices\/\]/i;
    const match = text.match(choicesBlockRegex);
    if (!match)
        return { remainingText: text, choices: null };
    const inner = match[1];
    const choiceRegex = /\[choice\]([\s\S]*?)\[choice\/?\]/gi;
    const choices = [];
    let choiceMatch;
    while ((choiceMatch = choiceRegex.exec(inner)) !== null) {
        const raw = (choiceMatch[1] || '').trim();
        // Expect format like: "A. description"; fallback if missing key
        const keyMatch = raw.match(/^([A-Za-z])\s*\.?\s*(.*)$/);
        if (keyMatch) {
            const key = keyMatch[1].toUpperCase();
            const textPart = keyMatch[2] && keyMatch[2].trim().length > 0 ? keyMatch[2].trim() : raw;
            choices.push({ key, text: textPart });
        }
        else {
            choices.push({ key: String.fromCharCode(65 + choices.length), text: raw });
        }
    }
    const remainingText = text.replace(choicesBlockRegex, '').trim();
    return { remainingText, choices: choices.length > 0 ? choices : null };
}
// React component for rendering markdown text
export function MarkdownText({ children, className = "" }) {
    return React.createElement('div', {
        className: className,
        dangerouslySetInnerHTML: { __html: processMarkdown(children) }
    });
}
