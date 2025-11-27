// global.crypto=require('crypto');
Decimal.set({crypto:true});
console.log(Decimal.random(20));
x= new Decimal(2);
y=0;
Decimal.set({ precision: 10 });
function OnClickBigButton()
{
    var random=Decimal.random()*100;
    if(random<=100)
    {
        x=Decimal.pow(x,2);    
    }
    else
    {
        x=0;
    }
    console.log(random);
    console.log(x);
    k=new Decimal(x);
    x=Decimal.pow(x,2);
    y=new Decimal(x);
    const bet_amount=document.getElementById("bet-amount");
    const test=document.getElementById("win_chance_price");
    z=Decimal.div(y,k);
    for(let i=1;i<=10;i++)
    {
        setTimeout(() => {bet_amount.innerHTML=`${Decimal.ceil(Decimal.mul(k,(Decimal.pow(z,(i*0.1)))))}`;}, 25*i); // apologies for any unfortunate eye that had to see this
        console.log("this executed");
    }
    //bet_amount.innerHTML=`${x}`;
    test.innerHTML=`${x}`;
    level_data.multiplier=new Decimal(5);
    console.log(level_data.multiplier);
    bet_amount.style.color="#ffffff";

}

function button_animation()
{

    const button=document.getElementById("btn-11");
    const text=document.getElementById("bet-amount");
    button.style.animation="none";
    void button.offsetWidth;
    button.style.animation= "press 0.25s linear";
    text.style.animation="none";
    void text.offsetWidth;
    text.style.animation= "press2 0.25s linear";
}


