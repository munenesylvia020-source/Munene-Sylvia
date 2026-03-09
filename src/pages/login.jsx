import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

function Login() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = (e)=>{
    e.preventDefault();
    console.log("Login",email,password);
  }

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h1 className="app-title">Penny Professor</h1>
        <p className="subtitle">Login to manage your budget.</p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="student@email.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />
          </div>

          <button className="primary-btn">Log In</button>

          <p className="switch-text">
            Don't have an account?
            <Link to="/signup"> Sign Up</Link>
          </p>

        </form>

      </div>

    </div>
  )
}

export default Login;
