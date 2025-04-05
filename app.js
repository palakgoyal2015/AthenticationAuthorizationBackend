const express=require("express")
const app=express()
const userModel=require('./models/user')
const cookieParser=require("cookie-parser")
const bcrypt=require("bcrypt")
const postModel=require("./models/post")
const jwt=require("jsonwebtoken")
app.set("view engine","ejs")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.get("/",(req,res)=>{
    res.render("index")
})
app.post("/register",async(req,res)=>{
    const {name,username,age,email,password}=req.body
   
    let user=await userModel.findOne({email});
    if(user) return res.status(500).send("User already resgistered");

    bcrypt.genSalt(10,function(err,salt){
      bcrypt.hash(password,salt,async (err,hash)=>{
        let userCreated=await userModel.create({
            name,
            username,
            age,
            email,
            password:hash
        });
        let token=jwt.sign({email:email,userid:userCreated._id},"shhhh");
        res.cookie("token",token)
        console.log(token)
        res.send("registered")
       
      })
    })

   
})

app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/profile",isLoggedIn,async(req,res)=>{
  let user=await userModel.findOne({email:req.userCreated.email}).populate("posts")
  console.log(user)
    res.render('profile',{user})
    
})

app.post("/post",isLoggedIn,async(req,res)=>{
 let user=await userModel.findOne({email:req.userCreated.email})
 let {content}=req.body
 let post=await postModel.create({
    user:user._id,
    content
 })

 user.posts.push(post._id)
 await user.save()
 res.redirect("/profile")
})



app.post("/login/create",async(req,res)=>{
    let {email,password}=req.body

    let user=await userModel.findOne({email:email})
    if(!user) return res.status(500).send("internal Server Error")
    bcrypt.compare(password,user.password,function(err,result){
if(result){
    let token=jwt.sign({email:email,userid:user._id},"shhhh");
    res.cookie("token",token)
    res.status(200).redirect("/profile")
}else{
    return res.redirect("/login")
}
})
})



app.get("/logout",async(req,res)=>{
    res.cookie("token","");
    res.render("login")
})
function isLoggedIn(req,res,next){
   if(req.cookies.token==="") return res.redirect("/login")
    else{
    let data=jwt.verify(req.cookies.token,"shhhh")
    req.userCreated=data
    next()
    }
   
}
app.listen(3000)