import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useCallback } from 'react';
export function ResizableLayout({ leftPanel, rightPanel, defaultLeftWidth = 50, minLeftWidth = 20, maxLeftWidth = 80, className = "flex w-full h-[calc(100vh-120px)]" }) {
    const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !containerRef.current)
            return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        // Clamp the width within min/max bounds
        const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth));
        setLeftWidth(clampedWidth);
    }, [isDragging, minLeftWidth, maxLeftWidth]);
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);
    return (_jsxs("div", { ref: containerRef, className: className, children: [_jsx("div", { className: "overflow-hidden overflow-y-auto", style: { width: `${leftWidth}%` }, children: leftPanel }), _jsx("div", { className: `
          w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex-shrink-0 transition-colors
          ${isDragging ? 'bg-gray-400' : ''}
        `, onMouseDown: handleMouseDown, children: _jsx("div", { className: "w-full h-full relative", children: _jsx("div", { className: "absolute inset-0 w-2 -ml-0.5" }) }) }), _jsx("div", { className: "overflow-hidden overflow-y-auto flex-1", style: { width: `${100 - leftWidth}%` }, children: rightPanel })] }));
}
