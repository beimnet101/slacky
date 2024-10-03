import Quill from "quill";
import { useEffect, useRef, useState } from "react";

interface RendererProps {
  value: string;
}

const Renderer = ({ value }: RendererProps) => {
  const [isEmpty, setIsEmpty] = useState(false); // change to isEmpty
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rendererRef.current) return;

    const container = rendererRef.current;
    const quill = new Quill(document.createElement("div"), {
      theme:"snow",
    });

    quill.enable(false); // Disable editing mode

    // Parse and set the contents
    const contents = JSON.parse(value);
    quill.setContents(contents);

    // Check if the content is empty
    const isEmpty = quill.getText().replace(/<(.|\n)*?>/g, "").trim().length === 0;
    setIsEmpty(isEmpty); // Set the state whether content is empty

    container.innerHTML = quill.root.innerHTML;
    return () => {
      if (container) {
        container.innerHTML = ""; // Clean up
      }
    };
  }, [value]);

  if (isEmpty) return null; // If empty, do not render anything
  return <div ref={rendererRef} className="ql-editor ql-renderer" />;
};

export default Renderer;
