const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

let users = [
    {id:1, name:"John Doe", email:"john.doe@email.com"},
    {id:2, name:"Jane Smith", email:"jane.smith@email.com"}
];

app.get('/api/users/list',(req,res)=>{res.json(users)});

app.get('/api/users/get/:uid',(req,res)=>{
    const id = parseInt(req.params.uid);
    const user = users.find(u=>u.id===id);
    if(!user)
    {
        return res.status(404).json({error:"User Not Found"});
    }
    res.json(user);
});

app.post('/api/users/add',(req,res)=>{
    const {name,email} = req.body;
    const newUser = {
        id : users.length+1,
        name,
        email
    };
    users.push(newUser);

    res.status(201).json(newUser);
});

app.put('/api/users/edit',(req,res)=>{
    const id = parseInt(req.body.id);
    const name = req.body.name;
    const email = req.body.email;
    //const {id, name, email} = req.body;
    if(!users.find(u=>u.id==id))
        return res.status(404).json({error:"User with the given Id - " + id + " not present "})
    
    const index = users.findIndex(u=>u.id==id);
    users[index] = {id, ...req.body};
    res.status(200).json(users[index]);
});

app.delete('/api/users/delete/:id',(req,res)=>{
    const id = parseInt(req.params.id);
    users = users.filter(u=>u.id!=id);
    return res.status(204).send();
});

app.listen(port,()=>{console.log("Server running on port "+ port)});