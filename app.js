var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var User = require("./models/user");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var expressSanitizer = require("express-sanitizer");
var expressSession = require("express-session");


app.use(expressSession({
    secret: "Manish became one of the best developer",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

//APP CONFIG

var dbUrl = "mongodb://blogs:123manish@ds231307.mlab.com:31307/college_ideas";
mongoose.connect(dbUrl, {useNewUrlParser: true}, function(err){
    console.log("mongoDB connected", err);
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    // res.locals.error = req.flash("error");
    // res.locals.success = req.flash("success");
    next();
})




passport.use(new LocalStrategy (User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




//POST SCHEMA

var postSchema = new mongoose.Schema({
    content: String,
    author: String,
    date: {type: Date, default:Date.now},
});

var Post = mongoose.model("Post", postSchema);



//MONGOOSE/MODEL CONFIG

var blogSchema = new mongoose.Schema({
    title: String,
    body: String,
    created : {type: Date, default:Date.now},
    posts: [postSchema],
})

var Blog = mongoose.model("Blog", blogSchema);



//RESTFUL ROUTES

app.get("/",isLoggedIn, function(req, res){
    res.redirect("/blogs");
})

app.get("/blogs",isLoggedIn, function(req, res){
    Blog.find({}, function(err, blogs){
        if(err){
            console.log("ERROR!!!");
        }else {
            res.render("index", {blogs : blogs})
        }
    })
});

//NEW ROUTES

app.get("/blogs/new",isLoggedIn, function(req, res){
    res.render("new");
})

//CREATE ROUTES

app.post("/blogs",isLoggedIn, function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            console.log(err);
            res.render("new");
        }else{
            console.log("Created new blog!!!")
            res.redirect("/blogs");
        }
    })
})


//SHOW ROUTE

app.get("/blogs/:id",isLoggedIn, function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        }else {
            res.render("show", {blog: foundBlog});
        }
    })
});


// EDIT ROUTE

app.get("/blogs/:id/edit",isLoggedIn, function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        }else {
            res.render("edit", {blog: foundBlog});
        }
    })
    
});

// UPDATE ROUTE

app.put("/blogs/:id",isLoggedIn, function(req, res){
   req.body.blog.body = req.sanitize(req.body.blog.body);
   Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
       if(err){
           res.redirect("/blogs");
       } else {
           res.redirect("/blogs/" + req.params.id);
       }
   })
});


// DELETE ROUTE

app.delete("/blogs/:id",isLoggedIn, function(req, res){
    //destroy blog
    Blog.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/blogs");    
        }else {
            res.redirect("/blogs");
        }
        
    })
    //redirect somewhere
})



//COMMENT ROUTE

app.get("/blogs/:id/comments/new", isLoggedIn,function(req, res){
    Blog.findById(req.params.id, function(err, cat){
        if(err){
            console.log(err);
        }else {
            res.render("commentform", {cat : cat})
        }
    })
})


app.post("/blogs/:id/comments", isLoggedIn,function(req, res){
    // console.log(req.body);
    Blog.findById(req.params.id, function(err, cat){
        if(err){
            console.log(err);
            res.redirect("/blogs");
        }else {
            // console.log(currentUser.username);
            cat.posts.push({
                content: req.body.comment,
                author: req.body.author,
            })
            cat.save(function(err, cat){
                if(err){
                    console.log(err);
                }else {
                    // console.log(cat);
                }
            })
        }
    })

    res.redirect("/blogs/" + req.params.id);
})




//  ==================
//      AUTH ROUTE
//  ==================

//SINE IN ROUTE

app.get("/register", function(req, res){
    res.render("register");
})

app.post("/register", function(req, res){
    User.register(new User({username : req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.redirect("/register");
        } 
        passport.authenticate("local")(req, res, function(){
            res.redirect("/blogs");
        })
    })
});


//Login Route

app.get("/login", function(req, res){
    res.render("login");
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/blogs",
    failureRedirect: "/login",
}), function(req, res){

});



///LOGOUT

app.get("/logout", function(req, res){
    req.logOut();
    res.redirect("/");
})


//Midware

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}




var port = process.env.PORT || 3000;
app.listen(port,function(){
    console.log("Server is runing");
})