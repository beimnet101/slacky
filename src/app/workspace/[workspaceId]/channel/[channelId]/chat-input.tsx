import Quill from "quill";
import dynamic from "next/dynamic";
import { useRef } from "react";
  const Editor=dynamic(()=>import("@/components/editor"),{ssr:false});


 interface ChatInputProps{

  placeholder:string;
 }


  export const ChatInput=({
    placeholder}:ChatInputProps

  )=>{

  const editorRef=useRef<Quill|null>(null);
     const handleSubmit=(
  {body,
  image}:{body:string;
  image:File|null;

 })=>{ console.log({body,image});

 };

 return(
    <div className="px-5 w-full ">
    <Editor
    
    placeholder={placeholder}
    variant="create"
    onSubmit={handleSubmit}
    
    disabled={false}
    innerRef={editorRef}
  
    />
    </div>

 );
 

}