import Quill, { type QuillOptions } from "quill"
import "quill/dist/quill.snow.css";
import { Button } from "./ui/button";
import { MutableRefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import{PiTextAa} from"react-icons/pi";
import { ImageIcon,Smile } from "lucide-react";
import{MdSend} from"react-icons/md";
import { Hint } from "./ui/hint";
import { Delta,Op } from "quill/core";
import { cn } from "@/lib/utils";
import { current } from "../../convex/members";





type EditorValue={
    image:File|null;
    body:string
}



interface EditorProps{
    onSubmit:({image,body}:EditorValue)=>void;
    onCancel?:()=>void;
    variant?:"create"|"update";
    placeholder?:string;
    defaultValue?:Delta|Op[];
    innerRef?:MutableRefObject<Quill |null>;
    disabled?:boolean;
};





const Editor = ({
        onCancel,
        variant="create",
        placeholder="Type your message...",
        defaultValue=[],
        innerRef,
        disabled,
        onSubmit,
    }:EditorProps
) => {
     
    const[text,setText]=useState("");
const[isToolbarVisible,setIsToolbarVisible]=useState(false);

 const containerRef = useRef<HTMLDivElement>(null);
     
  const submitRef=useRef(onSubmit);
  const placeholderRef=useRef(placeholder);
  const quillRef=useRef<Quill|null>(null);
  const defaultValueRef=useRef(defaultValue);
  const disabledRef=useRef(disabled);

        useLayoutEffect(()=>{
        submitRef.current=onSubmit;
        placeholderRef.current=placeholder;
        defaultValueRef.current=defaultValue;
        disabledRef.current=disabled;
        });


    useEffect(() => {
       
       
       
       
        if (!containerRef.current) return;

        
        
        const container = containerRef.current;

        // Create a new div for the Quill editor
        const editorContainer = container.appendChild(
          container.ownerDocument.createElement("div"),
        );


        const options: QuillOptions = {
            theme:"snow",
            placeholder: placeholderRef.current,
            modules:{
                toolbar:[
                    ["bold","italic","strike"],
                    ["link"],
                    [{list:"ordered"},{list:"bullet"}]
                ],
                keyboard:{
                  bindings:{
                    enter:{
                        key:"Enter",
                        handler:()=>{
                            return;
                        }
                    },
                shift_enter:{
                     key:"Enter",
                     shiftKey:true,
                     handler:()=>{
                          quill.insertText(quill.getSelection()?.index||0,"\n");
                     },
                },

                  }
                },
            
            }
           }
            
        

        // Initialize a new Quill editor instance
        const quill= new Quill(editorContainer,options);
      
    
      quillRef.current=quill;
      quillRef.current.focus();

       if(innerRef){
        innerRef.current=quill;
       }

       quill.setContents(defaultValueRef.current);
       setText(quill.getText());
       quill.on(Quill.events.TEXT_CHANGE,()=>{
        setText(quill.getText());
       })
        return () => {
 
    // Clean up and remove the editor on component unmount
           quill.off(Quill.events.TEXT_CHANGE);
        if(container) {  
             container.innerHTML = "";
            }
        if(quillRef.current){
            quillRef.current=null;
        }
        if(innerRef){
            innerRef.current=null;
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
    
    


    const isEmpty=text.replace(/<(.|\n)*?>/g,"" ).trim().length===0;
   console.log({isEmpty,text});
    
            return (
                <div className="flex flex-col border border-slate-200 rounded-md overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition bg-white">
                    <div ref={containerRef} className="h-full q-custom" /> {/* Reduced height here */}
        
                    <div className="flex px-2 pb-0 z-[5] gap-2">
                        <Hint label={isToolbarVisible?"Show formatting":"Hide formating"}>
                            <Button
                                disabled={disabled}
                                size="iconSm"
                                variant="ghost"
                                onClick={toggleToolbar}
                            >
                                <PiTextAa className="size-4" />
                            </Button>
                        </Hint>
        
                        <Hint label="Emoji">
                            <Button
                                disabled={disabled}
                                size="iconSm"
                                variant="ghost"
                                onClick={() => {}}
                            >
                                <Smile className="size-4" />
                            </Button>
                        </Hint>
        
                        {variant === "create" && (
                            <Hint label="Image">
                                <Button
                                    disabled={disabled}
                                    size="iconSm"
                                    variant="ghost"
                                    onClick={() => {}}
                                >
                                    <ImageIcon className="size-4" />
                                </Button>
                            </Hint>
                        )}
        
                        {variant === "update" && (
                            <div className="ml-auto flex-center gap-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {}}
                                    disabled={disabled}
                                >
                                    Cancel
                                </Button>
        
                                <Button
                                    size="sm"
                                    onClick={() => {}}
                                    disabled={disabled||isEmpty}
                                    className="bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
                                >
                                    Save
                                </Button>
                            </div>
                        )}
        
                        {variant === "create" && (
                            <Button
                                onClick={() => {}}
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
        
                    {/* Shift+Return text moved outside of the editor box */}
                    <div className="text-[10px]   text-muted-foreground flex justify-end mt-1"> {/* This remains unchanged */}
                        <p>
                            <strong>Shift+Return</strong> to add a new line
                        </p>
                    </div>
                </div>
            );
        };
        
        export default Editor;
        
