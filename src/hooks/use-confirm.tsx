import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export const useConfirm = (
    title: string,
    message: string,
): [() => JSX.Element, () => Promise<unknown>] => {

    const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);

    const confirm = () => new Promise<boolean>((resolve, reject) => {
        setPromise({ resolve });
    });

    const handleClose = () => {
        setPromise(null);
    };

    const handleCancel = () => {
        promise?.resolve(false);
        handleClose();
    };

    const handleConfirm = () => {
        promise?.resolve(true);
        handleClose();
    };

    const ConfirmDialog = () => (
        <Dialog open={promise !== null} onOpenChange={handleClose}>
            <DialogContent className="p-0 bg-gray-50 overflow-hidden " >
                <DialogHeader>
                    <DialogTitle className="ml-3 px-3 pt-3">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="p-2" >
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-2 pb-2 pr-2">
                    <Button onClick={handleCancel} variant="outline">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return [ConfirmDialog, confirm];
};
