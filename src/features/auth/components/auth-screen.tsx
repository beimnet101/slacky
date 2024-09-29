"use client";

import { useState } from "react";
import { SignInFlow } from "../types";
import { SignInCard } from "./sign-in-card";  // Ensure this is a named export
import { SignUpCard } from "./sign-up-card";  // Ensure this is a named export

export const AuthScreen = () => {
    const [state, setState] = useState<SignInFlow>("signIn"); // Correct order of variables

    return (
        <div className="h-full flex items-center justify-center bg-[#5C3B58]">
            <div className="md:h-auto md:w-[420px]">
                {state === "signIn" ? <SignInCard setState={setState}/> : <SignUpCard setState={setState}/>}
            </div>
        </div>
    );
};



