export default async function imabebase64(image : File):Promise<string>{
    const reader  = new FileReader()
    reader.readAsDataURL(image)

    return new Promise((resolve,reject)=>{
        reader.onload = () => resolve(reader.result as string)

        reader.onerror = (error) => reject(error) 
    })
}