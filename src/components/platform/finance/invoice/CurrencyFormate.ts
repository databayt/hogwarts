export default function currencyFormat(amt : number,currency : string){
    return  new Intl.NumberFormat("en-us", {
          style: "currency",
          currency: currency,
        }).format(amt);

}