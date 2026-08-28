import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"

interface ThumbnailProps {
    url: string | null | undefined;
};

export const Thumbnail = ({
    url,
}: ThumbnailProps) => {
    if (!url) return null;
    return (
        <Dialog>
            <DialogTrigger>
                <div className="relative overflow-hidden max-w-[360px] border rounded-lg my-2 cursor-zoom-in">
                    <img
                        src={url}
                        alt="message image"
                        className="rounded-md object-cover size-full"
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] border-none bg-transparent p-0 shadow-none">
                <img
                    src={url}
                    alt="message image"
                    className="rounded-md object-cover size-full"
                />
            </DialogContent>
        </Dialog>
    )
}

interface VideoPlayerProps {
    url: string | null | undefined;
};

export const VideoPlayer = ({ url }: VideoPlayerProps) => {
    if (!url) return null;
    return (
        <div className="relative overflow-hidden max-w-[480px] border rounded-lg my-2">
            <video
                src={url}
                controls
                className="rounded-md w-full max-h-[320px] bg-black"
            />
        </div>
    );
}
