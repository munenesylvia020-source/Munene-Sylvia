

import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// import './src/pages/signup.jsx'
// import Signup from './pages/signup.jsx'
import './App.css'
import Login from './pages/login.jsx'
import { Link } from 'react-router-dom';


function App() {
  return(
    <>
    <div className="login">
      <form id="form">
        <h2>Welcome back</h2>
        <p>login to manage your budget</p>
        <label for ="email">Email</label>
        <input type="email" id="email" placeholder="Enter your email" required></input><br></br>
        <label for ="password">Password</label>
        <input type="password" id="password" placeholder="Enter your password" required></input>
        <br></br><br></br>
        <button type="submit">Login</button>


      </form>
      <br></br>
      <p>
        Don't have an account?<a href=''>Sign Up</a>
        </p>
    </div>
    </>
  )
}


export default App
