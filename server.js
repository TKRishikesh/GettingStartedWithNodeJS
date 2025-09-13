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
        id : users[users.length-1]+1,
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



//gRPC Server Impl

const gRPC = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDef = protoLoader.loadSync("users.proto");
const grpcObject = gRPC.loadPackageDefinition(packageDef);


const userPackage = grpcObject.userPackage;
const grpcServer = new gRPC.Server();

grpcServer.addService(userPackage.User.service,{
    "ListUsers" : listUsers,
    "GetUser" : getUser,
    "CreateUser" : createUser,
    "EditUser" : editUser,
    "DeleteUser" : deleteUser
});

function listUsers(call,callback){
    callback(null,{users});
}

function getUser(call,callback)
{
    const user = users.find(u=>u.id == call.request.id);
    if(user)
        callback(null,user);
    else
        callback({
            code:gRPC.status.NOT_FOUND,
            details:"User Not Found"});
}

function createUser(call,callback)
{
    const name = call.request.name;
    const email = call.request.email;
    const user = {
        id:users[users.length-1].id+1,
        name : name,
        email : email,
    }
    users.push(user);
    callback(null,user);
}

function editUser(call,callback)
{
    const id = call.request.id;
    const index = users.findIndex(u=>u.id == id);
    if(index>0)
    {
        users[index] = {
                    id : id,
                    name : call.request.name,
                    email: call.request.email
                };
        callback(null,users[index]);
    }
    else
        callback({
            code:gRPC.status.INVALID_ARGUMENT,
            details:"Given ID not present",
        })
}

function deleteUser(call,callback)
{
    const id = call.request.id;
    const index = users.findIndex(u=>u.id == id);
    if(index>=0)
    {
        users = users.filter(u=>u.id!=id);
        callback(null,null);
    }
    else
    {
        callback({
            code:gRPC.status.INVALID_ARGUMENT,
            details:"Given ID not present",
        })
    }
}

grpcServer.bindAsync("127.0.0.1:50051",gRPC.ServerCredentials.createInsecure(),
(error,port) => {
    grpcServer.start();
    console.log('grpc server running on port 500051');
});