import { atom, useAtom } from "jotai";
const modalState = atom(false);

export const useEditProfileModal = () => {
    return useAtom(modalState);

}