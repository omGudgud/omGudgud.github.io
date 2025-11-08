num1={
"man":123.593893,
"exp":354
};
num2=
{
"man":43242.124,
"exp":374
}

function Large_add(a,b)
{
    c={
    "man":0,
    "exp":0
    };
    if(a.exp===b.exp)
    {
       c.man=a.man+b.man;
       c.exp=a.exp; 
    }
    else if((a.exp+10)===b.exp)
    {
        c.man=b.man+(a.man/10000000000);
        c.exp=b.exp;
    }
    else if((b.exp+10)===a.exp)
    {
        c.man=a.man+(b.man/10000000000);
        c.exp=a.exp;
    }
    else
    {
        c=(a.exp>b.exp) ? a:b;
    }
    return c;
}

console.log(Large_add(num1,num2));
console.log("this is a test");
console.log(game_data.life);

function large_pow()
{
list={
    "1":{"man":2,"exp":0},
    "2":{"man":4,"exp":0},
    "3":{"man":16,"exp":0},
    "4":{"man":256,"exp":0},
    "5":{"man":65536,"exp":0},
    "6":{"man":4294967296,"exp":0},
    "7":{"man":1844674407,"exp":10},
    "8":{"man":340282366.92"exp":30},
    "9":{"man":11579208.923,"exp":70},
    "10":{"man":1.340780792,"exp":150},
    "11":{"man":17976.93134,"exp":280},
    "4":{"man":256,"exp":0},
    "5":{"man":65536,"exp":0},
    "6":{"man":4294967296,"exp":0},
    "7":{"man":1844674407,"exp":10},
    "8":{"man":340282366.92"exp":30},

};
}