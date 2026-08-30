import Quill, { type QuillOptions } from "quill"
import "quill/dist/quill.snow.css";
import { Button } from "./ui/button";
import { MutableRefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PiTextAa } from "react-icons/pi";
import { ImageIcon, Smile, XIcon, VideoIcon, Paperclip, FileText } from "lucide-react";
import { MdSend } from "react-icons/md";
import { Hint } from "./ui/hint";
import { Delta, Op } from "quill/core";
import { cn } from "@/lib/utils";
import { EmojiPopover } from "./emoji-popover";
import Image from "next/image";
import { Id } from "../../convex/_generated/dataModel";



type EditorValue = {
    image: File | null;
    video: File | null;
    file: File | null;
    canvasId: Id<"canvases"> | null;
    body: string
}



interface EditorProps {
    onSubmit: (value: EditorValue) => void;
    onCancel?: () => void;
    variant?: "create" | "update";
    placeholder?: string;
    defaultValue?: Delta | Op[];
    innerRef?: MutableRefObject<Quill | null>;
    disabled?: boolean;
    workspaceCanvases?: { _id: string; title: string }[];
};




const Editor = ({
    onCancel,
    variant = "create",
    placeholder = "Type your message...",
    defaultValue = [],
    innerRef,
    disabled,
    onSubmit,
    workspaceCanvases = [],
}: EditorProps
) => {

    const [text, setText] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [canvasId, setCanvasId] = useState<Id<"canvases"> | null>(null);
    const [canvasTitle, setCanvasTitle] = useState<string | null>(null);
    const [showCanvasPicker, setShowCanvasPicker] = useState(false);
    const canvasIdRef = useRef<Id<"canvases"> | null>(null);

    const [isToolbarVisible, setIsToolbarVisible] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const submitRef = useRef(onSubmit);
    const placeholderRef = useRef(placeholder);
    const quillRef = useRef<Quill | null>(null);
    const defaultValueRef = useRef(defaultValue);
    const disabledRef = useRef(disabled);
    const imageElementRef = useRef<HTMLInputElement>(null);
    const videoElementRef = useRef<HTMLInputElement>(null);
    const fileElementRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        submitRef.current = onSubmit;
        placeholderRef.current = placeholder;
        defaultValueRef.current = defaultValue;
        disabledRef.current = disabled;
        canvasIdRef.current = canvasId;
    });


    useEffect(() => {




        if (!containerRef.current) return;



        const container = containerRef.current;

        // Create a new div for the Quill editor
        const editorContainer = container.appendChild(
            container.ownerDocument.createElement("div"),
        );


        const options: QuillOptions = {
            theme: "snow",
            placeholder: placeholderRef.current,
            modules: {
                toolbar: [
                    ["bold", "italic", "strike"],
                    ["link"],
                    [{ list: "ordered" }, { list: "bullet" }]
                ],
                keyboard: {
                    bindings: {
                        enter: {
                            key: "Enter",
                            handler: () => {
                                const text = quill.getText();
                                const addedImage = imageElementRef.current?.files?.[0] || null;
                                const addedVideo = videoElementRef.current?.files?.[0] || null;
                                const addedFile = fileElementRef.current?.files?.[0] || null;
                                const currentCanvasId = canvasIdRef.current;
                                const isEmpity = !addedImage && !addedVideo && !addedFile && !currentCanvasId && text.replace(/<(.|\n)*?>/g, "").trim().length === 0;
                                if (isEmpity) return;
                                const body = JSON.stringify(quill.getContents());
                                submitRef.current?.({ body, image: addedImage, video: addedVideo, file: addedFile, canvasId: currentCanvasId })
                            }
                        },
                        shift_enter: {
                            key: "Enter",
                            shiftKey: true,
                            handler: () => {
                                quill.insertText(quill.getSelection()?.index || 0, "\n");
                            },
                        },

                    }
                },

            }
        }



        // Initialize a new Quill editor instance
        const quill = new Quill(editorContainer, options);


        quillRef.current = quill;
        quillRef.current.focus();

        if (innerRef) {
            innerRef.current = quill;
        }

        quill.setContents(defaultValueRef.current);
        setText(quill.getText());
        quill.on(Quill.events.TEXT_CHANGE, () => {
            setText(quill.getText());
        })
        return () => {

            // Clean up and remove the editor on component unmount
            quill.off(Quill.events.TEXT_CHANGE);
            if (container) {
                container.innerHTML = "";
            }
            if (quillRef.current) {
                quillRef.current = null;
            }
            if (innerRef) {
                innerRef.current = null;
            }
        }

    }, [innerRef]);
    const toggleToolbar = () => {
        setIsToolbarVisible((current) => !current);
        const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");
        if (toolbarElement) {
            toolbarElement.classList.toggle("hidden");
        }
    };



    const onEmojiSelect = (emojiValue: string) => {
        const quill = quillRef.current;
        const length = quill?.getLength() || 0;

        // Insert the emoji at the end of the text (just before the end marker)
        quill?.insertText(length - 1, emojiValue);

    }
    const isEmpty = !image && !video && !file && !canvasId && text.replace(/<(.|\n)*?>/g, "").trim().length === 0;

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
        if (["pdf"].includes(ext)) return "📄";
        if (["doc", "docx"].includes(ext)) return "📝";
        if (["xls", "xlsx"].includes(ext)) return "📊";
        if (["ppt", "pptx"].includes(ext)) return "📋";
        if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
        return "📎";
    };

    return (

        <div className="flex flex-col">
            <input
                type="file"
                accept="image/*"
                ref={imageElementRef}
                onChange={(event) => setImage(event.target.files![0])}
                className="hidden"
            />
            <input
                type="file"
                accept="video/*"
                ref={videoElementRef}
                onChange={(event) => setVideo(event.target.files![0])}
                className="hidden"
            />
            <input
                type="file"
                accept="*/*"
                ref={fileElementRef}
                onChange={(event) => {
                    const f = event.target.files?.[0];
                    if (f) setFile(f);
                }}
                className="hidden"
            />
            <div>
                <div className={cn("flex flex-col border border-slate-200 rounded-md overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition bg-white pb-0",
                    disabled && "opacity-50")}>

                    <div ref={containerRef} className="h-full q-custom" />

                    {!!image && (
                        <div className="p-2">
                            <div className="relative size-[62px] flex items-center justify-center group/image">
                                <Hint label="Remove image">
                                    <button
                                        onClick={() => {
                                            setImage(null);
                                            imageElementRef.current!.value = "";
                                        }}
                                        className="hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4] borde-2 border-white items-center justify-center">
                                        <XIcon className="size-3.5" />
                                    </button>
                                </Hint>
                                <Image
                                    src={URL.createObjectURL(image)}
                                    alt="Uploaded"
                                    fill
                                    className="rounded-xl  overflow-hidden border object-cover "
                                />
                            </div>
                        </div>
                    )}

                    {!!video && (
                        <div className="p-2">
                            <div className="relative flex items-center justify-center group/video">
                                <Hint label="Remove video">
                                    <button
                                        onClick={() => {
                                            setVideo(null);
                                            videoElementRef.current!.value = "";
                                        }}
                                        className="hidden group-hover/video:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4] border-2 border-white items-center justify-center">
                                        <XIcon className="size-3.5" />
                                    </button>
                                </Hint>
                                <video
                                    src={URL.createObjectURL(video)}
                                    className="rounded-xl border max-h-[120px] max-w-[200px] object-cover"
                                    controls
                                />
                            </div>
                        </div>
                    )}

                    {!!file && (
                        <div className="p-2">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-w-[280px] group/file">
                                <span className="text-lg">{getFileIcon(file.name)}</span>
                                <span className="text-xs text-slate-700 truncate flex-1">{file.name}</span>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        fileElementRef.current!.value = "";
                                    }}
                                    className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {!!canvasId && canvasTitle && (
                        <div className="p-2">
                            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 max-w-[280px]">
                                <FileText className="size-4 text-teal-600 flex-shrink-0" />
                                <span className="text-xs text-teal-800 truncate flex-1">{canvasTitle}</span>
                                <button
                                    onClick={() => { setCanvasId(null); canvasIdRef.current = null; setCanvasTitle(null); }}
                                    className="text-teal-400 hover:text-teal-600 flex-shrink-0"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    )}


                    <div className="flex px-2 pb-[1px] z-[5] gap-2 relative"> {/* Adjusted padding */}
                        <Hint label={isToolbarVisible ? "Show formatting" : "Hide formatting"}>
                            <Button
                                disabled={disabled}
                                size="iconSm"
                                variant="ghost"
                                onClick={toggleToolbar}
                            >
                                <PiTextAa className="size-4" />
                            </Button>
                        </Hint>

                        <EmojiPopover onEmojiSelect={onEmojiSelect}>
                            <Button
                                disabled={disabled}
                                size="iconSm"
                                variant="ghost"

                            >
                                <Smile className="size-4" />
                            </Button>
                        </EmojiPopover>

                        {variant === "create" && (
                            <>
                                <Hint label="Image">
                                    <Button
                                        disabled={disabled}
                                        size="iconSm"
                                        variant="ghost"
                                        onClick={() => imageElementRef.current?.click()}
                                    >
                                        <ImageIcon className="size-4" />
                                    </Button>
                                </Hint>
                                <Hint label="Video">
                                    <Button
                                        disabled={disabled}
                                        size="iconSm"
                                        variant="ghost"
                                        onClick={() => videoElementRef.current?.click()}
                                    >
                                        <VideoIcon className="size-4" />
                                    </Button>
                                </Hint>
                                <Hint label="Attach file">
                                    <Button
                                        disabled={disabled}
                                        size="iconSm"
                                        variant="ghost"
                                        onClick={() => fileElementRef.current?.click()}
                                    >
                                        <Paperclip className="size-4" />
                                    </Button>
                                </Hint>
                                {workspaceCanvases.length > 0 && (
                                    <div className="relative">
                                        <Hint label="Attach canvas">
                                            <Button
                                                disabled={disabled}
                                                size="iconSm"
                                                variant="ghost"
                                                onClick={() => setShowCanvasPicker((v) => !v)}
                                            >
                                                <FileText className="size-4" />
                                            </Button>
                                        </Hint>
                                        {showCanvasPicker && (
                                            <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[200px] max-w-[260px] max-h-[200px] overflow-y-auto">
                                                <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
                                                    Canvases
                                                </div>
                                                {workspaceCanvases.map((c) => (
                                                    <button
                                                        key={c._id}
                                                        onClick={() => {
                                                            const id = c._id as Id<"canvases">;
                                                            setCanvasId(id);
                                                            canvasIdRef.current = id;
                                                            setCanvasTitle(c.title);
                                                            setShowCanvasPicker(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors"
                                                    >
                                                        <FileText className="size-3.5 text-teal-600 flex-shrink-0" />
                                                        <span className="truncate">{c.title}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {variant === "update" && (
                            <div className="ml-auto flex items-center gap-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCancel}
                                    disabled={disabled}

                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        onSubmit({
                                            body: JSON.stringify(quillRef.current?.getContents()),
                                            image,
                                            video,
                                            file,
                                            canvasId,
                                        })
                                    }}
                                    disabled={disabled || isEmpty}
                                    className="bg-[#007a5a] hover:bg-[#007a5a]/80 text-white flex-shrink-0"
                                >
                                    Save
                                </Button>
                            </div>
                        )}

                        {variant === "create" && (
                            <Button
                                onClick={() => {
                                    onSubmit({
                                        body: JSON.stringify(quillRef.current?.getContents()),
                                        image,
                                        video,
                                        file,
                                        canvasId,
                                    })
                                }}
                                disabled={disabled || isEmpty}
                                size="sm"
                                className={cn(
                                    "ml-auto",
                                    isEmpty
                                        ? "bg-white hover:bg-white text-muted-foreground"
                                        : "bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
                                )}
                            >
                                <MdSend className="size-4" />
                            </Button>
                        )}
                    </div>
                </div>
                {variant === "create" && (
                    <div className={cn(
                        "text-[10px] p-2 text-muted-foreground flex justify-end opacity-0 transition",
                        !isEmpty && "opacity-100"
                    )}>
                        <p>
                            <strong>Shift+Return</strong> to add a new line
                        </p>
                    </div>
                )}
            </div>
        </div>

    )
};

export default Editor;
