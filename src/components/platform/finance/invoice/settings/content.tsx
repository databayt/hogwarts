"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import imabebase64 from "./imagebase64";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

type TSignatureData = {
  name: string;
  image: string;
};

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function SettingsContent({ dictionary, lang }: Props) {
  const [logo, setLogo] = useState<string>();
  const [signatureData, setSignatureData] = useState<TSignatureData>({
    name: "",
    image: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  //handle on change signature : ex.g name
  const onChangeSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setSignatureData((preve) => {
      return {
        ...preve,
        [name]: value,
      };
    });
  };

  //handle on change signature image
  const handleSignatureImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;

    if (!files || files.length < 0) return;

    const file = files[0];

    //image to base64
    const image = await imabebase64(file);

    setSignatureData((preve) => {
      return {
        ...preve,
        image: image,
      };
    });
  };

  //handle on change logo
  const handleOnChangeLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length < 0) return;

    const file = files[0];

    //image to base64
    const image = await imabebase64(file);

    setLogo(image);
  };

  const fetchData = async () => {
    try {
      const response = await fetch("/api/settings");
      const responseData = await response.json();

      if (response.status === 200) {
        setLogo(responseData?.data?.invoiceLogo);
        setSignatureData(
          responseData?.data?.signature || { name: "", image: "" }
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async(e : React.FormEvent<HTMLFormElement>,data : any)=>{
   e.preventDefault()
    try {
        setIsLoading(true)
        const response = await fetch("/api/settings",{
            method : 'post',
            body : JSON.stringify(data)
        })

        if(response.status === 200){
            SuccessToast("Settings saved successfully");
            fetchData();
        }
    } catch (error) {
        ErrorToast("Something went wrong");
    }finally{
        setIsLoading(false)
    }
  }
  return (
    <div>
      <Accordion type="single">
        {/**Invoice Logo */}
        <AccordionItem value="Invoice-Logo">
          <AccordionTrigger className="font-semibold text-base cursor-pointer">
            Invoice Logo
          </AccordionTrigger>
          <AccordionContent>
            <form className="w-full grid gap-2" onSubmit={(e)=>handleSubmit(e,{ logo })}>
              <Input
                type="file"
                className="max-w-sm w-full"
                onChange={handleOnChangeLogo}
                required
                disabled={isLoading}
              />
              <div className="w-full max-w-xs">
                {logo ? (
                  <Image
                    className="aspect-video h-20 border-2 border-dotted max-h-20 object-scale-down"
                    src={logo}
                    width={250}
                    height={96}
                    alt="Invoice logo"
                  />
                ) : (
                  <div className="aspect-video h-20 border-2 border-dotted flex justify-center items-center rounded-lg">
                    <p className="text-center text-muted-foreground">No Data</p>
                  </div>
                )}
              </div>
              <Button className="w-fit" disabled={isLoading}>
                {isLoading ? "Please wait..." : "save"}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/***Signature in invoice */}
        <AccordionItem value="Signature-invoice">
          <AccordionTrigger className="font-semibold text-base cursor-pointer">
            {" "}
            Invoice Signature
          </AccordionTrigger>
          <AccordionContent>
            <form className="w-full grid gap-2" onSubmit={(e)=>handleSubmit(e,{ signature : signatureData })}>
              <Input
                type="text"
                placeholder="Enter your signature name"
                value={signatureData.name}
                onChange={onChangeSignature}
                name="name"
                disabled={isLoading}
              />
              <Input
                type="file"
                className="max-w-sm w-full"
                onChange={handleSignatureImage}
                disabled={isLoading}
              />
              <div className="w-full max-w-xs">
                {signatureData.image ? (
                  <Image
                    className="aspect-video h-20 border-2 border-dotted max-h-20 object-scale-down"
                    src={signatureData.image}
                    width={250}
                    height={96}
                    alt="Signature sign"
                  />
                ) : (
                  <div className="aspect-video h-20 border-2 border-dotted flex justify-center items-center rounded-lg">
                    <p className="text-center text-muted-foreground">No Data</p>
                  </div>
                )}
              </div>
              <Button className="w-fit" disabled={isLoading}>
                {isLoading ? "Please wait..." : "save"}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
