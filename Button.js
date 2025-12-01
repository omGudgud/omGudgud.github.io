
const In_hand=document.getElementById("total_amount");
const price=document.getElementById("win_chance_price");
const win_percentage=document.getElementById("win_percentage");
const bet_amount=document.getElementById("bet-amount");
win_percentage.innerHTML=`${game_data.base_win_chance+level_data.win_chance_change}%`;
price.innerHTML=`${level_data.win_chance_price}`
In_hand.innerHTML=`${game_data.total_balance}$`;
Decimal.set({precision:20, crypto: true, toExpPos:10});                         // a cryptographically secure random number generator, cause why not?
console.log(Decimal.random(20));
y=0;
Decimal.set({ precision: 10 });
function OnClickBigButton()
{
    y=new Decimal(game_data.bet_amount);  //main code for chance. calculates chance
    var random=Decimal.random()*100;
    if(random<=(game_data.base_win_chance+level_data.win_chance_change+50))
    {
        game_data.bet_amount=Decimal.pow(y+1,2); 
        console.log(game_data.base_win_chance+level_data.win_chance_change);   
    }
    else
    {
        game_data.bet_amount=0;
    }
    k=new Decimal(game_data.bet_amount);
    const test=document.getElementById("win_chance_price");
    z=Decimal.div(k,y);
    console.log(z);
    for(let i=1;i<=10;i++)
    {
        setTimeout(() => {bet_amount.innerHTML=`${Decimal.ceil(Decimal.mul(y,(Decimal.pow(z,(i*0.1)))))}$`;}, 25*i); // apologies for any unfortunate eye that had to see this
        console.log("this executed");
    }
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


function OnClickBetButton(a,b)
{
    const bet_button=document.getElementById(b)
    b=new Decimal(a);
    const balance=document.getElementById("total_amount");
    const bet=document.getElementById("bet-amount");
    if (game_data.total_balance>=a) {
        game_data.total_balance=Decimal.sub(game_data.total_balance,b);
        game_data.bet_amount=Decimal.add(game_data.bet_amount,b);
        balance.innerHTML=`${game_data.total_balance} $`;
        bet.innerHTML=`${game_data.bet_amount} $`;
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
        In_hand.innerHTML=`${game_data.total_balance}$`;
    }
}

function OnClickWithdrawButton()
{
    game_data.total_balance=Decimal.add(game_data.total_balance,game_data.bet_amount);
    In_hand.innerHTML=`${game_data.total_balance}$`;
    game_data.bet_amount=0;
    bet_amount.innerHTML=`${game_data.bet_amount}$`;

}