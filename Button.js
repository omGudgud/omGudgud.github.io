Decimal.set({precision:20, crypto: true, toExpPos:10,}); 
switch_check_win=1;
const click=new Audio('assets/click.wav');
const coin=new Audio('assets/chips.wav');
coin.volume=0.1;
const In_hand=document.getElementById("total_amount");
const price=document.getElementById("win_chance_price");
const win_percentage=document.getElementById("win_percentage");
const bet_amount=document.getElementById("bet-amount");
win_percentage.innerHTML=`${game_data.base_win_chance+level_data.win_chance_change}%`;
price.innerHTML=`${level_data.win_chance_price}`
In_hand.innerHTML=`${game_data.total_balance}$`;                        // a cryptographically secure random number generator, cause why not?
console.log(Decimal.random(20));
y=new Decimal('0').toSD(1);
Decimal.set({ precision: 10 });
var addInterval;
var IntervalTimer;
var holdDelayCheck=0;
var NextGambit=Decimal.random()*20 +40;
function OnClickBigButton()
{
    y=new Decimal(game_data.bet_amount);  //main code for chance. calculates chance
    var random=Decimal.random()*100;
    if(random<=(game_data.base_win_chance+level_data.win_chance_change))
    {
        switch_check_win=1;
        game_data.bet_amount=Decimal.mul(y,2); 
        console.log(game_data.base_win_chance+level_data.win_chance_change);
    }
    else
    {
        game_data.bet_amount=0;
        switch_check_win=0;
    }
    k=new Decimal(game_data.bet_amount);
    const test=document.getElementById("win_chance_price");
    z=Decimal.div(k,y);
    console.log(z);
    for(let i=1;i<=10;i++)
    {
        setTimeout(() => {bet_amount.innerHTML=`${Decimal.ceil(Decimal.mul(y,(Decimal.pow(z,(i*0.1)))))}$`;}, 25*i); // apologies for any unfortunate eye that had to see this. the logic is simple tho. it's an animation where number increases at intervals of 25ms 10 times. it increases by a geometric progression
    }
    level_data.multiplier=new Decimal(2);
    click.pause();
    click.currentTime=0;
    click.play();
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
     if(switch_check_win===1)
    {
    text.style.animation="none";
    void text.offsetWidth;
    text.style.animation= "press2 0.25s linear";
    }  
    if(switch_check_win===0)
    {
    text.style.animation="none";
    void text.offsetWidth;
    text.style.animation= "shake2 0.2s linear";
    }
}


function OnClickBetButton(a,c)
{
    coin.pause();
    coin.currentTime=0;
    coin.play();
    const bet_button=document.getElementById(c); 
    console.log("hold test sucessfull");
    b=new Decimal(a);
    const balance=document.getElementById("total_amount");
    const bet=document.getElementById("bet-amount");
    if (game_data.total_balance>=a) {
        game_data.total_balance=Decimal.sub(game_data.total_balance,b);
        game_data.bet_amount=Decimal.add(game_data.bet_amount,b);
        balance.innerHTML=`${game_data.total_balance}$`;
        bet.innerHTML=`${game_data.bet_amount}$`;
    }
    bet_button.style.animation="none";
    void bet_button.offsetWidth;
    bet_button.style.animation= "oscillate 0.25s linear"
}

function OnClickWinChanceUpgradeButton() 
{
    if(game_data.total_balance>=level_data.win_chance_price)
    {
        game_data.total_balance=game_data.total_balance-level_data.win_chance_price; // decrease total balance, no it's not Ai generated, some of us like to be organised
        level_data.win_chance_change=level_data.win_chance_change+5;    // win_chance_change is a seperate variable to make further calculations simpler
        win_percentage.innerHTML=`${game_data.base_win_chance+level_data.win_chance_change}%`;
        level_data.win_chance_price=level_data.win_chance_price*2;
        price.innerHTML=`${level_data.win_chance_price}`;
        x=new Decimal(game_data.total_balance);
        In_hand.innerHTML=`${x.toSD(10)}$`;
    }
}

function OnClickWithdrawButton()
{
    game_data.total_balance=Decimal.add(Decimal.sub(game_data.total_balance,1),game_data.bet_amount);
    x=new Decimal(game_data.total_balance);
    In_hand.innerHTML=`${x.toSD(10)}$`;
    game_data.bet_amount=new Decimal('1');
    bet_amount.innerHTML=`${game_data.bet_amount}$`;

}

function OnHoldBetButton(a,c)
{
    OnClickBetButton(a,c);
    IntervalTimer= setTimeout(() => {
    const button=document.getElementById(c);
    if(holdDelayCheck==0)
        {
            
        }
    holdDelayCheck=1;
    addInterval= setInterval(()=>{
        OnClickBetButton(a,c);
    },100)
    }, 400);
}

function OnClickMultiplyBetButton(a,c)
{
    coin.pause();
    coin.currentTime=0;
    coin.play();
    const bet_button=document.getElementById(c); 
    console.log("hold test sucessfull");
    b=new Decimal(a);
    const balance=document.getElementById("total_amount");
    const bet=document.getElementById("bet-amount");
    Total_balance_local=new Decimal(game_data.total_balance);
    if (Total_balance_local.cmp(Decimal.sub(Decimal.mul(b,game_data.bet_amount),game_data.bet_amount))===1) 
        {
        console.log("comparision sucessfull");
        game_data.total_balance=Decimal.sub(game_data.total_balance,Decimal.sub(Decimal.mul(b,game_data.bet_amount),game_data.bet_amount));// thanks to decimal.js, simple addition multiplication will look horrendus
        game_data.bet_amount=Decimal.add(0,Decimal.mul(b,game_data.bet_amount));
        balance.innerHTML=`${game_data.total_balance}$`;
        bet.innerHTML=`${game_data.bet_amount}$`;
    }
    bet_button.style.animation="none";
    void bet_button.offsetWidth;
    bet_button.style.animation= "oscillate 0.25s linear"
}

function cancelHold()
{
    clearInterval(addInterval);
    clearTimeout(IntervalTimer);
    holdDelayCheck=0;
}
function OnClickBetButtonOnce(a,c) // redundant function
{
    OnClickBetButton(a,c);
    cancelHold();
}