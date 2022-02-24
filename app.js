const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const NodeCache = require("node-cache");
const app = express()
app.use(express.json())

let i = 1;

let myCacheOne = new NodeCache({ stdTTL: 120, checkperiod: 120 });
let myCacheTwo = new NodeCache({ stdTTL: 120, checkperiod: 120 });

// function loadbalancer(){
//     myCacheOne.flushAll();
//     myCacheOne = {...myCacheTwo}
//     myCacheTwo.flushAll;
// }

///Can be implemented simply using array

setInterval(()=>{
    myCacheOne.flushAll();
    myCacheOne = {...myCacheTwo}
    myCacheTwo.flushAll;
}, 60000);

app.get('/', async(req, res)=>{
    let OneKeys = myCacheOne.getStats().keys;
    let TwoKeys = myCacheTwo.getStats().keys;

    console.log("OneKeys", OneKeys);
    console.log("TwoKeys", TwoKeys);

    if(OneKeys >= 20 && TwoKeys >= 20)return res.status(503).json({
        message: "Server is busy. Try again after a minute!"
    }) 

    if(OneKeys < 20){
        let success = myCacheOne.set(i++, req.body)
        if(success){
            const jokeRes = await fetch('https://v2.jokeapi.dev/joke/Any')
            const data = await jokeRes.json();
            return res.status(200).json({
                message: "Successful Request!",
                data
            })
        }
    }
    
    if(OneKeys>=20 && TwoKeys<20){
        let success = myCacheTwo.set(i++, req.body, 120)
        if(success){
            setTimeout(async()=>{
                const jokeRes = await fetch('https://v2.jokeapi.dev/joke/Any')
                const data = await jokeRes.json();
                return res.status(200).json({
                message: "Successful Request!",
                data
                })
            }, 60000)
        }else return res.status(401).json({
            message: "Unexpected error"
        })
    }
    
})

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})
