// global.crypto=require('crypto');
Decimal.set({crypto:true});
console.log(Decimal.random(20));
x= new Decimal(2);
y=0;
Decimal.set({ precision: 10 });
function OnClickBigButton()
{
    var random=Decimal.random()*100;
    if(random<=60)
    {
        x=Decimal.pow(x,2);    
    }
    else
    {
        x=0;
    }
    console.log(random);
    console.log(x);
    x=Decimal.pow(x,2);
    y=x.toExponential(10);
    const bet_amount=document.getElementById("bet-amount");
    bet_amount.innerHTML=`${x}`;
    level_data.multiplier=new Decimal(5);
    console.log(level_data.multiplier);

}


