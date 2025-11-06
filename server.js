


const express = require('express');
const cors = require('cors');
require('dotenv').config();
const dbPool = require('./db.js'); // Import the connection pool

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Library Management System API!' });
});

// === UNIT 2: DML (SELECT) & JOINS ===

// GET all books
app.get('/books', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM Books ORDER BY title');
    res.json(rows);
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
});

// GET all students
app.get('/students', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM Students ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// GET all issued books (Demonstrates INNER JOIN)
app.get('/issued-books', async (req, res) => {
  try {
    const query = `
      SELECT 
        ib.issue_id,
        b.title AS book_title,
        s.name AS student_name,
        ib.issue_date,
        ib.due_date,
        ib.return_date
      FROM IssuedBooks ib
      JOIN Books b ON ib.book_id = b.book_id
      JOIN Students s ON ib.student_id = s.student_id
      ORDER BY ib.issue_date DESC
    `;
    const [rows] = await dbPool.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error fetching issued books', error: error.message });
  }
});

// === UNIT 2: DML (INSERT, UPDATE, DELETE) ===

// POST (Create) a new book
app.post('/books', async (req, res) => {
  const { title, author, total_copies, available_copies } = req.body;
  try {
    const [result] = await dbPool.query(
      'INSERT INTO Books (title, author, total_copies, available_copies) VALUES (?, ?, ?, ?)',
      [title, author, total_copies, available_copies]
    );
    res.json({ message: 'Book added successfully', bookId: result.insertId });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error adding book', error: error.message });
  }
});

// POST (Create) a new student
app.post('/students', async (req, res) => {
  const { name, email } = req.body;
  try {
    const [result] = await dbPool.query(
      'INSERT INTO Students (name, email) VALUES (?, ?)',
      [name, email]
    );
    res.json({ message: 'Student added successfully', studentId: result.insertId });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
});

// PUT (Update) a book
app.put('/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, total_copies, available_copies } = req.body;
  try {
    await dbPool.query(
      'UPDATE Books SET title = ?, author = ?, total_copies = ?, available_copies = ? WHERE book_id = ?',
      [title, author, total_copies, available_copies, id]
    );
    res.json({ message: 'Book updated successfully' });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
});

// DELETE a book
app.delete('/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbPool.query('DELETE FROM Books WHERE book_id = ?', [id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error deleting book', error: error.message });
  }
});

// === UNIT 2: AGGREGATE FUNCTIONS ===

app.get('/reports/stats', async (req, res) => {
  try {
    const [bookStats] = await dbPool.query(
      'SELECT COUNT(*) as total_books, SUM(total_copies) as total_copies, SUM(available_copies) as total_available FROM Books'
    );
    const [studentStats] = await dbPool.query(
      'SELECT COUNT(*) as total_students, AVG(total_books_issued) as avg_books_per_student FROM Students'
    );
    const [issuedStats] = await dbPool.query(
      'SELECT COUNT(*) as total_issued, COUNT(CASE WHEN return_date IS NULL THEN 1 END) as currently_issued FROM IssuedBooks'
    );

    res.json({
      books: bookStats[0],
      students: studentStats[0],
      issued: issuedStats[0]
    });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// === UNIT 2: DDL COMMANDS ===
// These are for demonstration. In a real app, you wouldn't typically run DDL from an API.

app.post('/sql/ddl/create', async (req, res) => {
  try {
    await dbPool.query('CREATE TABLE IF NOT EXISTS TestTable (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100))');
    res.json({ message: 'TestTable created successfully' });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error creating table', error: error.message });
  }
});

app.post('/sql/ddl/alter', async (req, res) => {
  try {
    await dbPool.query('ALTER TABLE TestTable ADD COLUMN description TEXT');
    res.json({ message: 'TestTable altered successfully' });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error altering table', error: error.message });
  }
});

app.post('/sql/ddl/drop', async (req, res) => {
  try {
    await dbPool.query('DROP TABLE IF EXISTS TestTable');
    res.json({ message: 'TestTable dropped successfully' });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error dropping table', error: error.message });
  }
});

// === UNIT 4: VIEWS, PROCEDURES, FUNCTIONS, CURSORS ===

// GET from View
app.get('/views/issued', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM V_CurrentlyIssuedBooks');
    res.json(rows);
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error fetching from view', error: error.message });
  }
});

// POST to Stored Procedure (Return Book)
// Note: The trigger T_AfterBookReturn will automatically update counts.
app.post('/procedures/return', async (req, res) => {
  const { issue_id } = req.body;
  try {
    await dbPool.query('CALL SP_ReturnBook(?)', [issue_id]);
    res.json({ message: 'Book returned successfully via SP' });
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error calling SP_ReturnBook', error: error.message });
  }
});

// GET from Function
app.get('/functions/total-issued/:student_id', async (req, res) => {
  const { student_id } = req.params;
  try {
    const [rows] = await dbPool.query('SELECT F_GetTotalIssued(?) AS total_issued', [student_id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error calling F_GetTotalIssued', error: error.message });
  }
});

// GET from Procedure with Cursor (Demo)
app.get('/sql/cursor', async (req, res) => {
  try {
    // This procedure is defined in schema.sql to use a cursor
    const [rows] = await dbPool.query('CALL SP_ListBookTitles()');
    // The result is in the first element of the rows array, and it's an array again.
    res.json(rows[0]); 
  } catch (error) {
    console.error(error); // <-- ADDED THIS
    res.status(500).json({ message: 'Error calling cursor procedure', error: error.message });
  }
});

// === UNIT 5: TRANSACTION MANAGEMENT (COMMIT, ROLLBACK) ===

// POST to issue a book (Demonstrates Transaction)
// This calls a stored procedure that handles the logic,
// but we wrap the *call* in a transaction to demonstrate.
// A more complex transaction would involve multiple steps here.

app.post('/transactions/issue', async (req, res) => {
  const { book_id, student_id } = req.body;
  let connection;

  try {
    // 1. Get a connection from the pool
    connection = await dbPool.getConnection();
    
    // 2. Start the transaction
    await connection.beginTransaction();
    console.log('Transaction started.');

    // 3. Execute the stored procedure
    // The SP already checks for availability, but we could add more checks here.
    // For example, check if student has too many books.
    
    const [studentRows] = await connection.query('SELECT total_books_issued FROM Students WHERE student_id = ?', [student_id]);
    if (studentRows.length === 0) {
      throw new Error('Student not found.');
    }
    if (studentRows[0].total_books_issued >= 5) { // Max 5 books
      throw new Error('Student has reached the maximum limit of 5 books.');
    }

    const [bookRows] = await connection.query('SELECT available_copies FROM Books WHERE book_id = ?', [book_id]);
    if (bookRows.length === 0) {
        throw new Error('Book not found.');
    }
    if (bookRows[0].available_copies <= 0) {
        throw new Error('No available copies of this book.');
    }

    // Call the procedure that does the insert
    await connection.query('CALL SP_IssueBook(?, ?)', [book_id, student_id]);
    console.log('SP_IssueBook called.');

    // 4. If all successful, commit the transaction
    await connection.commit();
    console.log('Transaction committed.');
    res.json({ success: true, message: 'Book issued successfully! (Transaction COMMIT)' });

  } catch (error) {
    console.error(error); // <-- ADDED THIS
    if (connection) {
      await connection.rollback();
      console.log('Transaction rolled back.');
    }
    res.status(500).json({ success: false, message: 'Transaction failed. (ROLLBACK)', error: error.message });
  } finally {
    // 6. Release the connection back to the pool
    if (connection) {
      connection.release();
      console.log('Connection released.');
    }
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});