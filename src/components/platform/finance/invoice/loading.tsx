import Image from "next/image";

export default function Loading(){
    return(
        <div className="flex justify-center items-center min-h-24 flex-col gap-4">
            <Image
                src={"/Loading.png"}
                alt="loading"
                width={40}
                height={40}
                className="select-none transition-all animate-spin"
            />
            <p className="text-muted-foreground">Loading...</p>
        </div>
    )
}