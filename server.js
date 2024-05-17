const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'ejs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = 'mongodb://localhost:27017/Final';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB...');
    
  })
  .catch(err => console.error('Could not connect to MongoDB:', err));


const adminSchema = new mongoose.Schema({
    aname: String,
    pass: String
});

const orderSchema = new mongoose.Schema({
    studentid: { type: String, required: true },
    studentname: { type: String, required: true },
    mjuice: { type: Number, default: false },
    bjuice: { type: Number, default: false },
    ajuice: { type: Number, default: false },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true }
});

const Order=mongoose.model('orders', orderSchema);
const Admin=mongoose.model('admins', adminSchema);



function validId(id) {
    const regex = /^\d{3}-\d{4}$/;
    return regex.test(id);
}

app.post('/orderPlaced', (req, res) => {
    const mangoQuantity = req.body.mangoQuantity;
    const berryQuantity = req.body.berryQuantity;
    const appleQuantity = req.body.appleQuantity;
    const studentName = req.body.studentName;
    const studentID = req.body.studentID;
    const price={total:mangoQuantity*6.99+berryQuantity*5.99+appleQuantity*3.99,}
    let nameError = null;
    let idError = null;

    
    if (!studentName || studentName.trim() === '') {
        nameError = 'Please enter a valid student name.';
    }

    
    if (!studentID || !validId(studentID)) {
        idError = 'Please enter a valid student ID in the format "xxx-xxxx".';
    }
    if (mangoQuantity > 0 || berryQuantity > 0 || appleQuantity > 0) {
        if (nameError || idError) {
            res.render('index',{isLoginForm :false, isLoginButton:true ,isUser: false ,isOrder:false,isError:true,error:nameError + idError,orderForm:true});
        } else {
            const newOrder = new Order({
                studentid: studentID,
                studentname: studentName,
                mjuice: mangoQuantity,
                bjuice: berryQuantity,
                ajuice: appleQuantity,
                subtotal: (price.total).toFixed(2),
                tax: (price.total*0.13).toFixed(2),
                total: (price.total*1.13).toFixed(2)
            });
            newOrder.save()
        .then(order => {
            res.render('index', {isLoginForm:false,  isLoginButton:true ,isUser: false,isOrder:true,order:order,isError:false,orderForm:false});
        })
        .catch(err => {
            console.error('Error saving order:', err);
        });
    }
    }
   
   });

app.get('/', (req, res) => {
    res.render('index', { isLoginButton:true ,isUser: false,isOrder:false,isLoginForm:false,isError:false,orderForm:true});
});
app.get('/login', (req, res) => {
    res.render('index',{ isLoginButton:true ,isUser: false,isOrder:false,isLoginForm:true,isError:false,orderForm:false}); // Render the login form template
});


app.post('/login', async(req, res) => {
    const { username, password } = req.body;
    console.log(username,password);
    try {
        const user =  await Admin.findOne({ aname: username, pass: password });
        console.log(user);
        if (Object.keys(user).length > 0) {
            res.render('index', { isLoginButton:false ,isUser: true,isOrder:false,isLoginForm:false,isError:false,orderForm:false,allOrders:false});
        } else {
          res.redirect('/login');
        }
      } catch (error) {
        console.log(error);
        res.redirect('/login');
      }
});
app.get('/orders',async(req,res)=>{
    try {
        const order =  await Order.find({});
        console.log(order);
        res.render('index',{ isLoginForm:false ,isLoginButton:false ,isUser: true,isOrder:false,isError:false,orderForm:false,allOrders:true,orders :order});
      } catch (error) {
        console.log(error);
        res.send('error occured ');
      }
    
    })
app.get('/logout', (req,res)=>{res.redirect('/login');})
app.get('/delete/:id', async (req, res) => {
    try {
        
        const deleteId = req.params.id;

        
        await Order.findByIdAndDelete(deleteId);
        const order =  await Order.find({});
        res.redirect('/orders')
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).send('Internal server error');
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});