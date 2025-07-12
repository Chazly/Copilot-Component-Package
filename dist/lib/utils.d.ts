import React from "react";
import { type ClassValue } from "clsx";
export declare function cn(...inputs: ClassValue[]): string;
export declare function processMarkdown(text: string): string;
export declare function MarkdownText({ children, className }: {
    children: string;
    className?: string;
}): React.DetailedReactHTMLElement<{
    className: string;
    dangerouslySetInnerHTML: {
        __html: string;
    };
}, HTMLElement>;
