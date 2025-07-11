import React from "react"
import { type ClassValue, clsx } from "clsx"
import { cva } from "class-variance-authority"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Simple markdown processor for basic formatting
export function processMarkdown(text: string): string {
  if (!text) return text
  
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
    .replace(/\n/g, '<br>')
  
  return processed
}

// React component for rendering markdown text
export function MarkdownText({ 
  children, 
  className = "" 
}: { 
  children: string
  className?: string 
}) {
  return React.createElement('div', {
    className: className,
    dangerouslySetInnerHTML: { __html: processMarkdown(children) }
  })
} 