const express = require('express')
const router = express.Router()
const {connection} = require('../databses/connection')
const bcrypt = require('bcrypt')
const {v4: uuidv4} = require('uuid')
const {uploads} = require('../controller/controller')

const saltrounds = 10

const hashPassword = (password) =>{
    return bcrypt.hash(password, saltrounds)
}

const generateUniqueId = ()=>{
    return uuidv4()
}

// Home page route
router.get('/home', (req, res)=>{

    if (!req.session.user) {
       return res.redirect('/employees/login')
    }

    res.status(200).render('home', {user:req.session.user})
})

// Login page route
router.get('/login', (req, res)=>{
  
    res.status(200).render('login', {errorMessage:null, success:null})
})

// Start of Login post
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

    const querychecker = 'SELECT * FROM employees WHERE email = ?';

    connection.query(querychecker, [email], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).render('login', { errorMessage: 'Login failed, try again later' });
        }

        if (results.length > 0) {
            const hashedPassword = results[0].password; // Get hashed password from the database
            console.log(hashedPassword);
            // Compare input password with hashed password
            const passwordMatch = bcrypt.compareSync(password, hashedPassword);

            if (passwordMatch) {
                // Store user information in session
                req.session.user = {

                    email: results[0].email,
                    fname: results[0].F_Name,
                    lname: results[0].L_Name,
                    age: results[0].age,
                    status: results[0].status,
                    bg: results[0].bg,
                    address: results[0].address,
                    profile:results[0].profile,
                    category: results[0].category

                };

                // console.log(profile);})

                return res.status(200).redirect('/employees/home'); // Redirect to home after login

            } else {

                return res.render('login', { errorMessage: 'Login failed, invalid password', success: null });
            }
        } else {

            return res.render('login', { errorMessage: 'The email doesn\'t exist', success: null });
        }
    });
});

// End of the login post


router.get('/signup', (req, res)=>{
    res.status(200).render('signup', {errorMessage:null, success:null})
})

router.post('/signup', uploads.single('profile'), async (req, res) => {
    const { email, password, gender, status, bg, age, fname, lname, address, category } = req.body;
    const profileImage = req.file ? req.file.filename : null;  // Store only the filename

    if (!email || !password || !fname || !lname) {
        return res.status(400).render('signup', { errorMessage: 'All required fields must be filled.' });
    }

    const checkquery = 'SELECT * FROM employees WHERE email = ?';
    connection.query(checkquery, [email], async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).render('signup', { errorMessage: 'Error signing up, try again later' });
        }

        if (results.length > 0) {  // Check if email already exists
            return res.status(400).render('signup', { errorMessage: 'The email is already registered' });
        }

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, saltrounds);

            // Generate unique ID
            const Id = generateUniqueId();

            // Insert new employee into database
            const insertquery = `INSERT INTO employees
              (Id, F_name, L_name, email, password, age, gender, status, bg, address, profile, category) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            connection.query(insertquery, [
                Id,
                fname,
                lname,  // Use the hashed password here
                email,
                hashedPassword,
                age,
                gender,
                status,
                bg,
                address,
                profileImage,
                category  // Store only the filename
            ], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).render('signup', { errorMessage: 'Signup failed, please try again later' });
                }

                if (results.length > 0) {
                    return res.status(200).render('login', {success:'sign up successfull'})
                }

                res.redirect('/employees/login');  // Redirect to login after successful signup
            });

        } catch (error) {
            console.log(error);
            return res.status(500).render('signup', { errorMessage: 'Error signing up, try again later' });
        }
    });
});

// end of sign up post


// Admin routes
// Admin dashboard
router.get('/admin/dashboard', (req, res) => {
    // Check if the admin is logged in
    if (!req.session.admin) {
        return res.redirect('/employees/admin/login');
    }

    console.log(req.session.admin);

    // SQL query to count the number of employees
    const employeeQuery = 'SELECT COUNT(*) AS employeecount FROM employees';
    const adminQuery = 'SELECT COUNT(*) AS admincount FROM admins';

    // Execute the employee query
    connection.query(employeeQuery, (error, employeeResults) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Error retrieving employee count');
        }

        // Execute the admin query
        connection.query(adminQuery, (error, adminResults) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Error retrieving admin count');
            }

            // Extract employee and admin counts from the results
            const employeeCount = employeeResults[0].employeecount;
            const adminCount = adminResults[0].admincount;

            // Render the dashboard with the employee and admin counts
            return res.status(200).render('../../admin/dashboard', {
                employeecount: employeeCount,
                adminCount: adminCount,
                success: null,
                admin: req.session.admin
            });
        });
    });
});

// End of dashboard route


// Admin signup
router.get('/admin/signup', (req, res)=>{

    res.status(200).render('../../admin/auth/signup', {error:null, success:null})
})

router.post('/admin/signup', uploads.single('profile'), async(req, res)=>{

      const { email, password, confirmpassword, } = req.body
      const profileImage = req.file ? req.file.filename : null

    //   checks if the fields have values
    if ( !email || !password) {
        return res.status(403).render('../../admin/auth/signup', 
            {error:'All fileds are required', success:null})
    }
    //   check if the admin is logged in to avoid redanduncy
    const sqlchecker = 'SELECT * FROM admins WHERE email = ?'

    connection.query(sqlchecker, [email], async(err, results)=>{

        if (err) {
            console.log(err);
            return res.status(500).render('../../admin/auth/signup', 
                {error:'Failed to sign up, try again later', success:null})
        }

        if (results.length > 0) {



            return res.status(403).render('../../admin/auth/signup', 
                {error:'The email is already in use', success:null})
        }
        
        // Inserts data to the database
       const insertquery = "INSERT INTO admins(Id, email, password, profile) VALUES(?,?,?,?)"

       const hashedpassword = await bcrypt.hash(password, 10)
       const Id = generateUniqueId()

       if (confirmpassword != password) {
        console.log(confirmpassword, password);
          return res.status(403).render('../../admin/auth/signup', 
            {error:'password does not much confirm password', success:null})
       }

       connection.query(insertquery, [Id, email, hashedpassword, profileImage], (error, results)=>{

           if (error) {
              console.log(error);
              return res.status(403).render('../../admin/auth/signup', 
                {error:'Failed to sign up, please try again later', success:null})
           }

           if (results.length > 0) {


               return res.status(200).render('../../admin/auth/signup', 
                {error:null, success:'Signup successfull'})
           }

           res.redirect('/employees/admin/login')
       })
    })

})

// Admin's login
router.get('/admin/login', (req, res)=>{
    res.status(200).render('../../admin/auth/login', {error:null, success:null})
})

router.post('/admin/login', (req, res)=>{

    const {email, password} = req.body

    const checkquery = 'SELECT * FROM admins WHERE email = ?'

    connection.query(checkquery, [email], (error, results)=>{

        if(error){
            console.log(error);
            return res.status(500).render('../../admin/auth/login',
                 {error:'Login failed please try again later'})
        }

        if (results.length > 0 ) {


            const hashedPassword = results[0].password
            console.log(hashedPassword);

            const passwordMatch = bcrypt.compareSync(password, hashedPassword)
            
            if (passwordMatch) {
                req.session.admin = {

                    id :results[0].ID,
                    email : results[0].email,
                    profile : results[0].profile
                }

                console.log(req.session.admin);

                return res.status(200).redirect('/employees/admin/dashboard')

             } else {

                return res.status(403).render('../../admin/auth/login',
                     {error:'Login failed invalid email or password', success:null})

             } 

            } else {
                return res.status(403).render('../../admin/auth/login', 
                    {error:'Login failed, the email does not exist'})
            }
        })
    })
    // End of Admin's login


router.get('/admin/view/employees', (req, res)=>{


    if (!req.session.admin) {
        return res.redirect('/employees/admin/login')
    }

    const searchQuery = req.query.search || ''

    let query = 'SELECT * FROM employees'
    let queryparams = []

    if (searchQuery) {
        query += ' WHERE F_Name LIKE ? OR l_Name LIKE ? OR email LIKE ?'
        queryparams = [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
    }

    connection.query(query, queryparams, (error, results)=>{
        if (error) {
            console.log(error);
            return res.render('../../admin/views/employees', 
                {error:'Search failed try again later', 
                    employees:[], searchQuery:searchQuery, succcess:null})
        }

        if (results.length > 0) {
            return res.render('../../admin/views/employees', 
                {employees:results, searchQuery:searchQuery, error:null, success:null})
        } else {
            return res.render('../../admin/views/employees', 
                {error:'The email does not exists', success:null, searchQuery:[], employees:[]})
        }
    })
    // res.render('../../admin/views/employees')
})

// Admin add employee route
router.get('/admin/add/employee/', (req, res)=>{
    if (!req.session.admin) {
        return res.redirect('/employees/admin/login')
    }

    res.render('../../admin/views/addemployee', {error:null, success:null})
})

// Add employee Logic
router.post('/admin/add/employee',uploads.single('profile'), async(req, res)=>{

    
    const {fname, lname, email,password, age, gender,status,bg, address, category} =req.body
    const profile = req.file ? req.file.filename : null

    const querychecker = 'SELECT * FROM employees WHERE email = ?'

    connection.query(querychecker, [email], async(error, results)=>{
        if (error) {
            console.log(error);
            res.render('../../admin/views/addemployee',
                 {error:'Failed to reqister employee', succcess:null})
        }

        if (results.length > 0) {
            res.render('../../admin/views/addemployee', 
                {error:'The email is already registered', success:null})
        }

        const insertquery = 'INSERT INTO employees(ID, F_Name, L_Name, email, password, age, gender, status, bg, address, profile, category) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
        const hashedPassword = await bcrypt.hash(password, 10)
        const id = generateUniqueId()

        connection.query(insertquery, [
            id,
            fname, 
            lname,
            email,
            hashedPassword,
            age, 
            gender,
            status,
            bg,
            address,
            profile,
            category], 
            (error, results)=>{
                if (error) {
                    console.log(error);
                    return res.render('../../admin/views/addemployee',
                        {error:'something went wrong, please try again', success:null})
                }

                if (results.length > 0) {
                    return res.render('../../admin/views/addemployee', 
                        {error:null, succcess:'Employee added successfully'})
                }

                res.redirect('/employees/admin/add/employee')

            })
    }) 
})

// Admin edit employee
router.get('/admin/edit/employee/:id', (req, res)=>{

    const id = req.params.id
    const checkquery = 'SELECT * FROM employees WHERE ID = ?'
    
    connection.query(checkquery, [id], (error, results)=>{
        if (error || results.length === 0) {
            console.log(error);
            return res.render('../../admin/views/editemployees',
                 {error:'Failed, please try again later', success:null})
        }

        if (results.length > 0) {
            return res.render('../../admin/views/editemployees', {error:null, success:null, employee:results[0]})
        }
    })
    // res.render('../../admin/views/editemployee')
})

router.post('/admin/edit/employee/:id',uploads.single('profile'), async (req, res) => {
    const { fname, lname, email, password, age, gender, status, bg, address, category } = req.body;
    // console.log(req.body);
    const profile = req.file ? req.file.filename : null;
    const id = req.params.id;

    try {
        // Hash the new password only if provided, otherwise retain the old password
        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Construct the SQL query dynamically, considering whether profile image and password are updated
        let query = 'UPDATE employees SET F_Name = ?, L_Name = ?, email = ?, age = ?, gender = ?, status = ?, bg = ?, address = ?, category = ?';
        const queryParams = [fname, lname, email, age, gender, status, bg, address, category];

        if (hashedPassword) {
            query += ', password = ?';
            queryParams.push(hashedPassword);
        }

        if (profile) {
            query += ', profile = ?';
            queryParams.push(profile);
        }

        query += ' WHERE ID = ?';
        queryParams.push(id); // Add the employee ID to the query parameters

        connection.query(query, queryParams, (error, results) => {
            if (error) {
                console.log(error);
                return res.render('../../admin/views/editemployees',
                     { error: 'Update failed, please try again later', success: null, employee:req.body

                      });
            }

            return res.render('../../admin/views/editemployees',
                 { error: null, success: 'Employee updated successfully!', employee: req.body });
        });
    } catch (error) {
        console.log(error);
        return res.render('../../admin/views/editemployees',
             { error: 'Something went wrong, please try again later', success: null });
    }
});

//Admin Delete Logic
router.post('/admin/delete/employee/:id', (req, res)=>{
    const id = req.params.id;
    const deleteQuery = 'DELETE FROM employees WHERE ID = ?'

    connection.query(deleteQuery, [id], (error, results)=>{
        if (error) {
            console.log(error);
            return res.render('../../admin/views/employees',
                 {error:'Failed to delete this record, please try again later', success:null})
        }

        res.redirect('/employees/admin/view/employees')
    })
})
// End of Admin edit, add, delete employes

router.get('/admin/view/admins', (req, res)=>{

    if (!req.session.admin) {
        return res.redirect('/employees/admin/login')
    }

    const searchQuery = req.query.search || ''

    let query = 'SELECT * FROM admins'
    let queryparams = []

    if (searchQuery) {
        query += ' WHERE email LIKE ? '
        queryparams = [`%${searchQuery}%`]
    }

    connection.query(query, queryparams, (error, results)=>{
        if (error) {
            console.log(error);
            return res.render('../../admin/views/admins', 
                {error:'Search failed try again later', 
                    admin:[], searchQuery:searchQuery, succcess:null})
        }

        if (results.length > 0) {
            return res.render('../../admin/views/admins', 
                {admin:results, searchQuery:searchQuery, error:null, success:null})
        } else {
            return res.render('../../admin/views/admins', 
                {error:'The email does not exists', success:null, searchQuery:[], admin:[]})
        }
  })

})

// Logout function
router.get('/logout', (req, res)=>{
    req.session.destroy((err)=>{
        if (err) {
            console.log(err);
            res.status(500).send("Error Login out")
        }

        res.redirect('/employees/login')
    })
})

module.exports = {router}