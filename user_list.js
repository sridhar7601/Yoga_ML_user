const gif = ['https://media.giphy.com/media/YONOfpU88lg0RkO8MM/giphy.gif',
"https://media.giphy.com/media/3o7WTIHPzEIqJIMryU/giphy.gif",
"https://media.giphy.com/media/3oKIPavRPgJYaNI97W/giphy.gif",
"https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif",
"https://media.giphy.com/media/kcT0AAkJxu8xTKfjwd/giphy.gif",
"https://media.giphy.com/media/loG7TbqLitOPTVfg3o/giphy.gif",
"https://media.giphy.com/media/dyoW56xY2r6z1ARtT6/giphy.gif",
'https://media.giphy.com/media/YONOfpU88lg0RkO8MM/giphy.gif',
"https://media.giphy.com/media/3o7WTIHPzEIqJIMryU/giphy.gif",
"https://media.giphy.com/media/3oKIPavRPgJYaNI97W/giphy.gif",
"https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif",
"https://media.giphy.com/media/kcT0AAkJxu8xTKfjwd/giphy.gif",
"https://media.giphy.com/media/loG7TbqLitOPTVfg3o/giphy.gif",
"https://media.giphy.com/media/dyoW56xY2r6z1ARtT6/giphy.gif",
"https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif","https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif",
"https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif",
"https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif",
"https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif",
"https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif",
"https://media.giphy.com/media/110iEAeBBmNmlq/giphy.gif",]
console.log("you have enterd the list page")
function clicked(e,label){
    //alert("d")
    console.log("data",e)
   
    const body = document.getElementById('body')
    body.classList.add('cards-list');
    
    const cards = document.createElement('div')
    cards.classList.add("card")

    const card_img = document.createElement('div')
    card_img.classList.add("card_image")
    const img = document.createElement('img')
    img.src = gif[Math.floor(Math.random() * 6) + 1];
    card_img.append(img);
    
    const card_title = document.createElement('div')
    //for(i = 0 ; i >= e; i ++){
        
        card_title.innerText = label;
        console.log("this is fr name",label)
        card_title.classList.add("title")
    //}
    
    card_title.append("");
    const button = document.createElement('button')
    button.onclick = ()=>{
        localStorage.setItem("id",e);
       
        console.log("this is fr local",e)
        location.href = "/user_demo.html"
        // window.location = "user_demo.html"
    }; 
    button.classList.add("fill")
    button.id = e;
    button.innerText="Click here"

    card_title.append(button);

    cards.append(card_img);
    cards.append(card_title);
    body.appendChild(cards);
}
//clicked();
//declaring ap 
const api_url = "https://staging.knowinmy.com/subscriptions/poses/";
async function getapi(api_url) {
    
    // Storing response
    const response = await fetch(api_url);
    
    // Storing data in form of JSON
    let data = await response.json();
     listofyoga(data)
}
 getapi(api_url);

function listofyoga(data){
     //console.log(data.data.length)
     for(let i=0 ; i < data.poses.length;i++ ){
        let label =  data.poses[i].label;
    clicked(data.poses[i].id, label);
    // console.log("working",data.poses[i].id)
     }
    //  for (i = 0 ; data)
}
