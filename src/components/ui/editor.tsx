import Quill, { type QuillOptions } from "quill";
import "quill/dist/quill.snow.css";

import { useEffect, useRef } from "react";

const Editor = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Create a new div for the Quill editor
        const editorContainer = container.appendChild(
          container.ownerDocument.createElement("div"),
        )

        const options: QuillOptions = {
            theme: "snow",
        };

        // Initialize a new Quill editor instance
       new Quill(editorContainer, options);

        return () => {
            // Clean up and remove the editor on component unmount
            container.innerHTML = "";
        };
    }, []);

    return (
        <div className="flex flex-col border border-slate-200 rounded-md overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition bg-white">
            <div ref={containerRef} className=" h-full ql-container ql-custom" />
        </div>
    );
};

export default Editor;
