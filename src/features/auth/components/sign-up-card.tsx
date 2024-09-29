
import{FcGoogle }from "react-icons/fc"
import{FaGithub }from "react-icons/fa"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SignInFlow } from "../types";
import { useState } from "react";
import{TriangleAlert} from"lucide-react";
import {useAuthActions} from "@convex-dev/auth/react";

interface  SignUpCardProps{
setState:(state:SignInFlow)=>void;
};

export const SignUpCard = ( {setState}:SignUpCardProps) => {
    
    const[name, setName]=useState("");
    const{signIn} =useAuthActions();
    const[email,setEmail]=useState("");
    const[password,setPassword]=useState("");
    const[confirmPassword,setcConfirmPassword]=useState("");
    const[error, setError]=useState("");
     const[pending,setPending]=useState(false);
       const onPasswordSignUp=(e:React.FormEvent<HTMLFormElement>)=>{

                                   e.preventDefault();
                           if(password!==confirmPassword){
                      setError("password does not match");
                               return;
                            }
                         setPending(true);
                         signIn("password",{name,email,password,flow:"signUp"}).catch(
                                                          ()=>{
                                      setError("something went wrong");
        }
     ).finally(()=>{
        setPending(false);

     })
    }
          
     const onProviderSignUp=(value:"github"|"google")=>{
        signIn(value);
        console.log(`Attempting sign-in with: ${value}`);
      
   
        };  
    
   
    return (
    <Card className="w=full h-full p-8">
     <CardHeader  className="px-0 pt-0">
         <CardTitle>
        Sign Up to continue
        </CardTitle>
        <CardDescription>
              use your email or another service to continnue

        </CardDescription>
        </CardHeader>
        {!!error && (
         <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive mb-6">
          <TriangleAlert className="size-4"/>
          <p>{error}</p>

           

        </div>
      )}
    
 <CardContent className="space-y-5 px-0 pb-0">
   <form onSubmit={onPasswordSignUp} className="space-y-2.5">

   <Input
     disabled={pending}
     value={name}
     onChange={(e)=>setName(e.target.value)}
     placeholder="Full Name"

     required

     />



     <Input
     disabled={pending}
     value={email}
     onChange={(e)=>setEmail(e.target.value)}
     placeholder="Email"
     type="email"
     required

     
     />
     <Input
     disabled={pending}
     value={password}
     onChange={(e)=>setPassword(e.target.value)}
     placeholder="Password"
     type="Password"
     required

     
     />
     
          <Input
     disabled={pending}
     value={confirmPassword}
     onChange={(e)=>setcConfirmPassword(e.target.value)}
     placeholder="confirm password"
     type="Password"
     required

     
     />
<Button type="submit"className="w-full  " size="lg" disabled={false}>
    continue
</Button>


        </form>
        <Separator/>
        <div className="flex flex-col gap-y-2.5
        ">
           <Button disabled={pending}
           onClick={()=>onProviderSignUp("google")}
           variant={"outline"}
           size="lg"
           className="w-full relative">

        
continue with google

       <FcGoogle className="size-5 absolute top-3 left-2.5"/>

           </Button>
           <Button disabled={pending}
           onClick={()=>onProviderSignUp("github")}
           variant={"outline"}
           size="lg"
           className="w-full relative">

        
continue with github

       <FaGithub className="size-5 absolute top-3 left-2.5"/>

           </Button>


        </div>
        <p className="text=xs text-muted-foreground"> already have an account?<span onClick={()=>setState("signIn")} className="text-sky-700 hover:underline cursor-pointer">Sign In</span></p>

       

        </CardContent >
 
  </Card>


    );
};